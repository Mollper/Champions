import { createClient } from "@supabase/supabase-js";
import { generateUniversityProfile } from "./src/lib/catalog/profile";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const { data } = await sb.from("universities").select("*").eq("slug", process.argv[2]).single();
const t = Date.now();
const { content, model } = await generateUniversityProfile(data as any);
console.log(model, Date.now() - t, "ms");
console.log(JSON.stringify(content, null, 1).slice(0, 3500));
