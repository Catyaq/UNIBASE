import { APP_DESCRIPTION, APP_NAME } from "@/config/app";
import {
  CANONICAL_SITE_URL,
  getAppHeroUrl,
  getAppIconUrl,
  getAppImageUrl,
  getAppSplashUrl,
} from "@/config/appAssets";

/** Fill after Farcaster domain verification */
export const FARCASTER_ACCOUNT_ASSOCIATION = {
  header: "",
  payload: "",
  signature: "",
} as const;

function buildMiniappMetadata(origin: string) {
  return {
    version: "1",
    name: APP_NAME,
    homeUrl: origin,
    iconUrl: getAppIconUrl(origin),
    imageUrl: getAppImageUrl(origin),
    heroImageUrl: getAppHeroUrl(origin),
    buttonTitle: "Open",
    splashImageUrl: getAppSplashUrl(origin),
    splashBackgroundColor: "#131313",
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
