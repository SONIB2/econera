import { AccountForm } from "@/components/account-form";
export const metadata = { title: "Regjistrohu", robots: { index: false, follow: false } };
export default async function Register({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return <AccountForm mode="register" status={(await searchParams).status} />;
}
