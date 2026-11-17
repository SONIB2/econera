import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Rikthe hyrjen", robots: { index: false, follow: false } };
export default async function Recovery({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return <AccountForm mode="recovery" status={(await searchParams).status} />;
}
