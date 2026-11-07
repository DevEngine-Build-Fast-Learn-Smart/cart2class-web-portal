import { NextResponse } from "next/server";
import { revokeStudentSession, StudentSessionError } from "@/lib/student-session";

export async function POST(request: Request) {
  try {
    await revokeStudentSession(request);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StudentSessionError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not end this student session." }, { status: 500 });
  }
}

