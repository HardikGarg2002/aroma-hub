/**
 * Every remote image in the site is declared here and nowhere else.
 *
 * These are Unsplash placeholders. When real product photography arrives,
 * replace the values below (or point `src` at /public paths) and no component
 * needs to change. `next.config.ts` allowlists the Unsplash CDN host.
 */

const CDN = "https://images.unsplash.com";

/**
 * Build a source URL. next/image re-optimizes and resizes from here, so the
 * source only needs to be a little larger than the biggest rendered size —
 * asking for more just costs fetch and decode time on a cold load.
 */
function u(id: string, w = 900): string {
  return `${CDN}/${id}?auto=format&fit=crop&w=${w}&q=80`;
}

/**
 * A 1x1 bone-toned JPEG, used as the blur placeholder everywhere so images
 * fade up out of the page colour instead of flashing white.
 */
export const BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERMSGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXJkZmL/2wBDARESEhgVGC8aGi9iQjhCYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmL/wgALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAABAX/2gAIAQEAAD8AVdABmX//2Q==";

/** Product shots — each product gets a primary and a hover-state second angle. */
export const PRODUCT_IMAGES = {
  velvetRose: { src: u("photo-1458538977777-0549b2370168"), hover: u("photo-1543422655-ac1c6ca993ed") },
  blushOud: { src: u("photo-1613521140785-e85e427f8002"), hover: u("photo-1585218356022-6a53145f56f6") },
  ambreLumiere: { src: u("photo-1733660227163-01bc46e0d7d7"), hover: u("photo-1622618991746-fe6004db3a47") },
  goldenHour: { src: u("photo-1638295916768-459f6cf440bc"), hover: u("photo-1676950933747-5f886cadf014") },
  cedarSmoke: { src: u("photo-1656746678868-579bf6d7868d"), hover: u("photo-1676951334972-2e65e67f4cbe") },
  paleDrift: { src: u("photo-1705899853374-d91c048b81d2"), hover: u("photo-1594125311687-3b1b3eafa9f4") },
  citrusVeil: { src: u("photo-1588482587611-692b19ee797b"), hover: u("photo-1597317628840-d3472f7aa7fc") },
  saltAir: { src: u("photo-1597317628840-d3472f7aa7fc"), hover: u("photo-1615160460366-2c9a41771b51") },
  nocturne: { src: u("photo-1598634222670-87c5f558119c"), hover: u("photo-1553699357-fdefb876c402") },
  fleurBlanche: { src: u("photo-1543422655-ac1c6ca993ed"), hover: u("photo-1613521076081-2820f9746a2d") },
  resinNoir: { src: u("photo-1676951334972-2e65e67f4cbe"), hover: u("photo-1656746678868-579bf6d7868d") },
  lumenSuede: { src: u("photo-1622618991746-fe6004db3a47"), hover: u("photo-1733660227163-01bc46e0d7d7") },
} as const;

/** Editorial, hero and storytelling imagery. */
export const SITE_IMAGES = {
  /** Hero — tall portrait bottle on cream silk. */
  heroPrimary: u("photo-1733660227163-01bc46e0d7d7", 1600),
  /** Hero — small inset detail that parallaxes against the primary. */
  heroDetail: u("photo-1714682597753-a646ba506cee", 900),

  /** Scent story chapters: top / heart / base notes. */
  storyTop: u("photo-1614378719646-ce1c2961b91c", 1600),
  storyHeart: u("photo-1604304194650-3ba3cfa752fd", 1600),
  storyBase: u("photo-1506689205310-0a29c388691c", 1600),

  /** Olfactive family backdrops for the notes explorer. */
  familyFloral: u("photo-1488825943912-eaf40c38849d", 1200),
  familyWoody: u("photo-1697507695420-04623ccff2af", 1200),
  familyAmber: u("photo-1707569590646-2a51751bb9ef", 1200),
  familyFresh: u("photo-1638303322579-343c8154b80e", 1200),

  /** Journal entries. */
  journalLayering: u("photo-1579101403207-44ff78d923f8", 1200),
  journalMaking: u("photo-1718466044521-d38654f3ba0a", 1200),
  journalNotes: u("photo-1777566131335-c9b37dcbcdbd", 1200),

  /** Wide band behind the newsletter block. */
  newsletter: u("photo-1714682597753-a646ba506cee", 1800),
} as const;

/**
 * Whether next/image may optimize this URL, i.e. its host is allowlisted in
 * next.config.ts. Admin-entered URLs can point anywhere; render those with
 * `unoptimized` instead of letting next/image throw.
 */
export const canOptimize = (src: string) => src.startsWith(`${CDN}/`);
