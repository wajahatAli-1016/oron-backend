/**
 * Base URL of the web app (set-password, login, etc.).
 * Email invite links must point here, not at the API host.
 *
 * Resolution order: FRONTEND_URL → VITE_API_URL (project convention in backend .env).
 */
export function getFrontendBaseUrl(): string {
  const fromEnv = process.env.FRONTEND_URL || process.env.VITE_API_URL;
  return (fromEnv || 'http://localhost:5173').replace(/\/$/, '');
}

export function buildSetPasswordUrl(inviteCode: string): string {
  return `${getFrontendBaseUrl()}/set-password?inviteCode=${encodeURIComponent(inviteCode)}`;
}
