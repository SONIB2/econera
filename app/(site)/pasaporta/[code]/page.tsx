import { notFound, redirect } from "next/navigation";
import { idForPassport } from "@/lib/verify/public";

export default async function Passport({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!/^EC-[A-Z]{2}-\d{6}$/.test(code)) notFound();
  const id = await idForPassport(code);
  if (!id) notFound();
  redirect(`/verifikim/${id}`);
}
