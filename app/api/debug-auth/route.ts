import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.AUTH_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";

  return NextResponse.json({
    AUTH_URL: process.env.AUTH_URL || "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    calculatedBaseUrl: baseUrl,
    githubCallbackUrl: `${baseUrl}/api/auth/callback/github`,
    googleCallbackUrl: `${baseUrl}/api/auth/callback/google`,
    message: "Add these callback URLs to your OAuth providers",
  });
}
