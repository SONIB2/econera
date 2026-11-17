import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Hyr", robots: { index: false, follow: false } };
export default async function Login({ searchParams }: { searchParams: Promise<{ status?: string; availability?: string; quotation?: string }> }) {
  const { status, availability, quotation } = await searchParams;
  return <AccountForm mode="login" status={status} availability={availability} quotation={quotation} />;
}
