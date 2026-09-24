import { AppShell } from "@/components/app/app-shell";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { requireUserId } from "@/lib/auth";
import { getJourneyState } from "@/lib/data/journey";
import { getProfile } from "@/lib/data/profile";
import { toAssistantStyle } from "@/lib/constants";
import { getAccountWithRole } from "@/lib/roles";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const userId = await requireUserId();
  const [account, journey, profile] = await Promise.all([getAccountWithRole(userId), getJourneyState(userId), getProfile(userId)]);

  return (
    <>
      <AppShell account={account} journey={journey}>
        {children}
      </AppShell>
      {/* Юни knows the student's questionnaire and roadmap; mentors and admins work with people instead */}
      {account.role === "student" && <AssistantWidget initialStyle={toAssistantStyle(profile?.assistant_style)} name={account.full_name?.split(" ")[0] ?? null} />}
    </>
  );
}
// UniRoute · src/app/(app)/layout.tsx
