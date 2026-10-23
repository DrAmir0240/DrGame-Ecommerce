# Branch Ledger: Subscription Referral and Save Box Proposal

## English

### Purpose

Branch Ledger records subscription sales, follows the referral path connected to each buyer, and calculates the resulting allocations. The goal is to make each payment traceable: the shop allocation, each upline’s commission, the CEO’s share, and the Save Box contribution are shown in a ledger. A referral or account registration by itself does not create a payment; allocations are created by paid subscription sales.

### People and subscriptions

The CEO / Shop Owner is the root of the referral tree and is not a user in the network. Employees and customers are both users. Employees sit directly under the CEO. A customer may be referred by an employee or another customer, allowing the tree to continue without a fixed depth limit.

Each user needs an active subscription to receive commissions from lower-level sales. The default subscription term is one calendar month. A renewal made before expiry extends the current term; a renewal after expiry begins a new term on the payment date. When an upline’s subscription is inactive at the time a lower-level sale is paid, that upline’s calculated share is credited to the CEO. It is not redistributed to other users or paid back after renewal. The CEO is exempt from subscription requirements.

### Sale allocation and commission waterfall

The default plans are Bronze at 700,000, Silver at 1,500,000, and Gold at 3,000,000. Calculations use the amount the buyer actually pays after any discount. By default, 79% is recorded as the shop allocation and the full 21% becomes the referral pool. The buyer does not earn commission on their own purchase.

The full referral pool enters the waterfall. No fixed portion is removed for the Save Box in advance. Starting with the buyer’s direct upline, each user receives half of the amount still remaining. This produces 50% of the original pool for the direct upline, 25% for the next, 12.5% for the one above, and continues halving at each user level. Once the chain reaches the CEO row, the remaining amount is divided equally between the CEO / Shop Owner Pocket and the separate Save Box. If no user upline is linked, the entire referral pool is the CEO-row remainder and is split equally between those two accounts.

For example, a full-price Bronze sale of 700,000 gives the shop 553,000 and creates a 147,000 referral pool. With two user uplines, the direct upline receives 73,500 and the next upline receives 36,750. The remaining 36,750 is split into 18,375 for the CEO and 18,375 for the Save Box. The number of users in the upline chain changes the size of the remainder and therefore changes the Save Box contribution.

### Save Box discounts

The Save Box is a separate balance, even though it receives its contribution from the same referral waterfall. The default welcome discount is 5% off a user’s first paid subscription. The app checks the cleared Save Box balance before the sale, requires enough funds to cover the discount while preserving the configured reserve and campaign budget, and does not let a sale use its own contribution to qualify for its discount. With the default 50% reserve and no other campaign commitments, the balance must be at least twice the discount amount.

### Records and financial boundaries

Allocations are posted when a subscription payment is confirmed. A refund adds reversal entries instead of silently changing the original ledger history. The 79% shop allocation is before payment fees, taxes, refunds, and operating costs; it is not net profit. The app stores records in the current browser and supports JSON backup and import, but this standalone version does not sync between computers or process payments.

### Website API integration

The optional API can sync employee and customer accounts from the website and receive subscription-sale events after payment confirmation. It calculates the referral chain, upline subscription eligibility, commissions, CEO allocation, Save Box contribution, and ledger entries. The Website API dashboard reads website sales, referral-tree, and commission reports from the API. Checkout and payment verification remain on the website and its payment provider; the API records confirmed events but does not process payments. API data is stored separately on the server, outside the browser’s local workspace. See API-INTEGRATION.md for setup and endpoint details.

The Member panel previews one user’s subscription term and status, lower referral tree, commission history, current-month commissions, team activity, shares routed to the CEO while the user was inactive, and first-purchase discount offers. The preview is an owner tool, not a member login. For the live website, the website must authenticate the user and request only that user’s report from the server-only member API endpoint; it must recheck discount eligibility at checkout.

---

## فارسی

### هدف

«دفتر شاخه‌ای» فروش اشتراک‌ها را ثبت می‌کند، مسیر ارجاع هر خریدار را دنبال می‌کند و سهم‌های مربوط به هر فروش را محاسبه می‌کند. هدف این است که مسیر هر پرداخت شفاف باشد: سهم فروشگاه، پورسانت کاربران بالادستی، سهم مدیرعامل و واریزی صندوق ذخیره در دفتر کل ثبت می‌شوند. ارجاع کاربر یا ساخت حساب به‌تنهایی پرداختی ایجاد نمی‌کند؛ تخصیص‌ها فقط با فروش اشتراکِ پرداخت‌شده محاسبه می‌شوند.

### کاربران و اشتراک‌ها

مدیرعامل / مالک فروشگاه ریشه درخت ارجاع است و در شبکه کاربران قرار نمی‌گیرد. کارمندان و مشتریان هر دو کاربر محسوب می‌شوند. کارمندان مستقیماً زیرمجموعه مدیرعامل هستند. مشتری را یک کارمند یا مشتری دیگری می‌تواند معرفی کند؛ بنابراین درخت می‌تواند بدون محدودیت تعداد سطح ادامه پیدا کند.

هر کاربر برای دریافت پورسانت از فروش‌های سطوح پایین‌تر باید اشتراک فعال داشته باشد. مدت پیش‌فرض اشتراک یک ماه تقویمی است. اگر اشتراک پیش از انقضا تمدید شود، مدت فعلی ادامه می‌یابد؛ اگر پس از انقضا تمدید شود، دوره جدید از تاریخ پرداخت آغاز می‌شود. اگر اشتراک کاربر بالادستی هنگام پرداخت فروش کاربر پایین‌تر فعال نباشد، سهم محاسبه‌شده او به مدیرعامل می‌رسد. این سهم بین کاربران دیگر تقسیم نمی‌شود و پس از تمدید نیز به او بازگردانده نمی‌شود. مدیرعامل برای دریافت سهم خود به اشتراک نیاز ندارد.

### تخصیص فروش و زنجیره پورسانت

طرح‌های پیش‌فرض عبارت‌اند از برنزی با قیمت ۷۰۰٬۰۰۰، نقره‌ای با قیمت ۱٬۵۰۰٬۰۰۰ و طلایی با قیمت ۳٬۰۰۰٬۰۰۰. محاسبات بر اساس مبلغی انجام می‌شود که خریدار پس از تخفیف واقعاً می‌پردازد. در حالت پیش‌فرض، ۷۹٪ به‌عنوان سهم فروشگاه ثبت می‌شود و کل ۲۱٪ وارد صندوق پورسانت می‌شود. خریدار از خرید خودش پورسانت نمی‌گیرد.

کل صندوق پورسانت وارد زنجیره تخصیص می‌شود و سهم ثابتی از آن از ابتدا برای صندوق ذخیره کنار گذاشته نمی‌شود. از معرف مستقیم خریدار شروع می‌کنیم؛ هر کاربر بالادستی نصف مبلغ باقی‌مانده را دریافت می‌کند. در نتیجه، معرف مستقیم ۵۰٪ صندوق اولیه، معرف بعدی ۲۵٪، نفر بعد ۱۲٫۵٪ و سطوح بعدی به همین ترتیب سهم می‌گیرند. وقتی زنجیره به ردیف مدیرعامل برسد، مبلغ باقی‌مانده به‌طور مساوی بین مدیرعامل / مالک فروشگاه و صندوق ذخیره تقسیم می‌شود. اگر هیچ کاربر بالادستی ثبت نشده باشد، کل صندوق پورسانت به ردیف مدیرعامل می‌رسد و نصف آن به هر یک از این دو حساب تعلق می‌گیرد.

برای نمونه، در خرید کامل طرح برنزی با قیمت ۷۰۰٬۰۰۰، مبلغ ۵۵۳٬۰۰۰ به فروشگاه می‌رسد و صندوق پورسانت ۱۴۷٬۰۰۰ است. اگر دو کاربر بالادستی وجود داشته باشند، معرف مستقیم ۷۳٬۵۰۰ و معرف بعدی ۳۶٬۷۵۰ دریافت می‌کنند. مانده ۳۶٬۷۵۰ نیز به دو سهم ۱۸٬۳۷۵ برای مدیرعامل و ۱۸٬۳۷۵ برای صندوق ذخیره تقسیم می‌شود. تعداد کاربران بالادستی، مبلغ مانده و در نتیجه واریزی صندوق ذخیره را تغییر می‌دهد.

### تخفیف‌های صندوق ذخیره

صندوق ذخیره حسابی جداگانه دارد، هرچند سهم آن از همان زنجیره پورسانت تأمین می‌شود. تخفیف خوش‌آمدگویی پیش‌فرض برای اولین اشتراک پرداخت‌شده هر کاربر ۵٪ است. برنامه موجودی قطعی صندوق را پیش از ثبت فروش بررسی می‌کند و باید مبلغ تخفیف را با حفظ ذخیره و بودجه کمپین تعیین‌شده پوشش دهد. فروش جدید نمی‌تواند با واریزی خودش واجد شرایط تخفیف شود. با ذخیره پیش‌فرض ۵۰٪ و بدون تعهدات دیگر کمپین، موجودی صندوق باید دست‌کم دو برابر مبلغ تخفیف باشد.

### ثبت‌ها و حدود مالی

تخصیص‌ها هنگام تأیید پرداخت اشتراک ثبت می‌شوند. بازپرداخت با افزودن موارد برگشت به دفتر کل انجام می‌شود و سابقه اصلی فروش بی‌صدا تغییر نمی‌کند. سهم ۷۹٪ فروشگاه پیش از کسر کارمزد پرداخت، مالیات، بازپرداخت و هزینه‌های عملیاتی است و سود خالص محسوب نمی‌شود. اطلاعات برنامه در مرورگر فعلی ذخیره می‌شوند و امکان تهیه و واردکردن نسخه پشتیبان JSON وجود دارد؛ اما این نسخه مستقل بین رایانه‌ها همگام‌سازی یا پرداخت‌ها را پردازش نمی‌کند.

### اتصال API وب‌سایت

نسخه API می‌تواند کاربران کارمند و مشتری را از وب‌سایت همگام‌سازی کند و پس از تأیید پرداخت، رویداد فروش اشتراک را دریافت کند. API زنجیره معرف، وضعیت اشتراک کاربران بالادستی، سهم‌های پورسانت، حساب مدیرعامل، صندوق ذخیره و دفتر کل را محاسبه و نگهداری می‌کند. داشبورد «Website API» آمار فروش وب‌سایت، درخت ارجاع و پورسانت‌ها را از API می‌خواند. پرداخت همچنان در وب‌سایت و درگاه پرداخت تأیید می‌شود؛ API فقط رویداد پرداخت تأییدشده را ثبت می‌کند. پایگاه داده API روی سرور و جدا از اطلاعات محلی مرورگر نگهداری می‌شود. راهنمای راه‌اندازی و اتصال در فایل API-INTEGRATION.md است.

پنل کاربر، وضعیت اشتراک، درخت ارجاع پایین‌دستی، سابقه پورسانت، پورسانت ماه جاری، فعالیت تیم و سهم‌های منتقل‌شده به مدیرعامل هنگام غیرفعال‌بودن کاربر را برای پیش‌نمایش مدیر نمایش می‌دهد. این پیش‌نمایش ورود کاربر نیست. برای استفاده در وب‌سایت، خود وب‌سایت باید هویت کاربر را تأیید کند و فقط گزارش همان کاربر را از مسیر امن سمت سرور دریافت کند.
