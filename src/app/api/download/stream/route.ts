import { NextResponse } from "next/server";
import { getDownloadToken, removeDownloadToken } from "@/lib/download-tokens";
import { statSync, createReadStream } from "fs";
import { promises as fsp } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const entry = getDownloadToken(token);
  if (!entry) {
    return NextResponse.json({ error: "Token invalid or expired" }, { status: 404 });
  }

  let fileSize = 0;
  try {
    const stats = statSync(entry.filePath);
    fileSize = stats.size;
  } catch {
    removeDownloadToken(token);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(entry.fileName).toLowerCase();
  const mimeType = ext === ".mkv" ? "video/x-matroska" : "video/mp4";

  const stream = createReadStream(entry.filePath);

  const readable = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  const response = new NextResponse(readable, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(entry.fileName)}"`,
      "Content-Length": String(fileSize),
      "Cache-Control": "no-store",
    },
  });

  removeDownloadToken(token);

  stream.on("close", async () => {
    try { await fsp.unlink(entry.filePath); } catch {}
  });

  response.headers.set("X-Accel-Buffering", "no");

  return response;
}
