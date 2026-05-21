import crypto from "crypto";
import fs from "fs";
import path from "path";

const SECRET = process.env.JWT_SECRET || "claimease-dev-secret-change-in-prod";

function loadUsers(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const filePath = path.join(process.cwd(), "config", "users.txt");
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const colon = trimmed.indexOf(":");
      if (colon < 1) continue;
      const user = trimmed.slice(0, colon).trim().toUpperCase();
      const pass = trimmed.slice(colon + 1).trim();
      if (user && pass) map.set(user, pass);
    }
  } catch {
    // file missing in dev — fall through with empty map
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
