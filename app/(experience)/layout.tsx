import "../(site)/site.css";
import { Assistant } from "@/components/tools/assistant";

export default function ExperienceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main id="permbajtja" className="theme-dark">{children}<Assistant /></main>;
}
