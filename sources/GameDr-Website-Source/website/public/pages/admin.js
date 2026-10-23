// ---------- helpers ----------
const $ = id => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}

// The admin area has its own language preference so it can be switched even
// when the storefront is using another language. Text-node translation keeps
// the existing admin renderers and user-entered data intact.
const ADMIN_FA = {
  'Admin login': 'ورود مدیر',
  'Approved admin account': 'حساب مدیر تأییدشده',
  'Administration': 'مدیریت',
  'View site': 'مشاهده سایت',
  'Log out': 'خروج',
  'Root admin: enter only the value after ': 'مدیر اصلی: فقط مقدار بعد از ',
  " in the server's ": ' در فایل ',
  ' file, not the whole file.': ' سرور را وارد کنید، نه کل فایل.',
  'Sign in with the account email or username and password after a root admin grants access in Customers.': 'پس از فعال‌سازی دسترسی توسط مدیر اصلی در بخش مشتریان، با ایمیل یا نام کاربری و رمز حساب وارد شوید.',
  'Password': 'رمز عبور',
  'Email or username': 'ایمیل یا نام کاربری',
  'Account password': 'رمز حساب',
  'Log in': 'ورود',
  'Log in with account': 'ورود با حساب کاربری',
  'Dashboard': 'داشبورد',
  'Storefront health': 'وضعیت فروشگاه',
  'Games': 'بازی‌ها',
  'Subscriptions': 'اشتراک‌ها',
  'DRT Tokens & Wallets': 'توکن‌ها و کیف پول DRT',
  'Weekly earnings': 'درآمد هفتگی',
  'Customers': 'مشتریان',
  'Learn & Content': 'آموزش و محتوا',
  'Footer & Contact': 'پاورقی و تماس',
  'Legal & Trust': 'قوانین و اعتماد',
  'Discounts': 'تخفیف‌ها',
  'Requests': 'درخواست‌ها',
  'Telegram': 'تلگرام',
  'Reports': 'گزارش‌ها',
  'Messages': 'پیام‌ها',
  'Save': 'ذخیره',
  'Save changes': 'ذخیره تغییرات',
  'Cancel': 'لغو',
  'Edit': 'ویرایش',
  'Delete': 'حذف',
  'Close': 'بستن',
  'Open': 'باز کردن',
  'Search': 'جست‌وجو',
  'Back': 'بازگشت',
  'Test': 'آزمایش',
  'Yes': 'بله',
  'No': 'خیر',
  'Loading…': 'در حال بارگذاری…',
  'Saved': 'ذخیره شد',
  'Delete account': 'حذف حساب',
  'Make admin': 'تبدیل به مدیر',
  'Remove admin': 'لغو دسترسی مدیر',
  'Adjust DRT': 'تغییر موجودی DRT',
  'Open profile': 'مشاهده پروفایل',
  'Games in catalog': 'بازی‌های فهرست',
  'Games without description': 'بازی‌های بدون توضیحات',
  'Games without screenshots': 'بازی‌های بدون تصویر',
  'Active subscribers': 'مشترکان فعال',
  'Unread messages': 'پیام‌های خوانده‌نشده',
  'Open problem reports': 'گزارش‌های مشکل باز',
  'New game / subtitle requests': 'درخواست‌های بازی یا زیرنویس',
  'Customer accounts': 'حساب‌های مشتریان',
  'Pending email verification': 'در انتظار تأیید ایمیل',
  'These registrations have not become active accounts yet. They remain manageable here while the customer completes email verification.': 'این ثبت‌نام‌ها هنوز حساب فعال نشده‌اند. تا زمان تکمیل تأیید ایمیل، از همین‌جا قابل مدیریت هستند.',
  'No pending registrations.': 'ثبت‌نام در انتظاری وجود ندارد.',
  'Awaiting code': 'در انتظار کد',
  'Expired': 'منقضی‌شده',
  'Attempts: ': 'تلاش‌ها: ',
  'Pending': 'در انتظار',
  'Remove pending signup': 'حذف ثبت‌نام در انتظار',
  'Remove the pending signup for ': 'ثبت‌نام در انتظار برای ',
  'Orders waiting for approval': 'سفارش‌های در انتظار تأیید',
  'Quick actions': 'دسترسی سریع',
  '+ Add a game': '+ افزودن بازی',
  'Edit subscription plans': 'ویرایش طرح‌های اشتراک',
  'Edit Learn content': 'ویرایش محتوای آموزش',
  'Every change to games is backed up in data/backups before it is saved (last 30 versions kept).': 'پیش از ذخیره، از هر تغییر بازی نسخه پشتیبان تهیه می‌شود (۳۰ نسخهٔ آخر نگهداری می‌شوند).',
  'Paid file purchases and DRT spending are separate from cash revenue. Correct catalog issues in Games; update customer requests in Requests.': 'خرید فایل بازی و مصرف DRT جدا از درآمد نقدی هستند. مشکلات فهرست بازی‌ها را در بخش بازی‌ها و درخواست‌های مشتریان را در بخش درخواست‌ها اصلاح کنید.',
  'Game unlocks and DRT spending are separate from cash revenue. Correct catalog issues in Games; update customer requests in Requests.': 'بازکردن بازی با DRT از درآمد نقدی جداست. مشکلات فهرست را در بخش بازی‌ها اصلاح کنید و درخواست‌های مشتریان را در بخش درخواست‌ها به‌روز کنید.',
  'Paid file purchases': 'خرید فایل بازی',
  'Game unlock purchases': 'خرید بازکردن بازی',
  'DRT spent': 'DRT مصرف‌شده',
  'Open requests': 'درخواست‌های باز',
  'Wishlist saves': 'افزودن به علاقه‌مندی‌ها',
  'Best sellers': 'پرفروش‌ترین‌ها',
  'No paid purchases yet. The empty homepage section stays hidden.': 'هنوز خریدی انجام نشده است. بخش خالی صفحهٔ اصلی پنهان می‌ماند.',
  'Game': 'بازی',
  'Missing content': 'محتوای ناقص',
  'Export catalog issues': 'خروجی مشکلات فهرست',
  'Catalog checklist (': 'فهرست بررسی بازی‌ها (',
  'Nothing here.': 'موردی وجود ندارد.',
  'View game': 'مشاهده بازی',
  'Mark resolved': 'علامت‌گذاری به‌عنوان رسیدگی‌شده',
  'Reopen': 'بازگشایی',
  'Edit game': 'ویرایش بازی',
  'Mark unread': 'علامت‌گذاری به‌عنوان خوانده‌نشده',
  'Mark read': 'علامت‌گذاری به‌عنوان خوانده‌شده',
  'No messages yet.': 'هنوز پیامی وجود ندارد.',
  'No messages yet. Messages sent from the Contact Us page appear here.': 'هنوز پیامی وجود ندارد. پیام‌های صفحهٔ تماس با ما اینجا نمایش داده می‌شوند.',
  'Email or username': 'ایمیل یا نام کاربری',
  'Phone': 'تلفن',
  'Email': 'ایمیل',
  'Name': 'نام',
  'Title': 'عنوان',
  'Category': 'دسته‌بندی',
  'Release date': 'تاریخ انتشار',
  'Choose File': 'انتخاب فایل',
  '+ Add plan': '+ افزودن طرح',
  '+ Add pack': '+ افزودن بسته',
  '+ Add game': '+ افزودن بازی',
  'bronze': 'برنزی',
  'silver': 'نقره‌ای',
  'gold': 'طلایی',
  'Action-Adventure': 'اکشن و ماجراجویی',
  'Fighting': 'مبارزه‌ای',
  'Horror': 'ترسناک',
  'Indie & Roguelike': 'مستقل و روگ‌لایک',
  'Party & Rhythm': 'مهمانی و ریتم',
  'Platformer & Puzzle': 'سکوبازی و معمایی',
  'RPG': 'نقش‌آفرینی',
  'Shooter': 'تیراندازی',
  'Sports & Racing': 'ورزشی و مسابقه‌ای',
  'Strategy & Simulation': 'راهبرد و شبیه‌سازی',
  'Survival & Open-World': 'بقا و جهان‌باز',
  'Players': 'تعداد بازیکنان',
  'English': 'انگلیسی',
  'File': 'فایل',
  'Details': 'جزئیات',
  'Uploaded': 'بارگذاری شد',
  'Save price': 'ذخیره قیمت',
  'Default price saved': 'قیمت پیش‌فرض ذخیره شد',
  'Price saved': 'قیمت ذخیره شد',
  'Add URL': 'افزودن نشانی اینترنتی',
  'Price (DRT)': 'قیمت (DRT)',
  'Most Famous': 'شاخص‌ترین‌ها',
  'Search games…': 'جست‌وجوی بازی‌ها…',
  'All categories': 'همه دسته‌بندی‌ها',
  'Category names': 'نام دسته‌بندی‌ها',
  'Change the public name without changing the internal category key. Existing games, filters and links keep working.': 'نام دسته‌بندی‌های بازی و قفسه‌های صفحه اصلی را تغییر دهید؛ کلید داخلی تغییر نمی‌کند و بازی‌ها، فیلترها و لینک‌های قبلی همچنان کار می‌کنند.',
  'Internal key': 'کلید داخلی',
  'English label': 'نام انگلیسی',
  'Persian label': 'نام فارسی',
  'Used on': 'محل استفاده',
  'Game catalog': 'فهرست بازی‌ها',
  'Special filter': 'فیلتر ویژه',
  'Homepage': 'صفحه اصلی',
  'Save category names': 'ذخیره نام دسته‌بندی‌ها',
  'Category names saved': 'نام دسته‌بندی‌ها ذخیره شد',
  'Category keys are kept stable so existing game records and links do not break.': 'کلیدهای دسته‌بندی ثابت می‌مانند تا رکوردها و لینک‌های قبلی بازی‌ها خراب نشوند.',
  'All games': 'همه بازی‌ها',
  'Hidden from site': 'در سایت نمایش داده نشود',
  'Rank': 'رتبه',
  'Released': 'تاریخ انتشار',
  'Content': 'محتوا',
  'View': 'مشاهده',
  'PS4': 'PS4',
  'PS5': 'PS5',
  'Description': 'توضیحات',
  'English description': 'توضیحات انگلیسی',
  'Persian description': 'توضیحات فارسی',
  'Change cover': 'تغییر کاور',
  'e.g. Naughty Dog': 'مثلاً Naughty Dog',
  'Choose or type a new category': 'دسته‌بندی را انتخاب کنید یا مورد جدیدی بنویسید',
  'Automatic / not set': 'خودکار / تنظیم‌نشده',
  'Supported': 'پشتیبانی می‌شود',
  'Not supported': 'پشتیبانی نمی‌شود',
  'Optional official studio logo URL (https://…)': 'نشانی رسمی لوگوی استودیو (اختیاری، https://…)',
  'https://thegameawards.com/…': 'https://thegameawards.com/…',
  'Official awards page (https://…)': 'صفحه رسمی جوایز (https://…)',
  'https://howlongtobeat.com/…': 'https://howlongtobeat.com/…',
  'Rating source (https://…)': 'منبع رده‌بندی (https://…)',
  'Company / studio': 'شرکت / استودیو',
  'Poster / cover': 'پوستر / کاور',
  'One award per line\nGame of the Year (2024)': 'هر جایزه را در یک خط بنویسید\nبازی سال (۲۰۲۴)',
  'One studio award per line\nStudio game — Best Direction (2024)': 'هر جایزه استودیو را در یک خط بنویسید\nبازی استودیو — بهترین کارگردانی (۲۰۲۴)',
  'Customers unlock each file once with DRT tokens. Price 0 = free. Files you drop straight into media/': 'مشتریان هر فایل را فقط یک‌بار با توکن DRT باز می‌کنند. قیمت ۰ یعنی رایگان. فایل‌هایی که مستقیم در پوشه media/ قرار می‌دهید،',
  'also appear here.': 'اینجا هم نمایش داده می‌شوند.',
  'Default price for this game:': 'قیمت پیش‌فرض این بازی:',
  'Files for sale (DRT)': 'فایل‌های قابل فروش (DRT)',
  'Game downloads and price': 'فایل‌های دانلود بازی و قیمت',
  'Customers unlock every download in this game together. The price is calculated at 1 DRT per GB of total game size, rounded to the nearest whole GB, with a 1 DRT minimum. All uploaded game files contribute to the price.': 'مشتریان همه فایل‌های دانلود این بازی را یک‌جا باز می‌کنند. قیمت به‌ازای هر گیگابایت از حجم کل بازی، ۱ DRT است و به نزدیک‌ترین عدد صحیح گرد می‌شود؛ حداقل قیمت ۱ DRT است. همه فایل‌های بارگذاری‌شده در محاسبه حجم و قیمت لحاظ می‌شوند.',
  'Games unlocked in total': 'مجموع بازی‌های بازشده',
  'Game unlocks': 'بازی‌های بازشده',
  'Game unlocks (DRT)': 'بازکردن بازی با DRT',
  'Games unlocked': 'بازی‌های بازشده',
  'Game unlocks and legacy files': 'بازکردن بازی و خریدهای قدیمی فایل',
  'Recent game unlocks': 'آخرین بازکردن بازی‌ها',
  'Full game': 'کل بازی',
  'Full game access': 'دسترسی کامل به بازی',
  'Size': 'حجم',
  'Access': 'دسترسی',
  'Price': 'قیمت',
  'No game unlocks yet.': 'هنوز بازی‌ای باز نشده است.',
  'legacy file purchases': 'خرید قدیمی فایل',
  'DRT spent on game/file unlocks': 'DRT مصرف‌شده برای بازکردن بازی/فایل',
  'No files yet. Upload one below.': 'هنوز فایلی وجود ندارد؛ از پایین فایلی بارگذاری کنید.',
  'Choose one or more files first': 'ابتدا یک یا چند فایل انتخاب کنید',
  'price (optional)': 'قیمت (اختیاری)',
  'use global default': 'استفاده از پیش‌فرض کلی',
  'Upload': 'بارگذاری',
  'Uploaded': 'بارگذاری شد',
  'File': 'فایل',
  'MB': 'مگابایت',
  'Default price of a game file in DRT (0 = free). Used when a file or game has no price of its own.': 'قیمت پیش‌فرض فایل بازی با DRT (۰ = رایگان). وقتی فایل یا بازی قیمت مشخصی ندارد از این مقدار استفاده می‌شود.',
  'Save price': 'ذخیره قیمت',
  'No PS4/PS5 game found. Try another spelling.': 'بازی PS4/PS5 پیدا نشد؛ املای دیگری را امتحان کنید.',
  'already in your catalog': 'از قبل در فهرست شما موجود است',
  'Use this': 'استفاده از این مورد',
  'Searching the game catalog…': 'در حال جست‌وجو در فهرست بازی‌ها…',
  'Getting the description, screenshots and details…': 'در حال دریافت توضیحات، تصاویر و جزئیات…',
  'Type the game name and pick it from the results.': 'نام بازی را بنویسید و از نتایج انتخاب کنید.',
  'Quick add from the game catalog': 'افزودن سریع از فهرست بازی‌ها',
  'Refill from the game catalog': 'تکمیل اطلاعات از فهرست بازی‌ها',
  'PS4 / PS5': 'PS4 / PS5',
  'Status': 'وضعیت',
  'Role': 'نقش',
  'Created': 'تاریخ ایجاد',
  'Last active': 'آخرین فعالیت',
  'Actions': 'عملیات',
  'Details': 'جزئیات',
  'ID': 'شناسه',
  'User ID': 'شناسه کاربر',
  'Username': 'نام کاربری',
  'Balance': 'موجودی',
  'Available': 'قابل استفاده',
  'Pending': 'در انتظار',
  'Active': 'فعال',
  'Inactive': 'غیرفعال',
  'Approved': 'تأییدشده',
  'Rejected': 'ردشده',
  'Open': 'باز',
  'Resolved': 'رسیدگی‌شده',
  'Title': 'عنوان',
  'Category': 'دسته‌بندی',
  'Price': 'قیمت',
  'Description': 'توضیحات',
  'Image': 'تصویر',
  'Date': 'تاریخ',
  'Amount': 'مبلغ',
  'Total': 'مجموع',
  'Customer': 'مشتری',
  'Order': 'سفارش',
  'Source': 'منبع',
  'Type': 'نوع',
  'Notes': 'یادداشت‌ها',
  'Required': 'ضروری',
  'Optional': 'اختیاری',
  'Copy': 'کپی',
  'Copied': 'کپی شد',
  'Refresh': 'به‌روزرسانی',
  'Apply': 'اعمال',
  'Upload': 'بارگذاری',
  'Add': 'افزودن',
  'Remove': 'حذف',
  'Create': 'ایجاد',
  'Update': 'به‌روزرسانی',
  'Configure': 'تنظیم',
  'Enabled': 'فعال',
  'Disabled': 'غیرفعال',
  'All': 'همه',
  'None': 'هیچ‌کدام',
  'Today': 'امروز',
  'This week': 'این هفته',
  'This month': 'این ماه',
  'Never': 'هرگز',
  'Unknown': 'نامشخص',
  'Not set': 'تنظیم‌نشده',
  'Not available': 'در دسترس نیست',
  'No results found.': 'نتیجه‌ای پیدا نشد.',
  'No customers yet.': 'هنوز مشتری‌ای وجود ندارد.',
  'No games found.': 'بازی‌ای پیدا نشد.',
  'Change admin language': 'تغییر زبان مدیریت',
  'Change admin language to English': 'تغییر زبان مدیریت به انگلیسی',
  'Switch admin language to English': 'تغییر زبان مدیریت به انگلیسی',
  'Account ID': 'شناسه حساب',
  'Account access': 'دسترسی حساب',
  'Account created': 'حساب ایجاد شد',
  'Account deleted': 'حساب حذف شد',
  'Active subscribers': 'مشترکان فعال',
  'Add URL': 'افزودن نشانی اینترنتی',
  'Add a game': 'افزودن بازی',
  'Add customer': 'افزودن مشتری',
  'Add or remove DRT for ': 'افزودن یا کسر DRT از حساب ',
  '(negative number removes):': '(عدد منفی باعث کسر می‌شود):',
  '(use a negative number to remove):': '(برای کسر، عدد منفی وارد کنید):',
  'Address (English)': 'نشانی (انگلیسی)',
  'Address (Persian)': 'نشانی (فارسی)',
  'Admin access granted.': 'دسترسی مدیریت فعال شد.',
  'Admin access removed.': 'دسترسی مدیریت لغو شد.',
  'Admin-approved marketer': 'بازاریاب تأییدشده توسط مدیر',
  'Age rating': 'رده‌بندی سنی',
  'Age rating source': 'منبع رده‌بندی سنی',
  'All categories': 'همه دسته‌بندی‌ها',
  'All games': 'همه بازی‌ها',
  'All plans': 'همه طرح‌ها',
  'All statuses': 'همه وضعیت‌ها',
  'Announce new files': 'اعلان فایل‌های جدید',
  'Announce new games': 'اعلان بازی‌های جدید',
  'Announcements on': 'اعلان‌ها فعال باشند',
  'Applies to': 'شامل موارد',
  'Approved - tokens credited': 'تأیید شد؛ توکن‌ها واریز شدند',
  'Are you sure you want to ': 'آیا مطمئن هستید که می‌خواهید ',
  'Attributed marketer': 'بازاریاب منتسب‌شده',
  'Auto-translate English → Persian': 'ترجمه خودکار انگلیسی به فارسی',
  'Automatic / not set': 'خودکار / تنظیم‌نشده',
  'Balance after': 'موجودی پس از عملیات',
  'Balance updated': 'موجودی به‌روزرسانی شد',
  'Bank details': 'اطلاعات بانکی',
  'Bank details missing': 'اطلاعات بانکی ثبت نشده است',
  'Bank verified': 'اطلاعات بانکی تأیید شده',
  'Blood and Gore, Intense Violence': 'خون‌ریزی و خشونت شدید',
  'Bonus DRT (extra)': 'پاداش DRT (اضافی)',
  'Bottom line / copyright (English)': 'متن پایانی / حق نشر (انگلیسی)',
  'Bottom line / copyright (Persian)': 'متن پایانی / حق نشر (فارسی)',
  'Box title (English)': 'عنوان کادر (انگلیسی)',
  'Box title (Persian)': 'عنوان کادر (فارسی)',
  'Broken file or download': 'فایل یا دانلود خراب است',
  'Button link': 'پیوند دکمه',
  'Button text (English)': 'متن دکمه (انگلیسی)',
  'Button text (Persian)': 'متن دکمه (فارسی)',
  'Code is active': 'کد فعال است',
  'Copy box and page': 'کادر و صفحه کپی',
  'Copy this:': 'این متن را کپی کنید:',
  'Create code': 'ایجاد کد',
  'Create game': 'ایجاد بازی',
  'Current plan': 'طرح فعلی',
  'Current Tehran period: ': 'دوره فعلی به وقت تهران: ',
  'This week’s sales set next week’s rank.': 'فروش‌های این هفته رتبه هفته آینده را تعیین می‌کنند.',
  'TEST LEDGER · NO CASH PAYMENTS': 'دفتر آزمایشی · بدون پرداخت نقدی',
  'Preview sample team': 'پیش‌نمایش تیم نمونه',
  'Exit sample preview': 'خروج از پیش‌نمایش نمونه',
  'DEMO PREVIEW · Fictional accounts and statistics': 'پیش‌نمایش آزمایشی · حساب‌ها و آمار خیالی',
  'This is a browser-only sample for reviewing the admin screens. It creates no login accounts and saves no users, sales, commissions, or payouts.': 'این نمونه فقط برای بررسی صفحه‌های مدیریت در مرورگر است. هیچ حساب ورود، کاربر، فروش، پورسانت یا پرداختی ایجاد یا ذخیره نمی‌کند.',
  'Active rank this week': 'رتبه فعال این هفته',
  'Projected rank next week': 'رتبه پیش‌بینی‌شده هفته آینده',
  'Active rank → next week': 'رتبه فعال ← هفته آینده',
  'CEO overview': 'نمای کلی مدیرعامل',
  'CEO / Root admin': 'مدیرعامل / مدیر اصلی',
  'Company team': 'تیم شرکت',
  'Top of the marketer tree': 'بالای درخت بازاریابان',
  'direct team members': 'عضو مستقیم تیم',
  'Website administrator accounts · ': 'حساب‌های مدیران سایت · ',
  'Website administrator accounts ·': 'حساب‌های مدیران سایت ·',
  'Directly invited accounts · ': 'حساب‌های دعوت‌شده مستقیم · ',
  'Directly invited accounts ·': 'حساب‌های دعوت‌شده مستقیم ·',
  'Invite code: ': 'کد دعوت: ',
  'Invite code:': 'کد دعوت:',
  'Direct teams': 'تیم‌های مستقیم',
  'Direct team members': 'اعضای مستقیم تیم',
  'Approved team accounts': 'حساب‌های تأییدشده تیم',
  'Approved marketer accounts': 'حساب‌های بازاریاب تأییدشده',
  'Approved marketer': 'بازاریاب تأییدشده',
  'Approved marketer(s)': 'بازاریاب تأییدشده',
  'Website admin': 'مدیر سایت',
  'Website administrator accounts': 'حساب‌های مدیران سایت',
  'Customer account': 'حساب مشتری',
  'Search all team members by name, email or invite code…': 'جست‌وجوی اعضای تیم با نام، ایمیل یا کد دعوت…',
  'Search all team members': 'جست‌وجوی همه اعضای تیم',
  'No team members match that search.': 'عضوی با این مشخصات پیدا نشد.',
  'No approved marketers are directly under the company root yet. Approve an account below to add it to the tree.': 'هنوز بازاریاب تأییدشده‌ای مستقیماً زیر مدیر اصلی قرار ندارد. برای افزودن به درخت، حسابی را در بخش زیر تأیید کنید.',
  'Only approved marketer accounts appear in the commission tree.': 'فقط حساب‌های بازاریاب تأییدشده در درخت پورسانت نمایش داده می‌شوند.',
  'Website access and marketer approval are separate.': 'دسترسی مدیریت سایت و تأیید بازاریابی دو مورد جدا هستند.',
  'Review marketer approval and payout checks': 'بررسی تأیید بازاریاب و شرایط تسویه',
  'Rules and Fibonacci rank table': 'قوانین و جدول رتبه فیبوناچی',
  'Recent sales and test settlement': 'فروش‌های اخیر و تسویه آزمایشی',
  'Settlement history and weekly reports': 'تاریخچه تسویه و گزارش‌های هفتگی',
  'Open account': 'مشاهده حساب',
  'Team sales': 'فروش تیمی',
  'Rank': 'رتبه',
  'This-week income': 'درآمد این هفته',
  'Lower team': 'اعضای پایین‌دست',
  'No rank': 'بدون رتبه',
  'Not approved': 'تأییدنشده',
  'Organization overview': 'نمای کلی شبکه',
  'Team overview': 'نمای کلی تیم',
  'Organization owner': 'مدیر اصلی شرکت',
  'Direct reports': 'اعضای مستقیم زیرمجموعه',
  'Find any approved marketer to inspect their own branch and sales.': 'برای بررسی شاخه و فروش هر بازاریاب تأییدشده، نام او را جست‌وجو کنید.',
  'Start with the people directly under the company root, or search any approved member. Select a person to inspect their income, orders and lower levels.': 'از اعضای مستقیم زیر نظر مدیر اصلی شروع کنید یا هر عضو تأییدشده‌ای را جست‌وجو کنید. برای دیدن درآمد، سفارش‌ها و لایه‌های پایین‌تر، یک نفر را انتخاب کنید.',
  'Direct team members': 'اعضای مستقیم تیم',
  'Qualifying sales this week': 'فروش‌های واجد شرایط این هفته',
  'Paid DRT-pack orders in the current period': 'سفارش‌های پرداخت‌شده بسته DRT در دوره فعلی',
  'Approved team accounts': 'حساب‌های تأییدشده تیم',
  'Only these accounts participate in the tree': 'فقط این حساب‌ها در درخت مشارکت دارند',
  'Commission allocated this week': 'پورسانت تخصیص‌یافته این هفته',
  'Across approved marketer accounts': 'در مجموع حساب‌های بازاریاب تأییدشده',
  'Available for test settlement': 'آماده تسویه آزمایشی',
  'Verified accounts only': 'فقط حساب‌های احراز‌شده',
  'Team sales this week': 'فروش تیمی این هفته',
  'This account plus its approved lower team': 'این حساب به‌همراه تیم تأییدشده پایین‌دست آن',
  'Direct sales this week': 'فروش مستقیم این هفته',
  'Orders attributed directly to this marketer': 'سفارش‌های منتسب‌شده مستقیم به این بازاریاب',
  'Approved lower team': 'اعضای تأییدشده پایین‌دست',
  'Approved marketers below this account': 'بازاریابان تأییدشده پایین‌تر از این حساب',
  'Direct invited accounts': 'حساب‌های دعوت‌شده مستقیم',
  'Includes customers and marketers': 'شامل مشتریان و بازاریابان',
  'This account’s commission income': 'درآمد پورسانت این حساب',
  'Amounts below are ledger records in toman. “This week” means sales delivered in the current Tehran period.': 'مبالغ زیر سوابق دفتر حساب به تومان هستند. «این هفته» یعنی فروش‌های تحویل‌شده در دوره فعلی تهران.',
  'Allocated from this week’s sales': 'تخصیص‌یافته از فروش‌های این هفته',
  'Direct and eligible upline shares': 'سهم مستقیم و سهم بالاسری واجد شرایط',
  'Waiting / in hold': 'در انتظار / در دوره نگه‌داری',
  'All periods': 'همه دوره‌ها',
  'Ready for simulated settlement': 'آماده تسویه شبیه‌سازی‌شده',
  'All periods; identity and bank must be verified': 'همه دوره‌ها؛ احراز هویت و اطلاعات بانکی باید تأیید شده باشند',
  'Previously simulated paid': 'پرداخت آزمایشی‌شده قبلی',
  'Refund adjustments': 'اصلاحات بازپرداخت',
  'Outstanding debt': 'بدهی باقی‌مانده',
  'If an earlier simulated share was reversed': 'در صورت برگشت سهم آزمایشی قبلی',
  'Reversed': 'برگشت‌خورده',
  'Lower levels invited into this team': 'لایه‌های پایین‌تری که به این تیم دعوت شده‌اند',
  'Open any approved marketer to follow their own branch and sales. Customers stay visible in the invite list but do not become team marketers automatically.': 'برای دنبال‌کردن شاخه و فروش هر بازاریاب تأییدشده، حساب او را باز کنید. مشتریان در فهرست دعوت‌شدگان دیده می‌شوند اما خودکار بازاریاب تیم نمی‌شوند.',
  'No approved marketer accounts are below this person yet.': 'هنوز حساب بازاریاب تأییدشده‌ای پایین‌تر از این فرد وجود ندارد.',
  'Directly invited accounts': 'حساب‌های دعوت‌شده مستقیم',
  'Account type': 'نوع حساب',
  'No accounts were directly invited by this person yet.': 'هنوز حسابی مستقیماً توسط این فرد دعوت نشده است.',
  'Sales in this team this week': 'فروش این تیم در هفته جاری',
  'Review who sold, which customer bought, and the share recorded for this account.': 'ببینید چه کسی فروش را انجام داده، کدام مشتری خرید کرده و چه سهمی برای این حساب ثبت شده است.',
  'Showing up to 100 recent orders. The summary counts include the full team total.': 'حداکثر ۱۰۰ سفارش اخیر نمایش داده می‌شود؛ تعدادهای خلاصه بر اساس کل تیم محاسبه شده‌اند.',
  'Qualifying orders in this branch': 'سفارش‌های واجد شرایط این شاخه',
  'Branch test commission budget': 'بودجه آزمایشی پورسانت این شاخه',
  'One budget per eligible order': 'یک بودجه برای هر سفارش واجد شرایط',
  'No qualifying token-pack sales in this team this week.': 'این هفته فروش واجد شرایط بسته توکن در این تیم ثبت نشده است.',
  'Delivered': 'تحویل‌شده',
  'Order': 'سفارش',
  'Sold by': 'فروشنده',
  'Order budget': 'بودجه سفارش',
  'This account’s share': 'سهم این حساب',
  'State': 'وضعیت',
  'Marketer approved': 'بازاریاب تأییدشده',
  'Not in commission tree': 'در درخت پورسانت نیست',
  'Identity verified': 'هویت تأییدشده',
  'Identity not verified': 'هویت تأییدنشده',
  'Bank verified': 'حساب بانکی تأییدشده',
  'Bank not verified': 'حساب بانکی تأییدنشده',
  'Back to team': 'بازگشت به تیم',
  'Latest commission records': 'آخرین سوابق پورسانت',
  'The latest 500 commission records are shown here. Order totals above are calculated from the full ledger.': 'آخرین ۵۰۰ سابقه پورسانت در اینجا نمایش داده می‌شود. مجموع سفارش‌ها از کل دفتر حساب محاسبه شده است.',
  'Direct team members': 'اعضای مستقیم تیم',
  'Root admin': 'مدیر اصلی',
  'CEO': 'مدیرعامل',
  'ID:': 'شناسه:',
  'Invite code:': 'کد دعوت:',
  'No qualifying token-pack sales in this team this week.': 'این هفته فروش واجد شرایط بسته توکن در این تیم ثبت نشده است.',
  'Delete customer ': 'حذف مشتری ',
  'Delete the account of ': 'حذف حساب کاربری ',
  'Delete the code ': 'حذف کد ',
  'Description (English)': 'توضیحات (انگلیسی)',
  'Description (Persian)': 'توضیحات (فارسی)',
  'Direct marketer (toman)': 'بازاریاب مستقیم (تومان)',
  'Discount & gift codes': 'کدهای تخفیف و هدیه',
  '+ New code': '+ کد جدید',
  '+ Add customer': '+ افزودن مشتری',
  'DualSense / haptics': 'دوال‌سنس / بازخورد لمسی',
  'End / renewal date': 'تاریخ پایان / تمدید',
  'English + Persian': 'انگلیسی و فارسی',
  'English only': 'فقط انگلیسی',
  'English text  (use {game} {files} {link})': 'متن انگلیسی (از {game}، {files} و {link} استفاده کنید)',
  'Expires on (optional)': 'تاریخ انقضا (اختیاری)',
  'Features, one per line (English)': 'امکانات، هر مورد در یک خط (انگلیسی)',
  'Features, one per line (Persian)': 'امکانات، هر مورد در یک خط (فارسی)',
  'File unlocks (DRT)': 'بازکردن فایل با DRT',
  'Files for sale (DRT)': 'فایل‌های قابل فروش (DRT)',
  'Files unlocked': 'فایل‌های بازشده',
  'Files unlocked in total': 'مجموع فایل‌های بازشده',
  'First name': 'نام',
  'Fixed order budget (toman)': 'بودجه ثابت هر سفارش (تومان)',
  'Footer reset': 'پاورقی بازنشانی شد',
  'Footer saved - refresh the site to see it': 'پاورقی ذخیره شد؛ برای مشاهده سایت را تازه‌سازی کنید',
  'Footer text': 'متن پاورقی',
  'For people who buy outside the website (no login). Optional.': 'برای خریدارانی که بیرون از سایت خرید می‌کنند و وارد حساب نمی‌شوند؛ اختیاری.',
  'Game awards (one per line)': 'جوایز بازی (هر مورد در یک خط)',
  'Game awards source': 'منبع جوایز بازی',
  'Game page details': 'جزئیات صفحه بازی',
  'Gameplay screenshots': 'تصاویر گیم‌پلی',
  'Getting the description, screenshots and details…': 'در حال دریافت توضیحات، تصاویر و جزئیات…',
  'Gift: DRT added to the wallet': 'هدیه: DRT به کیف پول افزوده شد',
  'Give it to one customer only (optional)': 'فقط برای یک مشتری (اختیاری)',
  'Global default: ': 'مقدار پیش‌فرض کلی: ',
  'Go back to the original demo footer (and demo contact details)?': 'پاورقی و اطلاعات تماس نمونه به حالت اولیه بازگردند؟',
  'Hidden from site': 'در سایت نمایش داده نشود',
  'Highest balance': 'بیشترین موجودی',
  'Homepage introduction': 'معرفی صفحه اصلی',
  'How purchases are handled': 'نحوه پردازش خریدها',
  'Identity / bank verified': 'هویت / اطلاعات بانکی تأیید شده',
  'Identity missing': 'احراز هویت انجام نشده',
  'Identity verified': 'هویت تأیید شده',
  'In hold / pending': 'در انتظار / معلق',
  'Initial hold after delivery (days)': 'مدت انتظار اولیه پس از تحویل (روز)',
  'Instagram username (e.g. drgame.official)': 'نام کاربری اینستاگرام (مثلاً drgame.official)',
  'Invitation code': 'کد دعوت',
  'Invite code': 'کد دعوت',
  'JPG, PNG or WEBP, square works best (max 10 MB).': 'فرمت JPG، PNG یا WEBP؛ تصویر مربعی بهتر است (حداکثر ۱۰ مگابایت).',
  'Last login': 'آخرین ورود',
  'Last name': 'نام خانوادگی',
  'Learn box and page': 'کادر و صفحه آموزش',
  'Learn video': 'ویدیوی آموزش',
  'MANUAL - orders wait until I approve them after receiving payment': 'دستی — سفارش‌ها پس از دریافت وجه تا زمان تأیید شما در انتظار می‌مانند',
  'MP4 only. It plays at the top of the Learn page.': 'فقط MP4؛ ویدیو در بالای صفحه آموزش پخش می‌شود.',
  'Mark as famous': 'علامت‌گذاری به‌عنوان شاخص',
  'Mark as most popular': 'علامت‌گذاری به‌عنوان محبوب‌ترین',
  'Marketer approval & payout checks': 'تأیید بازاریاب و بررسی پرداخت پاداش',
  'Marketer status saved': 'وضعیت بازاریاب ذخیره شد',
  'Missing description': 'توضیحات موجود نیست',
  'Missing screenshots': 'تصاویر موجود نیست',
  'Most Famous': 'شاخص‌ترین‌ها',
  'Most Famous rank (1 = top; empty = not ranked)': 'رتبه شاخص‌ترین‌ها (۱ = اول؛ خالی = بدون رتبه)',
  'Name (English)': 'نام (انگلیسی)',
  'Name (Persian)': 'نام (فارسی)',
  'Name A-Z': 'نام، از الف تا ی',
  'New and in progress': 'جدید و در حال انجام',
  'New discount / gift code': 'کد تخفیف / هدیه جدید',
  'New game': 'بازی جدید',
  'New in the last 7 days': 'جدید در ۷ روز گذشته',
  'Newest first': 'ابتدا جدیدترین',
  'No PS4/PS5 game found. Try another spelling.': 'بازی PS4/PS5 پیدا نشد؛ املای دیگری را امتحان کنید.',
  'No account matches.': 'حسابی پیدا نشد.',
  'No accounts yet.': 'هنوز حسابی وجود ندارد.',
  'No active plan': 'طرح فعالی وجود ندارد',
  'No codes yet. Press "+ New code".': 'هنوز کدی وجود ندارد. «+ کد جدید» را بزنید.',
  'No file sales yet.': 'هنوز فایلی فروخته نشده است.',
  'No files unlocked.': 'هنوز فایلی باز نشده است.',
  'No files yet. Upload one below.': 'هنوز فایلی وجود ندارد؛ از پایین فایلی بارگذاری کنید.',
  'No finalized commissions are payable yet': 'هنوز پورسانت قطعی و قابل پرداختی وجود ندارد',
  'No one has signed up yet. Accounts appear here as soon as customers verify their email.': 'هنوز کسی ثبت‌نام نکرده است. پس از تأیید ایمیل مشتری، حساب او اینجا نمایش داده می‌شود.',
  'No orders.': 'سفارشی وجود ندارد.',
  'No paid DRT-pack orders have created commission records yet.': 'هنوز خرید بسته DRT که برای آن پورسانت ثبت شده باشد وجود ندارد.',
  'No payable commissions': 'پورسانت قابل پرداختی وجود ندارد',
  'No plan': 'بدون طرح',
  'No rank': 'بدون رتبه',
  'No reports yet. Reports sent with the Report button on game pages appear here.': 'هنوز گزارشی وجود ندارد. گزارش‌های ثبت‌شده از صفحه بازی‌ها اینجا نمایش داده می‌شوند.',
  'No simulated settlements yet.': 'هنوز تسویه آزمایشی انجام نشده است.',
  'No transactions yet.': 'هنوز تراکنشی وجود ندارد.',
  'No transactions.': 'تراکنشی وجود ندارد.',
  'No video yet': 'هنوز ویدیویی وجود ندارد',
  'Not connected yet: ': 'هنوز متصل نشده است: ',
  'Not sent (see the list below)': 'ارسال نشد (فهرست زیر را ببینید)',
  'Not supported': 'پشتیبانی نمی‌شود',
  'Not used yet.': 'هنوز استفاده نشده است.',
  'Note saved': 'یادداشت ذخیره شد',
  'Notes (private)': 'یادداشت‌ها (خصوصی)',
  'Nothing yet.': 'هنوز موردی وجود ندارد.',
  'Oldest first': 'ابتدا قدیمی‌ترین',
  'One award per line': 'هر جایزه در یک خط',
  'Online play': 'بازی آنلاین',
  'Only approved marketer accounts can hold a place in the tree or receive commissions. Identity and bank checks are separate; both are needed before a commission becomes payable.': 'فقط حساب‌های بازاریاب تأییدشده می‌توانند در شبکه جایگاه داشته باشند یا پورسانت بگیرند. احراز هویت و تأیید بانکی جداگانه‌اند و هر دو برای قابل‌پرداخت‌شدن پورسانت لازم هستند.',
  'Open levels': 'لایه‌های فعال',
  'Orders paid / total': 'سفارش‌های پرداخت‌شده / کل',
  'Orders waiting for approval (': 'سفارش‌های در انتظار تأیید (',
  'Over-age / inappropriate screenshot': 'تصویر نامناسب یا دارای محدودیت سنی',
  'Page text (English)': 'متن صفحه (انگلیسی)',
  'Page text (Persian)': 'متن صفحه (فارسی)',
  'Paste an image URL (https://…) and press Add': 'نشانی تصویر (https://…) را وارد کنید و «افزودن» را بزنید',
  'Payload box and page': 'کادر و صفحه پی‌لود',
  'Payment instructions (Persian)': 'راهنمای پرداخت (فارسی)',
  'Payment instructions shown to customers in MANUAL mode (English)': 'راهنمای پرداخت برای مشتریان در حالت دستی (انگلیسی)',
  'Payment mode': 'روش پرداخت',
  'Percent off (1-100)': 'درصد تخفیف (۱ تا ۱۰۰)',
  'Percent off a purchase': 'درصد تخفیف خرید',
  'Period (English), e.g. / month': 'مدت (انگلیسی)، مثلاً / month',
  'Period (Persian)': 'مدت (فارسی)',
  'Persian only': 'فقط فارسی',
  'Persian text': 'متن فارسی',
  'Phone 1 (e.g. +98 912 123 4567)': 'تلفن ۱ (مثلاً ‎+98 912 123 4567)',
  'Phone 2': 'تلفن ۲',
  'Phone verification codes are sent by SMS.': 'کدهای تأیید شماره تلفن با پیامک ارسال می‌شوند.',
  'Plans saved': 'طرح‌ها ذخیره شدند',
  'Play time': 'مدت زمان بازی',
  'Play time source': 'منبع مدت زمان بازی',
  'Poster / cover': 'پوستر / کاور',
  'Price (DRT)': 'قیمت (DRT)',
  'Price (English), e.g. $10': 'قیمت (انگلیسی)، مثلاً ‎$10',
  'Price (Persian)': 'قیمت (فارسی)',
  'Price saved': 'قیمت ذخیره شد',
  'Private note': 'یادداشت خصوصی',
  'Qualifying pack sales': 'فروش بسته‌های واجد شرایط',
  'Rank reserve': 'ذخیره رتبه',
  'Rank reserve (toman)': 'ذخیره رتبه (تومان)',
  'Recent commission sales': 'فروش‌های اخیر مشمول پورسانت',
  'Recent file sales': 'فروش‌های اخیر فایل',
  'Recent orders': 'سفارش‌های اخیر',
  'Refund Policy': 'سیاست بازپرداخت',
  'Registered accounts': 'حساب‌های ثبت‌شده',
  'Release date': 'تاریخ انتشار',
  'Remove pack': 'حذف بسته',
  'Remove plan': 'حذف طرح',
  'Remove the Learn video?': 'ویدیوی آموزش حذف شود؟',
  'Remove this plan?': 'این طرح حذف شود؟',
  'Remove video': 'حذف ویدیو',
  'Replace the fields below with the information from the store?': 'اطلاعات فروشگاه جایگزین مقادیر فیلدهای زیر شود؟',
  'Replace this text with the built-in default?': 'این متن با متن پیش‌فرض جایگزین شود؟',
  'Requests from the "Request a game / subtitle" page and the button on every game page. When several people ask for the same thing they are grouped, so the most wanted ones are listed first.': 'درخواست‌های صفحه «درخواست بازی / زیرنویس» و دکمه موجود در صفحه هر بازی. درخواست‌های تکراری گروه‌بندی می‌شوند تا موارد پرتقاضاتر در ابتدا قرار بگیرند.',
  'Reset to demo footer': 'بازگردانی پاورقی نمونه',
  'Reverse test sale': 'ثبت برگشت فروش آزمایشی',
  'Reversed test sales': 'فروش‌های آزمایشی برگشت‌خورده',
  'Run a test settlement? This only writes simulated commission ledger entries. It does not transfer money.': 'تسویه آزمایشی اجرا شود؟ فقط ردیف‌های شبیه‌سازی‌شده پورسانت در دفتر ثبت می‌شوند و پولی انتقال نمی‌یابد.',
  'Save a new rules version': 'ذخیره نسخه جدید قوانین',
  'Save content': 'ذخیره محتوا',
  'Save footer': 'ذخیره پاورقی',
  'Save legal pages & trust settings': 'ذخیره صفحات قوانین و تنظیمات اعتماد',
  'Save payment settings & packs': 'ذخیره تنظیمات پرداخت و بسته‌ها',
  'Save plans': 'ذخیره طرح‌ها',
  'Edit plan': 'ویرایش طرح',
  'No download quota': 'بدون سهمیه دانلود',
  'Download quota': 'سهمیه دانلود',
  'Save price': 'ذخیره قیمت',
  'Save profile': 'ذخیره پروفایل',
  'Saved. "Last updated" date set to today.': 'ذخیره شد. تاریخ «آخرین به‌روزرسانی» روی امروز تنظیم شد.',
  'Search games…': 'جست‌وجوی بازی‌ها…',
  'Search name, email, phone…': 'جست‌وجو بر اساس نام، ایمیل یا تلفن…',
  'Search name, username, email or phone…': 'جست‌وجو بر اساس نام، نام کاربری، ایمیل یا تلفن…',
  'Searching the game catalog…': 'در حال جست‌وجو در فهرست بازی‌ها…',
  'Send test message': 'ارسال پیام آزمایشی',
  'Session expired, please log in again': 'نشست شما منقضی شده است؛ دوباره وارد شوید',
  'Settled (simulated)': 'تسویه‌شده (آزمایشی)',
  'Settlement started': 'تسویه آغاز شد',
  'Seven upline shares, comma separated (toman)': 'سهم هفت لایه بالاسری، با ویرگول جدا کنید (تومان)',
  'Short line under the title (English, optional)': 'متن کوتاه زیر عنوان (انگلیسی، اختیاری)',
  'Short line under the title (Persian, optional)': 'متن کوتاه زیر عنوان (فارسی، اختیاری)',
  'Sign-up consent': 'رضایت هنگام ثبت‌نام',
  'Simulate weekly settlement': 'شبیه‌سازی تسویه هفتگی',
  'Simulated settlement history': 'تاریخچه تسویه‌های آزمایشی',
  'Site address': 'نشانی سایت',
  'Start date': 'تاریخ شروع',
  'Still showing demo text on the site: ': 'متن نمونه هنوز در سایت نمایش داده می‌شود: ',
  'Store genres: ': 'سبک‌های فروشگاه: ',
  'Studio awards (one per line)': 'جوایز استودیو (هر مورد در یک خط)',
  'Studio awards source': 'منبع جوایز استودیو',
  'TELEGRAM_BOT_TOKEN ': 'TELEGRAM_BOT_TOKEN ',
  'TELEGRAM_CHAT_ID ': 'TELEGRAM_CHAT_ID ',
  'TEST - purchases are free and instant (simulated)': 'آزمایشی — خریدها رایگان و فوری هستند (شبیه‌سازی)',
  'TEST MODE is on: anyone with an account can get free DRT and subscriptions. Switch to MANUAL (or connect a payment gateway) before going live.': 'حالت آزمایشی فعال است: هر حسابی می‌تواند DRT و اشتراک رایگان بگیرد. پیش از انتشار، حالت دستی را فعال کنید یا درگاه پرداخت وصل کنید.',
  'Team sales': 'فروش تیم',
  'Telegram username (e.g. drgame_support)': 'نام کاربری تلگرام (مثلاً drgame_support)',
  'Terms of Service': 'شرایط استفاده از خدمات',
  'Test SMTP connection (no email sent)': 'آزمایش اتصال SMTP (ایمیلی ارسال نمی‌شود)',
  'Test commission reversal recorded': 'برگشت پورسانت آزمایشی ثبت شد',
  'Test ledger only. ': 'فقط دفتر آزمایشی. ',
  'Test message sent': 'پیام آزمایشی ارسال شد',
  'Test sms.ir key (no SMS sent)': 'آزمایش کلید sms.ir (پیامکی ارسال نمی‌شود)',
  'The box on the home page opens the Copy page.': 'کادر صفحه اصلی، صفحه کپی را باز می‌کند.',
  'The box on the home page opens the Learn page (page text + video above). Leave a field empty to keep the built-in text.': 'کادر صفحه اصلی، صفحه آموزش را باز می‌کند (متن صفحه و ویدیوی بالای آن). برای استفاده از متن پیش‌فرض، فیلد را خالی بگذارید.',
  'The box on the home page opens the Payload page.': 'کادر صفحه اصلی، صفحه پی‌لود را باز می‌کند.',
  'The first weekly report is created at the next Thursday 20:00 close.': 'اولین گزارش هفتگی در پایان پنجشنبه، ساعت ۲۰، ایجاد می‌شود.',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'پس از تحویل، دوره انتظار اولیه هفت‌روزه اعمال می‌شود. فقط پورسانت بازاریاب تأییدشده و احراز‌هویت‌شده قابل پرداخت است. همه تسویه‌ها در این بخش آزمایشی هستند و انتقال بانکی انجام نمی‌شود.',
  'The short description under the logo and the line at the very bottom. Leave a box empty to hide that text.': 'توضیح کوتاه زیر لوگو و متن انتهای صفحه. برای پنهان‌کردن، کادر را خالی بگذارید.',
  'These also appear on the Contact Us page. Leave empty to hide.': 'این موارد در صفحه تماس با ما هم نمایش داده می‌شوند. برای پنهان‌کردن خالی بگذارید.',
  'These are starter texts, not legal advice. ': 'این متن‌ها نمونه اولیه هستند و مشاوره حقوقی محسوب نمی‌شوند. ',
  'These fields power the three public detail cards. The quick importer fills what it can; leave a support field on Automatic when the store should be checked later.': 'این فیلدها سه کارت اطلاعات عمومی بازی را می‌سازند. ابزار واردکردن سریع هرچه بتواند پر می‌کند؛ برای بررسی بعدی فروشگاه، گزینه پشتیبانی را روی خودکار بگذارید.',
  'These plans appear on the public Subscription page.': 'این طرح‌ها در صفحه عمومی اشتراک نمایش داده می‌شوند.',
  'This account has not been approved for admin access. Ask the root admin to enable it in Customers.': 'این حساب برای دسترسی مدیریت تأیید نشده است. از مدیر اصلی بخواهید دسترسی آن را در بخش مشتریان فعال کند.',
  'Title, short footer line and introduction in both languages. Leave empty to use the built-in copy.': 'عنوان، متن کوتاه پاورقی و معرفی را به هر دو زبان وارد کنید. برای استفاده از متن داخلی، فیلد را خالی بگذارید.',
  'Total logins': 'مجموع ورودها',
  'Total uses allowed (0 = unlimited)': 'حداکثر دفعات استفاده (۰ = نامحدود)',
  'Type at least 2 letters': 'حداقل دو حرف وارد کنید',
  'Type the game name, e.g. Elden Ring': 'نام بازی را وارد کنید، مثلاً Elden Ring',
  'Type the name and pick the game. The cover, descriptions, screenshots, release date, platforms, category, rating and support details are filled in when the sources provide them.': 'نام بازی را بنویسید و آن را انتخاب کنید. کاور، توضیحات، تصاویر، تاریخ انتشار، پلتفرم‌ها، دسته‌بندی، رده‌بندی و جزئیات پشتیبانی از منابع تکمیل می‌شوند.',
  'Unlocked files': 'فایل‌های بازشده',
  'Unrelated content': 'محتوای نامرتبط',
  'Upload failed': 'بارگذاری ناموفق بود',
  'Upload video': 'بارگذاری ویدیو',
  'Use default text': 'استفاده از متن پیش‌فرض',
  'Use this': 'استفاده از این مورد',
  'Uses per customer (0 = unlimited)': 'دفعات استفاده برای هر مشتری (۰ = نامحدود)',
  'VR support': 'پشتیبانی از واقعیت مجازی',
  'Verification codes are emailed to customers.': 'کدهای تأیید برای مشتریان ایمیل می‌شوند.',
  'Video uploaded': 'ویدیو بارگذاری شد',
  'View page': 'مشاهده صفحه',
  'View the site': 'مشاهده سایت',
  'Wallet transactions': 'تراکنش‌های کیف پول',
  'Was invited by': 'دعوت‌شده توسط',
  'Weekly close reports': 'گزارش‌های پایان هفته',
  'What it does': 'کارکرد',
  'WhatsApp number with country code (e.g. 989121234567)': 'شماره واتس‌اپ با کد کشور (مثلاً 989121234567)',
  'With an active plan': 'دارای طرح فعال',
  'Working hours (English) - Contact page only': 'ساعات کاری (انگلیسی) — فقط صفحه تماس',
  'Working hours (Persian) - Contact page only': 'ساعات کاری (فارسی) — فقط صفحه تماس',
  'Write the English description first': 'ابتدا توضیحات انگلیسی را بنویسید',
  'Wrong game information': 'اطلاعات بازی اشتباه است',
  'already in your catalog': 'از قبل در فهرست شما موجود است',
  'custom price': 'قیمت دلخواه',
  'default text': 'متن پیش‌فرض',
  'email not verified': 'ایمیل تأیید نشده',
  'email verified': 'ایمیل تأیید شده',
  'empty = anyone; or type an email / username': 'خالی = همه؛ یا ایمیل / نام کاربری وارد کنید',
  'just now': 'همین حالا',
  'last updated ': 'آخرین به‌روزرسانی ',
  'leave empty to generate one': 'برای ساخت خودکار خالی بگذارید',
  'missing in .env. Messages are only saved below.': 'در فایل .env موجود نیست. پیام‌ها فقط در فهرست زیر ذخیره می‌شوند.',
  'never recorded': 'هرگز ثبت نشده',
  'no desc': 'بدون توضیح',
  'not recorded': 'ثبت نشده',
  'only you see this': 'فقط شما این را می‌بینید',
  'open the game page': 'بازکردن صفحه بازی',
  'phone not verified': 'تلفن تأیید نشده',
  'phone numbers': 'شماره‌های تلفن',
  'phone verified': 'تلفن تأیید شده',
  'price (optional)': 'قیمت (اختیاری)',
  'private note': 'یادداشت خصوصی',
  'test mode': 'حالت آزمایشی',
  'token packs': 'بسته‌های توکن',
  'unlimited per customer': 'نامحدود برای هر مشتری',
  'use global default': 'استفاده از پیش‌فرض کلی',
  '— none —': '— هیچ‌کدام —',
  'Click the right game:': 'بازی درست را انتخاب کنید:',
  'Highlight this plan': 'برجسته‌کردن این طرح',
  'Visible on site': 'نمایش در سایت',
  'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid token-pack order creates one 100,000-toman test budget.': 'نسخه جدید در مرز پنجشنبه ساعت ۲۰ به وقت تهران فعال می‌شود. قوانین فقط روی سفارش‌های آینده اثر دارند. هر سفارش پرداخت‌شده بسته توکن، یک بودجه آزمایشی ۱۰۰٬۰۰۰ تومانی ایجاد می‌کند.',
  'Commission calculations and settlement records do not transfer money. Public payouts remain disabled.': 'محاسبه پورسانت و ثبت تسویه در این بخش پولی انتقال نمی‌دهد. پرداخت عمومی همچنان غیرفعال است.',
  'Commission rules · version ': 'قوانین پورسانت · نسخه ',
  'Company / studio (games from the same company are suggested together in "For you")': 'شرکت / استودیو (بازی‌های یک شرکت در بخش «برای شما» کنار هم پیشنهاد می‌شوند)',
  'Connected: messages are sent to your channel': 'متصل است: پیام‌ها به کانال شما ارسال می‌شوند',
  'Content descriptors (comma separated)': 'محتوای هشداردهنده (با ویرگول جدا کنید)',
  'Content saved': 'محتوا ذخیره شد',
  'Could not sign in.': 'ورود انجام نشد.',
  'Creator studio logo URL (optional)': 'نشانی لوگوی استودیو سازنده (اختیاری)',
  'Critic score / Metacritic (0–100)': 'امتیاز منتقدان / متاکریتیک (۰ تا ۱۰۰)',
  'Customer profile': 'پروفایل مشتری',
  'Customer update saved': 'به‌روزرسانی مشتری ذخیره شد',
  'Customer wallets (': 'کیف پول مشتریان (',
  'Customer-visible update': 'به‌روزرسانی قابل‌مشاهده برای مشتری',
  'Customers added by hand': 'مشتریانی که دستی اضافه شده‌اند',
  'Customers unlock each file once with DRT tokens. Price 0 = free. Files you drop straight into media/': 'مشتریان هر فایل را فقط یک‌بار با توکن DRT باز می‌کنند. قیمت ۰ یعنی رایگان. فایل‌هایی که مستقیم در پوشه media/ قرار می‌دهید،',
  'DRT balance': 'موجودی DRT',
  'DRT bought / granted': 'DRT خریداری‌شده / اعطاشده',
  'DRT given to the customer': 'DRT واریزشده به مشتری',
  'DRT held in wallets': 'DRT موجود در کیف پول‌ها',
  'DRT spent on files': 'DRT مصرف‌شده برای فایل‌ها',
  'DRT tokens included with this plan': 'تعداد توکن DRT همراه این طرح',
  'Default price for this game:': 'قیمت پیش‌فرض این بازی:',
  'Default price of a game file in DRT (0 = free). Used when a file or game has no price of its own.': 'قیمت پیش‌فرض فایل بازی با DRT (۰ = رایگان). وقتی فایل یا بازی قیمت جداگانه ندارد از این مقدار استفاده می‌شود.',
  'Default price saved': 'قیمت پیش‌فرض ذخیره شد',
  'Delete this message?': 'این پیام حذف شود؟',
  'Delete this report?': 'این گزارش حذف شود؟',
  'Delete this request?': 'این درخواست حذف شود؟',
  'E-Namad ID (the number after id=)': 'شناسه اینماد (عدد پس از id=)',
  'E-Namad code (the text after Code=)': 'کد اینماد (متن پس از Code=)',
  'E-Namad trust badge (Iran)': 'نشان اعتماد اینماد (ایران)',
  'Email is not set up yet': 'ایمیل هنوز راه‌اندازی نشده است',
  'Email sending is configured': 'ارسال ایمیل پیکربندی شده است',
  'Gmail API email is connected': 'اتصال ایمیل Gmail API برقرار است',
  'SMTP email is configured': 'ایمیل SMTP پیکربندی شده است',
  'Test Gmail API connection (no email sent)': 'آزمایش اتصال Gmail API (ایمیلی ارسال نمی‌شود)',
  'Fill them in below and press Save (a box left empty will hide that item).': 'مقادیر را در ادامه وارد و ذخیره کنید (کادر خالی باعث پنهان‌شدن آن مورد می‌شود).',
  'Follow Us': 'ما را دنبال کنید',
  'For you': 'برای شما',
  'Getting the description, screenshots and details…': 'در حال دریافت توضیحات، تصاویر و جزئیات…',
  'Gift: ': 'هدیه: ',
  'ID: ': 'شناسه: ',
  'Latest messages': 'آخرین پیام‌ها',
  'Learn box and page': 'کادر و صفحه آموزش',
  'Mark as famous': 'علامت‌گذاری به‌عنوان شاخص',
  'Mark as most popular': 'علامت‌گذاری به‌عنوان محبوب‌ترین',
  'Max 12 packs': 'حداکثر ۱۲ بسته مجاز است',
  'Max 8 plans': 'حداکثر ۸ طرح مجاز است',
  'Missing description': 'توضیحات موجود نیست',
  'Missing screenshots': 'تصاویر موجود نیست',
  'Missing in .env: ': 'موارد زیر در فایل .env تنظیم نشده‌اند: ',
  'No finalized commissions are payable yet': 'هنوز پورسانت قطعی و قابل پرداختی وجود ندارد',
  'No payable commissions': 'پورسانت قابل پرداختی وجود ندارد',
  'No simulated settlements yet.': 'هنوز تسویه آزمایشی انجام نشده است.',
  'Not connected yet: ': 'هنوز متصل نشده است: ',
  'Official awards page (https://…)': 'صفحه رسمی جوایز (https://…)',
  'Optional official studio logo URL (https://…)': 'نشانی رسمی لوگوی استودیو (اختیاری، https://…)',
  'Or upload images:': 'یا تصویر بارگذاری کنید:',
  'Orders paid / total': 'سفارش‌های پرداخت‌شده / کل',
  'Over-age / inappropriate screenshot': 'تصویر نامناسب یا دارای محدودیت سنی',
  'Paid file purchases': 'خرید فایل بازی',
  'Paste an image URL (https://…) and press Add': 'نشانی تصویر را وارد کنید (https://…) و «افزودن» را بزنید',
  'Period (English), e.g. / month': 'مدت (انگلیسی)، مثلاً / month',
  'Persian (فارسی)': 'فارسی',
  'Posts to your Telegram channel when you add a game or upload files. Several files uploaded for one game within about 15 seconds become one post.': 'با افزودن بازی یا بارگذاری فایل، در کانال تلگرام شما پیام منتشر می‌شود. چند فایل برای یک بازی که در فاصله حدود ۱۵ ثانیه بارگذاری شوند، در یک پیام قرار می‌گیرند.',
  'Rank reserve': 'ذخیره رتبه',
  'Rating source (https://…)': 'منبع رده‌بندی (https://…)',
  'Reason (optional):': 'دلیل (اختیاری):',
  'Recent commission sales': 'فروش‌های اخیر مشمول پورسانت',
  'Recent file sales': 'فروش‌های اخیر فایل',
  'Recent orders': 'سفارش‌های اخیر',
  'Record a test-only refund reversal for this order? This does not refund real money or change a customer wallet.': 'برگشت بازپرداخت آزمایشی برای این سفارش ثبت شود؟ این کار پول واقعی را بازنمی‌گرداند و موجودی کیف پول مشتری را تغییر نمی‌دهد.',
  'Referral & marketer status': 'وضعیت معرفی و بازاریاب',
  'Request failed (': 'درخواست ناموفق بود (',
  'Saved, but the cover could not be downloaded: ': 'ذخیره شد، اما دریافت کاور ناموفق بود: ',
  'SMS (sms.ir) is connected': 'پیامک (sms.ir) متصل است',
  'SMS is not fully set up yet': 'تنظیمات پیامک کامل نشده است',
  'SMS_TEMPLATE_ID (the id of a verification template from your sms.ir panel)': 'SMS_TEMPLATE_ID (شناسه الگوی تأیید در پنل sms.ir)',
  'SMTP check failed: ': 'بررسی SMTP ناموفق بود: ',
  'SMTP connection works. No email was sent.': 'اتصال SMTP برقرار است. ایمیلی ارسال نشد.',
  'Seven upline shares, comma separated (toman)': 'سهم هفت لایه بالاسری، با ویرگول جدا کنید (تومان)',
  'Site address': 'نشانی سایت',
  'Something else': 'مورد دیگر',
  'Still showing demo text on the site: ': 'متن نمونه هنوز در سایت نمایش داده می‌شود: ',
  'Store genres: ': 'سبک‌های فروشگاه: ',
  'Subscription: ': 'اشتراک: ',
  'Test ledger only. ': 'فقط دفتر آزمایشی. ',
  'The short description under the logo and the line at the very bottom. Leave a box empty to hide that text.': 'توضیح کوتاه زیر لوگو و متن انتهای صفحه. برای پنهان‌کردن هر متن، کادرش را خالی بگذارید.',
  'These also appear on the Contact Us page. Leave empty to hide.': 'این موارد در صفحه تماس با ما هم نمایش داده می‌شوند. برای پنهان‌کردن، خالی بگذارید.',
  'These are starter texts, not legal advice. ': 'این متن‌ها نمونه اولیه هستند و مشاوره حقوقی محسوب نمی‌شوند. ',
  'These fields power the three public detail cards. The quick importer fills what it can; leave a support field on Automatic when the store should be checked later.': 'این فیلدها سه کارت اطلاعات عمومی را می‌سازند. ابزار واردکردن سریع هرچه بتواند پر می‌کند؛ برای بررسی بعدی فروشگاه، پشتیبانی را روی «خودکار» بگذارید.',
  'These plans appear on the public Subscription page.': 'این طرح‌ها در صفحه عمومی اشتراک نمایش داده می‌شوند.',
  'This account has not been approved for admin access. Ask the root admin to enable it in Customers.': 'این حساب برای دسترسی مدیریت تأیید نشده است. از مدیر اصلی بخواهید دسترسی را در بخش مشتریان فعال کند.',
  'To ': 'گیرنده: ',
  'Token packs': 'بسته‌های توکن',
  'Tokens: ': 'توکن‌ها: ',
  'Translated — please review it': 'ترجمه شده است — لطفاً بازبینی کنید',
  'URL must start with https://': 'نشانی باید با https:// شروع شود',
  'Version ': 'نسخه ',
  'What it does': 'کارکرد',
  'With an active plan': 'دارای طرح فعال',
  'Working hours (English) - Contact page only': 'ساعات کاری (انگلیسی) — فقط صفحه تماس',
  'Working hours (Persian) - Contact page only': 'ساعات کاری (فارسی) — فقط صفحه تماس',
  'Write the English description first': 'ابتدا توضیحات انگلیسی را بنویسید',
  'Wrong game information': 'اطلاعات بازی اشتباه است',
  'URL must start with https://': 'نشانی باید با https:// شروع شود',
  'e.g. 123456': 'مثلاً ۱۲۳۴۵۶',
  'e.g. 1–2 local · 8 online': 'مثلاً ۱ تا ۲ نفر محلی · ۸ نفر آنلاین',
  'e.g. 25 hours main story': 'مثلاً ۲۵ ساعت برای داستان اصلی',
  'e.g. 5': 'مثلاً ۵',
  'e.g. ESRB Mature 17+': 'مثلاً ESRB Mature 17+',
  'e.g. Naughty Dog': 'مثلاً Naughty Dog',
  'e.g. aB3dE9gH1jK5mN7pQ2rS': 'مثلاً aB3dE9gH1jK5mN7pQ2rS',
  'https://your-site.com (used for the link in the post)': 'https://your-site.com (برای پیوند داخل پیام)',
  'sms.ir key works. Credit: ': 'کلید sms.ir معتبر است. اعتبار: ',
  'sms.ir said: ': 'پاسخ sms.ir: ',
  'unlimited per customer': 'نامحدود برای هر مشتری',
  'use global default': 'استفاده از پیش‌فرض کلی',
  'Click the right game:': 'بازی درست را انتخاب کنید:',
  'Clear list': 'پاک‌کردن فهرست',
  'Closed Tehran period': 'دوره بسته‌شده به وقت تهران',
  'Commission budget': 'بودجه پورسانت',
  'MANUAL - orders wait until I approve them after receiving payment': 'دستی — سفارش‌ها پس از دریافت وجه تا تأیید من در انتظار می‌مانند',
  'TEST - purchases are free and instant (simulated)': 'آزمایشی — خریدها رایگان و فوری هستند (شبیه‌سازی)',
  'No transactions.': 'تراکنشی وجود ندارد.',
  'No transactions yet.': 'هنوز تراکنشی وجود ندارد.',
  'Open levels': 'لایه‌های فعال',
  'marketer payouts': 'پرداخت‌های بازاریاب',
  'people asked': 'نفر درخواست داده‌اند',
  'paid purchases': 'خرید پرداخت‌شده',
  'per customer': 'برای هر مشتری',
  'shots': 'تصویر',
  'toman': 'تومان',
  'unread': 'خوانده‌نشده',
  'until ': 'تا ',
  'accounts': 'حساب',
  'active': 'فعال',
  'file': 'فایل',
  'login': 'ورود',
  'result': 'نتیجه',
  'scheduled for ': 'زمان‌بندی‌شده برای ',
  'This week': 'این هفته',
  'This month': 'این ماه',
  'What it does': 'کارکرد',
  'A page shows a "last updated" date only after you edit its text.': 'تاریخ «آخرین به‌روزرسانی» صفحه فقط پس از ویرایش متن آن نمایش داده می‌شود.',
  'A percent code takes a % off a purchase (customers activate it once, it is used on their next matching purchase). A gift code puts DRT in the wallet straight away. Give a code to one specific customer, or to anyone who knows it.': 'کد درصدی از خرید تخفیف می‌دهد و مشتری پس از فعال‌کردن آن، در خرید واجد شرایط بعدی از آن استفاده می‌کند. کد هدیه فوراً DRT را به کیف پول می‌افزاید. کد را به یک مشتری مشخص بدهید یا در اختیار همه قرار دهید.',
  'Choose an MP4 file first': 'ابتدا یک فایل MP4 انتخاب کنید',
  'Choose one or more files first': 'ابتدا یک یا چند فایل انتخاب کنید',
  'Choose or type a new category': 'دسته‌بندی را انتخاب کنید یا مورد جدیدی بنویسید',
  'Could not sign in.': 'ورود انجام نشد.',
  'Default price of a game file in DRT (0 = free). Used when a file or game has no price of its own.': 'قیمت پیش‌فرض فایل بازی با DRT (۰ = رایگان). وقتی فایل یا بازی قیمت مشخصی ندارد از این مقدار استفاده می‌شود.',
  'Fill them in below and press Save (a box left empty will hide that item).': 'مقادیر را در ادامه وارد و ذخیره کنید (کادر خالی باعث پنهان‌شدن آن مورد می‌شود).',
  'One award per line\nGame of the Year (2024)': 'هر جایزه را در یک خط بنویسید\nبازی سال (۲۰۲۴)',
  'One studio award per line\nStudio game — Best Direction (2024)': 'هر جایزه استودیو را در یک خط بنویسید\nبازی استودیو — بهترین کارگردانی (۲۰۲۴)',
  'E-Namad trust badge (Iran)': 'نشان اعتماد اینماد (ایران)',
  'After E-Namad (enamad.ir) approves your website they give you a small HTML snippet. Inside it you will see an address like trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... Copy the number after id= and the text after Code= into the two boxes. The badge then appears in the footer of every page. Leave both empty to hide it.': 'پس از تأیید سایت توسط اینماد، یک قطعه کد HTML دریافت می‌کنید. در آن نشانی‌ای مانند trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... وجود دارد. عدد پس از id= و متن پس از Code= را در دو کادر وارد کنید تا نشان در پاورقی همه صفحات نمایش داده شود. برای پنهان‌کردن نشان، هر دو کادر را خالی بگذارید.',
  'The box on the home page opens the Copy page.': 'کادر صفحه اصلی، صفحه کپی را باز می‌کند.',
  'The box on the home page opens the Learn page (page text + video above). Leave a field empty to keep the built-in text.': 'کادر صفحه اصلی، صفحه آموزش را باز می‌کند (متن صفحه و ویدیوی بالای آن). برای استفاده از متن داخلی، فیلد را خالی بگذارید.',
  'The box on the home page opens the Payload page.': 'کادر صفحه اصلی، صفحه پی‌لود را باز می‌کند.',
  'The first weekly report is created at the next Thursday 20:00 close.': 'اولین گزارش هفتگی در پایان پنجشنبه آینده، ساعت ۲۰، ایجاد می‌شود.',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'پس از تحویل، دوره انتظار اولیه هفت‌روزه اعمال می‌شود. فقط پورسانت بازاریاب تأییدشده و احراز‌هویت‌شده قابل پرداخت است. همه تسویه‌ها در این بخش شبیه‌سازی هستند و انتقال بانکی انجام نمی‌شود.',
  'No email is actually sent, so customers never receive their verification code. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM to the .env file and restart. On localhost, the verification form now displays the test code; messages are also listed here:': 'در حال حاضر ایمیلی ارسال نمی‌شود و مشتریان کد تأیید را دریافت نمی‌کنند. SMTP_HOST، SMTP_PORT، SMTP_USER، SMTP_PASS و MAIL_FROM را به فایل .env اضافه و سرور را راه‌اندازی مجدد کنید. در localhost کد آزمایشی در فرم تأیید نمایش داده می‌شود و پیام‌ها در اینجا فهرست می‌شوند:',
  'The short description under the logo and the line at the very bottom. Leave a box empty to hide that text.': 'توضیح کوتاه زیر لوگو و متن انتهای صفحه. برای پنهان‌کردن هرکدام، کادر مربوط را خالی بگذارید.',
  'These also appear on the Contact Us page. Leave empty to hide.': 'این موارد در صفحه تماس با ما هم نمایش داده می‌شوند. برای پنهان‌کردن، خالی بگذارید.',
  'These are starter texts, not legal advice. ': 'این متن‌ها نمونه اولیه هستند و مشاوره حقوقی محسوب نمی‌شوند. ',
  'These fields power the three public detail cards. The quick importer fills what it can; leave a support field on Automatic when the store should be checked later.': 'این فیلدها سه کارت اطلاعات عمومی را می‌سازند. ابزار واردکردن سریع هرچه بتواند پر می‌کند؛ اگر پشتیبانی باید بعداً بررسی شود، گزینه آن را روی «خودکار» بگذارید.',
  'These plans appear on the public Subscription page.': 'این طرح‌ها در صفحه عمومی اشتراک نمایش داده می‌شوند.',
  'Title, short footer line and introduction in both languages. Leave empty to use the built-in copy.': 'عنوان، متن کوتاه پاورقی و معرفی را به هر دو زبان وارد کنید. برای استفاده از متن داخلی، فیلد را خالی بگذارید.',
  'URL must start with https://': 'نشانی باید با https:// شروع شود',
  'After E-Namad (enamad.ir) approves your website they give you a small HTML snippet.': 'پس از تأیید سایت توسط اینماد، یک قطعه کد HTML دریافت می‌کنید.',
  'MP4 only. It plays at the top of the Learn page.': 'فقط MP4؛ ویدیو در بالای صفحه آموزش پخش می‌شود.',
  'No orders.': 'سفارشی وجود ندارد.',
  'No transactions.': 'تراکنشی وجود ندارد.',
  'No video yet': 'هنوز ویدیویی وجود ندارد',
  'Not connected yet: ': 'هنوز متصل نشده است: ',
  'Not sent (see the list below)': 'ارسال نشد (فهرست زیر را ببینید)',
  'Not supported': 'پشتیبانی نمی‌شود',
  'Not used yet.': 'هنوز استفاده نشده است.',
  'NOT sent': 'ارسال نشده',
  'Oldest first': 'ابتدا قدیمی‌ترین',
  'Online play': 'بازی آنلاین',
  'Only approved marketer accounts can hold a place in the tree or receive commissions. Identity and bank checks are separate; both are needed before a commission becomes payable.': 'فقط حساب‌های بازاریاب تأییدشده می‌توانند در شبکه جایگاه داشته باشند یا پورسانت بگیرند. احراز هویت و تأیید بانکی جداگانه‌اند و هر دو برای قابل‌پرداخت‌شدن پورسانت لازم هستند.',
  'Paste an image URL (https://…) and press Add': 'نشانی تصویر را وارد کنید (https://…) و «افزودن» را بزنید',
  'Record a test-only refund reversal for this order? This does not refund real money or change a customer wallet.': 'برگشت بازپرداخت آزمایشی برای این سفارش ثبت شود؟ این کار پول واقعی را بازنمی‌گرداند و موجودی کیف پول مشتری را تغییر نمی‌دهد.',
  'The box on the home page opens the Learn page (page text + video above). Leave a field empty to keep the built-in text.': 'کادر صفحه اصلی، صفحه آموزش را باز می‌کند (متن صفحه و ویدیوی بالای آن). برای استفاده از متن داخلی، فیلد را خالی بگذارید.',
  'This account has not been approved for admin access. Ask the root admin to enable it in Customers.': 'این حساب برای دسترسی مدیریت تأیید نشده است. از مدیر اصلی بخواهید دسترسی را در بخش مشتریان فعال کند.',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'پس از تحویل، دوره انتظار اولیه هفت‌روزه اعمال می‌شود. فقط پورسانت بازاریاب تأییدشده و احراز‌هویت‌شده قابل پرداخت است. تمام تسویه‌های این بخش آزمایشی‌اند و انتقال بانکی انجام نمی‌شود.',
  'sent': 'ارسال شد',
  'open': 'باز',
  'resolved': 'رسیدگی‌شده',
  'new': 'جدید',
  'working': 'در حال انجام',
  'done': 'انجام‌شده',
  'rejected': 'ردشده',
  'approved': 'تأییدشده',
  'pending': 'در انتظار',
  'paid': 'پرداخت‌شده',
  'failed': 'ناموفق',
  'refunded': 'بازپرداخت‌شده',
  'subscription': 'اشتراک',
  'tokens': 'توکن‌ها',
  'gift': 'هدیه',
  'percent': 'درصد',
  'files': 'فایل‌ها',
  'game': 'بازی',
  'subtitle': 'زیرنویس',
  'other': 'سایر',
  'age': 'رده سنی',
  'wrong': 'اطلاعات نادرست',
  'unrelated': 'نامرتبط',
  'min ago': 'دقیقه پیش',
  'h ago': 'ساعت پیش',
  'days ago': 'روز پیش',
  'months ago': 'ماه پیش',
  'years ago': 'سال پیش',
  'desc': 'توضیحات',
  'hidden': 'پنهان',
  'famous': 'شاخص',
  'email not verified': 'ایمیل تأیید نشده',
  'email verified': 'ایمیل تأیید شده',
  'phone not verified': 'تلفن تأیید نشده',
  'phone verified': 'تلفن تأیید شده',
};
Object.assign(ADMIN_FA, {
  'New customers must tick "I agree to the Terms of Service and the Privacy Policy" to create an account': 'مشتریان جدید برای ساخت حساب باید گزینه «شرایط استفاده از خدمات و سیاست حفظ حریم خصوصی را می‌پذیرم» را علامت بزنند',
  'Marketer:': 'بازاریاب:',
  'Approved': 'تأییدشده',
  'Not approved': 'تأییدنشده',
  'Approve marketer': 'تأیید بازاریاب',
  'Revoke marketer': 'لغو تأیید بازاریاب',
  'Marketer access approved.': 'دسترسی بازاریابی تأیید شد.',
  'Marketer access revoked.': 'دسترسی بازاریابی لغو شد.',
  'Registered accounts': 'حساب‌های ثبت‌شده',
  'New in the last 7 days': 'ثبت‌نام در ۷ روز گذشته',
  'With an active plan': 'دارای طرح فعال',
  'Files unlocked in total': 'مجموع فایل‌های بازشده',
  'Search name, username, email or phone…': 'جست‌وجو بر اساس نام، نام کاربری، ایمیل یا تلفن…',
  'Search name, email, phone…': 'جست‌وجو بر اساس نام، ایمیل یا تلفن…',
  'All plans': 'همه طرح‌ها',
  'No plan': 'بدون طرح',
  'Newest first': 'ابتدا جدیدترین',
  'Oldest first': 'ابتدا قدیمی‌ترین',
  'Last login': 'آخرین ورود',
  'Highest balance': 'بیشترین موجودی',
  'Name A-Z': 'نام، از الف تا ی',
  'of': 'از',
  'verified': 'تأییدشده',
  'unverified': 'تأییدنشده',
  'Admin': 'مدیر',
  'Administrator': 'مدیر',
  'Customer': 'مشتری',
  'Plan': 'طرح',
  'Wallet': 'کیف پول',
  'Files': 'فایل‌ها',
  'Access': 'دسترسی',
  'Item': 'مورد',
  'History': 'تاریخچه',
  'None.': 'هیچ‌کدام.',
  'Approve': 'تأیید',
  'Reject': 'رد',
  'Period': 'دوره',
  'Save profile': 'ذخیره پروفایل',
  'Created: ': 'ایجاد شده: ',
  '"Follow Us" - social accounts': '«ما را دنبال کنید» — حساب‌های شبکه‌های اجتماعی',
  '"Contact" - phone, email, address': '«تماس» — تلفن، ایمیل و نشانی',
  'Just the username or number. The footer builds the link for you. Leave empty to hide that account.': 'فقط نام کاربری یا شماره را وارد کنید؛ پیوند در پاورقی ساخته می‌شود. برای پنهان‌کردن حساب، خالی بگذارید.',
  'description': 'توضیح',
  'bottom line': 'متن پایانی',
  'Uploading…': 'در حال بارگذاری…',
  'Orders': 'سفارش‌ها',
  'Unlocked files': 'فایل‌های بازشده',
  'Date': 'تاریخ',
  'Change': 'تغییر',
  'History': 'تاریخچه',
  'Orders paid / total': 'سفارش‌های پرداخت‌شده / کل',
  'Referral & marketer status': 'وضعیت معرفی و بازاریاب',
  'Invitation code': 'کد دعوت',
  'Was invited by': 'دعوت‌شده توسط',
  'Admin-approved marketer': 'بازاریاب تأییدشده توسط مدیر',
  'Identity / bank verified': 'هویت / اطلاعات بانکی تأیید شده',
  'Account access': 'دسترسی حساب',
  'DRT balance': 'موجودی DRT',
  'Current plan': 'طرح فعلی',
  'DRT spent on files': 'DRT مصرف‌شده برای فایل‌ها',
  'Total logins': 'مجموع ورودها',
  'Subscriptions': 'اشتراک‌ها',
  'Email': 'ایمیل',
  'Address': 'نشانی',
  'Instagram': 'اینستاگرام',
  'WhatsApp': 'واتس‌اپ',
  'Period': 'دوره',
  'Start date': 'تاریخ شروع',
  'End / renewal date': 'تاریخ پایان / تمدید',
  'Save plans': 'ذخیره طرح‌ها',
  'View page': 'مشاهده صفحه',
  'These plans appear on the public Subscription page.': 'این طرح‌ها در صفحه عمومی اشتراک نمایش داده می‌شوند.',
  'Edit code ': 'ویرایش کد ',
  'Code': 'کد',
  'Uses': 'دفعات استفاده',
  'Discount': 'تخفیف',
  'Gift': 'هدیه',
  'All plans': 'همه طرح‌ها',
  'All statuses': 'همه وضعیت‌ها',
  'None.': 'هیچ‌کدام.',
  '— none —': '— هیچ‌کدام —',
  'active': 'فعال',
  'paused': 'متوقف‌شده',
  'expired': 'منقضی‌شده',
  'cancelled': 'لغوشده',
  'verified': 'تأییدشده',
  'unverified': 'تأییدنشده',
  'never': 'هرگز',
  'never recorded': 'هرگز ثبت نشده',
  'logins': 'ورود',
  'login': 'ورود',
  'file': 'فایل',
  'files': 'فایل‌ها',
  'until ': 'تا ',
  'No account matches.': 'حسابی پیدا نشد.',
  'No accounts yet.': 'هنوز حسابی وجود ندارد.',
  'No one has signed up yet. Accounts appear here as soon as customers verify their email.': 'هنوز کسی ثبت‌نام نکرده است. پس از تأیید ایمیل مشتری، حساب او اینجا نمایش داده می‌شود.',
  'No customers yet.': 'هنوز مشتری‌ای وجود ندارد.',
  'New customers must tick "I agree to the Terms of Service and the Privacy Policy" to create an account': 'مشتریان جدید برای ایجاد حساب باید گزینه پذیرش شرایط استفاده و سیاست حفظ حریم خصوصی را علامت بزنند.',
});
Object.assign(ADMIN_FA, {
  'New customers must tick "I agree to the Terms of Service and the Privacy Policy" to create an account': 'مشتریان جدید برای ایجاد حساب باید گزینه پذیرش شرایط استفاده و سیاست حفظ حریم خصوصی را علامت بزنند.',
  'Registered accounts': 'حساب‌های ثبت‌شده',
  'New in the last 7 days': 'ثبت‌نام در ۷ روز گذشته',
  'With an active plan': 'دارای طرح فعال',
  'Files unlocked in total': 'مجموع فایل‌های بازشده',
  'Search name, username, email or phone…': 'جست‌وجو بر اساس نام، نام کاربری، ایمیل یا تلفن…',
  'Search name, email, phone…': 'جست‌وجو بر اساس نام، ایمیل یا تلفن…',
  'All plans': 'همه طرح‌ها',
  'No plan': 'بدون طرح',
  'Newest first': 'ابتدا جدیدترین',
  'Oldest first': 'ابتدا قدیمی‌ترین',
  'Last login': 'آخرین ورود',
  'Highest balance': 'بیشترین موجودی',
  'Name A-Z': 'نام، از الف تا ی',
  'of': 'از',
  'verified': 'تأییدشده',
  'unverified': 'تأییدنشده',
  'Admin': 'مدیر',
  'Administrator': 'مدیر',
  'Customer': 'مشتری',
  'Plan': 'طرح',
  'Wallet': 'کیف پول',
  'Files': 'فایل‌ها',
  'Access': 'دسترسی',
  'Item': 'مورد',
  'History': 'تاریخچه',
  'None.': 'هیچ‌کدام.',
  'Approve': 'تأیید',
  'Reject': 'رد',
  'Period': 'دوره',
  'Save profile': 'ذخیره پروفایل',
  'Created: ': 'ایجاد شده: ',
  '"Follow Us" - social accounts': '«ما را دنبال کنید» — حساب‌های شبکه‌های اجتماعی',
  '"Contact" - phone, email, address': '«تماس» — تلفن، ایمیل و نشانی',
  'Just the username or number. The footer builds the link for you. Leave empty to hide that account.': 'فقط نام کاربری یا شماره را وارد کنید؛ پیوند در پاورقی ساخته می‌شود. برای پنهان‌کردن حساب، خالی بگذارید.',
  'description': 'توضیح',
  'bottom line': 'متن پایانی',
  'Uploading…': 'در حال بارگذاری…',
  'Orders': 'سفارش‌ها',
  'Unlocked files': 'فایل‌های بازشده',
  'Date': 'تاریخ',
  'Change': 'تغییر',
  'Orders paid / total': 'سفارش‌های پرداخت‌شده / کل',
  'Referral & marketer status': 'وضعیت معرفی و بازاریاب',
  'Invitation code': 'کد دعوت',
  'Was invited by': 'دعوت‌شده توسط',
  'Admin-approved marketer': 'بازاریاب تأییدشده توسط مدیر',
  'Identity / bank verified': 'هویت / اطلاعات بانکی تأیید شده',
  'Account access': 'دسترسی حساب',
  'DRT balance': 'موجودی DRT',
  'Current plan': 'طرح فعلی',
  'Total logins': 'مجموع ورودها',
  'Account': 'حساب',
  'Invite code': 'کد دعوت',
  'This week': 'این هفته',
  'Marketer': 'بازاریاب',
  'Identity': 'هویت',
  'Delivered': 'تحویل‌شده',
  'Attributed marketer': 'بازاریاب منتسب‌شده',
  'Budget': 'بودجه',
  'Unallocated': 'تخصیص‌نیافته',
  'Reserve': 'ذخیره',
  'State': 'وضعیت',
  'Marketers': 'بازاریابان',
  'Mode': 'حالت',
  'Settlement': 'تسویه',
  'Sales': 'فروش',
  'Rank': 'رتبه',
  'Team sales': 'فروش تیمی',
  'Qualifying pack sales': 'فروش بسته‌های واجد شرایط',
  'Commission budget': 'بودجه پورسانت',
  'Reversed test sales': 'فروش‌های آزمایشی برگشت‌خورده',
  'Test commission reversal recorded': 'برگشت پورسانت آزمایشی ثبت شد',
  'Save a new rules version': 'ذخیره نسخه جدید قوانین',
  'Recent commission sales': 'فروش‌های اخیر مشمول پورسانت',
  'Simulate weekly settlement': 'شبیه‌سازی تسویه هفتگی',
  'Simulated settlement history': 'تاریخچه تسویه‌های آزمایشی',
  'Weekly close reports': 'گزارش‌های پایان هفته',
  'The first weekly report is created at the next Thursday 20:00 close.': 'اولین گزارش هفتگی در پایان پنجشنبه آینده، ساعت ۲۰، ایجاد می‌شود.',
  'Closed Tehran period': 'دوره بسته‌شده به وقت تهران',
  'Commission calculations and settlement records do not transfer money. Public payouts remain disabled.': 'محاسبات پورسانت و سوابق تسویه در این بخش پولی جابه‌جا نمی‌کنند. پرداخت واقعی همچنان غیرفعال است.',
  'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid token-pack order creates one 100,000-toman test budget.': 'نسخه جدید در مرز پنجشنبه ساعت ۲۰ به وقت تهران فعال می‌شود. قوانین فقط روی سفارش‌های آینده اثر دارند. هر سفارش پرداخت‌شده بسته توکن، یک بودجه آزمایشی ۱۰۰٬۰۰۰ تومانی ایجاد می‌کند.',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'پس از تحویل، دوره انتظار اولیه هفت‌روزه اعمال می‌شود. فقط پورسانت بازاریاب تأییدشده و احراز‌هویت‌شده قابل پرداخت است. همه تسویه‌های این بخش شبیه‌سازی هستند و انتقال بانکی انجام نمی‌شود.',
  'No paid DRT-pack orders have created commission records yet.': 'هنوز سفارش خرید بسته DRT که برای آن پورسانتی ثبت شده باشد وجود ندارد.',
  'Test ledger only. ': 'فقط دفتر آزمایشی. ',
  'SIMULATED': 'آزمایشی',
  'Reversed': 'برگشت‌خورده',
  'In hold / pending': 'در دوره انتظار / معلق',
  'Settled (simulated)': 'تسویه‌شده (آزمایشی)',
  'Subscription: ': 'اشتراک: ',
  'Tokens: ': 'توکن‌ها: ',
  'Generate': 'ساخت کد',
  'File unlocks (DRT)': 'بازکردن فایل با DRT',
  'What it does': 'کارکرد',
  'For': 'برای',
  'Used': 'استفاده‌شده',
  'Expires': 'انقضا',
  'Uses': 'دفعات استفاده',
  'anyone': 'همه',
  'never': 'هرگز',
  'off': 'غیرفعال',
  'subscriptions': 'اشتراک‌ها',
  'token packs': 'بسته‌های توکن',
  'files': 'فایل‌ها',
  'Percent off a purchase': 'درصد تخفیف خرید',
  'Gift: DRT added to the wallet': 'هدیه: DRT به کیف پول افزوده می‌شود',
  'Add URL': 'افزودن نشانی اینترنتی',
  'Uploaded': 'بارگذاری شد',
  'Quick add from the game catalog': 'افزودن سریع از فهرست بازی‌ها',
  'Refill from the game catalog': 'تکمیل اطلاعات از فهرست بازی‌ها',
  'Store genres: ': 'سبک‌های فروشگاه: ',
  'Current Tehran period: ': 'دوره فعلی به وقت تهران: ',
  'Version ': 'نسخه ',
  'scheduled for ': 'زمان‌بندی‌شده برای ',
  'Copied: ': 'کپی شد: ',
  'Created: ': 'ایجاد شده: ',
  'Saved: ': 'ذخیره شد: ',
  'Gift: ': 'هدیه: ',
  'ID: ': 'شناسه: ',
  'To ': 'گیرنده: ',
  'Subscription: ': 'اشتراک: ',
  'Tokens: ': 'توکن‌ها: ',
  'Loading…': 'در حال بارگذاری…',
  'Loading...': 'در حال بارگذاری…',
  'No accounts yet.': 'هنوز حسابی وجود ندارد.',
  'No account matches.': 'حسابی پیدا نشد.',
  'No one has signed up yet. Accounts appear here as soon as customers verify their email.': 'هنوز کسی ثبت‌نام نکرده است. پس از تأیید ایمیل مشتری، حساب او اینجا نمایش داده می‌شود.',
  'No customers yet.': 'هنوز مشتری‌ای وجود ندارد.',
  'No file sales yet.': 'هنوز فایلی فروخته نشده است.',
  'No transactions yet.': 'هنوز تراکنشی وجود ندارد.',
  'No transactions.': 'تراکنشی وجود ندارد.',
  'No plan': 'بدون طرح',
  'No rank': 'بدون رتبه',
  '— none —': '— هیچ‌کدام —',
  'active': 'فعال',
  'paused': 'متوقف‌شده',
  'expired': 'منقضی‌شده',
  'cancelled': 'لغوشده',
  'verified': 'تأییدشده',
  'unverified': 'تأییدنشده',
  'never recorded': 'هرگز ثبت نشده',
  'not recorded': 'ثبت نشده',
  'logins': 'ورود',
  'login': 'ورود',
  'file': 'فایل',
  'until ': 'تا ',
  'of': 'از',
  'e.g. 1–2 local · 8 online': 'مثلاً ۱ تا ۲ نفر محلی · ۸ نفر آنلاین',
  'e.g. 25 hours main story': 'مثلاً ۲۵ ساعت برای داستان اصلی',
  'e.g. 5': 'مثلاً ۵',
  'e.g. 123456': 'مثلاً ۱۲۳۴۵۶',
  'e.g. ESRB Mature 17+': 'مثلاً ESRB Mature 17+',
  'e.g. aB3dE9gH1jK5mN7pQ2rS': 'مثلاً aB3dE9gH1jK5mN7pQ2rS',
  'One award per line\nGame of the Year (2024)': 'هر جایزه را در یک خط بنویسید\nبازی سال (۲۰۲۴)',
  'One studio award per line\nStudio game — Best Direction (2024)': 'هر جایزه استودیو را در یک خط بنویسید\nبازی استودیو — بهترین کارگردانی (۲۰۲۴)',
  'Unallocated': 'تخصیص‌نیافته',
  'Closed Tehran period': 'دوره بسته‌شده به وقت تهران',
  'Team sales': 'فروش تیمی',
  'Marketer approval & payout checks': 'تأیید بازاریاب و بررسی پرداخت پاداش',
  'The first weekly report is created at the next Thursday 20:00 close.': 'اولین گزارش هفتگی در پایان پنجشنبه آینده، ساعت ۲۰، ایجاد می‌شود.',
  'No paid DRT-pack orders have created commission records yet.': 'هنوز سفارش خرید بسته DRT که برای آن پورسانتی ثبت شده باشد وجود ندارد.',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'پس از تحویل، دوره انتظار اولیه هفت‌روزه اعمال می‌شود. فقط پورسانت بازاریاب تأییدشده و احراز‌هویت‌شده قابل پرداخت است. همه تسویه‌های این بخش شبیه‌سازی هستند و انتقال بانکی انجام نمی‌شود.',
  'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid token-pack order creates one 100,000-toman test budget.': 'نسخه جدید در مرز پنجشنبه ساعت ۲۰ به وقت تهران فعال می‌شود. قوانین فقط بر سفارش‌های آینده اثر دارند. هر سفارش پرداخت‌شده بسته توکن، یک بودجه آزمایشی ۱۰۰٬۰۰۰ تومانی ایجاد می‌کند.',
  'Only approved marketer accounts can hold a place in the tree or receive commissions. Identity and bank checks are separate; both are needed before a commission becomes payable.': 'فقط حساب‌های بازاریاب تأییدشده می‌توانند در شبکه جایگاه داشته باشند یا پورسانت بگیرند. احراز هویت و تأیید بانکی جداگانه‌اند و هر دو برای قابل‌پرداخت‌شدن پورسانت لازم هستند.',
  'The first weekly report is created at the next Thursday 20:00 close.': 'اولین گزارش هفتگی در پایان پنجشنبه آینده، ساعت ۲۰، ایجاد می‌شود.',
  'SIMULATED': 'آزمایشی',
  'Settled (simulated)': 'تسویه‌شده (آزمایشی)',
  'In hold / pending': 'در دوره انتظار / معلق',
  'Reversed': 'برگشت‌خورده',
  'Paid': 'پرداخت‌شده',
  'Pending': 'در انتظار',
  'Active': 'فعال',
  'Off': 'غیرفعال',
  'None.': 'هیچ‌کدام.',
  'anyone': 'همه',
  'unlimited per customer': 'نامحدود برای هر مشتری',
  'only you see this': 'فقط شما این را می‌بینید',
  'empty = anyone; or type an email / username': 'خالی = همه؛ یا ایمیل / نام کاربری وارد کنید',
  'Generate': 'ساخت کد',
  'Uses': 'دفعات استفاده',
  'Subscriptions': 'اشتراک‌ها',
  'File unlocks (DRT)': 'بازکردن فایل با DRT',
  'Token packs': 'بسته‌های توکن',
  'files': 'فایل‌ها',
  'packs': 'بسته‌ها',
  'plans': 'طرح‌ها',
  'for': 'برای',
  'just now': 'همین حالا',
  'never': 'هرگز',
  'not recorded': 'ثبت نشده',
  'never recorded': 'هرگز ثبت نشده',
  'opened': 'بازشده',
  'approved': 'تأییدشده',
  'rejected': 'ردشده',
  'done': 'انجام‌شده',
  'working': 'در حال انجام',
  'new': 'جدید',
  'resolved': 'رسیدگی‌شده',
  'open': 'باز',
  'paid': 'پرداخت‌شده',
  'pending': 'در انتظار',
  'test': 'آزمایشی',
  'manual': 'دستی',
  'SIMULATED': 'آزمایشی',
  'Quick add from the game catalog': 'افزودن سریع از فهرست بازی‌ها',
  'Refill from the game catalog': 'تکمیل اطلاعات از فهرست بازی‌ها',
  'Saved, but the cover could not be downloaded: ': 'ذخیره شد، اما دریافت کاور ناموفق بود: ',
  'translated — please review it': 'ترجمه شد — لطفاً بازبینی کنید',
  'Auto-translate English → Persian': 'ترجمه خودکار انگلیسی به فارسی',
  'English': 'انگلیسی',
  'Persian (فارسی)': 'فارسی',
  'Creator studio logo URL (optional)': 'نشانی لوگوی استودیو سازنده (اختیاری)',
  'Critic score / Metacritic (0–100)': 'امتیاز منتقدان / متاکریتیک (۰ تا ۱۰۰)',
  'Play time source': 'منبع مدت زمان بازی',
  'Players': 'تعداد بازیکنان',
  'Age rating': 'رده‌بندی سنی',
  'Age rating source': 'منبع رده‌بندی سنی',
  'Content descriptors (comma separated)': 'هشدارهای محتوایی (با ویرگول جدا کنید)',
  'DualSense / haptics': 'دوال‌سنس / بازخورد لمسی',
  'VR support': 'پشتیبانی از واقعیت مجازی',
  'Online play': 'بازی آنلاین',
  'Game awards (one per line)': 'جوایز بازی (هر مورد در یک خط)',
  'Studio awards (one per line)': 'جوایز استودیو (هر مورد در یک خط)',
  'Studio awards source': 'منبع جوایز استودیو',
  'Game awards source': 'منبع جوایز بازی',
  'Poster / cover': 'پوستر / کاور',
  'Gameplay screenshots': 'تصاویر گیم‌پلی',
  'Description': 'توضیحات',
  'Or upload images:': 'یا تصویر بارگذاری کنید:',
  'Add URL': 'افزودن نشانی اینترنتی',
  'JPG, PNG or WEBP, square works best (max 10 MB).': 'فرمت JPG، PNG یا WEBP؛ تصویر مربعی بهتر است (حداکثر ۱۰ مگابایت).',
  'Mark as famous': 'علامت‌گذاری به‌عنوان شاخص',
  'Visible on site': 'نمایش در سایت',
  'Most Famous rank (1 = top; empty = not ranked)': 'رتبه شاخص‌ترین‌ها (۱ = اول؛ خالی = بدون رتبه)',
  'The box on the home page opens the Learn page (page text + video above). Leave a field empty to keep the built-in text.': 'کادر صفحه اصلی، صفحه آموزش را باز می‌کند (متن صفحه و ویدیوی بالای آن). برای استفاده از متن پیش‌فرض، فیلد را خالی بگذارید.',
  'The short description under the logo and the line at the very bottom. Leave a box empty to hide that text.': 'توضیح کوتاه زیر لوگو و متن انتهای صفحه. برای پنهان‌کردن، کادر مربوط را خالی بگذارید.',
  'Just the username or number. The footer builds the link for you. Leave empty to hide that account.': 'فقط نام کاربری یا شماره را وارد کنید؛ پیوند در پاورقی ساخته می‌شود. برای پنهان‌کردن حساب، خالی بگذارید.',
  'These also appear on the Contact Us page. Leave empty to hide.': 'این موارد در صفحه تماس با ما هم نمایش داده می‌شوند. برای پنهان‌کردن، خالی بگذارید.',
  'Search': 'جست‌وجو',
  'View': 'مشاهده',
  'View the site': 'مشاهده سایت',
  'Open profile': 'مشاهده پروفایل',
  'Make admin': 'تبدیل به مدیر',
  'Remove admin': 'لغو دسترسی مدیر',
  'Adjust DRT': 'تغییر موجودی DRT',
  'Balance updated': 'موجودی به‌روزرسانی شد',
  'Account deleted': 'حساب حذف شد',
  'Copied: ': 'کپی شد: ',
  'Saved: ': 'ذخیره شد: ',
  'ID: ': 'شناسه: ',
  'To ': 'گیرنده: ',
  'Still showing demo text on the site: ': 'متن نمونه هنوز در سایت نمایش داده می‌شود: ',
  'Missing in .env: ': 'موارد زیر در فایل .env تنظیم نشده‌اند: ',
  'sms.ir key works. Credit: ': 'کلید sms.ir معتبر است. اعتبار: ',
  'sms.ir said: ': 'پاسخ sms.ir: ',
  'SMTP check failed: ': 'بررسی SMTP ناموفق بود: ',
  'Request failed (': 'درخواست ناموفق بود (',
  'months ago': 'ماه پیش',
  'years ago': 'سال پیش',
  'days ago': 'روز پیش',
  'h ago': 'ساعت پیش',
  'min ago': 'دقیقه پیش',
  'accounts': 'حساب',
  'people asked': 'نفر درخواست داده‌اند',
  'shots': 'تصویر',
  'toman': 'تومان',
  'unread': 'خوانده‌نشده',
  'login': 'ورود',
  'logins': 'ورود',
  'files': 'فایل‌ها',
  'file': 'فایل',
  'until ': 'تا ',
  'just now': 'همین حالا',
});
Object.assign(ADMIN_FA, {
  'Terms of Service': 'شرایط استفاده از خدمات',
  'Privacy Policy': 'سیاست حفظ حریم خصوصی',
  'Refund Policy': 'سیاست بازپرداخت',
  'customised': 'سفارشی‌سازی‌شده',
  'default text': 'متن پیش‌فرض',
  'Use default text': 'استفاده از متن پیش‌فرض',
  'Last updated': 'آخرین به‌روزرسانی',
  'View page': 'مشاهده صفحه',
  'Sign-up consent': 'رضایت هنگام ثبت‌نام',
  'New customers must tick "I agree to the Terms of Service and the Privacy Policy" to create an account': 'مشتریان جدید برای ساخت حساب باید گزینه پذیرش شرایط استفاده و سیاست حفظ حریم خصوصی را علامت بزنند.',
  'These are starter texts, not legal advice. ': 'این متن‌ها نمونه اولیه هستند و مشاوره حقوقی محسوب نمی‌شوند. ',
  'Read them, adjust them to how you really work, and have a lawyer check them for your country before relying on them. A page shows a "last updated" date only after you edit its text.': 'متن‌ها را بخوانید و با شیوه واقعی کارتان هماهنگ کنید. پیش از استفاده، از وکیلی در کشور خود بخواهید آن‌ها را بررسی کند. تاریخ «آخرین به‌روزرسانی» فقط پس از ویرایش متن نمایش داده می‌شود.',
  'E-Namad trust badge (Iran)': 'نشان اعتماد اینماد (ایران)',
  'After E-Namad (enamad.ir) approves your website they give you a small HTML snippet. Inside it you will see an address like trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... Copy the number after id= and the text after Code= into the two boxes. The badge then appears in the footer of every page. Leave both empty to hide it.': 'پس از تأیید سایت توسط اینماد، یک قطعه کد HTML دریافت می‌کنید. در آن نشانی‌ای مانند trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... وجود دارد. عدد پس از id= و متن پس از Code= را در دو کادر وارد کنید تا نشان در پاورقی همه صفحات نمایش داده شود. برای پنهان‌کردن نشان، هر دو کادر را خالی بگذارید.',
  'E-Namad ID (the number after id=)': 'شناسه اینماد (عدد پس از id=)',
  'E-Namad code (the text after Code=)': 'کد اینماد (متن پس از Code=)',
  'Save legal pages & trust settings': 'ذخیره صفحات قوانین و تنظیمات اعتماد',
  'Save legal pages': 'ذخیره صفحات قوانین',
  'Saved. "Last updated" date set to today.': 'ذخیره شد. تاریخ «آخرین به‌روزرسانی» روی امروز تنظیم شد.',
  'Requests from the "Request a game / subtitle" page and the button on every game page. When several people ask for the same thing they are grouped, so the most wanted ones are listed first.': 'درخواست‌های صفحه «درخواست بازی / زیرنویس» و دکمه صفحه هر بازی اینجا نمایش داده می‌شوند. درخواست‌های تکراری گروه‌بندی می‌شوند تا موارد پرتقاضاتر در ابتدا باشند.',
  'New and in progress': 'جدید و در حال انجام',
  'New': 'جدید',
  'In progress': 'در حال انجام',
  'Done': 'انجام‌شده',
  'Customer-visible update': 'به‌روزرسانی قابل‌مشاهده برای مشتری',
  'Customer update saved': 'به‌روزرسانی مشتری ذخیره شد',
  'private note': 'یادداشت خصوصی',
  'Note saved': 'یادداشت ذخیره شد',
  'No details': 'بدون جزئیات',
  '(no details)': '(بدون جزئیات)',
  '(no game named)': '(نام بازی ثبت نشده)',
  'people asked': 'نفر درخواست داده‌اند',
  'open the game page': 'بازکردن صفحه بازی',
  'Delete this request?': 'این درخواست حذف شود؟',
  'Nothing here.': 'موردی وجود ندارد.',
  'Automatic add queued': 'افزودن خودکار در صف است',
  'Automatic add running': 'افزودن خودکار در حال انجام است',
  'Added to website': 'به سایت اضافه شد',
  'Already on website': 'از قبل در سایت موجود است',
  'Needs Quick Add review': 'نیازمند بررسی در افزودن سریع',
  'Open Quick Add': 'بازکردن افزودن سریع',
  'The requested title could not be matched.': 'عنوان درخواستی قابل تطبیق نبود.',
  'Automatic search failed. Open Quick Add to search manually.': 'جست‌وجوی خودکار ناموفق بود. برای جست‌وجوی دستی افزودن سریع را باز کنید.',
  'No exact catalog match was found. Choose the correct result in Quick Add.': 'تطبیق دقیق پیدا نشد. نتیجه درست را در افزودن سریع انتخاب کنید.',
  'No catalog match was found. Search manually in Quick Add.': 'تطبیقی پیدا نشد. در افزودن سریع دستی جست‌وجو کنید.',
  'Game details could not be imported. Open Quick Add to finish it manually.': 'اطلاعات بازی وارد نشد. افزودن سریع را باز کنید و آن را دستی تکمیل کنید.',
  'Imported details did not match the requested title. Choose the correct result in Quick Add.': 'اطلاعات واردشده با عنوان درخواستی یکی نبود. نتیجه درست را در افزودن سریع انتخاب کنید.',
  'This game is already in the catalog but hidden from the website.': 'این بازی در فهرست هست، اما در سایت پنهان شده است.',
  'Imported data did not pass the catalog checks. Open Quick Add to review it.': 'اطلاعات واردشده بررسی‌های فهرست را نگذرانده است. آن را در افزودن سریع بررسی کنید.',
  'Automatic import is unavailable. Open Quick Add to review this request.': 'افزودن خودکار در دسترس نیست. این درخواست را در افزودن سریع بررسی کنید.',
  'Automatic import did not return a result.': 'افزودن خودکار نتیجه‌ای برنگرداند.',
  'Automatic import failed. Open Quick Add to finish this request manually.': 'افزودن خودکار ناموفق بود. برای تکمیل دستی، افزودن سریع را باز کنید.',
  'The game page is live. Download files will appear when they are ready.': 'صفحه بازی در سایت فعال شد. فایل‌های دانلود پس از آماده‌شدن نمایش داده می‌شوند.',
  'This game is already listed on the website.': 'این بازی از قبل در سایت فهرست شده است.',
  'Language': 'زبان',
  'Site address': 'نشانی سایت',
  'English text  (use {game} {files} {link})': 'متن انگلیسی (از {game}، {files} و {link} استفاده کنید)',
  'Persian text': 'متن فارسی',
  'Connected: messages are sent to your channel': 'متصل است: پیام‌ها به کانال شما ارسال می‌شوند',
  'Not connected yet: ': 'هنوز متصل نشده است: ',
  'Announcements on': 'اعلان‌ها فعال باشند',
  'Announce new games': 'اعلان بازی‌های جدید',
  'Announce new files': 'اعلان فایل‌های جدید',
  'Posts to your Telegram channel when you add a game or upload files. Several files uploaded for one game within about 15 seconds become one post.': 'با افزودن بازی یا بارگذاری فایل، در کانال تلگرام شما پیام منتشر می‌شود. چند فایل یک بازی که در فاصله حدود ۱۵ ثانیه بارگذاری شوند، در یک پیام قرار می‌گیرند.',
  'Send test message': 'ارسال پیام آزمایشی',
  'Test message sent': 'پیام آزمایشی ارسال شد',
  'Not sent (see the list below)': 'ارسال نشد (فهرست زیر را ببینید)',
  'Latest messages': 'آخرین پیام‌ها',
  'Clear list': 'پاک‌کردن فهرست',
  'sent': 'ارسال شد',
  'NOT sent': 'ارسال نشده',
  'Nothing yet.': 'هنوز موردی وجود ندارد.',
  'No reports yet. Reports sent with the Report button on game pages appear here.': 'هنوز گزارشی وجود ندارد. گزارش‌هایی که از دکمه گزارش در صفحه بازی ثبت می‌شوند اینجا نمایش داده می‌شوند.',
  'Open': 'باز',
  'Resolved': 'رسیدگی‌شده',
  'Unrelated content': 'محتوای نامرتبط',
  'Over-age / inappropriate screenshot': 'تصویر نامناسب یا دارای محدودیت سنی',
  'Broken file or download': 'فایل یا دانلود خراب است',
  'Wrong game information': 'اطلاعات بازی اشتباه است',
  'Something else': 'مورد دیگر',
  'View game': 'مشاهده بازی',
  'Mark resolved': 'علامت‌گذاری به‌عنوان رسیدگی‌شده',
  'Reopen': 'بازگشایی',
  'Edit game': 'ویرایش بازی',
  'Delete this report?': 'این گزارش حذف شود؟',
  'No messages yet. Messages sent from the Contact Us page appear here.': 'هنوز پیامی وجود ندارد. پیام‌های صفحه تماس با ما اینجا نمایش داده می‌شوند.',
  'Mark unread': 'علامت‌گذاری به‌عنوان خوانده‌نشده',
  'Mark read': 'علامت‌گذاری به‌عنوان خوانده‌شده',
  'Password': 'رمز عبور',
  'Could not sign in.': 'ورود انجام نشد.',
  'This account has not been approved for admin access. Ask the root admin to enable it in Customers.': 'این حساب برای دسترسی مدیریت تأیید نشده است. از مدیر اصلی بخواهید دسترسی را در بخش مشتریان فعال کند.',
  'Too many attempts, try again later.': 'تعداد تلاش‌ها بیش از حد است؛ بعداً دوباره امتحان کنید.',
  'Session expired, please log in again': 'نشست شما منقضی شده است؛ دوباره وارد شوید',
  'Request failed (': 'درخواست ناموفق بود (',
  'Unknown error': 'خطای نامشخص',
  'Unauthorized': 'دسترسی غیرمجاز',
  'Forbidden': 'دسترسی ممنوع است',
  'Internal server error': 'خطای داخلی سرور',
  'Image': 'تصویر',
  'Date': 'تاریخ',
  'Price': 'قیمت',
  'Total': 'مجموع',
  'Change': 'تغییر',
  'Joined': 'تاریخ عضویت',
  'Status': 'وضعیت',
  'Actions': 'عملیات',
  'Details': 'جزئیات',
  'Account': 'حساب',
  'File': 'فایل',
  'Game': 'بازی',
  'Customer': 'مشتری',
  'Phone': 'تلفن',
  'Email': 'ایمیل',
  'Plan': 'طرح',
  'Period': 'دوره',
  'Note': 'یادداشت',
  'History': 'تاریخچه',
  'Mode': 'حالت',
  'State': 'وضعیت',
  'Rank': 'رتبه',
  'Content': 'محتوا',
  'Released': 'تاریخ انتشار',
  'Title': 'عنوان',
  'Category': 'دسته‌بندی',
  'Balance': 'موجودی',
  'Tokens': 'توکن‌ها',
  'Price (DRT)': 'قیمت (DRT)',
  'Color': 'رنگ',
  'Button link': 'پیوند دکمه',
  'Button text (English)': 'متن دکمه (انگلیسی)',
  'Button text (Persian)': 'متن دکمه (فارسی)',
  'Features, one per line (English)': 'امکانات، هر مورد در یک خط (انگلیسی)',
  'Features, one per line (Persian)': 'امکانات، هر مورد در یک خط (فارسی)',
  'DRT tokens': 'توکن‌های DRT',
  'DRT tokens included with this plan': 'تعداد توکن DRT همراه این طرح',
  'Bonus DRT (extra)': 'پاداش DRT (اضافی)',
  'Mark as most popular': 'علامت‌گذاری به‌عنوان محبوب‌ترین',
  'Max 12 packs': 'حداکثر ۱۲ بسته مجاز است',
  'Max 8 plans': 'حداکثر ۸ طرح مجاز است',
  'No one has signed up yet. Accounts appear here as soon as customers verify their email.': 'هنوز کسی ثبت‌نام نکرده است. پس از تأیید ایمیل مشتری، حساب او اینجا نمایش داده می‌شود.',
});
Object.assign(ADMIN_FA, {
  'SMS (sms.ir) is connected': 'پیامک (sms.ir) متصل است',
  'Phone verification codes are sent by SMS.': 'کدهای تأیید تلفن با پیامک ارسال می‌شوند.',
  'SMS is not fully set up yet': 'تنظیم پیامک هنوز کامل نشده است',
  'sms.ir is already connected to account phone verification, but no SMS is sent until these settings are filled in. On localhost, the test code appears in the verification form.': 'اتصال sms.ir برای تأیید تلفن حساب آماده است، اما تا تکمیل تنظیمات پیامکی ارسال نمی‌شود. در localhost کد آزمایشی در فرم تأیید نمایش داده می‌شود.',
  'Email sending is configured': 'ارسال ایمیل پیکربندی شده است',
  'Verification codes are emailed to customers.': 'کدهای تأیید برای مشتریان ایمیل می‌شوند.',
  'Email is not set up yet': 'ایمیل هنوز پیکربندی نشده است',
  'No email is actually sent, so customers never receive their verification code. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM to the .env file and restart. On localhost, the verification form now displays the test code; messages are also listed here:': 'در حال حاضر ایمیلی ارسال نمی‌شود و مشتریان کد تأیید را دریافت نمی‌کنند. SMTP_HOST، SMTP_PORT، SMTP_USER، SMTP_PASS و MAIL_FROM را به فایل .env اضافه و سرور را دوباره راه‌اندازی کنید. در localhost کد آزمایشی در فرم تأیید نمایش داده می‌شود و پیام‌ها نیز اینجا فهرست می‌شوند:',
  'Test SMTP connection (no email sent)': 'آزمایش اتصال SMTP (ایمیلی ارسال نمی‌شود)',
  'SMTP connection works. No email was sent.': 'اتصال SMTP برقرار است. ایمیلی ارسال نشد.',
  'Email sending is configured': 'ارسال ایمیل پیکربندی شده است',
  'Verification codes are emailed to customers.': 'کدهای تأیید برای مشتریان ایمیل می‌شوند.',
  'Paid file purchases and DRT spending are separate from cash revenue. Correct catalog issues in Games; update customer requests in Requests.': 'خرید فایل بازی و مصرف DRT از درآمد نقدی جدا هستند. مشکلات فهرست را در بخش بازی‌ها اصلاح کنید و درخواست‌های مشتریان را در بخش درخواست‌ها به‌روز کنید.',
  'Paid file purchases': 'خریدهای فایل پولی',
  'DRT spent': 'DRT مصرف‌شده',
  'Open requests': 'درخواست‌های باز',
  'Wishlist saves': 'افزودن به علاقه‌مندی‌ها',
  'Best sellers': 'پرفروش‌ترین‌ها',
  'paid purchases': 'خرید پولی',
  'No paid purchases yet. The empty homepage section stays hidden.': 'هنوز خرید پولی ثبت نشده است. بخش خالی صفحه اصلی پنهان می‌ماند.',
  'Missing content': 'محتوای ناقص',
  'Export catalog issues': 'خروجی مشکلات فهرست بازی‌ها',
  'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid token-pack order creates one 100,000-toman test budget.': 'نسخه جدید در مرز زمانی پنجشنبه ساعت ۲۰ به وقت تهران فعال می‌شود. قوانین فقط روی سفارش‌های آینده اثر دارند. هر سفارش پرداخت‌شده بسته توکن، یک بودجه آزمایشی ۱۰۰٬۰۰۰ تومانی ایجاد می‌کند.',
  'Fixed order budget (toman)': 'بودجه ثابت هر سفارش (تومان)',
  'Direct marketer (toman)': 'سهم بازاریاب معرف (تومان)',
  'Seven upline shares, comma separated (toman)': 'سهم هفت سطح بالاسری، با ویرگول جدا کنید (تومان)',
  'Rank reserve (toman)': 'ذخیره رتبه (تومان)',
  'Initial hold after delivery (days)': 'مدت انتظار اولیه پس از تحویل (روز)',
  'Open levels': 'لایه‌های باز',
  'Save a new rules version': 'ذخیره نسخه جدید قوانین',
  'Marketer status saved': 'وضعیت بازاریاب ذخیره شد',
  'No rank': 'بدون رتبه',
  'Marketer approval & payout checks': 'تأیید بازاریاب و بررسی شرایط پرداخت',
  'Only approved marketer accounts can hold a place in the tree or receive commissions. Identity and bank checks are separate; both are needed before a commission becomes payable.': 'فقط حساب‌های بازاریاب تأییدشده می‌توانند در درخت جایگاه داشته باشند یا پورسانت بگیرند. احراز هویت و تأیید اطلاعات بانکی جدا هستند و برای قابل‌پرداخت‌شدن پورسانت، هر دو لازم‌اند.',
  'This week': 'این هفته',
  'Marketer': 'بازاریاب',
  'Identity': 'هویت',
  'Bank': 'بانک',
  'Bank details': 'اطلاعات بانکی',
  'No accounts yet.': 'هنوز حسابی وجود ندارد.',
  'Reversed': 'برگشت‌خورده',
  'In hold / pending': 'در انتظار / تعلیق‌شده',
  'Settled (simulated)': 'تسویه‌شده (آزمایشی)',
  'Record a test-only refund reversal for this order? This does not refund real money or change a customer wallet.': 'برگشت آزمایشی وجه این سفارش ثبت شود؟ این کار پول واقعی را بازپرداخت نمی‌کند و کیف پول مشتری را تغییر نمی‌دهد.',
  'Test commission reversal recorded': 'برگشت آزمایشی پورسانت ثبت شد',
  'Reverse test sale': 'برگشت فروش آزمایشی',
  'Recent commission sales': 'فروش‌های اخیر دارای پورسانت',
  'Run a test settlement? This only writes simulated commission ledger entries. It does not transfer money.': 'تسویه آزمایشی اجرا شود؟ این کار فقط ردیف‌های شبیه‌سازی‌شده پورسانت را ثبت می‌کند و پولی جابه‌جا نمی‌کند.',
  'No finalized commissions are payable yet': 'هنوز پورسانت قطعی و قابل‌پرداختی وجود ندارد',
  'Simulate weekly settlement': 'شبیه‌سازی تسویه هفتگی',
  'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.': 'دوره انتظار اولیه هفت‌روزه پس از تحویل شروع می‌شود. فقط بازاریابان تأییدشده و احرازشده شرایط دریافت دارند. همه تسویه‌های این بخش آزمایشی هستند و انتقال بانکی انجام نمی‌شود.',
  'Delivered': 'تحویل‌شده',
  'Attributed marketer': 'بازاریاب منتسب‌شده',
  'Budget': 'بودجه',
  'Unallocated': 'تخصیص‌نیافته',
  'Reserve': 'ذخیره',
  'State': 'وضعیت',
  'No paid DRT-pack orders have created commission records yet.': 'هنوز سفارشی برای خرید بسته DRT ثبت نشده که برای آن رکورد پورسانت ایجاد شده باشد.',
  'SIMULATED': 'آزمایشی',
  'Settlement started': 'تسویه آغاز شد',
  'No payable commissions': 'پورسانت قابل‌پرداختی وجود ندارد',
  'The first weekly report is created at the next Thursday 20:00 close.': 'نخستین گزارش هفتگی در پایان پنجشنبه آینده، ساعت ۲۰ ایجاد می‌شود.',
  'Test ledger only.': 'فقط دفتر آزمایشی.',
  'Commission calculations and settlement records do not transfer money. Public payouts remain disabled.': 'محاسبات پورسانت و سوابق تسویه پولی منتقل نمی‌کنند. پرداخت عمومی غیرفعال است.',
  'New and in progress': 'جدید و در حال انجام',
  'In progress': 'در حال انجام',
  'Subtitle': 'زیرنویس',
  'New game': 'بازی جدید',
  'Other': 'سایر',
  'Customer-visible update': 'پیام قابل‌مشاهده برای مشتری',
  'private note': 'یادداشت خصوصی',
  'Customer update saved': 'پیام مشتری ذخیره شد',
  'Note saved': 'یادداشت ذخیره شد',
  'open the game page': 'بازکردن صفحه بازی',
  '(no game named)': '(نام بازی وارد نشده)',
  'Delete this request?': 'این درخواست حذف شود؟',
  'Requests from the "Request a game / subtitle" page and the button on every game page. When several people ask for the same thing they are grouped, so the most wanted ones are listed first.': 'درخواست‌های صفحه «درخواست بازی یا زیرنویس» و دکمه موجود در صفحه هر بازی در این بخش دیده می‌شوند. درخواست‌های مشابه گروه‌بندی می‌شوند تا موارد پرتکرار بالاتر نمایش داده شوند.',
  'English + Persian': 'انگلیسی + فارسی',
  'English only': 'فقط انگلیسی',
  'Persian only': 'فقط فارسی',
  'Connected: messages are sent to your channel': 'متصل است: پیام‌ها به کانال شما ارسال می‌شوند',
  'Announcements on': 'فعال‌بودن اطلاعیه‌ها',
  'Announce new games': 'اعلام بازی‌های جدید',
  'Announce new files': 'اعلام فایل‌های جدید',
  'Language': 'زبان',
  'Site address': 'نشانی سایت',
  'English text  (use {game} {files} {link})': 'متن انگلیسی (از {game}، {files} و {link} استفاده کنید)',
  'Persian text': 'متن فارسی',
  'Send test message': 'ارسال پیام آزمایشی',
  'Test message sent': 'پیام آزمایشی ارسال شد',
  'Clear list': 'پاک‌کردن فهرست',
  'sent': 'ارسال‌شده',
  'NOT sent': 'ارسال‌نشده',
  'Nothing yet.': 'هنوز موردی وجود ندارد.',
  'Posts to your Telegram channel when you add a game or upload files. Several files uploaded for one game within about 15 seconds become one post.': 'با افزودن بازی یا بارگذاری فایل، در کانال تلگرام شما پست منتشر می‌شود. چند فایل که برای یک بازی در فاصله حدود ۱۵ ثانیه بارگذاری شوند، در یک پست قرار می‌گیرند.',
  'Open': 'باز',
  'Resolved': 'رسیدگی‌شده',
  'Unrelated content': 'محتوای نامرتبط',
  'Over-age / inappropriate screenshot': 'محدودیت سنی یا تصویر نامناسب',
  'Broken file or download': 'فایل یا دانلود خراب',
  'Wrong game information': 'اطلاعات نادرست بازی',
  'Something else': 'مورد دیگر',
  'No reports yet. Reports sent with the Report button on game pages appear here.': 'هنوز گزارشی وجود ندارد. گزارش‌های ارسال‌شده از دکمه گزارش صفحه بازی‌ها اینجا نمایش داده می‌شوند.',
  '(no details)': '(بدون توضیحات)',
  'View game': 'مشاهده بازی',
  'Mark resolved': 'علامت‌گذاری به‌عنوان رسیدگی‌شده',
  'Reopen': 'بازگشایی',
  'Edit game': 'ویرایش بازی',
  'Delete this report?': 'این گزارش حذف شود؟',
  'No messages yet. Messages sent from the Contact Us page appear here.': 'هنوز پیامی وجود ندارد. پیام‌های صفحه تماس با ما اینجا نمایش داده می‌شوند.',
  'Mark unread': 'علامت‌گذاری به‌عنوان خوانده‌نشده',
  'Mark read': 'علامت‌گذاری به‌عنوان خوانده‌شده',
  'Delete this message?': 'این پیام حذف شود؟',
  'No codes yet. Press "+ New code".': 'هنوز کدی وجود ندارد. «+ کد جدید» را بزنید.',
  'anyone': 'همه',
  'per customer': 'برای هر مشتری',
  'unlimited per customer': 'نامحدود برای هر مشتری',
  'never': 'هرگز',
  'Discount & gift codes': 'کدهای تخفیف و هدیه',
  'A percent code takes a % off a purchase (customers activate it once, it is used on their next matching purchase). A gift code puts DRT in the wallet straight away. Give a code to one specific customer, or to anyone who knows it.': 'کد درصدی از خرید تخفیف می‌دهد و پس از فعال‌سازی، در خرید واجد شرایط بعدی استفاده می‌شود. کد هدیه فوراً DRT را به کیف پول می‌افزاید. کد را به یک مشتری مشخص بدهید یا در اختیار همه قرار دهید.',
  'leave empty to generate one': 'برای ساخت خودکار کد، خالی بگذارید',
  'Generate': 'ساخت کد',
  'Percent off a purchase': 'درصد تخفیف خرید',
  'Gift: DRT added to the wallet': 'هدیه: افزودن DRT به کیف پول',
  'File unlocks (DRT)': 'بازکردن فایل (DRT)',
  'Token packs': 'بسته‌های توکن',
  'Subscriptions': 'اشتراک‌ها',
  'empty = anyone; or type an email / username': 'خالی = همه؛ یا ایمیل / نام کاربری را وارد کنید',
  'only you see this': 'فقط شما این یادداشت را می‌بینید',
  'Percent off (1-100)': 'درصد تخفیف (۱ تا ۱۰۰)',
  'DRT given to the customer': 'مقدار DRT هدیه به مشتری',
  'Applies to': 'اعمال برای',
  'Create code': 'ایجاد کد',
  'Give it to one customer only (optional)': 'اختصاص به یک مشتری (اختیاری)',
  'Total uses allowed (0 = unlimited)': 'تعداد کل استفاده مجاز (۰ = نامحدود)',
  'Uses per customer (0 = unlimited)': 'استفاده برای هر مشتری (۰ = نامحدود)',
  'Expires on (optional)': 'تاریخ انقضا (اختیاری)',
  'Private note': 'یادداشت خصوصی',
  'Code is active': 'کد فعال است',
  'The site shows a "last updated" date only after you edit its text.': 'تاریخ «آخرین به‌روزرسانی» فقط پس از ویرایش متن صفحه نمایش داده می‌شود.',
  'These are starter texts, not legal advice.': 'این متن‌ها نمونه اولیه هستند و مشاوره حقوقی نیستند.',
  'Sign-up consent': 'رضایت هنگام ثبت‌نام',
  'E-Namad trust badge (Iran)': 'نشان اعتماد اینماد (ایران)',
  'After E-Namad (enamad.ir) approves your website they give you a small HTML snippet. Inside it you will see an address like trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... Copy the number after id= and the text after Code= into the two boxes. The badge then appears in the footer of every page. Leave both empty to hide it.': 'پس از تأیید سایت توسط اینماد، یک قطعه کد HTML دریافت می‌کنید. در آن نشانی‌ای مانند trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... می‌بینید. عدد پس از id= و متن پس از Code= را در دو کادر وارد کنید تا نشان در پاورقی همه صفحات نمایش داده شود. برای پنهان‌کردن نشان، هر دو کادر را خالی بگذارید.',
  'Save legal pages & trust settings': 'ذخیره صفحات حقوقی و تنظیمات اعتماد',
  'e.g. 123456': 'مثلاً ۱۲۳۴۵۶',
  'Replace this text with the built-in default?': 'این متن با متن پیش‌فرض جایگزین شود؟',
  'Use default text': 'استفاده از متن پیش‌فرض',
  'customised': 'سفارشی‌شده',
  'default text': 'متن پیش‌فرض',
  'View page': 'مشاهده صفحه',
  'No messages yet.': 'هنوز پیامی وجود ندارد.',
  'No reports yet.': 'هنوز گزارشی وجود ندارد.',
  'No accounts yet.': 'هنوز حسابی وجود ندارد.',
  'SIMULATED': 'آزمایشی',
  'SIMULATED ': 'آزمایشی ',
  'IN PROGRESS': 'در حال انجام',
  'test mode': 'حالت آزمایشی',
  'Tokens: ': 'توکن‌ها: ',
  'Subscription: ': 'اشتراک: ',
  'Last updated ': 'آخرین به‌روزرسانی ',
  'Version ': 'نسخه ',
  'Marked as ': 'علامت‌گذاری شد: ',
  'Copy this:': 'این را کپی کنید:',
  'Reset to demo footer': 'بازنشانی پاورقی نمونه',
  'View the site': 'مشاهده سایت',
  'Save footer': 'ذخیره پاورقی',
  'Footer text': 'متن پاورقی',
  'Description (English)': 'توضیحات (انگلیسی)',
  'Description (Persian)': 'توضیحات (فارسی)',
  'Instagram username (e.g. drgame.official)': 'نام کاربری اینستاگرام (مثلاً drgame.official)',
  'Phone 1 (e.g. +98 912 123 4567)': 'تلفن ۱ (مثلاً ‎+98 912 123 4567)',
  'Phone 2': 'تلفن ۲',
  'Email': 'ایمیل',
  'Reset to demo footer': 'بازنشانی پاورقی نمونه',
  'Anyone': 'همه',
  'All': 'همه',
  'All statuses': 'همه وضعیت‌ها',
  'All categories': 'همه دسته‌بندی‌ها',
  'All games': 'همه بازی‌ها',
  'Current status': 'وضعیت فعلی',
  'Customer-visible': 'قابل‌مشاهده برای مشتری',
  'Details': 'جزئیات',
  'Date': 'تاریخ',
  'Total': 'مجموع',
  'Mode': 'حالت',
  'Settlement': 'تسویه',
  'Sales': 'فروش‌ها',
  'Rank': 'رتبه',
  'Team sales': 'فروش تیمی',
  'Account': 'حساب',
  'Invite code': 'کد دعوت',
  'Marketers': 'بازاریابان',
  'Status': 'وضعیت',
  'Expires': 'انقضا',
  'Used': 'استفاده‌شده',
  'What it does': 'عملکرد',
  'For': 'برای',
  'Code': 'کد',
  'Copy': 'کپی',
  'Edit': 'ویرایش',
  'Create': 'ایجاد',
  'Save': 'ذخیره',
  'Cancel': 'لغو',
  'Delete': 'حذف',
  'Update': 'به‌روزرسانی',
  'Customer': 'مشتری',
  'Item': 'مورد',
  'Price': 'قیمت',
  'Tokens': 'توکن‌ها',
  'Joined': 'تاریخ عضویت',
  'Balance': 'موجودی',
  'Plan': 'طرح',
  'Open levels': 'لایه‌های باز',
  'Closed Tehran period': 'دوره بسته‌شده به وقت تهران',
  'No simulated settlements yet.': 'هنوز تسویه آزمایشی ثبت نشده است.',
  'Weekly close reports': 'گزارش‌های پایان هفته',
  'Simulated settlement history': 'سوابق تسویه آزمایشی',
  'Rank reserve': 'ذخیره رتبه',
  'Reversed test sales': 'فروش‌های آزمایشی برگشتی',
  'Commission budget': 'بودجه پورسانت',
  'Qualifying pack sales': 'فروش بسته‌های واجد شرایط',
  'Total uses': 'تعداد کل استفاده',
  'New discount / gift code': 'کد تخفیف / هدیه جدید',
  'Edit code ': 'ویرایش کد ',
  'Gift: DRT': 'هدیه: DRT',
  'Send test': 'ارسال آزمایشی',
  'Newest first': 'ابتدا جدیدترین',
  'Oldest first': 'ابتدا قدیمی‌ترین',
  'Release date': 'تاریخ انتشار',
  'Download files': 'فایل‌های دانلودی',
  'English description': 'توضیحات انگلیسی',
  'Persian description': 'توضیحات فارسی',
  'Game description': 'توضیحات بازی',
  'Company awards': 'جوایز شرکت سازنده',
  'Company logo': 'نشان شرکت سازنده',
  'Cover image': 'تصویر کاور',
  'Awards': 'جوایز',
  'Awards source': 'منبع جوایز',
  'Company awards source': 'منبع جوایز شرکت',
  'Screenshots': 'تصاویر بازی',
  'Game files': 'فایل‌های بازی',
  'Platforms': 'پلتفرم‌ها',
  'Players': 'تعداد بازیکنان',
  'Age rating': 'رده سنی',
  'Playtime': 'مدت بازی',
  'Metacritic score': 'امتیاز متاکریتیک',
  '(not verified yet)': '(هنوز تأیید نشده)',
  'Click the right game:': 'بازی درست را انتخاب کنید:',
  '(negative number removes):': '(عدد منفی باعث کسر می‌شود):',
  '(use a negative number to remove):': '(برای کسر، عدد منفی وارد کنید):',
  'No paid DRT-pack orders have created commission records yet.': 'هنوز سفارش خرید بسته DRT ثبت نشده که برای آن رکورد پورسانت ایجاد شده باشد.',
  'No finalized commissions are payable yet': 'هنوز پورسانت قطعی و قابل‌پرداختی وجود ندارد',
  'Marketer status saved': 'وضعیت بازاریاب ذخیره شد',
  'Customer update saved': 'پیام مشتری ذخیره شد',
  'SMTP check failed: ': 'بررسی SMTP ناموفق بود: ',
  'sms.ir said: ': 'پاسخ sms.ir: ',
  'sms.ir key works. Credit: ': 'کلید sms.ir معتبر است. اعتبار: ',
  'Request failed (': 'درخواست ناموفق بود (',
});

Object.assign(ADMIN_FA, {
  'Paid subscription orders in the current period': 'سفارش‌های اشتراک پرداخت‌شده در دوره فعلی',
  'No qualifying subscription sales in this team this week.': 'این هفته فروش واجد شرایط اشتراک در این تیم ثبت نشده است.',
  'No paid subscriptions have created commission records yet.': 'هنوز اشتراک پرداخت‌شده‌ای که برای آن پورسانت ثبت شده باشد وجود ندارد.',
  'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid subscription order creates one 100,000-toman test budget.': 'نسخه جدید در مرز پنجشنبه ساعت ۲۰ به وقت تهران فعال می‌شود. قوانین فقط روی سفارش‌های آینده اثر دارند. هر سفارش اشتراک پرداخت‌شده، یک بودجه آزمایشی ۱۰۰٬۰۰۰ تومانی ایجاد می‌کند.',
  'Workspace': 'محیط مدیریت',
  'Sections': 'بخش‌ها',
  'Admin workspace': 'محیط مدیریت',
  'Local control panel': 'پنل کنترل محلی',
  'Overview': 'نمای کلی',
  'Catalog': 'فهرست و محتوا',
  'People and payouts': 'کاربران و پرداخت',
  'Communication': 'ارتباطات',
  'Policies': 'قوانین',
});

const adminOriginalText = new WeakMap();
const adminOriginalAttributes = new WeakMap();
const persianDigits = value => String(value).replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
let adminLanguage = (() => {
  try { return localStorage.getItem('drt_admin_lang') === 'fa' ? 'fa' : 'en'; }
  catch (_) { return 'en'; }
})();
function translateAdminText(value) {
  const text = String(value ?? '');
  if (adminLanguage !== 'fa') return text;
  if (text.includes('\n')) return text.split('\n').map(line => translateAdminText(line)).join('\n');
  if (ADMIN_FA[text]) return ADMIN_FA[text];
  const trimmed = text.trim();
  if (ADMIN_FA[trimmed]) return ADMIN_FA[trimmed];
  const listParts = trimmed.split(', ');
  if (listParts.length > 1 && listParts.every(part => ADMIN_FA[part])) return listParts.map(part => ADMIN_FA[part]).join('، ');
  const patterns = [
    [/^Catalog checklist \((\d+) games\)$/i, (_, n) => `فهرست بررسی بازی‌ها (${persianDigits(n)} بازی)`],
    [/^Customer wallets \((\d+)\)$/i, (_, n) => `کیف پول مشتریان (${persianDigits(n)})`],
    [/^Orders waiting for approval \((\d+)\)$/i, (_, n) => `سفارش‌های در انتظار تأیید (${persianDigits(n)})`],
    [/^Commission rules · version (.+) \(test ledger\)$/i, (_, v) => `قوانین پورسانت · نسخه ${persianDigits(v)} (دفتر آزمایشی)`],
    [/^Commission rules · version (.+)$/i, (_, v) => `قوانین پورسانت · نسخه ${persianDigits(v)}`],
    [/^Current Tehran period: (.+) → (.+)\. The active rank comes from the previous week; this week’s team sales set next week’s rank\.$/i, (_, start, end) => `دوره فعلی تهران: ${start} تا ${end}. رتبه فعال این هفته از دوره قبل می‌آید؛ فروش تیمی این هفته رتبه هفته بعد را تعیین می‌کند.`],
    [/^Current Tehran period: (.+) → (.+)\. Week rank is fixed for this period; this week’s team sales set the next period rank\.$/i, (_, start, end) => `دوره فعلی به وقت تهران: ${start} تا ${end}. رتبه این دوره ثابت است؛ فروش تیمی این هفته رتبه دوره بعد را تعیین می‌کند.`],
    [/^Current Tehran period: (.+)$/i, (_, d) => `دوره فعلی به وقت تهران: ${d}`],
    [/^#(\d+)$/, (_, n) => `#${persianDigits(n)}`],
    [/^(\d{4})-(\d{2})-(\d{2})$/, (_, year, month, day) => new Date(`${year}-${month}-${day}T12:00:00Z`).toLocaleDateString(adminLocale())],
    [/^Missing in \.env: (.+)\. sms\.ir is already connected to account phone verification, but no SMS is sent until these settings are filled in\. On localhost, the test code appears in the verification form\.$/i, (_, missing) => `موارد زیر در فایل .env تنظیم نشده‌اند: ${missing.split(', ').map(item => translateAdminText(item)).join('، ')}. اتصال sms.ir برای تأیید تلفن حساب آماده است، اما تا تکمیل تنظیمات پیامکی ارسال نمی‌شود. در localhost کد آزمایشی در فرم تأیید نمایش داده می‌شود.`],
    [/^Not connected yet: (.+) missing in \.env\. Messages are only saved below\.$/i, (_, missing) => `هنوز متصل نشده است: ${missing} در فایل .env تنظیم نشده‌اند. پیام‌ها فقط در فهرست زیر ذخیره می‌شوند.`],
    [/^Still showing demo text on the site: (.+)\. Fill them in below and press Save \(a box left empty will hide that item\)\.$/i, (_, names) => `این موارد هنوز با متن نمونه در سایت نمایش داده می‌شوند: ${names.split(', ').map(n => translateAdminText(n)).join('، ')}. آن‌ها را در ادامه تکمیل و ذخیره کنید؛ کادر خالی باعث پنهان‌شدن آن مورد می‌شود.`],
    [/^Read them, adjust them to how you really work, and have a lawyer check them for your country before relying on them\. A page shows a "last updated" date only after you edit its text\.$/i, () => `متن‌ها را بخوانید و مطابق شیوه واقعی کارتان ویرایش کنید. پیش از اتکا به آن‌ها، از وکیل آشنا با قوانین کشور خود بخواهید بررسی‌شان کند. تاریخ «آخرین به‌روزرسانی» صفحه فقط پس از ویرایش متن نمایش داده می‌شود.`],
    [/^After E-Namad \(enamad\.ir\) approves your website they give you a small HTML snippet\..+Leave both empty to hide it\.$/i, () => ADMIN_FA['After E-Namad (enamad.ir) approves your website they give you a small HTML snippet. Inside it you will see an address like trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... Copy the number after id= and the text after Code= into the two boxes. The badge then appears in the footer of every page. Leave both empty to hide it.']],
    [/^(\d+) result(s?)(?: - (.*))? Click the right game:$/i, (_, n, plural, note = '') => `${n} نتیجه${plural ? '' : ''}${note ? ' — ' + note : ''}؛ بازی درست را انتخاب کنید:`],
    [/^✓ Filled in from the store(?: \((.+)\))?\. Check the fields below, then press (.+)\.$/i, (_, store = '', action) => `✓ اطلاعات از فروشگاه دریافت شد${store ? ' (' + store + ')' : ''}. فیلدهای زیر را بررسی کنید و سپس «${action === 'Create game' ? 'ایجاد بازی' : 'ذخیره تغییرات'}» را بزنید.`],
    [/^(.+) - until (.+)$/i, (_, plan, date) => `${plan} تا ${date}`],
    [/^(.+) until (.+)$/i, (_, plan, date) => `${plan} تا ${date}`],
    [/^(.+) · (\d+) MB$/i, (_, fileType, size) => `${fileType} · ${size} مگابایت`],
    [/^(.+) \((-?\d+\.?)%, was (.+)\)$/i, (_, code, percent, oldPrice) => `${code} (٪${percent} تخفیف؛ قیمت قبلی ${oldPrice})`],
    [/^(-?\d+)% off (.+)$/i, (_, percent, applies) => `${percent}٪ تخفیف ${translateAdminText(applies)}`],
    [/^Gift: (.+) DRT$/i, (_, amount) => `هدیه: ${amount} DRT`],
    [/^(\d+) of (\d+) accounts$/i, (_, shown, total) => `${persianDigits(shown)} از ${persianDigits(total)} حساب`],
    [/^(\d+) login(s?)$/i, (_, count) => `${count} ورود`],
    [/^(\d+) file(s?)$/i, (_, count, plural) => `${count} ${plural ? 'فایل' : 'فایل'}`],
    [/^(\d+) result(s?)$/i, (_, count) => `${count} نتیجه`],
    [/^(\d+) accounts$/i, (_, count) => `${count} حساب`],
    [/^(\d+) features$/i, (_, count) => `${persianDigits(count)} ویژگی`],
    [/^(\d+) people asked$/i, (_, count) => `${count} نفر درخواست داده‌اند`],
    [/^([\d,]+)% off (.+)$/i, (_, percent, kinds) => `${percent}٪ تخفیف ${kinds.split(', ').map(k => translateAdminText(k)).join('، ')}`],
    [/^(\d+) levels$/, (_, count) => `${persianDigits(count)} لایه`],
    [/^(\d+) commission levels are open this week\.$/i, (_, count) => `این هفته ${persianDigits(count)} لایه پورسانت باز است.`],
    [/^Based on (\d+) team sales; opens (\d+) levels next week\.$/i, (_, sales, depth) => `بر اساس ${persianDigits(sales)} فروش تیمی؛ هفته آینده ${persianDigits(depth)} لایه باز می‌شود.`],
    [/^(\d+) team sales → (.+) next week$/i, (_, sales, rank) => `${persianDigits(sales)} فروش تیمی → ${translateAdminText(rank)} هفته آینده`],
    [/^Version (.+) scheduled for (.+)$/i, (_, version, date) => `نسخه ${version} برای ${date} زمان‌بندی شد`],
    [/^Simulated (\d+) marketer payouts$/i, (_, count) => `${count} پرداخت آزمایشی به بازاریابان`],
    [/^Are you sure you want to grant admin access to (.+)\?$/i, (_, name) => `مطمئن هستید می‌خواهید دسترسی مدیریت را برای ${name} فعال کنید؟`],
    [/^Are you sure you want to remove admin access from (.+)\?$/i, (_, name) => `مطمئن هستید می‌خواهید دسترسی مدیریت ${name} را لغو کنید؟`],
    [/^Are you sure you want to approve marketer access for (.+)\?$/i, (_, name) => `مطمئن هستید می‌خواهید دسترسی بازاریابی ${name} را تأیید کنید؟`],
    [/^Are you sure you want to revoke marketer access for (.+)\?$/i, (_, name) => `مطمئن هستید می‌خواهید دسترسی بازاریابی ${name} را لغو کنید؟`],
    [/^Add or remove DRT for (.+) \((?:use a )?negative number removes?\):$/i, (_, name) => `مقدار DRT برای ${name} را وارد کنید (عدد منفی باعث کسر می‌شود):`],
    [/^Add or remove DRT for (.+) \(use a negative number to remove\):$/i, (_, name) => `مقدار DRT برای ${name} را وارد کنید (برای کسر، عدد منفی وارد کنید):`],
    [/^([+-]?[\d,]+) DRT$/i, (_, count) => `${count} DRT`],
    [/^(.+) DRT$/i, (_, amount) => `${amount} DRT`],
    [/^(.+): (\d+)%$/i, (_, name, percent) => `${name}: ${percent}٪`],
    [/^Asked (.+) by: (.+)$/i, (_, date, people) => `درخواست‌شده در ${date} توسط: ${people}`],
    [/^Still showing demo text on the site: (.+)\.$/i, (_, names) => `این موارد هنوز با متن نمونه در سایت نمایش داده می‌شوند: ${names.split(', ').map(n => translateAdminText(n)).join('، ')}.`],
    [/^Delete "(.+)" from the site\?\s*Its description, screenshots and cover are removed\. Files already uploaded under media\/ stay on disk\.$/is, (_, name) => `«${name}» از سایت حذف شود؟\n\nتوضیحات، تصاویر و کاور آن حذف می‌شوند. فایل‌هایی که قبلاً در پوشه media/ بارگذاری شده‌اند روی دیسک باقی می‌مانند.`],
    [/^Delete the file "(.+)" from the server\?$/i, (_, name) => `فایل «${name}» از سرور حذف شود؟`],
    [/^Delete customer "(.+)"\?$/i, (_, name) => `مشتری «${name}» حذف شود؟`],
    [/^Delete the code (.+)\?$/i, (_, code) => `کد ${code} حذف شود؟`],
    [/^Delete the account of (.+)\? Their tokens and unlocked files are lost\.$/i, (_, name) => `حساب ${name} حذف شود؟ توکن‌ها و فایل‌های بازشده او از بین می‌روند.`],
    [/^Delete the account of (.+)\? Their tokens are lost\.$/i, (_, name) => `حساب ${name} حذف شود؟ توکن‌های او از بین می‌روند.`],
    [/^Saved: (.+)$/i, (_, value) => `ذخیره شد: ${value}`],
    [/^Copied: (.+)$/i, (_, value) => `کپی شد: ${value}`],
    [/^Created: (.+)$/i, (_, value) => `ایجاد شد: ${value}`],
    [/^Gift: (.+)$/i, (_, value) => `هدیه: ${value}`],
    [/^ID: (.+)$/i, (_, value) => `شناسه: ${value}`],
    [/^To (.+?)\s+·\s+(.+)$/i, (_, who, date) => `گیرنده: ${who} · ${date}`],
    [/^Request failed \((.+)\)$/i, (_, code) => `درخواست ناموفق بود (${code})`],
    [/^([\d,]+) min ago$/i, (_, n) => `${n} دقیقه پیش`],
    [/^([\d,]+) h ago$/i, (_, n) => `${n} ساعت پیش`],
    [/^([\d,]+) days ago$/i, (_, n) => `${n} روز پیش`],
    [/^([\d,]+) months ago$/i, (_, n) => `${n} ماه پیش`],
    [/^([\d,]+) years ago$/i, (_, n) => `${n} سال پیش`],
    [/^([\d,]+) accounts$/i, (_, n) => `${n} حساب`],
    [/^([\d,]+) people asked$/i, (_, n) => `${n} نفر درخواست داده‌اند`],
    [/^([\d,]+) shots$/i, (_, n) => `${n} تصویر`],
    [/^(.+) until (.+)$/i, (_, plan, date) => `${plan} تا ${date}`],
    [/^(.+) · (.+)$/i, (whole, left, right) => `${translateAdminText(left)} · ${translateAdminText(right)}`],
  ];
  for (const [pattern, replace] of patterns) if (pattern.test(trimmed)) return trimmed.replace(pattern, replace);
  const prefix = Object.keys(ADMIN_FA).filter(key => key.endsWith(' ') && trimmed.startsWith(key)).sort((a, b) => b.length - a.length)[0];
  if (prefix) return ADMIN_FA[prefix] + trimmed.slice(prefix.length);
  if (/^[0-9][0-9,]*(?:\.[0-9]+)?$/.test(trimmed)) return persianDigits(trimmed);
  return text;
}
const nativeAdminConfirm = window.confirm.bind(window);
const nativeAdminPrompt = window.prompt.bind(window);
const nativeAdminAlert = window.alert.bind(window);
window.confirm = message => nativeAdminConfirm(translateAdminText(message));
window.prompt = (message, value) => nativeAdminPrompt(translateAdminText(message), value);
window.alert = message => nativeAdminAlert(translateAdminText(message));
const adminLocale = () => adminLanguage === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US';
const fmtNumber = value => Number(value || 0).toLocaleString(adminLocale());
const formatAdminDate = (value, options) => value ? new Date(value).toLocaleDateString(adminLocale(), options) : '-';
function translateAdminNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (!adminOriginalText.has(node)) adminOriginalText.set(node, node.nodeValue);
    const original = adminOriginalText.get(node);
    const trimmed = original.trim();
    const translation = translateAdminText(trimmed);
    node.nodeValue = translation
      ? original.slice(0, original.indexOf(trimmed)) + translation + original.slice(original.indexOf(trimmed) + trimmed.length)
      : original;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.hasAttribute('data-admin-no-translate')) return;
  let originals = adminOriginalAttributes.get(node);
  for (const name of ['placeholder', 'title', 'aria-label']) {
    if (!node.hasAttribute(name)) continue;
    if (!originals) { originals = new Map(); adminOriginalAttributes.set(node, originals); }
    if (!originals.has(name)) originals.set(name, node.getAttribute(name));
    const original = originals.get(name);
    node.setAttribute(name, adminLanguage === 'fa' ? translateAdminText(original) : original);
  }
  for (const child of node.childNodes) translateAdminNode(child);
}
function updateAdminLanguageButtons() {
  const targetLabel = adminLanguage === 'fa' ? 'English' : 'فارسی';
  for (const id of ['admin-login-language-toggle', 'admin-app-language-toggle']) {
    const button = document.getElementById(id);
    if (button) { button.textContent = targetLabel; button.setAttribute('aria-label', adminLanguage === 'fa' ? 'Switch admin language to English' : 'تغییر زبان مدیریت به فارسی'); }
  }
}
function applyAdminLanguage() {
  document.documentElement.lang = adminLanguage;
  document.documentElement.dir = adminLanguage === 'fa' ? 'rtl' : 'ltr';
  document.title = adminLanguage === 'fa' ? 'مدیریت — Dr Game' : 'Admin — Dr Game';
  translateAdminNode(document.body);
  updateAdminLanguageButtons();
}
function toggleAdminLanguage() {
  adminLanguage = adminLanguage === 'fa' ? 'en' : 'fa';
  try { localStorage.setItem('drt_admin_lang', adminLanguage); } catch (_) { /* keep this session's choice */ }
  applyAdminLanguage();
  if (adminIdentity) show();
}
for (const id of ['admin-login-language-toggle', 'admin-app-language-toggle']) {
  document.getElementById(id)?.addEventListener('click', toggleAdminLanguage);
}
applyAdminLanguage();
new MutationObserver(records => {
  for (const record of records) for (const node of record.addedNodes) translateAdminNode(node);
}).observe(document.body, { childList: true, subtree: true });

let toastTimer;
function toast(msg, kind) {
  const t = $('toast');
  t.textContent = translateAdminText(msg);
  t.className = 'toast ' + (kind || 'ok');
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3200);
}
async function api(method, url, body, raw) {
  const opts = { method, credentials: 'same-origin', headers: { 'X-Admin': '1' } };
  if (raw) { opts.body = raw; }
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (res.status === 401 && url !== '/api/admin/login') { showLogin(); throw new Error('Session expired, please log in again'); }
  if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
  return data;
}
const run = async fn => { try { await fn(); } catch (e) { toast(e.message, 'err'); } };
const field = (label, input) => h('label', { class: 'f' }, label, input);
const fmtDate = iso => (iso ? new Date(iso).toLocaleString(adminLocale()) : '');

// ---------- login ----------
let adminIdentity = null;
function showLogin() { $('app-view').classList.add('hidden'); $('login-view').classList.remove('hidden'); $('pw').focus(); }
async function tryLogin() {
  $('login-err').textContent = '';
  try {
    await api('POST', '/api/admin/login', { password: $('pw').value });
    $('pw').value = '';
    await start();
  } catch (e) { $('login-err').textContent = e.message; }
}
$('login-btn').onclick = tryLogin;
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
$('admin-account-login-btn').onclick = async () => {
  const error = $('admin-account-login-err');
  error.textContent = '';
  try {
    const res = await fetch('/api/account/login', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: $('admin-account-identifier').value, password: $('admin-account-password').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not sign in.');
    if (!data.user || !data.user.isAdmin) throw new Error('This account has not been approved for admin access. Ask the root admin to enable it in Customers.');
    $('admin-account-password').value = '';
    await start();
  } catch (e) { error.textContent = e.message; }
};
$('admin-account-password').addEventListener('keydown', e => { if (e.key === 'Enter') $('admin-account-login-btn').click(); });
$('logout-btn').onclick = () => run(async () => { await api('POST', '/api/admin/logout'); showLogin(); });

// ---------- tabs ----------
const TABS = [
  ['dashboard', 'Dashboard', renderDashboard],
  ['storefront', 'Storefront health', renderStorefrontHealth],
  ['games', 'Games', renderGames],
  ['plans', 'Subscriptions', renderPlans],
  ['earnings', 'Weekly earnings', renderEarnings],
  ['customers', 'Customers', renderCustomers],
  ['content', 'Learn & Content', renderContent],
  ['footer', 'Footer & Contact', renderFooterTab],
  ['legal', 'Legal & Trust', renderLegal],
  ['promo', 'Discounts', renderPromo],
  ['requests', 'Requests', renderRequests],
  ['telegram', 'Telegram', renderTelegram],
  ['reports', 'Reports', renderReports],
  ['messages', 'Messages', renderMessages],
];
const TAB_GROUPS = [
  ['Overview', ['dashboard', 'storefront']],
  ['Catalog', ['games', 'plans', 'content', 'promo']],
  ['People and payouts', ['customers', 'earnings', 'requests']],
  ['Communication', ['footer', 'telegram', 'reports', 'messages']],
  ['Policies', ['legal']],
];
const TAB_MARKS = {
  dashboard: '◈', storefront: '▣', games: '▦', plans: '◆', earnings: '↗', customers: '◎',
  content: '✧', footer: '⌁', legal: '◇', promo: '%', requests: '◌', telegram: '✦', reports: '▤', messages: '✉',
};
let currentTab = 'dashboard';
let stats = {};
async function refreshStats() { stats = await api('GET', '/api/admin/stats'); }
function setMobileNav(open) {
  const sidebar = document.querySelector('.a-sidebar');
  const toggle = $('admin-nav-toggle');
  if (!sidebar || !toggle) return;
  sidebar.classList.toggle('nav-open', Boolean(open));
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (!open && document.activeElement instanceof HTMLElement) document.activeElement.blur();
}
document.getElementById('admin-nav-toggle')?.addEventListener('click', () => {
  const sidebar = document.querySelector('.a-sidebar');
  setMobileNav(!sidebar?.classList.contains('nav-open'));
});
function tabBadge(id) {
  const count = id === 'messages' ? stats.unreadMessages : id === 'reports' ? stats.openReports : id === 'requests' ? stats.openRequests : 0;
  return count ? h('span', { class: 'dot', 'aria-label': `${count} pending` }, count) : null;
}
function tabButton([id, label]) {
  return h('button', {
    class: 'a-tab' + (id === currentTab ? ' active' : ''),
    type: 'button',
    'data-tab': id,
    onclick: () => {
      currentTab = id;
      setMobileNav(false);
      // Move to the top before any async work starts, so a slow stats request
      // cannot leave the new panel rendered below an old scroll position.
      resetAdminViewport();
      show();
    },
  }, h('span', { class: 'a-tab-main' }, h('span', { class: 'a-tab-mark', 'aria-hidden': 'true' }, TAB_MARKS[id] || '•'), h('span', { class: 'a-tab-label' }, label)), tabBadge(id));
}
function drawTabs() {
  const tabById = new Map(TABS.map(tab => [tab[0], tab]));
  $('tabs').replaceChildren(...TAB_GROUPS.map(([title, ids]) => h('section', { class: 'a-tab-group' },
    h('div', { class: 'a-tab-group-title' }, title),
    h('div', { class: 'a-tab-group-items' }, ...ids.map(id => tabButton(tabById.get(id))))
  )));
}
function resetAdminViewport() {
  const scrolling = document.scrollingElement || document.documentElement;
  const shell = document.querySelector('.a-shell');
  const reset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    scrolling.scrollTop = 0;
    scrolling.scrollLeft = 0;
    document.body.scrollTop = 0;
    if (shell) {
      shell.scrollTop = 0;
      shell.scrollLeft = 0;
      shell.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };
  reset();
  // Rendering a tab can trigger browser scroll anchoring or focus restoration
  // after this function returns. Re-apply the top position on the next frames.
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
  setTimeout(reset, 80);
  setTimeout(reset, 320);
}
// ---------- delayed panel help ----------
// Help is delegated from #main so it continues to work for panels that are
// rendered after a tab change. The five-second delay keeps normal navigation
// calm while giving the administrator a clear explanation when they pause.
const ADMIN_HELP_SELECTOR = [
  '#main .card', '#main .stat', '#main .admin-plan-card', '#main .earnings-metric',
  '#main .earnings-executive-card', '#main .earnings-profile-card', '#main .earnings-income-card',
  '#main .earnings-branch-card', '#main .earnings-org-card', '#main .earnings-accordion',
  '#main .earnings-inline-details', '#main .earnings-person-row', '#main .lk-card',
  '#main .card-box', '#main .msg'
].join(',');
let adminHelpTarget = null;
let adminHelpTimer = null;
let adminHelpPopover = null;

function adminHelpCandidate(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return null;
  const candidate = node.closest(ADMIN_HELP_SELECTOR);
  return candidate && $('main')?.contains(candidate) ? candidate : null;
}

function adminHelpTitle(target) {
  const heading = target.querySelector('h2, h3, h4, .admin-plan-summary-name, .earnings-metric-label, .stat span, strong');
  const raw = heading ? heading.textContent : '';
  const title = String(raw || '').replace(/\s+/g, ' ').trim();
  if (title) return title.length > 90 ? title.slice(0, 87) + '…' : title;
  const pageTitle = $('admin-page-title')?.textContent || 'this admin section';
  return String(pageTitle).replace(/\s+/g, ' ').trim();
}

function adminHelpCopy(target, title) {
  const fa = adminLanguage === 'fa';
  const translatedTitle = translateAdminText(title);
  if (target.matches('.stat')) return fa
    ? `این شاخص مقدار «${translatedTitle}» را از داده‌های فعلی فروشگاه خلاصه می‌کند؛ برای دیدن تغییرات کلی از آن استفاده کنید.`
    : `This metric summarizes “${title}” from current store data so you can spot changes quickly.`;
  if (target.matches('.earnings-metric')) return fa
    ? `این کادر یک عدد مربوط به پورسانت و تسویه «${translatedTitle}» را نشان می‌دهد. توضیح کوچک زیر عدد، بازه یا شرط آن را مشخص می‌کند.`
    : `This box shows the “${title}” commission or settlement value. The small note below explains its period or eligibility rule.`;
  if (target.matches('.admin-plan-card')) return fa
    ? `تنظیمات طرح اشتراک «${translatedTitle}» در این کادر قرار دارد. روی عنوان طرح بزنید تا ویرایشگر آن باز شود.`
    : `This box contains the “${title}” subscription settings. Select the plan header to open its editor.`;
  if (target.matches('.earnings-person-row')) return fa
    ? 'این ردیف یک بازاریاب را نشان می‌دهد. آن را انتخاب کنید تا وضعیت تأیید، فروش، درآمد و لایه‌های پایین‌ترش را ببینید.'
    : 'This row represents a marketer. Select it to inspect approval, sales, income and the lower team levels.';
  if (target.matches('.earnings-accordion, .earnings-inline-details')) return fa
    ? `این بخش قابل باز و بسته‌شدن است و جزئیات «${translatedTitle}» را نگه می‌دارد. برای کم‌کردن شلوغی، فقط هنگام نیاز آن را باز کنید.`
    : `This expandable section contains details about “${title}”. Open it when you need the full records.`;
  if (target.matches('.earnings-executive-card')) return fa
    ? 'این کادر نمای کلی شرکت و مجموع فروش، حساب‌های تأییدشده و مبالغ تخصیص‌یافته هفته را نشان می‌دهد.'
    : 'This box is the company-level weekly overview for sales, approved accounts and allocated commission.';
  if (target.matches('.earnings-profile-card, .earnings-income-card, .earnings-branch-card, .earnings-org-card')) return fa
    ? `این کادر اطلاعات «${translatedTitle}» را برای بررسی یک بازاریاب، درآمد او یا ساختار تیم نمایش می‌دهد.`
    : `This box displays “${title}” for reviewing a marketer, their income or the team structure.`;
  if (target.matches('.lk-card')) return fa
    ? 'این نتیجه مربوط به افزودن سریع بازی است. برای بررسی اطلاعات منبع و واردکردن بازی، نتیجه مناسب را انتخاب کنید.'
    : 'This is a Quick Add match. Select the correct result to review its source data before importing the game.';
  if (target.matches('.msg')) return fa
    ? `این کادر یک پیام یا درخواست ثبت‌شده با عنوان «${translatedTitle}» را نشان می‌دهد و برای رسیدگی و تغییر وضعیت آن استفاده می‌شود.`
    : `This box contains a submitted message or request titled “${title}” and its review controls.`;
  if (target.matches('.card-box')) return fa
    ? `کنترل‌ها و داده‌های مربوط به «${translatedTitle}» در این کادر قرار دارند. تغییرات را از همین بخش ذخیره یا بررسی کنید.`
    : `The controls and data for “${title}” live in this box. Review or save changes from here.`;
  return fa
    ? `این پنل برای نمایش یا مدیریت «${translatedTitle}» در بخش مدیریت استفاده می‌شود. توضیحات و کنترل‌های داخل آن را بررسی کنید.`
    : `This panel displays or manages “${title}” in the admin area. Use the controls and details inside it.`;
}

function ensureAdminHelpPopover() {
  if (adminHelpPopover && document.body.contains(adminHelpPopover)) return adminHelpPopover;
  adminHelpPopover = h('div', { id: 'admin-help-popover', class: 'admin-help-popover', role: 'tooltip', 'aria-hidden': 'true' },
    h('span', { class: 'admin-help-popover-title' }), h('span', { class: 'admin-help-popover-copy' }));
  document.body.append(adminHelpPopover);
  return adminHelpPopover;
}

function positionAdminHelpPopover() {
  if (!adminHelpTarget || !adminHelpPopover || !adminHelpPopover.classList.contains('is-visible')) return;
  const rect = adminHelpTarget.getBoundingClientRect();
  const margin = 12;
  const gap = 10;
  const popRect = adminHelpPopover.getBoundingClientRect();
  const width = popRect.width || Math.min(340, window.innerWidth - margin * 2);
  const height = popRect.height || 80;
  const rtl = document.documentElement.dir === 'rtl';
  let left = rtl ? rect.right - width : rect.left;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = rect.bottom + gap;
  const above = top + height > window.innerHeight - margin && rect.top - height - gap >= margin;
  if (above) top = rect.top - height - gap;
  adminHelpPopover.classList.toggle('is-above', above);
  adminHelpPopover.style.left = `${Math.round(left)}px`;
  adminHelpPopover.style.top = `${Math.round(top)}px`;
}

function stopAdminHelp() {
  clearTimeout(adminHelpTimer);
  adminHelpTimer = null;
  adminHelpTarget = null;
  if (adminHelpPopover) {
    adminHelpPopover.classList.remove('is-visible', 'is-above');
    adminHelpPopover.setAttribute('aria-hidden', 'true');
  }
}

function startAdminHelp(target) {
  if (!target || target === adminHelpTarget) return;
  stopAdminHelp();
  adminHelpTarget = target;
  adminHelpTimer = setTimeout(() => {
    if (!adminHelpTarget || !document.body.contains(adminHelpTarget)) return stopAdminHelp();
    const title = adminHelpTitle(adminHelpTarget);
    const popover = ensureAdminHelpPopover();
    popover.querySelector('.admin-help-popover-title').textContent = translateAdminText(title);
    popover.querySelector('.admin-help-popover-copy').textContent = adminHelpCopy(adminHelpTarget, title);
    popover.classList.add('is-visible');
    popover.setAttribute('aria-hidden', 'false');
    positionAdminHelpPopover();
  }, 5000);
}

function setupAdminHelpTooltips() {
  const main = $('main');
  if (!main || main.dataset.adminHelpBound === 'true') return;
  main.dataset.adminHelpBound = 'true';
  main.addEventListener('pointerover', event => {
    const target = adminHelpCandidate(event.target);
    const from = adminHelpCandidate(event.relatedTarget);
    if (target && target !== from) startAdminHelp(target);
  });
  main.addEventListener('pointerout', event => {
    const from = adminHelpCandidate(event.target);
    const to = adminHelpCandidate(event.relatedTarget);
    if (from && from === adminHelpTarget && to !== from) stopAdminHelp();
  });
  main.addEventListener('focusin', event => {
    const target = adminHelpCandidate(event.target);
    if (target) startAdminHelp(target);
  });
  main.addEventListener('focusout', event => {
    const from = adminHelpCandidate(event.target);
    const to = adminHelpCandidate(event.relatedTarget);
    if (from && from === adminHelpTarget && to !== from) stopAdminHelp();
  });
  window.addEventListener('scroll', positionAdminHelpPopover, true);
  window.addEventListener('resize', positionAdminHelpPopover);
}

async function show() {
  const loading = h('p', { class: 'muted' }, 'Loading…');
  stopAdminHelp();
  setupAdminHelpTooltips();
  $('main').replaceChildren(loading);
  resetAdminViewport();
  await run(async () => {
    await refreshStats();
    drawTabs();
    const tab = TABS.find(t => t[0] === currentTab);
    if ($('admin-page-title')) {
      $('admin-page-title').textContent = tab[1];
      translateAdminNode($('admin-page-title'));
    }
    $('main').replaceChildren(await tab[2]());
    resetAdminViewport();
  });
}
async function start() {
  const me = await fetch('/api/admin/me', { credentials: 'same-origin' }).then(r => r.json());
  if (!me.admin) return showLogin();
  adminIdentity = me;
  $('login-view').classList.add('hidden');
  $('app-view').classList.remove('hidden');
  await show();
}

// ---------- SMS (sms.ir) status ----------
async function smsCard() {
  let box;
  try { box = await api('GET', '/api/admin/outbox'); } catch (e) { return null; }
  const s = box.sms;
  const note = (txt) => h('p', { class: 'muted' }, txt);
  const checkBtn = h('button', { class: 'btn small', onclick: () => run(async () => {
    const r = await api('GET', '/api/admin/sms/check');
    toast(r.ok ? 'sms.ir key works. Credit: ' + JSON.stringify(r.credit) : 'sms.ir said: ' + r.error, r.ok ? 'ok' : 'err');
  }) }, 'Test sms.ir key (no SMS sent)');
  if (s.configured && s.notificationConfigured) return h('div', { class: 'card', style: 'margin-top:18px' }, h('span', { class: 'tag ok' }, 'SMS (sms.ir) is connected'), h('span', { class: 'muted', style: 'margin-inline-start:10px' }, 'Phone verification and customer notifications are sent by SMS.'), h('div', { class: 'row', style: 'margin:12px 0 0' }, checkBtn));
  const missing = [s.provider !== 'smsir' ? 'SMS_PROVIDER=smsir' : null, !s.hasKey ? 'SMS_API_KEY' : null, !s.hasTemplate ? 'SMS_TEMPLATE_ID (the id of a verification template from your sms.ir panel)' : null, !s.hasLine ? 'SMS_LINE_NUMBER (a sender line from your sms.ir panel)' : null, s.hasLine && !s.notificationsEnabled ? 'SMS_NOTIFICATIONS_ENABLED=true' : null].filter(Boolean);
  return h('div', { class: 'card', style: 'margin-top:18px;border-color:#facc15' },
    h('h3', { style: 'color:#facc15' }, 'SMS is not fully set up yet'),
    note('Missing in .env: ' + missing.join(', ') + '. Phone verification and customer notification SMS remain in the outbox until the required settings are filled in. On localhost, the test code appears in the verification form.'),
    s.messages.length ? h('div', {}, s.messages.slice(0, 3).map(m => h('div', { class: 'msg' }, h('div', { class: 'muted' }, 'To ' + m.to + ' \u00b7 ' + fmtDate(m.date)), h('p', {}, m.text)))) : null,
    h('div', { class: 'row', style: 'margin:12px 0 0' }, checkBtn));
}

// ---------- email outbox (only matters while SMTP is not configured) ----------
async function outboxCard() {
  let box;
  try { box = await api('GET', '/api/admin/outbox'); } catch (e) { return null; }
  if (box.emailConfigured || box.smtpConfigured) {
    const gmail = box.provider === 'gmail-api';
    const statusLabel = gmail ? 'Gmail API email is connected' : 'SMTP email is configured';
    const testLabel = gmail ? 'Test Gmail API connection (no email sent)' : 'Test SMTP connection (no email sent)';
    return h('div', { class: 'card', style: 'margin-top:18px' }, h('span', { class: 'tag ok' }, statusLabel), h('span', { class: 'muted', style: 'margin-inline-start:10px' }, 'Verification codes are emailed to customers.'), h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn small', onclick: () => run(async () => { const r = await api('GET', '/api/admin/email/check'); const success = gmail ? 'Gmail API connection works. No email was sent.' : 'SMTP connection works. No email was sent.'; const failure = gmail ? 'Gmail API check failed: ' : 'SMTP check failed: '; toast(r.ok ? success : failure + r.error, r.ok ? 'ok' : 'err'); }) }, testLabel)));
  }
  return h('div', { class: 'card', style: 'margin-top:18px;border-color:#facc15' },
    h('h3', { style: 'color:#facc15' }, 'Email is not set up yet'),
    h('p', { class: 'muted' }, 'No email is actually sent, so customers never receive their verification code. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN and GMAIL_FROM for Gmail API, or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM for SMTP, then restart. On localhost, the verification form now displays the test code; messages are also listed here:'),
    box.messages.length
      ? h('div', {}, box.messages.slice(0, 5).map(m => h('div', { class: 'msg' }, h('strong', {}, m.subject), h('div', { class: 'muted' }, 'To ' + m.to + ' \u00b7 ' + fmtDate(m.date)), h('p', {}, m.text))))
      : h('p', { class: 'muted' }, 'No messages yet.'));
}


async function renderStorefrontHealth() {
  const d = await api('GET', '/api/admin/storefront-health');
  const root = h('div', {}, h('h2', {}, 'Storefront health'), h('p', {class:'muted'}, 'Game access uses the customer’s active subscription download quota. Correct catalog issues in Games; update customer requests in Requests.'));
  root.append(h('div', {class:'stats'}, ...[['Games',d.games],['Game unlocks',d.paidPurchases],['Download quota used (GB)',Number(d.quotaUsedGB || 0).toFixed(2)],['Open requests',d.pendingRequests],['Wishlist saves',d.wishlistSaves]].map(([label,n]) => h('div',{class:'card'},h('h3',{},label),h('strong',{},String(n))))));
  root.append(h('div',{class:'card'},h('h3',{},'Best sellers'), ...d.bestSellers.map(g => h('p',{},g.title + ' · ' + g.count + ' game unlocks')), d.bestSellers.length ? null : h('p',{},'No paid purchases yet. The empty homepage section stays hidden.')));
  const rows=d.issues.map(g=>h('tr',{},h('td',{},h('a',{href:'/game.html?slug='+encodeURIComponent(g.slug),target:'_blank',rel:'noopener'},g.title)),h('td',{},g.missing.join(', '))));
  const table=h('table',{},h('thead',{},h('tr',{},h('th',{},'Game'),h('th',{},'Missing content'))),h('tbody',{},...rows));
  const exportBtn=h('button',{class:'btn',onclick:()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(d.issues,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='catalog-issues.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }},'Export catalog issues');
  root.append(h('div',{class:'card'},h('h3',{},'Catalog checklist ('+d.issues.length+' games)'),exportBtn,h('div',{class:'tablewrap'},table)));
  return root;
}
// ---------- dashboard ----------
async function renderDashboard() {
  const s = stats;
  const box = (n, label) => h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, label));
  return h('div', {},
    h('div', { class: 'stats' },
      box(s.games, 'Games in catalog'),
      box(s.missingDescription, 'Games without description'),
      box(s.missingScreenshots, 'Games without screenshots'),
      box(s.customers, 'Customers'),
      box(s.activeCustomers, 'Active subscribers'),
      box(s.unreadMessages, 'Unread messages'),
      box(s.openReports || 0, 'Open problem reports'),
      box(s.openRequests || 0, 'New game / subtitle requests'),
      box(s.accounts || 0, 'Customer accounts'),
      box(s.pendingOrders || 0, 'Orders waiting for approval')),
    await outboxCard(),
    await smsCard(),
    h('div', { class: 'card', style: 'margin-top:18px' },
      h('h3', {}, 'Quick actions'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: () => { currentTab = 'games'; show().then(() => openGameEditor(null)); } }, '+ Add a game'),
        h('button', { class: 'btn', onclick: () => { currentTab = 'plans'; show(); } }, 'Edit subscription plans'),
        h('button', { class: 'btn', onclick: () => { currentTab = 'customers'; show(); } }, 'Customers'),
        h('button', { class: 'btn', onclick: () => { currentTab = 'content'; show(); } }, 'Edit Learn content')),
      h('p', { class: 'muted' }, 'Every change to games is backed up in data/backups before it is saved (last 30 versions kept).')));
}

// ---------- games ----------
let gameList = [], categories = [], categoryLabels = [];
async function renderGames() {
  [gameList, categories, categoryLabels] = await Promise.all([
    api('GET', '/api/admin/games'),
    api('GET', '/api/admin/categories'),
    api('GET', '/api/admin/category-labels'),
  ]);
  const categoryLabelFor = key => {
    const row = categoryLabels.find(item => item.key === key);
    if (!row) return key;
    return adminLanguage === 'fa' ? (row.fa || row.en || key) : (row.en || key);
  };
  const search = h('input', { placeholder: 'Search games…' });
  const cat = h('select', {}, h('option', { value: '' }, 'All categories'), categories.map(c => h('option', { value: c }, categoryLabelFor(c))));
  const flt = h('select', {},
    h('option', { value: '' }, 'All games'),
    h('option', { value: 'nodesc' }, 'Missing description'),
    h('option', { value: 'noshots' }, 'Missing screenshots'),
    h('option', { value: 'famous' }, 'Most Famous'),
    h('option', { value: 'hidden' }, 'Hidden from site'));
  const count = h('span', { class: 'muted' });
  const tbody = h('tbody');

  function draw() {
    const q = search.value.trim().toLowerCase();
    let rows = gameList.filter(g =>
      (!q || g.title.toLowerCase().includes(q)) &&
      (!cat.value || g.category === cat.value) &&
      (flt.value !== 'nodesc' || !g.hasDescription) &&
      (flt.value !== 'noshots' || !g.screenshotCount) &&
      (flt.value !== 'famous' || g.famous) &&
      (flt.value !== 'hidden' || !g.visible));
    count.textContent = rows.length + ' of ' + gameList.length;
    rows = rows.slice(0, 300);
    tbody.replaceChildren(...rows.map(g => h('tr', {},
      h('td', {}, g.coverUrl ? h('img', { class: 'thumb', src: g.coverUrl, loading: 'lazy' }) : h('div', { class: 'thumb' })),
      h('td', {}, h('strong', {}, g.title), g.visible ? null : h('span', { class: 'tag bad', style: 'margin-inline-start:8px' }, 'hidden')),
      h('td', {}, categoryLabelFor(g.category)),
      h('td', {}, g.famousRank ? h('span', { class: 'tag' }, '#' + g.famousRank) : (g.famous ? h('span', { class: 'tag' }, 'famous') : '')),
      h('td', {}, g.released || ''),
      h('td', {}, h('span', { class: 'tag ' + (g.screenshotCount ? 'ok' : 'warn') }, g.screenshotCount + ' shots'), ' ',
        h('span', { class: 'tag ' + (g.hasDescription ? 'ok' : 'warn') }, g.hasDescription ? 'desc' : 'no desc')),
      h('td', { style: 'white-space:nowrap' },
        h('button', { class: 'btn small', onclick: () => openGameEditor(g.slug) }, 'Edit'), ' ',
        h('a', { class: 'btn small', href: '/game.html?slug=' + encodeURIComponent(g.slug), target: '_blank' }, 'View'), ' ',
        h('button', { class: 'btn small danger', onclick: () => deleteGame(g) }, 'Delete')))));
  }
  [search, cat, flt].forEach(el => el.addEventListener('input', draw));
  draw();
  const labelRows = categoryLabels.map(row => {
    const en = h('input', { value: row.en || row.key, maxlength: 80, placeholder: row.key });
    const fa = h('input', { value: row.fa || row.key, maxlength: 80, dir: 'rtl', placeholder: row.key });
    return { row, en, fa };
  });
  const saveLabels = h('button', { class: 'btn primary', type: 'button' }, 'Save category names');
  saveLabels.onclick = () => run(async () => {
    saveLabels.disabled = true;
    try {
      await api('PUT', '/api/admin/category-labels', { labels: labelRows.map(({ row, en, fa }) => ({ key: row.key, en: en.value, fa: fa.value })) });
      toast('Category names saved');
    } finally { saveLabels.disabled = false; }
  });
  const labelsCard = h('div', { class: 'card category-label-editor' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-start' },
      h('div', {}, h('h3', { style: 'margin-bottom:6px' }, 'Category names'), h('p', { class: 'muted', style: 'margin:0' }, 'Change the public name without changing the internal category key. Existing games, filters and links keep working.')),
      saveLabels),
    h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', {}, 'Internal key'), h('th', {}, 'English label'), h('th', {}, 'Persian label'), h('th', {}, 'Used on'), h('th', {}, 'Games'))),
      h('tbody', {}, labelRows.map(({ row, en, fa }) => h('tr', {},
        h('td', {}, h('code', { 'data-admin-no-translate': '' }, row.key)),
        h('td', {}, en),
        h('td', {}, fa),
        h('td', {}, row.kind === 'catalog' ? 'Game catalog' : (row.kind === 'special' ? 'Special filter' : 'Homepage')),
        h('td', {}, row.count)))))));
  return h('div', {},
    labelsCard,
    h('div', { class: 'row grow' }, search, cat, flt,
      h('button', { class: 'btn primary', style: 'flex:0 0 auto', onclick: () => openGameEditor(null) }, '+ Add game')),
    count,
    h('div', { class: 'card tablewrap', style: 'margin-top:10px' },
      h('table', {}, h('thead', {}, h('tr', {}, ['', 'Title', 'Category', 'Rank', 'Released', 'Content', ''].map(x => h('th', {}, x)))), tbody)));
}
function deleteGame(g) {
  if (!confirm('Delete "' + g.title + '" from the site?\n\nIts description, screenshots and cover are removed. Files already uploaded under media/ stay on disk.')) return;
  run(async () => { await api('DELETE', '/api/admin/games/' + encodeURIComponent(g.slug)); toast('Deleted'); show(); });
}

async function openGameEditor(slug, initialSearch = '') {
  await run(async () => {
    const isNew = !slug;
    const g = isNew
      ? { title: '', category: '', platforms: ['ps4', 'ps5'], released: '', famous: false, famousRank: '', visible: true, description: '', description_fa: '', screenshots: [], coverUrl: null, awards: [], companyAwards: [], contentDescriptors: [], metacritic: '', dualSense: null, vr: null, online: null }
      : await api('GET', '/api/admin/games/' + encodeURIComponent(slug));
    if (!categories.length) categories = await api('GET', '/api/admin/categories');

    const title = h('input', { value: g.title, maxlength: 120 });
    let pendingCoverUrl = '';   // cover chosen by the lookup (downloaded by the server on save)
    const company = h('input', { value: g.company || '', maxlength: 80, placeholder: 'e.g. Naughty Dog' });
    const catIn = h('input', { value: g.category, list: 'cat-list', maxlength: 60, placeholder: 'Choose or type a new category' });
    const dl = h('datalist', { id: 'cat-list' }, categories.map(c => h('option', { value: c })));
    const p4 = h('input', { type: 'checkbox' }); p4.checked = g.platforms.includes('ps4');
    const p5 = h('input', { type: 'checkbox' }); p5.checked = g.platforms.includes('ps5');
    const released = h('input', { type: 'date', value: g.released || '' });
    const rank = h('input', { type: 'number', min: 1, max: 999, value: g.famousRank || '', placeholder: 'e.g. 5' });
    const famous = h('input', { type: 'checkbox' }); famous.checked = !!g.famous;
    const visible = h('input', { type: 'checkbox' }); visible.checked = g.visible !== false;
    const desc = h('textarea', { rows: 7 }); desc.value = g.description || '';
    const descFa = h('textarea', { rows: 7, dir: 'rtl' }); descFa.value = g.description_fa || '';
    const companyLogo = h('input', { type: 'url', placeholder: 'Optional official studio logo URL (https://…)', value: g.companyLogo || '' });
    const awards = h('textarea', { rows: 4, placeholder: 'One award per line\nGame of the Year (2024)' }); awards.value = (g.awards || []).join('\n');
    const awardsSource = h('input', { type: 'url', placeholder: 'https://thegameawards.com/…', value: g.awardsSource || '' });
    const companyAwards = h('textarea', { rows: 4, placeholder: 'One studio award per line\nStudio game — Best Direction (2024)' }); companyAwards.value = (g.companyAwards || []).join('\n');
    const companyAwardsSource = h('input', { type: 'url', placeholder: 'Official awards page (https://…)', value: g.companyAwardsSource || '' });
    const playtime = h('input', { placeholder: 'e.g. 25 hours main story', value: g.playtime || '' });
    const playtimeSource = h('input', { type: 'url', placeholder: 'https://howlongtobeat.com/…', value: g.playtimeSource || '' });
    const metacritic = h('input', { type: 'number', min: 0, max: 100, step: 1, placeholder: '0–100', value: g.metacritic ?? '' });
    const ageRating = h('input', { placeholder: 'e.g. ESRB Mature 17+', value: g.ageRating || '' });
    const ageRatingUrl = h('input', { type: 'url', placeholder: 'Rating source (https://…)', value: g.ageRatingUrl || '' });
    const contentDescriptors = h('input', { placeholder: 'Blood and Gore, Intense Violence', value: (g.contentDescriptors || []).join(', ') });
    const players = h('input', { placeholder: 'e.g. 1–2 local · 8 online', value: g.players || '' });
    const triSelect = value => {
      const select = h('select', {}, h('option', { value: '' }, 'Automatic / not set'), h('option', { value: 'true' }, 'Supported'), h('option', { value: 'false' }, 'Not supported'));
      select.value = typeof value === 'boolean' ? String(value) : '';
      return select;
    };
    const dualSense = triSelect(g.dualSense);
    const vr = triSelect(g.vr);
    const online = triSelect(g.online);
    const shots = [...g.screenshots];
    let pendingCover = null;
    const pendingShots = [];

    const coverPrev = h('img', { class: 'cover-prev', src: g.coverUrl || '', style: g.coverUrl ? '' : 'visibility:hidden' });
    const coverFile = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    coverFile.onchange = () => { pendingCover = coverFile.files[0] || null; if (pendingCover) { pendingCoverUrl = ''; coverPrev.src = URL.createObjectURL(pendingCover); coverPrev.style.visibility = 'visible'; } };

    const shotGrid = h('div', { class: 'shots' });
    function drawShots() {
      shotGrid.replaceChildren(
        ...shots.map((u, i) => h('div', { class: 'shot' }, h('img', { src: u, loading: 'lazy' }),
          h('button', { title: 'Remove', onclick: () => { shots.splice(i, 1); drawShots(); } }, '×'))),
        ...pendingShots.map((f, i) => h('div', { class: 'shot' }, h('img', { src: URL.createObjectURL(f) }),
          h('button', { title: 'Remove', onclick: () => { pendingShots.splice(i, 1); drawShots(); } }, '×'))));
    }
    drawShots();
    const urlIn = h('input', { placeholder: 'Paste an image URL (https://…) and press Add' });
    const shotFiles = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true });
    shotFiles.onchange = () => { pendingShots.push(...shotFiles.files); shotFiles.value = ''; drawShots(); };

    const save = h('button', { class: 'btn primary' }, isNew ? 'Create game' : 'Save changes');
    save.onclick = () => run(async () => {
      save.disabled = true;
      try {
        const body = {
          title: title.value, category: catIn.value,
          platforms: [p4.checked && 'ps4', p5.checked && 'ps5'].filter(Boolean),
          released: released.value, famous: famous.checked, famousRank: rank.value, visible: visible.checked,
          description: desc.value, description_fa: descFa.value, screenshots: shots, company: company.value,
          coverUrl: pendingCover ? '' : pendingCoverUrl,
          companyLogo: companyLogo.value,
          awards: awards.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean), awardsSource: awardsSource.value,
          companyAwards: companyAwards.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean), companyAwardsSource: companyAwardsSource.value,
          playtime: playtime.value, playtimeSource: playtimeSource.value,
          metacritic: metacritic.value, ageRating: ageRating.value, ageRatingUrl: ageRatingUrl.value,
          contentDescriptors: contentDescriptors.value.split(',').map(x => x.trim()).filter(Boolean), players: players.value,
          dualSense: dualSense.value === '' ? null : dualSense.value === 'true',
          vr: vr.value === '' ? null : vr.value === 'true',
          online: online.value === '' ? null : online.value === 'true',
        };
        const r = isNew ? await api('POST', '/api/admin/games', body) : await api('PUT', '/api/admin/games/' + encodeURIComponent(slug), body);
        const newSlug = r.slug;
        if (r.coverError) toast('Saved, but the cover could not be downloaded: ' + r.coverError, 'err');
        if (pendingCover) await api('POST', '/api/admin/games/' + newSlug + '/cover', undefined, pendingCover);
        for (const f of pendingShots) await api('POST', '/api/admin/games/' + newSlug + '/screenshots', undefined, f);
        closeModal();
        toast('Saved');
        show();
      } finally { save.disabled = false; }
    });

    const translate = h('button', { class: 'btn small', type: 'button' }, 'Auto-translate English → Persian');
    translate.onclick = () => run(async () => {
      if (!desc.value.trim()) throw new Error('Write the English description first');
      translate.disabled = true;
      try { descFa.value = (await api('POST', '/api/admin/translate', { text: desc.value })).text; toast('Translated — please review it'); }
      finally { translate.disabled = false; }
    });

    // ---- quick add: type the name, fill everything the catalog can find ----
    const fillFrom = d => {
      title.value = d.title;
      catIn.value = d.category;
      p4.checked = d.platforms.includes('ps4'); p5.checked = d.platforms.includes('ps5');
      released.value = d.released || '';
      desc.value = d.description || '';
      descFa.value = d.description_fa || '';
      shots.splice(0, shots.length, ...d.screenshots); drawShots();
      if (d.company) company.value = d.company;
      metacritic.value = d.metacritic ?? '';
      ageRating.value = d.ageRating || '';
      ageRatingUrl.value = d.ageRatingUrl || '';
      contentDescriptors.value = Array.isArray(d.contentDescriptors) ? d.contentDescriptors.join(', ') : '';
      players.value = d.players || '';
      dualSense.value = typeof d.dualSense === 'boolean' ? String(d.dualSense) : '';
      vr.value = typeof d.vr === 'boolean' ? String(d.vr) : '';
      online.value = typeof d.online === 'boolean' ? String(d.online) : '';
      if (d.coverUrl) { pendingCoverUrl = d.coverUrl; pendingCover = null; coverPrev.src = d.coverUrl; coverPrev.style.visibility = 'visible'; }
    };
    const lq = h('input', { value: initialSearch, placeholder: 'Type the game name, e.g. Elden Ring', maxlength: 80 });
    const lbtn = h('button', { class: 'btn primary', type: 'button' }, 'Search');
    const lstat = h('div', { class: 'muted', style: 'margin-top:8px;min-height:18px' });
    const lres = h('div', { class: 'lk-results' });
    const doSearch = () => run(async () => {
      const q = lq.value.trim();
      if (q.length < 2) throw new Error('Type at least 2 letters');
      lbtn.disabled = true; lstat.textContent = 'Searching the game catalog\u2026'; lres.replaceChildren();
      try {
        const r = await api('GET', '/api/admin/lookup/search?q=' + encodeURIComponent(q));
        lstat.textContent = r.results.length ? (r.results.length + ' result' + (r.results.length === 1 ? '' : 's') + (r.note ? ' - ' + r.note : '') + ' Click the right game:') : 'No PS4/PS5 game found. Try another spelling.';
        lres.replaceChildren(...r.results.map(c => h('div', { class: 'lk-card' + (c.inCatalog ? ' have' : '') },
          c.coverUrl ? h('img', { src: c.coverUrl, alt: '' }) : h('div', { class: 'lk-noimg' }),
          h('div', { class: 'lk-info' },
            h('strong', {}, c.title),
            h('div', { class: 'muted' }, [c.platforms.map(x => x.toUpperCase()).join(' / '), c.releaseDate ? c.releaseDate.slice(0, 4) : '', c.price || ''].filter(Boolean).join('  \u00b7  ')),
            c.inCatalog ? h('span', { class: 'tag warn' }, 'already in your catalog') : null),
          h('button', { class: 'btn small primary', type: 'button', onclick: ev => useResult(c, ev.target) }, 'Use this'))));
      } finally { lbtn.disabled = false; }
    });
    const useResult = (c, btn) => run(async () => {
      if (!isNew && !confirm('Replace the fields below with the information from the store?')) return;
      btn.disabled = true; btn.textContent = 'Loading\u2026';
      lstat.textContent = 'Getting the description, screenshots and details\u2026';
      try {
        const d = await api('POST', '/api/admin/lookup/details', { candidate: c });
        fillFrom(d);
        lres.replaceChildren();
        lstat.replaceChildren(h('span', { style: 'color:#22c55e;font-weight:700' }, '\u2713 Filled in from the store' + (d.storeName ? ' (' + d.storeName + ')' : '') + '. Check the fields below, then press ' + (isNew ? 'Create game' : 'Save changes') + '.'),
          ...d.warnings.map(w => h('div', { style: 'color:#f59e0b' }, '\u26a0 ' + w)),
          d.genres.length ? h('div', { class: 'muted' }, 'Store genres: ' + d.genres.join(', ') + '  \u2192  category "' + d.category + '"') : null);
      } finally { btn.disabled = false; btn.textContent = 'Use this'; }
    });
    lbtn.onclick = doSearch;
    lq.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); doSearch(); } });
    const quick = h('div', { class: 'card', style: 'background:#0e0914;border-color:var(--accent)' },
      h('h3', { style: 'margin-bottom:6px' }, isNew ? '\u26a1 Quick add from the game catalog' : '\u26a1 Refill from the game catalog'),
      h('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Type the name and pick the game. The cover, descriptions, screenshots, release date, platforms, category, rating and support details are filled in when the sources provide them.'),
      h('div', { class: 'row grow', style: 'margin:0' }, lq, h('span', { style: 'flex:0 0 auto' }, lbtn)), lstat, lres);

    $('modal').replaceChildren(
      h('h2', {}, isNew ? 'Add a game' : 'Edit game'),
      quick,
      h('div', { class: 'grid2' },
        field('Title', title),
        field('Category', h('div', {}, catIn, dl)),
        field('Release date', released),
        field('Most Famous rank (1 = top; empty = not ranked)', rank),
        field('Company / studio (games from the same company are suggested together in "For you")', company)),
      h('div', { class: 'row', style: 'margin-top:14px' },
        h('label', {}, p4, ' PS4'), h('label', {}, p5, ' PS5'),
        h('label', {}, famous, ' Mark as famous'),
        h('label', {}, visible, ' Visible on site')),
      h('div', { class: 'card editor-details-card' },
        h('h3', {}, 'Game page details'),
        h('p', { class: 'muted editor-help' }, 'These fields power the three public detail cards. The quick importer fills what it can; leave a support field on Automatic when the store should be checked later.'),
        h('div', { class: 'grid2' },
          field('Creator studio logo URL (optional)', companyLogo),
          field('Critic score / Metacritic (0–100)', metacritic),
          field('Play time', playtime),
          field('Play time source', playtimeSource),
          field('Players', players),
          field('Age rating', ageRating),
          field('Age rating source', ageRatingUrl),
          field('Content descriptors (comma separated)', contentDescriptors),
          field('DualSense / haptics', dualSense),
          field('VR support', vr),
          field('Online play', online)),
        h('div', { class: 'grid2 editor-awards-grid' },
          h('div', {}, field('Game awards (one per line)', awards), field('Game awards source', awardsSource)),
          h('div', {}, field('Studio awards (one per line)', companyAwards), field('Studio awards source', companyAwardsSource)))),
      h('h3', {}, 'Poster / cover'),
      h('div', { class: 'row' }, coverPrev, h('div', {}, coverFile, h('p', { class: 'muted' }, 'JPG, PNG or WEBP, square works best (max 10 MB).'))),
      h('h3', {}, 'Description'),
      h('div', { class: 'grid2' }, field('English', desc), field('Persian (فارسی)', descFa)),
      h('div', { class: 'row', style: 'margin-top:8px' }, translate),
      isNew ? null : filesSection(slug),
      h('h3', {}, 'Gameplay screenshots'),
      shotGrid,
      h('div', { class: 'row grow' }, urlIn, h('button', { class: 'btn', style: 'flex:0 0 auto', onclick: () => {
        const u = urlIn.value.trim();
        if (!/^https:\/\//.test(u)) return toast('URL must start with https://', 'err');
        shots.push(u); urlIn.value = ''; drawShots();
      } }, 'Add URL')),
      h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Or upload images:'), shotFiles),
      h('div', { class: 'row', style: 'margin-top:20px; justify-content:flex-end' },
        h('button', { class: 'btn', onclick: closeModal }, 'Cancel'), save));
    $('modal-bg').style.display = 'block';
    if (initialSearch) doSearch();
  });
}
// Files for sale: the whole game's price is calculated from its total download size.
function filesSection(slug) {
  const box = h('div', { class: 'card', style: 'background:#0e0914' });
  const tbody = h('tbody');
  const info = h('span', { class: 'muted' });
  async function load() {
    const d = await api('GET', '/api/admin/games/' + encodeURIComponent(slug) + '/files');
    info.textContent = adminLanguage === 'fa'
      ? 'حجم کل بازی: ' + fmtNumber(d.gameSizeGB || 0) + ' گیگابایت · مصرف سهمیه: ' + (d.gameQuotaGB == null ? 'ناموجود' : fmtNumber(d.gameQuotaGB) + ' گیگابایت')
      : 'Whole game: ' + (d.gameSizeGB || 0) + ' GB · Quota used: ' + (d.gameQuotaGB == null ? 'unavailable' : d.gameQuotaGB + ' GB');
    tbody.replaceChildren(...(d.files.length ? d.files.map(f => {
      return h('tr', {},
        h('td', {}, f.name),
        h('td', {}, f.type + ' \u00b7 ' + f.sizeMB + ' MB'),
        h('td', { style: 'white-space:nowrap' },
          h('button', { class: 'btn small danger', onclick: () => { if (confirm('Delete the file "' + f.name + '" from the server?')) run(async () => { await api('DELETE', '/api/admin/games/' + encodeURIComponent(slug) + '/files?name=' + encodeURIComponent(f.name)); load(); }); } }, 'Delete')));
    }) : [h('tr', {}, h('td', { colspan: 3, class: 'muted' }, 'No files yet. Upload one below.'))]));
  }
  const upFile = h('input', { type: 'file', multiple: true });
  const bar = h('div', { class: 'muted' });
  const upBtn = h('button', { class: 'btn primary' }, 'Upload');
  upBtn.onclick = async () => {
    const files = [...upFile.files];
    if (!files.length) return toast('Choose one or more files first', 'err');
    upBtn.disabled = true;
    try {
      for (const f of files) {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/admin/games/' + encodeURIComponent(slug) + '/files?name=' + encodeURIComponent(f.name));
          xhr.setRequestHeader('X-Admin', '1');
          xhr.upload.onprogress = e => { if (e.lengthComputable) bar.textContent = f.name + ': ' + Math.round(e.loaded / e.total * 100) + '%'; };
          xhr.onload = () => { let m = {}; try { m = JSON.parse(xhr.responseText); } catch (e) { /* ignore */ } xhr.status < 300 ? resolve() : reject(new Error(m.error || 'Upload failed')); };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(f);
        });
      }
      bar.textContent = '';
      upFile.value = '';
      toast('Uploaded');
      await load();
    } catch (e) { toast(e.message, 'err'); bar.textContent = ''; }
    upBtn.disabled = false;
  };
  box.append(
    h('h3', {}, 'Game downloads and price'),
    h('p', { class: 'muted' }, 'Unlocking a game uses download quota equal to the total size of its uploaded files. Customers need an active paid plan with enough quota.'),
    h('div', { class: 'row' }, info),
    h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['File', 'Size', ''].map(x => h('th', {}, x)))), tbody)),
    h('div', { class: 'row', style: 'margin-top:12px' }, upFile, upBtn, bar));
  load().catch(e => toast(e.message, 'err'));
  return box;
}

function closeModal() { $('modal-bg').style.display = 'none'; }
$('modal-bg').addEventListener('mousedown', e => { if (e.target === $('modal-bg')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---------- subscription plans ----------
async function renderPlans() {
  const plans = await api('GET', '/api/plans');
  const box = h('div', { class: 'admin-plan-list' });
  const editors = [];
  const planColors = { free: '#64748b', bronze: '#c47a45', silver: '#94a3b8', gold: '#f3b51b' };
  const quotaLabel = quota => Number(quota) > 0 ? fmtNumber(quota) + ' GB quota' : 'No download quota';
  function addEditor(p) {
    const f = {};
    const mk = (key, label, type) => { f[key] = h('input', { value: p[key] || '', type: type || 'text' }); return field(label, f[key]); };
    f.color = h('select', {}, ['free', 'bronze', 'silver', 'gold'].map(c => h('option', { value: c }, c)));
    f.color.value = /^#/.test(p.color) ? p.color : (p.color || 'bronze');
    if (/^#/.test(p.color)) f.color.append(h('option', { value: p.color }, p.color)), f.color.value = p.color;
    f.featured = h('input', { type: 'checkbox' }); f.featured.checked = !!p.featured;
    f.features_en = h('textarea', { rows: 4 }); f.features_en.value = (p.features_en || []).join('\n');
    f.features_fa = h('textarea', { rows: 4, dir: 'rtl' }); f.features_fa.value = (p.features_fa || []).join('\n');
    const editor = h('div', { class: 'admin-plan-editor' }, h('div', { class: 'plan-edit' },
      h('div', { class: 'grid2' }, mk('name_en', 'Name (English)'), mk('name_fa', 'Name (Persian)'),
        mk('price_en', 'Price (English), e.g. $10'), mk('price_fa', 'Price (Persian)'),
        mk('period_en', 'Period (English), e.g. / month'), mk('period_fa', 'Period (Persian)'),
        mk('button_en', 'Button text (English)'), mk('button_fa', 'Button text (Persian)'),
        mk('quotaGB', 'Download quota in GB', 'number'),
        field('Button link', (f.link = h('input', { value: p.link || '#' }))), field('Color', f.color)),
      h('div', { class: 'grid2', style: 'margin-top:14px' },
        field('Features, one per line (English)', f.features_en), field('Features, one per line (Persian)', f.features_fa)),
      h('div', { class: 'row', style: 'margin-top:12px' },
        h('label', {}, f.featured, ' Highlight this plan'),
        h('span', { class: 'muted' }, 'ID: ' + (p.id || 'new')),
        h('button', { class: 'btn small danger', style: 'margin-inline-start:auto', onclick: () => {
          if (!confirm('Remove this plan?')) return;
          editors.splice(editors.findIndex(e => e.wrap === wrap), 1); wrap.remove();
        } }, 'Remove plan'))));
    const wrap = h('article', {
      class: 'admin-plan-card',
      style: '--plan-accent:' + (p.color && /^#/.test(p.color) ? p.color : (planColors[p.color] || planColors.free)),
    });
    const summary = h('button', {
      class: 'admin-plan-summary', type: 'button', 'aria-expanded': 'false',
      'aria-label': 'Edit plan ' + (p.name_en || p.id || ''),
      onclick: () => {
        const open = !wrap.classList.contains('is-open');
        if (open) editors.forEach(item => {
          if (item.wrap === wrap) return;
          item.wrap.classList.remove('is-open');
          item.wrap.querySelector('.admin-plan-summary')?.setAttribute('aria-expanded', 'false');
        });
        wrap.classList.toggle('is-open', open);
        summary.setAttribute('aria-expanded', open ? 'true' : 'false');
      },
    },
      h('span', { class: 'admin-plan-summary-copy' },
        h('strong', { class: 'admin-plan-summary-name' }, adminLanguage === 'fa' ? (p.name_fa || p.name_en || p.id) : (p.name_en || p.id)),
        h('span', { class: 'admin-plan-summary-id' }, 'ID: ' + (p.id || 'new')),
        h('span', { class: 'admin-plan-summary-meta' },
          h('span', {}, adminLanguage === 'fa' ? (p.price_fa || p.price_en || '—') : (p.price_en || p.price_fa || '—')),
          h('span', {}, quotaLabel(p.quotaGB)),
          h('span', {}, (p.features_en || []).filter(Boolean).length + ' features'))),
      h('span', { class: 'admin-plan-summary-arrow', 'aria-hidden': 'true' }, '⌄'));
    wrap.append(summary, editor);
    editors.push({ f, p, wrap });
    box.append(wrap);
  }
  const planOrder = { gold: 0, silver: 1, bronze: 2, free: 3 };
  plans.slice().sort((a, b) => (planOrder[a.id] ?? 9) - (planOrder[b.id] ?? 9)).forEach(addEditor);
  const collect = () => editors.map(({ f, p }) => ({
    id: p.id, color: f.color.value, featured: f.featured.checked, link: f.link.value, quotaGB: f.quotaGB.value,
    name_en: f.name_en.value, name_fa: f.name_fa.value, price_en: f.price_en.value, price_fa: f.price_fa.value,
    period_en: f.period_en.value, period_fa: f.period_fa.value, button_en: f.button_en.value, button_fa: f.button_fa.value,
    features_en: f.features_en.value.split('\n'), features_fa: f.features_fa.value.split('\n'),
  }));
  return h('div', {},
    h('p', { class: 'muted' }, 'These plans appear on the public Subscription page.'),
    box,
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => { if (editors.length >= 8) return toast('Max 8 plans', 'err'); addEditor({ name_en: 'New plan', color: 'bronze', features_en: [], features_fa: [], link: '#' }); } }, '+ Add plan'),
      h('button', { class: 'btn primary', onclick: () => run(async () => { await api('PUT', '/api/admin/plans', { plans: collect() }); toast('Plans saved'); }) }, 'Save plans'),
      h('a', { class: 'btn', href: '/subscription.html', target: '_blank' }, 'View page')));
}

// ---------- customers ----------
let planCache = [];
// ---------- customer accounts (people who signed up on the website) ----------
const ago = iso => {
  if (!iso) return 'never';
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + ' days ago';
  if (s < 86400 * 365) return Math.floor(s / 86400 / 30) + ' months ago';
  return Math.floor(s / 86400 / 365) + ' years ago';
};
const dateOnly = iso => formatAdminDate(iso, { year: 'numeric', month: 'short', day: 'numeric' });
const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

async function setAccountAdmin(id, name, enabled) {
  const action = enabled ? 'grant admin access to' : 'remove admin access from';
  if (!confirm('Are you sure you want to ' + action + ' ' + name + '?')) return;
  await run(async () => {
    await api('POST', '/api/admin/users/' + encodeURIComponent(id) + '/admin', { enabled });
    toast(enabled ? 'Admin access granted.' : 'Admin access removed.');
    await show();
  });
}

async function removePendingSignup(email, name) {
  if (!confirm('Remove the pending signup for ' + (name || email) + '?')) return;
  await run(async () => {
    await api('DELETE', '/api/admin/pending-signups/' + encodeURIComponent(email));
    toast('Pending signup removed.');
    await show();
  });
}

async function setMarketerApproval(account, enabled) {
  const action = enabled ? 'approve marketer access for' : 'revoke marketer access for';
  if (!confirm('Are you sure you want to ' + action + ' ' + account.name + '?')) return;
  await run(async () => {
    await api('PUT', '/api/admin/earnings/marketers/' + encodeURIComponent(account.id), {
      approved: enabled,
      identityVerified: !!account.identityVerified,
      bankVerified: !!account.bankVerified,
    });
    toast(enabled ? 'Marketer access approved.' : 'Marketer access revoked.');
    await show();
  });
}

async function renderCustomers() {
  const [accounts, plans, pending] = await Promise.all([
    api('GET', '/api/admin/users'),
    api('GET', '/api/plans'),
    api('GET', '/api/admin/pending-signups'),
  ]);
  planCache = plans;
  const weekAgo = Date.now() - 7 * 86400 * 1000;
  const box = (n, label) => h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, label));
  const stats = h('div', { class: 'stats', style: 'margin-bottom:16px' },
    box(accounts.length, 'Registered accounts'),
    box(accounts.filter(a => new Date(a.created) > weekAgo).length, 'New in the last 7 days'),
    box(accounts.filter(a => a.plan).length, 'With an active plan'),
    box(fmtNumber(accounts.reduce((s, a) => s + (Number(a.downloadQuotaGB) || 0), 0)) + ' GB', 'Download quota remaining'),
    box(accounts.reduce((s, a) => s + a.gamesUnlocked, 0), 'Games unlocked in total'),
    box(pending.length, 'Pending email verification'));

  const search = h('input', { placeholder: 'Search name, username, email or phone…' });
  const planSel = h('select', {}, h('option', { value: '' }, 'All plans'), h('option', { value: '_none' }, 'No plan'), plans.map(p => h('option', { value: p.id }, p.name_en)));
  const sortSel = h('select', {}, h('option', { value: 'new' }, 'Newest first'), h('option', { value: 'old' }, 'Oldest first'), h('option', { value: 'login' }, 'Last login'), h('option', { value: 'bal' }, 'Most quota remaining'), h('option', { value: 'name' }, 'Name A-Z'));
  const tbody = h('tbody');
  const count = h('span', { class: 'muted' });
  function draw() {
    const q = search.value.trim().toLowerCase();
    let rows = accounts.filter(a => (!q || [a.name, a.email, a.username, a.phone].some(v => (v || '').toLowerCase().includes(q))) &&
      (!planSel.value || (planSel.value === '_none' ? !a.plan : a.plan === planSel.value)));
    const sorters = { new: (x, y) => new Date(y.created) - new Date(x.created), old: (x, y) => new Date(x.created) - new Date(y.created),
      login: (x, y) => new Date(y.lastLogin || 0) - new Date(x.lastLogin || 0), bal: (x, y) => (Number(y.downloadQuotaGB) || 0) - (Number(x.downloadQuotaGB) || 0), name: (x, y) => x.name.localeCompare(y.name) };
    rows = rows.sort(sorters[sortSel.value]);
    count.textContent = rows.length + ' of ' + accounts.length + ' accounts';
    tbody.replaceChildren(...(rows.length ? rows.map(a => h('tr', {},
      h('td', {}, h('div', { class: 'acct-who' }, h('span', { class: 'avatar' }, initials(a.name)),
        h('div', {}, h('strong', {}, a.name), a.username ? h('span', { class: 'muted' }, '  @' + a.username) : null, h('div', { class: 'muted' }, a.email, ' ', a.verified ? h('span', { class: 'tag ok' }, 'verified') : h('span', { class: 'tag warn' }, 'unverified')), a.phone ? h('div', { class: 'muted' }, a.phone, ' ', a.phoneVerified ? h('span', { class: 'tag ok' }, 'phone verified') : h('span', { class: 'tag warn' }, 'phone not verified')) : null))),
      h('td', {}, dateOnly(a.created), h('div', { class: 'muted' }, ago(a.created))),
      h('td', {}, ago(a.lastLogin), h('div', { class: 'muted' }, a.logins + ' login' + (a.logins === 1 ? '' : 's'))),
      h('td', {}, a.plan ? h('span', { class: 'tag ok' }, a.planName_en) : h('span', { class: 'muted' }, '-'), a.plan ? h('div', { class: 'muted' }, 'until ' + dateOnly(a.planEnd)) : null),
      h('td', {}, h('strong', {}, fmtNumber(Number(a.downloadQuotaGB) || 0)), ' GB'),
      h('td', {}, a.gamesUnlocked + ' game' + (a.gamesUnlocked === 1 ? '' : 's'), a.filesUnlocked ? h('div', { class: 'muted' }, a.filesUnlocked + ' legacy file purchases') : null),
      h('td', {}, h('span', { class: 'tag ' + (a.isAdmin ? 'ok' : '') }, a.isAdmin ? 'Admin' : 'Customer'),
        h('div', { class: 'muted', style: 'margin-top:5px' }, 'Marketer: ', a.marketerApproved ? h('span', { class: 'tag ok' }, 'Approved') : h('span', { class: 'tag warn' }, 'Not approved'))),
      h('td', { style: 'white-space:nowrap' }, h('button', { class: 'btn small primary', onclick: () => openAccount(a.id) }, 'Open profile'), adminIdentity && adminIdentity.rootAdmin ? [
        h('button', { class: 'btn small', style: 'margin-inline-start:6px', onclick: () => setAccountAdmin(a.id, a.name, !a.isAdmin) }, a.isAdmin ? 'Remove admin' : 'Make admin'),
        h('button', { class: 'btn small ' + (a.marketerApproved ? '' : 'primary'), style: 'margin-inline-start:6px', onclick: () => setMarketerApproval(a, !a.marketerApproved) }, a.marketerApproved ? 'Revoke marketer' : 'Approve marketer'),
      ] : null))) :
      [h('tr', {}, h('td', { colspan: 8, class: 'muted' }, accounts.length ? 'No account matches.' : 'No one has signed up yet. Accounts appear here as soon as customers verify their email.'))]));
  }
  [search, planSel, sortSel].forEach(el => el.addEventListener('input', draw));
  draw();

  const manual = await renderManualCustomers();
  const pendingRows = pending.map(p => h('tr', {},
    h('td', {}, h('strong', {}, p.name || '—'), p.username ? h('div', { class: 'muted' }, '@' + p.username) : null, h('div', { class: 'muted' }, p.email)),
    h('td', {}, p.phone || '—'),
    h('td', {}, p.created ? fmtDate(p.created) : '—', h('div', { class: 'muted' }, p.status === 'awaiting-verification' ? 'Awaiting code' : 'Expired')),
    h('td', {}, p.expires ? fmtDate(p.expires) : '—', h('div', { class: 'muted' }, 'Attempts: ' + p.tries)),
    h('td', {}, h('span', { class: 'tag warn' }, 'Pending')),
    h('td', {}, h('button', { class: 'btn small danger', onclick: () => removePendingSignup(p.email, p.name) }, 'Remove pending signup'))));
  const pendingCard = h('section', { class: 'card', style: 'margin-top:28px' },
    h('h3', {}, 'Pending email verification'),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'These registrations have not become active accounts yet. They remain manageable here while the customer completes email verification.'),
    h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Name', 'Phone', 'Registered', 'Code expires', 'Status', 'Actions'].map(x => h('th', {}, x)))),
      h('tbody', {}, pendingRows.length ? pendingRows : h('tr', {}, h('td', { colspan: 6, class: 'muted' }, 'No pending registrations.'))))));
  return h('div', {},
    stats,
    h('div', { class: 'row grow' }, search, planSel, sortSel),
    count,
    h('div', { class: 'card tablewrap', style: 'margin-top:10px' }, h('table', {}, h('thead', {}, h('tr', {}, ['Customer', 'Account created', 'Last login', 'Plan', 'Quota left', 'Game unlocks', 'Access', 'Actions'].map(x => h('th', {}, x)))), tbody)),
    pendingCard,
    h('h3', { style: 'margin:28px 0 6px' }, 'Customers added by hand'),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'For people who buy outside the website (no login). Optional.'),
    manual);
}

async function openAccount(id) {
  await run(async () => {
    const d = await api('GET', '/api/admin/users/' + encodeURIComponent(id));
    const field2 = (label, value) => h('div', { class: 'kv' }, h('small', {}, label), h('div', {}, value));
    const stat = (n, l) => h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, l));
    const orderRows = d.orderList.map(o => h('tr', {}, h('td', {}, fmtDate(o.date)), h('td', {}, (o.type === 'subscription' ? 'Subscription: ' : 'Legacy order: ') + o.label), h('td', {}, o.type === 'subscription' && o.quotaGB ? fmtNumber(o.quotaGB) + ' GB quota' : '—'), h('td', {}, o.price, o.discountCode ? h('div', { class: 'muted' }, o.discountCode + ' (-' + o.discountPercent + '%, was ' + o.originalPrice + ')') : null),
      h('td', {}, h('span', { class: 'tag ' + (o.status === 'paid' ? 'ok' : o.status === 'pending' ? 'warn' : 'bad') }, o.status))));
    const fileRows = d.files.map(p => h('tr', {}, h('td', {}, fmtDate(p.date)), h('td', {}, p.slug), h('td', {}, p.gameUnlock ? 'Full game' : p.file), h('td', {}, p.quotaBased ? fmtNumber(p.quotaGB) + ' GB quota' : 'Legacy access')));
    const table = (heads, rows, empty) => h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, heads.map(x => h('th', {}, x)))), h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: heads.length, class: 'muted' }, empty)))));
    $('modal').replaceChildren(
      h('div', { class: 'acct-who big' }, h('span', { class: 'avatar big' }, initials(d.name)),
        h('div', {}, h('h2', { style: 'margin:0' }, d.name), h('div', { class: 'muted' }, d.email, ' ', d.verified ? h('span', { class: 'tag ok' }, 'email verified') : h('span', { class: 'tag warn' }, 'email not verified')))),
      h('div', { class: 'grid2 kvgrid', style: 'margin-top:18px' },
        field2('First name', d.firstName || '-'),
        field2('Last name', d.lastName || '-'),
        field2('Username', d.username ? '@' + d.username : '-'),
        field2('Phone', d.phone ? d.phone + (d.phoneVerified ? '  (verified' + (d.phoneVerifiedAt ? ' ' + dateOnly(d.phoneVerifiedAt) : '') + ')' : '  (not verified yet)') : '-'),
        field2('Account created', fmtDate(d.created) + '  (' + ago(d.created) + ')'),
        field2('Last login', d.lastLogin ? fmtDate(d.lastLogin) + '  (' + ago(d.lastLogin) + ')' : 'never recorded'),
        field2('Total logins', d.logins || 'not recorded'),
        field2('Account ID', d.id),
        field2('Account access', d.isAdmin ? 'Administrator' : 'Customer'),
        field2('Current plan', d.plan ? d.planName_en + ' - until ' + formatAdminDate(d.planEnd) : 'No active plan'),
        field2('Download quota remaining', fmtNumber(Number(d.downloadQuotaGB) || 0) + ' GB')),
      h('div', { class: 'stats', style: 'margin:18px 0' },
        stat(fmtNumber(Number(d.quotaUsedGB) || 0) + ' GB', 'Quota used on full games'),
        stat(d.gamesUnlocked, 'Games unlocked'),
        stat(d.ordersPaid + ' / ' + d.orders, 'Orders paid / total')),
      h('h3', { style: 'margin-top:18px' }, 'Referral & marketer status'),
      h('div', { class: 'grid2 kvgrid' },
        field2('Invitation code', d.inviteCode || '-'),
        field2('Was invited by', d.invitedBy || '-'),
        field2('Admin-approved marketer', d.marketerApproved ? 'Yes' : 'No'),
        field2('Identity / bank verified', (d.identityVerified ? 'Identity verified' : 'Identity missing') + ' · ' + (d.bankVerified ? 'Bank verified' : 'Bank details missing'))),
      h('h3', { style: 'margin-top:18px' }, 'Orders'), table(['Date', 'Item', 'Download allowance', 'Price', 'Status'], orderRows, 'No orders.'),
      h('h3', { style: 'margin-top:18px' }, 'Game access'), table(['Date', 'Game', 'Access', 'Quota used'], fileRows, 'No games unlocked.'),
      h('div', { class: 'row', style: 'margin-top:22px; justify-content:space-between' },
        h('div', { class: 'row', style: 'margin:0' },
          h('button', { class: 'btn danger', onclick: () => { if (confirm('Delete the account of ' + d.name + '? Their download quota and unlocked files are lost.')) run(async () => { await api('DELETE', '/api/admin/users/' + d.id); closeModal(); toast('Account deleted'); show(); }); } }, 'Delete account')),
        h('button', { class: 'btn', onclick: closeModal }, 'Close')));
    $('modal-bg').style.display = 'block';
  });
}

async function renderManualCustomers() {
  const [list, plans] = await Promise.all([api('GET', '/api/admin/customers'), api('GET', '/api/plans')]);
  planCache = plans;
  const planName = id => { const p = plans.find(x => x.id === id); return p ? p.name_en : (id || '—'); };
  const search = h('input', { placeholder: 'Search name, email, phone…' });
  const status = h('select', {}, h('option', { value: '' }, 'All statuses'), ['active', 'paused', 'expired', 'cancelled'].map(s => h('option', { value: s }, s)));
  const tbody = h('tbody');
  const kind = { active: 'ok', paused: 'warn', expired: 'bad', cancelled: 'bad' };
  function draw() {
    const q = search.value.trim().toLowerCase();
    const rows = list.filter(c => (!status.value || c.status === status.value) &&
      (!q || [c.name, c.email, c.phone].some(v => (v || '').toLowerCase().includes(q))));
    tbody.replaceChildren(...rows.map(c => h('tr', {},
      h('td', {}, h('strong', {}, c.name), h('div', { class: 'muted' }, c.email || '')),
      h('td', {}, c.phone || ''),
      h('td', {}, h('span', { class: 'tag' }, planName(c.plan))),
      h('td', {}, h('span', { class: 'tag ' + (kind[c.status] || '') }, c.status)),
      h('td', {}, [c.start, c.end].filter(Boolean).join(' → ')),
      h('td', { style: 'white-space:nowrap' },
        h('button', { class: 'btn small', onclick: () => editCustomer(c) }, 'Open profile'), ' ',
        h('button', { class: 'btn small danger', onclick: () => {
          if (confirm('Delete customer "' + c.name + '"?')) run(async () => { await api('DELETE', '/api/admin/customers/' + c.id); show(); });
        } }, 'Delete')))));
    if (!rows.length) tbody.replaceChildren(h('tr', {}, h('td', { colspan: 6, class: 'muted' }, 'No customers yet.')));
  }
  [search, status].forEach(el => el.addEventListener('input', draw));
  draw();
  return h('div', {},
    h('div', { class: 'row grow' }, search, status, h('button', { class: 'btn', style: 'flex:0 0 auto', onclick: () => editCustomer(null) }, '+ Add customer')),
    h('div', { class: 'card tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Customer', 'Phone', 'Plan', 'Status', 'Period', ''].map(x => h('th', {}, x)))), tbody)));
}
function editCustomer(c) {
  const isNew = !c;
  c = c || { name: '', email: '', phone: '', plan: planCache[0] ? planCache[0].id : '', status: 'active', start: new Date().toISOString().slice(0, 10), end: '', notes: '' };
  const i = {
    name: h('input', { value: c.name, maxlength: 80 }), email: h('input', { value: c.email || '', type: 'email' }),
    phone: h('input', { value: c.phone || '' }), start: h('input', { type: 'date', value: c.start || '' }), end: h('input', { type: 'date', value: c.end || '' }),
    plan: h('select', {}, h('option', { value: '' }, '— none —'), planCache.map(p => h('option', { value: p.id }, p.name_en))),
    status: h('select', {}, ['active', 'paused', 'expired', 'cancelled'].map(s => h('option', { value: s }, s))),
    notes: h('textarea', { rows: 4 }),
  };
  i.plan.value = c.plan || ''; i.status.value = c.status || 'active'; i.notes.value = c.notes || '';
  const save = h('button', { class: 'btn primary' }, isNew ? 'Add customer' : 'Save profile');
  save.onclick = () => run(async () => {
    const body = Object.fromEntries(Object.entries(i).map(([k, el]) => [k, el.value]));
    if (isNew) await api('POST', '/api/admin/customers', body); else await api('PUT', '/api/admin/customers/' + c.id, body);
    closeModal(); toast('Saved'); show();
  });
  $('modal').replaceChildren(
    h('h2', {}, isNew ? 'Add customer' : 'Customer profile'),
    h('div', { class: 'grid2' }, field('Name', i.name), field('Email', i.email), field('Phone', i.phone), field('Plan', i.plan),
      field('Status', i.status), h('div'), field('Start date', i.start), field('End / renewal date', i.end)),
    h('div', { style: 'margin-top:14px' }, field('Notes (private)', i.notes)),
    isNew ? null : h('p', { class: 'muted' }, 'Created: ' + fmtDate(c.created)),
    h('div', { class: 'row', style: 'margin-top:20px; justify-content:flex-end' }, h('button', { class: 'btn', onclick: closeModal }, 'Cancel'), save));
  $('modal-bg').style.display = 'block';
}

// ---------- learn & content ----------
async function renderContent() {
  const c = await api('GET', '/api/site-content');
  const FIELDS = {};
  const sectionCard = (key, title, hint) => {
    const s = c[key] || {};
    FIELDS[key] = {
      heading_en: h('input', { value: s.heading_en || '' }), heading_fa: h('input', { value: s.heading_fa || '', dir: 'rtl' }),
      blurb_en: h('input', { value: s.blurb_en || '', maxlength: 160 }), blurb_fa: h('input', { value: s.blurb_fa || '', dir: 'rtl', maxlength: 160 }),
      body_en: h('textarea', { rows: 5 }), body_fa: h('textarea', { rows: 5, dir: 'rtl' }),
    };
    FIELDS[key].body_en.value = s.body_en || ''; FIELDS[key].body_fa.value = s.body_fa || '';
    return h('div', { class: 'card' }, h('h3', {}, title), h('p', { class: 'muted' }, hint),
      h('div', { class: 'grid2' }, field('Box title (English)', FIELDS[key].heading_en), field('Box title (Persian)', FIELDS[key].heading_fa),
        field('Short line under the title (English, optional)', FIELDS[key].blurb_en), field('Short line under the title (Persian, optional)', FIELDS[key].blurb_fa),
        field('Page text (English)', FIELDS[key].body_en), field('Page text (Persian)', FIELDS[key].body_fa)));
  };

  const videoStatus = h('span', { class: 'tag ' + (c.hasLearnVideo ? 'ok' : 'warn') }, c.hasLearnVideo ? 'Video uploaded' : 'No video yet');
  const vfile = h('input', { type: 'file', accept: 'video/mp4' });
  const vup = h('button', { class: 'btn', onclick: () => run(async () => {
    if (!vfile.files[0]) throw new Error('Choose an MP4 file first');
    vup.disabled = true; vup.textContent = 'Uploading…';
    try { await api('POST', '/api/admin/learn-video', undefined, vfile.files[0]); toast('Video uploaded'); show(); }
    finally { vup.disabled = false; vup.textContent = 'Upload video'; }
  }) }, 'Upload video');
  const vdel = h('button', { class: 'btn danger', onclick: () => { if (confirm('Remove the Learn video?')) run(async () => { await api('DELETE', '/api/admin/learn-video'); show(); }); } }, 'Remove video');

  return h('div', {},
    h('div', { class: 'card' }, h('h3', {}, 'Learn video'), h('div', { class: 'row' }, videoStatus, vfile, vup, vdel),
      h('p', { class: 'muted' }, 'MP4 only. It plays at the top of the Learn page.')),
    sectionCard('home', 'Homepage introduction', 'Title, short footer line and introduction in both languages. Leave empty to use the built-in copy.'),
    sectionCard('learn', 'Learn box and page', 'The box on the home page opens the Learn page (page text + video above). Leave a field empty to keep the built-in text.'),
    sectionCard('copy', 'Copy box and page', 'The box on the home page opens the Copy page.'),
    sectionCard('payload', 'Payload box and page', 'The box on the home page opens the Payload page.'),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => run(async () => {
      const body = {};
      for (const [k, f] of Object.entries(FIELDS)) body[k] = Object.fromEntries(Object.entries(f).map(([n, el]) => [n, el.value]));
      await api('PUT', '/api/admin/site-content', body);
      toast('Content saved');
    }) }, 'Save content')));
}

// ---------- footer & contact details ----------
async function renderFooterTab() {
  const c = await api('GET', '/api/site-content');
  const f = c.footer || {}, ct = c.contact || {};
  // items that were never saved still show the built-in demo version on the site
  const DEMO_NAMES = { tagline_en: 'description', copyright_en: 'bottom line', instagram: 'Instagram', whatsapp: 'WhatsApp', telegram: 'Telegram' };
  const demoLeft = Object.entries(DEMO_NAMES).filter(([k]) => f[k] === undefined).map(([, name]) => name);
  if (!c.contact) demoLeft.push('phone numbers');
  const F = {}, C = {};
  const inp = (store, src, k, label, extra) => { store[k] = h('input', Object.assign({ value: src[k] || '' }, extra || {})); return field(label, store[k]); };
  const area = (k, label, rtl) => { F[k] = h('textarea', { rows: 3, dir: rtl ? 'rtl' : null }); F[k].value = f[k] || ''; return field(label, F[k]); };
  const note = (t) => h('p', { class: 'muted', style: 'margin:0 0 12px' }, t);

  const save = () => run(async () => {
    const pick = o => Object.fromEntries(Object.entries(o).map(([k, el]) => [k, el.value]));
    await api('PUT', '/api/admin/site-content', { footer: pick(F), contact: pick(C) });
    toast('Footer saved - refresh the site to see it');
    show();
  });
  const reset = () => { if (confirm('Go back to the original demo footer (and demo contact details)?')) run(async () => { await api('PUT', '/api/admin/site-content', { resetFooter: true }); toast('Footer reset'); show(); }); };

  return h('div', {},
    demoLeft.length ? h('div', { class: 'card', style: 'border-color:#facc15' }, h('strong', { style: 'color:#facc15' }, 'Still showing demo text on the site: ' + demoLeft.join(', ') + '. '), h('span', { class: 'muted' }, 'Fill them in below and press Save (a box left empty will hide that item).')) : null,
    h('div', { class: 'card' }, h('h3', {}, 'Footer text'),
      note('The short description under the logo and the line at the very bottom. Leave a box empty to hide that text.'),
      h('div', { class: 'grid2' }, area('tagline_en', 'Description (English)'), area('tagline_fa', 'Description (Persian)', true),
        area('copyright_en', 'Bottom line / copyright (English)'), area('copyright_fa', 'Bottom line / copyright (Persian)', true))),
    h('div', { class: 'card' }, h('h3', {}, '"Follow Us" - social accounts'),
      note('Just the username or number. The footer builds the link for you. Leave empty to hide that account.'),
      h('div', { class: 'grid2' }, inp(F, f, 'instagram', 'Instagram username (e.g. drgame.official)', { dir: 'ltr', placeholder: 'drgame.official' }),
        inp(F, f, 'telegram', 'Telegram username (e.g. drgame_support)', { dir: 'ltr', placeholder: 'drgame_support' }),
        inp(F, f, 'whatsapp', 'WhatsApp number with country code (e.g. 989121234567)', { dir: 'ltr', placeholder: '989121234567' }))),
    h('div', { class: 'card' }, h('h3', {}, '"Contact" - phone, email, address'),
      note('These also appear on the Contact Us page. Leave empty to hide.'),
      h('div', { class: 'grid2' }, inp(C, ct, 'phone1', 'Phone 1 (e.g. +98 912 123 4567)', { dir: 'ltr' }), inp(C, ct, 'phone2', 'Phone 2', { dir: 'ltr' }),
        inp(C, ct, 'email', 'Email', { dir: 'ltr', type: 'email' }), h('div'),
        inp(C, ct, 'address_en', 'Address (English)'), inp(C, ct, 'address_fa', 'Address (Persian)', { dir: 'rtl' }),
        inp(C, ct, 'hours_en', 'Working hours (English) - Contact page only'), inp(C, ct, 'hours_fa', 'Working hours (Persian) - Contact page only', { dir: 'rtl' }))),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: save }, 'Save footer'),
      h('a', { class: 'btn', href: '/', target: '_blank' }, 'View the site'),
      h('button', { class: 'btn danger', style: 'margin-inline-start:auto', onclick: reset }, 'Reset to demo footer')));
}

// ---------- discount codes ----------
async function renderPromo() {
  const codes = await api('GET', '/api/admin/discount-codes');
  const copyText = (txt) => navigator.clipboard.writeText(txt).then(() => toast('Copied: ' + txt)).catch(() => prompt('Copy this:', txt));

  // ----- codes table -----
  const tbody = h('tbody');
  const kindLabel = { plans: 'subscriptions' };
  for (const c of codes) {
    const what = c.type === 'gift' ? 'Legacy gift code (disabled)' : c.percent + '% off ' + (c.appliesTo || []).map(k => kindLabel[k]).filter(Boolean).join(', ');
    tbody.append(h('tr', {},
      h('td', {}, h('strong', { style: 'font-size:16px;letter-spacing:.04em' }, c.code), c.note ? h('div', { class: 'muted' }, c.note) : null),
      h('td', {}, what),
      h('td', {}, c.assignedName ? h('span', { class: 'tag' }, c.assignedName) : h('span', { class: 'muted' }, 'anyone')),
      h('td', {}, c.usedCount + (c.maxUses ? ' / ' + c.maxUses : ''), h('div', { class: 'muted' }, (c.perUser ? c.perUser + ' per customer' : 'unlimited per customer'))),
      h('td', {}, c.expires || h('span', { class: 'muted' }, 'never')),
      h('td', {}, h('span', { class: 'tag ' + (c.status === 'active' ? 'ok' : c.status === 'off' ? 'warn' : 'bad') }, c.status)),
      h('td', { style: 'white-space:nowrap' },
        h('button', { class: 'btn small', onclick: () => copyText(c.code) }, 'Copy'), ' ',
        c.type === 'gift' ? null : h('button', { class: 'btn small', onclick: () => editCode(c) }, 'Edit'), ' ',
        h('button', { class: 'btn small', onclick: () => run(async () => {
          const rows = await api('GET', '/api/admin/discount-codes/' + c.id + '/uses');
          alert(rows.length ? rows.map(r => new Date(r.date).toLocaleString(adminLocale()) + '  ' + r.name + '  (' + r.kind + ')').join('\n') : 'Not used yet.');
        }) }, 'Uses'), ' ',
        h('button', { class: 'btn small danger', onclick: () => { if (confirm('Delete the code ' + c.code + '?')) run(async () => { await api('DELETE', '/api/admin/discount-codes/' + c.id); show(); }); } }, 'Delete'))));
  }
  if (!codes.length) tbody.append(h('tr', {}, h('td', { colspan: 7, class: 'muted' }, 'No codes yet. Press "+ New code".')));

  const codeCard = h('div', { class: 'card' },
    h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:6px' }, h('h3', { style: 'margin:0' }, 'Subscription discount codes'),
      h('button', { class: 'btn primary', onclick: () => editCode(null) }, '+ New code')),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'Discount codes apply to subscriptions. Previously created gift codes are disabled.'),
    h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Code', 'What it does', 'For', 'Used', 'Expires', 'Status', ''].map(x => h('th', {}, x)))), tbody)));

  return h('div', {}, codeCard);
}

let earningsSelectedId = null;
let earningsDemoPreview = false;
function makeDemoEarningsData(live) {
  const now = Date.now();
  const periodStart = new Date(live.period.start).getTime();
  const day = 86400000;
  const accounts = [
    { id: 'demo-maya', name: 'Maya Chen', email: 'maya.chen@example.test', inviteCode: 'DEMO-MAYA', marketerParentId: null, invitedBy: null, approved: true, siteAdmin: true, identityVerified: true, bankVerified: true, directSalesThisWeek: 3, teamSalesThisWeek: 13, rankThisWeek: { name: 'F8', sales: 8, depth: 2 } },
    { id: 'demo-noah', name: 'Noah Patel', email: 'noah.patel@example.test', inviteCode: 'DEMO-NOAH', marketerParentId: 'demo-maya', invitedBy: 'demo-maya', approved: true, siteAdmin: false, identityVerified: true, bankVerified: true, directSalesThisWeek: 3, teamSalesThisWeek: 6, rankThisWeek: { name: 'F3', sales: 3, depth: 1 } },
    { id: 'demo-ava', name: 'Ava Kim', email: 'ava.kim@example.test', inviteCode: 'DEMO-AVA', marketerParentId: 'demo-noah', invitedBy: 'demo-noah', approved: true, siteAdmin: false, identityVerified: true, bankVerified: false, directSalesThisWeek: 3, teamSalesThisWeek: 3, rankThisWeek: { name: 'F2', sales: 2, depth: 1 } },
    { id: 'demo-sam', name: 'Sam Rivera', email: 'sam.rivera@example.test', inviteCode: 'DEMO-SAM', marketerParentId: 'demo-maya', invitedBy: 'demo-maya', approved: true, siteAdmin: false, identityVerified: true, bankVerified: true, directSalesThisWeek: 4, teamSalesThisWeek: 4, rankThisWeek: { name: 'F1', sales: 1, depth: 1 } },
    { id: 'demo-jordan', name: 'Jordan Blake', email: 'jordan.blake@example.test', inviteCode: 'DEMO-JORDAN', marketerParentId: null, invitedBy: null, approved: true, siteAdmin: true, identityVerified: true, bankVerified: true, directSalesThisWeek: 4, teamSalesThisWeek: 8, rankThisWeek: { name: 'F5', sales: 5, depth: 1 } },
    { id: 'demo-eli', name: 'Eli Turner', email: 'eli.turner@example.test', inviteCode: 'DEMO-ELI', marketerParentId: 'demo-jordan', invitedBy: 'demo-jordan', approved: true, siteAdmin: false, identityVerified: true, bankVerified: true, directSalesThisWeek: 4, teamSalesThisWeek: 4, rankThisWeek: { name: 'F2', sales: 2, depth: 1 } },
    { id: 'demo-buyer-maya', name: 'Riley Stone', email: 'riley.stone@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-maya', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-maya-2', name: 'Casey Lane', email: 'casey.lane@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-maya', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-noah', name: 'Taylor Reed', email: 'taylor.reed@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-noah', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-ava', name: 'Avery Moss', email: 'avery.moss@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-ava', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-sam', name: 'Jamie Cruz', email: 'jamie.cruz@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-sam', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-jordan', name: 'Morgan Wells', email: 'morgan.wells@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-jordan', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
    { id: 'demo-buyer-eli', name: 'Quinn Parker', email: 'quinn.parker@example.test', inviteCode: null, marketerParentId: null, invitedBy: 'demo-eli', approved: false, siteAdmin: false, identityVerified: false, bankVerified: false },
  ];
  const byId = new Map(accounts.map(account => [account.id, account]));
  const directInviteCounts = new Map();
  for (const account of accounts) if (account.invitedBy) directInviteCounts.set(account.invitedBy, (directInviteCounts.get(account.invitedBy) || 0) + 1);
  for (const account of accounts) account.directInvites = directInviteCounts.get(account.id) || 0;

  const buyersBySponsor = new Map();
  for (const account of accounts.filter(person => !person.approved)) {
    const list = buyersBySponsor.get(account.invitedBy) || [];
    list.push(account.id);
    buyersBySponsor.set(account.invitedBy, list);
  }
  const makeSale = (number, sellerId, deliveredAt, period, historicalState = 'pending', reversed = false) => {
    const seller = byId.get(sellerId);
    const customerIds = buyersBySponsor.get(sellerId) || ['demo-buyer-maya'];
    const customerId = customerIds[(number - 1) % customerIds.length];
    const lines = [{ kind: 'direct', level: 0, recipientId: sellerId, amount: live.config.directToman, status: historicalState }];
    const unallocated = [];
    const chain = [];
    let ancestorId = seller && (seller.marketerParentId || seller.invitedBy);
    const seen = new Set([sellerId]);
    while (ancestorId && chain.length < 7 && !seen.has(ancestorId)) {
      seen.add(ancestorId);
      const ancestor = byId.get(ancestorId);
      if (!ancestor) break;
      if (ancestor.approved) chain.push(ancestor);
      ancestorId = ancestor.marketerParentId || ancestor.invitedBy;
    }
    for (let level = 1; level <= live.config.uplineToman.length; level++) {
      const amount = live.config.uplineToman[level - 1];
      const recipient = chain[level - 1];
      if (recipient && (recipient.rankThisWeek.depth || 0) >= level) lines.push({ kind: 'upline', level, recipientId: recipient.id, amount, status: historicalState });
      else unallocated.push({ kind: 'unallocated', level, recipientId: null, amount, reason: recipient ? 'rank-locked' : 'no-recipient' });
    }
    const delivered = new Date(deliveredAt).toISOString();
    const sale = {
      id: 'demo-sale-' + String(number).padStart(3, '0'), orderId: 'DEMO-ORD-' + String(number).padStart(3, '0'),
      customerId, attributedMarketerId: sellerId, deliveredAt: delivered, period, amount: live.config.budgetToman,
      releaseAt: new Date(new Date(delivered).getTime() + live.config.holdDays * day).toISOString(),
      lines, unallocated, reserve: { amount: live.config.reserveToman, status: 'held' }, orderMode: 'demo', testMode: true,
    };
    if (reversed) sale.reversedAt = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    return sale;
  };

  const currentSellers = [
    'demo-maya', 'demo-maya', 'demo-maya',
    'demo-noah', 'demo-noah', 'demo-noah',
    'demo-ava', 'demo-ava', 'demo-ava',
    'demo-sam', 'demo-sam', 'demo-sam', 'demo-sam',
    'demo-jordan', 'demo-jordan', 'demo-jordan', 'demo-jordan',
    'demo-eli', 'demo-eli', 'demo-eli', 'demo-eli',
  ];
  const span = Math.max(1000, Math.min(now - periodStart - 1000, 6 * day));
  const currentSales = currentSellers.map((sellerId, index) => makeSale(index + 1, sellerId, periodStart + Math.floor(span * (index + 1) / (currentSellers.length + 1)), live.period, 'pending'));
  const previousPeriod = { start: new Date(periodStart - 14 * day).toISOString(), end: new Date(periodStart - 7 * day).toISOString() };
  const historyPlan = [
    ['demo-maya', 'paid', false], ['demo-noah', 'pending', false], ['demo-ava', 'pending', false],
    ['demo-sam', 'paid', true], ['demo-jordan', 'paid', false], ['demo-eli', 'pending', false],
  ];
  const historySales = historyPlan.map(([sellerId, state, reversed], index) => makeSale(currentSellers.length + index + 1, sellerId, periodStart - 10 * day + index * 30 * 60 * 1000, previousPeriod, state, reversed));
  const sales = [...currentSales, ...historySales].sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));
  const currentIncome = new Map(accounts.map(account => [account.id, { pending: 0, payable: 0, paid: 0, reversed: 0, total: 0 }]));
  const allIncome = new Map(accounts.map(account => [account.id, { pending: 0, payable: 0, paid: 0, reversed: 0, debt: 0 }]));
  for (const sale of currentSales) {
    for (const line of sale.lines) {
      const row = currentIncome.get(line.recipientId);
      if (row) { row.pending += line.amount; row.total += line.amount; }
    }
  }
  for (const sale of sales) {
    for (const line of sale.lines) {
      const row = allIncome.get(line.recipientId);
      if (!row) continue;
      if (sale.reversedAt || line.status === 'reversed') {
        row.reversed += Math.abs(line.amount);
        if (sale.reversedAt && line.status === 'paid') row.debt += line.amount;
      } else if (line.status === 'paid') row.paid += line.amount;
      else if (new Date(sale.releaseAt).getTime() <= now && byId.get(line.recipientId).approved && byId.get(line.recipientId).identityVerified && byId.get(line.recipientId).bankVerified) row.payable += line.amount;
      else row.pending += line.amount;
    }
  }
  for (const account of accounts) {
    account.weekIncome = currentIncome.get(account.id) || { pending: 0, payable: 0, paid: 0, reversed: 0, total: 0 };
    account.income = allIncome.get(account.id) || { pending: 0, payable: 0, paid: 0, reversed: 0, debt: 0 };
  }
  const activeSales = currentSales.filter(sale => !sale.reversedAt);
  const weekTotals = activeSales.reduce((sum, sale) => {
    sum.sales += 1; sum.budget += sale.amount; sum.reserve += sale.reserve.amount;
    sum.unallocated += sale.unallocated.reduce((n, line) => n + line.amount, 0);
    for (const line of sale.lines) sum.pending += line.amount;
    return sum;
  }, { sales: 0, budget: 0, reserve: 0, unallocated: 0, pending: 0, paid: 0, reversed: 0 });
  const validSales = sales.filter(sale => !sale.reversedAt);
  const totals = validSales.reduce((sum, sale) => ({ ...sum, sales: sum.sales + 1, budget: sum.budget + sale.amount, reserve: sum.reserve + sale.reserve.amount, unallocated: sum.unallocated + sale.unallocated.reduce((n, line) => n + line.amount, 0) }), { sales: 0, budget: 0, reserve: 0, unallocated: 0, pending: 0, paid: 0, reversed: sales.length - validSales.length });
  const previousEnd = new Date(previousPeriod.end).getTime();
  return {
    ...live, testMode: true, marketers: accounts, sales, weekTotals, totals,
    settlements: [{ id: 'demo-settlement-001', date: new Date(previousEnd + day).toISOString(), testMode: true, simulated: true, payouts: [{ marketerId: 'demo-maya', name: 'Maya Chen', amountToman: 180000 }, { marketerId: 'demo-jordan', name: 'Jordan Blake', amountToman: 120000 }] }],
    reports: [{ id: 'demo-report-001', closedPeriodStart: previousPeriod.start, closedPeriodEnd: previousPeriod.end, sales: 14, budgetToman: 1400000, settlementId: 'demo-settlement-001', testMode: true }],
  };
}
async function renderEarnings() {
  const live = await api('GET', '/api/admin/earnings');
  const demoMode = earningsDemoPreview;
  const d = demoMode ? makeDemoEarningsData(live) : live;
  const c = d.config;
  const accounts = d.marketers || [];
  const byId = new Map(accounts.map(account => [account.id, account]));
  const approved = accounts.filter(account => account.approved);
  const approvedById = new Map(approved.map(account => [account.id, account]));
  const money = amount => fmtNumber(amount) + (adminLanguage === 'fa' ? ' تومان' : ' toman');
  const metric = (label, value, note = '', variant = '') => h('div', { class: 'earnings-metric ' + variant },
    h('span', { class: 'earnings-metric-label' }, label), h('strong', {}, value), note ? h('small', {}, note) : null);
  const rankForSales = sales => {
    const reached = (c.ranks || []).filter(rank => Number(sales || 0) >= Number(rank.sales || 0)).slice(-1)[0];
    return reached ? { ...reached } : { name: null, sales: 0, depth: 0 };
  };
  const rankName = rank => rank && rank.name || 'No rank';
  const rankDisplay = rank => rankName(rank) + ' · ' + String(rank && rank.depth || 0) + ' levels';
  const nextRankFor = account => account.approved ? rankForSales(account.teamSalesThisWeek || 0) : null;

  const parentOf = new Map();
  for (const account of approved) {
    let parentId = account.marketerParentId && approvedById.has(account.marketerParentId) ? account.marketerParentId : null;
    if (!parentId) {
      let id = account.invitedBy;
      const seen = new Set([account.id]);
      while (id && !seen.has(id)) {
        seen.add(id);
        const parent = byId.get(id);
        if (!parent) break;
        if (parent.approved) { parentId = parent.id; break; }
        id = parent.marketerParentId || parent.invitedBy;
      }
    }
    if (parentId && parentId !== account.id) parentOf.set(account.id, parentId);
  }
  const children = new Map();
  for (const account of approved) {
    const parentId = parentOf.get(account.id) || null;
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push(account);
  }
  const sortPeople = list => [...list].sort((a, b) => (b.teamSalesThisWeek || 0) - (a.teamSalesThisWeek || 0) || String(a.name || '').localeCompare(String(b.name || '')));
  for (const [id, list] of children) children.set(id, sortPeople(list));
  const descendants = id => {
    const result = [], seen = new Set([id]), queue = [...(children.get(id) || [])];
    while (queue.length) {
      const next = queue.shift();
      if (!next || seen.has(next.id)) continue;
      seen.add(next.id); result.push(next);
      queue.push(...(children.get(next.id) || []));
    }
    return result;
  };
  const pathFor = id => {
    const path = [], seen = new Set();
    let current = id;
    while (current && !seen.has(current)) {
      seen.add(current);
      const account = byId.get(current);
      if (!account) break;
      path.unshift(account);
      current = parentOf.get(current);
    }
    return path;
  };
  const openAccount = id => { earningsSelectedId = id; show(); };
  const badge = (label, kind = '') => h('span', { class: 'tag ' + kind }, label);
  const accountRole = account => account.siteAdmin ? 'Website admin' : account.approved ? 'Approved marketer' : 'Customer account';
  const memberButton = account => {
    const childCount = descendants(account.id).length;
    const activeRank = account.approved ? account.rankThisWeek : null;
    const nextRank = nextRankFor(account);
    const income = account.weekIncome || { total: 0 };
    return h('button', { type: 'button', class: 'earnings-person-row', onclick: () => openAccount(account.id) },
      h('span', { class: 'earnings-avatar', 'aria-hidden': 'true' }, String(account.name || '?').trim().slice(0, 1).toUpperCase()),
      h('span', { class: 'earnings-person-identity' }, h('strong', {}, account.name || '—'), h('small', {}, account.email || account.id)),
      h('span', { class: 'earnings-person-open' }, badge(accountRole(account), account.siteAdmin ? 'ok' : ''), h('span', { class: 'earnings-open-label' }, 'Open account →')),
      h('span', { class: 'earnings-person-metrics' },
        h('span', {}, h('small', {}, 'Team sales'), h('b', {}, fmtNumber(account.teamSalesThisWeek || 0))),
        h('span', {}, h('small', {}, 'Active rank this week'), h('b', {}, account.approved ? rankDisplay(activeRank) : 'Not approved')),
        h('span', {}, h('small', {}, 'Projected rank next week'), h('b', {}, account.approved ? rankDisplay(nextRank) : 'Not approved')),
        h('span', {}, h('small', {}, 'This-week income'), h('b', {}, money(income.total || 0))),
        h('span', {}, h('small', {}, 'Lower team'), h('b', {}, fmtNumber(childCount)))));
  };

  const uplineInput = h('input', { value: c.uplineToman.join(', '), dir: 'ltr', placeholder: '20000, 13000, 8000, 5000, 3000, 2000, 1000', disabled: demoMode });
  const directInput = h('input', { type: 'number', min: 0, value: c.directToman, disabled: demoMode });
  const reserveInput = h('input', { type: 'number', min: 0, value: c.reserveToman, disabled: demoMode });
  const holdInput = h('input', { type: 'number', min: 0, max: 30, value: c.holdDays, disabled: demoMode });
  const rankRows = (c.ranks || []).map(r => h('tr', {}, h('td', {}, r.name), h('td', {}, fmtNumber(r.sales)), h('td', {}, fmtNumber(r.depth))));
  const configCard = h('details', { class: 'earnings-accordion' }, h('summary', {}, 'Rules and Fibonacci rank table'),
    h('div', { class: 'earnings-accordion-body' }, h('h3', {}, 'Commission rules · version ' + c.version + ' (test ledger)'),
      h('p', { class: 'muted' }, 'A new version takes effect at the next Thursday 20:00 Tehran boundary. Rules affect future orders only. One paid subscription order creates one 100,000-toman test budget.'),
      h('div', { class: 'grid2' }, field('Fixed order budget (toman)', h('input', { value: c.budgetToman, disabled: true })), field('Direct marketer (toman)', directInput), field('Seven upline shares, comma separated (toman)', uplineInput), field('Rank reserve (toman)', reserveInput), field('Initial hold after delivery (days)', holdInput)),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Rank', 'Team sales', 'Open levels'].map(x => h('th', {}, x)))), h('tbody', {}, rankRows))),
      h('button', { class: 'btn primary', disabled: demoMode, onclick: () => run(async () => {
        const shares = uplineInput.value.split(',').map(x => Number(x.trim()));
        const out = await api('POST', '/api/admin/earnings/settings', { budgetToman: c.budgetToman, directToman: Number(directInput.value), uplineToman: shares, reserveToman: Number(reserveInput.value), holdDays: Number(holdInput.value) });
        toast('Version ' + out.config.version + ' scheduled for ' + fmtDate(out.config.effectiveAt)); show();
      }) }, 'Save a new rules version')));

  const approvalRows = accounts.map(account => {
    const approvedBox = h('input', { type: 'checkbox', disabled: demoMode }); approvedBox.checked = account.approved;
    const identityBox = h('input', { type: 'checkbox', disabled: demoMode }); identityBox.checked = account.identityVerified;
    const bankBox = h('input', { type: 'checkbox', disabled: demoMode }); bankBox.checked = account.bankVerified;
    const save = h('button', { class: 'btn small', disabled: demoMode, onclick: () => run(async () => {
      await api('PUT', '/api/admin/earnings/marketers/' + encodeURIComponent(account.id), { approved: approvedBox.checked, identityVerified: identityBox.checked, bankVerified: bankBox.checked });
      toast('Marketer status saved'); show();
    }) }, 'Save');
    return h('tr', {}, h('td', {}, h('strong', {}, account.name), h('div', { class: 'muted' }, account.email)), h('td', {}, account.inviteCode || '—'),
      h('td', {}, h('strong', {}, account.approved ? rankDisplay(account.rankThisWeek) : 'No rank'), h('div', { class: 'muted' }, fmtNumber(account.teamSalesThisWeek || 0) + ' team sales → ' + (account.approved ? rankDisplay(nextRankFor(account)) : 'No rank') + ' next week')),
      ...[[approvedBox, 'Approve'], [identityBox, 'Identity'], [bankBox, 'Bank details']].map(([input, label]) => h('td', {}, h('label', { class: 'row', style: 'margin:0;gap:6px' }, input, label))), h('td', {}, save));
  });
  const approvalCard = h('details', { class: 'earnings-accordion' }, h('summary', {}, 'Review marketer approval and payout checks'),
    h('div', { class: 'earnings-accordion-body' }, h('p', { class: 'muted' }, 'Only approved marketer accounts can hold a place in the tree or receive commissions. Identity and bank checks are separate; both are needed before a commission becomes payable.'),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Account', 'Invite code', 'Active rank → next week', 'Marketer', 'Identity', 'Bank', ''].map(x => h('th', {}, x)))), h('tbody', {}, approvalRows.length ? approvalRows : h('tr', {}, h('td', { colspan: 7, class: 'muted' }, 'No accounts yet.')))))));

  const accountSearch = h('input', { type: 'search', placeholder: 'Search all team members by name, email or invite code…', 'aria-label': 'Search all team members' });
  const peopleHost = h('div', { class: 'earnings-person-list' });
  const defaultTeam = sortPeople(children.get(null) || []);
  const renderPeople = () => {
    const query = accountSearch.value.trim().toLocaleLowerCase();
    const source = query ? approved.filter(account => [account.name, account.email, account.inviteCode].some(value => String(value || '').toLocaleLowerCase().includes(query))) : defaultTeam;
    const visible = source.slice(0, 100);
    peopleHost.replaceChildren(...(visible.length ? visible.map(memberButton) : [h('div', { class: 'earnings-empty' }, query ? 'No team members match that search.' : 'No approved marketers are directly under the company root yet. Approve an account below to add it to the tree.') ]));
  };
  accountSearch.addEventListener('input', renderPeople);
  renderPeople();

  const siteAdmins = sortPeople(accounts.filter(account => account.siteAdmin));
  const adminAccountDetails = h('details', { class: 'earnings-accordion' }, h('summary', {}, 'Website administrator accounts · ', fmtNumber(siteAdmins.length)),
    h('div', { class: 'earnings-accordion-body' }, h('p', { class: 'muted' }, 'Website access and marketer approval are separate. Only approved marketer accounts appear in the commission tree.'),
      h('div', { class: 'earnings-person-list' }, siteAdmins.length ? siteAdmins.map(memberButton) : h('div', { class: 'earnings-empty' }, 'No website administrator accounts.'))));

  const currentPeriodSales = (d.sales || []).filter(sale => sale.period && sale.period.start === d.period.start && !sale.reversedAt);
  const renderSalesTable = (saleRows, selectedId = null) => {
    const rows = saleRows.length ? saleRows.map(sale => {
      const seller = byId.get(sale.attributedMarketerId);
      const customer = byId.get(sale.customerId);
      const share = selectedId && (sale.lines || []).find(line => line.recipientId === selectedId);
      const state = sale.reversedAt ? 'Reversed' : (sale.lines || []).some(line => line.status === 'pending') ? 'In hold / pending' : 'Settled (simulated)';
      return h('tr', {}, h('td', {}, fmtDate(sale.deliveredAt)), h('td', {}, sale.orderId), h('td', {}, customer ? h('span', {}, h('strong', {}, customer.name), h('span', { class: 'muted earnings-table-sub' }, customer.email)) : '—'),
        h('td', {}, seller ? seller.name : sale.attributedMarketerId || '—'), h('td', {}, money(sale.amount || 0)),
        h('td', {}, share ? h('span', {}, money(share.amount), h('span', { class: 'muted' }, share.status === 'paid' ? ' · Paid' : ' · Pending')) : '—'), h('td', {}, badge(state, sale.reversedAt ? 'bad' : state === 'Settled (simulated)' ? 'ok' : 'warn')));
    }) : [h('tr', {}, h('td', { colspan: 7, class: 'muted' }, 'No qualifying subscription sales in this team this week.'))];
    return h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Delivered', 'Order', 'Customer', 'Sold by', 'Order budget', 'This account’s share', 'State'].map(label => h('th', {}, label)))),
      h('tbody', {}, rows)));
  };

  const saleHistoryRows = (d.sales || []).map(sale => h('tr', {}, h('td', {}, fmtDate(sale.deliveredAt)), h('td', {}, sale.orderId), h('td', {}, (byId.get(sale.attributedMarketerId) || {}).name || sale.attributedMarketerId || '—'), h('td', {}, money(sale.amount)), h('td', {}, money((sale.unallocated || []).reduce((n, line) => n + line.amount, 0))), h('td', {}, money(sale.reserve && sale.reserve.amount || 0)), h('td', {}, sale.reversedAt ? 'Reversed' : (sale.lines || []).some(line => line.status === 'pending') ? 'In hold / pending' : 'Settled (simulated)'), h('td', {}, !sale.reversedAt && sale.orderMode === 'test' ? h('button', { class: 'btn small danger', onclick: () => run(async () => {
    if (!confirm('Record a test-only refund reversal for this order? This does not refund real money or change a customer wallet.')) return;
    await api('POST', '/api/admin/earnings/orders/' + encodeURIComponent(sale.orderId) + '/refund', {});
    toast('Test commission reversal recorded'); show();
  }) }, 'Reverse test sale') : '—')));
  const salesCard = h('details', { class: 'earnings-accordion' }, h('summary', {}, 'Recent sales and test settlement'),
    h('div', { class: 'earnings-accordion-body' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h3', {}, 'Recent commission sales'), h('button', { class: 'btn primary', disabled: demoMode, onclick: () => run(async () => {
      if (!confirm('Run a test settlement? This only writes simulated commission ledger entries. It does not transfer money.')) return;
      const out = await api('POST', '/api/admin/earnings/settle', {});
      toast(out.payouts && out.payouts.length ? 'Simulated ' + out.payouts.length + ' marketer payouts' : out.message || 'No finalized commissions are payable yet'); show();
    }) }, 'Simulate weekly settlement')),
      h('p', { class: 'muted' }, 'The initial seven-day hold applies after delivery. Only verified approved marketers become payable. Every settlement here is simulated; no bank transfer is made.'),
      renderSalesTable((d.sales || []).slice(0, 100)),
      h('p', { class: 'muted' }, 'The latest 500 commission records are shown here. Order totals above are calculated from the full ledger.'),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Delivered', 'Order', 'Attributed marketer', 'Budget', 'Unallocated', 'Reserve', 'State', ''].map(x => h('th', {}, x)))), h('tbody', {}, saleHistoryRows.length ? saleHistoryRows : h('tr', {}, h('td', { colspan: 8, class: 'muted' }, 'No paid subscriptions have created commission records yet.')))))));

  const settlementRows = (d.settlements || []).map(run => h('tr', {}, h('td', {}, fmtDate(run.date)), h('td', {}, fmtNumber(run.payouts.length)), h('td', {}, money(run.payouts.reduce((n, item) => n + item.amountToman, 0))), h('td', {}, 'SIMULATED')));
  const reportRows = (d.reports || []).map(report => h('tr', {}, h('td', {}, fmtDate(report.closedPeriodStart) + ' → ' + fmtDate(report.closedPeriodEnd)), h('td', {}, fmtNumber(report.sales)), h('td', {}, money(report.budgetToman)), h('td', {}, report.settlementId ? 'Settlement started' : 'No payable commissions')));
  const historyCard = h('details', { class: 'earnings-accordion' }, h('summary', {}, 'Settlement history and weekly reports'),
    h('div', { class: 'earnings-accordion-body' }, h('h3', {}, 'Simulated settlement history'),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Date', 'Marketers', 'Total', 'Mode'].map(x => h('th', {}, x)))), h('tbody', {}, settlementRows.length ? settlementRows : h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'No simulated settlements yet.'))))),
      h('h3', { style: 'margin-top:24px' }, 'Weekly close reports'),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Closed Tehran period', 'Sales', 'Budget', 'Settlement'].map(x => h('th', {}, x)))), h('tbody', {}, reportRows.length ? reportRows : h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'The first weekly report is created at the next Thursday 20:00 close.')))))));

  const header = h('div', { class: 'earnings-heading' }, h('div', {}, h('h2', {}, 'Weekly earnings'), h('p', { class: 'muted' }, 'Current Tehran period: ' + fmtDate(d.period.start) + ' → ' + fmtDate(d.period.end) + '. The active rank comes from the previous week; this week’s team sales set next week’s rank.')),
    h('div', { class: 'earnings-heading-actions' },
      h('span', { class: 'earnings-test-pill' }, 'TEST LEDGER · NO CASH PAYMENTS'),
      h('button', { type: 'button', class: 'btn' + (demoMode ? ' primary' : ''), onclick: () => { earningsDemoPreview = !earningsDemoPreview; earningsSelectedId = null; show(); } }, demoMode ? 'Exit sample preview' : 'Preview sample team')));
  const safetyNotice = h('div', { class: 'earnings-safety' }, h('strong', {}, 'Test ledger only. '), 'Commission calculations and settlement records do not transfer money. Public payouts remain disabled.');
  const demoNotice = demoMode ? h('div', { class: 'earnings-demo-notice' }, h('strong', {}, 'DEMO PREVIEW · Fictional accounts and statistics'), ' This is a browser-only sample for reviewing the admin screens. It creates no login accounts and saves no users, sales, commissions, or payouts.') : null;

  let profile = earningsSelectedId && byId.get(earningsSelectedId);
  const body = profile ? (() => {
    const team = descendants(profile.id);
    const teamIds = new Set([profile.id, ...team.map(person => person.id)]);
    const directReports = children.get(profile.id) || [];
    const invitees = accounts.filter(person => person.invitedBy === profile.id);
    const branchSales = currentPeriodSales.filter(sale => teamIds.has(sale.attributedMarketerId));
    const weekIncome = profile.weekIncome || { pending: 0, payable: 0, paid: 0, reversed: 0, total: 0 };
    const income = profile.income || { pending: 0, payable: 0, paid: 0, reversed: 0, debt: 0 };
    const breadcrumbs = pathFor(profile.id);
    const trail = h('nav', { class: 'earnings-breadcrumbs', 'aria-label': 'Team path' },
      h('button', { type: 'button', onclick: () => { earningsSelectedId = null; show(); } }, adminIdentity && adminIdentity.rootAdmin ? 'CEO overview' : 'Team overview'),
      ...breadcrumbs.map((person, index) => [h('span', { class: 'earnings-crumb-separator', 'aria-hidden': 'true' }, '›'), index === breadcrumbs.length - 1 ? h('strong', {}, person.name) : h('button', { type: 'button', onclick: () => openAccount(person.id) }, person.name)]));
    const inviteeTable = h('details', { class: 'earnings-inline-details' }, h('summary', {}, 'Directly invited accounts · ', fmtNumber(invitees.length)),
      h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Account', 'Invite code', 'Account type'].map(label => h('th', {}, label)))),
        h('tbody', {}, invitees.length ? invitees.slice(0, 100).map(person => h('tr', {}, h('td', {}, h('strong', {}, person.name), h('div', { class: 'muted' }, person.email)), h('td', {}, person.inviteCode || '—'), h('td', {}, person.approved ? badge('Approved marketer', 'ok') : badge(person.siteAdmin ? 'Website admin' : 'Customer account')))) : h('tr', {}, h('td', { colspan: 3, class: 'muted' }, 'No accounts were directly invited by this person yet.'))))));
    return h('div', { class: 'earnings-profile' }, trail,
      h('section', { class: 'earnings-profile-card' }, h('div', { class: 'earnings-profile-top' }, h('span', { class: 'earnings-avatar large', 'aria-hidden': 'true' }, String(profile.name || '?').trim().slice(0, 1).toUpperCase()),
        h('div', { class: 'earnings-profile-identity' }, h('div', { class: 'earnings-profile-name' }, h('h3', {}, profile.name || '—'), badge(accountRole(profile), profile.siteAdmin ? 'ok' : '')), h('div', { class: 'muted' }, profile.email || '—'),
          h('div', { class: 'earnings-id-line' }, h('span', {}, 'ID: ' + profile.id), h('span', {}, 'Invite code: ' + (profile.inviteCode || '—')))),
        h('button', { class: 'btn', onclick: () => { const parentId = parentOf.get(profile.id); earningsSelectedId = parentId || null; show(); } }, 'Back to team')),
        h('div', { class: 'earnings-verification-row' }, badge(profile.approved ? 'Marketer approved' : 'Not in commission tree', profile.approved ? 'ok' : 'warn'), badge(profile.identityVerified ? 'Identity verified' : 'Identity not verified', profile.identityVerified ? 'ok' : 'warn'), badge(profile.bankVerified ? 'Bank verified' : 'Bank not verified', profile.bankVerified ? 'ok' : 'warn'))),
      h('div', { class: 'earnings-detail-grid' },
        metric('Team sales this week', fmtNumber(profile.teamSalesThisWeek || 0), 'This account plus its approved lower team'),
        metric('Direct sales this week', fmtNumber(profile.directSalesThisWeek || 0), 'Orders attributed directly to this marketer'),
        metric('Active rank this week', profile.approved ? rankName(profile.rankThisWeek) : 'No rank', String(profile.approved && profile.rankThisWeek && profile.rankThisWeek.depth || 0) + ' commission levels are open this week.'),
        metric('Projected rank next week', profile.approved ? rankName(nextRankFor(profile)) : 'No rank', 'Based on ' + (profile.teamSalesThisWeek || 0) + ' team sales; opens ' + (nextRankFor(profile) && nextRankFor(profile).depth || 0) + ' levels next week.'),
        metric('Approved lower team', fmtNumber(team.length), 'Approved marketers below this account'),
        metric('Direct invited accounts', fmtNumber(profile.directInvites || invitees.length), 'Includes customers and marketers')),
      h('section', { class: 'earnings-income-card' }, h('div', { class: 'earnings-section-title' }, h('div', {}, h('h3', {}, 'This account’s commission income'), h('p', { class: 'muted' }, 'Amounts below are ledger records in toman. “This week” means sales delivered in the current Tehran period.'))),
        h('div', { class: 'earnings-income-grid' },
          metric('Allocated from this week’s sales', money(weekIncome.total || 0), 'Direct and eligible upline shares'),
          metric('Waiting / in hold', money(income.pending || 0), 'All periods'),
          metric('Ready for simulated settlement', money(income.payable || 0), 'All periods; identity and bank must be verified'),
          metric('Previously simulated paid', money(income.paid || 0), 'All periods'),
          metric('Reversed', money(income.reversed || 0), 'Refund adjustments'),
          metric('Outstanding debt', money(income.debt || 0), 'If an earlier simulated share was reversed'))),
      h('section', { class: 'earnings-branch-card' }, h('div', { class: 'earnings-section-title' }, h('div', {}, h('h3', {}, 'Lower levels invited into this team'), h('p', { class: 'muted' }, 'Open any approved marketer to follow their own branch and sales. Customers stay visible in the invite list but do not become team marketers automatically.'))),
        directReports.length ? h('div', { class: 'earnings-person-list compact' }, directReports.map(memberButton)) : h('div', { class: 'earnings-empty' }, 'No approved marketer accounts are below this person yet.'), inviteeTable),
      h('section', { class: 'earnings-branch-card' }, h('div', { class: 'earnings-section-title' }, h('div', {}, h('h3', {}, 'Sales in this team this week'), h('p', { class: 'muted' }, 'Review who sold, which customer bought, and the share recorded for this account.'))),
        h('div', { class: 'earnings-detail-grid', style: 'margin-bottom:12px' }, metric('Qualifying orders in this branch', fmtNumber(profile.teamSalesThisWeek || 0)), metric('Branch test commission budget', money((profile.teamSalesThisWeek || 0) * c.budgetToman), 'One budget per eligible order')),
        h('p', { class: 'muted' }, 'Showing up to 100 recent orders. The summary counts include the full team total.'),
        branchSales.length ? renderSalesTable(branchSales.slice(0, 100), profile.id) : h('div', { class: 'earnings-empty' }, 'No qualifying subscription sales in this team this week.')));
  })() : (() => {
    const weekTotals = d.weekTotals || { sales: 0, budget: 0, pending: 0, paid: 0, reversed: 0 };
    const directReports = defaultTeam;
    const allIncome = approved.reduce((sum, account) => sum + (account.weekIncome && account.weekIncome.total || 0), 0);
    return h('div', { class: 'earnings-overview' },
      h('div', { class: 'earnings-executive-card' }, h('div', { class: 'earnings-company-root' }, h('span', { class: 'earnings-avatar large' }, 'C'), h('div', {}, h('strong', {}, adminIdentity && adminIdentity.rootAdmin ? 'CEO / Root admin' : 'Company team'), h('span', { class: 'muted' }, h('span', {}, 'Top of the marketer tree'), ' · ', h('strong', {}, fmtNumber(directReports.length)), ' ', h('span', {}, 'direct team members')))),
        h('div', { class: 'earnings-connect-line' }),
        h('div', { class: 'earnings-detail-grid' },
          metric('Qualifying sales this week', fmtNumber(weekTotals.sales || 0), 'Paid subscription orders in the current period'),
          metric('Approved team accounts', fmtNumber(approved.length), 'Only these accounts participate in the tree'),
          metric('Commission allocated this week', money(allIncome), 'Across approved marketer accounts'),
          metric('Available for test settlement', money(approved.reduce((sum, account) => sum + (account.income && account.income.payable || 0), 0)), 'Verified accounts only'))),
      h('section', { class: 'earnings-org-card' }, h('div', { class: 'earnings-section-title' }, h('div', {}, h('h3', {}, 'Direct teams'), h('p', { class: 'muted' }, 'Start with the people directly under the company root, or search any approved member. Select a person to inspect their income, orders and lower levels.'))),
        accountSearch, h('div', { class: 'earnings-list-caption' }, 'Direct team members'), peopleHost),
      adminAccountDetails);
  })();

  return h('div', { class: 'earnings-shell' }, header, safetyNotice, demoNotice, body, configCard, approvalCard, salesCard, historyCard);
}

async function editCode(c) {
  const isNew = !c;
  c = c || { code: '', type: 'percent', percent: 10, appliesTo: ['plans'], assignedTo: null, assignedName: '', maxUses: 0, perUser: 1, expires: '', active: true, note: '' };
  let customers = [];
  try { customers = await api('GET', '/api/admin/users'); } catch (e) { /* the list is only a convenience */ }
  const code = h('input', { value: c.code, placeholder: 'leave empty to generate one', maxlength: 24, style: 'text-transform:uppercase' });
  const gen = h('button', { class: 'btn small', type: 'button', onclick: () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code.value = Array.from({ length: 8 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } }, 'Generate');
  const percent = h('input', { type: 'number', min: 1, max: 100, value: c.percent || 10 });
  const kindBox = h('span', { class: 'muted' }, 'Subscriptions');
  const who = h('input', { value: c.assignedName && c.assignedName[0] !== '(' ? c.assignedName : '', list: 'cust-list', placeholder: 'empty = anyone; or type an email / username', dir: 'ltr' });
  const dl = h('datalist', { id: 'cust-list' }, customers.map(u => h('option', { value: u.email }, u.name + (u.username ? ' @' + u.username : ''))));
  const maxUses = h('input', { type: 'number', min: 0, value: c.maxUses || 0 });
  const perUser = h('input', { type: 'number', min: 0, value: c.perUser === undefined ? 1 : c.perUser });
  const expires = h('input', { type: 'date', value: c.expires || '' });
  const note = h('input', { value: c.note || '', maxlength: 200, placeholder: 'only you see this' });
  const active = h('input', { type: 'checkbox' }); active.checked = c.active !== false;
  const pctField = field('Percent off subscription (1-100)', percent), kindField = field('Applies to', kindBox);

  // keep the assigned customer when editing and the box is untouched
  const save = h('button', { class: 'btn primary' }, isNew ? 'Create code' : 'Save changes');
  save.onclick = () => run(async () => {
    const body = {
      code: code.value, type: 'percent', percent: percent.value, appliesTo: ['plans'], assignedTo: who.value,
      maxUses: maxUses.value, perUser: perUser.value, expires: expires.value, note: note.value, active: active.checked,
    };
    if (!isNew && c.assignedTo && !who.value) body.assignedTo = '';
    const r = isNew ? await api('POST', '/api/admin/discount-codes', body) : await api('PUT', '/api/admin/discount-codes/' + c.id, body);
    closeModal(); toast('Saved: ' + r.code); show();
  });
  $('modal').replaceChildren(
    h('h2', {}, isNew ? 'New discount / gift code' : 'Edit code ' + c.code),
    h('div', { class: 'grid2' },
      field('Code', h('div', { class: 'row', style: 'margin:0;flex-wrap:nowrap' }, code, gen)), pctField, kindField,
      field('Give it to one customer only (optional)', h('div', {}, who, dl)),
      field('Total uses allowed (0 = unlimited)', maxUses), field('Uses per customer (0 = unlimited)', perUser),
      field('Expires on (optional)', expires), field('Private note', note)),
    h('div', { class: 'row', style: 'margin-top:14px' }, h('label', {}, active, ' Code is active')),
    h('div', { class: 'row', style: 'margin-top:20px; justify-content:flex-end' }, h('button', { class: 'btn', onclick: closeModal }, 'Cancel'), save));
  $('modal-bg').style.display = 'block';
}

// ---------- legal pages + E-Namad ----------
async function renderLegal() {
  const d = await api('GET', '/api/admin/legal');
  const areas = {};
  const docCard = (doc, label, url) => {
    const x = d.docs[doc];
    const mk = lang => {
      const ta = h('textarea', { rows: 14, dir: lang === 'fa' ? 'rtl' : 'ltr', style: 'font-size:14px;line-height:1.5' });
      ta.value = x[lang] || x['default_' + lang];
      areas[doc + '_' + lang] = ta;
      const custom = () => ta.value.trim() !== x['default_' + lang].trim();
      const tag = h('span', { class: 'tag ' + (custom() ? '' : 'ok') }, custom() ? 'customised' : 'default text');
      ta.addEventListener('input', () => { tag.textContent = custom() ? 'customised' : 'default text'; tag.className = 'tag ' + (custom() ? '' : 'ok'); });
      return h('div', {}, h('div', { class: 'row', style: 'margin-bottom:6px' }, h('strong', {}, lang === 'fa' ? 'Persian (فارسی)' : 'English'), tag,
        h('button', { class: 'btn small', style: 'margin-inline-start:auto', onclick: () => { if (confirm('Replace this text with the built-in default?')) { ta.value = x['default_' + lang]; ta.dispatchEvent(new Event('input')); } } }, 'Use default text')), ta);
    };
    return h('div', { class: 'card' }, h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:6px' }, h('h3', { style: 'margin:0' }, label, x.updated ? h('span', { class: 'muted', style: 'font-size:13px;font-weight:400;margin-inline-start:10px' }, 'last updated ' + x.updated) : null), h('a', { class: 'btn small', href: url, target: '_blank' }, 'View page')),
      h('div', { class: 'grid2' }, mk('en'), mk('fa')));
  };
  const eId = h('input', { value: d.enamad.id || '', placeholder: 'e.g. 123456', dir: 'ltr', inputmode: 'numeric' });
  const eCode = h('input', { value: d.enamad.code || '', placeholder: 'e.g. aB3dE9gH1jK5mN7pQ2rS', dir: 'ltr' });
  const consent = h('input', { type: 'checkbox' }); consent.checked = d.requireConsent;
  const save = () => run(async () => {
    const body = { enamad: { id: eId.value.trim(), code: eCode.value.trim() }, requireConsent: consent.checked };
    for (const [k, ta] of Object.entries(areas)) body[k] = ta.value;
    const r = await api('PUT', '/api/admin/legal', body);
    toast(r.changed.length ? 'Saved. "Last updated" date set to today.' : 'Saved.');
    show();
  });
  return h('div', {},
    h('div', { class: 'card', style: 'border-color:#facc15' }, h('strong', { style: 'color:#facc15' }, 'These are starter texts, not legal advice. '),
      h('span', { class: 'muted' }, 'Read them, adjust them to how you really work, and have a lawyer check them for your country before relying on them. ' + 'A page shows a "last updated" date only after you edit its text.')),
    docCard('terms', 'Terms of Service', '/terms.html'), docCard('privacy', 'Privacy Policy', '/privacy.html'), docCard('refund', 'Refund Policy', '/refund.html'),
    h('div', { class: 'card' }, h('h3', {}, 'Sign-up consent'),
      h('div', { class: 'row' }, h('label', {}, consent, ' New customers must tick "I agree to the Terms of Service and the Privacy Policy" to create an account'))),
    h('div', { class: 'card' }, h('h3', {}, 'E-Namad trust badge (Iran)'),
      h('p', { class: 'muted', style: 'margin-top:0' }, 'After E-Namad (enamad.ir) approves your website they give you a small HTML snippet. Inside it you will see an address like trustseal.enamad.ir/?id=123456&Code=aB3dE9gH... Copy the number after id= and the text after Code= into the two boxes. The badge then appears in the footer of every page. Leave both empty to hide it.'),
      h('div', { class: 'grid2' }, field('E-Namad ID (the number after id=)', eId), field('E-Namad code (the text after Code=)', eCode))),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: save }, 'Save legal pages & trust settings')));
}

// ---------- customer requests (games / subtitles) ----------
async function renderRequests() {
  const all = await api('GET', '/api/admin/requests');
  const filter = h('select', {}, h('option', { value: 'open' }, 'New and in progress'), h('option', { value: 'new' }, 'New'), h('option', { value: 'working' }, 'In progress'), h('option', { value: 'done' }, 'Done'), h('option', { value: 'rejected' }, 'Rejected'), h('option', { value: '' }, 'All'));
  const box = h('div');
  const typeLabel = { game: 'New game', subtitle: 'Subtitle', other: 'Other' };
  function draw() {
    const rows = all.filter(r => !filter.value || (filter.value === 'open' ? (r.status === 'new' || r.status === 'working') : r.status === filter.value));
    box.replaceChildren(...(rows.length ? rows.map(r => {
      const st = h('select', { onchange: () => run(async () => { await api('PUT', '/api/admin/requests/' + r.id, { status: st.value }); toast('Updated'); show(); }) },
        ['new', 'working', 'done', 'rejected'].map(s => h('option', { value: s }, { new: 'New', working: 'In progress', done: 'Done', rejected: 'Rejected' }[s])));
      st.value = r.status;
      const update = h('input', { value: r.customerUpdate || '', placeholder: 'Customer-visible update', maxlength: 500, style: 'margin-top:8px' });
      update.addEventListener('change', () => run(async () => { await api('PUT', '/api/admin/requests/' + r.id, { customerUpdate: update.value }); toast('Customer update saved'); }));
      const note = h('input', { value: r.note || '', placeholder: 'private note', maxlength: 500, style: 'margin-top:8px' });
      note.addEventListener('change', () => run(async () => { await api('PUT', '/api/admin/requests/' + r.id, { note: note.value }); toast('Note saved'); }));
      const autoAddLabel = {
        queued: 'Automatic add queued', processing: 'Automatic add running', added: 'Added to website',
        'already-present': 'Already on website', 'needs-review': 'Needs Quick Add review',
      }[r.autoAddStatus];
      const autoAddStatus = autoAddLabel ? h('div', { class: 'row', style: 'margin-top:10px;gap:8px' },
        h('span', { class: 'tag ' + (r.autoAddStatus === 'added' || r.autoAddStatus === 'already-present' ? 'ok' : r.autoAddStatus === 'needs-review' ? 'warn' : '') }, autoAddLabel),
        r.autoAddMessage ? h('span', { class: 'muted' }, r.autoAddMessage) : null,
        ...(r.autoAddSuggestions || []).map(title => h('span', { class: 'tag' }, title)),
        ...(r.autoAddWarnings || []).map(warning => h('span', { class: 'muted' }, warning))) : null;
      const quickAdd = r.type === 'game' ? h('button', { class: 'btn small primary', onclick: () => {
        currentTab = 'games';
        show().then(() => openGameEditor(r.slug || null, r.game || ''));
      } }, 'Open Quick Add') : null;
      return h('div', { class: 'msg' + (r.status === 'new' ? ' unread' : '') },
        h('div', {}, h('span', { class: 'tag ' + (r.type === 'subtitle' ? 'warn' : '') }, typeLabel[r.type]), ' ', h('strong', {}, r.game || '(no game named)'),
          r.count > 1 ? h('span', { class: 'tag ok', style: 'margin-inline-start:8px' }, r.count + ' people asked') : null,
          r.slug ? h('a', { href: '/game.html?slug=' + encodeURIComponent(r.slug), target: '_blank', style: 'margin-inline-start:10px;font-size:13px' }, 'open the game page') : null),
        r.details ? h('p', {}, r.details) : null,
        h('div', { class: 'muted' }, 'Asked ' + fmtDate(r.created) + ' by: ' + r.requesters.slice(0, 5).map(q => (q.name ? q.name + ' - ' : '') + q.contact).join(' ; ') + (r.requesters.length > 5 ? ' ; +' + (r.requesters.length - 5) + ' more' : '')),
        autoAddStatus,
        h('div', { class: 'row', style: 'margin:10px 0 0' }, st, quickAdd, h('button', { class: 'btn small danger', style: 'margin-inline-start:auto', onclick: () => { if (confirm('Delete this request?')) run(async () => { await api('DELETE', '/api/admin/requests/' + r.id); show(); }); } }, 'Delete')), update, note);
    }) : [h('p', { class: 'muted' }, 'Nothing here.')]));
  }
  filter.addEventListener('input', draw);
  draw();
  return h('div', {}, h('p', { class: 'muted', style: 'margin-top:0' }, 'Requests from the "Request a game / subtitle" page and the button on every game page. When several people ask for the same thing they are grouped, so the most wanted ones are listed first.'), h('div', { class: 'row' }, filter), box);
}

// ---------- Telegram announcements ----------
async function renderTelegram() {
  const d = await api('GET', '/api/admin/telegram');
  const s = d.settings;
  const chk = (label, key) => { const i = h('input', { type: 'checkbox' }); i.checked = !!s[key]; i.addEventListener('change', () => { s[key] = i.checked; }); return h('label', { class: 'row', style: 'gap:8px' }, i, label); };
  const lang = h('select', {}, h('option', { value: 'both' }, 'English + Persian'), h('option', { value: 'en' }, 'English only'), h('option', { value: 'fa' }, 'Persian only'));
  lang.value = s.lang;
  const url = h('input', { value: s.siteUrl || '', placeholder: 'https://your-site.com (used for the link in the post)', dir: 'ltr' });
  const tEn = h('textarea', { rows: 4, dir: 'ltr' }, s.templateEn || d.defaults.en);
  const tFa = h('textarea', { rows: 4 }, s.templateFa || d.defaults.fa);
  const state = d.live ? h('span', { class: 'tag ok' }, 'Connected: messages are sent to your channel')
    : h('span', { class: 'tag warn' }, 'Not connected yet: ' + (!d.hasToken ? 'TELEGRAM_BOT_TOKEN ' : '') + (!d.hasChat ? 'TELEGRAM_CHAT_ID ' : '') + 'missing in .env. Messages are only saved below.');
  return h('div', {},
    h('p', { class: 'muted', style: 'margin-top:0' }, 'Posts to your Telegram channel when you add a game or upload files. Several files uploaded for one game within about 15 seconds become one post.'),
    h('div', { class: 'row' }, state),
    h('div', { class: 'card-box' },
      chk('Announcements on', 'enabled'), chk('Announce new games', 'onGame'), chk('Announce new files', 'onFile'),
      h('label', {}, 'Language', lang), h('label', {}, 'Site address', url),
      h('label', {}, 'English text  (use {game} {files} {link})', tEn),
      h('label', {}, 'Persian text', tFa),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => run(async () => { await api('PUT', '/api/admin/telegram', { enabled: s.enabled, onGame: s.onGame, onFile: s.onFile, lang: lang.value, siteUrl: url.value, templateEn: tEn.value, templateFa: tFa.value }); toast('Saved'); }) }, 'Save'),
        h('button', { class: 'btn', onclick: () => run(async () => { const r = await api('POST', '/api/admin/telegram/test', {}); toast(r.sent ? 'Test message sent' : (r.error || 'Not sent (see the list below)')); show(); }) }, 'Send test message'))),
    h('h3', {}, 'Latest messages'),
    h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => run(async () => { await api('DELETE', '/api/admin/telegram/outbox'); show(); }) }, 'Clear list')),
    ...(d.outbox.length ? d.outbox.map(m => h('div', { class: 'msg' }, h('div', { class: 'muted' }, fmtDate(m.at) + ' - ' + (m.sent ? 'sent' : 'NOT sent' + (m.error ? ': ' + m.error : m.reason ? ': ' + m.reason : ''))), h('pre', { style: 'white-space:pre-wrap;margin:6px 0 0' }, m.text))) : [h('p', { class: 'muted' }, 'Nothing yet.')]));
}

// ---------- reports ----------
const REASON_LABEL = { unrelated: 'Unrelated content', age: 'Over-age / inappropriate screenshot', broken: 'Broken file or download', wrong: 'Wrong game information', other: 'Something else' };
async function renderReports() {
  const list = await api('GET', '/api/admin/reports');
  if (!list.length) return h('p', { class: 'muted' }, 'No reports yet. Reports sent with the Report button on game pages appear here.');
  const filter = h('select', {}, h('option', { value: 'open' }, 'Open'), h('option', { value: 'resolved' }, 'Resolved'), h('option', { value: '' }, 'All'));
  const box = h('div');
  function draw() {
    const rows = list.filter(r => !filter.value || r.status === filter.value);
    box.replaceChildren(...(rows.length ? rows.map(r => h('div', { class: 'msg' + (r.status === 'open' ? ' unread' : '') },
      h('div', {}, h('strong', {}, r.game), ' ', h('span', { class: 'tag ' + (r.reason === 'age' ? 'bad' : 'warn') }, REASON_LABEL[r.reason] || r.reason), ' ',
        h('span', { class: 'tag ' + (r.status === 'open' ? 'bad' : 'ok') }, r.status)),
      h('div', { class: 'muted' }, fmtDate(r.date), r.email ? '  ·  ' + r.email : ''),
      r.details ? h('p', {}, r.details) : h('p', { class: 'muted' }, '(no details)'),
      h('a', { class: 'btn small', href: '/game.html?slug=' + encodeURIComponent(r.slug), target: '_blank' }, 'View game'), ' ',
      h('button', { class: 'btn small', onclick: () => run(async () => { await api('PUT', '/api/admin/reports/' + r.id, { status: r.status === 'open' ? 'resolved' : 'open' }); show(); }) }, r.status === 'open' ? 'Mark resolved' : 'Reopen'), ' ',
      h('button', { class: 'btn small', onclick: () => { currentTab = 'games'; show().then(() => openGameEditor(r.slug)); } }, 'Edit game'), ' ',
      h('button', { class: 'btn small danger', onclick: () => { if (confirm('Delete this report?')) run(async () => { await api('DELETE', '/api/admin/reports/' + r.id); show(); }); } }, 'Delete')))
      : [h('p', { class: 'muted' }, 'Nothing here.')]));
  }
  filter.addEventListener('input', draw);
  draw();
  return h('div', {}, h('div', { class: 'row' }, filter), box);
}

// ---------- messages ----------
async function renderMessages() {
  const [list, ideas] = await Promise.all([api('GET', '/api/admin/messages'), api('GET', '/api/admin/feedback').catch(() => [])]);
  if (!list.length && !ideas.length) return h('p', { class: 'muted' }, 'No messages yet. Messages sent from the Contact Us page appear here.');
  const messageNodes = list.map(m => h('div', { class: 'msg' + (m.read ? '' : ' unread') },
    h('strong', {}, m.subject ? m.subject + ' · ' + m.name : m.name), ' ', m.email ? h('span', { class: 'muted' }, '<' + m.email + '>') : null,
    h('div', { class: 'muted' }, fmtDate(m.date) + (m.source === 'profile-support' ? ' · Profile support' : '')),
    h('p', {}, m.message),
    h('button', { class: 'btn small', onclick: () => run(async () => { await api('PUT', '/api/admin/messages/' + m.id, { read: !m.read }); show(); }) }, m.read ? 'Mark unread' : 'Mark read'), ' ',
    h('button', { class: 'btn small danger', onclick: () => { if (confirm('Delete this message?')) run(async () => { await api('DELETE', '/api/admin/messages/' + m.id); show(); }); } }, 'Delete')));
  const ideaNodes = ideas.map(row => h('div', { class: 'msg' + (row.status === 'new' ? ' unread' : '') },
    h('strong', {}, 'Idea / proposal · ' + row.name), ' ', row.email ? h('span', { class: 'muted' }, '<' + row.email + '>') : null,
    h('div', { class: 'muted' }, fmtDate(row.date) + ' · ' + (row.category || 'idea')),
    h('p', {}, row.message),
    h('select', { class: 'field', value: row.status || 'new', onchange: event => run(async () => { await api('PUT', '/api/admin/feedback/' + row.id, { status: event.target.value }); show(); }) },
      ['new', 'reviewing', 'planned', 'closed'].map(status => h('option', { value: status }, status))),
  ));
  return h('div', {}, ideas.length ? [h('h3', {}, 'Ideas and proposals'), ...ideaNodes] : null, list.length ? [h('h3', {}, 'Support and contact messages'), ...messageNodes] : null);
}

start();
