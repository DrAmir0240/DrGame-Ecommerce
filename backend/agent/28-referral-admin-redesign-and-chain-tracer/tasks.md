<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و هشتم: بازطراحی پنل ادمین رفرال و مرکز رهگیری زنجیره (Tasks Checklist)

> **گام:** ۲۸  
> **عنوان:** بازطراحی کامل رابط کاربری و تجربه کاربری پنل ادمین رفرال، رفع باگ‌های برداشت و دسترسی `read_only`، تایید حساب‌های بانکی، و پیاده‌سازی مرکز سه‌بعدی رهگیری زنجیره رفرال (درخت چندسطحی + ردیاب آبشار سفارش + فهرست ریشه‌محور و ضدتقلب).  
> **وضعیت کلی:** ✅ پیاده‌سازی و تست‌های خودکار تکمیل شدند (نیازمند بررسی نهایی صفحات احراز هویت‌شده در مرورگر با اکانت ادمین واقعی)

---

### فاز ۱: اصلاح باگ‌های بحرانی و اندپوینت‌های جدید بک‌اند (`backend/`)
- [x] اصلاح قرارداد پردازش برداشت در [`referral_router.py`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/routers/referral_router.py), [`admin/services.py`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/services.py) و [`admin/schemas.py`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/schemas.py):
  - [x] اصلاح فراخوانی `AdminService.process_payout_request(db, request_id, payload.new_status, payload.admin_receipt_url, payload.admin_notes)` و ثبت `AdminAuditLog`.
  - [x] افزودن صفحه‌بندی، جستجو، فیلتر وضعیتی و خلاصه آماری به `GET /api/admin-referral/payouts` همراه با فیلدهای کامل حساب مقصد و نام کاربری.
- [x] ارتقای مدیریت حساب‌های بانکی و ولت:
  - [x] افزودن صفحه‌بندی، جستجو، فیلتر (`verified_filter`, `account_type`) و نام کاربر به `GET /api/admin-referral/settlement-accounts`.
  - [x] افزودن اندپوینت `PUT /api/admin-referral/settlement-accounts/{account_id}/verify` متصل به `AdminService.verify_settlement_account` + ثبت `AdminAuditLog`.
- [x] پیاده‌سازی اندپوینت نمای کلی داشبورد `GET /api/admin-referral/overview` (متریک‌های معوقه، برداشت‌ها، خزانه، حساب‌های منتظر بررسی، زنجیره‌ها، بلک‌لیست و صف اقدامات فوری).
- [x] پیاده‌سازی سرویس و اندپوینت‌های رهگیری سه‌بعدی زنجیره رفرال (`settlement_service.py` و `referral_router.py`):
  - [x] `GET /api/admin-referral/users/search` (جستجو با نام، یوزرنیم، موبایل، کد رفرال، کد ملی و ID).
  - [x] `GET /api/admin-referral/tree/roots` (ریشه‌های برتر شبکه با آمار زیرمجموعه و وضعیت).
  - [x] ارتقای `GET /api/admin-referral/tree/{user_id}` و افزودن `GET /api/admin-referral/tree/{user_id}/children` برای باز کردن چندسطحی درخت همراه با درصد موثر لایه‌ها، حساب‌ها، خریدهای اخیر و `anomaly_flags`.
  - [x] `GET /api/admin-referral/commissions/recent-orders` و `GET /api/admin-referral/orders/{order_payment_id}/trace` برای کالبدشکافی دقیق پورسانت ۲۱٪ هر سفارش.
  - [x] `GET /api/admin-referral/tree/{user_id}/simulate-waterfall` برای شبیه‌سازی Dry-Run مسیر پورسانت قبل از خرید.
  - [x] ارتقای `GET /api/admin-referral/chains` و `GET /api/admin-referral/blacklist` با جستجو، فیلتر وضعیت، ریشه کل (`root_user`)، عمق از ریشه و شاخص‌های ضدتقلب.
  - [x] افزودن `POST /api/admin-referral/settlement/release-selected` برای آزادسازی گروهی چند کاربر منتخب در یک بچ واحد.

---

### فاز ۲: اصلاح زیرساخت مشترک فرانت‌اند و کامپوننت‌های طراحی (`frontend/`)
- [x] اصلاح [`frontend/src/lib/apiClient.ts`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/lib/apiClient.ts):
  - [x] جلوگیری از پاک شدن توکن و ریدایرکت اجباری روی `403 Forbidden`.
  - [x] ریدایرکت صحیح خطای `401` دپارتمان‌ها به `/admin/{dept}/login` به‌جای `/admin/login`.
- [x] یکپارچه‌سازی تم و تجربه کاربری در کامپوننت‌های مشترک دپارتمان:
  - [x] پشتیبانی از رنگ تاکیدی دپارتمان (`rose` برای رفرال به‌جای `purple` هاردکد) در `DepartmentLayout.tsx`، `DepartmentLoginPage.tsx` و `DepartmentStaffManager.tsx`.
  - [x] افزودن قابلیت ویرایش همکار (`PUT /staff/{id}`) و مودال تایید حذف به‌جای `window.confirm` در `DepartmentStaffManager.tsx`.
- [x] ساخت کتابخانه کامپوننت‌های اختصاصی رفرال در `frontend/src/components/admin/referral/`:
  - [x] `AdminToast.tsx` (اعلان‌های شناور خطا و موفقیت)
  - [x] `CopyableValue.tsx` (اعداد و شماره‌های `dir="ltr"` + `tabular-nums` با کپی یک‌کلیک)
  - [x] `ReferralUserSearchInput.tsx` (Autocomplete سراسری کاربر)
  - [x] `BlacklistModals.tsx` (اشتراک‌گذاری مودال دوتیکه مسدودسازی و مودال رفع مسدودیت)
  - [x] `NodeInspectorDrawer.tsx` (کشوی بازرسی کامل گره با اکشن‌های مستقیم و مودال تایید `hidden`)
  - [x] `ReferralTreeGraph.tsx` (گراف درختی تعاملی SVG/HTML با اتصالات منحنی، نمایش مسیر بالادست تا ریشه، بازکردن لایه‌ها روی گراف، زوم/درگ و تنظیم خودکار در قاب)
  - [x] `CommissionWaterfallPanel.tsx` (ردیاب آبشار پورسانت ۲۱٪ هر سفارش واقعی — بخش شبیه‌ساز قبل خرید بنا به درخواست کاربر حذف شد)
- [x] به‌روزرسانی تایپ‌های [`frontend/src/types/referral.ts`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/types/referral.ts) و منوی ناوبری [`layout.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/(admin)/admin/referral/layout.tsx).

---

### فاز ۳: بازطراحی کامل تمام صفحات پنل ادمین رفرال (`frontend/src/app/(admin)/admin/referral/`)
- [x] **داشبورد نمای کلی (`page.tsx`):** ۶ کارت KPI زنده با `useTranslation()`، شمارشگر تسویه جمعه، صف اقدامات فوری و آخرین بچ‌ها.
- [x] **مرکز رهگیری زنجیره و لیست سیاه (`tree/page.tsx` و `chains/page.tsx`):**
  - [x] نمای ۱: جستجوی Omnibox + ریشه‌های برتر با سوییچ سریع + سوئیچر «نمای گرافی درختی / نمای لیستی بازشونده» (`ReferralTreeGraph` + `TreeBranchRow`) + مسیر بالادست تا ریشه + بخش آبشار مالی سفارش + `NodeInspectorDrawer`.
  - [x] نمای ۲: جدول ریشه‌محور زنجیره‌ها با صفحه‌بندی، فیلترهای سرورساید و هشدارهای ضدتقلب + انتقال با یک کلیک به درخت.
  - [x] نمای ۳: لیست سیاه با سرچ و صفحه‌بندی + دکمه افزودن مستقیم کاربر به بلک‌لیست از طریق جستجو.
  - [x] اعمال کامل گارد `read_only` بدون اجازه ارسال درخواست‌های تغییردهنده.
- [x] **مرکز تسویه پورسانت‌ها (`settlement/page.tsx`):** حذف مودال تکراری Dry-Run، افزودن سرچ/مرتب‌سازی/انتخاب چندتایی، و Drawer جزئیات هر بچ متصل به `/settlement/batches/{batch_code}`.
- [x] **درخواست‌های برداشت (`payouts/page.tsx`):** اتصال صحیح به `POST /process` (`approved`/`rejected`)، فیلتر تب‌بندی‌شده، نمایش شبا/کارت/ولت و نام/موبایل با کپی سریع، و قفل موارد بسته‌شده.
- [x] **حساب‌های بانکی (`accounts/page.tsx`):** سرچ، فیلتر، صفحه‌بندی، نمایش مالک و کدملی/موبایل، دکمه‌های تایید/رد حساب و گارد `read_only`.
- [x] **خزانه‌داری (`treasury/page.tsx`):** Autocomplete کاربر، فرمت سه‌رقمی خوانا در مبلغ، فیلتر نوع رویداد لاگ‌ها و گارد `read_only`.

---

### فاز ۴: نگارش تست‌ها و تایید نهایی گام ۲۸
- [x] نگارش تست‌های کامل بک‌اند در `backend/tests/test_referral_admin_redesign.py`.
- [x] اجرای پایپ‌لاین تست بک‌اند در داکر و پاس شدن ۱۰۰٪:
  - [x] `docker exec drgame-backend pytest -v tests/test_referral_blacklist.py tests/test_referral_admin_redesign.py` (۷ پاس)
  - [x] `docker exec drgame-backend pytest -q` (۱۲۰ پاس)
- [x] بررسی بدون خطا بودن TypeScript و Build فرانت‌اند در داکر:
  - [x] `docker exec drgame-frontend npx tsc --noEmit && docker exec drgame-frontend npm run build` (۶۰ صفحه)
- [ ] بازبینی ظاهری و ریسپانسیو صفحات پنل رفرال در مرورگر (دسکتاپ و موبایل) پس از لاگین با اکانت ادمین واقعی:
  - [x] بررسی Chromium بدون لاگین روی دسکتاپ (`1440x900`) و موبایل (`390x844`): صفحه `/admin/referral/login` و ریدایرکت گارد تمامی ۹ مسیر `/admin/referral/*` با `scrollWidth === innerWidth` و صفر خطای کنسول/JS، به‌علاوه تست واحد `apiRequest` برای حفظ سشن در `403` و ریدایرکت در `401`.
  - [ ] بازبینی تعاملی صفحات محافظت‌شده پس از ورود با اعتبارنامه ادمین رفرال (نیازمند ورود با اکانت واقعی).

</div>
