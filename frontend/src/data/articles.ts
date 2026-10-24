export interface Article {
  slug: string;
  titleFa: string;
  titleEn: string;
  excerptFa: string;
  excerptEn: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  dateFa: string;
  dateEn: string;
  readTimeFa: string;
  readTimeEn: string;
  category: string;
  image: string;
  tags: string[];
  views: number;
  likes: number;
  dislikes: number;
  contentFa: {
    heading?: string;
    paragraphs: string[];
  }[];
  contentEn: {
    heading?: string;
    paragraphs: string[];
  }[];
}

export const ARTICLES: Article[] = [
  {
    slug: "ps5-pro-enhanced-analysis",
    titleFa: "بررسی جامع عملکرد بازی‌ها روی کنسول PS5 Pro و فناوری PSSR",
    titleEn: "PS5 Pro Performance Deep Dive: PSSR & Advanced Ray Tracing",
    excerptFa: "کنسول میان‌نسلی سونی چگونه بازی‌های بزرگ نظیر Final Fantasy VII Rebirth و Alan Wake 2 را متحول کرده است؟",
    excerptEn: "How Sony's mid-gen refresh enhances flagship titles with high framerates and clean upscaling.",
    author: {
      name: "تیم تحریریه دکتر گیم",
      role: "تحلیل‌گر ارشد سخت‌افزار",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    dateFa: "۲ آبان ۱۴۰۵",
    dateEn: "Oct 24, 2026",
    readTimeFa: "۶ دقیقه مطالعه",
    readTimeEn: "6 min read",
    category: "سخت‌افزار و لوازم جانبی",
    image: "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
    tags: ["#PS5_Pro", "#PSSR", "#RayTracing", "#Hardware"],
    views: 3840,
    likes: 312,
    dislikes: 14,
    contentFa: [
      {
        heading: "مقدمه و معماری پردازشی ارتقایافته",
        paragraphs: [
          "کنسول پلی‌استیشن ۵ پرو با هدف از میان برداشتن مصالحه سنتی میان حالت‌های گرافیکی کیفی (Fidelity) و روان (Performance) معرفی شد. بازیکنان دیگر ناچار به انتخاب میان رزولوشن شفاف ۳۰ فریم بر ثانیه یا تصویر تار ۶۰ فریم نیستند.",
          "هسته اصلی این تحول بر سه ستون اساسی استوار است: ارتقای پردازنده گرافیکی با ۴۵ درصد توان رندرینگ بالاتر، شتاب‌دهنده اختصاصی هوش مصنوعی برای تکنیک ارتقای مقیاس طیفی پلی‌استیشن (PSSR)، و واحدهای سخت‌افزاری رهگیری پرتو (Advanced Ray Tracing) با توان پردازش دو تا سه برابری نسبت به مدل استاندارد.",
        ],
      },
      {
        heading: "فناوری ارتقای تصویر مبتنی بر هوش مصنوعی (PSSR)",
        paragraphs: [
          "تکنولوژی PlayStation Spectral Super Resolution با استفاده از شبکه‌های یادگیری ماشین، فریم‌های با رزولوشن داخلی پایین‌تر (مانند 1080p یا 1440p) را دریافت کرده و جزئیات فوق‌العاده با وضوح 4K را با بالاترین وفاداری ممکن بازسازی می‌کند.",
          "در آزمایش‌های میدانی ما روی بازی Alan Wake 2، لبه‌های شفاف شاخ و برگ درختان و بازتاب‌های نور در شیشه‌ها پایداری بی‌نظیری نشان دادند و آرتیفکت‌های شایع در روش‌های سنتی بازسازی تصویر به طور کامل حذف شدند.",
        ],
      },
      {
        heading: "عملکرد ردیابی پرتو (Ray Tracing) و مقایسه با PS5 استاندارد",
        paragraphs: [
          "به لطف معماری بهبودیافته RDNA، بازتاب‌های شیشه‌ها و سطوح فلزی در عناوینی چون Marvel's Spider-Man 2 بدون افت نرخ فریم به زیر ۶۰ فریم بر ثانیه محاسبه می‌شوند. این تجربه نشان‌دهنده یک جهش واقعی در کنسول‌های خانگی است.",
        ],
      },
    ],
    contentEn: [
      {
        heading: "Introduction & Enhanced GPU Architecture",
        paragraphs: [
          "PlayStation 5 Pro was engineered to eliminate the classic compromise between Fidelity (30fps) and Performance (60fps) modes.",
          "The core upgrade centers on three pillars: a GPU with 45% faster rendering capabilities, machine learning silicon dedicated to PlayStation Spectral Super Resolution (PSSR), and custom ray tracing hardware achieving up to 3x throughput.",
        ],
      },
      {
        heading: "AI-Powered PlayStation Spectral Super Resolution",
        paragraphs: [
          "PSSR utilizes trained neural network models to reconstruct crisp 4K imagery from lower internal render buffers, preserving hair, foliage, and geometric edges with remarkable temporal stability.",
        ],
      },
    ],
  },
  {
    slug: "goldhen-ps4-1100-guide",
    titleFa: "آموزش کامل جیلبریک PS4 فریم‌ورک ۱۱.۰۰ با روش PPPwn",
    titleEn: "Complete PS4 11.00 Jailbreak Guide using PPPwn C++",
    excerptFa: "راهنمای اتصال کابل اترنت LAN، ارسال پکت‌های PPPoE و اجرای بدون باگ پکیج‌های FPKG.",
    excerptEn: "Step-by-step ethernet LAN packet injection and FPKG package installation.",
    author: {
      name: "واحد مهندسی نرم‌افزار",
      role: "متخصص جیلبریک و سیستم‌عامل",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    },
    dateFa: "۲۸ مهر ۱۴۰۵",
    dateEn: "Oct 20, 2026",
    readTimeFa: "۸ دقیقه مطالعه",
    readTimeEn: "8 min read",
    category: "آموزش‌های تخصصی جیلبریک",
    image: "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    tags: ["#GoldHEN", "#Jailbreak", "#PPPwn", "#PS4"],
    views: 7920,
    likes: 840,
    dislikes: 29,
    contentFa: [
      {
        heading: "پیش‌نیازها و سخت‌افزارهای مورد نیاز",
        paragraphs: [
          "برای اجرای این متد به یک دستگاه کامپیوتر یا رزبری‌پای، کابل شبکه اترنت Cat6، یک فلش مموری فرمت شده با ساختار exFAT، و فریم‌ورک دقیق ۱۱.۰۰ روی کنسول PS4 نیاز دارید.",
          "توجه فرمایید که اگر کنسول شما به نسخه‌های بالاتر از ۱۱.۰۰ آپدیت شده است، امکان دانگرید نرم‌افزاری وجود ندارد و نباید آپدیت‌های بعدی را نصب کنید.",
        ],
      },
      {
        heading: "مراحل تنظیم شبکه PPPoE روی کنسول",
        paragraphs: [
          "وارد بخش Settings کنسول شده و در قسمت Network گزینه Set Up Internet Connection را انتخاب کنید. روش اتصال را روی Use a LAN Cable قرار دهید و حالت Custom را برگزینید.",
          "در بخش IP Address Settings گزینه PPPoE را انتخاب کرده و برای نام کاربری و پسورد مقادیر دلخواهی مانند ppp وارد نمایید. سایر تنظیمات (DNS و MTU) را به حالت اتوماتیک بگذارید.",
        ],
      },
      {
        heading: "ارسال Payload و اجرای GoldHEN",
        paragraphs: [
          "ابزار PPPwn C++ GUI را روی رایانه اجرا کرده و کارت شبکه متصل به کنسول را انتخاب کنید. فایل stage2.bin متناسب با نسخه ۱۱.۰۰ را تعیین کرده و کلید Run Exploit را بفشارید. پس از چند لحظه پیام موفقیت‌آمیز GoldHEN روی صفحه نمایش تلویزیون ظاهر خواهد شد.",
        ],
      },
    ],
    contentEn: [
      {
        heading: "Hardware Requirements",
        paragraphs: [
          "You will need a PC or Raspberry Pi, an Ethernet Cat6 patch cable, an exFAT formatted USB drive, and a PlayStation 4 console running firmware 11.00.",
        ],
      },
    ],
  },
  {
    slug: "dualsense-drift-prevention",
    titleFa: "راهنمای پیشگیری و کالیبراسیون دریفت شوک‌های آنالوگ دسته DualSense",
    titleEn: "DualSense Stick Drift Prevention & Deadzone Calibration",
    excerptFa: "بررسی دلایل فرسایش پتانسیومترها و نحوه سنجش ددزون با ابزارهای تست WebHID دکتر گیم.",
    excerptEn: "Understanding potentiometer wear and calibrating deadzones via WebHID diagnostic tools.",
    author: {
      name: "مهندسی سخت‌افزار",
      role: "تکنسین تعمیرات و الکترونیک",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    },
    dateFa: "۲۵ مهر ۱۴۰۵",
    dateEn: "Oct 17, 2026",
    readTimeFa: "۵ دقیقه مطالعه",
    readTimeEn: "5 min read",
    category: "راهنما و ترفندهای کنسول",
    image: "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
    tags: ["#DualSense", "#Hardware", "#Calibration", "#Drift"],
    views: 4510,
    likes: 420,
    dislikes: 8,
    contentFa: [
      {
        heading: "دلایل فنی ایجاد خطای دریفت در ماژول‌های آنالوگ",
        paragraphs: [
          "اغلب کنترلرهای نسل جدید از سنسورهای پتانسیومتری فیلم کربنی استفاده می‌کنند که با هر حرکت فیزیکی دچار سایش میکروسکوپی و انباشت غبار کربن می‌شوند. این عامل موجب ایجاد نوسان ولتاژ نامنظم و ارسال ورودی‌های تصادفی به پردازنده می‌شود.",
        ],
      },
      {
        heading: "روش‌های کالیبراسیون نرم‌افزاری و تنظیم ددزون",
        paragraphs: [
          "پیش از تعویض قطعه فیزیکی یا رفتن به سراغ سنسورهای مغناطیسی Hall Effect، با استفاده از صفحه تست اختصاصی دسته در وبسایت دکتر گیم، میزان انحراف مرکز دایره (Deadzone) و خطای دایره‌ای (Circular Error) را به دقت میلی‌متر اندازه‌گیری نمایید.",
        ],
      },
    ],
    contentEn: [
      {
        heading: "Root Causes of Analog Stick Drift",
        paragraphs: [
          "DualSense potentiometers rely on carbon resistive tracks that experience micro-abrasion over continuous cycles, creating voltage anomalies.",
        ],
      },
    ],
  },
  {
    slug: "best-coop-games-2026",
    titleFa: "بهترین بازی‌های کوآپ و دونفره خانوادگی برای پلی‌استیشن ۵",
    titleEn: "Top Co-op & Multiplayer Games on PlayStation 5",
    excerptFa: "معرفی عناوین سرگرم‌کننده چندنفره محلی (Split-Screen) با پشتیبانی کامل از بازخورد لمسی کنترلر.",
    excerptEn: "Curated local split-screen multiplayer games supporting DualSense haptic feedback.",
    author: {
      name: "آرمان رحیمی",
      role: "منتقد بازی و رسانه",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    dateFa: "۲۱ مهر ۱۴۰۵",
    dateEn: "Oct 13, 2026",
    readTimeFa: "۷ دقیقه مطالعه",
    readTimeEn: "7 min read",
    category: "نقد و بررسی تخصصی بازی‌ها",
    image: "https://media.rawg.io/media/games/618/618c204facf0e8da3719859ec7680224.jpg",
    tags: ["#Coop", "#Multiplayer", "#PS5", "#Gaming"],
    views: 2980,
    likes: 275,
    dislikes: 12,
    contentFa: [
      {
        heading: "لذت بازی‌های چندنفره محلی در عصر اتصالات ابری",
        paragraphs: [
          "در روزگاری که بیشتر تجربیات چندنفره به بخش آنلاین منتقل شده‌اند، بازی‌های دورهمی با صفحه تقسیم‌شده (Split-screen) حس نوستالژیک و نشاط‌آوری به همراه دارند که هیچ بازی آنلاینی توانایی شبیه‌سازی آن را ندارد.",
          "عناوینی نظیر It Takes Two، Sackboy: A Big Adventure، و Overcooked! All You Can Eat شاهکارهایی هستند که تک‌تک اعضای خانواده را درگیر خنده و همکاری تیمی می‌کنند.",
        ],
      },
    ],
    contentEn: [
      {
        heading: "The Timeless Joy of Couch Co-op",
        paragraphs: [
          "While online multiplayer dominates modern gaming, nothing matches the infectious energy of sitting side-by-side with a friend or family member on the couch.",
        ],
      },
    ],
  },
];
