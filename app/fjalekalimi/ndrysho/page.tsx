import { AccountForm } from "@/components/account-form";
import { requireAccount } from "@/lib/supabase";
export const metadata = { title: "Ndrysho fjalëkalimin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function UpdatePassword({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAccount();
  return <AccountForm mode="update" status={(await searchParams).status} />;
}
