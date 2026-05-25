import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import {
  CANONICAL_SITE_URL,
  getAppHeroUrl,
  getAppIconUrl,
  getAppImageUrl,
  getAppSplashUrl,
} from "@/config/appAssets";

/** Farcaster domain verification for unibase-iota.vercel.app */
export const FARCASTER_ACCOUNT_ASSOCIATION = {
  header:
    "eyJmaWQiOjc3NjU4OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEE1MmI2MTEzNTVlREIwRjFlNzFDMTUzMzczOTJmRUY3MzY1YkQ5NjgifQ",
  payload: "eyJkb21haW4iOiJ1bmliYXNlLWlvdGEudmVyY2VsLmFwcCJ9",
  signature:
    "WXl00uzg4hABBhMkRaTldY1T8k/mA3KVylrFRGwnax9IvAZXr91lkTvUTdZ6lmRqEYQjsORg56MW5SAXzXO9Xhw=",
} as const;

export const FARCASTER_BUTTON_TITLE = "Check this out";
export const FARCASTER_SPLASH_BACKGROUND_COLOR = "#eeccff";

function buildMiniappMetadata(origin: string) {
  return {
    version: "1",
    name: APP_NAME,
    homeUrl: origin,
    iconUrl: getAppIconUrl(origin),
    imageUrl: getAppImageUrl(origin),
    heroImageUrl: getAppHeroUrl(origin),
    buttonTitle: FARCASTER_BUTTON_TITLE,
    splashImageUrl: getAppSplashUrl(origin),
    splashBackgroundColor: FARCASTER_SPLASH_BACKGROUND_COLOR,
    webhookUrl: `${origin}/api/webhook`,
    description: APP_DESCRIPTION,
    subtitle: APP_NAME,
    primaryCategory: "social",
    tags: ["base", "miniapp"],
    noindex: true,
  } as const;
}

export function buildFarcasterManifest() {
  const origin = CANONICAL_SITE_URL.replace(/\/$/, "");
  const metadata = buildMiniappMetadata(origin);

  return {
    accountAssociation: FARCASTER_ACCOUNT_ASSOCIATION,
    miniapp: metadata,
    frame: metadata,
  };
}
