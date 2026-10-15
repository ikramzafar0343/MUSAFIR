import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { RequestContext } from "@/server/http/respond";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteDefinition = {
  readonly method: HttpMethod;
  readonly path: string;
};

export type LoadedRoute = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly pattern: RegExp;
  readonly paramNames: string[];
  readonly handler: (ctx: RequestContext) => Promise<unknown>;
};

function compilePath(routePath: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const source = routePath.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${source}$`), paramNames };
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadApiRoutes(apiRoot: string): Promise<LoadedRoute[]> {
  const files = await walk(apiRoot);
  const routes: LoadedRoute[] = [];
  for (const file of files) {
    const moduleUrl = pathToFileURL(file).href;
    const loaded = (await import(moduleUrl)) as {
      definition?: RouteDefinition;
      handler?: (ctx: RequestContext) => Promise<unknown>;
    };
    if (!loaded.definition || !loaded.handler) {
      continue;
    }
    const compiled = compilePath(loaded.definition.path);
    routes.push({
      method: loaded.definition.method,
      path: loaded.definition.path,
      pattern: compiled.pattern,
      paramNames: compiled.paramNames,
      handler: loaded.handler,
    });
  }
  routes.sort((left, right) => {
    if (left.paramNames.length !== right.paramNames.length) {
      return left.paramNames.length - right.paramNames.length;
    }
    return right.path.length - left.path.length;
  });
  return routes;
}

export function matchRoute(
  routes: readonly LoadedRoute[],
  method: string,
  pathname: string,
): { route: LoadedRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }
    const matched = route.pattern.exec(pathname);
    if (!matched) {
      continue;
    }
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(matched[index + 1] ?? "");
    });
    return { route, params };
  }
  return null;
}
