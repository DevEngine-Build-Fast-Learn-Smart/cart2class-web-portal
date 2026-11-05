import { NextResponse } from "next/server";

// Keep legacy browser requests from producing a 404 while serving the branded PNG
// favicon declared in the root metadata.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/favicon.png", request.url));
}
