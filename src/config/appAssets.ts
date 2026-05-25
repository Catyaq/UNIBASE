/** Set NEXT_PUBLIC_SITE_URL in .env.local or on Vercel after deploy */
function resolveCanonicalSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const isLocal =
    !fromEnv ||
    fromEnv.includes("localhost") ||
    fromEnv.includes("127.0.0.1");

  if (fromEnv && !isLocal) {
    return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    "",
  );
  if (vercelHost) return `https://${vercelHost}`;

  return fromEnv ?? "http://localhost:3000";
}

export const CANONICAL_SITE_URL = resolveCanonicalSiteUrl();

export const APP_ICON_PATH = "/icon.png";
export const APP_SPLASH_PATH = "/splash.png";
export const APP_IMAGE_PATH = "/image.png";
export const APP_HERO_PATH = "/image.png";

export function getSiteOrigin(requestHost?: string | null) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    "",
  );
  if (production) return `https://${production}`;

  if (requestHost) return `https://${requestHost}`;

  return CANONICAL_SITE_URL;
}

export function appAsset(path: string, origin?: string) {
  const base = (origin ?? getSiteOrigin()).replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getAppIconUrl(origin?: string) {
  return appAsset(APP_ICON_PATH, origin);
}

export function getAppSplashUrl(origin?: string) {
  return appAsset(APP_SPLASH_PATH, origin);
}

export function getAppImageUrl(origin?: string) {
  return appAsset(APP_IMAGE_PATH, origin);
}

export function getAppHeroUrl(origin?: string) {
  return appAsset(APP_HERO_PATH, origin);
}
