import {
  APP_NAME,
  FARCASTER_DESCRIPTION,
  FARCASTER_SUBTITLE,
} from "@/config/app";
import {
  CANONICAL_SITE_URL,
  getAppHeroUrl,
  getAppIconUrl,
  getAppScreenshotUrls,
  getAppSplashUrl,
  getAppThumbnailUrl,
} from "@/config/appAssets";

/** Domain verified at https://farcaster.xyz/~/developers/mini-apps/manifest */
export const FARCASTER_ACCOUNT_ASSOCIATION: {
  header: string;
  payload: string;
  signature: string;
} = {
  header:
    "eyJmaWQiOjc3NjU4OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEE1MmI2MTEzNTVlREIwRjFlNzFDMTUzMzczOTJmRUY3MzY1YkQ5NjgifQ",
  payload: "eyJkb21haW4iOiJ1bmliYXNlLWlvdGEudmVyY2VsLmFwcCJ9",
  signature:
    "WXl00uzg4hABBhMkRaTldY1T8k/mA3KVylrFRGwnax9IvAZXr91lkTvUTdZ6lmRqEYQjsORg56MW5SAXzXO9Xhw=",
};

export const FARCASTER_BUTTON_TITLE = "Open app";
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
    imageUrl: getAppThumbnailUrl(origin),
    heroImageUrl: getAppHeroUrl(origin),
    screenshotUrls: getAppScreenshotUrls(origin),
    buttonTitle: FARCASTER_BUTTON_TITLE,
    splashImageUrl: getAppSplashUrl(origin),
    splashBackgroundColor: FARCASTER_SPLASH_BACKGROUND_COLOR,
    webhookUrl: `${origin}/api/webhook`,
    description: FARCASTER_DESCRIPTION,
    subtitle: FARCASTER_SUBTITLE,
    primaryCategory: "social",
    tags: ["base", "miniapp"],
    requiredChains: ["eip155:8453"],
    ...(shouldNoindex(origin) ? { noindex: true as const } : {}),
  } as const;
}

export function buildFarcasterManifest() {
  const origin = CANONICAL_SITE_URL.replace(/\/$/, "");
  const association = FARCASTER_ACCOUNT_ASSOCIATION;
  const hasAssociation =
    association.header && association.payload && association.signature;

  return {
    ...(hasAssociation ? { accountAssociation: association } : {}),
    frame: buildMiniappMetadata(origin),
    miniapp: buildMiniappMetadata(origin),
  };
}
