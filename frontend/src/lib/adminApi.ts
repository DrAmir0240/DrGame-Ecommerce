/**
 * Helper to get clean backend base URL without duplicate /api prefixes
 */
export const getAdminApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://62.60.191.67:8000/api";
  return envUrl.replace(/\/api\/?$/, "");
};
