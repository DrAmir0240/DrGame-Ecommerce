export interface PsnPresetAvatar {
  id: string;
  name_fa: string;
  name_en: string;
  game_fa: string;
  game_en: string;
  url: string;
}

export const DEFAULT_PSN_AVATAR = '/avatars/psn/default.png';

export const SONY_PRESET_AVATARS: PsnPresetAvatar[] = [
  {
    id: 'kratos',
    name_fa: 'کریتوس',
    name_en: 'Kratos',
    game_fa: 'خدای جنگ',
    game_en: 'God of War',
    url: '/avatars/psn/kratos.png',
  },
  {
    id: 'atreus',
    name_fa: 'آترئوس',
    name_en: 'Atreus',
    game_fa: 'خدای جنگ',
    game_en: 'God of War',
    url: '/avatars/psn/atreus.png',
  },
  {
    id: 'ellie',
    name_fa: 'الی',
    name_en: 'Ellie',
    game_fa: 'آخرین بازمانده از ما',
    game_en: 'The Last of Us',
    url: '/avatars/psn/ellie.png',
  },
  {
    id: 'joel',
    name_fa: 'جوئل',
    name_en: 'Joel',
    game_fa: 'آخرین بازمانده از ما',
    game_en: 'The Last of Us',
    url: '/avatars/psn/joel.png',
  },
  {
    id: 'dina',
    name_fa: 'دینا',
    name_en: 'Dina',
    game_fa: 'آخرین بازمانده از ما ۲',
    game_en: 'The Last of Us Part II',
    url: '/avatars/psn/dina.png',
  },
  {
    id: 'jesse',
    name_fa: 'جسی',
    name_en: 'Jesse',
    game_fa: 'آخرین بازمانده از ما ۲',
    game_en: 'The Last of Us Part II',
    url: '/avatars/psn/jesse.png',
  },
  {
    id: 'spider-man',
    name_fa: 'پیتر پارکر (اسپایدرمن)',
    name_en: 'Peter Parker (Spider-Man)',
    game_fa: 'مرد عنکبوتی مارول',
    game_en: "Marvel's Spider-Man",
    url: '/avatars/psn/spider-man.png',
  },
  {
    id: 'miles-morales',
    name_fa: 'مایلز مورالس',
    name_en: 'Miles Morales',
    game_fa: 'اسپایدرمن: مایلز مورالس',
    game_en: 'Spider-Man: Miles Morales',
    url: '/avatars/psn/miles-morales.png',
  },
  {
    id: 'miles-morales-neon',
    name_fa: 'مایلز مورالس (نئونی)',
    name_en: 'Miles Morales (Neon)',
    game_fa: 'اسپایدرمن: مایلز مورالس',
    game_en: 'Spider-Man: Miles Morales',
    url: '/avatars/psn/miles-morales-neon.png',
  },
  {
    id: 'aloy',
    name_fa: 'اِلوی',
    name_en: 'Aloy',
    game_fa: 'هورایزن غرب ممنوعه',
    game_en: 'Horizon Forbidden West',
    url: '/avatars/psn/aloy.png',
  },
  {
    id: 'jin-sakai',
    name_fa: 'جین ساکای',
    name_en: 'Jin Sakai',
    game_fa: 'شبح سوشیما',
    game_en: 'Ghost of Tsushima',
    url: '/avatars/psn/jin-sakai.png',
  },
  {
    id: 'astro-bot',
    name_fa: 'آسترو بات',
    name_en: 'Astro Bot',
    game_fa: 'آسترو بات',
    game_en: 'Astro Bot',
    url: '/avatars/psn/astro-bot.png',
  },
  {
    id: 'bloodborne-hunter',
    name_fa: 'شکارچی',
    name_en: 'Hunter',
    game_fa: 'بلادبورن',
    game_en: 'Bloodborne',
    url: '/avatars/psn/bloodborne-hunter.png',
  },
  {
    id: 'nathan-drake',
    name_fa: 'نیتن دریک',
    name_en: 'Nathan Drake',
    game_fa: 'آنچارتد',
    game_en: 'Uncharted',
    url: '/avatars/psn/nathan-drake.png',
  },
  {
    id: 'elena-fisher',
    name_fa: 'النا فیشر',
    name_en: 'Elena Fisher',
    game_fa: 'آنچارتد',
    game_en: 'Uncharted',
    url: '/avatars/psn/elena-fisher.png',
  },
  {
    id: 'ratchet',
    name_fa: 'رچت',
    name_en: 'Ratchet',
    game_fa: 'رچت و کلنک',
    game_en: 'Ratchet & Clank',
    url: '/avatars/psn/ratchet.png',
  },
  {
    id: 'sackboy',
    name_fa: 'سک‌بوی',
    name_en: 'Sackboy',
    game_fa: 'لیتل بیگ پلنت',
    game_en: 'LittleBigPlanet',
    url: '/avatars/psn/sackboy.png',
  },
  {
    id: 'sly-cooper',
    name_fa: 'اسلای کوپر',
    name_en: 'Sly Cooper',
    game_fa: 'اسلای کوپر',
    game_en: 'Sly Cooper',
    url: '/avatars/psn/sly-cooper.png',
  },
  {
    id: 'jak',
    name_fa: 'جک',
    name_en: 'Jak',
    game_fa: 'جک و دکستر',
    game_en: 'Jak and Daxter',
    url: '/avatars/psn/jak.png',
  },
  {
    id: 'journey-traveler',
    name_fa: 'مسافر جِرنی',
    name_en: 'Traveler',
    game_fa: 'جرنی (Journey)',
    game_en: 'Journey',
    url: '/avatars/psn/journey-traveler.png',
  },
];

export function getValidAvatarUrl(avatarUrl?: string | null): string {
  if (!avatarUrl || avatarUrl.includes('unsplash.com')) {
    return DEFAULT_PSN_AVATAR;
  }
  return avatarUrl;
}
