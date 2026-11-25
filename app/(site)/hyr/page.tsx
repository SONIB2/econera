import { AuthForm } from "@/components/site/auth-form";

export const metadata = { title: "Hyr", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ status?: string; availability?: string; quotation?: string; lloji?: string }> }) {
  const { status, availability, quotation, lloji } = await searchParams;
  return <AuthForm mode="login" role={lloji} status={status} availability={availability} quotation={quotation} />;
}
