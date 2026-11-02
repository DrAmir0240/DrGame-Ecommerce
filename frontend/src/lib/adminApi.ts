/**
 * Helper to get clean backend base URL without duplicate /api prefixes
 */
export const getAdminApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.gamedr.ir/api";
  return envUrl.replace(/\/api\/?$/, "");
};
