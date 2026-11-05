import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth/token";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken, deviceId } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "refreshToken is required" }, { status: 400 });
    }

    const newAccessToken = signToken({
      sub: "student_session",
      role: "student",
      deviceId
    });

    const newRefreshToken = "rt_new_" + crypto.randomBytes(16).toString("hex");

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

