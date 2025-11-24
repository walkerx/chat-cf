import { Context } from "hono";
import { createErrorResponse } from "../utils/errors.js";

/**
 * 通用的Supabase JWT认证中间件
 * 验证请求是否包含有效的Supabase JWT
 */
export async function supabaseAuthMiddleware(c: Context<{ Bindings: CloudflareBindings }>, next: () => Promise<void>) {
  // 从请求头获取Authorization头
  const authHeader = c.req.header("Authorization");

  // 检查Authorization头是否存在且格式正确
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(createErrorResponse("UNAUTHORIZED", "Invalid or missing Authorization header"), 401);
  }

  // TODO: 在生产环境中，需要验证JWT的签名和有效性
  // 可以使用Supabase的公钥或jsonwebtoken库进行验证
  // 这里我们暂时假设JWT是有效的

  // 如果验证通过，继续处理请求
  await next();
  return;
}
