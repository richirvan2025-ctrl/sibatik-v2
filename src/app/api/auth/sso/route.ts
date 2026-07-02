import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BASE_URL = "https://sibatik.idbbali.ac.id";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const sig = searchParams.get("sig");

  if (!token || !sig) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  const hash = crypto.createHmac("sha256", "STDzKey01").update(token).digest("hex");
  if (hash !== sig) {
    return NextResponse.redirect(new URL("/login?error=invalid_sig", BASE_URL));
  }

  // Clear old session cookies before proceeding
  const response = NextResponse.redirect(new URL(`/sso/complete?ssoToken=${token}`, BASE_URL));

  // Clear all possible NextAuth session cookies
  response.cookies.delete("authjs.session-token");
  response.cookies.delete("__Secure-authjs.session-token");
  response.cookies.delete("authjs.callback-url");
  response.cookies.delete("authjs.csrf-token");
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.session-token");
  response.cookies.delete("next-auth.callback-url");
  response.cookies.delete("next-auth.csrf-token");
  response.cookies.delete("helpdesk-session");

  return response;
}
