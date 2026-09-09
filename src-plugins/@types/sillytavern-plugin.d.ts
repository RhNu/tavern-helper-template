/**
 * SillyTavern 服务端插件的最小类型定义。
 *
 * 插件模块导出 info / init / exit, 由 SillyTavern 的 plugin loader 动态加载。
 * 这里仅保留插件开发所需的 Express Router/Request/Response 子集, 避免模板强依赖酒馆源码。
 */

/** 插件请求对象 (Express Request 的子集) */
export interface PluginRequest {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, string>;
}

/** 插件响应对象 (Express Response 的子集) */
export interface PluginResponse {
  status(code: number): PluginResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
  sendStatus(code: number): void;
  set(field: string, value: string): PluginResponse;
}

/** 插件路由 (Express Router 的子集) */
export interface PluginRouter {
  get(path: string, handler: (req: PluginRequest, res: PluginResponse) => unknown): void;
  post(path: string, handler: (req: PluginRequest, res: PluginResponse) => unknown): void;
  use(...args: unknown[]): void;
}

export interface PluginInfo {
  id: string;
  name: string;
  description: string;
}

export type PluginInit = (router: PluginRouter) => Promise<void> | void;
export type PluginExit = () => Promise<void> | void;
