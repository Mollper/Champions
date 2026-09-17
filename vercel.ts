import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Run functions next to the Supabase database (ap-northeast-2, Seoul):
  // every page makes several database round trips.
  regions: ["icn1"],
};
