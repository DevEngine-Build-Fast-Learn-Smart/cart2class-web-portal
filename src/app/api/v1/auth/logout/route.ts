import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    return NextResponse.json({ loggedOut: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

