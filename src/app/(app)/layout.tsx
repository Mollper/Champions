import { AppShell } from "@/components/app/app-shell";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { requireUserId } from "@/lib/auth";
import { getJourneyState } from "@/lib/data/journey";
import { getAccount, getProfile } from "@/lib/data/profile";
import type { AssistantStyle } from "@/types/models";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const userId = await requireUserId();
  const [account, journey, profile] = await Promise.all([getAccount(userId), getJourneyState(userId), getProfile(userId)]);

  return (
    <>
      <AppShell account={account} journey={journey}>
        {children}
      </AppShell>
      <AssistantWidget initialStyle={(profile?.assistant_style ?? "friendly") as AssistantStyle} name={account.full_name?.split(" ")[0] ?? null} />
    </>
  );
}
