const R = "https://media.rawg.io/media/games";

export type Ownership = "owned" | "not-owned" | "free";

export type Game = {
  slug: string;
  title: string;
  studio: string;
  genreFa: string;
  genreEn: string;
  platforms: ("PS5" | "PS4")[];
  sizeGb: number;
  metacritic: number;
  year: number;
  image: string;
  ownership: Ownership;
};

export const GAMES: Game[] = [
  { slug: "god-of-war", title: "God of War", studio: "Santa Monica Studio", genreFa: "اکشن ماجراجویی", genreEn: "Action-Adventure", platforms: ["PS5", "PS4"], sizeGb: 85.4, metacritic: 94, year: 2018, image: `${R}/4be/4be6a6ad0364751a96229c56bf69be59.jpg`, ownership: "owned" },
  { slug: "horizon-zero-dawn", title: "Horizon Zero Dawn", studio: "Guerrilla Games", genreFa: "نقش‌آفرینی", genreEn: "Action RPG", platforms: ["PS5", "PS4"], sizeGb: 72.6, metacritic: 89, year: 2017, image: `${R}/b7d/b7d3f1715fa8381a4e780173a197a615.jpg`, ownership: "owned" },
  { slug: "red-dead-redemption-2", title: "Red Dead Redemption 2", studio: "Rockstar Games", genreFa: "جهان باز", genreEn: "Open World", platforms: ["PS4"], sizeGb: 120.4, metacritic: 97, year: 2018, image: `${R}/511/5118aff5091cb3efec399c808f8c598f.jpg`, ownership: "not-owned" },
  { slug: "the-witcher-3", title: "The Witcher 3: Wild Hunt", studio: "CD PROJEKT RED", genreFa: "نقش‌آفرینی", genreEn: "RPG", platforms: ["PS5", "PS4"], sizeGb: 62.1, metacritic: 92, year: 2015, image: `${R}/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg`, ownership: "owned" },
  { slug: "cyberpunk-2077", title: "Cyberpunk 2077", studio: "CD PROJEKT RED", genreFa: "نقش‌آفرینی", genreEn: "RPG", platforms: ["PS5"], sizeGb: 78.3, metacritic: 86, year: 2020, image: `${R}/26d/26d4437715bee60138dab4a7c8c59c92.jpg`, ownership: "not-owned" },
  { slug: "gta-v", title: "Grand Theft Auto V", studio: "Rockstar North", genreFa: "اکشن", genreEn: "Action", platforms: ["PS5", "PS4"], sizeGb: 98.7, metacritic: 97, year: 2013, image: `${R}/20a/20aa03a10cda45239fe22d035c0ebe64.jpg`, ownership: "owned" },
  { slug: "rocket-league", title: "Rocket League", studio: "Psyonix", genreFa: "ورزشی", genreEn: "Sports", platforms: ["PS5", "PS4"], sizeGb: 24.8, metacritic: 86, year: 2015, image: `${R}/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg`, ownership: "free" },
  { slug: "tomb-raider", title: "Tomb Raider", studio: "Crystal Dynamics", genreFa: "ماجراجویی", genreEn: "Adventure", platforms: ["PS4"], sizeGb: 21.5, metacritic: 86, year: 2013, image: `${R}/021/021c4e21a1824d2526f925eff6324653.jpg`, ownership: "not-owned" },
  { slug: "life-is-strange", title: "Life is Strange", studio: "DONTNOD", genreFa: "داستانی", genreEn: "Narrative", platforms: ["PS4"], sizeGb: 9.6, metacritic: 85, year: 2015, image: `${R}/562/562553814dd54e001a541e4ee83a591c.jpg`, ownership: "owned" },
  { slug: "bioshock-infinite", title: "BioShock Infinite", studio: "Irrational Games", genreFa: "شوتر", genreEn: "Shooter", platforms: ["PS4"], sizeGb: 34.2, metacritic: 94, year: 2013, image: `${R}/fc1/fc1307a2774506b5bd65d7e8424664a7.jpg`, ownership: "not-owned" },
];

/** Hours to download `gb` at `mbps`. */
export const hoursAt = (gb: number, mbps: number) => (gb * 8000) / mbps / 3600;

export const game = (slug: string) => GAMES.find((g) => g.slug === slug) ?? GAMES[0];

/** The signed-in user — PSN-linked, Silver plan. */
export const USER = {
  name: "Arman Rahimi",
  psnId: "arman_rhm",
  avatar: "AR",
  plan: "silver" as const,
  quotaTotalGb: 1000,
  quotaLeftGb: 420,
  speedMbps: 20,
  renewsFa: "۱۸ روز دیگر",
  renewsEn: "in 18 days",
};

/** Live edge-node status — the core claim of the pitch. */
export const EDGE = {
  nodeFa: "تهران ۱",
  nodeEn: "Tehran-1",
  speedMbps: 19.6,
  pingMs: 11,
  psnBaselineMbps: 3.1,
  librarySize: 54,
  syncFa: "۲ دقیقه پیش",
  syncEn: "2 min ago",
};
