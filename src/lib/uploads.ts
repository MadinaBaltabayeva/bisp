import { existsSync } from "fs";
import { join } from "path";

export const UPLOAD_ROOT = existsSync("/data")
  ? "/data/uploads"
  : join(process.cwd(), "public", "uploads");

export function uploadPath(...parts: string[]): string {
  return join(UPLOAD_ROOT, ...parts);
}
