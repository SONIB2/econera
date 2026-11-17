import { Empty } from "@/components/ui";

export default function NotFound() {
  return <div className="container section"><h1>Faqja nuk u gjet</h1><Empty title="Kthehu te materialet" href="/materiale" label="Hap katalogun">Materiali mund të jetë tërhequr nga katalogu.</Empty></div>;
}
