import crypto from "crypto";
import fs from "fs";
import path from "path";

const SECRET = process.env.JWT_SECRET || "claimease-dev-secret-change-in-prod";

function loadUsers(): Map<string, string> {
  const map = new Map<string, string>();

  // Try ALLOWED_USERS env var first (most reliable on Vercel)
  // Format: "VIJAY:12345,ALICE:pass2"
  const envUsers = process.env.ALLOWED_USERS;
  if (envUsers) {
    for (const entry of envUsers.split(",")) {
      const colon = entry.indexOf(":");
      if (colon < 1) continue;
      map.set(entry.slice(0, colon).trim().toUpperCase(), entry.slice(colon + 1).trim());
    }
    if (map.size > 0) return map;
  }

  // Fall back to config/users.txt (local dev and Vercel if file is bundled)
  const candidates = [
    path.join(process.cwd(), "config", "users.txt"),
    path.join(__dirname, "..", "config", "users.txt"),
    path.join(__dirname, "../../config", "users.txt"),
  ];
  for (const filePath of candidates) {
    try {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const colon = trimmed.indexOf(":");
        if (colon < 1) continue;
        map.set(trimmed.slice(0, colon).trim().toUpperCase(), trimmed.slice(colon + 1).trim());
      }
      if (map.size > 0) return map;
    } catch { /* try next path */ }
  }

  return map;
}

export function signToken(username: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${username.toUpperCase()}:${expiry}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyToken(token?: string): string | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    const colon = payload.lastIndexOf(":");
    const expiry = parseInt(payload.slice(colon + 1), 10);
    if (Date.now() > expiry) return null;
    return payload.slice(0, colon);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const users = loadUsers();
  const key = String(username).toUpperCase();
  const stored = users.get(key);

  if (!stored || stored !== String(password)) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }

  return res.status(200).json({ token: signToken(key) });
}
