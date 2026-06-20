import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/config/app";
import {
  CANONICAL_SITE_URL,
  getAppHeroUrl,
  getAppIconUrl,
  getAppImageUrl,
  getAppScreenshotUrls,
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

function shouldNoindex(origin: string): boolean {
  if (process.env.FARCASTER_NOINDEX === "1") return true;
  return /localhost|127\.0\.0\.1/.test(origin);
}

function buildMiniappMetadata(origin: string) {
  return {
    version: "1",
    name: APP_NAME,
    homeUrl: origin,
    iconUrl: getAppIconUrl(origin),
    imageUrl: getAppImageUrl(origin),
    heroImageUrl: getAppHeroUrl(origin),
    ogImageUrl: getAppHeroUrl(origin),
    ogTitle: APP_NAME,
    ogDescription: APP_DESCRIPTION,
    screenshotUrls: getAppScreenshotUrls(origin),
    buttonTitle: FARCASTER_BUTTON_TITLE,
    splashImageUrl: getAppSplashUrl(origin),
    splashBackgroundColor: FARCASTER_SPLASH_BACKGROUND_COLOR,
    webhookUrl: `${origin}/api/webhook`,
    description: APP_DESCRIPTION,
    subtitle: APP_NAME,
    tagline: APP_TAGLINE,
    primaryCategory: "social",
    tags: ["base", "miniapp", "gm", "badges"],
    ...(shouldNoindex(origin) ? { noindex: true as const } : {}),
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
