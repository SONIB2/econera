import type { Metadata } from "next";
import { MyProjects } from "@/components/tools/my-projects";
import { ToolHeader } from "@/components/tools/tool-header";
import { tr } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: tr(lang, "Projektet e mia", "My projects"), robots: { index: false } };
}

export default async function ProjectsPage() {
  const lang = await getLang();
  return (
    <>
      <ToolHeader hub="AI Tools" name={tr(lang, "Projektet e mia", "My projects")} title={tr(lang, "Projektet e mia.", "My projects.")}
        lead={tr(lang, "Rinovimet, shportat dhe planet e prerjes që ke ruajtur.", "The renovations, baskets and cutting plans you saved.")} />
      <div className="container-x pb-20"><MyProjects /></div>
    </>
  );
}
