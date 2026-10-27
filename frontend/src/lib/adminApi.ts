/**
 * Helper to get clean backend base URL without duplicate /api prefixes
 */
export const getAdminApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return envUrl.replace(/\/api\/?$/, "");
};
