<div dir="rtl" lang="fa">

# سند آواتارهای واقعی سورس و ارتقای ویش‌لیست (05 - Profile Avatars & Wishlist)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/05-profile-avatars-and-wishlist.md`

---

## ۱. ریشه‌یابی و حل مشکل آواتارهای پروفایل

### ریشه‌یابی نقص:
در کامپوننت `AvatarSelectorModal.tsx`، به جای تصویر چهره کاراکترهای دنیای پلی‌استیشن، صرفاً دو حرف اول نام آن‌ها (Initials مانند "KR", "EL", "AB") داخل یک دایره گرادینت رنگی رندر می‌شد که فاقد هرگونه جذابیت گیمری بود.

### کشف و ادغام کاتالوگ ۲۰ آواتار رسمی CDN سونی:
در سورس مرجع `sources/GameDr-Website-Source/website/public/avatar-catalog.js`، فهرست ۲۰ آواتار باکیفیت بالا از CDN رسمی شبکه پلی‌استیشن با آدرس‌های مستقیم وجود دارد:

```typescript
export interface PSAvatarItem {
  id: string;
  nameFa: string;
  nameEn: string;
  image: string;
}

export const OFFICIAL_PS_AVATARS: PSAvatarItem[] = [
  { id: "kratos", nameFa: "کریتوس", nameEn: "Kratos", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2001_xl.png" },
  { id: "atreus", nameFa: "آترئوس", nameEn: "Atreus", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2002_xl.png" },
  { id: "ellie", nameFa: "الی", nameEn: "Ellie", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2073_xl.png" },
  { id: "joel", nameFa: "جوئل", nameEn: "Joel", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2080_xl.png" },
  { id: "aloy", nameFa: "اِلوی", nameEn: "Aloy", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2096_xl.png" },
  { id: "ratchet", nameFa: "رچت", nameEn: "Ratchet", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2103_xl.png" },
  { id: "sackboy", nameFa: "سک‌بوی", nameEn: "Sackboy", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2109_xl.png" },
  { id: "spider-man", nameFa: "مرد عنکبوتی", nameEn: "Spider-Man", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2114_xl.png" },
  { id: "miles-morales", nameFa: "مایلز مورالس", nameEn: "Miles Morales", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2117_xl.png" },
  { id: "nathan-drake", nameFa: "نیتن دریک", nameEn: "Nathan Drake", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/UP90001004025_XL.png" },
  { id: "bloodborne-hunter", nameFa: "شکارچی بلادبورن", nameEn: "Bloodborne Hunter", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_J/J2060_xl.png" },
  { id: "jak", nameFa: "جک", nameEn: "Jak", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A0005_XL.png" },
  { id: "journey-traveler", nameFa: "مسافر Journey", nameEn: "Journey Traveler", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2011_xl.png" },
  { id: "astro-bot", nameFa: "آسترو بات", nameEn: "Astro Bot", image: "https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/JP9000/PPSA21559_00-PREORDERAVATAR01_C931593F47B5D7394549_xl.png" },
  { id: "jin-sakai", nameFa: "جین ساکای", nameEn: "Jin Sakai", image: "https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/EP9000/CUSA13323_00-AV00000000000001_62CCBEC7437D02076B02_xl.png" },
  { id: "dina", nameFa: "دینا", nameEn: "Dina", image: "https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/wvJCTO4Ez6oxbTOLRK8HAHU4I9lo2rlo.png" },
  { id: "jesse", nameFa: "جسی", nameEn: "Jesse", image: "https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/QnccaKZCCOY0iTi1QEJgLYKJ0zhkQgB7.png" },
  { id: "elena-fisher", nameFa: "النا فیشر", nameEn: "Elena Fisher", image: "https://image.api.playstation.com/cdn/HP9000/CUSA00912_00/AzZf7nNNJj6KmPv8OlGDoEXMSHfqlyNGKmaBvR6i0nSNqEdYePetmTN00M4n1rOK.png" },
  { id: "sly-cooper", nameFa: "اسلای کوپر", nameEn: "Sly Cooper", image: "https://image.api.playstation.com/cdn/UP9000/CUSA00223_00/w1ucD8fBBxPnnDJ7CNJoDLTw0D76zt15.png" },
];
```

### رندرینگ در `AvatarSelectorModal.tsx`:
```tsx
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto p-1">
  {OFFICIAL_PS_AVATARS.map((av) => {
    const isSelected = selectedAvatarId === av.id;
    return (
      <button
        key={av.id}
        type="button"
        onClick={() => handleSelect(av)}
        className={`group relative p-2 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
          isSelected
            ? "border-purple-500 bg-purple-600/20 shadow-[0_0_20px_rgba(124,58,237,0.4)]"
            : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
        }`}
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40">
          <img
            src={av.image}
            alt={av.nameFa}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {isSelected && (
            <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center">
              <Check className="w-6 h-6 text-white stroke-[3]" />
            </div>
          )}
        </div>
        <span className="text-[11px] font-bold text-white text-center truncate w-full">
          {t(av.nameFa, av.nameEn)}
        </span>
      </button>
    );
  })}
</div>
```

---

## ۲. ارتقای کتابخانه بازی و ویش‌لیست (My Games Library)

### ریشه‌یابی نقص:
در تب کتابخانه بازی‌ها (`panel/page.tsx?tab=library`):
1. هیچ دکمه‌ای برای حذف مستقیم بازی از کتابخانه تعبیه نشده بود.
2. دکمه دانلود، کاربر را به بالای صفحه بازی هدایت می‌کرد و کاربر مجدداً مجبور بود به دنبال باکس دانلود بگردد.

### پیاده‌سازی لاجیک حذف و هدایت هدفمند دانلود:
در فایل `frontend/src/app/panel/page.tsx`:

```tsx
// استیت و تابع حذف از کتابخانه
const [libraryGames, setLibraryGames] = useState(GAMES.slice(0, 4));

const handleRemoveFromLibrary = (slug: string, title: string) => {
  setLibraryGames((prev) => prev.filter((g) => g.slug !== slug));
  // ثبت در استوریج یا کال اندپوینت DELETE
  try {
    const saved = JSON.parse(localStorage.getItem("drgame_library") || "[]");
    localStorage.setItem("drgame_library", JSON.stringify(saved.filter((s: string) => s !== slug)));
  } catch (e) {}
};

// رندر کارت‌های کتابخانه
{libraryGames.map((g) => (
  <div
    key={g.slug}
    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 group hover:border-purple-500/30 transition-all"
  >
    <div className="flex items-center gap-3 min-w-0">
      <img src={g.image} alt="" className="w-12 h-16 rounded-lg object-cover shrink-0" />
      <div className="truncate">
        <h4 className="font-bold text-white text-xs md:text-sm truncate">{g.title}</h4>
        <span className="text-[11px] text-slate-400 font-mono block">
          {n(g.sizeGb)} GB · آماده دانلود FPKG
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      {/* دکمه دانلود با انکر اختصاصی به باکس دانلود */}
      <Link
        href={`/shop/${g.slug}#game-files-section`}
        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all hover:scale-105"
      >
        <Download className="w-3.5 h-3.5" />
        <span>دانلود دیتا</span>
      </Link>

      {/* دکمه حذف مستقیم از ویش‌لیست */}
      <button
        type="button"
        onClick={() => handleRemoveFromLibrary(g.slug, g.title)}
        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
        title="حذف از کتابخانه"
        aria-label="Remove from library"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
))}
```

</div>
