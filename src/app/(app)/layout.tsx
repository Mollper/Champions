import { AppShell } from "@/components/app/app-shell";
import { requireUserId } from "@/lib/auth";
import { getJourneyState } from "@/lib/data/journey";
import { getAccount } from "@/lib/data/profile";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const userId = await requireUserId();
  const [account, journey] = await Promise.all([getAccount(userId), getJourneyState(userId)]);

  return (
    <AppShell account={account} journey={journey}>
      {children}
    </AppShell>
  );
}
