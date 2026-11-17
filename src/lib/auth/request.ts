// Request details used by sign-in.

/**
 * The visitor's IP address. Behind a hosting proxy (Render, Railway) the real
 * address is the first entry of X-Forwarded-For; confirm the host sets it in Phase 7.
 */
export function clientIp(request: Request, clientAddress: string | undefined): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || clientAddress || 'unknown';
}
