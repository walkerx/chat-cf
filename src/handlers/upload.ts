
import { Context } from "hono";
import { createStandardErrorResponse, createErrorResponse } from "../utils/errors.js";

/**
 * 认证中间件
 * 验证请求是否包含有效的Supabase JWT
 */
export async function authMiddleware(c: Context<{ Bindings: CloudflareBindings }>, next: () => Promise<void>) {
  // 从请求头获取Authorization头
  const authHeader = c.req.header("Authorization");

  // 检查Authorization头是否存在且格式正确
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(createErrorResponse("UNAUTHORIZED", "Invalid or missing Authorization header"), 401);
  }

  // 如果验证通过，继续处理请求
  await next();
  return;
}

export async function handleUpload(c: Context<{ Bindings: CloudflareBindings }>) {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || !(file instanceof File)) {
            return c.json(createErrorResponse("INVALID_REQUEST", "No file uploaded"), 400);
        }

        // 文件类型限制
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return c.json(createErrorResponse("INVALID_REQUEST", `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), 400);
        }

        // 文件大小限制 (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return c.json(createErrorResponse("INVALID_REQUEST", `File size too large. Max size is ${maxSize / (1024 * 1024)}MB.`), 400);
        }

        // Generate a unique key
        const extension = file.type.split('/')[1];
        const key = `${crypto.randomUUID()}.${extension}`;

        // Upload to R2
        await c.env.AVATAR_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Return the URL
        // Since we are serving via worker, the URL will be /api/avatars/:key
        const url = `/api/avatars/${key}`;

        return c.json({
            url,
            key,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return c.json(createStandardErrorResponse("INTERNAL_ERROR"), 500);
    }
}

export async function handleGetAvatar(c: Context<{ Bindings: CloudflareBindings }>) {
    const key = c.req.param("key");

    if (!key) {
        return c.json(createErrorResponse("INVALID_REQUEST", "Missing key"), 400);
    }

    try {
        const object = await c.env.AVATAR_BUCKET.get(key);

        if (!object) {
            return c.json(createStandardErrorResponse("NOT_FOUND"), 404);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        // 设置缓存头，让图片被CDN和浏览器缓存
        // 缓存时间：1个月（2592000秒）
        headers.set("Cache-Control", "public, max-age=2592000, immutable");

        return new Response(object.body, {
            headers,
        });
    } catch (error) {
        console.error("Get avatar error:", error);
        return c.json(createStandardErrorResponse("INTERNAL_ERROR"), 500);
    }
}
