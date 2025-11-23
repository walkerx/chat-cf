
import { Context } from "hono";
import { createStandardErrorResponse, createErrorResponse } from "../utils/errors.js";

export async function handleUpload(c: Context<{ Bindings: CloudflareBindings }>) {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!file || !(file instanceof File)) {
            return c.json(createErrorResponse("INVALID_REQUEST", "No file uploaded"), 400);
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return c.json(createErrorResponse("INVALID_REQUEST", "Invalid file type. Only images are allowed."), 400);
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

        return new Response(object.body, {
            headers,
        });
    } catch (error) {
        console.error("Get avatar error:", error);
        return c.json(createStandardErrorResponse("INTERNAL_ERROR"), 500);
    }
}
