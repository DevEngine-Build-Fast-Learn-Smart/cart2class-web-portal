import crypto from "crypto";

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "cart2class-production-secret-key-32chars!";

export type TokenPayload = {
  sub: string; // user id or student id
  role: "student" | "teacher" | "parent" | "store" | "admin";
  classId?: string;
  name?: string;
  deviceId?: string;
  exp: number;
  iat: number;
};

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">, expiresInSeconds: number = 86400): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: TokenPayload = { ...payload, iat, exp };

  const header = { alg: "HS256", typ: "JWT" };
  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [base64Header, base64Payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
}

