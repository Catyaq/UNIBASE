import { NextResponse } from "next/server";

import { buildFarcasterManifest } from "@/config/manifest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(buildFarcasterManifest(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
