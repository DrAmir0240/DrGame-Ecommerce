/**
 * High-performance Lexicon for instant translation of frequent gaming & e-commerce terms.
 * Zero network, zero latency, runs synchronously in < 0.1ms.
 */

export interface LexiconEntry {
  en: string;
  ar: string;
}

export const DYNAMIC_LEXICON: Record<string, LexiconEntry> = {
  // --- Platforms ---
  'پلی استیشن ۵': { en: 'PlayStation 5', ar: 'بلايستيشن 5' },
  'پلی استیشن 5': { en: 'PlayStation 5', ar: 'بلايستيشن 5' },
  'پلی استیشن ۴': { en: 'PlayStation 4', ar: 'بلايستيشن 4' },
  'پلی استیشن 4': { en: 'PlayStation 4', ar: 'بلايستيشن 4' },
  'ایکس باکس سری اس': { en: 'Xbox Series S', ar: 'إكسبوكس سيريس إس' },
  'ایکس باکس سری ایکس': { en: 'Xbox Series X', ar: 'إكسبوكس سيريس إكس' },
  'ایکس باکس وان': { en: 'Xbox One', ar: 'إكسبوكس ون' },
  'ایکس باکس': { en: 'Xbox', ar: 'إكسبوكس' },
  'استیم': { en: 'Steam', ar: 'ستيم' },
  'کامپیوتر': { en: 'PC', ar: 'الكمبيوتر' },
  'نینتندو سوییچ': { en: 'Nintendo Switch', ar: 'نينتندو سويتش' },

  // --- Capacities & Account Types ---
  'اکانت قانونی': { en: 'Legal Account', ar: 'حساب قانوني' },
  'اکانت ظرفیتی': { en: 'Capacity Account', ar: 'حساب بسعة' },
  'ظرفیت کامل': { en: 'Full Capacity', ar: 'السعة الكاملة' },
  'ظرفیت اول': { en: 'Capacity 1', ar: 'السعة 1' },
  'ظرفیت دوم': { en: 'Capacity 2', ar: 'السعة 2' },
  'ظرفیت سوم': { en: 'Capacity 3', ar: 'السعة 3' },
  'ظرفیت ۲': { en: 'Capacity 2', ar: 'السعة 2' },
  'ظرفیت ۳': { en: 'Capacity 3', ar: 'السعة 3' },
  'ظرفیت ۱': { en: 'Capacity 1', ar: 'السعة 1' },
  'ظرفیت اختصاصی': { en: 'Dedicated Capacity', ar: 'سعة مخصصة' },
  'سی دی کی': { en: 'CD Key', ar: 'مفتاح المنتج' },
  'گیفت کارت': { en: 'Gift Card', ar: 'بطاقة هدايا' },
  'اشتراک': { en: 'Subscription', ar: 'اشتراك' },
  'پلاس': { en: 'Plus', ar: 'بلس' },

  // --- Regions ---
  'ریجن ترکیه': { en: 'Turkey Region', ar: 'ريجن تركيا' },
  'ریجن آمریکا': { en: 'US Region', ar: 'ريجن أمريكا' },
  'ریجن انگلیس': { en: 'UK Region', ar: 'ريجن بريطانيا' },
  'ریجن اوکراین': { en: 'Ukraine Region', ar: 'ريجن أوكرانيا' },
  'ریجن اروپا': { en: 'Europe Region', ar: 'ريجن أوروبا' },
  'ریجن آرژانتین': { en: 'Argentina Region', ar: 'ريجن الأرجنتين' },
  'ریجن هند': { en: 'India Region', ar: 'ريجن الهند' },
  'ریجن ایران': { en: 'Iran Region', ar: 'ريجن إيران' },
  'گلوبال': { en: 'Global', ar: 'عالمي' },

  // --- Statuses & Tags ---
  'تحویل فوری': { en: 'Instant Delivery', ar: 'تسليم فوري' },
  'تحویل آنی': { en: 'Instant Delivery', ar: 'تسليم فوري' },
  'تحویل ۱ الی ۳ ساعت': { en: '1 to 3 Hours Delivery', ar: 'تسليم خلال 1 إلى 3 ساعات' },
  'موجود در انبار': { en: 'In Stock', ar: 'متوفر في المخزن' },
  'موجود': { en: 'In Stock', ar: 'متوفر' },
  'ناموجود': { en: 'Out of Stock', ar: 'غير متوفر' },
  'پیش خرید': { en: 'Pre-Order', ar: 'طلب مسبق' },
  'تخفیف ویژه': { en: 'Special Discount', ar: 'خصم خاص' },
  'گارانتی دائم': { en: 'Lifetime Warranty', ar: 'ضمان دائم' },
  'گارانتی تعویض': { en: 'Replacement Warranty', ar: 'ضمان استبدال' },
  'پشتیبانی ۲۴ ساعته': { en: '24/7 Support', ar: 'دعم 24/7' },
  'پرفروش': { en: 'Best Seller', ar: 'الأكثر مبيعاً' },
  'جدید': { en: 'New', ar: 'جديد' },
  'ویژه': { en: 'Featured', ar: 'مميز' },

  // --- Common Categories & Genres ---
  'بازی های کنسول': { en: 'Console Games', ar: 'ألعاب الكونسول' },
  'بازی های کامپیوتر': { en: 'PC Games', ar: 'ألعاب الكمبيوتر' },
  'بازی های رایگان': { en: 'Free Games', ar: 'ألعاب مجانية' },
  'اکشن': { en: 'Action', ar: 'أكشن' },
  'ماجراجویی': { en: 'Adventure', ar: 'مغامرة' },
  'شوتر': { en: 'Shooter', ar: 'إطلاق نار' },
  'نقش آفرینی': { en: 'RPG', ar: 'تقمص أدوار' },
  'ورزشی': { en: 'Sports', ar: 'رياضة' },
  'مسابقه‌ای': { en: 'Racing', ar: 'سباقات' },
  'استراتژیک': { en: 'Strategy', ar: 'استراتيجية' },
  'ترسناک': { en: 'Horror', ar: 'رعب' },
  'شبیه‌ساز': { en: 'Simulation', ar: 'محاكاة' },
  'معمایی': { en: 'Puzzle', ar: 'ألغاز' },
  'پازل': { en: 'Puzzle', ar: 'ألغاز' },
  'مبارزه‌ای': { en: 'Fighting', ar: 'قتال' },
  'جهان باز': { en: 'Open World', ar: 'عالم مفتوح' },
  'خانوادگی': { en: 'Family', ar: 'عائلي' },
  'آموزش': { en: 'Tutorials', ar: 'شروحات' },
  'اخبار': { en: 'News', ar: 'أخبار' },
  'راهنما': { en: 'Guide', ar: 'دليل' },
  'نقد و بررسی و مقالات': { en: 'Reviews & Articles', ar: 'المراجعات والمقالات' },
  'اخبار و رویدادهای کنسول': { en: 'Console News & Events', ar: 'أخبار وفعاليات الكونسول' },
  'آموزش و انتقال دیتا': { en: 'Tutorials & Data Transfer', ar: 'الشروحات ونقل البيانات' },
  'آموزش و راهنما': { en: 'Tutorials & Guides', ar: 'الشروحات والأدلة' },
  'نقد و بررسی': { en: 'Reviews', ar: 'المراجعات' },
  'اخبار و مقالات': { en: 'News & Articles', ar: 'الأخبار والمقالات' },

  // --- Parts, Downloads & Tiers ---
  'پیشنهاد ویژه': { en: 'Special Offer', ar: 'عرض خاص' },
  'بازی جدید': { en: 'New Game', ar: 'لعبة جديدة' },
  'پارت اول': { en: 'Part 1', ar: 'الجزء 1' },
  'پارت دوم': { en: 'Part 2', ar: 'الجزء 2' },
  'پارت سوم': { en: 'Part 3', ar: 'الجزء 3' },
  'پارت چهارم': { en: 'Part 4', ar: 'الجزء 4' },
  'پارت پنجم': { en: 'Part 5', ar: 'الجزء 5' },
  'فایل دیتا': { en: 'Data File', ar: 'ملف البيانات' },
  'دیتا اصلی': { en: 'Main Data', ar: 'البيانات الأساسية' },
  'زیرنویس فارسی': { en: 'Persian Subtitle', ar: 'ترجمة فارسية' },
  'دوبله فارسی': { en: 'Persian Dubbing', ar: 'دبلجة فارسية' },
  'چیت و ترینر': { en: 'Cheats & Trainer', ar: 'غش وتدريب' },
  'محتوای دانلودی': { en: 'DLC', ar: 'محتوى قابل للتحميل' },
  'اشتراک برنزی': { en: 'Bronze Subscription', ar: 'اشتراك برونزي' },
  'اشتراک نقره‌ای': { en: 'Silver Subscription', ar: 'اشتراك فضي' },
  'اشتراک طلایی': { en: 'Gold Subscription', ar: 'اشتراك ذهبي' },
  'اشتراک رایگان': { en: 'Free Subscription', ar: 'اشتراك مجاني' },
  'طرح رایگان': { en: 'Free Plan', ar: 'الخطة المجانية' },
  'طرح برنزی': { en: 'Bronze Plan', ar: 'الخطة البرونزية' },
  'طرح نقره‌ای': { en: 'Silver Plan', ar: 'الخطة الفضية' },
  'طرح طلایی': { en: 'Gold Plan', ar: 'الخطة الذهبية' },

  // --- Plan Features ---
  'دانلود نامحدود': { en: 'Unlimited Download', ar: 'تحميل غير محدود' },
  'سرعت دانلود حداکثری': { en: 'Maximum Download Speed', ar: 'أقصى سرعة تحميل' },
  'پشتیبانی اختصاصی': { en: 'Dedicated Support', ar: 'دعم مخصص' },
  'امکان بازی آنلاین': { en: 'Online Play Support', ar: 'إمكانية اللعب أونلاين' },
  'بازی آفلاین بدون محدودیت': { en: 'Unlimited Offline Play', ar: 'لعب أوفلاين بلا حدود' },
};

/**
 * Attempts to translate string using the lexicon.
 * 1. Checks exact match.
 * 2. If no exact match, replaces known tokens (e.g. "اکانت قانونی ... ظرفیت ۲").
 */
export function translateWithLexicon(
  text: string,
  targetLang: 'en' | 'ar'
): { translated: string; isFullyTranslated: boolean } {
  if (!text || typeof text !== 'string') {
    return { translated: '', isFullyTranslated: true };
  }

  const trimmed = text.trim();

  // 1. Exact match
  const exact = DYNAMIC_LEXICON[trimmed];
  if (exact && exact[targetLang]) {
    return { translated: exact[targetLang], isFullyTranslated: true };
  }

  // 2. Token-based replacement for composite product titles
  let workingText = trimmed;
  let replacedCount = 0;

  // Sort keys by length descending to replace longest phrases first
  const keys = Object.keys(DYNAMIC_LEXICON).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (workingText.includes(key)) {
      const replacement = DYNAMIC_LEXICON[key][targetLang];
      if (replacement) {
        workingText = workingText.split(key).join(replacement);
        replacedCount++;
      }
    }
  }

  // If no Persian/Arabic characters remain, or if replacements were made, return
  const hasRemainingPersian = /[\u0600-\u06FF]/.test(workingText);

  return {
    translated: workingText,
    isFullyTranslated: !hasRemainingPersian && replacedCount > 0,
  };
}

