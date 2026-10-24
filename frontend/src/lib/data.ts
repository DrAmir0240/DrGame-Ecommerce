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
  description?: string;
  mode?: string;
  backdrop?: string;
};

export const GAMES: Game[] = [
  {
    slug: "god-of-war",
    title: "God of War",
    studio: "Santa Monica Studio",
    genreFa: "اکشن ماجراجویی",
    genreEn: "Action-Adventure",
    platforms: ["PS5", "PS4"],
    sizeGb: 85.4,
    metacritic: 94,
    year: 2018,
    image: `${R}/4be/4be6a6ad0364751a96229c56bf69be59.jpg`,
    ownership: "owned",
  },
  {
    slug: "horizon-zero-dawn",
    title: "Horizon Zero Dawn",
    studio: "Guerrilla Games",
    genreFa: "نقش‌آفرینی",
    genreEn: "Action RPG",
    platforms: ["PS5", "PS4"],
    sizeGb: 72.6,
    metacritic: 89,
    year: 2017,
    image: `${R}/b7d/b7d3f1715fa8381a4e780173a197a615.jpg`,
    ownership: "owned",
  },
  {
    slug: "red-dead-redemption-2",
    title: "Red Dead Redemption 2",
    studio: "Rockstar Games",
    genreFa: "جهان باز",
    genreEn: "Open World",
    platforms: ["PS4"],
    sizeGb: 120.4,
    metacritic: 97,
    year: 2018,
    image: `${R}/511/5118aff5091cb3efec399c808f8c598f.jpg`,
    ownership: "not-owned",
  },
  {
    slug: "the-witcher-3",
    title: "The Witcher 3: Wild Hunt",
    studio: "CD PROJEKT RED",
    genreFa: "نقش‌آفرینی",
    genreEn: "RPG",
    platforms: ["PS5", "PS4"],
    sizeGb: 62.1,
    metacritic: 92,
    year: 2015,
    image: `${R}/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg`,
    ownership: "owned",
  },
  {
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    studio: "CD PROJEKT RED",
    genreFa: "نقش‌آفرینی",
    genreEn: "RPG",
    platforms: ["PS5"],
    sizeGb: 78.3,
    metacritic: 86,
    year: 2020,
    image: `${R}/26d/26d4437715bee60138dab4a7c8c59c92.jpg`,
    ownership: "not-owned",
  },
  {
    slug: "gta-v",
    title: "Grand Theft Auto V",
    studio: "Rockstar North",
    genreFa: "اکشن",
    genreEn: "Action",
    platforms: ["PS5", "PS4"],
    sizeGb: 98.7,
    metacritic: 97,
    year: 2013,
    image: `${R}/20a/20aa03a10cda45239fe22d035c0ebe64.jpg`,
    ownership: "owned",
  },
  {
    slug: "rocket-league",
    title: "Rocket League",
    studio: "Psyonix",
    genreFa: "ورزشی",
    genreEn: "Sports",
    platforms: ["PS5", "PS4"],
    sizeGb: 24.8,
    metacritic: 86,
    year: 2015,
    image: `${R}/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg`,
    ownership: "free",
  },
  {
    slug: "tomb-raider",
    title: "Tomb Raider",
    studio: "Crystal Dynamics",
    genreFa: "ماجراجویی",
    genreEn: "Adventure",
    platforms: ["PS4"],
    sizeGb: 21.5,
    metacritic: 86,
    year: 2013,
    image: `${R}/021/021c4e21a1824d2526f925eff6324653.jpg`,
    ownership: "not-owned",
  },
  {
    slug: "life-is-strange",
    title: "Life is Strange",
    studio: "DONTNOD",
    genreFa: "داستانی",
    genreEn: "Narrative",
    platforms: ["PS4"],
    sizeGb: 9.6,
    metacritic: 85,
    year: 2015,
    image: `${R}/562/562553814dd54e001a541e4ee83a591c.jpg`,
    ownership: "owned",
  },
  {
    slug: "bioshock-infinite",
    title: "BioShock Infinite",
    studio: "Irrational Games",
    genreFa: "شوتر",
    genreEn: "Shooter",
    platforms: ["PS4"],
    sizeGb: 34.2,
    metacritic: 94,
    year: 2013,
    image: `${R}/fc1/fc1307a2774506b5bd65d7e8424664a7.jpg`,
    ownership: "not-owned",
  },
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

/** Storage Device & File Manager Types & Mock Data */
export interface StorageDevice {
  id: string;
  nameFa: string;
  nameEn: string;
  type: "internal" | "m2" | "external";
  totalGb: number;
  usedGb: number;
  freeGb: number;
  filesystem: string;
  status: "healthy" | "active";
}

export interface StorageFile {
  id: string;
  name: string;
  gameSlug: string;
  gameTitle: string;
  type: "game_pkg" | "patch" | "subtitle" | "dlc";
  platform: "PS5" | "PS4";
  version: string;
  sizeGb: number;
  locationId: string; // 'internal' | 'm2' | 'external'
  lastPlayedFa: string;
  lastPlayedEn: string;
  integrity: "verified" | "unchecked";
}

export const STORAGE_DEVICES: StorageDevice[] = [
  {
    id: "internal",
    nameFa: "حافظه داخلی کنسول PS5 (SSD)",
    nameEn: "Console Storage (Internal SSD)",
    type: "internal",
    totalGb: 667.2,
    usedGb: 512.4,
    freeGb: 154.8,
    filesystem: "PSFS (Encrypted High-Speed)",
    status: "healthy",
  },
  {
    id: "m2",
    nameFa: "حافظه ارتقا یافته M.2 NVMe",
    nameEn: "M.2 SSD Storage (PCIe 4.0)",
    type: "m2",
    totalGb: 2000,
    usedGb: 1420,
    freeGb: 580,
    filesystem: "PSFS (Samsung 980 Pro 2TB)",
    status: "active",
  },
  {
    id: "external",
    nameFa: "هارد اکسترنال USB (Extended Storage)",
    nameEn: "USB Extended Storage (WD Black 4TB)",
    type: "external",
    totalGb: 4000,
    usedGb: 2780,
    freeGb: 1220,
    filesystem: "exFAT Extended (USB 3.2)",
    status: "active",
  },
];

export const STORAGE_FILES: StorageFile[] = [
  {
    id: "pkg-gow-01",
    name: "God.of.War.v1.00.CUSA07408.pkg",
    gameSlug: "god-of-war",
    gameTitle: "God of War",
    type: "game_pkg",
    platform: "PS5",
    version: "v1.00",
    sizeGb: 78.2,
    locationId: "internal",
    lastPlayedFa: "دیروز",
    lastPlayedEn: "Yesterday",
    integrity: "verified",
  },
  {
    id: "pkg-gow-02",
    name: "God.of.War.Update.v1.35.pkg",
    gameSlug: "god-of-war",
    gameTitle: "God of War",
    type: "patch",
    platform: "PS5",
    version: "v1.35",
    sizeGb: 5.8,
    locationId: "internal",
    lastPlayedFa: "دیروز",
    lastPlayedEn: "Yesterday",
    integrity: "verified",
  },
  {
    id: "pkg-gow-03",
    name: "GOW_Persian_Sub_Pack_v2.1.pkg",
    gameSlug: "god-of-war",
    gameTitle: "God of War",
    type: "subtitle",
    platform: "PS5",
    version: "v2.1",
    sizeGb: 1.4,
    locationId: "internal",
    lastPlayedFa: "دیروز",
    lastPlayedEn: "Yesterday",
    integrity: "verified",
  },
  {
    id: "pkg-rdr2-01",
    name: "Red.Dead.Redemption.2.Full.CUSA03041.pkg",
    gameSlug: "red-dead-redemption-2",
    gameTitle: "Red Dead Redemption 2",
    type: "game_pkg",
    platform: "PS4",
    version: "v1.00",
    sizeGb: 105.2,
    locationId: "external",
    lastPlayedFa: "۳ روز پیش",
    lastPlayedEn: "3 days ago",
    integrity: "verified",
  },
  {
    id: "pkg-rdr2-02",
    name: "Red.Dead.Redemption.2.Update.v1.29.pkg",
    gameSlug: "red-dead-redemption-2",
    gameTitle: "Red Dead Redemption 2",
    type: "patch",
    platform: "PS4",
    version: "v1.29",
    sizeGb: 15.2,
    locationId: "external",
    lastPlayedFa: "۳ روز پیش",
    lastPlayedEn: "3 days ago",
    integrity: "verified",
  },
  {
    id: "pkg-hzd-01",
    name: "Horizon.Zero.Dawn.Complete.Edition.pkg",
    gameSlug: "horizon-zero-dawn",
    gameTitle: "Horizon Zero Dawn",
    type: "game_pkg",
    platform: "PS5",
    version: "v1.54",
    sizeGb: 68.4,
    locationId: "m2",
    lastPlayedFa: "هفته گذشته",
    lastPlayedEn: "Last week",
    integrity: "verified",
  },
  {
    id: "pkg-hzd-02",
    name: "Horizon.Frozen.Wilds.DLC.pkg",
    gameSlug: "horizon-zero-dawn",
    gameTitle: "Horizon Zero Dawn",
    type: "dlc",
    platform: "PS5",
    version: "v1.00",
    sizeGb: 4.2,
    locationId: "m2",
    lastPlayedFa: "هفته گذشته",
    lastPlayedEn: "Last week",
    integrity: "verified",
  },
  {
    id: "pkg-tw3-01",
    name: "The.Witcher.3.Wild.Hunt.NextGen.pkg",
    gameSlug: "the-witcher-3",
    gameTitle: "The Witcher 3: Wild Hunt",
    type: "game_pkg",
    platform: "PS5",
    version: "v4.04",
    sizeGb: 58.6,
    locationId: "m2",
    lastPlayedFa: "۲ هفته پیش",
    lastPlayedEn: "2 weeks ago",
    integrity: "verified",
  },
  {
    id: "pkg-tw3-02",
    name: "Witcher3_Persian_Subtitles_AllDLC.pkg",
    gameSlug: "the-witcher-3",
    gameTitle: "The Witcher 3: Wild Hunt",
    type: "subtitle",
    platform: "PS5",
    version: "v3.0",
    sizeGb: 3.5,
    locationId: "m2",
    lastPlayedFa: "۲ هفته پیش",
    lastPlayedEn: "2 weeks ago",
    integrity: "verified",
  },
  {
    id: "pkg-gtav-01",
    name: "GTA.V.PS5.Remastered.Data.pkg",
    gameSlug: "gta-v",
    gameTitle: "Grand Theft Auto V",
    type: "game_pkg",
    platform: "PS5",
    version: "v1.003",
    sizeGb: 98.7,
    locationId: "external",
    lastPlayedFa: "۱ ماه پیش",
    lastPlayedEn: "1 month ago",
    integrity: "verified",
  },
];

/** -------------------------------------------------------------
 * Step 3: DNS Configuration
 * ------------------------------------------------------------- */
export const DNS_CONFIG = {
  primary: "178.22.122.100",
  secondary: "185.51.200.2",
  nodeNameFa: "نود پرسرعت دکتر گیم (تهران ۱)",
  nodeNameEn: "DrGame Tehran-1 Edge Node",
  pingMs: 11,
  protocol: "UDP/TCP Standard DNS (Port 53)",
  recommendedFor: "PS5 & PS4 Direct PKG Ingestion",
};

/** -------------------------------------------------------------
 * Step 3: Console Firmware & Jailbreak Compatibility Database
 * ------------------------------------------------------------- */
export interface ConsoleFirmwareStatus {
  platform: "PS5" | "PS4";
  firmware: string;
  isJailbreakable: boolean;
  exploitNameFa: string;
  exploitNameEn: string;
  supportDetailsFa: string;
  supportDetailsEn: string;
  pkgDirectInstall: boolean;
  statusTone: "success" | "warning" | "psn";
}

export const FIRMWARE_DATABASE: Record<string, ConsoleFirmwareStatus> = {
  "ps5-3.20": {
    platform: "PS5",
    firmware: "3.20",
    isJailbreakable: true,
    exploitNameFa: "کپی‌خور سازگار (IPv6 Kernel Exploit)",
    exploitNameEn: "Jailbreak Ready (IPv6 Kernel Exploit)",
    supportDetailsFa: "پشتیبانی کامل از WebKit Exploit و اجرای مستقیم پکیج‌های فیک (FPKG). آپدیت خودکار را قطع کنید.",
    supportDetailsEn: "Full WebKit Exploit support with direct FPKG payload execution. Disable auto-updates.",
    pkgDirectInstall: true,
    statusTone: "success",
  },
  "ps5-4.03": {
    platform: "PS5",
    firmware: "4.03",
    isJailbreakable: true,
    exploitNameFa: "کپی‌خور سازگار (PS5 WebKit + Kstuff)",
    exploitNameEn: "Jailbreak Ready (WebKit + Kstuff)",
    supportDetailsFa: "بهترین فریمور برای جیلبریک PS5 با پایداری ۹۹٪ و اجرای پکیج‌های اختصاصی PS5.",
    supportDetailsEn: "Prime firmware for PS5 jailbreak with 99% exploit stability and native PS5 homebrew.",
    pkgDirectInstall: true,
    statusTone: "success",
  },
  "ps5-4.50": {
    platform: "PS5",
    firmware: "4.50",
    isJailbreakable: true,
    exploitNameFa: "کپی‌خور سازگار (EtaHEN / Kstuff)",
    exploitNameEn: "Jailbreak Ready (EtaHEN / Kstuff)",
    supportDetailsFa: "سازگار با پی‌لود EtaHEN، نصب بازی‌ها روی هارد اکسترنال M.2 و کنترل کامل فایل‌سیستم.",
    supportDetailsEn: "Compatible with EtaHEN payload, M.2 game installs, and full filesystem debug.",
    pkgDirectInstall: true,
    statusTone: "success",
  },
  "ps5-official": {
    platform: "PS5",
    firmware: "9.60 (Official)",
    isJailbreakable: false,
    exploitNameFa: "کنسول اورجینال (اکانت قانونی PSN)",
    exploitNameEn: "Official Firmware (Original PSN)",
    supportDetailsFa: "دانلود دیتای پکیج رسمی سونی با نهایت پهنای باند شبکه CDN دکتر گیم و بدون نیاز به خرید حجم بین‌الملل.",
    supportDetailsEn: "Official Sony PKG data download via DrGame high-speed Tehran edge without quota penalty.",
    pkgDirectInstall: false,
    statusTone: "psn",
  },
  "ps4-9.00": {
    platform: "PS4",
    firmware: "9.00",
    isJailbreakable: true,
    exploitNameFa: "کپی‌خور پایدار (GoldHEN 2.4b)",
    exploitNameEn: "Stable Jailbreak (GoldHEN 2.4b)",
    supportDetailsFa: "پایدارترین نسخه کپی‌خور پلی‌استیشن ۴ با قابلیت اجرای تمامی بازی‌ها و فارسی‌سازها.",
    supportDetailsEn: "Most stable PS4 jailbreak supporting all game backports and Persian subtitle packs.",
    pkgDirectInstall: true,
    statusTone: "success",
  },
  "ps4-11.00": {
    platform: "PS4",
    firmware: "11.00",
    isJailbreakable: true,
    exploitNameFa: "کپی‌خور شبکه (PPPwn Exploit)",
    exploitNameEn: "Network Jailbreak (PPPwn Exploit)",
    supportDetailsFa: "جیلبریک از طریق کابل شبکه LAN و پورت اترنت با گلد‌هن v2.4.",
    supportDetailsEn: "Jailbreak via Ethernet LAN port with PPPwn GoldHEN loader.",
    pkgDirectInstall: true,
    statusTone: "success",
  },
};

/** -------------------------------------------------------------
 * Step 3: Video Tutorials Database
 * ------------------------------------------------------------- */
export interface TutorialVideo {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  category: "dns" | "pkg_install" | "storage" | "jailbreak" | "errors";
  duration: string;
  views: number;
  levelFa: "مقدماتی" | "متوسط" | "پیشرفته";
  levelEn: "Beginner" | "Intermediate" | "Advanced";
  thumbnail: string;
  videoUrl: string; // Embed or mock video
  descriptionFa: string;
  descriptionEn: string;
  stepsFa: string[];
  stepsEn: string[];
}

export const TUTORIAL_CATEGORIES = [
  { id: "all", nameFa: "همه آموزش‌ها", nameEn: "All Tutorials" },
  { id: "dns", nameFa: "تنظیمات دی‌ان‌اس و شبکه", nameEn: "DNS & Network Setup" },
  { id: "pkg_install", nameFa: "نصب دیتای بازی روی کنسول", nameEn: "Game PKG Installation" },
  { id: "storage", nameFa: "مدیریت هارد و M.2", nameEn: "USB & M.2 Storage" },
  { id: "jailbreak", nameFa: "راهنمای کپی‌خور و جیلبریک", nameEn: "Jailbreak & Homebrew" },
  { id: "errors", nameFa: "رفع ارورهای رایج PSN", nameEn: "Fix PSN & Corrupt Errors" },
];

export const TUTORIALS: TutorialVideo[] = [
  {
    id: "tut-dns-01",
    slug: "setup-dns-ps5",
    titleFa: "آموزش گام‌به‌گام تنظیم دی‌ان‌اس دکتر گیم روی پلی‌استیشن ۵",
    titleEn: "Step-by-Step DrGame DNS Configuration on PlayStation 5",
    category: "dns",
    duration: "4:15",
    views: 14200,
    levelFa: "مقدماتی",
    levelEn: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=640&auto=format&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    descriptionFa: "در این ویدیو نحوه ورود به بخش Network Settings، وارد کردن دستی DNS Primary و Secondary دکتر گیم و تست اتصال با پینگ ۱۱ میلی‌ثانیه آموزش داده می‌شود.",
    descriptionEn: "Learn how to access Network Settings, enter Primary/Secondary DrGame DNS and verify connection with 11ms latency.",
    stepsFa: [
      "به مسیر Settings > Network > Settings > Set Up Internet Connection بروید.",
      "روی شبکه متصل (Wi-Fi یا LAN) دکمه Options را زده و Advanced Settings را باز کنید.",
      "DNS Settings را از حالت Automatic به Manual تغییر دهید.",
      "در کادر Primary DNS مقدار 178.22.122.100 و در Secondary DNS مقدار 185.51.200.2 را وارد کنید.",
      "تغییرات را ذخیره کرده و Test Internet Connection را اجرا نمایید.",
    ],
    stepsEn: [
      "Go to Settings > Network > Settings > Set Up Internet Connection.",
      "Highlight your connected network and press Options > Advanced Settings.",
      "Change DNS Settings from Automatic to Manual.",
      "Enter Primary DNS 178.22.122.100 and Secondary DNS 185.51.200.2.",
      "Save changes and run Test Internet Connection.",
    ],
  },
  {
    id: "tut-pkg-01",
    slug: "install-pkg-internal-ssd",
    titleFa: "راهنمای ارسال و نصب مستقیم دیتای بازی روی هارد کنسول بدون کامپیوتر",
    titleEn: "How to Direct-Inject Game PKGs onto Console Storage Without PC",
    category: "pkg_install",
    duration: "6:50",
    views: 28900,
    levelFa: "متوسط",
    levelEn: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=640&auto=format&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    descriptionFa: "انتقال یکپارچه بسته‌های دیتای چندپارتی، ادغام خودکار پچ‌های آپدیت و فارسی‌ساز با سرعت گیگابیتی شبکه داخلی.",
    descriptionEn: "Seamless transfer of multi-part data packages with automated patch and Persian subtitle merging.",
    stepsFa: [
      "وارد داشبورد دکتر گیم در مرورگر کنسول یا گوشی متصل به شبکه محلی شوید.",
      "بازی مورد نظر را انتخاب کرده و روی «ارسال مستقیم به کنسول» کلیک کنید.",
      "داشبورد کنسول درخواست دریافت بسته را تایید کرده و دانلود بدون قطعی آغاز می‌شود.",
    ],
    stepsEn: [
      "Access DrGame dashboard on console browser or local network phone.",
      "Select desired game and click 'Send directly to PS5'.",
      "Console confirms incoming delivery and ingests high-speed package.",
    ],
  },
  {
    id: "tut-usb-01",
    slug: "format-usb-extended-storage",
    titleFa: "فرمت و مدیریت هارد اکسترنال USB برای آرشیو بازی‌های PS5 و PS4",
    titleEn: "Formatting & Managing USB Extended Storage for PS5 & PS4 Backups",
    category: "storage",
    duration: "5:20",
    views: 11400,
    levelFa: "مقدماتی",
    levelEn: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=640&auto=format&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    descriptionFa: "آموزش اتصال هارد اکسترنال با پورت USB 3.2، فرمت اختصاصی exFAT در کنسول و انتقال بازی‌ها با فایل منیجر دکتر گیم.",
    descriptionEn: "Guide to connecting USB 3.2 external hard drives, console exFAT formatting and cross-drive transfers with DrGame file manager.",
    stepsFa: [
      "هارد را به پورت پرسرعت پشت کنسول وصل کنید.",
      "به Settings > Storage > USB Extended Storage رفته و گزینه Format as USB Extended Storage را انتخاب کنید.",
      "اکنون در صفحه فایل منیجر دکتر گیم، هارد شما با عنوان USB Extended شناسایی شده و آماده انتقال است.",
    ],
    stepsEn: [
      "Plug the drive into the high-speed SuperSpeed USB port on the back.",
      "Navigate to Settings > Storage > USB Extended Storage > Format.",
      "The drive now appears mounted in DrGame storage manager.",
    ],
  },
  {
    id: "tut-jb-01",
    slug: "ps5-jailbreak-guide",
    titleFa: "راهنمای جیلبریک PS5 روی فریمور ۴.۰۳ و ۴.۵۰ با پی‌لود EtaHEN",
    titleEn: "PS5 Jailbreak Guide on FW 4.03 & 4.50 with EtaHEN Payload",
    category: "jailbreak",
    duration: "8:40",
    views: 45200,
    levelFa: "پیشرفته",
    levelEn: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    descriptionFa: "بررسی اختصاصی اجرای هاست آنلاین، فعال‌سازی حالت دیباگ و نصب پکیج‌های اختصاصی شبیه‌ساز و پچ‌های ۶۰ فریم.",
    descriptionEn: "Exclusive walkthrough on running the online host, activating Debug Settings and installing homebrew FPKGs.",
    stepsFa: [
      "از تنظیمات شبکه مطمئن شوید دی‌ان‌اس اختصاصی دکتر گیم فعال است تا آپدیت سونی مسدود شود.",
      "راهنمای کاربر (User's Guide) را در تنظیمات باز کنید تا اکسپلویت وب‌کیت اجرا شود.",
      "پی‌لود EtaHEN بارگذاری شده و منوی Debug Settings به تنظیمات کنسول اضافه می‌شود.",
    ],
    stepsEn: [
      "Ensure DrGame DNS is active to block Sony firmware update servers.",
      "Open User's Guide in Settings to trigger WebKit exploit.",
      "EtaHEN payload loads and Debug Settings menu unlocks.",
    ],
  },
];

/** -------------------------------------------------------------
 * Step 3: Multi-Level Referral & Affiliate Database
 * ------------------------------------------------------------- */
export interface ReferralTier {
  level: number;
  nameFa: string;
  nameEn: string;
  commissionPercent: number;
  discountPercent: number;
  minMembers: number;
  badgeColor: string;
}

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    level: 1,
    nameFa: "معرف برنزی (سطح ۱)",
    nameEn: "Bronze Affiliate (Level 1)",
    commissionPercent: 10,
    discountPercent: 20,
    minMembers: 0,
    badgeColor: "from-amber-700 to-amber-900 text-amber-200",
  },
  {
    level: 2,
    nameFa: "معرف نقره‌ای (سطح ۲)",
    nameEn: "Silver Affiliate (Level 2)",
    commissionPercent: 13, // 10% + 3% sub-tier
    discountPercent: 20,
    minMembers: 10,
    badgeColor: "from-slate-400 to-slate-600 text-slate-100",
  },
  {
    level: 3,
    nameFa: "معرف طلایی و نماینده (سطح ۳)",
    nameEn: "Gold Partner (Level 3)",
    commissionPercent: 14, // 10% + 3% + 1%
    discountPercent: 25,
    minMembers: 30,
    badgeColor: "from-yellow-400 to-amber-500 text-black",
  },
];

export interface InvitedUser {
  id: string;
  name: string;
  psnId: string;
  joinedFa: string;
  joinedEn: string;
  tierLevel: 1 | 2 | 3;
  hasPurchased: boolean;
  totalSpentToman: number;
  commissionEarnedToman: number;
  subReferralsCount: number;
}

export const REFERRAL_DATA = {
  referralCode: "ARMAN28",
  referralLink: "https://drgame.ir/ref/ARMAN28",
  invitedDiscountPercent: 20,
  userCurrentTier: 2,
  totalInvites: 18,
  activePurchasers: 14,
  totalCommissionToman: 1840000,
  pendingCommissionToman: 420000,
  availableBalanceToman: 1420000,
  invites: [
    {
      id: "inv-01",
      name: "سینا کریمی",
      psnId: "sina_k_99",
      joinedFa: "۲ روز پیش",
      joinedEn: "2 days ago",
      tierLevel: 1 as const,
      hasPurchased: true,
      totalSpentToman: 1198000,
      commissionEarnedToman: 119800,
      subReferralsCount: 4,
    },
    {
      id: "inv-02",
      name: "مهرداد نوری",
      psnId: "mehrdad_gamer",
      joinedFa: "۵ روز پیش",
      joinedEn: "5 days ago",
      tierLevel: 1 as const,
      hasPurchased: true,
      totalSpentToman: 2988000,
      commissionEarnedToman: 298800,
      subReferralsCount: 7,
    },
    {
      id: "inv-03",
      name: "کامران دادخواه (زیرمجموعه سینا)",
      psnId: "kamran_d",
      joinedFa: "۱ هفته پیش",
      joinedEn: "1 week ago",
      tierLevel: 2 as const,
      hasPurchased: true,
      totalSpentToman: 1198000,
      commissionEarnedToman: 35940,
      subReferralsCount: 2,
    },
    {
      id: "inv-04",
      name: "بهرام افشار",
      psnId: "bahram_af",
      joinedFa: "۲ هفته پیش",
      joinedEn: "2 weeks ago",
      tierLevel: 1 as const,
      hasPurchased: false,
      totalSpentToman: 0,
      commissionEarnedToman: 0,
      subReferralsCount: 0,
    },
    {
      id: "inv-05",
      name: "امید رضایی (زیرمجموعه مهرداد)",
      psnId: "omid_reza",
      joinedFa: "۳ هفته پیش",
      joinedEn: "3 weeks ago",
      tierLevel: 2 as const,
      hasPurchased: true,
      totalSpentToman: 698000,
      commissionEarnedToman: 20940,
      subReferralsCount: 1,
    },
    {
      id: "inv-06",
      name: "نوید رستمی (لایه سوم)",
      psnId: "navid_rostami",
      joinedFa: "۱ ماه پیش",
      joinedEn: "1 month ago",
      tierLevel: 3 as const,
      hasPurchased: true,
      totalSpentToman: 2988000,
      commissionEarnedToman: 29880,
      subReferralsCount: 0,
    },
  ],
};

/** -------------------------------------------------------------
 * Step 3: User Wallet & Transactions
 * ------------------------------------------------------------- */
export interface WalletTransaction {
  id: string;
  type: "deposit" | "purchase" | "referral_payout" | "withdrawal";
  amountToman: number;
  dateFa: string;
  dateEn: string;
  descriptionFa: string;
  descriptionEn: string;
  status: "completed" | "pending" | "failed";
}

export const WALLET_DATA = {
  balanceToman: 1450000,
  totalDepositedToman: 4500000,
  totalSpentToman: 3050000,
  pendingWithdrawalToman: 0,
  shabaNumber: "IR980120000000001234567890",
  transactions: [
    {
      id: "tx-101",
      type: "referral_payout" as const,
      amountToman: 298800,
      dateFa: "دیروز، ساعت ۱۶:۲۰",
      dateEn: "Yesterday, 16:20",
      descriptionFa: "واریز پورسانت رفرال (خرید پلن طلایی توسط مهرداد نوری)",
      descriptionEn: "Referral Commission payout (Gold Plan by Mehrdad)",
      status: "completed" as const,
    },
    {
      id: "tx-102",
      type: "deposit" as const,
      amountToman: 1000000,
      dateFa: "۳ روز پیش",
      dateEn: "3 days ago",
      descriptionFa: "افزایش موجودی آنلاین از طریق درگاه بانکی سامان",
      descriptionEn: "Online wallet deposit via Saman gateway",
      status: "completed" as const,
    },
    {
      id: "tx-103",
      type: "purchase" as const,
      amountToman: -1198000,
      dateFa: "۲ هفته پیش",
      dateEn: "2 weeks ago",
      descriptionFa: "پرداخت تمدید پلن اشتراک نقره‌ای (۱ ترابایت ماهانه)",
      descriptionEn: "Silver Subscription renewal payment (1TB Quota)",
      status: "completed" as const,
    },
    {
      id: "tx-104",
      type: "referral_payout" as const,
      amountToman: 119800,
      dateFa: "۳ هفته پیش",
      dateEn: "3 weeks ago",
      descriptionFa: "واریز پورسانت رفرال (خرید پلن نقره‌ای توسط سینا کریمی)",
      descriptionEn: "Referral Commission payout (Silver Plan by Sina)",
      status: "completed" as const,
    },
  ],
};

/** -------------------------------------------------------------
 * Step 3: Blog & Gaming News Database
 * ------------------------------------------------------------- */
export interface BlogPost {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  category: "firmware" | "games" | "hardware" | "guides";
  authorFa: string;
  authorEn: string;
  readTimeMin: number;
  dateFa: string;
  dateEn: string;
  thumbnail: string;
  excerptFa: string;
  excerptEn: string;
  tagsFa: string[];
  tagsEn: string[];
  contentFa: string;
  contentEn: string;
}

export const BLOG_CATEGORIES = [
  { id: "all", nameFa: "همه مقالات", nameEn: "All Posts" },
  { id: "firmware", nameFa: "تحلیل فریمور و کپی‌خور", nameEn: "Firmware & Jailbreak" },
  { id: "guides", nameFa: "راهنمای کنسول و شبکه", nameEn: "Console Guides" },
  { id: "hardware", nameFa: "سخت‌افزار و هارد SSD", nameEn: "Hardware & SSD" },
  { id: "games", nameFa: "اخبار و بررسی بازی‌ها", nameEn: "Game Reviews" },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-01",
    slug: "ps5-firmware-jailbreak-status-2026",
    titleFa: "آخرین وضعیت کپی‌خور پلی‌استیشن ۵ در سال ۲۰۲۶: از فریمور ۴.۵۰ تا پی‌لودهای جدید",
    titleEn: "Latest PS5 Jailbreak Status in 2026: From FW 4.50 to Emerging Payloads",
    category: "firmware",
    authorFa: "مهندس شایان حسینی",
    authorEn: "Shayan Hosseini",
    readTimeMin: 6,
    dateFa: "۲۸ مهر ۱۴۰۵",
    dateEn: "Oct 20, 2026",
    thumbnail: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
    excerptFa: "بررسی عمیق پایداری هاست‌های وب‌کیت، ابزار EtaHEN، پشتیبانی از نصب بازی‌های نسل ۹ و مقایسه هزینه با اشتراک قانونی.",
    excerptEn: "In-depth breakdown of WebKit hosts stability, EtaHEN homebrew toolchain, and direct PKG injections.",
    tagsFa: ["پلی‌استیشن ۵", "جیلبریک", "فریمور ۴.۵۰", "هک کنسول"],
    tagsEn: ["PS5", "Jailbreak", "Firmware 4.50", "Homebrew"],
    contentFa: `پلی‌استیشن ۵ با معماری رمزگذاری پیشرفته و ماژول امنیت اختصاصی، یکی از امن‌ترین پلتفرم‌های تاریخ سونی محسوب می‌شود. با این حال جامعه توسعه‌دهندگان مستقل در ماه‌های اخیر موفق به گسترش سازگاری پی‌لودها تا فریمورهای ۴.۵۱ شده‌اند.

در این مقاله به بررسی مزایا و خطرات کپی‌خور، از جمله عدم دسترسی به شبکه آنلاین PSN در برابر لذت نصب مودها و زیرنویس‌های فارسی اختصاصی می‌پردازیم...`,
    contentEn: `PlayStation 5 features customized cryptographic hypervisors. However, the scene has unlocked stable kernel exploits up to FW 4.51. In this article, we examine the trade-offs between online PSN access and native custom PKG installations.`,
  },
  {
    id: "blog-02",
    slug: "best-nvme-ssd-for-ps5-expansion",
    titleFa: "راهنمای خرید بهترین SSD های M.2 سازگار با پلی‌استیشن ۵ با سرعت بالای ۷۰۰۰ مگابایت",
    titleEn: "Ultimate Guide to Top M.2 NVMe SSDs for PS5 with 7000+ MB/s Speeds",
    category: "hardware",
    authorFa: "تیم فنی دکتر گیم",
    authorEn: "DrGame Hardware Lab",
    readTimeMin: 4,
    dateFa: "۲۵ مهر ۱۴۰۵",
    dateEn: "Oct 17, 2026",
    thumbnail: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop",
    excerptFa: "مقایسه عملکرد سامسونگ ۹۸۰ پرو، وسترن دیجیتال SN850X و کروشال T500 در اجرای بازی‌های سنگین نظیر Spider-Man 2 و Ratchet & Clank.",
    excerptEn: "Comparing real-world performance between Samsung 980 Pro, WD Black SN850X and Crucial T500.",
    tagsFa: ["اس‌اس‌دی M.2", "سخت‌افزار PS5", "افزایش حافظه"],
    tagsEn: ["M.2 SSD", "PS5 Hardware", "Storage Expansion"],
    contentFa: `سونی حداقل سرعت خواندن ترتیبی ۵۵۰۰ مگابایت بر ثانیه را برای درایوهای M.2 توصیه کرده است. ما در این تست جامع ۵ اس‌اس‌دی برتر بازار ایران را بررسی کرده‌ایم...`,
    contentEn: `Sony specifies at least 5,500 MB/s sequential read for expansion drives. We benchmarked the top 5 drives available...`,
  },
  {
    id: "blog-03",
    slug: "why-cdn-dns-fixes-psn-download-speed",
    titleFa: "چرا استفاده از DNS دکتر گیم سرعت دانلود کنسول را تا ۶ برابر افزایش می‌دهد؟",
    titleEn: "How DrGame DNS Optimizes Download Speeds by Up to 6x on Consoles",
    category: "guides",
    authorFa: "آرش مهرگان",
    authorEn: "Arash Mehregan",
    readTimeMin: 5,
    dateFa: "۲۰ مهر ۱۴۰۵",
    dateEn: "Oct 12, 2026",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
    excerptFa: "تحلیل مسیریابی پکت‌های دیتای کنسول، دور زدن افت پهنای باند بین‌الملل و هدایت ترافیک به سمت پاپ‌سایت‌های داخلی تهران.",
    excerptEn: "Routing packets through localized POP edge nodes to avoid severe international bandwidth throttling.",
    tagsFa: ["دی‌ان‌اس کنسول", "افزایش سرعت", "شبکه CDN"],
    tagsEn: ["Console DNS", "Speed Boost", "Edge Network"],
    contentFa: `سرورهای رسمی دیتای سونی روی CDN های بین‌المللی مانند Akamai و Fastly میزبانی می‌شوند. در شبکه ایران، دسترسی به این سرورها اغلب با پکت‌لاس و محدودیت سرعت مواجه است...`,
    contentEn: `Sony distributes PKGs through global Akamai and Fastly CDNs. Local routing often suffers from heavy packet drops...`,
  },
];
