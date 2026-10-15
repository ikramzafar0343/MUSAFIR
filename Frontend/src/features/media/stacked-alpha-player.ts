"use client";

import { type RefObject, useEffect, useState } from "react";

/*
 * Plays a stacked-alpha MP4 (colour in the top half, matte in the bottom half) into a
 * canvas. The video decodes on the hardware decoder and a WebGL shader recombines the
 * halves, so a transparent cutout costs no per-frame CPU work, including on iOS Safari,
 * which has no video format with an alpha channel.
 */

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Rows are clamped to texel centres inside each half so filtering never reads across the seam.
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_frame;
uniform vec2 u_colorRows;
uniform vec2 u_alphaRows;
varying vec2 v_uv;
void main() {
  float colorV = clamp(0.5 + v_uv.y * 0.5, u_colorRows.x, u_colorRows.y);
  float alphaV = clamp(v_uv.y * 0.5, u_alphaRows.x, u_alphaRows.y);
  vec3 color = texture2D(u_frame, vec2(v_uv.x, colorV)).rgb;
  float alpha = texture2D(u_frame, vec2(v_uv.x, alphaV)).g;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

const GESTURES = ["pointerdown", "touchstart", "keydown"] as const;

type GlResources = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  colorRows: WebGLUniformLocation;
  alphaRows: WebGLUniformLocation;
};

type FrameCallbackVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createResources(gl: WebGLRenderingContext): GlResources | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const colorRows = gl.getUniformLocation(program, "u_colorRows");
  const alphaRows = gl.getUniformLocation(program, "u_alphaRows");
  const position = gl.getAttribLocation(program, "a_position");
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) || !buffer || !texture || !colorRows || !alphaRows || position < 0) {
    gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    if (texture) gl.deleteTexture(texture);
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(program, "u_frame"), 0);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  return { program, buffer, texture, colorRows, alphaRows };
}

export type StackedAlphaPlayerOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  /** Playback pauses while this element is off screen. */
  viewport: Element;
  src: string;
  onFirstFrame: () => void;
  onUnavailable: () => void;
};

/** Starts playback into the canvas; returns a cleanup function. */
export function attachStackedAlphaPlayer(options: StackedAlphaPlayerOptions): () => void {
  const { canvas, viewport, src } = options;
  const video = options.video as FrameCallbackVideo;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  let resources = gl && !gl.isContextLost() ? createResources(gl) : null;
  if (!gl || (!resources && !gl.isContextLost())) {
    options.onUnavailable();
    return () => undefined;
  }

  let disposed = false;
  let onScreen = true;
  let pageVisible = !document.hidden;
  let firstFrameShown = false;
  let waitingForGesture = false;
  let frameHandle = 0;
  let frameKind: "video" | "animation" | null = null;
  let lastDrawnTime = -1;

  const draw = () => {
    if (!resources || gl.isContextLost() || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const width = video.videoWidth;
    const fullHeight = video.videoHeight;
    const height = Math.floor(fullHeight / 2);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    const halfTexel = 0.5 / fullHeight;
    gl.uniform2f(resources.colorRows, 0.5 + halfTexel, 1 - halfTexel);
    gl.uniform2f(resources.alphaRows, halfTexel, 0.5 - halfTexel);
    gl.bindTexture(gl.TEXTURE_2D, resources.texture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    } catch {
      options.onUnavailable();
      return;
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    lastDrawnTime = video.currentTime;
    if (!firstFrameShown) {
      firstFrameShown = true;
      options.onFirstFrame();
    }
  };

  const cancelFrame = () => {
    if (frameKind === "video") video.cancelVideoFrameCallback?.(frameHandle);
    if (frameKind === "animation") window.cancelAnimationFrame(frameHandle);
    frameKind = null;
  };

  const scheduleFrame = () => {
    if (disposed || frameKind || video.paused) return;
    if (video.requestVideoFrameCallback) {
      frameKind = "video";
      frameHandle = video.requestVideoFrameCallback(() => {
        frameKind = null;
        draw();
        scheduleFrame();
      });
      return;
    }
    frameKind = "animation";
    frameHandle = window.requestAnimationFrame(() => {
      frameKind = null;
      if (video.currentTime !== lastDrawnTime) draw();
      scheduleFrame();
    });
  };

  const stopWaitingForGesture = () => {
    if (!waitingForGesture) return;
    waitingForGesture = false;
    for (const type of GESTURES) window.removeEventListener(type, onGesture, true);
  };

  const sync = () => {
    if (disposed) return;
    if (!onScreen || !pageVisible) {
      if (!video.paused) video.pause();
      return;
    }
    if (!video.paused) return;
    video.play().catch((error: unknown) => {
      // Autoplay refused (iOS Low Power Mode, data saver): the poster stays until a tap.
      if (!disposed && error instanceof DOMException && error.name === "NotAllowedError" && !waitingForGesture) {
        waitingForGesture = true;
        for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true });
      }
    });
  };

  function onGesture() {
    stopWaitingForGesture();
    sync();
  }

  const onLoaded = () => {
    draw();
    sync();
  };
  const onPlay = () => scheduleFrame();
  const onPause = () => cancelFrame();
  const onError = () => options.onUnavailable();
  const onVisibility = () => {
    pageVisible = !document.hidden;
    sync();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    cancelFrame();
    resources = null;
  };
  const onContextRestored = () => {
    resources = createResources(gl);
    draw();
    scheduleFrame();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    },
    { rootMargin: "160px 0px" },
  );

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("loadeddata", onLoaded);
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("error", onError);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  observer.observe(viewport);
  if (video.getAttribute("src") !== src) {
    video.src = src;
  } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    onLoaded();
  }

  return () => {
    disposed = true;
    cancelFrame();
    stopWaitingForGesture();
    observer.disconnect();
    video.removeEventListener("loadeddata", onLoaded);
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("error", onError);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    video.pause();
    // The context belongs to the canvas and is reused if this effect runs again.
    if (resources && !gl.isContextLost()) {
      gl.deleteTexture(resources.texture);
      gl.deleteBuffer(resources.buffer);
      gl.deleteProgram(resources.program);
    }
    resources = null;
  };
}

export type StackedAlphaSources = {
  src: string;
  /** Lighter render for phone-sized screens and data saver. */
  mobileSrc?: string;
};

function chooseSource({ src, mobileSrc }: StackedAlphaSources): string {
  if (!mobileSrc) return src;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return window.matchMedia("(max-width: 767px)").matches || connection?.saveData ? mobileSrc : src;
}

/**
 * Runs the player on the given elements. `live` turns true once the first frame is on the
 * canvas; it stays false (poster only) for reduced motion or when WebGL/video fails.
 */
export function useStackedAlphaPlayer(
  sources: StackedAlphaSources | null,
  refs: {
    video: RefObject<HTMLVideoElement | null>;
    canvas: RefObject<HTMLCanvasElement | null>;
    viewport: RefObject<Element | null>;
  },
): boolean {
  const [live, setLive] = useState(false);
  const src = sources?.src ?? "";
  const mobileSrc = sources?.mobileSrc ?? "";

  useEffect(() => {
    const video = refs.video.current;
    const canvas = refs.canvas.current;
    const viewport = refs.viewport.current;
    if (!src || !video || !canvas || !viewport) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return attachStackedAlphaPlayer({
      video,
      canvas,
      viewport,
      src: chooseSource({ src, mobileSrc }),
      onFirstFrame: () => setLive(true),
      onUnavailable: () => setLive(false),
    });
  }, [src, mobileSrc, refs.video, refs.canvas, refs.viewport]);

  return live;
}
