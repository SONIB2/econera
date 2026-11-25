import { AuthForm } from "@/components/site/auth-form";

export const metadata = { title: "Regjistrohu", robots: { index: false, follow: false } };

export default async function Register({ searchParams }: { searchParams: Promise<{ status?: string; lloji?: string; plani?: string }> }) {
  const { status, lloji, plani } = await searchParams;
  return <AuthForm mode="register" status={status} role={lloji} plan={plani} />;
}
