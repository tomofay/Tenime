import crypto from "crypto";
import { unlinkSync } from "fs";

interface TokenEntry {
  filePath: string;
  fileName: string;
  expiresAt: number;
}

const tokens = new Map<string, TokenEntry>();
const TOKEN_TTL = 10 * 60 * 1000;

function cleanupTokens() {
  const now = Date.now();
  for (const [token, entry] of tokens) {
    if (entry.expiresAt < now) {
      try { unlinkSync(entry.filePath); } catch {}
      tokens.delete(token);
    }
  }
}

export function createDownloadToken(filePath: string, fileName: string): string {
  cleanupTokens();
  const token = crypto.randomUUID();
  tokens.set(token, {
    filePath,
    fileName,
    expiresAt: Date.now() + TOKEN_TTL,
  });
  return token;
}

export function getDownloadToken(token: string): TokenEntry | null {
  cleanupTokens();
  const entry = tokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry;
}

export function removeDownloadToken(token: string): TokenEntry | undefined {
  const entry = tokens.get(token);
  tokens.delete(token);
  return entry;
}
