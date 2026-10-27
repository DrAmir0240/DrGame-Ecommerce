/**
 * DrGame Client-Side Smart Translation Engine
 * Supports 10 international languages with instant local caching (localStorage).
 * Admin enters content in Persian/English; the engine renders seamless translations for global users.
 */

export type SupportedLang = 'fa' | 'en' | 'ar' | 'tr' | 'fr' | 'es' | 'de' | 'ru' | 'zh' | 'ja';

export interface LanguageMeta {
  code: SupportedLang;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const SUPPORTED_LANGUAGES: Record<SupportedLang, LanguageMeta> = {
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', dir: 'rtl' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr' },
};

export function isRtlLang(lang: SupportedLang): boolean {
  return SUPPORTED_LANGUAGES[lang]?.dir === 'rtl';
}

/**
 * High-frequency gaming, commerce, and UI dictionary across 10 languages
 */
export const DICTIONARY: Record<string, Record<SupportedLang, string>> = {
  // Navigation & Core Actions
  'صفحه اصلی': {
    fa: 'صفحه اصلی',
    en: 'Home',
    ar: 'الرئيسية',
    tr: 'Ana Sayfa',
    fr: 'Accueil',
    es: 'Inicio',
    de: 'Startseite',
    ru: 'Главная',
    zh: '首页',
    ja: 'ホーム',
  },
  'فروشگاه بازی‌ها': {
    fa: 'فروشگاه بازی‌ها',
    en: 'Games Catalog',
    ar: 'كتالوج الألعاب',
    tr: 'Oyun Kataloğu',
    fr: 'Catalogue de Jeux',
    es: 'Catálogo de Juegos',
    de: 'Spielekatalog',
    ru: 'Каталог игр',
    zh: '游戏目录',
    ja: 'ゲーム一覧',
  },
  'بازی‌ها': {
    fa: 'بازی‌ها',
    en: 'Games',
    ar: 'الألعاب',
    tr: 'Oyunlar',
    fr: 'Jeux',
    es: 'Juegos',
    de: 'Spiele',
    ru: 'Игры',
    zh: '游戏',
    ja: 'ゲーム',
  },
  'خرید اشتراک': {
    fa: 'خرید اشتراک',
    en: 'Subscription Plans',
    ar: 'خطط الاشتراكات',
    tr: 'Abonelik Planları',
    fr: 'Abonnements',
    es: 'Suscripciones',
    de: 'Abonnements',
    ru: 'Подписки',
    zh: '订阅计划',
    ja: 'サブスクリプション',
  },
  'بلاگ و اخبار': {
    fa: 'بلاگ و اخبار',
    en: 'Blog & News',
    ar: 'المدونة والأخبار',
    tr: 'Blog ve Haberler',
    fr: 'Blog & Actualités',
    es: 'Blog y Noticias',
    de: 'Blog & News',
    ru: 'Блог и Новости',
    zh: '博客与新闻',
    ja: 'ブログ＆ニュース',
  },
  'ورود / ثبت‌نام': {
    fa: 'ورود / ثبت‌نام',
    en: 'Login / Register',
    ar: 'تسجيل الدخول / التسجيل',
    tr: 'Giriş / Kayıt',
    fr: 'Connexion / Inscription',
    es: 'Iniciar sesión / Registro',
    de: 'Anmelden / Registrieren',
    ru: 'Вход / Регистрация',
    zh: '登录 / 注册',
    ja: 'ログイン / 登録',
  },
  'داشبورد کاربری': {
    fa: 'داشبورد کاربری',
    en: 'User Dashboard',
    ar: 'لوحة التحكم',
    tr: 'Kullanıcı Paneli',
    fr: 'Tableau de Bord',
    es: 'Panel de Usuario',
    de: 'Benutzer-Dashboard',
    ru: 'Панель управления',
    zh: '用户仪表盘',
    ja: 'ダッシュボード',
  },
  'جستجوی بازی...': {
    fa: 'جستجوی بازی...',
    en: 'Search games...',
    ar: 'ابحث عن ألعاب...',
    tr: 'Oyun ara...',
    fr: 'Rechercher des jeux...',
    es: 'Buscar juegos...',
    de: 'Spiele suchen...',
    ru: 'Поиск игр...',
    zh: '搜索游戏...',
    ja: 'ゲームを検索...',
  },

  // 5-Type Download Terminology
  'دانلود دیتای اصلی': {
    fa: 'دانلود دیتای اصلی',
    en: 'Download Game Data',
    ar: 'تحميل بيانات اللعبة الأصلية',
    tr: 'Ana Oyun Verisini İndir',
    fr: 'Télécharger les Données du Jeu',
    es: 'Descargar Datos del Juego',
    de: 'Spieldaten herunterladen',
    ru: 'Скачать данные игры',
    zh: '下载游戏本体数据',
    ja: 'ゲーム本編データダウンロード',
  },
  'پکیج چیت و ترینر': {
    fa: 'پکیج چیت و ترینر',
    en: 'Cheat & Trainer Pack',
    ar: 'حزمة كود الغش والمدرب',
    tr: 'Hile ve Eğitici Paketi',
    fr: 'Pack de Cheats & Trainer',
    es: 'Paquete de Trucos y Trainer',
    de: 'Cheats & Trainer Paket',
    ru: 'Пакет читов и трейнеров',
    zh: '作弊码与修改器整合包',
    ja: 'チート＆トレーナーパック',
  },
  'بسته‌های الحاقی DLC': {
    fa: 'بسته‌های الحاقی DLC',
    en: 'DLC & Expansions',
    ar: 'حزم الإضافات والتوسعات DLC',
    tr: 'DLC ve Ek Paketler',
    fr: 'DLC & Extensions',
    es: 'DLC y Expansiones',
    de: 'DLC & Erweiterungen',
    ru: 'DLC и дополнения',
    zh: 'DLC 与拓展包',
    ja: 'DLC＆拡張パック',
  },
  'فارسی‌ساز و زیرنویس': {
    fa: 'فارسی‌ساز و زیرنویس',
    en: 'Subtitles & Localization',
    ar: 'الترجمة النصية والتعريب',
    tr: 'Altyazı ve Yerelleştirme',
    fr: 'Sous-titres & Traduction',
    es: 'Subtítulos y Traducción',
    de: 'Untertitel & Übersetzung',
    ru: 'Субтитры и локализация',
    zh: '字幕与本地化补丁',
    ja: '字幕＆ローカライズ',
  },
  'دوبله فارسی اختصاصی': {
    fa: 'دوبله فارسی اختصاصی',
    en: 'Voice Acting & Dubbing',
    ar: 'الدبلجة الصوتية الحصرية',
    tr: 'Özel Seslendirme ve Dublaj',
    fr: 'Doublage Vocal Exclusif',
    es: 'Doblaje de Voz Exclusivo',
    de: 'Exklusive Synchronisation',
    ru: 'Эксклюзивная озвучка',
    zh: '专属语音配音',
    ja: '専用吹き替え音声',
  },

  // Gaming Specs & Badges
  'حجم دانلود': {
    fa: 'حجم دانلود',
    en: 'Download Size',
    ar: 'حجم التنزيل',
    tr: 'İndirme Boyutu',
    fr: 'Taille du Téléchargement',
    es: 'Tamaño de Descarga',
    de: 'Download-Größe',
    ru: 'Размер загрузки',
    zh: '下载容量',
    ja: 'ダウンロードサイズ',
  },
  'امتیاز متاکریتیک': {
    fa: 'امتیاز متاکریتیک',
    en: 'Metacritic Score',
    ar: 'تقييم ميتاكريتيك',
    tr: 'Metacritic Puanı',
    fr: 'Score Metacritic',
    es: 'Puntuación Metacritic',
    de: 'Metacritic-Wertung',
    ru: 'Оценка Metacritic',
    zh: 'Metacritic 评分',
    ja: 'Metacritic スコア',
  },
  'تاریخ انتشار': {
    fa: 'تاریخ انتشار',
    en: 'Release Date',
    ar: 'تاريخ الإصدار',
    tr: 'Çıkış Tarihi',
    fr: 'Date de Sortie',
    es: 'Fecha de Lanzamiento',
    de: 'Veröffentlichungsdatum',
    ru: 'Дата выхода',
    zh: '发行日期',
    ja: '発売日',
  },
  'استودیو سازنده': {
    fa: 'استودیو سازنده',
    en: 'Developer Studio',
    ar: 'استوديو التطوير',
    tr: 'Geliştirici Stüdyo',
    fr: 'Studio Développeur',
    es: 'Estudio Desarrollador',
    de: 'Entwicklerstudio',
    ru: 'Студия-разработчик',
    zh: '开发工作室',
    ja: '開発スタジオ',
  },
  'ناشر': {
    fa: 'ناشر',
    en: 'Publisher',
    ar: 'الناشر',
    tr: 'Yayıncı',
    fr: 'Éditeur',
    es: 'Editor',
    de: 'Publisher',
    ru: 'Издатель',
    zh: '发行商',
    ja: 'パブリッシャー',
  },
  'قلب بازی و داستان': {
    fa: 'قلب بازی و داستان',
    en: 'Game Lore & Storyline',
    ar: 'قصة اللعبة وجوهرها',
    tr: 'Oyunun Hikayesi ve Özü',
    fr: 'Histoire & Univers du Jeu',
    es: 'Historia y Trama del Juego',
    de: 'Spielgeschichte & Handlung',
    ru: 'Сюжет и история игры',
    zh: '游戏核心与剧情背景',
    ja: 'ストーリー＆世界観',
  },
  'جوایز و افتخارات': {
    fa: 'جوایز و افتخارات',
    en: 'Awards & Accolades',
    ar: 'الجوائز والتكريمات',
    tr: 'Ödüller ve Başarılar',
    fr: 'Prix et Distinctions',
    es: 'Premios y Reconocimientos',
    de: 'Auszeichnungen & Ehrungen',
    ru: 'Награды и номинации',
    zh: '获奖与荣誉',
    ja: '受賞歴＆栄誉',
  },
  'قابلیت دونفره (Co-op)': {
    fa: 'قابلیت دونفره (Co-op)',
    en: 'Two-Player / Co-op',
    ar: 'نمط اللعب الثنائي (Co-op)',
    tr: 'İki Kişilik (Co-op)',
    fr: 'Multijoueur Co-op',
    es: 'Cooperativo para 2 Jugadores',
    de: 'Zwei-Spieler / Koop',
    ru: 'Кооператив для 2 игроков',
    zh: '双人合作 (Co-op)',
    ja: '2人協力プレイ (Co-op)',
  },
  'پشتیبانی از واقعیت مجازی (VR)': {
    fa: 'پشتیبانی از واقعیت مجازی (VR)',
    en: 'PlayStation VR Support',
    ar: 'دعم الواقع الافتراضي (VR)',
    tr: 'Sanal Gerçeklik (VR) Desteği',
    fr: 'Compatible PlayStation VR',
    es: 'Compatible con PlayStation VR',
    de: 'PlayStation VR-Unterstützung',
    ru: 'Поддержка PlayStation VR',
    zh: '支持 PlayStation VR 虚拟现实',
    ja: 'PlayStation VR 対応',
  },
  'دانلود رایگان': {
    fa: 'دانلود رایگان',
    en: 'Free Download',
    ar: 'تحميل مجاني',
    tr: 'Ücretsiz İndir',
    fr: 'Téléchargement Gratuit',
    es: 'Descarga Gratis',
    de: 'Kostenloser Download',
    ru: 'Скачать бесплатно',
    zh: '免费下载',
    ja: '無料ダウンロード',
  },
  'اشتراک طلایی لازم است': {
    fa: 'اشتراک طلایی لازم است',
    en: 'Gold Tier Required',
    ar: 'يتطلب اشتراك الباقة الذهبية',
    tr: 'Altın Plan Gereklidir',
    fr: 'Abonnement Or Requis',
    es: 'Requiere Plan Oro',
    de: 'Gold-Abo erforderlich',
    ru: 'Требуется подписка Gold',
    zh: '需要黄金会员订阅',
    ja: 'ゴールド会員限定',
  },
};

/**
 * Hash string for localStorage cache key
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Translates text on the client-side with instant localStorage caching.
 */
export async function translateTextClient(
  text: string,
  targetLang: SupportedLang
): Promise<string> {
  if (!text || text.trim() === '') return '';
  if (targetLang === 'fa') return text;

  const trimmed = text.trim();

  // 1. Direct dictionary match
  if (DICTIONARY[trimmed] && DICTIONARY[trimmed][targetLang]) {
    return DICTIONARY[trimmed][targetLang];
  }

  // 2. Check localStorage cache
  const cacheKey = `drgame_tr_${targetLang}_${simpleHash(trimmed)}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  // 3. Fallback dictionary substitution for common sub-phrases
  let result = trimmed;
  let translatedAny = false;
  for (const [faPhrase, translations] of Object.entries(DICTIONARY)) {
    if (result.includes(faPhrase) && translations[targetLang]) {
      result = result.replaceAll(faPhrase, translations[targetLang]);
      translatedAny = true;
    }
  }

  // 4. Cache and return
  if (translatedAny && typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, result);
    } catch {
      // Ignore quota exceptions
    }
  }

  return result;
}

/**
 * Synchronous dictionary translator for instant UI rendering without layout jumps.
 */
export function translateInstant(text: string, targetLang: SupportedLang): string {
  if (!text || targetLang === 'fa') return text;
  const trimmed = text.trim();

  if (DICTIONARY[trimmed] && DICTIONARY[trimmed][targetLang]) {
    return DICTIONARY[trimmed][targetLang];
  }

  if (typeof window !== 'undefined') {
    const cacheKey = `drgame_tr_${targetLang}_${simpleHash(trimmed)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  return text;
}
