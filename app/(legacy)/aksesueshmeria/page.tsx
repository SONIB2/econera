import type { Metadata } from "next";
import { PageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "Aksesueshmëria" };
export default function AccessibilityPage() {
  return <div className="container narrow section">
    <PageIntro eyebrow="ECONERA" title="Aksesueshmëria">Synojmë që katalogu dhe inventari të përdoren lehtësisht me tastierë, lexues ekrani dhe pajisje të lëvizshme.</PageIntro>
    <h2>Përdorimi me tastierë</h2><p>Shtyp Tab për të lëvizur midis lidhjeve dhe fushave. Lidhja “Kalo te përmbajtja” shfaqet sapo merr fokus.</p>
    <h2>Preferencat e pajisjes</h2><p>Faqja përshtatet me zmadhimin e tekstit, reduktimin e animacioneve dhe ngjyrat me kontrast të detyruar të sistemit.</p>
  </div>;
}
