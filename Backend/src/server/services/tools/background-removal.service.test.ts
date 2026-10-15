import assert from "node:assert/strict";
import { describe, it } from "node:test";

import sharp from "sharp";

import { AppError } from "@/lib/app-error";
import { BackgroundRemovalService } from "@/server/services/tools/background-removal.service";
import type {
  BackgroundRemovalInput,
  BackgroundRemovalProvider,
  BackgroundRemovalResult,
} from "@/server/services/tools/background-removal.types";

async function opaqueJpeg(): Promise<{ buffer: Buffer; base64: string }> {
  const buffer = await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 3,
      background: { r: 200, g: 40, b: 40 },
    },
  })
    .jpeg()
    .toBuffer();
  return { buffer, base64: buffer.toString("base64") };
}

async function transparentPng(width = 32, height = 32): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const inSubject = x >= 8 && x < 24 && y >= 8 && y < 24;
      raw[i] = 40;
      raw[i + 1] = 120;
      raw[i + 2] = 200;
      raw[i + 3] = inSubject ? 255 : 0;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function opaquePng(): Promise<Buffer> {
  return sharp({
    create: {
      width: 16,
      height: 16,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .png()
    .toBuffer();
}

class MockProvider implements BackgroundRemovalProvider {
  readonly id = "mock";
  result: BackgroundRemovalResult | null = null;
  error: Error | null = null;
  calls = 0;

  async removeBackground(_input: BackgroundRemovalInput): Promise<BackgroundRemovalResult> {
    this.calls += 1;
    if (this.error) {
      throw this.error;
    }
    if (!this.result) {
      throw new Error("Mock provider not configured");
    }
    return this.result;
  }
}

describe("BackgroundRemovalService", () => {
  it("returns base64 PNG with alpha from mocked provider", async () => {
    const png = await transparentPng();
    const mock = new MockProvider();
    mock.result = { png, width: 32, height: 32, provider: "mock" };
    const service = new BackgroundRemovalService(mock);
    const { base64 } = await opaqueJpeg();

    const out = await service.remove({ mimeType: "image/jpeg", data: base64 });
    assert.equal(out.provider, "mock");
    assert.equal(out.width, 32);
    assert.equal(out.height, 32);
    assert.equal(mock.calls, 1);

    const decoded = Buffer.from(out.pngBase64, "base64");
    const meta = await sharp(decoded).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.hasAlpha, true);
  });

  it("rejects empty payload", async () => {
    const service = new BackgroundRemovalService(new MockProvider());
    await assert.rejects(
      () => service.remove({ mimeType: "image/png", data: "" }),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });

  it("rejects unsupported mime type", async () => {
    const service = new BackgroundRemovalService(new MockProvider());
    await assert.rejects(
      () => service.remove({ mimeType: "image/gif", data: Buffer.from("x").toString("base64") }),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });

  it("rejects corrupt image bytes", async () => {
    const service = new BackgroundRemovalService(new MockProvider());
    await assert.rejects(
      () => service.remove({ mimeType: "image/png", data: Buffer.from("not-an-image").toString("base64") }),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });

  it("rejects oversized payload", async () => {
    const mock = new MockProvider();
    const service = new BackgroundRemovalService(mock);
    const huge = Buffer.alloc(13 * 1024 * 1024, 1).toString("base64");
    await assert.rejects(
      () => service.remove({ mimeType: "image/jpeg", data: huge }),
      (error: unknown) => error instanceof AppError && error.statusCode === 413,
    );
    assert.equal(mock.calls, 0);
  });

  it("fails honestly when provider returns opaque PNG", async () => {
    const png = await opaquePng();
    const mock = new MockProvider();
    mock.result = { png, width: 16, height: 16, provider: "mock" };
    const service = new BackgroundRemovalService(mock);
    const { base64 } = await opaqueJpeg();

    await assert.rejects(
      () => service.remove({ mimeType: "image/jpeg", data: base64 }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 422 &&
        /flat opaque|alpha/i.test(error.message),
    );
  });

  it("surfaces provider errors as unprocessable", async () => {
    const mock = new MockProvider();
    mock.error = new Error("model crashed");
    const service = new BackgroundRemovalService(mock);
    const { base64 } = await opaqueJpeg();

    await assert.rejects(
      () => service.remove({ mimeType: "image/jpeg", data: base64 }),
      (error: unknown) =>
        error instanceof AppError && error.statusCode === 422 && /model crashed/.test(error.message),
    );
  });
});
