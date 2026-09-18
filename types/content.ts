export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  /** Where they are / what they bought — the small line under the name. */
  context: string;
}

export interface JournalEntry {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  image: string;
}
