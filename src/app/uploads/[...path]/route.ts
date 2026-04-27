import { readFile } from "fs/promises";
import { join, normalize, sep } from "path";
import { UPLOAD_ROOT } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const safe = normalize(path.join(sep));
  if (safe.startsWith("..") || safe.includes(`..${sep}`)) {
    return new Response("Bad path", { status: 400 });
  }

  try {
    const data = await readFile(join(UPLOAD_ROOT, safe));
    const ext = safe.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
