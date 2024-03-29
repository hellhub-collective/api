import path from "path";
import type { Context, Next } from "hono";

const getMimeType = (filename: string) => {
  const mimes = {
    aac: "audio/aac",
    avi: "video/x-msvideo",
    avif: "image/avif",
    av1: "video/av1",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    css: "text/css",
    csv: "text/csv",
    eot: "application/vnd.ms-fontobject",
    epub: "application/epub+zip",
    gif: "image/gif",
    gz: "application/gzip",
    htm: "text/html",
    html: "text/html",
    ico: "image/x-icon",
    ics: "text/calendar",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript",
    json: "application/json",
    jsonld: "application/ld+json",
    map: "application/json",
    mid: "audio/x-midi",
    midi: "audio/x-midi",
    mjs: "text/javascript",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    oga: "audio/ogg",
    ogv: "video/ogg",
    ogx: "application/ogg",
    opus: "audio/opus",
    otf: "font/otf",
    pdf: "application/pdf",
    png: "image/png",
    rtf: "application/rtf",
    svg: "image/svg+xml",
    tif: "image/tiff",
    tiff: "image/tiff",
    ts: "video/mp2t",
    ttf: "font/ttf",
    txt: "text/plain",
    wasm: "application/wasm",
    webm: "video/webm",
    weba: "audio/webm",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    xhtml: "application/xhtml+xml",
    xml: "application/xml",
    zip: "application/zip",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    gltf: "model/gltf+json",
    glb: "model/gltf-binary",
  };

  const regexp = /\.([a-zA-Z0-9]+?)$/;
  const match = filename.match(regexp);
  if (!match) return;
  let mimeType = mimes[match[1] as keyof typeof mimes];
  if (
    (mimeType && mimeType.startsWith("text")) ||
    mimeType === "application/json"
  ) {
    mimeType += "; charset=utf-8";
  }
  return mimeType;
};

export default async function files(ctx: Context, next: Next) {
  try {
    const _ctx = {
      ...ctx,
      req: { ...ctx.req, url: ctx.req.url.replace("/api", "") },
    };

    const { pathname } = new URL(_ctx.req.url);
    if (!pathname.startsWith("/static/")) await next();

    const file = Bun.file(path.join(process.cwd(), "src", pathname));
    if (!file) await next();

    const mimeType = getMimeType(`..${pathname}`);
    if (!mimeType) return await next();

    const content = await file.arrayBuffer();
    return ctx.newResponse(content, 200, { "Content-Type": mimeType });
  } catch (error: any) {
    console.error(error);
    return ctx.newResponse("Not Found", 404);
  }
}
