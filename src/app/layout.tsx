import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { APP_DESCRIPTION } from "@/config/app";
import { APP_ICON_PATH, APP_IMAGE_PATH, CANONICAL_SITE_URL } from "@/config/appAssets";
import { buildFcMiniAppEmbed, FARCASTER_APP_NAME } from "@/config/farcaster";
import { getConfig } from "@/config/wagmi";
import { ProvidersShell } from "./providers-loader";
import "./globals.css";

const siteUrl = CANONICAL_SITE_URL;

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fcMiniAppEmbed = JSON.stringify(buildFcMiniAppEmbed(siteUrl));

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: FARCASTER_APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: APP_ICON_PATH, type: "image/svg+xml" }],
  },
  openGraph: {
    title: FARCASTER_APP_NAME,
    description: APP_DESCRIPTION,
    images: [{ url: APP_IMAGE_PATH, width: 1200, height: 628 }],
  },
  other: {
    "fc:miniapp": fcMiniAppEmbed,
    "fc:frame": fcMiniAppEmbed,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const initialState = cookieToInitialState(getConfig(), cookieHeader);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href={APP_ICON_PATH} type="image/svg+xml" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ProvidersShell initialState={initialState}>{children}</ProvidersShell>
      </body>
    </html>
  );
}
