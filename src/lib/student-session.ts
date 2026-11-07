import crypto from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export class StudentSessionError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
  }
}

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/** The QR reference is not a credential; only its opaque token is accepted. */
export function readQrToken(value: unknown, expectedHost: string) {
  if (typeof value !== "string" || value.length > 2048) {
    throw new StudentSessionError("A valid Cart2Class code is required.", 400);
  }
  if (value.startsWith("c2c.") || value.startsWith("c2c-")) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "cart2class:" || url.hostname !== expectedHost) throw new Error();
    const token = url.searchParams.get("token");
    if (!token?.startsWith("c2c.") && !token?.startsWith("c2c-")) throw new Error();
    return token;
  } catch {
    throw new StudentSessionError("This is not a valid Cart2Class code.", 400);
  }
}

export function bearerToken(request: Request) {
  const value = request.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) throw new StudentSessionError("A student session is required.");
  const token = value.slice("Bearer ".length).trim();
  if (!token.startsWith("c2c.ds.")) throw new StudentSessionError("The student session is invalid.");
  return token;
}

export async function requireStudentSession(request: Request) {
  const sessionToken = bearerToken(request);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("student_device_sessions")
    .select("id,student_id,expires_at,revoked_at")
    .eq("session_token_hash", hash(sessionToken))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) throw new StudentSessionError("The student session is invalid or expired.");
  return { supabase, sessionToken, session: data };
}

export async function revokeStudentSession(request: Request) {
  const { supabase, session, sessionToken } = await requireStudentSession(request);
  const { error } = await supabase
    .from("student_device_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", session.id)
    .eq("session_token_hash", hash(sessionToken));
  if (error) throw new StudentSessionError("Could not end this student session.", 500);
}

export const studentSessionHash = hash;
