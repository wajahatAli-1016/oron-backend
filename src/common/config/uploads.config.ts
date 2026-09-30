export const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 300;

export const getUploadsSignedUrlExpirySeconds = (): number => {
  const raw = process.env.UPLOADS_SIGNED_URL_EXPIRY;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SIGNED_URL_EXPIRY_SECONDS;
};

