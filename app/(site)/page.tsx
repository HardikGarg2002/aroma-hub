import { Hero } from "@/components/home/Hero";
import { NoteMarquee } from "@/components/home/NoteMarquee";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { NotesExplorer } from "@/components/home/NotesExplorer";
import { Bestsellers } from "@/components/home/Bestsellers";
import { Testimonials } from "@/components/home/Testimonials";
import { Editorial } from "@/components/home/Editorial";
import { Newsletter } from "@/components/home/Newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <NoteMarquee />
      <FeaturedCollection />
      {/* Disabled for now. To re-enable the pinned scent story, import
          ScentStory from "@/components/home/ScentStory" and render it here. */}
      <NotesExplorer />
      <Bestsellers />
      <Testimonials />
      <Editorial />
      <Newsletter />
    </>
  );
}
