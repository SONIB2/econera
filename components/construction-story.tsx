import Image from "next/image";
import { ArrowDown } from "lucide-react";

const chapters = [
  { id: "fillimi", image: "/story-opening.webp", title: "Një jetë tjetër.", copy: "Një kantier hesht. Një mur mbetet. Çfarë ndodh me materialet kur ndërtesa e tyre nuk është më?", next: "gjurma", action: "Nis udhëtimin" },
  { id: "gjurma", image: "/story-salvage.webp", title: "Çdo pjesë mban një gjurmë.", copy: "Tulla mban shenjat e murit. Druri mban ngjyrën e viteve. Betoni mban vijat e kallëpit.", next: "rindertimi", action: "Ndiq materialet" },
  { id: "rindertimi", image: "/story-rebuild.webp", title: "Çfarë do të ndërtosh?", copy: "Këto pjesë mund të takohen sërish në një vend tjetër. Tani radha është e jotja.", next: "pavijoni", action: "Krijo pavijonin" },
];

export function ConstructionStory() {
  return <div className="construction-story">
    {chapters.map((chapter, index) => <section key={chapter.id} id={chapter.id} className="story-chapter" aria-labelledby={`${chapter.id}-title`}>
      <div className="story-art" aria-hidden="true"><Image src={chapter.image} alt="" fill sizes="100vw" preload={index === 0} /></div>
      <div className="container story-content">
        {index === 0 && <p className="story-kicker">NJË TREGIM NGA ECONERA</p>}
        {index === 0 ? <h1 id={`${chapter.id}-title`}>{chapter.title}</h1> : <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>}
        <p className="story-line">{chapter.copy}</p>
        <a className="story-button" href={`#${chapter.next}`}>{chapter.action} <ArrowDown aria-hidden size={18} /></a>
      </div>
      <nav className="story-steps" aria-label="Kapitujt e tregimit">
        {chapters.map(({ id, title }) => <a key={id} href={`#${id}`} aria-label={title} aria-current={id === chapter.id ? "step" : undefined} />)}
        <a href="#pavijoni" aria-label="Pavijoni yt" />
      </nav>
    </section>)}
  </div>;
}
