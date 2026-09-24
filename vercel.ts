import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Run functions next to the Supabase database (ap-northeast-2, Seoul):
  // every page makes several database round trips.
  regions: ["icn1"],
  crons: [
    // finish "add a university" requests and refresh stale AI catalog entries
    { path: "/api/cron/catalog", schedule: "0 4 * * *" },
    // delete sign-ups that never entered the code from the confirmation letter
    { path: "/api/cron/cleanup", schedule: "30 4 * * *" },
  ],
};
// UniRoute · vercel.ts
