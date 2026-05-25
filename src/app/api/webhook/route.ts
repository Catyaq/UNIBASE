/** Farcaster mini app webhook (events from host). Extend when you add notifications. */
export async function POST() {
  return Response.json({ ok: true });
}
