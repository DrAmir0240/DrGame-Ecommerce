/* Branch Ledger: offline-first referral and subscription manager. */
const STORAGE_KEY = "branch-ledger.data.v1";
const DEMO_STORAGE_KEY = "branch-ledger.demo-data.v1";
const ACCESS_KEY = "branch-ledger.accounts.v1";
const defaultSettings = {
  shopRate: 79,
  referralRate: 21,
  welcomeRate: 5,
  reserveRate: 50,
  currencyPrecision: 0,
  currencyLabel: "",
  subscriptionMonths: 1,
  plans: [
    { id: "bronze", name: "Bronze", price: 700000 },
    { id: "silver", name: "Silver", price: 1500000 },
    { id: "gold", name: "Gold", price: 3000000 }
  ]
};
const LANGUAGE_KEY = "branch-ledger.language.v1";
const API_PREF_KEY = "branch-ledger.website-api.v1";
let uiLanguage = localStorage.getItem(LANGUAGE_KEY) === "fa" ? "fa" : "en";
let apiConnection = loadApiConnection();
let apiDashboardData = null;
let apiConnectionError = "";
let apiLoading = false;
const originalTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const faDictionary = {
  "ACCOUNT ACCESS": "ورود به حساب",
  "Sign in to your account": "وارد حساب خود شوید",
  "Each user signs in to their own panel and activity history.": "هر کاربر به پنل و سابقه فعالیت اختصاصی خود وارد می‌شود.",
  "Username": "نام کاربری",
  "Password": "گذرواژه",
  "Sign in": "ورود",
  "First-time setup": "راه‌اندازی نخستین",
  "Create the owner account before adding member logins.": "پیش از ساخت حساب کاربران، حساب مالک را ایجاد کنید.",
  "Owner username": "نام کاربری مالک",
  "Create password": "ساخت گذرواژه",
  "Confirm password": "تأیید گذرواژه",
  "Create owner account": "ساخت حساب مالک",
  "Accounts are managed by the shop owner.": "حساب‌ها توسط مالک فروشگاه مدیریت می‌شوند.",
  "Sign out": "خروج از حساب",
  "Account access": "دسترسی حساب",
  "Sign-in status": "وضعیت ورود",
  "Sign-in enabled": "ورود فعال است",
  "Not set up": "راه‌اندازی نشده",
  "Manage member sign-in": "مدیریت ورود کاربران",
  "Select a user, choose a username, and set a password. Share the credentials directly with that person.": "کاربر را انتخاب کنید، نام کاربری تعیین کنید و گذرواژه بسازید. اطلاعات ورود را مستقیم با همان شخص به اشتراک بگذارید.",
  "User account": "حساب کاربری",
  "New or reset password": "گذرواژه جدید یا جایگزین",
  "Save login": "ذخیره اطلاعات ورود",
  "Disable login": "غیرفعال‌کردن ورود",
  "Local-only sign-in": "ورود محلی",
  "This prototype keeps workspace records in this browser. Use server-side authentication and per-user data authorization before exposing accounts on a network or public website.": "این نمونه، اطلاعات فضای کاری را در همین مرورگر نگه می‌دارد. پیش از ارائه حساب‌ها در شبکه یا وب‌سایت عمومی، احراز هویت سمت سرور و مجوز دسترسی جداگانه برای هر کاربر را پیاده‌سازی کنید.",
  "Login saved for ": "اطلاعات ورود برای ",
  "Login disabled for ": "ورود غیرفعال شد برای ",
  "Enter a username and a password of at least 10 characters.": "نام کاربری و گذرواژه‌ای با دست‌کم ۱۰ نویسه وارد کنید.",
  "Usernames must use 3–40 letters, numbers, dots, underscores, or hyphens.": "نام کاربری باید ۳ تا ۴۰ حرف، عدد، نقطه، زیرخط یا خط تیره داشته باشد.",
  "That username is already assigned to another account.": "این نام کاربری به حساب دیگری اختصاص یافته است.",
  "The account could not be found. Refresh the page and try again.": "حساب پیدا نشد. صفحه را تازه‌سازی و دوباره تلاش کنید.",
  "The owner login cannot be disabled here.": "ورود مالک را نمی‌توان از این بخش غیرفعال کرد.",
  "The username or password is incorrect.": "نام کاربری یا گذرواژه نادرست است.",
  "Passwords do not match.": "گذرواژه‌ها با هم مطابقت ندارند.",
  "Your browser does not support password hashing required for sign-in.": "مرورگر شما از رمزنگاری گذرواژه موردنیاز برای ورود پشتیبانی نمی‌کند.",
  "This account has been disabled.": "این حساب غیرفعال شده است.",
  "Try the demo": "نسخه نمایشی را امتحان کنید",
  "Member: ": "کاربر: ",
  "Admin: ": "مدیر: ",
  "Demo accounts use sample data only.": "حساب‌های نمایشی فقط از داده نمونه استفاده می‌کنند.",
  "The built-in demo login cannot be changed here.": "ورود نمایشی پیش‌فرض را نمی‌توان از این بخش تغییر داد.",
  "Set up owner login": "راه‌اندازی ورود مالک",
  "Back to sign in": "بازگشت به ورود",
  "Create your owner account": "حساب مالک خود را ایجاد کنید",
  "Set up a private login for your real workspace.": "برای فضای کاری واقعی خود یک ورود خصوصی ایجاد کنید.",
  "Built-in demo credentials are public. Do not use them for real customer or financial records.": "اطلاعات ورود نمایشی عمومی است. از آن برای اطلاعات واقعی مشتریان یا امور مالی استفاده نکنید.",
  "The owner can preview member panels here. Members who sign in see only their own account panel.": "مالک می‌تواند پنل کاربران را پیش‌نمایش کند. کاربران پس از ورود فقط پنل حساب خود را می‌بینند.",
  "Member account unavailable": "حساب کاربر در دسترس نیست",
  "Ask the shop owner to check this account.": "از مالک فروشگاه بخواهید این حساب را بررسی کند.",
  "Branch Ledger — Referral & subscription manager": "دفتر شاخه‌ای — مدیریت ارجاع و اشتراک",
  "Subscription operations": "مدیریت اشتراک‌ها",
  "WORKSPACE": "فضای کاری",
  "Main navigation": "ناوبری اصلی",
  "Branch Ledger home": "صفحه اصلی دفتر شاخه‌ای",
  "e.g. Sam Lee": "مثلاً: سارا رضایی",
  "Unknown level": "سطح نامشخص",
  "Overview": "نمای کلی",
  "Website API": "رابط برنامه‌نویسی وب‌سایت",
  "Website sales integration": "اتصال فروش وب‌سایت",
  "Connect the shop website to send paid sales and view live reporting.": "وب‌سایت فروشگاه را متصل کنید تا فروش‌های پرداخت‌شده را ارسال و گزارش زنده را مشاهده کنید.",
  "API base URL": "نشانی پایه API",
  "Read-only API key": "کلید فقط‌خواندنی API",
  "Connect and load reports": "اتصال و دریافت گزارش‌ها",
  "Refresh website data": "به‌روزرسانی اطلاعات وب‌سایت",
  "Connected to website API": "به API وب‌سایت متصل شد",
  "Not connected": "متصل نیست",
  "Enter the read-only key from the API server’s .env file. The website must use the separate write key on its server.": "کلید فقط‌خواندنی را از فایل env. سرور API وارد کنید. وب‌سایت باید کلید نوشتن جداگانه را فقط در سرور خود استفاده کند.",
  "API server": "سرور API",
  "Website integration guide": "راهنمای اتصال وب‌سایت",
  "Send each user before their first sale, then post each confirmed payment once.": "هر کاربر را پیش از اولین فروش ارسال کنید و سپس هر پرداخت تأییدشده را یک‌بار ثبت کنید.",
  "Paid website sales": "فروش‌های پرداخت‌شده وب‌سایت",
  "Website paid revenue": "درآمد پرداخت‌شده وب‌سایت",
  "Commissions paid to active users": "پورسانت پرداخت‌شده به کاربران فعال",
  "Save Box balance": "موجودی صندوق ذخیره",
  "Shop allocation": "سهم فروشگاه",
  "CEO / Shop Owner Pocket balance": "موجودی حساب مدیرعامل / مالک فروشگاه",
  "Shop allocations, routed commissions, and CEO residual": "سهم فروشگاه، پورسانت‌های منتقل‌شده و سهم باقی‌مانده مدیرعامل",
  "Sales by subscription plan": "فروش بر اساس طرح اشتراک",
  "Top commission earners": "بیشترین دریافت‌کنندگان پورسانت",
  "Recent website sales": "فروش‌های اخیر وب‌سایت",
  "Referral network from website": "شبکه ارجاع وب‌سایت",
  "No website data yet": "هنوز اطلاعاتی از وب‌سایت نیست",
  "No website sales have been sent to the API.": "هنوز فروشی از وب‌سایت به API ارسال نشده است.",
  "No commission entries yet.": "هنوز پورسانتی ثبت نشده است.",
  "No users have been synced yet.": "هنوز کاربری همگام‌سازی نشده است.",
  "User / buyer": "کاربر / خریدار",
  "Paid amount": "مبلغ پرداختی",
  "Commission earned": "پورسانت دریافتی",
  "Sales": "فروش‌ها",
  "Paid revenue": "درآمد پرداخت‌شده",
  "Active subscription": "اشتراک فعال",
  "Inactive": "غیرفعال",
  "Website API not connected": "API وب‌سایت متصل نیست",
  "Check the API URL, read-only key, and allowed website origin.": "نشانی API، کلید فقط‌خواندنی و مبدأ مجاز وب‌سایت را بررسی کنید.",
  "Open API integration guide": "باز کردن راهنمای اتصال API",
  "Loading…": "در حال بارگذاری…",
  "Updated": "به‌روزرسانی",
  "Website stats, tree, commissions, recent sales": "آمار وب‌سایت، درخت ارجاع، پورسانت‌ها و فروش‌های اخیر",
  "Full referral hierarchy and user metrics": "ساختار کامل ارجاع و شاخص‌های کاربران",
  "Commission totals and entries by user": "مجموع پورسانت‌ها و ثبت‌های هر کاربر",
  "Create a website employee or customer": "ایجاد کارمند یا مشتری وب‌سایت",
  "Record a confirmed subscription payment": "ثبت پرداخت تأییدشده اشتراک",
  "Reverse a refunded website sale": "برگشت فروش بازپرداخت‌شده وب‌سایت",
  "Read commission, discount, and plan settings": "مشاهده تنظیمات پورسانت، تخفیف و طرح‌ها",
  "Update settings for future sales": "به‌روزرسانی تنظیمات فروش‌های آینده",
  "This workspace stores manual records in this browser. Website-synced records are stored separately by the API server.": "ثبت‌های دستی این فضا در این مرورگر نگهداری می‌شوند. ثبت‌های همگام‌سازی‌شده وب‌سایت به‌صورت جداگانه روی سرور API ذخیره می‌شوند.",
  "This JSON backup includes local workspace records only. Website API data is stored on the API server.": "این نسخه پشتیبان JSON فقط شامل اطلاعات محلی فضای کاری است. اطلاعات API وب‌سایت روی سرور API ذخیره می‌شود.",
  "How it works": "راهنمای سیستم",
  "Sales": "فروش‌ها",
  "Users": "کاربران",
  "Member panel": "پنل کاربر",
  "Full network tree": "درخت کامل شبکه",
  "View panel": "مشاهده پنل",
  "One user’s private member report; website server only": "گزارش خصوصی یک کاربر؛ فقط سرور وب‌سایت",
  "Referral tree": "درخت ارجاع",
  "A box-and-line chart of every account in this workspace, starting at the CEO / Shop Owner. Members have a separate chart limited to their own lower-level referrals.": "نمودار جعبه‌ای و خطی همه حساب‌های این فضای کاری که از مدیرعامل / مالک فروشگاه آغاز می‌شود. هر کاربر نمودار جداگانه‌ای دارد که فقط سطوح پایین‌تر خودش را نشان می‌دهد.",
  "Everyone in the actual network": "همه افراد در شبکه واقعی",
  "Each box is one account; each line shows a direct inviter. Scroll horizontally to follow deep branches.": "هر جعبه نشان‌دهنده یک حساب است و هر خط معرف مستقیم را نشان می‌دهد. برای دنبال‌کردن شاخه‌های عمیق، افقی پیمایش کنید.",
  "Accounts outside the CEO tree": "حساب‌های خارج از درخت مدیرعامل",
  "These accounts have no valid path to the CEO root. They are included here so every user remains visible.": "این حساب‌ها مسیر معتبری به ریشه مدیرعامل ندارند. برای نمایش همه کاربران، آن‌ها نیز در این بخش آمده‌اند.",
  "Not connected to the CEO tree": "متصل به درخت مدیرعامل نیست",
  "Save Box": "صندوق ذخیره",
  "Ledger": "دفتر کل",
  "Settings": "تنظیمات",
  "Workspace": "فضای کاری",
  "Export backup": "خروجی پشتیبان",
  "Record sale": "ثبت فروش",
  "Record a sale": "ثبت فروش",
  "A clear record for every sale.": "ثبت شفاف برای هر فروش.",
  "Saved in this browser": "در این مرورگر ذخیره شده",
  "Open navigation": "باز کردن منو",
  "Switch application language": "تغییر زبان برنامه",
  "No sales recorded yet": "هنوز فروشی ثبت نشده است",
  "Record a paid subscription to see allocations and start the Save Box.": "برای مشاهده تخصیص‌ها و راه‌اندازی صندوق ذخیره، یک اشتراک پرداخت‌شده ثبت کنید.",
  "Plan": "طرح",
  "Status": "وضعیت",
  "Paid": "پرداخت‌شده",
  "Date": "تاریخ",
  "Buyer": "خریدار",
  "Discount": "تخفیف",
  "Amount paid": "مبلغ پرداخت‌شده",
  "Actions": "عملیات",
  "Overview": "نمای کلی",
  "See what each paid subscription funds, who earned a commission, and how much the Save Box can support.": "ببینید هر اشتراک پرداخت‌شده چگونه تخصیص می‌یابد، چه کسانی پورسانت گرفته‌اند و صندوق ذخیره چه مقدار تخفیف را پشتیبانی می‌کند.",
  "CEO / Shop Owner Pocket": "حساب مدیرعامل / مالک فروشگاه",
  "Includes shop allocations before fees, taxes, or overhead; this is not net profit. Expired-upline shares are credited here.": "این مبلغ شامل سهم فروشگاه پیش از کارمزد، مالیات و هزینه‌های جاری است و سود خالص محسوب نمی‌شود. سهم بالادستی‌های منقضی‌شده نیز به این حساب واریز می‌شود.",
  "Paid sales": "فروش‌های پرداخت‌شده",
  "Active-user commissions": "پورسانت کاربران فعال",
  "Discount reserve": "ذخیره تخفیف",
  "Separate from the CEO / Shop Owner Pocket": "جدا از حساب مدیرعامل / مالک فروشگاه",
  "Spendable now": "مبلغ قابل‌استفاده اکنون",
  "Paid subscriptions": "اشتراک‌های پرداخت‌شده",
  "Confirmed purchases only": "فقط خریدهای تأییدشده",
  "Active subscriptions": "اشتراک‌های فعال",
  "Eligible to earn referral commissions": "واجد شرایط دریافت پورسانت ارجاع",
  "Welcome discounts used": "تخفیف‌های خوش‌آمدگویی استفاده‌شده",
  "Debited from the Save Box": "کسرشده از صندوق ذخیره",
  "Recent sales": "فروش‌های اخیر",
  "Every allocation is based on the amount actually paid.": "همه تخصیص‌ها بر اساس مبلغی است که واقعاً پرداخت شده است.",
  "All sales": "همه فروش‌ها",
  "Choose a user": "یک کاربر انتخاب کنید",
  "Customer": "مشتری",
  "Employee": "کارمند",
  "CEO / Shop Owner": "مدیرعامل / مالک فروشگاه",
  "No inviter (shop sale)": "بدون معرف (فروش فروشگاه)",
  "No inviter": "بدون معرف",
  "Level": "سطح",
  "levels": "سطح",
  "level": "سطح",
  "Root": "ریشه",
  "Active": "فعال",
  "Expired": "منقضی‌شده",
  "No subscription": "بدون اشتراک",
  "Paid": "پرداخت‌شده",
  "Pending": "در انتظار",
  "Refunded": "بازپرداخت‌شده",
  "No sales yet": "هنوز فروشی ثبت نشده است",
  "Add an employee or customer user first, then record their subscription here.": "ابتدا یک کاربر از نوع کارمند یا مشتری اضافه کنید و سپس اشتراک او را اینجا ثبت کنید.",
  "Add a user": "افزودن کاربر",
  "Record user subscriptions and preview the exact split before a purchase is posted.": "اشتراک کاربران را ثبت کنید و پیش از نهایی‌کردن خرید، تقسیم دقیق مبلغ را ببینید.",
  "Record or renew a subscription": "ثبت یا تمدید اشتراک",
  "Subscription plan": "طرح اشتراک",
  "Use the welcome discount": "استفاده از تخفیف خوش‌آمدگویی",
  "Payment status": "وضعیت پرداخت",
  "Paid — post allocations now": "پرداخت‌شده — تخصیص‌ها اکنون ثبت شوند",
  "Pending — post later": "در انتظار — بعداً ثبت شود",
  "Save subscription": "ثبت اشتراک",
  "Clear": "پاک‌کردن",
  "Live allocation preview": "پیش‌نمایش زنده تخصیص‌ها",
  "Uses the selected plan, buyer, current settings, and available Save Box balance.": "بر اساس طرح انتخاب‌شده، خریدار، تنظیمات فعلی و موجودی صندوق ذخیره محاسبه می‌شود.",
  "Subscription history": "سوابق اشتراک",
  "Pending purchases have no posted allocations.": "برای خریدهای در انتظار هنوز تخصیصی ثبت نشده است.",
  "Sales dashboard": "داشبورد فروش",
  "Paid subscriptions only; refunded sales are excluded from these totals.": "فقط اشتراک‌های پرداخت‌شده؛ فروش‌های بازپرداخت‌شده در این جمع‌ها محاسبه نمی‌شوند.",
  "By plan": "بر اساس طرح",
  "Paid revenue for each subscription plan.": "درآمد پرداخت‌شده هر طرح اشتراک.",
  "By buyer level": "بر اساس سطح خریدار",
  "The buyer’s depth in the referral tree.": "عمق خریدار در درخت ارجاع.",
  "By paid date": "بر اساس تاریخ پرداخت",
  "Daily paid subscription totals.": "جمع روزانه اشتراک‌های پرداخت‌شده.",
  "No paid sales yet.": "هنوز فروش پرداخت‌شده‌ای ثبت نشده است.",
  "Users": "کاربران",
  "Manage user accounts. Every user is an Employee or Customer; the CEO is the separate shop owner and referral-tree root. Account creation does not pay commissions; only paid subscription sales do.": "مدیریت کاربران. هر کاربر کارمند یا مشتری است و مدیرعامل مالک فروشگاه و ریشه جداگانه درخت ارجاع است. ایجاد حساب پورسانتی ندارد؛ فقط فروش اشتراکِ پرداخت‌شده پورسانت ایجاد می‌کند.",
  "Choose the user type, then link them to their direct inviter. Referral levels are calculated automatically.": "نوع کاربر را انتخاب کنید و معرف مستقیم او را مشخص کنید. سطح ارجاع به‌صورت خودکار محاسبه می‌شود.",
  "User": "کاربر",
  "User type": "نوع کاربر",
  "Subscription": "اشتراک",
  "Invited by": "معرف",
  "Direct referrals": "معرفی‌های مستقیم",
  "Edit": "ویرایش",
  "Edit user": "ویرایش کاربر",
  "Add user": "افزودن کاربر",
  "Name": "نام",
  "Direct inviter": "معرف مستقیم",
  "Save changes": "ذخیره تغییرات",
  "Cancel": "لغو",
  "Users in the network": "کاربران شبکه",
  "No users added": "هنوز کاربری اضافه نشده است",
  "Add an employee or customer user, then link them to the person who invited them.": "یک کارمند یا مشتری اضافه کنید و او را به معرفش متصل کنید.",
  "A user earns from lower-level sales only while their own subscription is active; an expired user’s share goes to the CEO and is not paid back after renewal.": "کاربر فقط تا زمانی از فروش سطوح پایین‌تر پورسانت می‌گیرد که اشتراک خودش فعال باشد. سهم کاربر منقضی‌شده به مدیرعامل می‌رسد و پس از تمدید به او بازگردانده نمی‌شود.",
  "Referral levels are calculated automatically from the inviter chain.": "سطوح ارجاع بر اساس زنجیره معرف‌ها به‌صورت خودکار محاسبه می‌شوند.",
  "Referral tree": "درخت ارجاع",
  "Follow the actual inviter chain at any depth. Only users with an active subscription can earn from lower-level sales; expired shares go to the CEO.": "زنجیره واقعی معرف‌ها را در هر عمقی دنبال کنید. فقط کاربران دارای اشتراک فعال از فروش سطوح پایین‌تر پورسانت می‌گیرند؛ سهم منقضی‌شده‌ها به مدیرعامل می‌رسد.",
  "Shop network": "شبکه فروشگاه",
  "The level shown is calculated from the CEO / Shop Owner root. Scroll horizontally for very deep branches.": "سطح‌ها از ریشه مدیرعامل / مالک فروشگاه محاسبه می‌شوند. برای شاخه‌های عمیق به‌صورت افقی پیمایش کنید.",
  "Users without an inviter": "کاربران بدون معرف",
  "These sales have no upline commission chain.": "این فروش‌ها زنجیره پورسانت بالادستی ندارند.",
  " referral": " معرفی",
  " referrals": " معرفی",
  " users": " کاربر",
  "Save Box": "صندوق ذخیره",
  "A separate discount reserve funded by half of the referral pool left at the CEO row.": "ذخیره‌ای جداگانه برای تخفیف که از نصف صندوق پورسانت باقی‌مانده در ردیف مدیرعامل تأمین می‌شود.",
  "Current balance": "موجودی فعلی",
  "Before any pending sales": "پیش از فروش‌های در انتظار",
  "Protected reserve": "ذخیره محافظت‌شده",
  "Spendable for discounts": "قابل‌استفاده برای تخفیف",
  "Available without using the reserve": "موجودی قابل‌استفاده بدون برداشت از ذخیره",
  "Welcome discount availability": "وضعیت تخفیف خوش‌آمدگویی",
  "A first-purchase discount is available only when the cleared balance covers the discount and preserves the configured reserve. With the default 50% reserve, that means at least twice the discount amount.": "تخفیف خرید اول فقط زمانی در دسترس است که موجودی قطعی، مبلغ تخفیف را پوشش دهد و ذخیره تعیین‌شده دست‌نخورده بماند. با ذخیره پیش‌فرض ۵۰٪، موجودی باید دست‌کم دو برابر مبلغ تخفیف باشد.",
  "Price": "قیمت",
  "Balance needed": "موجودی موردنیاز",
  "Available": "در دسترس",
  "Unavailable": "در دسترس نیست",
  "Needs ": "نیاز به ",
  "Save Box activity": "گردش صندوق ذخیره",
  "Total contributions": "مجموع واریزی‌ها",
  "Total welcome discounts issued": "مجموع تخفیف‌های خوش‌آمدگویی صادرشده",
  "Campaign discount budget remaining": "بودجه باقی‌مانده تخفیف کمپین",
  "Funding rule": "قاعده تأمین موجودی",
  "Mixed campaign budget: ": "بودجه ترکیبی کمپین: ",
  " discounts": " تخفیف",
  " remaining. Each paid discount reduces this budget; actual Save Box contributions are calculated from the referral pool left after upline shares. Discount eligibility is checked before the new sale contributes to the Box.": " باقی مانده است. هر تخفیف پرداخت‌شده این بودجه را کاهش می‌دهد؛ واریزی واقعی صندوق ذخیره بر اساس مانده صندوق پورسانت پس از سهم کاربران بالادستی محاسبه می‌شود. واجدشرایط‌بودن تخفیف پیش از واریز فروش جدید بررسی می‌شود.",
  "Discount history": "سوابق تخفیف‌ها",
  "Every redeemed welcome discount stays visible, including refunded subscriptions.": "همه تخفیف‌های استفاده‌شده، حتی برای اشتراک‌های بازپرداخت‌شده، در اینجا نمایش داده می‌شوند.",
  "No welcome discounts have been redeemed.": "هنوز تخفیف خوش‌آمدگویی استفاده نشده است.",
  "Recent Save Box ledger": "آخرین گردش‌های صندوق ذخیره",
  "Deposits, discount spending, and refund adjustments.": "واریزی‌ها، هزینه تخفیف‌ها و اصلاحات بازپرداخت.",
  "Open full ledger": "مشاهده دفتر کل",
  "CEO / Shop Owner Pocket": "حساب مدیرعامل / مالک فروشگاه",
  "Recovery due": "بدهی بازیابی",
  "Admin adjustment": "اصلاح مدیر",
  "Referral commission": "پورسانت ارجاع",
  "CEO residual share": "سهم باقی‌مانده مدیرعامل",
  "Half of the remaining referral pool at the CEO row": "نصف مانده صندوق پورسانت در ردیف مدیرعامل",
  "Save Box contribution": "واریز به صندوق ذخیره",
  "Discount subsidy": "یارانه تخفیف",
  "Owner match": "سهم تطبیقی مالک",
  "Unassigned inviter share": "سهم معرف تخصیص‌نیافته",
  "Refund recovery": "بازیابی بازپرداخت",
  "Refund reversal": "برگشت بازپرداخت",
  "Refund recovery due": "بدهی بازیابی بازپرداخت",
  "Expired-upline commission to CEO": "پورسانت بالادستی منقضی که به مدیرعامل می‌رسد",
  "Filter by account or activity": "جست‌وجو بر اساس حساب یا فعالیت",
  "Filter ledger": "فیلتر دفتر کل",
  "entries": "مورد",
  " entries": " مورد",
  "An append-only record of subscription allocations, commissions, discounts, and corrections.": "سجل افزایشی و غیرقابل‌حذف تخصیص اشتراک‌ها، پورسانت‌ها، تخفیف‌ها و اصلاحات.",
  "Add a documented correction to the Save Box or CEO / Shop Owner Pocket. Save Box balance cannot go below zero.": "اصلاح مستندی به صندوق ذخیره یا حساب مدیرعامل / مالک فروشگاه اضافه کنید. موجودی صندوق ذخیره نمی‌تواند منفی شود.",
  "Account": "حساب",
  "Direction": "جهت تغییر",
  "Add funds": "افزایش موجودی",
  "Remove funds": "کاهش موجودی",
  "Amount": "مبلغ",
  "Reason": "دلیل",
  "Explain the correction": "دلیل اصلاح را بنویسید",
  "Post adjustment": "ثبت اصلاح",
  "No ledger entries yet": "هنوز موردی در دفتر کل ثبت نشده است",
  "Paid sales, discounts, commissions, and adjustments will appear here.": "فروش‌های پرداخت‌شده، تخفیف‌ها، پورسانت‌ها و اصلاحات در اینجا نمایش داده می‌شوند.",
  "Date": "تاریخ",
  "Activity": "فعالیت",
  "Related person": "کاربر مرتبط",
  "Change": "تغییر",
  "Adjust the plan prices and allocation rules. New settings apply to future sales; posted ledger entries stay unchanged.": "قیمت طرح‌ها و قوانین تخصیص را تنظیم کنید. تنظیمات جدید برای فروش‌های آینده اعمال می‌شوند و موارد ثبت‌شده در دفتر کل تغییر نمی‌کنند.",
  "Plans and currency": "طرح‌ها و واحد پول",
  "Use the same currency unit for every amount. No currency symbol is shown unless you enter a label.": "برای همه مبالغ از یک واحد پول استفاده کنید. نماد پول فقط در صورت واردکردن برچسب نمایش داده می‌شود.",
  "Plan name and price": "نام و قیمت طرح",
  "Subscription validity": "مدت اعتبار اشتراک",
  "New paid purchases activate the user for this many calendar months": "خریدهای پرداخت‌شده جدید، کاربر را به این تعداد ماه تقویمی فعال می‌کنند",
  "Currency label": "برچسب واحد پول",
  "Optional, e.g. toman": "اختیاری، مانند تومان",
  "Leave blank": "خالی بگذارید",
  "Currency precision": "دقت واحد پول",
  "Locked because sales or financial entries exist": "به‌دلیل وجود فروش یا ثبت مالی قفل شده است",
  "Number of decimal places": "تعداد رقم اعشار",
  " decimal place": " رقم اعشار",
  " decimal places": " رقم اعشار",
  "Sale allocations": "تخصیص فروش",
  "The shop and referral pool must add to 100%. The entire referral pool is allocated through the upline waterfall: 50%, 25%, 12.5%, and so on. Whatever remains at the CEO row is split equally between the CEO and Save Box. An inactive user’s share goes to the CEO.": "سهم فروشگاه و صندوق پورسانت باید در مجموع ۱۰۰٪ باشد. کل صندوق پورسانت از طریق زنجیره بالادستی توزیع می‌شود: ۵۰٪، ۲۵٪، ۱۲٫۵٪ و به همین ترتیب. هر مبلغی که در ردیف مدیرعامل باقی بماند، به‌طور مساوی بین مدیرعامل و صندوق ذخیره تقسیم می‌شود. سهم کاربر غیرفعال به مدیرعامل می‌رسد.",
  "Every user upline receives half of the remaining pool. The remaining amount at the CEO row is split equally between the CEO and Save Box.": "هر کاربر بالادستی نصف مانده صندوق را دریافت می‌کند. مبلغ باقی‌مانده در ردیف مدیرعامل به‌طور مساوی بین مدیرعامل و صندوق ذخیره تقسیم می‌شود.",
  "Shop allocation": "سهم فروشگاه",
  "Total referral pool": "کل صندوق پورسانت",
  "Every upline share is half of the remaining referral pool. At the CEO row, the remainder is split equally between the CEO and Save Box.": "سهم هر کاربر بالادستی نصف مانده صندوق پورسانت است. در ردیف مدیرعامل، مانده به‌طور مساوی بین مدیرعامل و صندوق ذخیره تقسیم می‌شود.",
  "Welcome discount": "تخفیف خوش‌آمدگویی",
  "Only a user’s first paid subscription can use this discount. Eligibility uses the balance before that sale.": "این تخفیف فقط برای اولین اشتراک پرداخت‌شده هر کاربر قابل‌استفاده است. واجدشرایط‌بودن بر اساس موجودی پیش از فروش محاسبه می‌شود.",
  "Discount rate": "درصد تخفیف",
  "Save Box reserve": "ذخیره صندوق تخفیف",
  "The default 50% reserve requires a pre-sale balance of at least twice the discount amount. Changing the reserve updates both the required balance and campaign budget.": "با ذخیره پیش‌فرض ۵۰٪، موجودی پیش از فروش باید دست‌کم دو برابر مبلغ تخفیف باشد. تغییر درصد ذخیره، موجودی موردنیاز و بودجه کمپین را به‌روزرسانی می‌کند.",
  "Data and backups": "داده‌ها و نسخه‌های پشتیبان",
  "Records are stored locally in this browser. Use export/import to move or back up this workspace.": "اطلاعات به‌صورت محلی در این مرورگر ذخیره می‌شوند. برای انتقال یا پشتیبان‌گیری از این فضا، از خروجی و ورود اطلاعات استفاده کنید.",
  "Import backup": "ورود نسخه پشتیبان",
  "This standalone version does not sync between computers. Keep an exported backup somewhere safe.": "این نسخه مستقل بین رایانه‌ها همگام‌سازی نمی‌شود. نسخه پشتیبان خروجی‌گرفته‌شده را در جای امنی نگه دارید.",
  "Clear workspace data": "پاک‌کردن اطلاعات فضا",
  "Load sample data": "بارگذاری داده‌های نمونه",
  "Save settings": "ذخیره تنظیمات",
  "No user uplines are linked. The CEO and Save Box split the full referral pool equally.": "هیچ کاربر بالادستی ثبت نشده است؛ مدیرعامل و صندوق ذخیره کل صندوق پورسانت را به‌طور مساوی تقسیم می‌کنند.",
  "Expired users’ shares routed to the CEO": "سهم کاربران منقضی‌شده که به مدیرعامل می‌رسد",
  "CEO share of remaining pool": "سهم مدیرعامل از مانده صندوق",
  "Upline commission allocations": "تخصیص پورسانت به کاربران بالادستی",
  "Save Box share of CEO-row remainder": "سهم صندوق ذخیره از مانده ردیف مدیرعامل",
  "50% of the CEO-row remainder (varies by referral depth)": "۵۰٪ از مانده ردیف مدیرعامل (متناسب با عمق زنجیره ارجاع)",
  "Half of the remaining referral pool": "نصف مانده صندوق پورسانت",
  "of pool": "از صندوق پورسانت",
  "List price": "قیمت اصلی",
  "User pays": "مبلغ پرداختی کاربر",
  "Rounding adjustment to referral pool": "تعدیل گردکردن صندوق پورسانت",
  "The buyer earns no commission on their own sale.": "خریدار از خرید خودش پورسانت نمی‌گیرد.",
  "Discount funded from the Save Box": "تخفیف از صندوق ذخیره تأمین شد",
  "Save Box subsidy to the shop": "یارانه صندوق ذخیره به فروشگاه",
  "Save Box half of the CEO-row remainder": "نصف مانده ردیف مدیرعامل برای صندوق ذخیره",
  "New Save Box contribution applied to recovery due": "واریزی جدید صندوق ذخیره برای تسویه بدهی بازیابی استفاده شد",
  "Restore Save Box discount debit": "برداشت تخفیف از صندوق ذخیره بازگردانده شد",
  "Reverse Save Box contribution": "واریزی صندوق ذخیره برگشت داده شد",
  "Save Box funds were already used before refund": "موجودی صندوق ذخیره پیش از بازپرداخت استفاده شده بود",
  "Welcome discount is funded by the existing Save Box balance. The new sale cannot fund its own discount.": "تخفیف خوش‌آمدگویی از موجودی قبلی صندوق ذخیره تأمین می‌شود؛ فروش جدید نمی‌تواند هزینه تخفیف خودش را تأمین کند.",
  "A one-time ": "یک تخفیف یک‌باره به میزان ",
  "% welcome discount when the Save Box has enough balance.": "٪ در صورت کافی‌بودن موجودی صندوق ذخیره.",
  "The new sale cannot fund its own discount.": "فروش جدید هزینه تخفیف خودش را تأمین نمی‌کند.",
  "Clear all people, sales, balances, and ledger entries from this browser? Export a backup first if you need these records.": "همه کاربران، فروش‌ها، موجودی‌ها و موارد دفتر کل از این مرورگر پاک شوند؟ اگر به این اطلاعات نیاز دارید، ابتدا نسخه پشتیبان بگیرید.",
  "Refund this sale and reverse its allocations? This will add reversal entries to the ledger.": "این فروش بازپرداخت و تخصیص‌هایش معکوس شود؟ موارد برگشت به دفتر کل اضافه خواهند شد.",
  "Replace this browser’s current workspace with the selected backup?": "فضای کاری فعلی این مرورگر با نسخه پشتیبان انتخاب‌شده جایگزین شود؟",
  "That inviter would create a referral cycle.": "این معرف باعث ایجاد چرخه ارجاع می‌شود.",
  "Enter a name first.": "ابتدا نام را وارد کنید.",
  "Employees must report directly to the Shop Owner.": "کارمندان باید مستقیماً زیرمجموعه مالک فروشگاه باشند.",
  "Customers can be referred by an employee or another customer.": "مشتریان را یک کارمند یا مشتری دیگر می‌تواند معرفی کند.",
  "The Shop Owner record cannot be edited here.": "اطلاعات مالک فروشگاه را نمی‌توان از این بخش ویرایش کرد.",
  "Person updated.": "اطلاعات کاربر به‌روزرسانی شد.",
  "User added.": "کاربر اضافه شد.",
  "Choose an employee or customer user and a valid plan.": "یک کاربر از نوع کارمند یا مشتری و یک طرح معتبر انتخاب کنید.",
  "Welcome discount applies only to the user's first paid subscription.": "تخفیف خوش‌آمدگویی فقط برای اولین اشتراک پرداخت‌شده کاربر قابل‌استفاده است.",
  "Paid subscription recorded and allocations posted.": "اشتراک پرداخت‌شده ثبت و تخصیص‌ها اعمال شد.",
  "Pending subscription saved. No allocations have been posted.": "اشتراک در انتظار ذخیره شد؛ هنوز تخصیصی اعمال نشده است.",
  "Payment confirmed. The referral split has been posted.": "پرداخت تأیید شد و سهم‌های ارجاع ثبت شدند.",
  "Refund recorded. Reversal entries were added to the ledger.": "بازپرداخت ثبت شد و موارد برگشت به دفتر کل اضافه شدند.",
  "Enter valid percentages.": "درصدهای معتبر وارد کنید.",
  "Shop allocation and referral pool must add to 100%.": "سهم فروشگاه و صندوق پورسانت باید در مجموع ۱۰۰٪ باشند.",
  "Percentages must be between 0 and 100.": "درصدها باید بین صفر تا ۱۰۰ باشند.",
  "Subscription validity must be between 1 and 24 months.": "مدت اعتبار اشتراک باید بین ۱ تا ۲۴ ماه باشد.",
  "Currency precision must be between 0 and 4 decimal places.": "دقت واحد پول باید بین صفر تا ۴ رقم اعشار باشد.",
  "Currency precision is locked after sales or financial entries exist so old amounts remain accurate.": "پس از ثبت فروش یا موارد مالی، دقت واحد پول قفل می‌شود تا مبالغ قبلی دقیق بمانند.",
  "Each plan needs a name.": "برای هر طرح باید نامی وارد کنید.",
  "Settings saved. Existing ledger entries are unchanged.": "تنظیمات ذخیره شد. موارد قبلی دفتر کل تغییری نکردند.",
  "Sample workspace is loaded. Replace it with your real people and sales when ready.": "فضای نمونه بارگذاری شده است. هر زمان آماده بودید، کاربران و فروش‌های واقعی را جایگزین کنید.",
  "Clear sample": "پاک‌کردن نمونه",
  "Workspace cleared.": "فضای کاری پاک شد.",
  "Backup exported.": "نسخه پشتیبان صادر شد.",
  "The backup has no Shop Owner root.": "در نسخه پشتیبان ریشه مالک فروشگاه وجود ندارد.",
  "The backup has invalid currency or plan settings.": "تنظیمات واحد پول یا طرح‌ها در نسخه پشتیبان نامعتبر است.",
  "The backup has invalid subscription validity settings.": "مدت اعتبار اشتراک در نسخه پشتیبان نامعتبر است.",
  "The backup contains an invalid percentage.": "نسخه پشتیبان شامل درصد نامعتبر است.",
  "The backup allocation settings exceed the allowed pool.": "تنظیمات تخصیص نسخه پشتیبان از سقف مجاز بیشتر است.",
  "The backup contains an invalid subscription plan.": "نسخه پشتیبان شامل طرح اشتراک نامعتبر است.",
  "The backup contains an invalid or duplicate person.": "نسخه پشتیبان شامل کاربر نامعتبر یا تکراری است.",
  "The backup contains an invalid subscription expiry date.": "نسخه پشتیبان شامل تاریخ انقضای اشتراک نامعتبر است.",
  "The backup has an invalid Shop Owner root.": "ریشه مالک فروشگاه در نسخه پشتیبان نامعتبر است.",
  "A person in the backup has a missing inviter.": "برای یکی از کاربران نسخه پشتیبان، معرف وجود ندارد.",
  "Every employee in the backup must report to the Shop Owner.": "هر کارمند در نسخه پشتیبان باید زیرمجموعه مالک فروشگاه باشد.",
  "Customers in the backup must be referred by employees or customers.": "مشتریان نسخه پشتیبان باید توسط کارمند یا مشتری معرفی شده باشند.",
  "The backup contains a referral cycle.": "نسخه پشتیبان شامل چرخه ارجاع است.",
  "The backup contains an invalid sale record.": "نسخه پشتیبان شامل رکورد فروش نامعتبر است.",
  "The backup contains an invalid ledger entry.": "نسخه پشتیبان شامل مورد نامعتبر در دفتر کل است.",
  "The backup would make the Save Box balance negative.": "این نسخه پشتیبان موجودی صندوق ذخیره را منفی می‌کند.",
  "Backup imported.": "نسخه پشتیبان وارد شد.",
  "Could not import this backup.": "ورود این نسخه پشتیبان ممکن نشد.",
  "Enter a valid non-negative amount.": "مبلغ معتبر و غیرمنفی وارد کنید.",
  "Amounts may use up to ": "مبالغ می‌توانند حداکثر ",
  " decimal places.": " رقم اعشار داشته باشند.",
  "Amount is too large for the selected currency precision.": "مبلغ برای دقت انتخاب‌شده واحد پول بیش از حد بزرگ است.",
  "This customer already has a paid purchase. The welcome discount is no longer available.": "این کاربر پیش‌تر خرید پرداخت‌شده داشته است؛ تخفیف خوش‌آمدگویی دیگر در دسترس نیست.",
  "This user already has a paid purchase. The welcome discount is no longer available.": "این کاربر پیش‌تر خرید پرداخت‌شده داشته است؛ تخفیف خوش‌آمدگویی دیگر در دسترس نیست.",
  "Choose a customer and a valid plan.": "یک کاربر و طرح معتبر انتخاب کنید.",
  "The selected plan no longer exists.": "طرح انتخاب‌شده دیگر وجود ندارد.",
  "The Save Box balance changed. The welcome discount is not currently funded.": "موجودی صندوق ذخیره تغییر کرده است؛ در حال حاضر بودجه کافی برای تخفیف خوش‌آمدگویی وجود ندارد.",
  "The Shop Owner root.": "ریشه مالک فروشگاه.",
  "admin adjustment": "اصلاح مدیر",
  "commission": "پورسانت",
  "Unknown person": "کاربر ناشناس",
  "Level ": "سطح ",
  " above": " بالاتر",
  " level": " سطح",
  " levels": " سطح",
  "Through ": "تا ",
  "A sale cannot be credited to the buyer as their own commission.": "پورسانت خرید به خود خریدار تعلق نمی‌گیرد.",
  "Expand referrals": "باز کردن شاخه ارجاع",
  "Collapse referrals": "بستن شاخه ارجاع",
  "Load sample data": "بارگذاری داده نمونه",
  "Clear all data": "پاک‌کردن همه اطلاعات"
};
function translateText(text) {
  if (uiLanguage !== "fa") return String(text == null ? "" : text);
  const value = String(text == null ? "" : text);
  const trimmed = value.trim();
  if (Object.prototype.hasOwnProperty.call(faDictionary, trimmed)) {
    return value.slice(0, value.indexOf(trimmed)) + faDictionary[trimmed] + value.slice(value.indexOf(trimmed) + trimmed.length);
  }
  let translated = value;
  Object.keys(faDictionary).filter(function (key) { return /^\s|\s$/.test(key); })
    .sort(function (a, b) { return b.length - a.length; })
    .forEach(function (key) { translated = translated.split(key).join(faDictionary[key]); });
  return translated;
}
function localizedDigits(value) {
  return uiLanguage === "fa" ? String(value).replace(/[0-9]/g, function (digit) { return "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]; }) : String(value);
}
function displayPlanName(name) {
  if (uiLanguage !== "fa") return name;
  return ({ Bronze: "برنزی", Silver: "نقره‌ای", Gold: "طلایی" })[name] || name;
}
function displayLevel(level) {
  return uiLanguage === "fa" ? "سطح " + localizedDigits(level) : "Level " + level;
}
function formatDate(value) {
  return new Date(value).toLocaleDateString(uiLanguage === "fa" ? "fa-IR" : "en-US");
}
function formatDateTime(value) {
  return new Date(value).toLocaleString(uiLanguage === "fa" ? "fa-IR" : "en-US");
}
function applyLanguage(root) {
  const target = root || document.body;
  document.documentElement.lang = uiLanguage === "fa" ? "fa" : "en";
  document.documentElement.dir = uiLanguage === "fa" ? "rtl" : "ltr";
  document.title = translateText("Branch Ledger — Referral & subscription manager");
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.closest("[data-preserve-content]")) continue;
    if (node.parentElement && node.parentElement.closest(".toast")) continue;
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, node.nodeValue);
    node.nodeValue = localizedDigits(translateText(originalTextNodes.get(node)));
  }
  if (target.querySelectorAll) {
    target.querySelectorAll("[placeholder], [aria-label], [title]").forEach(function (element) {
      ["placeholder", "aria-label", "title"].forEach(function (attribute) {
        if (element.hasAttribute(attribute)) {
          let values = originalAttributes.get(element);
          if (!values) { values = {}; originalAttributes.set(element, values); }
          if (!Object.prototype.hasOwnProperty.call(values, attribute)) values[attribute] = element.getAttribute(attribute);
          element.setAttribute(attribute, translateText(values[attribute]));
        }
      });
    });
  }
  const languageButton = document.getElementById("language-toggle");
  if (languageButton) {
    languageButton.textContent = uiLanguage === "fa" ? "English" : "فارسی";
    languageButton.setAttribute("lang", uiLanguage === "fa" ? "en" : "fa");
  }
  const toastElement = document.getElementById("toast");
  if (toastElement && activeToastMessage) toastElement.textContent = translateText(activeToastMessage);
}

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function loadApiConnection() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(API_PREF_KEY) || "{}");
    return {
      baseUrl: String(saved.baseUrl || "http://127.0.0.1:8787"),
      readToken: String(saved.readToken || "")
    };
  } catch (_) {
    return { baseUrl: "http://127.0.0.1:8787", readToken: "" };
  }
}
function addCalendarMonths(dateValue, monthCount) {
  const date = new Date(dateValue);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Math.max(1, Number(monthCount) || 1));
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return date;
}
function subscriptionExpiryFromSales(userId, sales, defaultMonths) {
  let expires = null;
  (sales || []).filter(function (sale) { return sale.customerId === userId && sale.status === "paid"; })
    .slice().sort(function (a, b) {
      return new Date(a.paidAt || a.createdAt || 0) - new Date(b.paidAt || b.createdAt || 0);
    }).forEach(function (sale) {
      const paidAt = new Date(sale.paidAt || sale.createdAt || 0);
      if (!Number.isFinite(paidAt.getTime())) return;
      const base = expires && expires > paidAt ? expires : paidAt;
      expires = addCalendarMonths(base, sale.subscriptionMonthsSnapshot || defaultMonths || 1);
    });
  return expires ? expires.toISOString() : null;
}
function blankState() {
  return {
    version: 1,
    settings: JSON.parse(JSON.stringify(defaultSettings)),
    people: [{ id: "owner", name: "Shop Owner", role: "owner", referrerId: null, createdAt: new Date().toISOString() }],
    sales: [],
    ledger: [],
    demoData: false
  };
}
function loadState(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey || STORAGE_KEY);
    if (!saved) return blankState();
    const parsed = JSON.parse(saved);
    const fresh = blankState();
    parsed.settings = Object.assign(fresh.settings, parsed.settings || {});
    delete parsed.settings.boxShareOfPool;
    delete parsed.settings.ownerMatchSaveBox;
    parsed.settings.plans = Array.isArray(parsed.settings.plans) ? parsed.settings.plans : fresh.settings.plans;
    parsed.settings.currencyPrecision = Number.isInteger(Number(parsed.settings.currencyPrecision)) && Number(parsed.settings.currencyPrecision) >= 0 && Number(parsed.settings.currencyPrecision) <= 4 ? Number(parsed.settings.currencyPrecision) : 0;
    parsed.people = Array.isArray(parsed.people) ? parsed.people : fresh.people;
    parsed.sales = Array.isArray(parsed.sales) ? parsed.sales : [];
    parsed.ledger = Array.isArray(parsed.ledger) ? parsed.ledger : [];
    parsed.settings.subscriptionMonths = Number.isInteger(Number(parsed.settings.subscriptionMonths)) && Number(parsed.settings.subscriptionMonths) >= 1 && Number(parsed.settings.subscriptionMonths) <= 24 ? Number(parsed.settings.subscriptionMonths) : 1;
    parsed.sales.forEach(function (sale) {
      if (sale.status === "paid" && !sale.subscriptionMonthsSnapshot) sale.subscriptionMonthsSnapshot = parsed.settings.subscriptionMonths;
    });
    if (!parsed.people.some(function (p) { return p.id === "owner"; })) parsed.people.unshift(fresh.people[0]);
    parsed.people.forEach(function (person) {
      if (person.role !== "owner" && !Object.prototype.hasOwnProperty.call(person, "subscriptionExpiresAt")) {
        person.subscriptionExpiresAt = subscriptionExpiryFromSales(person.id, parsed.sales, parsed.settings.subscriptionMonths);
      }
    });
    return parsed;
  } catch (error) {
    return blankState();
  }
}
let state = loadState();
let usingDemoWorkspace = false;
let currentView = "overview";
let editingPersonId = null;
let memberViewId = "";
let toastTimer = null;
let activeToastMessage = "";
let signedInAccountId = "";

function readAccountStore() {
  try {
    const value = JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}");
    return value && value.version === 1 && value.accounts && typeof value.accounts === "object"
      ? value
      : { version: 1, accounts: {} };
  } catch (_) {
    return { version: 1, accounts: {} };
  }
}
function saveAccountStore(value) {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(value));
}
function accountCredential(accountId) {
  return readAccountStore().accounts[accountId] || null;
}
function isOwnerSession() {
  return signedInAccountId === "owner" || signedInAccountId === "builtin-admin";
}
function signedInMemberId() {
  return signedInAccountId === "builtin-demo" ? "demo-user" : signedInAccountId;
}
function accountName(accountId) {
  if (accountId === "owner") return "Shop Owner";
  if (accountId === "builtin-admin") return "Demo Admin";
  if (accountId === "builtin-demo") return "Demo User";
  const person = personById(accountId);
  return person ? person.name : "";
}
function bytesToHex(bytes) {
  return Array.from(bytes).map(function (value) { return value.toString(16).padStart(2, "0"); }).join("");
}
async function passwordDigest(password, saltHex) {
  if (!window.crypto || !window.crypto.subtle) throw new Error(translateText("Your browser does not support password hashing required for sign-in."));
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(function (byte) { return parseInt(byte, 16); }));
  const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}
function showAuth(setup) {
  if (usingDemoWorkspace) {
    persist();
    usingDemoWorkspace = false;
    state = loadState(STORAGE_KEY);
  }
  signedInAccountId = "";
  sessionStorage.removeItem("branch-ledger.signed-in-account.v1");
  const auth = document.getElementById("auth-screen");
  const workspace = document.getElementById("workspace-shell");
  workspace.style.display = "none";
  workspace.classList.remove("member-session");
  auth.hidden = false;
  document.getElementById("auth-form").hidden = Boolean(setup);
  document.getElementById("owner-setup-form").hidden = !setup;
  document.getElementById("auth-error").hidden = true;
  document.getElementById("setup-error").hidden = true;
  const ownerSetupToggle = document.getElementById("owner-setup-toggle");
  ownerSetupToggle.hidden = Boolean(readAccountStore().accounts.owner);
  ownerSetupToggle.textContent = setup ? "Back to sign in" : "Set up owner login";
  document.getElementById("auth-title").textContent = setup ? "Create your owner account" : "Sign in to your account";
  document.getElementById("auth-description").textContent = setup ? "Set up a private login for your real workspace." : "Each user signs in to their own panel and activity history.";
  document.getElementById(setup ? "owner-password" : "auth-username").focus();
  applyLanguage(document.body);
}
function showWorkspace(accountId) {
  const demoAccount = accountId === "builtin-admin" || accountId === "builtin-demo";
  if (usingDemoWorkspace && !demoAccount) {
    persist();
    usingDemoWorkspace = false;
    state = loadState(STORAGE_KEY);
  } else if (!usingDemoWorkspace && demoAccount) {
    state = loadState(DEMO_STORAGE_KEY);
    usingDemoWorkspace = true;
  }
  signedInAccountId = accountId;
  sessionStorage.setItem("branch-ledger.signed-in-account.v1", accountId);
  const auth = document.getElementById("auth-screen");
  const workspace = document.getElementById("workspace-shell");
  auth.hidden = true;
  workspace.style.display = "";
  workspace.classList.toggle("member-session", !isOwnerSession());
  document.getElementById("sign-out-button").hidden = false;
  currentView = isOwnerSession() ? "overview" : "member";
  if (!isOwnerSession()) memberViewId = signedInMemberId();
  render();
}
async function seedBuiltinCredential(accountId, username, password) {
  const records = readAccountStore();
  if (records.accounts[accountId]) return;
  const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
  records.accounts[accountId] = { username: username, salt: salt, digest: await passwordDigest(password, salt) };
  saveAccountStore(records);
}
function buildDemoWorkspace() {
  const previousState = state;
  const previousMode = usingDemoWorkspace;
  usingDemoWorkspace = true;
  state = blankState();
  state.demoData = true;
  const createdAt = new Date().toISOString();
  const demoUser = { id: "demo-user", name: "Demo User", role: "employee", referrerId: "owner", createdAt: createdAt };
  const mina = { id: "demo-mina", name: "Mina Customer", role: "customer", referrerId: demoUser.id, createdAt: createdAt };
  const arman = { id: "demo-arman", name: "Arman Customer", role: "customer", referrerId: mina.id, createdAt: createdAt };
  const sara = { id: "demo-sara", name: "Sara Customer", role: "customer", referrerId: arman.id, createdAt: createdAt };
  state.people.push(demoUser, mina, arman, sara);
  [
    { customerId: demoUser.id, planId: "bronze" },
    { customerId: mina.id, planId: "bronze" },
    { customerId: arman.id, planId: "silver" },
    { customerId: sara.id, planId: "gold" }
  ].forEach(function (row) {
    const plan = planById(row.planId);
    const sale = {
      id: makeId("demo-sale"), customerId: row.customerId, customerName: personName(row.customerId),
      planId: plan.id, planName: plan.name, priceSnapshot: plan.price, welcomeRequested: false,
      status: "pending", createdAt: createdAt
    };
    state.sales.push(sale);
    postSale(sale);
  });
  state.demoData = true;
  persist();
  state = previousState;
  usingDemoWorkspace = previousMode;
}
async function initializeAuthentication() {
  let initializationError = "";
  try {
    if (!window.crypto || !window.crypto.subtle) throw new Error(translateText("Your browser does not support password hashing required for sign-in."));
    await seedBuiltinCredential("builtin-admin", "admin", "admin12345");
    await seedBuiltinCredential("builtin-demo", "demo", "demo12345");
    const savedDemo = loadState(DEMO_STORAGE_KEY);
    if (!localStorage.getItem(DEMO_STORAGE_KEY) || !savedDemo.demoData || !savedDemo.people.some(function (person) { return person.id === "demo-user"; })) buildDemoWorkspace();
  } catch (error) {
    initializationError = error.message || translateText("Your browser does not support password hashing required for sign-in.");
  }
  sessionStorage.removeItem("branch-ledger.signed-in-account.v1");
  showAuth(false);
  document.getElementById("owner-setup-toggle").hidden = Boolean(readAccountStore().accounts.owner);
  if (initializationError) {
    const authError = document.getElementById("auth-error");
    authError.textContent = initializationError;
    authError.hidden = false;
  }
}
async function submitLogin(form) {
  const data = new FormData(form);
  const username = String(data.get("username") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const records = readAccountStore();
  const reservedLogin = username === "admin" ? "builtin-admin" : (username === "demo" ? "builtin-demo" : "");
  const matched = reservedLogin && records.accounts[reservedLogin]
    ? reservedLogin
    : Object.keys(records.accounts).find(function (id) {
      return String(records.accounts[id].username || "").toLowerCase() === username;
    });
  const error = document.getElementById("auth-error");
  try {
    const record = matched ? records.accounts[matched] : null;
    const valid = record && await passwordDigest(password, record.salt) === record.digest;
    if (!valid) throw new Error(translateText("The username or password is incorrect."));
    const exists = ["owner", "builtin-admin", "builtin-demo"].includes(matched) || state.people.some(function (person) { return person.id === matched && person.role !== "owner"; });
    if (!exists) throw new Error(translateText("This account has been disabled."));
    showWorkspace(matched);
  } catch (reason) {
    error.textContent = reason.message || translateText("The username or password is incorrect.");
    error.hidden = false;
  }
}
async function setupOwnerAccount(form) {
  const data = new FormData(form);
  const username = String(data.get("username") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const confirmation = String(data.get("confirmPassword") || "");
  const error = document.getElementById("setup-error");
  try {
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username) || password.length < 10) throw new Error(translateText("Enter a username and a password of at least 10 characters."));
    if (password !== confirmation) throw new Error(translateText("Passwords do not match."));
    const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const digest = await passwordDigest(password, salt);
    const records = readAccountStore();
    if (records.accounts.owner) throw new Error(translateText("The account could not be found. Refresh the page and try again."));
    const duplicate = Object.keys(records.accounts).some(function (id) {
      return id !== "owner" && String(records.accounts[id].username || "").toLowerCase() === username;
    });
    if (duplicate) throw new Error(translateText("That username is already assigned to another account."));
    records.accounts.owner = { username: username, salt: salt, digest: digest };
    saveAccountStore(records);
    showWorkspace("owner");
  } catch (reason) {
    error.textContent = reason.message || translateText("The account could not be found. Refresh the page and try again.");
    error.hidden = false;
  }
}
async function saveMemberLogin(form) {
  const data = new FormData(form);
  const accountId = String(data.get("accountId") || "");
  const username = String(data.get("username") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  if (usingDemoWorkspace && accountId === "demo-user") return toast(translateText("The built-in demo login cannot be changed here."), "error");
  const existingPerson = accountId === "owner" || state.people.some(function (person) { return person.id === accountId && person.role !== "owner"; });
  if (!existingPerson) return toast(translateText("The account could not be found. Refresh the page and try again."), "error");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) return toast(translateText("Usernames must use 3–40 letters, numbers, dots, underscores, or hyphens."), "error");
  if (password.length < 10) return toast(translateText("Enter a username and a password of at least 10 characters."), "error");
  const records = readAccountStore();
  const duplicate = Object.keys(records.accounts).some(function (id) {
    return id !== accountId && String(records.accounts[id].username || "").toLowerCase() === username;
  });
  if (duplicate) return toast(translateText("That username is already assigned to another account."), "error");
  try {
    const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
    const digest = await passwordDigest(password, salt);
    records.accounts[accountId] = { username: username, salt: salt, digest: digest };
    saveAccountStore(records);
    document.getElementById("account-password").value = "";
    toast(translateText("Login saved for ") + accountName(accountId) + ".");
    render();
  } catch (error) {
    toast(error.message || translateText("Your browser does not support password hashing required for sign-in."), "error");
  }
}
function disableMemberLogin(accountId) {
  if (usingDemoWorkspace && accountId === "demo-user") return toast(translateText("The built-in demo login cannot be changed here."), "error");
  if (!accountId || accountId === "owner") return toast(translateText("The owner login cannot be disabled here."), "error");
  const records = readAccountStore();
  if (!records.accounts[accountId]) return toast(translateText("This account has been disabled."), "error");
  delete records.accounts[accountId];
  saveAccountStore(records);
  toast(translateText("Login disabled for ") + accountName(accountId) + ".");
  render();
}

function persist() {
  localStorage.setItem(usingDemoWorkspace ? DEMO_STORAGE_KEY : STORAGE_KEY, JSON.stringify(state));
}
function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch];
  });
}
function money(value) {
  const precision = Math.max(0, Math.min(4, Number(state.settings.currencyPrecision) || 0));
  const locale = uiLanguage === "fa" ? "fa-IR" : "en-US";
  const scale = 10n ** BigInt(precision);
  const units = BigInt(Math.trunc(Number(value) || 0));
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const whole = absolute / scale;
  const fraction = absolute % scale;
  const formattedWhole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(whole);
  const formatted = precision ? formattedWhole + (uiLanguage === "fa" ? "٫" : ".") + localizedDigits(String(fraction).padStart(precision, "0")) : formattedWhole;
  const rawLabel = String(state.settings.currencyLabel || "");
  const label = uiLanguage === "fa" && rawLabel.toLowerCase() === "toman" ? "تومان" : rawLabel;
  return (negative ? "−" : "") + formatted + (label ? " " + esc(label) : "");
}
function amountInput(value) {
  const precision = Math.max(0, Math.min(4, Number(state.settings.currencyPrecision) || 0));
  const scale = 10n ** BigInt(precision);
  const units = BigInt(Math.max(0, Math.trunc(Number(value) || 0)));
  const whole = units / scale;
  const fraction = units % scale;
  return String(whole) + (precision ? "." + String(fraction).padStart(precision, "0") : "");
}
function roundPct(amount, rate) {
  const amountUnits = BigInt(Math.max(0, Math.trunc(Number(amount) || 0)));
  const rateTenths = BigInt(Math.round(Number(rate) * 10));
  return Number((amountUnits * rateTenths + 500n) / 1000n);
}
function parseAmountInput(raw, precision) {
  const value = String(raw == null ? "" : raw).trim();
  const match = value.match(/^(\d+)(?:\.(\d*))?$/);
  if (!match) throw new Error("Enter a valid non-negative amount.");
  const places = Math.max(0, Math.min(4, Number(precision) || 0));
  const fraction = match[2] || "";
  if (fraction.length > places) throw new Error("Amounts may use up to " + places + " decimal places.");
  const scale = 10n ** BigInt(places);
  const units = BigInt(match[1]) * scale + BigInt((fraction + "0".repeat(places)).slice(0, places) || "0");
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Amount is too large for the selected currency precision.");
  return Number(units);
}
function pctText(amount, rate) {
  return money(roundPct(amount, rate));
}
function personById(id) {
  return state.people.find(function (p) { return p.id === id; }) || null;
}
function planById(id) {
  return state.settings.plans.find(function (p) { return p.id === id; }) || null;
}
function personName(id) {
  const p = personById(id);
  if (!p) return uiLanguage === "fa" ? "کاربر ناشناس" : "Unknown person";
  if (p.role === "owner" && uiLanguage === "fa") return "مدیرعامل / مالک فروشگاه";
  return p.name;
}
function subscriptionActiveAt(person, at) {
  if (!person) return false;
  if (person.role === "owner") return true;
  const expires = person.subscriptionExpiresAt ? new Date(person.subscriptionExpiresAt).getTime() : 0;
  return Number.isFinite(expires) && expires > new Date(at || Date.now()).getTime();
}
function subscriptionState(person, at) {
  if (!person || person.role === "owner") return { active: false, label: uiLanguage === "fa" ? "مدیرعامل؛ معاف" : "CEO exempt", detail: "" };
  const expiry = person.subscriptionExpiresAt ? new Date(person.subscriptionExpiresAt) : null;
  if (subscriptionActiveAt(person, at)) return { active: true, label: uiLanguage === "fa" ? "فعال" : "Active", detail: (uiLanguage === "fa" ? "تا " : "Through ") + formatDate(expiry) };
  return expiry && Number.isFinite(expiry.getTime())
    ? { active: false, label: uiLanguage === "fa" ? "منقضی‌شده" : "Expired", detail: (uiLanguage === "fa" ? "تاریخ انقضا: " : "Expired ") + formatDate(expiry) }
    : { active: false, label: uiLanguage === "fa" ? "بدون اشتراک" : "No subscription", detail: "" };
}
function refreshSubscriptionExpiry(personId) {
  const person = personById(personId);
  if (person && person.role !== "owner") {
    person.subscriptionExpiresAt = subscriptionExpiryFromSales(personId, state.sales, state.settings.subscriptionMonths);
  }
}
function accountBalance(account) {
  return state.ledger.reduce(function (sum, row) {
    return sum + (row.account === account ? Number(row.delta) : 0);
  }, 0);
}
function boxBalance() {
  return accountBalance("savebox");
}
function ownerBalance() {
  return accountBalance("owner") + accountBalance("person:owner");
}
function recoveryDue() {
  return Math.max(0, accountBalance("recovery"));
}
function toast(message, kind) {
  const el = document.getElementById("toast");
  activeToastMessage = String(message == null ? "" : message);
  el.textContent = translateText(activeToastMessage);
  el.className = "toast show" + (kind ? " " + kind : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.className = "toast"; el.textContent = ""; activeToastMessage = ""; }, 3200);
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ""; }).join("").toUpperCase();
}
function roleLabel(role) {
  if (uiLanguage === "fa") {
    if (role === "owner") return "مدیرعامل / مالک فروشگاه";
    if (role === "employee") return "کارمند";
    return "مشتری";
  }
  if (role === "owner") return "CEO / Shop Owner";
  if (role === "employee") return "Employee";
  return "Customer";
}
function levelOf(person) {
  if (!person) return 0;
  if (person.role === "owner") return 1;
  let depth = 1;
  let next = person.referrerId;
  const seen = new Set([person.id]);
  while (next) {
    if (seen.has(next)) return Math.max(depth, person.role === "employee" ? 2 : 3);
    seen.add(next);
    const parent = personById(next);
    if (!parent) break;
    depth += 1;
    if (parent.role === "owner") return depth;
    next = parent.referrerId;
  }
  return Math.max(depth, person.role === "employee" ? 2 : 3);
}
function ancestorsFor(personId) {
  const person = personById(personId);
  if (!person) return [];
  const result = [];
  const seen = new Set([personId]);
  let nextId = person.referrerId;
  while (nextId) {
    if (seen.has(nextId)) break;
    seen.add(nextId);
    const next = personById(nextId);
    if (!next) break;
    result.push(next);
    nextId = next.referrerId;
  }
  return result;
}
function hasPaidPurchase(personId, excludeSaleId) {
  return state.sales.some(function (sale) {
    return sale.id !== excludeSaleId && sale.customerId === personId && (Boolean(sale.paidAt) || sale.status === "paid" || sale.status === "refunded");
  });
}
function activeDiscountTotal() {
  return state.sales.filter(function (sale) { return sale.status === "paid"; }).reduce(function (sum, sale) {
    return sum + Math.max(0, Number(sale.discountAmount) || 0);
  }, 0);
}
function availableDiscountCampaignBudget() {
  const reserveRate = Math.max(0, Math.min(100, Number(state.settings.reserveRate) || 0));
  if (reserveRate >= 100) return 0;
  const active = BigInt(activeDiscountTotal());
  const fundedBasis = BigInt(Math.max(0, boxBalance())) + active;
  const budget = fundedBasis * BigInt(100 - reserveRate) / 100n - active;
  return Number(budget > 0n ? budget : 0n);
}
function minimumBalanceForDiscount(discount) {
  if (!discount) return 0;
  const reserveRate = Math.max(0, Math.min(100, Number(state.settings.reserveRate) || 0));
  if (reserveRate >= 100) return null;
  const rate = BigInt(100 - reserveRate);
  const active = BigInt(activeDiscountTotal());
  const amount = BigInt(discount);
  const immediate = (amount * 100n + rate - 1n) / rate;
  const campaignTarget = ((active + amount) * 100n + rate - 1n) / rate - active;
  return Number(immediate > campaignTarget ? immediate : campaignTarget);
}
function discountRequirementText(amount) {
  if (uiLanguage === "fa") return amount == null
    ? "وقتی ذخیره صندوق تخفیف ۱۰۰٪ باشد، تخفیف قابل‌استفاده نیست."
    : "برای استفاده از این تخفیف، موجودی صندوق ذخیره پیش از خرید باید دست‌کم " + money(amount) + " باشد.";
  return amount == null ? "Discounts are unavailable while the Save Box reserve is 100%." : "Save Box balance must be at least " + money(amount) + " before this discount can be used.";
}
function saleDiscountInfo(personId, planId, excludeSaleId, priceOverride) {
  const plan = planById(planId);
  const price = plan ? Math.max(0, Math.round(Number(priceOverride != null ? priceOverride : plan.price) || 0)) : 0;
  const discount = roundPct(price, state.settings.welcomeRate);
  const balance = boxBalance();
  const prior = hasPaidPurchase(personId, excludeSaleId);
  const reserveRequirement = minimumBalanceForDiscount(discount);
  return {
    price: price,
    discount: discount,
    paid: Math.max(0, price - discount),
    boxBalance: balance,
    firstSale: !prior,
    reserveRequirement: reserveRequirement,
    campaignBudget: availableDiscountCampaignBudget(),
    eligible: Boolean(personId && plan && !prior && reserveRequirement !== null && balance >= reserveRequirement && availableDiscountCampaignBudget() >= discount)
  };
}
function calculateWaterfall(pool, chain, asOf) {
  let remaining = BigInt(Math.max(0, Math.round(pool)));
  const commissions = [];
  chain.filter(function (person) { return person.role !== "owner"; }).forEach(function (person, index) {
    if (remaining === 0n) return;
    const share = (remaining + 1n) / 2n;
    remaining -= share;
    const active = subscriptionActiveAt(person, asOf);
    commissions.push({
      personId: person.id,
      name: person.name,
      distance: index + 1,
      rate: 50 / Math.pow(2, index),
      amount: Number(share),
      active: active,
      routedToOwner: !active
    });
  });
  const ownerResidual = Number(remaining / 2n);
  const saveBoxDeposit = Number(remaining - BigInt(ownerResidual));
  return { commissions: commissions, ownerResidual: ownerResidual, saveBoxDeposit: saveBoxDeposit };
}
function calculateSale(personId, planId, useDiscount, priceOverride, asOf) {
  const plan = planById(planId);
  const person = personById(personId);
  const listPrice = plan ? Math.max(0, Math.round(Number(priceOverride != null ? priceOverride : plan.price) || 0)) : 0;
  const discountInfo = saleDiscountInfo(personId, planId, null, listPrice);
  const discount = useDiscount ? discountInfo.discount : 0;
  const paid = Math.max(0, listPrice - discount);
  const shopAllocation = roundPct(paid, state.settings.shopRate);
  const referralPool = Math.max(0, paid - shopAllocation);
  const expectedReferral = roundPct(paid, state.settings.referralRate);
  const roundingAdjustment = referralPool - expectedReferral;
  const chain = ancestorsFor(personId);
  const waterfall = calculateWaterfall(referralPool, chain, asOf);
  const commissions = waterfall.commissions;
  const uplineCommissionTotal = commissions.reduce(function (sum, row) { return sum + row.amount; }, 0);
  const ownerRoutedCommission = commissions.filter(function (row) { return row.routedToOwner; }).reduce(function (sum, row) { return sum + row.amount; }, 0);
  return {
    listPrice: listPrice,
    discount: discount,
    paid: paid,
    shopAllocation: shopAllocation,
    referralPool: referralPool,
    roundingAdjustment: roundingAdjustment,
    saveBoxDeposit: waterfall.saveBoxDeposit,
    ownerResidual: waterfall.ownerResidual,
    uplineCommissionTotal: uplineCommissionTotal,
    commissions: commissions,
    ownerRoutedCommission: ownerRoutedCommission,
    discountInfo: discountInfo,
    chain: chain
  };
}
function ledgerEntry(account, delta, type, saleId, personId, note, extra) {
  state.ledger.push(Object.assign({
    id: makeId("entry"),
    date: new Date().toISOString(),
    account: account,
    delta: Math.round(delta),
    type: type,
    saleId: saleId || null,
    personId: personId || null,
    note: note || ""
  }, extra || {}));
}
function postSale(sale) {
  if (sale.status === "paid") return { ok: true };
  const person = personById(sale.customerId);
  if (!person || person.role === "owner") return { ok: false, message: "Choose an employee or customer user for this subscription." };
  const plan = planById(sale.planId);
  if (!plan) return { ok: false, message: "The selected plan no longer exists." };
  if (sale.welcomeRequested) {
    const info = saleDiscountInfo(sale.customerId, sale.planId, sale.id, sale.priceSnapshot);
    if (!info.firstSale) return { ok: false, message: "This user has already made a paid purchase, so the welcome discount is no longer available." };
    if (!info.eligible) {
      return { ok: false, message: discountRequirementText(info.reserveRequirement) };
    }
  }
  const paidAt = new Date().toISOString();
  const calc = calculateSale(sale.customerId, sale.planId, sale.welcomeRequested, sale.priceSnapshot, paidAt);
  if (sale.welcomeRequested && !calc.discountInfo.eligible) {
    return { ok: false, message: "The Save Box balance changed. The welcome discount is not currently funded." };
  }
  sale.status = "paid";
  sale.paidAt = paidAt;
  sale.subscriptionMonthsSnapshot = Number(state.settings.subscriptionMonths) || 1;
  sale.customerName = person.name;
  sale.planName = sale.planName || plan.name;
  sale.listPrice = calc.listPrice;
  sale.discountAmount = calc.discount;
  sale.amountPaid = calc.paid;
  sale.calculation = calc;
  refreshSubscriptionExpiry(person.id);

  if (calc.discount > 0) {
    ledgerEntry("savebox", -calc.discount, "Welcome discount", sale.id, sale.customerId, "Discount funded from the Save Box");
    ledgerEntry("owner", calc.discount, "Discount subsidy", sale.id, sale.customerId, "Save Box subsidy to the shop");
  }
  ledgerEntry("owner", calc.shopAllocation, "Shop allocation", sale.id, sale.customerId, "79% shop allocation");
  if (calc.ownerResidual > 0) ledgerEntry("owner", calc.ownerResidual, "CEO residual share", sale.id, sale.customerId, "Half of the remaining referral pool at the CEO row");

  const due = recoveryDue();
  const recovered = Math.min(calc.saveBoxDeposit, due);
  const boxCredit = calc.saveBoxDeposit - recovered;
  if (boxCredit > 0) ledgerEntry("savebox", boxCredit, "Save Box contribution", sale.id, sale.customerId, "Save Box half of the CEO-row remainder");
  if (recovered > 0) ledgerEntry("recovery", -recovered, "Refund recovery", sale.id, sale.customerId, "New Save Box contribution applied to recovery due");
  calc.recoveryApplied = recovered;
  calc.saveBoxNetCredit = boxCredit;

  calc.commissions.forEach(function (commission) {
    if (commission.amount > 0) {
      if (commission.active) {
        ledgerEntry("person:" + commission.personId, commission.amount, "Referral commission", sale.id, commission.personId,
          "Level " + commission.distance + " upline commission; active subscription");
      } else {
        ledgerEntry("owner", commission.amount, "Expired-upline commission to CEO", sale.id, commission.personId,
          "Level " + commission.distance + " share routed to the CEO because this user had no active subscription when the sale was paid");
      }
    }
  });
  persist();
  return { ok: true };
}
function reverseSale(sale) {
  const rows = state.ledger.filter(function (entry) { return entry.saleId === sale.id && !entry.reversalOf; });
  const saveBoxDelta = rows.filter(function (entry) { return entry.account === "savebox"; })
    .reduce(function (sum, entry) { return sum - entry.delta; }, 0);
  rows.filter(function (entry) { return entry.account !== "savebox"; }).forEach(function (entry) {
    if (entry.delta !== 0) ledgerEntry(entry.account, -entry.delta, "Refund reversal", sale.id, entry.personId,
      "Reversal of " + entry.type, { reversalOf: entry.id });
  });
  const current = boxBalance();
  if (saveBoxDelta >= 0) {
    if (saveBoxDelta > 0) ledgerEntry("savebox", saveBoxDelta, "Refund reversal", sale.id, sale.customerId, "Restore Save Box discount debit");
  } else {
    const amountToRemove = -saveBoxDelta;
    const available = Math.max(0, current);
    const removed = Math.min(available, amountToRemove);
    if (removed > 0) ledgerEntry("savebox", -removed, "Refund reversal", sale.id, sale.customerId, "Reverse Save Box contribution");
    const shortage = amountToRemove - removed;
    if (shortage > 0) ledgerEntry("recovery", shortage, "Refund recovery due", sale.id, sale.customerId, "Save Box funds were already used before refund");
  }
  sale.status = "refunded";
  sale.refundedAt = new Date().toISOString();
  refreshSubscriptionExpiry(sale.customerId);
  persist();
}
function roleClass(role) {
  return role === "employee" ? "employee" : (role === "owner" ? "owner" : "");
}
function pageHead(title, description, action) {
  return '<div class="page-head"><div><div class="eyebrow">Branch Ledger</div><h1>' + title + '</h1><p>' + description + '</p></div>' + (action || "") + '</div>';
}
function emptyState(title, copy, buttonText, action) {
  return '<div class="empty-state"><div class="empty-mark">＋</div><h3>' + title + '</h3><p>' + copy + '</p>' +
    (buttonText ? '<button class="button button-primary button-small" data-action="' + action + '">' + buttonText + '</button>' : '') + '</div>';
}
function saleStatusBadge(status) {
  const names = { paid: "Paid", pending: "Pending", refunded: "Refunded" };
  return '<span class="badge badge-' + esc(status) + '">' + esc(translateText(names[status] || status)) + '</span>';
}
function recentSalesTable(sales) {
  const rows = sales.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 6);
  if (!rows.length) return emptyState("No sales recorded yet", "Record a paid subscription to see allocations and start the Save Box.", "Record a sale", "new-sale");
  return '<div class="panel table-wrap"><table><thead><tr><th>Buyer</th><th>Plan</th><th>Status</th><th>Paid</th><th>Date</th></tr></thead><tbody>' +
    rows.map(function (sale) {
      return '<tr><td><span data-preserve-content>' + esc(sale.customerName || personName(sale.customerId)) + '</span></td><td><span data-preserve-content>' + esc(displayPlanName(sale.planName || (planById(sale.planId) || {}).name || "Plan")) + '</span>' +
        '</td><td>' + saleStatusBadge(sale.status) + '</td><td class="amount">' + money(sale.amountPaid != null ? sale.amountPaid : (sale.listPrice != null ? sale.listPrice : sale.priceSnapshot || 0)) +
        '</td><td class="muted">' + formatDate(sale.createdAt) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
}
function renderOverview() {
  const paid = state.sales.filter(function (s) { return s.status === "paid"; });
  const gross = paid.reduce(function (sum, s) { return sum + Number(s.amountPaid || 0); }, 0);
  const commissions = state.ledger.filter(function (e) { return e.account.indexOf("person:") === 0; }).reduce(function (sum, e) { return sum + e.delta; }, 0);
  const discountSpend = state.ledger.filter(function (e) { return e.type === "Welcome discount"; }).reduce(function (sum, e) { return sum - e.delta; }, 0);
  const customers = state.people.filter(function (p) { return p.role === "customer"; }).length;
  const employees = state.people.filter(function (p) { return p.role === "employee"; }).length;
  const users = customers + employees;
  const activeUsers = state.people.filter(function (p) { return p.role !== "owner" && subscriptionActiveAt(p); }).length;
  const reserve = roundPct(Math.max(0, boxBalance()), state.settings.reserveRate);
  const spendable = Math.max(0, boxBalance() - reserve);
  const demoBanner = state.demoData ? '<div class="demo-banner"><span>Sample workspace is loaded. Replace it with your real people and sales when ready.</span><button class="small-action" data-action="clear-demo">Clear sample</button></div>' : "";
  const guideAction = '<button class="button button-quiet" data-view="guide" type="button">' + (uiLanguage === "fa" ? "راهنمای سیستم" : "How it works") + '</button>';
  return pageHead("Overview", "See what each paid subscription funds, who earned a commission, and how much the Save Box can support.", guideAction)
    + demoBanner
    + '<div class="hero-row"><section class="hero-balance"><div class="eyebrow">CEO / Shop Owner Pocket</div><h2>' + money(ownerBalance()) + '</h2><p class="hero-caption">Includes shop allocations before fees, taxes, or overhead; this is not net profit. Expired-upline shares are credited here.</p><div class="hero-foot"><div><span>Paid sales</span><strong>' + money(gross) + '</strong></div><div><span>Active-user commissions</span><strong>' + money(commissions) + '</strong></div></div></section>'
    + '<section class="box-hero"><div class="box-top"><div><div class="eyebrow">Discount reserve</div><h3>' + money(boxBalance()) + '</h3><p>Separate from the CEO / Shop Owner Pocket</p></div><span class="box-icon">▣</span></div><div class="box-bottom"><span>Spendable now</span><strong>' + money(spendable) + '</strong></div></section></div>'
    + '<div class="metric-grid"><div class="metric"><div class="metric-label">Paid subscriptions</div><div class="metric-value">' + paid.length + '</div><div class="metric-note">Confirmed purchases only</div></div>'
    + '<div class="metric"><div class="metric-label">Users</div><div class="metric-value">' + users + '</div><div class="metric-note">' + (uiLanguage === "fa" ? localizedDigits(customers) + ' مشتری · ' + localizedDigits(employees) + ' کارمند' : customers + ' customers · ' + employees + ' employees') + '</div></div>'
    + '<div class="metric"><div class="metric-label">Active subscriptions</div><div class="metric-value">' + activeUsers + '</div><div class="metric-note">Eligible to earn referral commissions</div></div>'
    + '<div class="metric"><div class="metric-label">Welcome discounts used</div><div class="metric-value">' + money(discountSpend) + '</div><div class="metric-note">Debited from the Save Box</div></div></div>'
    + '<div class="section-row"><div><h2>Recent sales</h2><p>Every allocation is based on the amount actually paid.</p></div><button class="button button-quiet button-small" data-view="sales">All sales</button></div>'
    + recentSalesTable(state.sales);
}
function guideText(english, persian) {
  return uiLanguage === "fa" ? persian : english;
}
function guidePercent(value) {
  const raw = Number(value).toFixed(3).replace(/\.?0+$/, "");
  return uiLanguage === "fa" ? localizedDigits(raw) + "٪" : raw + "%";
}
function renderHowItWorks() {
  const settings = state.settings;
  const samplePlan = planById("bronze") || settings.plans[0] || { name: "Plan", price: 0 };
  const samplePrice = Math.max(0, Math.round(Number(samplePlan.price) || 0));
  const sampleShop = roundPct(samplePrice, settings.shopRate);
  const samplePool = Math.max(0, samplePrice - sampleShop);
  let sampleRemaining = BigInt(samplePool);
  const directShare = (sampleRemaining + 1n) / 2n;
  sampleRemaining -= directShare;
  const secondShare = (sampleRemaining + 1n) / 2n;
  sampleRemaining -= secondShare;
  const ceoShare = sampleRemaining / 2n;
  const saveBoxShare = sampleRemaining - ceoShare;
  const sampleDiscount = roundPct(samplePrice, settings.welcomeRate);
  const discountBalanceNeeded = minimumBalanceForDiscount(sampleDiscount);
  const discountBalanceText = discountBalanceNeeded == null
    ? guideText("Unavailable while the reserve is 100%", "با ذخیره ۱۰۰٪ قابل‌استفاده نیست")
    : money(discountBalanceNeeded);
  const directPaidPercent = Number(settings.referralRate) / 2;
  const nextPaidPercent = Number(settings.referralRate) / 4;
  const samplePlanName = esc(displayPlanName(samplePlan.name));
  const action = '<button class="button button-primary" data-action="new-sale" type="button">' + guideText("Record sale", "ثبت فروش") + '</button>';
  const exampleExplanation = uiLanguage === "fa"
    ? "در این نمونه، سهم فروشگاه " + money(sampleShop) + " و صندوق پورسانت " + money(samplePool) + " است. معرف مستقیم " + money(Number(directShare)) + " و معرف بعدی " + money(Number(secondShare)) + " دریافت می‌کنند. مانده " + money(Number(sampleRemaining)) + " به دو سهم مساوی " + money(Number(ceoShare)) + " برای مدیرعامل و " + money(Number(saveBoxShare)) + " برای صندوق ذخیره تقسیم می‌شود."
    : "In this example, the shop receives " + money(sampleShop) + " and the referral pool is " + money(samplePool) + ". The direct upline receives " + money(Number(directShare)) + " and the next upline receives " + money(Number(secondShare)) + ". The remaining " + money(Number(sampleRemaining)) + " splits equally: " + money(Number(ceoShare)) + " to the CEO and " + money(Number(saveBoxShare)) + " to the Save Box.";
  const planList = settings.plans.map(function (plan) {
    return '<span class="guide-plan"><strong data-preserve-content>' + esc(displayPlanName(plan.name)) + '</strong><span>' + money(plan.price) + '</span></span>';
  }).join("");

  return pageHead(guideText("How it works", "راهنمای سیستم"),
      guideText("A plain-language proposal for subscriptions, referral commissions, and the Save Box.", "شرح ساده و روشن سازوکار اشتراک‌ها، پورسانت ارجاع و صندوق ذخیره."), action)
    + '<div class="how-guide">'
    + '<section class="panel guide-flow"><div class="guide-flow-copy"><div class="eyebrow">' + guideText("One paid subscription", "یک اشتراک پرداخت‌شده") + '</div>'
    + '<h2>' + guideText("A clear path from payment to payout", "مسیر روشن از پرداخت تا تخصیص درآمد") + '</h2>'
    + '<p>' + guideText("The customer’s actual payment is divided once: the shop receives its allocation, and the full referral pool flows up the inviter chain.", "مبلغی که مشتری واقعاً می‌پردازد یک‌بار تقسیم می‌شود: سهم فروشگاه ثبت می‌شود و کل صندوق پورسانت در زنجیره معرف‌ها به سمت بالا حرکت می‌کند.") + '</p></div>'
    + '<div class="guide-flow-numbers"><div class="guide-flow-number shop"><span>' + guideText("Shop", "فروشگاه") + '</span><strong>' + guidePercent(settings.shopRate) + '</strong><small>' + guideText("of the amount paid", "از مبلغ پرداختی") + '</small></div>'
    + '<div class="guide-flow-number referral"><span>' + guideText("Referral pool", "صندوق پورسانت") + '</span><strong>' + guidePercent(settings.referralRate) + '</strong><small>' + guideText("all of it enters the waterfall", "تمام آن وارد زنجیره تخصیص می‌شود") + '</small></div></div>'
    + '<div class="guide-split-bar" aria-label="' + esc(guideText("Shop and referral allocation", "تخصیص فروشگاه و پورسانت")) + '"><span class="guide-split-shop" style="width:' + Math.max(0, Math.min(100, Number(settings.shopRate) || 0)) + '%"></span><span class="guide-split-referral" style="width:' + Math.max(0, Math.min(100, Number(settings.referralRate) || 0)) + '%"></span></div>'
    + '<div class="guide-flow-caption">' + guideText("The Save Box is not deducted first. It receives half of the amount left when the waterfall reaches the CEO.", "سهم صندوق ذخیره از ابتدا کسر نمی‌شود؛ وقتی زنجیره به ردیف مدیرعامل برسد، صندوق نیمی از مبلغ باقی‌مانده را دریافت می‌کند.") + '</div></section>'
    + '<section class="panel guide-waterfall"><div class="guide-section-head"><div><h2>' + guideText("The referral waterfall", "نحوه تقسیم صندوق پورسانت") + '</h2><p>' + guideText("Each user upline receives half of what remains. These shares are percentages of the original pool.", "هر کاربر بالادستی نصف مبلغ باقی‌مانده را می‌گیرد. این سهم‌ها به‌ترتیب ۵۰٪، ۲۵٪، ۱۲٫۵٪ و درصدهای بعدیِ صندوق اولیه هستند.") + '</p></div>'
    + '<span class="guide-pool-tag">' + guidePercent(settings.referralRate) + ' ' + guideText("total pool", "کل صندوق") + '</span></div>'
    + '<div class="guide-steps"><article class="guide-step"><span class="guide-step-index">' + localizedDigits("01") + '</span><h3>' + guideText("Direct upline", "معرف مستقیم") + '</h3><strong>' + guidePercent(50) + '</strong><p>' + guideText("of the original referral pool", "از کل صندوق پورسانت") + '<br><span>' + guidePercent(directPaidPercent) + ' ' + guideText("of the amount paid at the current pool rate", "از مبلغ پرداختی با درصد فعلی صندوق") + '</span></p></article>'
    + '<article class="guide-step"><span class="guide-step-index">' + localizedDigits("02") + '</span><h3>' + guideText("Next upline", "معرف بعدی") + '</h3><strong>' + guidePercent(25) + '</strong><p>' + guideText("of the original referral pool", "از کل صندوق پورسانت") + '<br><span>' + guidePercent(nextPaidPercent) + ' ' + guideText("of the amount paid at the current pool rate", "از مبلغ پرداختی با درصد فعلی صندوق") + '</span></p></article>'
    + '<article class="guide-step"><span class="guide-step-index">' + localizedDigits("03") + '</span><h3>' + guideText("Higher uplines", "معرف‌های بالاتر") + '</h3><strong>' + guidePercent(12.5) + ' …</strong><p>' + guideText("Each further user gets half the previous share. The chain has no fixed depth limit.", "سهم هر کاربر بالاتر نصف سهم قبلی است. زنجیره محدودیت تعداد سطح ندارد.") + '</p></article>'
    + '<article class="guide-step guide-step-ceo"><span class="guide-step-index">' + guideText("CEO", "مدیرعامل") + '</span><h3>' + guideText("CEO row", "ردیف مدیرعامل") + '</h3><strong>' + localizedDigits("50 / 50") + '</strong><p>' + guideText("The remaining amount is divided equally between the CEO and Save Box.", "مبلغ باقی‌مانده به‌طور مساوی بین مدیرعامل و صندوق ذخیره تقسیم می‌شود.") + '</p></article></div>'
    + '<div class="guide-flow-caption guide-no-upline">' + guideText("If no user upline is linked, the full referral pool reaches the CEO row and is split equally between the CEO and Save Box.", "اگر هیچ کاربر بالادستی ثبت نشده باشد، کل صندوق پورسانت به ردیف مدیرعامل می‌رسد و به‌طور مساوی بین مدیرعامل و صندوق ذخیره تقسیم می‌شود.") + '</div></section>'
    + '<section class="panel guide-example"><div class="guide-section-head"><div><h2>' + guideText("Worked example", "نمونه محاسبه") + '</h2><p>' + guideText("A full-price ", "یک اشتراک ") + '<span data-preserve-content>' + samplePlanName + '</span>' + guideText(" sale, no discount, and two user uplines. The amounts update with the plan and allocation settings.", " با قیمت کامل، بدون تخفیف و با دو کاربر بالادستی. مبالغ با تغییر قیمت طرح و درصدهای تخصیص به‌روزرسانی می‌شوند.") + '</p></div><span class="guide-example-price">' + money(samplePrice) + '</span></div>'
    + '<div class="table-wrap"><table class="guide-table"><thead><tr><th>' + guideText("Allocation", "تخصیص") + '</th><th>' + guideText("Share", "سهم") + '</th><th>' + guideText("Amount", "مبلغ") + '</th></tr></thead><tbody>'
    + '<tr><td>' + guideText("Shop", "فروشگاه") + '</td><td>' + guidePercent(settings.shopRate) + '</td><td class="amount">' + money(sampleShop) + '</td></tr>'
    + '<tr><td>' + guideText("Full referral pool", "کل صندوق پورسانت") + '</td><td>' + guidePercent(settings.referralRate) + '</td><td class="amount">' + money(samplePool) + '</td></tr>'
    + '<tr><td>' + guideText("Direct upline", "معرف مستقیم") + '</td><td>' + guidePercent(50) + ' ' + guideText("of pool", "از صندوق") + '</td><td class="amount">' + money(Number(directShare)) + '</td></tr>'
    + '<tr><td>' + guideText("Next upline", "معرف بعدی") + '</td><td>' + guidePercent(25) + ' ' + guideText("of pool", "از صندوق") + '</td><td class="amount">' + money(Number(secondShare)) + '</td></tr>'
    + '<tr class="guide-remainder-row"><td>' + guideText("CEO share of the remainder", "سهم مدیرعامل از مانده") + '</td><td>' + localizedDigits("50 / 50") + '</td><td class="amount">' + money(Number(ceoShare)) + '</td></tr>'
    + '<tr class="guide-remainder-row"><td>' + guideText("Save Box share of the remainder", "سهم صندوق ذخیره از مانده") + '</td><td>' + localizedDigits("50 / 50") + '</td><td class="amount">' + money(Number(saveBoxShare)) + '</td></tr>'
    + '</tbody></table></div><div class="guide-example-note">' + exampleExplanation + '</div></section>'
    + '<div class="guide-details"><section class="panel guide-detail"><div class="guide-detail-mark">A</div><div><h2>' + guideText("People and referrals", "کاربران و ارجاع‌ها") + '</h2><p>' + guideText("The CEO is the root, not a user in the referral chain. Employees and customers are users. Employees report to the CEO; customers may be referred by an employee or another customer. The tree can grow to any depth.", "مدیرعامل ریشه درخت است و در زنجیره کاربران قرار نمی‌گیرد. کارمندان و مشتریان همگی کاربر هستند. کارمندان مستقیماً زیرمجموعه مدیرعامل‌اند؛ مشتریان را کارمند یا مشتری دیگری می‌تواند معرفی کند. درخت ارجاع محدودیت عمق ندارد.") + '</p><div class="guide-plan-list"><strong>' + guideText("Subscription plans", "طرح‌های اشتراک") + '</strong>' + planList + '</div></div></section>'
    + '<section class="panel guide-detail"><div class="guide-detail-mark guide-mark-blue">B</div><div><h2>' + guideText("When a user earns", "شرایط دریافت پورسانت") + '</h2><p>' + guideText("A commission is created only by a paid subscription sale, never by creating an account or recruiting someone. An upline must have an active subscription when the lower-level sale is paid. If it has expired, that person’s calculated share goes to the CEO; it is not redistributed or paid back after renewal.", "پورسانت فقط با فروش اشتراکِ پرداخت‌شده ایجاد می‌شود؛ ساخت حساب یا جذب کاربر به‌تنهایی پورسانت ندارد. اشتراک کاربر بالادستی باید هنگام پرداخت فروش کاربر پایین‌تر فعال باشد. اگر اشتراک منقضی شده باشد، سهم محاسبه‌شده آن کاربر به مدیرعامل می‌رسد و بین دیگران تقسیم نمی‌شود یا پس از تمدید به او بازگردانده نمی‌شود.") + '</p><p class="guide-detail-note">' + guideText("A paid subscription lasts one calendar month by default. Renewals before expiry extend the term; renewals after expiry start a new term on the payment date.", "اعتبار پیش‌فرض اشتراکِ پرداخت‌شده یک ماه تقویمی است. تمدید پیش از انقضا مدت را ادامه می‌دهد؛ تمدید پس از انقضا از تاریخ پرداخت دوره جدیدی را آغاز می‌کند.") + '</p></div></section>'
    + '<section class="panel guide-detail guide-detail-wide"><div class="guide-detail-mark guide-mark-amber">C</div><div><h2>' + guideText("How the Save Box funds discounts", "نحوه تأمین تخفیف از صندوق ذخیره") + '</h2><p>' + guideText("The Save Box is a separate balance. It receives half of the remainder at the CEO row, so its contribution depends on how many user uplines are in the chain. It is not a fixed deduction from the 21% pool and is separate from the CEO’s own pocket.", "صندوق ذخیره موجودی جداگانه‌ای دارد. صندوق نصف مبلغ باقی‌مانده در ردیف مدیرعامل را می‌گیرد؛ بنابراین واریزی آن به تعداد کاربران بالادستی بستگی دارد. این مبلغ از ابتدا به‌صورت درصد ثابتی از صندوق ۲۱٪ کسر نمی‌شود و حساب مدیرعامل نیز جداست.") + '</p><p>' + guideText("The default welcome discount is 5% on a user’s first paid subscription. The existing Save Box balance must fund it while preserving the configured reserve and campaign budget. A sale cannot use its own Save Box contribution to qualify for its discount.", "تخفیف خوش‌آمدگویی پیش‌فرض برای اولین اشتراک پرداخت‌شده هر کاربر ۵٪ است. موجودی قبلی صندوق ذخیره باید مبلغ تخفیف را تأمین کند و ذخیره و بودجه کمپین تعیین‌شده را حفظ کند. فروش جدید نمی‌تواند با واریزی خودش واجد شرایط تخفیف شود.") + '</p><div class="guide-discount-example"><span>' + guideText("Current first-purchase discount on ", "تخفیف خرید اول فعلی برای طرح ") + '<span data-preserve-content>' + samplePlanName + '</span><strong>' + guidePercent(settings.welcomeRate) + ' · ' + money(sampleDiscount) + '</strong><small>' + guideText("Minimum Save Box balance now: ", "حداقل موجودی فعلی صندوق ذخیره: ") + discountBalanceText + '</small></div><div class="guide-caution">' + guideText("The shop allocation is before payment fees, taxes, refunds, and operating costs. It is not net profit.", "سهم فروشگاه پیش از کسر کارمزد پرداخت، مالیات، بازپرداخت و هزینه‌های عملیاتی است و سود خالص محسوب نمی‌شود.") + '</div></div></section></div>';
}
function customerOptions(selected) {
  const people = state.people.filter(function (p) { return p.role !== "owner"; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  return '<option value="">Choose a user</option>' + people.map(function (p) {
    return '<option data-preserve-content value="' + esc(p.id) + '"' + (p.id === selected ? " selected" : "") + '>' + esc(p.name) + ' · ' + roleLabel(p.role) + ' · ' + displayLevel(levelOf(p)) + '</option>';
  }).join("");
}
function planOptions(selected) {
  return state.settings.plans.map(function (p) {
    return '<option data-preserve-content value="' + esc(p.id) + '"' + (p.id === selected ? " selected" : "") + '>' + esc(displayPlanName(p.name)) + ' · ' + money(p.price) + '</option>';
  }).join("");
}
function salePreviewHtml(customerId, planId, useDiscount) {
  if (!customerId || !planId) return '<div class="inline-note">Choose a user and plan to preview the sale split.</div>';
  const info = saleDiscountInfo(customerId, planId);
  const eligible = info.eligible;
  const discount = useDiscount && eligible ? info.discount : 0;
  const calc = calculateSale(customerId, planId, discount > 0);
  let note = "";
  if (uiLanguage === "fa") {
    if (!info.firstSale) note = '<div class="inline-note warning">این کاربر قبلاً خرید پرداخت‌شده داشته است؛ تخفیف خوش‌آمدگویی دیگر در دسترس نیست.</div>';
    else if (!eligible) note = '<div class="inline-note warning">' + esc(discountRequirementText(info.reserveRequirement)) + (info.reserveRequirement == null ? "" : ' موجودی فعلی: ' + money(info.boxBalance) + '.') + '</div>';
    else if (useDiscount) note = '<div class="inline-note">تخفیف از موجودی قبلی صندوق ذخیره تأمین می‌شود. فروش جدید نمی‌تواند هزینه تخفیف خودش را تأمین کند.</div>';
    else note = '<div class="inline-note">این کاربر برای تخفیف خوش‌آمدگویی یک‌باره ' + localizedDigits(state.settings.welcomeRate) + '٪ واجد شرایط است؛ به شرط آنکه موجودی صندوق ذخیره کافی باشد.</div>';
  } else if (!info.firstSale) note = '<div class="inline-note warning">This user already has a paid purchase. The welcome discount is no longer available.</div>';
  else if (!eligible) note = '<div class="inline-note warning">' + esc(discountRequirementText(info.reserveRequirement)) + (info.reserveRequirement == null ? "" : ' Current balance: ' + money(info.boxBalance) + '.') + '</div>';
  else if (useDiscount) note = '<div class="inline-note">Welcome discount is funded by the existing Save Box balance. The new sale cannot fund its own discount.</div>';
  else note = '<div class="inline-note">This user is eligible for a one-time ' + state.settings.welcomeRate + '% welcome discount when the Save Box has enough balance.</div>';
  const ancestorRows = calc.commissions.map(function (c) {
    const distance = uiLanguage === "fa" ? localizedDigits(c.distance) + " سطح بالاتر" : c.distance + (c.distance === 1 ? " level above" : " levels above");
    const activeBadge = c.active ? (uiLanguage === "fa" ? "فعال" : "Active") : (uiLanguage === "fa" ? "به مدیرعامل؛ غیرفعال" : "To CEO · inactive");
    const rate = uiLanguage === "fa" ? localizedDigits(c.rate) + "٪ از صندوق" : c.rate + "% of pool";
    return '<div class="allocation-row"><span><span data-preserve-content>' + esc(c.name) + '</span> <span class="muted">· ' + distance + ' · ' + rate + '</span> <span class="badge ' + (c.active ? "badge-sub-active" : "badge-sub-expired") + '">' + activeBadge + '</span></span><strong>' + money(c.amount) + '</strong></div>';
  }).join("");
  const noUplineNote = uiLanguage === "fa"
    ? '<div class="inline-note">هیچ کاربر بالادستی ثبت نشده است؛ مدیرعامل و صندوق ذخیره کل صندوق پورسانت را به‌طور مساوی تقسیم می‌کنند.</div>'
    : '<div class="inline-note">No user uplines are linked. The CEO and Save Box split the full referral pool equally.</div>';
  return '<div class="allocation-row"><span>List price</span><strong>' + money(calc.listPrice) + '</strong></div>'
    + (discount ? '<div class="allocation-row"><span>Welcome discount</span><strong class="ledger-sign negative">−' + money(discount) + '</strong></div>' : "")
    + '<div class="allocation-row total"><span>User pays</span><strong>' + money(calc.paid) + '</strong></div>'
    + '<div class="allocation-row"><span>' + (uiLanguage === "fa" ? "سهم فروشگاه · " + localizedDigits(state.settings.shopRate) + "٪" : "Shop allocation · " + state.settings.shopRate + "%") + '</span><strong>' + money(calc.shopAllocation) + '</strong></div>'
    + '<div class="allocation-row"><span>' + (uiLanguage === "fa" ? "کل صندوق پورسانت · " + localizedDigits(state.settings.referralRate) + "٪" : "Total referral pool · " + state.settings.referralRate + "%") + '</span><strong>' + money(calc.referralPool) + '</strong></div>'
    + (calc.roundingAdjustment ? '<div class="allocation-row"><span>Rounding adjustment to referral pool</span><strong>' + (calc.roundingAdjustment > 0 ? '+' : '−') + money(Math.abs(calc.roundingAdjustment)) + '</strong></div>' : "")
    + '<div class="allocation-row"><span>Upline commission allocations</span><strong>' + money(calc.uplineCommissionTotal) + '</strong></div>'
    + (calc.commissions.length ? ancestorRows : noUplineNote)
    + (calc.ownerRoutedCommission ? '<div class="allocation-row box-line"><span>Expired users’ shares routed to the CEO</span><strong>' + money(calc.ownerRoutedCommission) + '</strong></div>' : "")
    + '<div class="allocation-row"><span>CEO share of remaining pool</span><strong>' + money(calc.ownerResidual) + '</strong></div>'
    + '<div class="allocation-row box-line"><span>Save Box share of CEO-row remainder</span><strong>' + money(calc.saveBoxDeposit) + '</strong></div>'
    + '<div class="preview-note">' + note + '</div>';
}
function salesReportPanel(title, subtitle, rows, emptyMessage) {
  return '<section class="panel report-card"><div><h2>' + title + '</h2><p>' + subtitle + '</p></div>' + (rows.length
    ? '<div class="table-wrap"><table><thead><tr><th>Group</th><th>Sales</th><th>Paid amount</th></tr></thead><tbody>' + rows.map(function (row) {
      return '<tr><td><span data-preserve-content>' + esc(row.label) + '</span></td><td>' + row.count + '</td><td class="amount">' + money(row.amount) + '</td></tr>';
    }).join("") + '</tbody></table></div>'
    : '<div class="empty-report">' + emptyMessage + '</div>') + '</section>';
}
function groupedPaidSales(groupFor) {
  const groups = new Map();
  state.sales.filter(function (sale) { return sale.status === "paid"; }).forEach(function (sale) {
    const group = groupFor(sale);
    const current = groups.get(group.key) || { key: group.key, label: group.label, count: 0, amount: 0 };
    current.count += 1;
    current.amount += Number(sale.amountPaid || 0);
    groups.set(group.key, current);
  });
  return Array.from(groups.values()).sort(function (a, b) { return b.amount - a.amount || a.label.localeCompare(b.label); });
}
function renderSalesReports() {
  const byPlan = groupedPaidSales(function (sale) {
    return { key: sale.planId, label: displayPlanName(sale.planName || ((planById(sale.planId) || {}).name || "Plan")) };
  });
  const byLevel = groupedPaidSales(function (sale) {
    const customer = personById(sale.customerId);
    const level = customer ? levelOf(customer) : 0;
    return { key: String(level), label: level ? displayLevel(level) : translateText("Unknown level") };
  });
  const byDate = groupedPaidSales(function (sale) {
    const date = sale.paidAt || sale.createdAt;
    const label = formatDate(date);
    return { key: new Date(date).toISOString().slice(0, 10), label: label };
  }).sort(function (a, b) { return b.key.localeCompare(a.key); });
  return '<div class="section-row"><div><h2>Sales dashboard</h2><p>Paid subscriptions only; refunded sales are excluded from these totals.</p></div></div><div class="report-grid">'
    + salesReportPanel("By plan", "Paid revenue for each subscription plan.", byPlan, "No paid sales yet.")
    + salesReportPanel("By buyer level", "The buyer’s depth in the referral tree.", byLevel, "No paid sales yet.")
    + salesReportPanel("By paid date", "Daily paid subscription totals.", byDate, "No paid sales yet.") + '</div>';
}
function renderSales() {
  const customers = state.people.filter(function (p) { return p.role !== "owner"; });
  const salesTable = state.sales.length ? '<div class="panel table-wrap"><table><thead><tr><th>Buyer</th><th>Plan</th><th>Status</th><th>Discount</th><th>Amount paid</th><th>Actions</th></tr></thead><tbody>' +
    state.sales.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).map(function (s) {
      let actions = "";
      if (s.status === "pending") actions = '<button class="button button-primary button-small" data-action="mark-paid" data-id="' + esc(s.id) + '">Mark paid</button>';
      if (s.status === "paid") actions = '<button class="button button-danger button-small" data-action="refund-sale" data-id="' + esc(s.id) + '">Refund</button>';
      return '<tr><td><span data-preserve-content>' + esc(s.customerName || personName(s.customerId)) + '</span></td><td><span data-preserve-content>' + esc(displayPlanName(s.planName || ((planById(s.planId) || {}).name || "Plan"))) + '</span>' +
        '</td><td>' + saleStatusBadge(s.status) + '</td><td class="amount">' + (s.discountAmount ? money(s.discountAmount) : "—") +
        '</td><td class="amount">' + money(s.amountPaid != null ? s.amountPaid : s.priceSnapshot || 0) + '</td><td>' + actions + '</td></tr>';
    }).join("") + '</tbody></table></div>' : emptyState("No sales yet", "Add an employee or customer user first, then record their subscription here.", "Add a user", "go-people");
  const monthsText = uiLanguage === "fa"
    ? "اشتراک پرداخت‌شده، کاربر را برای " + localizedDigits(state.settings.subscriptionMonths) + " ماه فعال می‌کند. تمدید پیش از انقضا از پایان دوره فعلی ادامه می‌یابد؛ تمدید پس از انقضا از تاریخ پرداخت آغاز می‌شود و در فاصله بدون اشتراک، پورسانتی تعلق نمی‌گیرد. کاربران فعال می‌توانند از فروش سطوح پایین‌تر پورسانت بگیرند؛ مدیرعامل از شرط اشتراک معاف است."
    : "A paid subscription activates the user for " + state.settings.subscriptionMonths + (state.settings.subscriptionMonths === 1 ? " calendar month" : " calendar months") + ". A renewal before expiry extends the current term; a renewal after expiry starts on its payment date, with no coverage or commissions for the gap. Active users may earn from lower-level sales; the CEO is exempt.";
  return pageHead("Sales", "Record user subscriptions and preview the exact split before a purchase is posted.")
    + '<div class="two-col"><section class="panel form-panel"><h2>Record or renew a subscription</h2><p class="form-intro">' + monthsText + '</p>'
    + (customers.length ? '<form id="sale-form"><div class="field"><label for="sale-customer">User / buyer</label><select id="sale-customer" name="customerId" required>' + customerOptions("") + '</select></div>'
      + '<div class="field"><label for="sale-plan">Subscription plan</label><select id="sale-plan" name="planId" required>' + planOptions("bronze") + '</select></div>'
      + '<label class="check-row"><input type="checkbox" id="sale-discount" name="welcomeRequested"><span><strong>Use the welcome discount</strong><small>' + (uiLanguage === "fa" ? "تخفیف یک‌باره " + localizedDigits(state.settings.welcomeRate) + "٪ برای اولین اشتراک پرداخت‌شده کاربر. موجودی قطعی صندوق ذخیره باید مبلغ آن را پوشش دهد و ذخیره تعیین‌شده حفظ شود." : "One-time " + state.settings.welcomeRate + "% off the user’s first paid subscription. The cleared Save Box balance must cover it while preserving its reserve.") + '</small></span></label>'
      + '<div class="field" style="margin-top:12px"><label for="sale-status">Payment status</label><select id="sale-status" name="status"><option value="paid">Paid — post allocations now</option><option value="pending">Pending — post later</option></select></div>'
      + '<div class="form-actions"><button class="button button-primary" type="submit">Save subscription</button><button class="button button-quiet" type="reset">Clear</button></div></form>'
      : emptyState("Add a user to begin", "Create an employee or customer user first. Their inviter determines the referral chain.", "Add a user", "go-people"))
    + '</section><section class="panel preview-panel"><div class="preview-head"><h2>Live allocation preview</h2><p>Uses the selected plan, buyer, current settings, and available Save Box balance.</p></div><div class="preview-body" id="sale-preview">' + salePreviewHtml("", "", false) + '</div></section></div>'
    + '<div class="section-row"><div><h2>Subscription history</h2><p>Pending purchases have no posted allocations.</p></div></div>' + salesTable + renderSalesReports();
}
function referrerOptions(selected, excludedId, role) {
  const allowed = role === "employee" ? function (p) { return p.role === "owner"; } : function (p) { return p.role === "employee" || p.role === "customer"; };
  const people = state.people.filter(function (p) { return p.id !== excludedId && allowed(p); }).sort(function (a, b) {
    const la = levelOf(a), lb = levelOf(b);
    return la - lb || a.name.localeCompare(b.name);
  });
  return (role === "employee" ? "" : '<option value="">No inviter (shop sale)</option>') + people.map(function (p) {
    return '<option data-preserve-content value="' + esc(p.id) + '"' + (p.id === selected ? " selected" : "") + '>' + esc(p.name) + ' · ' + roleLabel(p.role) + ' · ' + displayLevel(levelOf(p)) + '</option>';
  }).join("");
}
function invitedCount(id) {
  return state.people.filter(function (p) { return p.referrerId === id; }).length;
}
function renderPeople() {
  const editing = editingPersonId ? personById(editingPersonId) : null;
  const people = state.people.filter(function (p) { return p.role !== "owner"; }).sort(function (a, b) {
    return levelOf(a) - levelOf(b) || a.name.localeCompare(b.name);
  });
  const credentials = readAccountStore().accounts;
  const rows = people.length ? '<div class="panel table-wrap"><table><thead><tr><th>User</th><th>User type</th><th>Subscription</th><th>Level</th><th>Invited by</th><th>Direct referrals</th><th>Account access</th><th></th></tr></thead><tbody>' +
    people.map(function (p) {
      const parent = personById(p.referrerId);
      const membership = subscriptionState(p);
      const access = credentials[p.id] || (usingDemoWorkspace && p.id === "demo-user" ? credentials["builtin-demo"] : null);
      return '<tr><td><div class="person-cell"><span class="avatar ' + roleClass(p.role) + '">' + esc(initials(p.name)) + '</span><span data-preserve-content>' + esc(p.name) + '</span></div></td>'
        + '<td><span class="badge badge-' + (p.role === "employee" ? "employee" : "customer") + '">' + roleLabel(p.role) + '</span></td>'
        + '<td><span class="badge ' + (membership.active ? 'badge-sub-active' : 'badge-sub-expired') + '">' + membership.label + '</span>' + (membership.detail ? '<div class="muted" style="margin-top:3px">' + esc(membership.detail) + '</div>' : '') + '</td>'
        + '<td>' + displayLevel(levelOf(p)) + '</td><td>' + (parent ? '<span data-preserve-content>' + esc(parent.name) + '</span>' : '<span class="muted">No inviter</span>') + '</td>'
        + '<td>' + invitedCount(p.id) + '</td><td>' + (access ? '<span class="badge badge-sub-active">' + translateText("Sign-in enabled") + '</span><div class="muted" data-preserve-content style="margin-top:3px">' + esc(access.username) + '</div>' : '<span class="badge badge-sub-expired">' + translateText("Not set up") + '</span>') + '</td>'
        + '<td><div class="member-user-actions"><button class="button button-quiet button-small" data-action="view-member" data-id="' + esc(p.id) + '">View panel</button><button class="button button-quiet button-small" data-action="edit-person" data-id="' + esc(p.id) + '">Edit</button></div></td></tr>';
    }).join("") + '</tbody></table></div>' : emptyState("No users added", "Add an employee or customer user, then link them to the person who invited them.", "", "");
  const managedPeople = people.filter(function (person) { return !(usingDemoWorkspace && person.id === "demo-user"); });
  const managedAccounts = (signedInAccountId === "owner" ? [{ id: "owner", name: "Shop Owner" }] : []).concat(managedPeople);
  const defaultAccountId = managedAccounts.length ? managedAccounts[0].id : "owner";
  const loginOptions = managedAccounts.map(function (person) {
    return '<option value="' + esc(person.id) + '">' + esc(person.name) + (person.id === "owner" ? "" : " · " + roleLabel(person.role)) + '</option>';
  }).join("");
  const currentCredential = credentials[defaultAccountId] || {};
  const accountAccess = '<section class="panel account-access-panel"><h2>' + translateText("Manage member sign-in") + '</h2><p>' + translateText("Select a user, choose a username, and set a password. Share the credentials directly with that person.") + '</p>'
    + '<form id="account-access-form" class="account-access-form"><div class="field"><label for="account-user">' + translateText("User account") + '</label><select id="account-user" name="accountId">' + loginOptions + '</select></div>'
    + '<div class="field"><label for="account-username">' + translateText("Username") + '</label><input id="account-username" name="username" autocomplete="off" required minlength="3" maxlength="40" value="' + esc(currentCredential.username || (defaultAccountId === "owner" ? "owner" : "")) + '"></div>'
    + '<div class="field"><label for="account-password">' + translateText("New or reset password") + '</label><input id="account-password" name="password" type="password" autocomplete="new-password" required minlength="10"></div>'
    + '<div class="account-access-actions"><button class="button button-primary" type="submit">' + translateText("Save login") + '</button><button class="button button-quiet" type="button" data-action="disable-login">' + translateText("Disable login") + '</button></div></form>'
    + '<div class="inline-note account-access-warning"><strong>' + translateText("Local-only sign-in") + ':</strong> ' + translateText("This prototype keeps workspace records in this browser. Use server-side authentication and per-user data authorization before exposing accounts on a network or public website.") + '</div>'
    + '</section>';
  return pageHead("Users", "Every employee and customer is a user. The CEO is the separate referral-tree root. A user earns from lower-level sales only while their own subscription is active; an expired user’s share goes to the CEO and is not paid back after renewal.")
    + '<div class="two-col"><section class="panel form-panel"><h2>' + (editing ? "Edit user" : "Add a user") + '</h2><p class="form-intro">Choose the user type, then link them to their direct inviter. Referral levels are calculated automatically.</p>'
    + '<form id="person-form"><input type="hidden" name="personId" value="' + (editing ? esc(editing.id) : "") + '">'
    + '<div class="field"><label for="person-name">Name</label><input id="person-name" name="name" required maxlength="80" placeholder="e.g. Sam Lee" value="' + (editing ? esc(editing.name) : "") + '"></div>'
    + '<div class="field"><label for="person-role">User type</label><select id="person-role" name="role"><option value="customer"' + (editing && editing.role === "employee" ? "" : " selected") + '>Customer</option><option value="employee"' + (editing && editing.role === "employee" ? " selected" : "") + '>Employee</option></select></div>'
    + '<div class="field"><label for="person-referrer">Direct inviter</label><select id="person-referrer" name="referrerId">' + referrerOptions(editing ? editing.referrerId : null, editing ? editing.id : null, editing ? editing.role : "customer") + '</select></div>'
    + '<div class="form-actions"><button class="button button-primary" type="submit">' + (editing ? "Save changes" : "Add user") + '</button>'
    + (editing ? '<button class="button button-quiet" type="button" data-action="cancel-edit">Cancel</button>' : "") + '</div></form></section>'
    + '<section><div class="section-row" style="margin-top:0"><div><h2>Users in the network</h2><p>' + (uiLanguage === "fa" ? localizedDigits(people.length) + ' کاربر · عمق ارجاع نامحدود' : people.length + ' users · unlimited referral depth') + '</p></div></div>' + rows + '</section></div>' + accountAccess;
}
function memberChildrenIndex(rootPersonId) {
  const index = new Map();
  const excludedAncestors = new Set();
  let cursor = personById(rootPersonId);
  let parentId = cursor && cursor.referrerId;
  let guard = 0;
  while (parentId && guard <= state.people.length) {
    if (parentId === rootPersonId || excludedAncestors.has(parentId)) break;
    const parent = personById(parentId);
    if (!parent || parent.role === "owner") break;
    excludedAncestors.add(parent.id);
    parentId = parent.referrerId;
    guard += 1;
  }
  state.people.forEach(function (person) {
    if (person.role === "owner" || person.id === rootPersonId || excludedAncestors.has(person.id)) return;
    if (!index.has(person.referrerId)) index.set(person.referrerId, []);
    index.get(person.referrerId).push(person);
  });
  index.forEach(function (children) { children.sort(function (a, b) { return a.name.localeCompare(b.name); }); });
  return index;
}
function memberProfileStats(person, childrenIndex) {
  const teamIds = [];
  const seenTeamIds = new Set([person.id]);
  const teamStack = (childrenIndex.get(person.id) || []).map(function (child) { return child.id; });
  while (teamStack.length) {
    const id = teamStack.pop();
    if (seenTeamIds.has(id)) continue;
    seenTeamIds.add(id);
    teamIds.push(id);
    (childrenIndex.get(id) || []).forEach(function (child) { teamStack.push(child.id); });
  }
  const teamIdSet = new Set(teamIds);
  const paidByUser = new Map();
  const paidSales = state.sales.filter(function (sale) { return sale.status === "paid" && teamIdSet.has(sale.customerId); });
  paidSales.forEach(function (sale) {
    const summary = paidByUser.get(sale.customerId) || { count: 0, volume: 0 };
    summary.count += 1;
    summary.volume += Number(sale.amountPaid || 0);
    paidByUser.set(sale.customerId, summary);
  });
  const ordered = [];
  const orderedSet = new Set([person.id]);
  const stack = (childrenIndex.get(person.id) || []).map(function (child) { return child.id; });
  while (stack.length) {
    const id = stack.pop();
    if (orderedSet.has(id)) continue;
    orderedSet.add(id);
    ordered.push(id);
    (childrenIndex.get(id) || []).forEach(function (child) { stack.push(child.id); });
  }
  const subtree = new Map();
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const id = ordered[i];
    const user = personById(id);
    const ownSales = paidByUser.get(id) || { count: 0, volume: 0 };
    const value = {
      members: 1,
      active: subscriptionActiveAt(user) ? 1 : 0,
      paidSales: ownSales.count,
      volume: ownSales.volume
    };
    (childrenIndex.get(id) || []).forEach(function (child) {
      const childValue = subtree.get(child.id);
      if (!childValue) return;
      value.members += childValue.members;
      value.active += childValue.active;
      value.paidSales += childValue.paidSales;
      value.volume += childValue.volume;
    });
    subtree.set(id, value);
  }
  const commissionAccount = "person:" + person.id;
  const commissionEntries = state.ledger.filter(function (entry) { return entry.account === commissionAccount; })
    .slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const commissionTotal = commissionEntries.reduce(function (sum, entry) { return sum + Number(entry.delta || 0); }, 0);
  const commissionThisMonth = commissionEntries.reduce(function (sum, entry) {
    return new Date(entry.date).getTime() >= currentMonthStart.getTime() ? sum + Number(entry.delta || 0) : sum;
  }, 0);
  const routedTypes = new Set(["Expired-upline commission to CEO"]);
  const routedToCeo = state.ledger.filter(function (entry) {
    return entry.personId === person.id && (routedTypes.has(entry.type)
      || (entry.type === "Refund reversal" && String(entry.note || "").indexOf("Expired-upline commission to CEO") >= 0));
  }).reduce(function (sum, entry) { return sum + Number(entry.delta || 0); }, 0);
  const salesById = new Map(state.sales.map(function (sale) { return [sale.id, sale]; }));
  const branchCommission = new Map();
  commissionEntries.forEach(function (entry) {
    const sale = salesById.get(entry.saleId);
    let buyer = sale ? personById(sale.customerId) : null;
    const buyerPath = [];
    const visitedBuyerIds = new Set();
    let guard = 0;
    while (buyer && buyer.id !== person.id && !visitedBuyerIds.has(buyer.id) && guard < state.people.length) {
      visitedBuyerIds.add(buyer.id);
      buyerPath.push(buyer);
      buyer = personById(buyer.referrerId);
      guard += 1;
    }
    if (buyer && buyer.id === person.id) {
      buyerPath.forEach(function (branchPerson) {
        branchCommission.set(branchPerson.id, (branchCommission.get(branchPerson.id) || 0) + Number(entry.delta || 0));
      });
    }
  });
  const ownHistory = state.sales.filter(function (sale) {
    return sale.customerId === person.id && (sale.status === "paid" || sale.status === "refunded");
  }).slice().sort(function (a, b) { return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt); });
  const successfulHistory = ownHistory.filter(function (sale) { return sale.status === "paid"; });
  const teamPaidSales = paidSales.length;
  const teamPaidVolume = paidSales.reduce(function (sum, sale) { return sum + Number(sale.amountPaid || 0); }, 0);
  return {
    teamIds: teamIds,
    subtree: subtree,
    directChildren: childrenIndex.get(person.id) || [],
    teamPaidSales: teamPaidSales,
    teamPaidVolume: teamPaidVolume,
    activeTeam: Array.from(teamIds).filter(function (id) { return subscriptionActiveAt(personById(id)); }).length,
    commissionEntries: commissionEntries,
    commissionTotal: commissionTotal,
    commissionThisMonth: commissionThisMonth,
    routedToCeo: routedToCeo,
    branchCommission: branchCommission,
    ownHistory: ownHistory,
    latestSubscription: successfulHistory[0] || null
  };
}
function memberTreeHtml(person, stats, childrenIndex) {
  const membership = subscriptionState(person);
  const level = levelOf(person);
  let html = '<ul class="member-tree-list member-tree-root-list"><li class="member-tree-item member-tree-root-item"><article class="member-team-node member-team-root ' + (membership.active ? 'is-active' : 'is-inactive') + '">'
    + '<div class="member-team-main"><span class="avatar ' + roleClass(person.role) + '">' + esc(initials(person.name)) + '</span><span class="member-team-copy"><strong data-preserve-content>' + esc(person.name) + '</strong><small>' + guideText("Your account", "حساب شما") + ' · ' + roleLabel(person.role) + ' · ' + guideText("Company level ", "سطح در شبکه ") + localizedDigits(level) + '</small></span><span class="badge ' + (membership.active ? 'badge-sub-active' : 'badge-sub-expired') + '">' + membership.label + '</span></div>'
    + '<div class="member-team-stats"><span>' + localizedDigits(stats.directChildren.length) + ' ' + guideText("direct referrals", "معرف مستقیم") + '</span><span>' + localizedDigits(stats.teamIds.length) + ' ' + guideText("people below you", "نفر در سطوح پایین‌تر") + '</span></div>'
    + '</article>';
  if (!stats.directChildren.length) {
    html += '<div class="member-empty member-empty-compact"><strong>' + guideText("Your team starts with your first referral", "تیم شما با اولین فرد معرفی‌شده آغاز می‌شود") + '</strong><p>' + guideText("When someone joins through your invitation, their branch will appear here.", "پس از ثبت‌نام فردی با دعوت شما، شاخه او در این بخش نمایش داده می‌شود.") + '</p></div></li></ul>';
    return html;
  }
  html += '<ul class="member-tree-list">';
  const stack = [{ items: stats.directChildren, index: 0, level: 1, closesParent: false }];
  const rendered = new Set([person.id]);
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.items.length) {
      html += '</ul>';
      if (frame.closesParent) html += '</li>';
      stack.pop();
      continue;
    }
    const node = frame.items[frame.index++];
    if (rendered.has(node.id)) continue;
    rendered.add(node.id);
    const children = childrenIndex.get(node.id) || [];
    const membership = subscriptionState(node);
    const summary = stats.subtree.get(node.id) || { members: 1, active: membership.active ? 1 : 0, paidSales: 0, volume: 0 };
    const branchAmount = stats.branchCommission.get(node.id) || 0;
    const relativeLevel = frame.level;
    html += '<li class="member-tree-item"><article class="member-team-node ' + (membership.active ? 'is-active' : 'is-inactive') + '">'
      + '<div class="member-team-main"><span class="avatar ' + roleClass(node.role) + '">' + esc(initials(node.name)) + '</span><span class="member-team-copy"><strong data-preserve-content>' + esc(node.name) + '</strong><small>' + roleLabel(node.role) + ' · ' + guideText("Level ", "سطح ") + localizedDigits(relativeLevel) + ' ' + guideText("below you", "پایین‌تر از شما") + '</small></span>'
      + '<span class="badge ' + (membership.active ? 'badge-sub-active' : 'badge-sub-expired') + '">' + membership.label + '</span></div>'
      + '<div class="member-team-stats"><span>' + localizedDigits(children.length) + ' ' + guideText("direct referrals", "معرف مستقیم") + '</span><span>' + localizedDigits(summary.members) + ' ' + guideText("team members", "عضو تیم") + '</span><span>' + localizedDigits(summary.paidSales) + ' ' + guideText("paid subscriptions", "اشتراک پرداخت‌شده") + '</span><strong>' + guideText("Your commission from this branch", "پورسانت شما از این شاخه") + ': ' + money(branchAmount) + '</strong></div>'
      + '</article>';
    if (children.length) {
      html += '<ul class="member-tree-list">';
      stack.push({ items: children, index: 0, level: relativeLevel + 1, closesParent: true });
    } else {
      html += '</li>';
    }
  }
  return html + '</li></ul>';
}
function memberCommissionHistory(person, stats) {
  if (!stats.commissionEntries.length) {
    return '<div class="member-empty member-empty-compact"><strong>' + guideText("No commissions recorded yet", "هنوز پورسانتی ثبت نشده است") + '</strong><p>' + guideText("Your commission statement will appear here after a paid subscription sale in your lower team.", "پس از فروش اشتراکِ پرداخت‌شده در سطوح پایین‌تر، صورت‌حساب پورسانت شما در این بخش نمایش داده می‌شود.") + '</p></div>';
  }
  const rows = stats.commissionEntries.slice(0, 30).map(function (entry) {
    const sale = state.sales.find(function (item) { return item.id === entry.saleId; });
    const buyer = sale ? (sale.customerName || personName(sale.customerId)) : "—";
    const plan = sale ? (sale.planName || (planById(sale.planId) || {}).name || "—") : "—";
    const type = entry.type === "Refund reversal" ? guideText("Refund adjustment", "اصلاح بازپرداخت") : guideText("Commission", "پورسانت");
    return '<tr><td class="muted">' + formatDateTime(entry.date) + '</td><td><span data-preserve-content>' + esc(buyer) + '</span></td><td><span data-preserve-content>' + esc(displayPlanName(plan)) + '</span></td><td>' + type + '</td><td class="ledger-sign ' + (entry.delta >= 0 ? 'positive' : 'negative') + '">' + (entry.delta >= 0 ? '+' : '−') + money(Math.abs(entry.delta)) + '</td></tr>';
  }).join("");
  return '<div class="panel table-wrap"><table class="member-history-table"><thead><tr><th>' + guideText("Date", "تاریخ") + '</th><th>' + guideText("From team member", "از عضو تیم") + '</th><th>' + guideText("Plan", "طرح") + '</th><th>' + guideText("Activity", "فعالیت") + '</th><th>' + guideText("Amount", "مبلغ") + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function memberSubscriptionHistory(stats) {
  if (!stats.ownHistory.length) {
    return '<div class="member-empty member-empty-compact"><strong>' + guideText("No subscription purchases yet", "هنوز خرید اشتراکی ثبت نشده است") + '</strong><p>' + guideText("Your plan and renewal history will appear here after your first paid subscription.", "پس از اولین اشتراک پرداخت‌شده، طرح و سابقه تمدید شما در این بخش نمایش داده می‌شود.") + '</p></div>';
  }
  const rows = stats.ownHistory.slice(0, 8).map(function (sale) {
    const plan = sale.planName || (planById(sale.planId) || {}).name || "—";
    return '<tr><td class="muted">' + formatDateTime(sale.paidAt || sale.createdAt) + '</td><td><span data-preserve-content>' + esc(displayPlanName(plan)) + '</span></td><td>' + saleStatusBadge(sale.status) + '</td><td class="amount">' + money(sale.amountPaid || 0) + '</td></tr>';
  }).join("");
  return '<div class="panel table-wrap"><table><thead><tr><th>' + guideText("Date", "تاریخ") + '</th><th>' + guideText("Plan", "طرح") + '</th><th>' + guideText("Status", "وضعیت") + '</th><th>' + guideText("Paid", "پرداخت‌شده") + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function renderMemberPanel() {
  const memberSession = signedInAccountId && !isOwnerSession();
  const people = state.people.filter(function (person) { return person.role !== "owner"; }).sort(function (a, b) {
    return levelOf(a) - levelOf(b) || a.name.localeCompare(b.name);
  });
  const previewNotice = isOwnerSession() ? '<div class="member-preview-notice"><strong>' + guideText("Owner preview", "پیش‌نمایش مدیر") + '</strong><span>' + translateText("The owner can preview member panels here. Members who sign in see only their own account panel.") + '</span></div>' : "";
  if (!people.length) {
    return pageHead(guideText("Member panel", "پنل کاربر"), guideText("Preview a member’s subscription, team, and commission statement.", "وضعیت اشتراک، تیم و صورت‌حساب پورسانت کاربر را پیش‌نمایش کنید."))
      + previewNotice + emptyState(guideText("Add a user to open the member panel", "برای باز کردن پنل، ابتدا کاربر اضافه کنید"), guideText("Create an employee or customer account first. The member panel will show their subscription and lower referral tree.", "ابتدا حساب کارمند یا مشتری بسازید. پنل، اشتراک و درخت ارجاع پایین‌دستی او را نمایش می‌دهد."), guideText("Add a user", "افزودن کاربر"), "go-people");
  }
  if (memberSession) memberViewId = signedInMemberId();
  else if (!people.some(function (person) { return person.id === memberViewId; })) memberViewId = people[0].id;
  const person = personById(memberViewId);
  if (!person || person.role === "owner") return emptyState(guideText("Member account unavailable", "حساب کاربر در دسترس نیست"), guideText("Ask the shop owner to check this account.", "از مالک فروشگاه بخواهید این حساب را بررسی کند."), "", "");
  const childrenIndex = memberChildrenIndex(person.id);
  const stats = memberProfileStats(person, childrenIndex);
  const membership = subscriptionState(person);
  const inviter = personById(person.referrerId);
  const latest = stats.latestSubscription;
  const expiry = person.subscriptionExpiresAt ? new Date(person.subscriptionExpiresAt) : null;
  const expiryText = expiry && Number.isFinite(expiry.getTime()) ? formatDate(expiry) : guideText("No active term", "دوره فعالی ندارد");
  const expiryDetail = membership.active && expiry
    ? localizedDigits(Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000))) + ' ' + guideText("days left", "روز باقی‌مانده")
    : membership.label;
  const options = people.map(function (user) {
    return '<option data-preserve-content value="' + esc(user.id) + '"' + (user.id === person.id ? ' selected' : '') + '>' + esc(user.name) + ' · ' + roleLabel(user.role) + '</option>';
  }).join("");
  const level = levelOf(person);
  const history = memberCommissionHistory(person, stats);
  const subscriptionHistory = memberSubscriptionHistory(stats);
  const team = memberTreeHtml(person, stats, childrenIndex);
  const welcomeDiscounts = state.settings.plans.map(function (plan) {
    return { plan: plan, quote: saleDiscountInfo(person.id, plan.id) };
  });
  const termMonths = Number(state.settings.subscriptionMonths) || 1;
  const termText = localizedDigits(termMonths) + ' ' + guideText(termMonths === 1 ? "calendar month" : "calendar months", "ماه تقویمی");
  const accountSwitcher = isOwnerSession() ? '<section class="member-switch panel"><div><strong>' + guideText("Preview account", "انتخاب حساب برای پیش‌نمایش") + '</strong><span>' + guideText("Choose a user to see their member view.", "کاربری را برای مشاهده پنل او انتخاب کنید.") + '</span></div><select id="member-select" aria-label="' + guideText("Preview member account", "پیش‌نمایش حساب کاربر") + '">' + options + '</select></section>' : "";
  const discountPanel = '<section class="panel member-info-panel member-discount-panel"><h2>' + guideText("First-purchase discount", "تخفیف خرید اول") + '</h2>'
    + (stats.ownHistory.length
      ? '<p>' + guideText("The one-time welcome discount has already been used for this account.", "تخفیف خوش‌آمدگویی یک‌باره این حساب قبلاً استفاده شده است.") + '</p>'
      : '<p>' + guideText("Potential discount on your first paid subscription. Availability is confirmed at checkout from the existing Save Box balance.", "تخفیف احتمالی برای اولین اشتراک پرداخت‌شده شما. موجودبودن آن هنگام پرداخت و بر اساس موجودی فعلی صندوق ذخیره تأیید می‌شود.") + '</p>'
        + '<div class="member-discount-list">' + welcomeDiscounts.map(function (item) {
          const label = item.quote.eligible
            ? guideText("Available", "در دسترس")
            : guideText("Not currently funded", "فعلاً بودجه کافی ندارد");
          return '<div class="member-discount-row"><span><strong data-preserve-content>' + esc(displayPlanName(item.plan.name)) + '</strong><small>' + money(item.plan.price) + ' · ' + label + '</small></span><span><strong>' + money(item.quote.discount) + ' ' + guideText("off", "تخفیف") + '</strong><small>' + guideText("You would pay", "مبلغ پرداختی شما") + ': ' + money(item.quote.paid) + '</small></span></div>';
        }).join("") + '</div>'
        + '<div class="inline-note">' + guideText("The discount is one-time, must preserve the configured Save Box reserve, and cannot be funded by the same sale that uses it.", "تخفیف فقط یک‌بار قابل‌استفاده است، باید ذخیره تعیین‌شده صندوق محفوظ بماند و فروشِ دارای تخفیف نمی‌تواند هزینه تخفیف خودش را تأمین کند.") + '</div>')
    + '</section>';
  return pageHead(guideText("Member panel", "پنل کاربر"), guideText("A member’s account status, lower referral tree, and commission record.", "وضعیت حساب، درخت ارجاع پایین‌دستی و سابقه پورسانت کاربر."))
    + previewNotice
    + accountSwitcher
    + '<section class="member-hero"><div class="member-identity"><span class="member-avatar ' + roleClass(person.role) + '">' + esc(initials(person.name)) + '</span><div><span class="member-role">' + roleLabel(person.role) + ' · ' + guideText("Company level", "سطح در شبکه") + ' ' + localizedDigits(level) + '</span><h2 data-preserve-content>' + esc(person.name) + '</h2><p>' + guideText("Invited by", "معرف") + ': ' + (inviter ? '<span data-preserve-content>' + esc(inviter.name) + '</span>' : guideText("Shop", "فروشگاه")) + ' · ' + guideText("Joined", "تاریخ عضویت") + ' ' + (person.createdAt ? formatDate(person.createdAt) : '—') + '</p></div></div>'
    + '<div class="member-subscription-chip"><span class="badge ' + (membership.active ? 'badge-sub-active' : 'badge-sub-expired') + '">' + membership.label + '</span><strong>' + expiryText + '</strong><small>' + expiryDetail + '</small></div>'
    + '<div class="member-commission-hero"><span>' + guideText("Recorded commissions", "پورسانت ثبت‌شده") + '</span><strong>' + money(stats.commissionTotal) + '</strong><small>' + guideText("Commission ledger balance; cash payouts are not tracked here.", "مانده دفتر پورسانت؛ پرداخت نقدی در این پنل ثبت نمی‌شود.") + '</small></div></section>'
    + '<div class="member-metrics"><div class="member-metric"><span>' + guideText("This month", "این ماه") + '</span><strong>' + money(stats.commissionThisMonth) + '</strong><small>' + guideText("Net commission entries", "خالص ثبت‌های پورسانت") + '</small></div>'
    + '<div class="member-metric"><span>' + guideText("Your lower team", "تیم پایین‌دستی شما") + '</span><strong>' + localizedDigits(stats.teamIds.length) + '</strong><small>' + localizedDigits(stats.activeTeam) + ' ' + guideText("with active subscriptions", "با اشتراک فعال") + '</small></div>'
    + '<div class="member-metric"><span>' + guideText("Team paid sales", "فروش پرداخت‌شده تیم") + '</span><strong>' + localizedDigits(stats.teamPaidSales) + '</strong><small>' + money(stats.teamPaidVolume) + ' · ' + guideText("paid volume", "حجم پرداختی") + '</small></div>'
    + '<div class="member-metric member-metric-routed"><span>' + guideText("Routed to CEO while inactive", "منتقل‌شده به مدیرعامل هنگام غیرفعال‌بودن") + '</span><strong>' + money(stats.routedToCeo) + '</strong><small>' + guideText("Not restored after renewal", "پس از تمدید بازگردانده نمی‌شود") + '</small></div></div>'
    + '<div class="member-content-grid"><section class="member-team-section"><div class="section-row"><div><h2>' + guideText("Your lower-level tree", "درخت سطوح پایین‌تر شما") + '</h2><p>' + guideText("The chart starts with your account and shows only your direct and indirect referrals. Each amount includes commissions from that person and their lower team, so parent totals include child branches.", "این نمودار از حساب شما شروع می‌شود و فقط معرف‌های مستقیم و غیرمستقیم شما را نشان می‌دهد. هر مبلغ شامل پورسانت‌های آن فرد و تیم پایین‌دستی اوست؛ بنابراین مجموع والدین، شاخه‌های فرزند را نیز دربرمی‌گیرد.") + '</p></div><span class="badge badge-customer">' + localizedDigits(stats.teamIds.length) + ' ' + guideText("people below you", "نفر در سطوح پایین‌تر") + '</span></div><div class="panel member-tree-panel">' + team + '</div></section>'
    + '<aside class="member-side-stack"><section class="panel member-info-panel"><h2>' + guideText("Your subscription", "اشتراک شما") + '</h2><div class="member-info-row"><span>' + guideText(membership.active ? "Current plan" : "Last plan", membership.active ? "طرح فعلی" : "آخرین طرح") + '</span><strong data-preserve-content>' + (latest ? esc(displayPlanName(latest.planName || (planById(latest.planId) || {}).name || "—")) : guideText("No paid plan", "بدون طرح پرداخت‌شده")) + '</strong></div><div class="member-info-row"><span>' + guideText("Plan term", "مدت اشتراک") + '</span><strong>' + termText + '</strong></div><div class="member-info-row"><span>' + guideText("Last payment", "آخرین پرداخت") + '</span><strong>' + (latest ? formatDate(latest.paidAt || latest.createdAt) : '—') + '</strong></div><div class="member-info-row"><span>' + guideText("Subscription ends", "پایان اشتراک") + '</span><strong>' + expiryText + '</strong></div><div class="inline-note">' + guideText("A paid renewal restores eligibility for future team sales. No commission is earned during an inactive gap, and shares already routed to the CEO stay with the CEO.", "تمدید پرداخت‌شده، واجدشرایط‌بودن برای فروش‌های آینده تیم را بازمی‌گرداند. در فاصله غیرفعال‌بودن پورسانتی تعلق نمی‌گیرد و سهم‌هایی که به مدیرعامل رسیده‌اند نزد او می‌مانند.") + '</div></section>'
    + '<section class="panel member-rules-panel"><h2>' + guideText("How your commission works", "نحوه محاسبه پورسانت شما") + '</h2><p>' + guideText("Only a paid subscription sale in your lower team can create a commission. Account creation or inviting people alone does not pay.", "فقط فروش اشتراکِ پرداخت‌شده در سطوح پایین‌تر می‌تواند پورسانت ایجاد کند. ساخت حساب یا دعوت افراد به‌تنهایی پرداختی ندارد.") + '</p><ul><li>' + guideText("The current referral pool is ", "صندوق پورسانت فعلی ") + localizedDigits(state.settings.referralRate) + '٪ ' + guideText("of the amount paid.", "از مبلغ پرداخت‌شده است.") + '</li><li>' + guideText("The buyer’s direct upline receives half of the pool; each next upline receives half of what remains.", "معرف مستقیم خریدار نیمی از صندوق را می‌گیرد و هر بالادستی بعدی نصف مانده را دریافت می‌کند.") + '</li><li>' + guideText("An inactive upline’s share goes to the CEO; the waterfall continues to the next upline.", "سهم بالادستی غیرفعال به مدیرعامل می‌رسد و محاسبه برای بالادستی بعدی ادامه می‌یابد.") + '</li><li>' + guideText("The remainder at the CEO row is split equally between the CEO and the separate Save Box.", "مانده در ردیف مدیرعامل به‌طور مساوی میان مدیرعامل و صندوق ذخیره جداگانه تقسیم می‌شود.") + '</li><li>' + guideText("You must have an active subscription when the sale is paid. Shares routed to the CEO during an inactive period are not restored after renewal.", "هنگام پرداخت فروش باید اشتراک فعال داشته باشید. سهم‌هایی که در دوره غیرفعال به مدیرعامل رسیده‌اند پس از تمدید بازگردانده نمی‌شوند.") + '</li><li>' + guideText("A buyer does not earn commission on their own purchase; refunds create reversing ledger entries.", "خریدار از خرید خودش پورسانت نمی‌گیرد و بازپرداخت، ثبت اصلاحی معکوس در دفتر ایجاد می‌کند.") + '</li></ul><div class="member-rule-note">' + guideText("The figures above are based on recorded sales and ledger entries. Confirmed cash withdrawals and tax deductions are outside this app.", "مبالغ بالا بر اساس فروش‌ها و ثبت‌های دفتر هستند. برداشت نقدی تأییدشده و کسر مالیات در این برنامه ثبت نمی‌شود.") + '</div></section>' + discountPanel + '</aside></div>'
    + '<div class="section-row member-history-heading"><div><h2>' + guideText("Commission statement", "صورت‌حساب پورسانت") + '</h2><p>' + guideText("Sales from your lower team that changed your commission ledger.", "فروش‌های سطوح پایین‌تر که دفتر پورسانت شما را تغییر داده‌اند.") + '</p></div><span class="badge badge-customer">' + localizedDigits(stats.commissionEntries.length) + ' ' + guideText("entries", "ثبت") + '</span></div>' + history
    + '<div class="section-row member-history-heading"><div><h2>' + guideText("Your subscription history", "سابقه اشتراک شما") + '</h2><p>' + guideText("Paid renewals and refunded subscriptions.", "تمدیدهای پرداخت‌شده و اشتراک‌های بازپرداخت‌شده.") + '</p></div></div>' + subscriptionHistory;
}
function makeTreeNode(person, level, childIndex, visited, detachedRoot) {
  const li = document.createElement("li");
  li.className = "tree-item";
  const allChildren = childIndex ? (childIndex.get(person.id) || []) : state.people.filter(function (p) { return p.referrerId === person.id; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  const children = visited ? allChildren.filter(function (child) { return !visited.has(child.id); }) : allChildren;
  const node = document.createElement("div");
  node.className = "tree-node" + (person.role === "owner" ? " root" : "") + (detachedRoot ? " is-detached-root" : "");
  const avatar = document.createElement("span");
  avatar.className = "avatar " + roleClass(person.role);
  avatar.textContent = initials(person.name);
  const main = document.createElement("span");
  main.className = "tree-main";
  const title = document.createElement("span");
  title.className = "tree-name";
  title.textContent = personName(person.id);
  title.setAttribute("data-preserve-content", "");
  const meta = document.createElement("span");
  meta.className = "tree-meta";
  const membership = person.role === "owner" ? null : subscriptionState(person);
  meta.textContent = detachedRoot
    ? roleLabel(person.role) + " · " + (uiLanguage === "fa" ? "متصل به درخت مدیرعامل نیست" : "Not connected to the CEO tree") + " · " + membership.label
    : roleLabel(person.role) + " · " + (person.role === "owner" ? translateText("Root") : displayLevel(level) + " · " + membership.label);
  main.appendChild(title);
  main.appendChild(meta);
  node.appendChild(avatar);
  node.appendChild(main);
  const pill = document.createElement("span");
  pill.className = "level-pill";
  pill.textContent = uiLanguage === "fa"
    ? localizedDigits(children.length) + " معرفی"
    : children.length + (children.length === 1 ? " referral" : " referrals");
  node.appendChild(pill);
  if (children.length) {
    const toggle = document.createElement("button");
    toggle.className = "tree-toggle";
    toggle.type = "button";
    toggle.textContent = "−";
    toggle.setAttribute("aria-label", uiLanguage === "fa" ? "بستن شاخه ارجاع زیرمجموعه " + personName(person.id) : "Collapse referrals under " + person.name);
    toggle.setAttribute("data-action", "tree-toggle");
    node.appendChild(toggle);
  }
  li.appendChild(node);
  if (children.length) {
    const ul = document.createElement("ul");
    ul.className = "tree-children";
    li.appendChild(ul);
    return { li: li, childList: ul, children: children, nextLevel: level + 1 };
  }
  return { li: li, childList: null, children: [], nextLevel: level + 1 };
}
function buildTreeDom(rootId, startLevel, sharedVisited, childIndex, detachedRoot) {
  const rootPerson = personById(rootId);
  if (!rootPerson) return null;
  const rootList = document.createElement("ul");
  rootList.className = "tree-list";
  const childrenByReferrer = childIndex || new Map();
  if (!childIndex) {
    state.people.forEach(function (person) {
      if (person.id === "owner") return;
      if (!childrenByReferrer.has(person.referrerId)) childrenByReferrer.set(person.referrerId, []);
      childrenByReferrer.get(person.referrerId).push(person);
    });
    childrenByReferrer.forEach(function (children) { children.sort(function (a, b) { return a.name.localeCompare(b.name); }); });
  }
  const stack = [{ person: rootPerson, parentList: rootList, level: startLevel || 1 }];
  const visited = sharedVisited || new Set();
  while (stack.length) {
    const item = stack.pop();
    if (visited.has(item.person.id)) continue;
    visited.add(item.person.id);
    const made = makeTreeNode(item.person, item.level, childrenByReferrer, visited, detachedRoot && item.person.id === rootPerson.id);
    item.parentList.appendChild(made.li);
    for (let i = made.children.length - 1; i >= 0; i -= 1) {
      stack.push({ person: made.children[i], parentList: made.childList, level: made.nextLevel });
    }
  }
  return rootList;
}
function renderTree() {
  if (!isOwnerSession()) {
    currentView = "member";
    document.getElementById("main-content").innerHTML = renderMemberPanel();
    return;
  }
  const userCount = state.people.filter(function (person) { return person.role !== "owner"; }).length;
  const base = pageHead("Full network tree", "A box-and-line chart of every account in this workspace, starting at the CEO / Shop Owner. Members have a separate chart limited to their own lower-level referrals.")
    + '<div class="panel panel-pad"><div class="toolbar"><div><h2 class="panel-title">Everyone in the actual network</h2><div class="help-text">Each box is one account; each line shows a direct inviter. Scroll horizontally to follow deep branches.</div></div><span class="badge badge-customer">' + (uiLanguage === "fa" ? localizedDigits(userCount) + " کاربر" : userCount + " users") + '</span></div><div class="tree-root" id="tree-root"></div></div>';
  document.getElementById("main-content").innerHTML = base;
  const host = document.getElementById("tree-root");
  const visited = new Set();
  const childIndex = new Map();
  state.people.forEach(function (person) {
    if (person.id === "owner") return;
    if (!childIndex.has(person.referrerId)) childIndex.set(person.referrerId, []);
    childIndex.get(person.referrerId).push(person);
  });
  childIndex.forEach(function (children) { children.sort(function (a, b) { return a.name.localeCompare(b.name); }); });
  const tree = buildTreeDom("owner", 1, visited, childIndex, false);
  if (tree) host.appendChild(tree);
  const detached = state.people.filter(function (person) { return person.role !== "owner" && !visited.has(person.id); })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
  if (detached.length) {
    const section = document.createElement("section");
    section.className = "section-row";
    section.innerHTML = '<div><h2>Accounts outside the CEO tree</h2><p>These accounts have no valid path to the CEO root. They are included here so every user remains visible.</p></div><span class="badge badge-pending">' + (uiLanguage === "fa" ? localizedDigits(detached.length) + " کاربر" : detached.length + " users") + '</span>';
    host.appendChild(section);
    const list = document.createElement("ul");
    list.className = "tree-list";
    detached.forEach(function (person) {
      if (visited.has(person.id)) return;
      const branch = buildTreeDom(person.id, 1, visited, childIndex, true);
      while (branch && branch.firstChild) list.appendChild(branch.firstChild);
    });
    host.appendChild(list);
  }
  const renderedCount = Array.from(visited).filter(function (id) { return id !== "owner"; }).length;
  const count = host.parentElement && host.parentElement.querySelector(".toolbar .badge");
  if (count) count.textContent = uiLanguage === "fa"
    ? localizedDigits(renderedCount) + " از " + localizedDigits(userCount) + " کاربر"
    : renderedCount + " of " + userCount + " users shown";
}
function renderSaveBox() {
  const balance = boxBalance();
  const reserve = roundPct(Math.max(0, balance), state.settings.reserveRate);
  const spendable = Math.max(0, balance - reserve);
  const discounts = state.ledger.filter(function (e) { return e.type === "Welcome discount"; }).reduce(function (sum, e) { return sum - e.delta; }, 0);
  const deposits = state.ledger.filter(function (e) { return e.type === "Save Box contribution"; }).reduce(function (sum, e) { return sum + e.delta; }, 0);
  const due = recoveryDue();
  const campaignBudget = availableDiscountCampaignBudget();
  const rows = state.settings.plans.map(function (p) {
    const d = roundPct(p.price, state.settings.welcomeRate);
    const threshold = minimumBalanceForDiscount(d);
    const status = threshold == null ? '<span class="badge badge-pending">Unavailable</span>' : balance >= threshold
      ? '<span class="badge badge-paid">Available</span>' : '<span class="badge badge-pending">Needs ' + money(threshold - balance) + '</span>';
    return '<tr><td><span data-preserve-content>' + esc(displayPlanName(p.name)) + '</span></td><td class="amount">' + money(p.price) + '</td><td class="amount">' + money(d) + '</td><td class="amount">' + (threshold == null ? '—' : money(threshold)) + '</td><td>' + status + '</td></tr>';
  }).join("");
  const discountRows = state.ledger.filter(function (entry) { return entry.type === "Welcome discount"; }).slice().reverse();
  const discountHistory = discountRows.length ? '<div class="panel table-wrap"><table><thead><tr><th>Date</th><th>User</th><th>Plan</th><th>Discount</th><th>Status</th></tr></thead><tbody>' + discountRows.map(function (entry) {
    const sale = state.sales.find(function (item) { return item.id === entry.saleId; });
    return '<tr><td class="muted">' + formatDate(entry.date) + '</td><td><span data-preserve-content>' + esc(personName(entry.personId)) + '</span></td><td><span data-preserve-content>' + esc(sale ? displayPlanName(sale.planName) : "—") + '</span></td><td class="amount">' + money(Math.abs(entry.delta)) + '</td><td>' + saleStatusBadge(sale ? sale.status : "paid") + '</td></tr>';
  }).join("") + '</tbody></table></div>' : '<div class="panel panel-pad help-text">No welcome discounts have been redeemed.</div>';
  const campaignRule = state.settings.plans.map(function (p) { return money(roundPct(p.price, state.settings.welcomeRate)) + ' × ' + esc(displayPlanName(p.name)) + ' ' + (uiLanguage === "fa" ? "تخفیف" : "discounts"); }).join(' + ');
  const contributionRate = uiLanguage === "fa"
    ? "۵۰٪ از مانده ردیف مدیرعامل (متناسب با عمق زنجیره ارجاع)"
    : "50% of the CEO-row remainder (varies by referral depth)";
  const campaignHelp = uiLanguage === "fa"
    ? "بودجه ترکیبی کمپین: " + campaignRule + " ≤ " + money(campaignBudget) + " باقی‌مانده. هر تخفیف استفاده‌شده از این بودجه کم می‌کند؛ واریزی‌های واقعی صندوق ذخیره بر اساس مانده زنجیره بالادستی، پس از سهم کاربران، محاسبه می‌شوند. واجدشرایط‌بودن تخفیف کاربر پیش از واریز فروش جدید بررسی می‌شود."
    : "Mixed campaign budget: " + campaignRule + " ≤ " + money(campaignBudget) + " remaining. Each paid discount reduces this budget; actual Save Box contributions are calculated from the referral pool left after upline shares. Discount eligibility is checked before the new sale contributes to the Box.";
  const recoveryMessage = uiLanguage === "fa"
    ? "بدهی بازپرداخت: " + money(due) + ". واریزی‌های جدید صندوق ذخیره ابتدا برای تسویه این مبلغ استفاده می‌شوند و سپس موجودی قابل‌استفاده را افزایش می‌دهند."
    : "Refund recovery due: " + money(due) + ". New Save Box contributions are applied to this amount before increasing the available balance.";
  return pageHead("Save Box", "A separate discount reserve funded by half of the referral pool left at the CEO row.")
    + '<div class="balance-grid"><div class="balance-card highlight"><h3>Current balance</h3><strong>' + money(balance) + '</strong><p>Before any pending sales</p><div class="progress-track"><span style="width:' + (balance > 0 ? Math.min(100, state.settings.reserveRate) : 0) + '%"></span></div></div>'
    + '<div class="balance-card"><h3>Protected reserve</h3><strong>' + money(reserve) + '</strong><p>' + (uiLanguage === "fa" ? localizedDigits(state.settings.reserveRate) + '٪ از موجودی فعلی' : state.settings.reserveRate + '% of the current balance') + '</p></div>'
    + '<div class="balance-card"><h3>Spendable for discounts</h3><strong>' + money(spendable) + '</strong><p>Available without using the reserve</p></div></div>'
    + (due ? '<div class="inline-note warning" style="margin-bottom:14px">' + recoveryMessage + '</div>' : "")
    + '<div class="two-col"><section class="panel panel-pad"><h2 class="panel-title">Welcome discount availability</h2><p class="help-text">A first-purchase discount is available only when the cleared balance covers the discount and preserves the configured reserve. With the default 50% reserve, that means at least twice the discount amount.</p>'
    + '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Plan</th><th>Price</th><th>Discount</th><th>Balance needed</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>'
    + '<section class="panel panel-pad"><h2 class="panel-title">Save Box activity</h2><div class="allocation-row"><span>Total contributions</span><strong>' + money(deposits) + '</strong></div><div class="allocation-row"><span>Total welcome discounts issued</span><strong class="ledger-sign negative">' + money(discounts) + '</strong></div><div class="allocation-row"><span>Campaign discount budget remaining</span><strong>' + money(campaignBudget) + '</strong></div><div class="allocation-row"><span>Funding rule</span><strong>' + contributionRate + '</strong></div><div class="help-text">' + campaignHelp + '</div></section></div>'
    + '<div class="section-row"><div><h2>Discount history</h2><p>Every redeemed welcome discount stays visible, including refunded subscriptions.</p></div></div>' + discountHistory
    + '<div class="section-row"><div><h2>Recent Save Box ledger</h2><p>Deposits, discount spending, and refund adjustments.</p></div><button class="button button-quiet button-small" data-view="ledger">Open full ledger</button></div>'
    + renderLedgerTable(state.ledger.filter(function (e) { return e.account === "savebox" || e.account === "recovery"; }).slice(-8).reverse(), true);
}
function ledgerAccountName(entry) {
  if (entry.account === "owner") return "CEO / Shop Owner Pocket";
  if (entry.account === "savebox") return "Save Box";
  if (entry.account === "recovery") return "Recovery due";
  if (entry.account.indexOf("person:") === 0) return personName(entry.account.slice(7)) + " · commission";
  return entry.account;
}
function displayLedgerNote(entry) {
  if (!entry || !entry.note) return "";
  if (entry.type === "Admin adjustment") return entry.note;
  if (uiLanguage !== "fa") return entry.note;
  if (entry.note.indexOf("Level ") === 0 && entry.note.indexOf(" upline commission; active subscription") > 0) {
    const level = entry.note.match(/^Level (\d+)/);
    return "پورسانت بالادستی سطح " + localizedDigits(level ? level[1] : "") + "؛ اشتراک فعال";
  }
  if (entry.note.indexOf("Level ") === 0 && entry.note.indexOf(" share routed to the CEO") > 0) {
    const level = entry.note.match(/^Level (\d+)/);
    return "سهم سطح " + localizedDigits(level ? level[1] : "") + " به دلیل نداشتن اشتراک فعال هنگام پرداخت، به مدیرعامل منتقل شد";
  }
  if (/^\d+(?:\.\d+)?% shop allocation$/.test(entry.note)) {
    return localizedDigits(entry.note.match(/^\d+(?:\.\d+)?/)[0]) + "٪ سهم فروشگاه";
  }
  if (entry.note.indexOf("Reversal of ") === 0) return "برگشت " + translateText(entry.note.slice("Reversal of ".length));
  return translateText(entry.note);
}
function renderLedgerTable(entries, compact) {
  if (!entries.length) return emptyState("No ledger entries yet", "Paid sales, discounts, commissions, and adjustments will appear here.", "", "");
  return '<div class="panel table-wrap"><table><thead><tr><th>Date</th><th>Account</th><th>Activity</th><th>Related person</th><th>Change</th></tr></thead><tbody>' +
    entries.map(function (e) {
      const accountHtml = e.account.indexOf("person:") === 0
        ? '<span data-preserve-content>' + esc(personName(e.account.slice(7))) + '</span> · ' + translateText("commission")
        : esc(ledgerAccountName(e));
      const note = displayLedgerNote(e);
      return '<tr><td class="muted">' + formatDateTime(e.date) + '</td><td>' + accountHtml + '</td><td>' + esc(e.type) +
        (note ? '<div class="muted" style="margin-top:3px"' + (e.type === "Admin adjustment" ? ' data-preserve-content' : '') + '>' + esc(note) + '</div>' : "") + '</td><td>' + (e.personId ? '<span data-preserve-content>' + esc(personName(e.personId)) + '</span>' : "—") +
        '</td><td class="ledger-sign ' + (e.delta >= 0 ? "positive" : "negative") + '">' + (e.delta >= 0 ? "+" : "−") + money(Math.abs(e.delta)) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
}
function renderLedger() {
  return pageHead("Ledger", "An append-only record of subscription allocations, commissions, discounts, and corrections.")
    + '<section class="panel adjustment-panel"><div><h2>Admin adjustment</h2><p>Add a documented correction to the Save Box or CEO / Shop Owner Pocket. Save Box balance cannot go below zero.</p></div><form id="adjustment-form" class="adjustment-form"><div class="field"><label for="adjustment-account">Account</label><select id="adjustment-account" name="account"><option value="savebox">Save Box</option><option value="owner">CEO / Shop Owner Pocket</option></select></div><div class="field"><label for="adjustment-direction">Direction</label><select id="adjustment-direction" name="direction"><option value="add">Add funds</option><option value="remove">Remove funds</option></select></div><div class="field"><label for="adjustment-amount">Amount</label><input id="adjustment-amount" name="amount" type="number" min="0" step="' + (Number(state.settings.currencyPrecision) ? "0." + "0".repeat(Number(state.settings.currencyPrecision) - 1) + "1" : "1") + '" required></div><div class="field"><label for="adjustment-note">Reason</label><input id="adjustment-note" name="note" maxlength="180" required placeholder="Explain the correction"></div><button class="button button-primary" type="submit">Post adjustment</button></form></section>'
    + '<div class="toolbar"><div class="toolbar-left"><input class="search-input" id="ledger-search" placeholder="Filter by account or activity" aria-label="Filter ledger"></div><div class="toolbar-right"><span class="badge badge-customer">' + state.ledger.length + ' entries</span></div></div>'
    + '<div id="ledger-table">' + renderLedgerTable(state.ledger.slice().reverse(), false) + '</div>'
    + '<div class="privacy-note">This app stores its records in this browser. Export a backup regularly if these are business records.</div>';
}
function renderSettings() {
  const s = state.settings;
  const precision = Number(s.currencyPrecision) || 0;
  const amountStep = precision ? "0." + "0".repeat(Math.max(0, precision - 1)) + "1" : "1";
  return pageHead("Settings", "Adjust the plan prices and allocation rules. New settings apply to future sales; posted ledger entries stay unchanged.")
    + '<form id="settings-form"><div class="settings-grid">'
    + '<section class="panel settings-section"><h2>Plans and currency</h2><p>Use the same currency unit for every amount. No currency symbol is shown unless you enter a label.</p>'
    + s.plans.map(function (p, i) {
      return '<div class="setting-row"><label for="plan-name-' + i + '"><span data-preserve-content>' + esc(displayPlanName(p.name)) + '</span><small>Plan name and price</small></label><div><input id="plan-name-' + i + '" name="planName' + i + '" value="' + esc(p.name) + '" aria-label="' + esc(uiLanguage === "fa" ? "نام طرح " + p.name : p.name + " plan name") + '"><input style="margin-top:5px" type="number" min="0" step="' + amountStep + '" name="planPrice' + i + '" value="' + amountInput(p.price) + '" aria-label="' + esc(uiLanguage === "fa" ? "قیمت " + p.name : p.name + " price") + '"></div></div>';
    }).join("")
    + '<div class="setting-row"><label for="subscription-months">Subscription validity<small>New paid purchases activate the user for this many calendar months</small></label><input id="subscription-months" name="subscriptionMonths" type="number" min="1" max="24" step="1" value="' + esc(s.subscriptionMonths || 1) + '"></div>'
    + '<div class="setting-row"><label for="currency-label">Currency label<small>Optional, e.g. toman</small></label><input id="currency-label" name="currencyLabel" value="' + esc(s.currencyLabel || "") + '" placeholder="Leave blank"></div>'
    + '<div class="setting-row"><label for="currency-precision">Currency precision<small>' + (state.ledger.length || state.sales.length ? 'Locked because sales or financial entries exist' : 'Number of decimal places') + '</small></label><select id="currency-precision" name="currencyPrecision"' + (state.ledger.length || state.sales.length ? ' disabled' : '') + '>' + [0, 1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (n === precision ? ' selected' : '') + '>' + n + (n === 1 ? ' decimal place' : ' decimal places') + '</option>'; }).join("") + '</select></div></section>'
    + '<section class="panel settings-section"><h2>Sale allocations</h2><p>The shop and referral pool must add to 100%. The entire referral pool is allocated through the upline waterfall: 50%, 25%, 12.5%, and so on. Whatever remains at the CEO row is split equally between the CEO and Save Box. An inactive user’s share goes to the CEO.</p>'
    + '<div class="setting-row"><label for="shop-rate">Shop allocation</label><div class="prefix"><input id="shop-rate" name="shopRate" type="number" min="0" max="100" step="0.1" value="' + esc(s.shopRate) + '"></div></div>'
    + '<div class="setting-row"><label for="referral-rate">Total referral pool<small>All of this amount enters the waterfall</small></label><div class="prefix"><input id="referral-rate" name="referralRate" type="number" min="0" max="100" step="0.1" value="' + esc(s.referralRate) + '"></div></div>'
    + '<div class="help-text">Every user upline receives half of the remaining pool. The remaining amount at the CEO row is split equally between the CEO and Save Box.</div></section>'
    + '<section class="panel settings-section"><h2>Welcome discount</h2><p>Only a user’s first paid subscription can use this discount. Eligibility uses the balance before that sale.</p>'
    + '<div class="setting-row"><label for="welcome-rate">Discount rate</label><div class="prefix"><input id="welcome-rate" name="welcomeRate" type="number" min="0" max="100" step="0.1" value="' + esc(s.welcomeRate) + '"></div></div>'
    + '<div class="setting-row"><label for="reserve-rate">Save Box reserve</label><div class="prefix"><input id="reserve-rate" name="reserveRate" type="number" min="0" max="100" step="1" value="' + esc(s.reserveRate) + '"></div></div>'
    + '<div class="help-text">The default 50% reserve requires a pre-sale balance of at least twice the discount amount. Changing the reserve updates both the required balance and campaign budget.</div></section>'
    + '<section class="panel settings-section"><h2>Data and backups</h2><p>This workspace stores manual records in this browser. Website-synced records are stored separately by the API server.</p>'
    + '<div class="form-actions"><button class="button button-quiet" type="button" id="export-settings" data-action="export-settings">Export backup</button><button class="button button-quiet" type="button" id="import-settings" data-action="import-settings">Import backup</button></div>'
    + '<div class="privacy-note">This JSON backup includes local workspace records only. Website API data is stored on the API server.</div>'
    + '<div class="form-actions"><button class="button button-danger button-small" type="button" data-action="clear-workspace">Clear workspace data</button><button class="button button-quiet button-small" type="button" data-action="load-demo">Load sample data</button></div></section></div>'
    + '<div class="form-actions"><button class="button button-primary" type="submit">Save settings</button></div></form>';
}
function apiMoney(value, currency) {
  const meta = currency || (apiDashboardData && apiDashboardData.currency) || { precision: 0, label: "" };
  const precision = Math.max(0, Math.min(4, Number(meta.precision) || 0));
  const scaled = (Number(value) || 0) / Math.pow(10, precision);
  const formatted = new Intl.NumberFormat(uiLanguage === "fa" ? "fa-IR" : "en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(scaled);
  const label = String(meta.label || "");
  return formatted + (label ? " " + esc(uiLanguage === "fa" && label.toLowerCase() === "toman" ? "تومان" : label) : "");
}
function apiTreeNodeMarkup(node, isRoot) {
  if (!node) return "";
  const status = node.role === "owner" ? "" : '<span class="api-node-status ' + (node.subscriptionActive ? "is-active" : "is-inactive") + '">' + translateText(node.subscriptionActive ? "Active subscription" : "Inactive") + '</span>';
  const role = node.role === "owner" ? translateText("CEO / Shop Owner") : translateText(node.role === "employee" ? "Employee" : "Customer");
  const head = '<span class="api-node-name">' + esc(node.name) + '</span><span class="api-node-meta">' + esc(role) + ' · ' + translateText("Level") + ' ' + localizedDigits(node.level) + '</span>' + status
    + '<span class="api-node-meta">' + translateText("Sales") + ': ' + localizedDigits(node.paidSales || 0) + ' · ' + translateText("Commission earned") + ': ' + apiMoney(node.commissionsEarned || 0) + '</span>';
  const children = (node.children || []).map(function (child) { return apiTreeNodeMarkup(child, false); }).join("");
  if (isRoot) return '<li class="api-tree-item"><details open><summary><span class="api-tree-card">' + head + '</span></summary>' + (children ? '<ul>' + children + '</ul>' : "") + '</details></li>';
  return '<li class="api-tree-item"><details><summary><span class="api-tree-card">' + head + '</span></summary>' + (children ? '<ul>' + children + '</ul>' : "") + '</details></li>';
}
function renderApiPage() {
  const connected = apiDashboardData;
  const apiForm = '<section class="panel api-connect-panel"><div class="api-connect-head"><div><h2>' + translateText("Website sales integration") + '</h2><p>' + translateText("Connect the shop website to send paid sales and view live reporting.") + '</p></div><span class="api-connection-badge ' + (connected ? "connected" : "") + '"><i></i>' + translateText(connected ? "Connected to website API" : "Not connected") + '</span></div>'
    + '<form id="api-connect-form" class="api-connect-form"><div class="field"><label for="api-base-url">' + translateText("API base URL") + '</label><input id="api-base-url" name="baseUrl" type="url" value="' + esc(apiConnection.baseUrl) + '" placeholder="https://api.example.com" required></div>'
    + '<div class="field"><label for="api-read-token">' + translateText("Read-only API key") + '</label><input id="api-read-token" name="readToken" type="password" value="' + esc(apiConnection.readToken) + '" autocomplete="off" placeholder="Paste the API_READ_TOKEN" required></div>'
    + '<div class="api-connect-actions"><button class="button button-primary" type="submit"' + (apiLoading ? " disabled" : "") + '>' + translateText(apiLoading ? "Loading…" : "Connect and load reports") + '</button>'
    + (connected ? '<button class="button button-quiet" type="button" data-action="api-refresh">' + translateText("Refresh website data") + '</button>' : "") + '</div></form>'
    + '<p class="api-security-note">' + translateText("Enter the read-only key from the API server’s .env file. The website must use the separate write key on its server.") + '</p>'
    + (apiConnectionError ? '<div class="inline-note warning">' + esc(translateText(apiConnectionError)) + '</div>' : "") + '</section>';
  const docs = '<section class="panel api-doc-panel"><div><h2>' + translateText("Website integration guide") + '</h2><p>' + translateText("Send each user before their first sale, then post each confirmed payment once.") + '</p></div><div class="api-endpoint-list">'
    + '<div><span class="api-method get">GET</span><code>/api/v1/dashboard</code><small>Website stats, tree, commissions, recent sales</small></div>'
    + '<div><span class="api-method get">GET</span><code>/api/v1/tree</code><small>Full referral hierarchy and user metrics</small></div>'
    + '<div><span class="api-method get">GET</span><code>/api/v1/commissions</code><small>Commission totals and entries by user</small></div>'
    + '<div><span class="api-method get">GET</span><code>/api/v1/member/{userId}</code><small>One user’s private member report; website server only</small></div>'
    + '<div><span class="api-method get">GET</span><code>/api/v1/settings</code><small>Read commission, discount, and plan settings</small></div>'
    + '<div><span class="api-method put">PUT</span><code>/api/v1/settings</code><small>Update settings for future sales</small></div>'
    + '<div><span class="api-method post">POST</span><code>/api/v1/users</code><small>Create a website employee or customer</small></div>'
    + '<div><span class="api-method post">POST</span><code>/api/v1/sales</code><small>Record a confirmed subscription payment</small></div>'
    + '<div><span class="api-method post">POST</span><code>/api/v1/sales/{id}/refund</code><small>Reverse a refunded website sale</small></div></div>'
    + '<p class="api-security-note">' + translateText("API server") + ': <a href="./API-INTEGRATION.md" target="_blank" rel="noopener">API-INTEGRATION.md</a> · Use the write key only from your website’s server.</p></section>';
  if (!connected) {
    return pageHead("Website API", translateText("Connect the shop website to send paid sales and view live reporting."))
      + '<div class="api-layout">' + apiForm + docs + '</div>';
  }
  const stats = connected.stats || {};
  const planRows = (stats.salesByPlan || []).map(function (row) {
    return '<tr><td>' + esc(row.planName) + '</td><td>' + localizedDigits(row.sales) + '</td><td class="amount">' + apiMoney(row.revenue, connected.currency) + '</td></tr>';
  }).join("");
  const levelRows = (stats.salesByBuyerLevel || []).map(function (row) {
    return '<tr><td>' + translateText("Level") + ' ' + localizedDigits(row.level) + '</td><td>' + localizedDigits(row.sales) + '</td><td class="amount">' + apiMoney(row.revenue, connected.currency) + '</td></tr>';
  }).join("");
  const dateRows = (stats.salesByPaidDate || []).slice(0, 14).map(function (row) {
    const label = new Date(row.date + "T12:00:00").toLocaleDateString(uiLanguage === "fa" ? "fa-IR" : "en-US");
    return '<tr><td>' + esc(label) + '</td><td>' + localizedDigits(row.sales) + '</td><td class="amount">' + apiMoney(row.revenue, connected.currency) + '</td></tr>';
  }).join("");
  const commissionRows = (connected.commissions && connected.commissions.byUser || []).filter(function (row) { return row.amount !== 0; }).slice(0, 8).map(function (row) {
    return '<tr><td><span data-preserve-content>' + esc(row.name) + '</span></td><td>' + localizedDigits(row.entries) + '</td><td class="amount">' + apiMoney(row.amount, connected.currency) + '</td></tr>';
  }).join("");
  const saleRows = (connected.recentSales || []).slice(0, 10).map(function (sale) {
    return '<tr><td><span data-preserve-content>' + esc(sale.buyerName) + '</span></td><td>' + esc(sale.planName) + '</td><td><span class="badge badge-' + esc(sale.status) + '">' + translateText(sale.status === "paid" ? "Paid" : "Refunded") + '</span></td><td class="amount">' + apiMoney(sale.amountPaid, connected.currency) + '</td><td class="muted">' + esc(formatDate(sale.paidAt)) + '</td></tr>';
  }).join("");
  const treeHtml = connected.tree && connected.tree.root
    ? '<div class="api-tree-scroll"><ul class="api-tree-list">' + apiTreeNodeMarkup(connected.tree.root, true)
      + (connected.tree.orphaned || []).map(function (node) { return apiTreeNodeMarkup(node, false); }).join("") + '</ul></div>'
    : '<div class="empty-report">' + translateText("No users have been synced yet.") + '</div>';
  const report = '<div class="api-stats-grid">'
    + '<div class="metric"><div class="metric-label">' + translateText("Paid website sales") + '</div><div class="metric-value">' + localizedDigits(stats.paidSaleCount || 0) + '</div><div class="metric-note">' + localizedDigits(stats.userCount || 0) + ' ' + translateText("Users") + '</div></div>'
    + '<div class="metric"><div class="metric-label">' + translateText("Website paid revenue") + '</div><div class="metric-value">' + apiMoney(stats.paidRevenue, connected.currency) + '</div><div class="metric-note">' + translateText("Paid revenue") + '</div></div>'
    + '<div class="metric"><div class="metric-label">' + translateText("Shop allocation") + '</div><div class="metric-value">' + apiMoney(stats.shopAllocation, connected.currency) + '</div><div class="metric-note">' + localizedDigits(connected.settings.shopRate) + '٪</div></div>'
    + '<div class="metric"><div class="metric-label">' + translateText("Commissions paid to active users") + '</div><div class="metric-value">' + apiMoney(stats.activeUserCommissions, connected.currency) + '</div><div class="metric-note">' + translateText("Commission earned") + '</div></div>'
    + '<div class="metric"><div class="metric-label">' + translateText("CEO / Shop Owner Pocket balance") + '</div><div class="metric-value">' + apiMoney(stats.ceoPocketBalance, connected.currency) + '</div><div class="metric-note">' + translateText("Shop allocations, routed commissions, and CEO residual") + '</div></div>'
    + '<div class="metric"><div class="metric-label">' + translateText("Save Box balance") + '</div><div class="metric-value">' + apiMoney(stats.saveBoxBalance, connected.currency) + '</div><div class="metric-note">' + translateText("Separate from the CEO / Shop Owner Pocket") + '</div></div></div>'
    + '<div class="api-report-grid"><section class="panel api-report-panel"><h2>' + translateText("Sales by subscription plan") + '</h2>' + (planRows ? '<div class="table-wrap"><table><thead><tr><th>' + translateText("Plan") + '</th><th>' + translateText("Sales") + '</th><th>' + translateText("Paid amount") + '</th></tr></thead><tbody>' + planRows + '</tbody></table></div>' : '<div class="empty-report">' + translateText("No website sales have been sent to the API.") + '</div>') + '</section>'
    + '<section class="panel api-report-panel"><h2>' + translateText("By buyer level") + '</h2>' + (levelRows ? '<div class="table-wrap"><table><thead><tr><th>' + translateText("Level") + '</th><th>' + translateText("Sales") + '</th><th>' + translateText("Paid amount") + '</th></tr></thead><tbody>' + levelRows + '</tbody></table></div>' : '<div class="empty-report">' + translateText("No website sales have been sent to the API.") + '</div>') + '</section>'
    + '<section class="panel api-report-panel"><h2>' + translateText("By paid date") + '</h2>' + (dateRows ? '<div class="table-wrap"><table><thead><tr><th>' + translateText("Date") + '</th><th>' + translateText("Sales") + '</th><th>' + translateText("Paid amount") + '</th></tr></thead><tbody>' + dateRows + '</tbody></table></div>' : '<div class="empty-report">' + translateText("No website sales have been sent to the API.") + '</div>') + '</section>'
    + '<section class="panel api-report-panel"><h2>' + translateText("Top commission earners") + '</h2>' + (commissionRows ? '<div class="table-wrap"><table><thead><tr><th>' + translateText("User / buyer") + '</th><th>' + translateText("Sales") + '</th><th>' + translateText("Commission earned") + '</th></tr></thead><tbody>' + commissionRows + '</tbody></table></div>' : '<div class="empty-report">' + translateText("No commission entries yet.") + '</div>') + '</section></div>'
    + '<section class="panel api-report-panel"><div class="api-report-title"><div><h2>' + translateText("Recent website sales") + '</h2><p>' + translateText("Paid subscriptions only; refunded sales are excluded from these totals.") + '</p></div><span class="api-updated">' + translateText("Updated") + ' ' + esc(formatDateTime(connected.generatedAt)) + '</span></div>'
    + (saleRows ? '<div class="table-wrap"><table><thead><tr><th>' + translateText("Buyer") + '</th><th>' + translateText("Plan") + '</th><th>' + translateText("Status") + '</th><th>' + translateText("Paid amount") + '</th><th>' + translateText("Date") + '</th></tr></thead><tbody>' + saleRows + '</tbody></table></div>' : '<div class="empty-report">' + translateText("No website sales have been sent to the API.") + '</div>') + '</section>'
    + '<section class="panel api-report-panel"><div class="api-report-title"><div><h2>' + translateText("Referral network from website") + '</h2><p>' + translateText("Referral levels are calculated automatically from the inviter chain.") + '</p></div><span class="badge badge-customer">' + localizedDigits((connected.tree || {}).userCount || 0) + ' ' + translateText("Users") + '</span></div>' + treeHtml + '</section>';
  return pageHead("Website API", translateText("Connected to website API"), '<button class="button button-quiet button-small" type="button" data-action="api-refresh">' + translateText("Refresh website data") + '</button>')
    + apiForm + report + docs;
}
async function connectWebsiteApi() {
  const baseUrl = String(apiConnection.baseUrl || "").replace(/\/+$/, "");
  const readToken = String(apiConnection.readToken || "");
  if (!baseUrl || !readToken) {
    apiConnectionError = "Check the API URL, read-only key, and allowed website origin.";
    apiDashboardData = null;
    if (currentView === "api") render();
    return;
  }
  apiLoading = true;
  apiConnectionError = "";
  if (currentView === "api") render();
  try {
    const response = await fetch(baseUrl + "/api/v1/dashboard", {
      method: "GET",
      headers: { "Authorization": "Bearer " + readToken, "Accept": "application/json" },
      cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data && data.error && data.error.message ? data.error.message : "The API request failed.");
    apiDashboardData = data;
    sessionStorage.setItem(API_PREF_KEY, JSON.stringify(apiConnection));
  } catch (error) {
    apiDashboardData = null;
    apiConnectionError = error && error.message ? error.message : "Could not connect to the website API.";
  } finally {
    apiLoading = false;
    if (currentView === "api") render();
  }
}
function render() {
  if (!signedInAccountId) return;
  if (!isOwnerSession()) {
    currentView = "member";
    memberViewId = signedInMemberId();
  }
  const labels = { overview: "Overview", guide: "How it works", sales: "Sales", people: "Users", member: "Member panel", tree: "Full network tree", api: "Website API", savebox: "Save Box", ledger: "Ledger", settings: "Settings" };
  document.getElementById("page-crumb").textContent = labels[currentView] || "Overview";
  document.getElementById("sale-count").textContent = localizedDigits(state.sales.length);
  document.querySelectorAll(".nav-item[data-view]").forEach(function (button) {
    button.classList.toggle("active", button.getAttribute("data-view") === currentView);
  });
  const main = document.getElementById("main-content");
  if (currentView === "overview") main.innerHTML = renderOverview();
  else if (currentView === "guide") main.innerHTML = renderHowItWorks();
  else if (currentView === "sales") main.innerHTML = renderSales();
  else if (currentView === "people") main.innerHTML = renderPeople();
  else if (currentView === "member") main.innerHTML = renderMemberPanel();
  else if (currentView === "tree") renderTree();
  else if (currentView === "api") main.innerHTML = renderApiPage();
  else if (currentView === "savebox") main.innerHTML = renderSaveBox();
  else if (currentView === "ledger") main.innerHTML = renderLedger();
  else main.innerHTML = renderSettings();
  applyLanguage(document.body);
}
function switchView(view) {
  if (!signedInAccountId) return;
  currentView = isOwnerSession() ? (view || "overview") : "member";
  editingPersonId = null;
  document.getElementById("sidebar").classList.remove("open");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (currentView === "api" && apiConnection.readToken && !apiDashboardData) connectWebsiteApi();
}
function wouldCreateCycle(personId, referrerId) {
  let next = referrerId;
  const seen = new Set();
  while (next) {
    if (next === personId || seen.has(next)) return true;
    seen.add(next);
    const parent = personById(next);
    if (!parent) return false;
    next = parent.referrerId;
  }
  return false;
}
function addPerson(form) {
  const data = new FormData(form);
  const id = String(data.get("personId") || "");
  const name = String(data.get("name") || "").trim();
  const role = data.get("role") === "employee" ? "employee" : "customer";
  const referrerId = String(data.get("referrerId") || "") || null;
  if (!name) return toast("Enter a name first.", "error");
  const inviter = referrerId ? personById(referrerId) : null;
  if (role === "employee" && (!inviter || inviter.role !== "owner")) return toast("Employees must report directly to the Shop Owner.", "error");
  if (role === "customer" && inviter && inviter.role !== "employee" && inviter.role !== "customer") return toast("Customers can be referred by an employee or another customer.", "error");
  if (referrerId && wouldCreateCycle(id, referrerId)) return toast("That inviter would create a referral cycle.", "error");
  if (id) {
    const person = personById(id);
    if (!person || person.role === "owner") return toast("The Shop Owner record cannot be edited here.", "error");
    person.name = name;
    person.role = role;
    person.referrerId = referrerId;
    toast("Person updated.");
  } else {
    state.people.push({ id: makeId("person"), name: name, role: role, referrerId: referrerId, createdAt: new Date().toISOString(), subscriptionExpiresAt: null });
    toast("User added.");
  }
  editingPersonId = null;
  persist();
  render();
}
function addSale(form) {
  const data = new FormData(form);
  const customerId = String(data.get("customerId") || "");
  const planId = String(data.get("planId") || "");
  const plan = planById(planId);
  const customer = personById(customerId);
  if (!customer || customer.role === "owner" || !plan) return toast("Choose an employee or customer user and a valid plan.", "error");
  const welcomeRequested = Boolean(data.get("welcomeRequested"));
  if (welcomeRequested) {
    const info = saleDiscountInfo(customerId, planId);
    if (!info.firstSale) return toast("Welcome discount applies only to the user's first paid subscription.", "error");
    if (!info.eligible) return toast(discountRequirementText(info.reserveRequirement), "error");
  }
  const sale = {
    id: makeId("sale"),
    customerId: customerId,
    customerName: customer.name,
    planId: plan.id,
    planName: plan.name,
    priceSnapshot: Math.round(Number(plan.price)),
    welcomeRequested: welcomeRequested,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  state.sales.push(sale);
  if (data.get("status") === "paid") {
    const result = postSale(sale);
    if (!result.ok) {
      state.sales = state.sales.filter(function (s) { return s.id !== sale.id; });
      return toast(result.message, "error");
    }
  } else {
    persist();
  }
  toast(data.get("status") === "paid" ? "Paid subscription recorded and allocations posted." : "Pending subscription saved. No allocations have been posted.");
  render();
}
function markPaid(id) {
  const sale = state.sales.find(function (s) { return s.id === id; });
  if (!sale || sale.status !== "pending") return;
  const result = postSale(sale);
  if (!result.ok) return toast(result.message, "error");
  toast("Payment confirmed. The referral split has been posted.");
  render();
}
function refundSaleById(id) {
  const sale = state.sales.find(function (s) { return s.id === id; });
  if (!sale || sale.status !== "paid") return;
  if (!window.confirm(translateText("Refund this sale and reverse its allocations? This will add reversal entries to the ledger."))) return;
  reverseSale(sale);
  toast("Refund recorded. Reversal entries were added to the ledger.");
  render();
}
function saveSettings(form) {
  const data = new FormData(form);
  const shopRate = Number(data.get("shopRate"));
  const referralRate = Number(data.get("referralRate"));
  const welcomeRate = Number(data.get("welcomeRate"));
  const reserveRate = Number(data.get("reserveRate"));
  const subscriptionMonths = Number(data.get("subscriptionMonths"));
  const rawPrecision = data.get("currencyPrecision");
  const currencyPrecision = rawPrecision == null ? (Number(state.settings.currencyPrecision) || 0) : Number(rawPrecision);
  if (![shopRate, referralRate, welcomeRate, reserveRate].every(Number.isFinite)) return toast("Enter valid percentages.", "error");
  if (!Number.isInteger(subscriptionMonths) || subscriptionMonths < 1 || subscriptionMonths > 24) return toast("Subscription validity must be between 1 and 24 months.", "error");
  if (Math.round((shopRate + referralRate) * 100) !== 10000) return toast("Shop allocation and referral pool must add to 100%.", "error");
  if ([shopRate, referralRate, welcomeRate, reserveRate].some(function (rate) { return rate < 0 || rate > 100; })) return toast("Percentages must be between 0 and 100.", "error");
  if (!Number.isInteger(currencyPrecision) || currencyPrecision < 0 || currencyPrecision > 4) return toast("Currency precision must be between 0 and 4 decimal places.", "error");
  if ((state.ledger.length || state.sales.length) && currencyPrecision !== Number(state.settings.currencyPrecision || 0)) return toast("Currency precision is locked after sales or financial entries exist so old amounts remain accurate.", "error");
  try {
    const plans = state.settings.plans.map(function (plan, i) {
      const name = String(data.get("planName" + i) || "").trim();
      const price = parseAmountInput(data.get("planPrice" + i), currencyPrecision);
      if (!name) throw new Error("Each plan needs a name.");
      return { id: plan.id, name: name, price: price };
    });
    state.settings = Object.assign({}, state.settings, {
      shopRate: shopRate,
      referralRate: referralRate,
      welcomeRate: welcomeRate,
      reserveRate: reserveRate,
      subscriptionMonths: subscriptionMonths,
      currencyPrecision: currencyPrecision,
      currencyLabel: String(data.get("currencyLabel") || "").trim(),
      plans: plans
    });
  } catch (error) {
    return toast(error.message, "error");
  }
  persist();
  toast("Settings saved. Existing ledger entries are unchanged.");
  render();
}
function loadDemoData() {
  state = blankState();
  state.demoData = true;
  const employee = { id: "demo-employee", name: "Nora Employee", role: "employee", referrerId: "owner", createdAt: new Date().toISOString() };
  const mina = { id: "demo-mina", name: "Mina Customer", role: "customer", referrerId: employee.id, createdAt: new Date().toISOString() };
  const arman = { id: "demo-arman", name: "Arman Customer", role: "customer", referrerId: mina.id, createdAt: new Date().toISOString() };
  const sara = { id: "demo-sara", name: "Sara Customer", role: "customer", referrerId: arman.id, createdAt: new Date().toISOString() };
  state.people.push(employee, mina, arman, sara);
  const demoSales = [
    { customerId: employee.id, planId: "bronze" },
    { customerId: mina.id, planId: "bronze" },
    { customerId: arman.id, planId: "bronze" },
    { customerId: sara.id, planId: "bronze" },
    { customerId: mina.id, planId: "silver" },
    { customerId: arman.id, planId: "bronze" }
  ];
  demoSales.forEach(function (row) {
    const plan = planById(row.planId);
    const sale = {
      id: makeId("demo-sale"), customerId: row.customerId, customerName: personName(row.customerId),
      planId: plan.id, planName: plan.name, priceSnapshot: plan.price, welcomeRequested: false,
      status: "pending", createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000).toISOString()
    };
    state.sales.push(sale);
    postSale(sale);
  });
  state.demoData = true;
  persist();
  switchView("overview");
  toast("Sample workspace loaded. Clear it before entering real records.");
}
function clearWorkspace() {
  if (!window.confirm(translateText("Clear all people, sales, balances, and ledger entries from this browser? Export a backup first if you need these records."))) return;
  const clearedIds = new Set(state.people.map(function (person) { return person.id; }));
  state = blankState();
  persist();
  const accounts = readAccountStore();
  accounts.accounts = Object.fromEntries(Object.entries(accounts.accounts).filter(function (entry) {
    return ["owner", "builtin-admin", "builtin-demo"].includes(entry[0]) || !clearedIds.has(entry[0]);
  }));
  saveAccountStore(accounts);
  editingPersonId = null;
  switchView("overview");
  toast("Workspace cleared.");
}
function exportBackup() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "branch-ledger-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast("Backup exported.");
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported || !Array.isArray(imported.people) || !Array.isArray(imported.sales) || !Array.isArray(imported.ledger) || !imported.settings) {
        throw new Error("This file is not a Branch Ledger backup.");
      }
      if (!imported.people.some(function (p) { return p.id === "owner"; })) throw new Error("The backup has no Shop Owner root.");
      const mergedSettings = Object.assign({}, blankState().settings, imported.settings);
      delete mergedSettings.boxShareOfPool;
      delete mergedSettings.ownerMatchSaveBox;
      if (!Array.isArray(mergedSettings.plans) || !Number.isInteger(Number(mergedSettings.currencyPrecision)) || Number(mergedSettings.currencyPrecision) < 0 || Number(mergedSettings.currencyPrecision) > 4) throw new Error("The backup has invalid currency or plan settings.");
      if (!Number.isInteger(Number(mergedSettings.subscriptionMonths)) || Number(mergedSettings.subscriptionMonths) < 1 || Number(mergedSettings.subscriptionMonths) > 24) throw new Error("The backup has invalid subscription validity settings.");
      if (![mergedSettings.shopRate, mergedSettings.referralRate, mergedSettings.welcomeRate, mergedSettings.reserveRate].every(function (n) { return Number.isFinite(Number(n)) && Number(n) >= 0 && Number(n) <= 100; })) throw new Error("The backup contains an invalid percentage.");
      if (Math.round((Number(mergedSettings.shopRate) + Number(mergedSettings.referralRate)) * 100) !== 10000) throw new Error("The backup allocation settings exceed the allowed pool.");
      mergedSettings.currencyPrecision = Number(mergedSettings.currencyPrecision);
      mergedSettings.subscriptionMonths = Number(mergedSettings.subscriptionMonths);
      mergedSettings.plans.forEach(function (plan) {
        if (!plan || !plan.id || !String(plan.name || "").trim() || !Number.isSafeInteger(Number(plan.price)) || Number(plan.price) < 0) throw new Error("The backup contains an invalid subscription plan.");
      });
      const ids = new Set();
      imported.people.forEach(function (person) {
        if (!person || !person.id || ids.has(person.id) || !String(person.name || "").trim() || !["owner", "employee", "customer"].includes(person.role)) throw new Error("The backup contains an invalid or duplicate person.");
        if (person.subscriptionExpiresAt != null && !Number.isFinite(new Date(person.subscriptionExpiresAt).getTime())) throw new Error("The backup contains an invalid subscription expiry date.");
        ids.add(person.id);
      });
      const owner = imported.people.find(function (person) { return person.id === "owner"; });
      if (!owner || owner.role !== "owner" || owner.referrerId) throw new Error("The backup has an invalid Shop Owner root.");
      imported.people.forEach(function (person) {
        if (person.id === "owner") return;
        if (person.referrerId && !ids.has(person.referrerId)) throw new Error("A person in the backup has a missing inviter.");
        const inviter = person.referrerId ? imported.people.find(function (candidate) { return candidate.id === person.referrerId; }) : null;
        if (person.role === "employee" && (!inviter || inviter.role !== "owner")) throw new Error("Every employee in the backup must report to the Shop Owner.");
        if (person.role === "customer" && inviter && inviter.role !== "employee" && inviter.role !== "customer") throw new Error("Customers in the backup must be referred by employees or customers.");
        const seen = new Set([person.id]);
        let cursor = person.referrerId;
        while (cursor) {
          if (seen.has(cursor)) throw new Error("The backup contains a referral cycle.");
          seen.add(cursor);
          const parent = imported.people.find(function (candidate) { return candidate.id === cursor; });
          cursor = parent ? parent.referrerId : null;
        }
      });
      const planIds = new Set(mergedSettings.plans.map(function (plan) { return plan.id; }));
      if (imported.sales.some(function (sale) {
        const buyer = sale && imported.people.find(function (person) { return person.id === sale.customerId; });
        return !sale || !buyer || buyer.role === "owner" || !planIds.has(sale.planId) || !["pending", "paid", "refunded"].includes(sale.status)
          || (sale.priceSnapshot != null && (!Number.isSafeInteger(Number(sale.priceSnapshot)) || Number(sale.priceSnapshot) < 0))
          || (sale.subscriptionMonthsSnapshot != null && (!Number.isInteger(Number(sale.subscriptionMonthsSnapshot)) || Number(sale.subscriptionMonthsSnapshot) < 1 || Number(sale.subscriptionMonthsSnapshot) > 24));
      })) throw new Error("The backup contains an invalid sale record.");
      if (imported.ledger.some(function (entry) { return !entry || !Number.isSafeInteger(Number(entry.delta)) || !entry.account || !entry.type || (String(entry.account).indexOf("person:") === 0 && !ids.has(String(entry.account).slice(7))); })) throw new Error("The backup contains an invalid ledger entry.");
      if (imported.ledger.reduce(function (sum, entry) { return sum + (entry.account === "savebox" ? Number(entry.delta) : 0); }, 0) < 0) throw new Error("The backup would make the Save Box balance negative.");
      if (!window.confirm(translateText("Replace this browser’s current workspace with the selected backup?"))) return;
      imported.sales.forEach(function (sale) {
        if (sale.status === "paid" && !sale.subscriptionMonthsSnapshot) sale.subscriptionMonthsSnapshot = mergedSettings.subscriptionMonths;
      });
      imported.people.forEach(function (person) {
        if (person.role !== "owner" && !Object.prototype.hasOwnProperty.call(person, "subscriptionExpiresAt")) {
          person.subscriptionExpiresAt = subscriptionExpiryFromSales(person.id, imported.sales, mergedSettings.subscriptionMonths);
        }
      });
      state = imported;
      state.settings = mergedSettings;
      state.demoData = Boolean(state.demoData);
      persist();
      render();
      toast("Backup imported.");
    } catch (error) {
      toast(error.message || "Could not import this backup.", "error");
    }
  };
  reader.readAsText(file);
}
function addLedgerAdjustment(form) {
  const data = new FormData(form);
  const account = data.get("account") === "owner" ? "owner" : "savebox";
  const amount = parseAmountInput(data.get("amount"), state.settings.currencyPrecision);
  if (amount <= 0) return toast("Enter an adjustment greater than zero.", "error");
  const direction = data.get("direction") === "remove" ? -1 : 1;
  const delta = amount * direction;
  if (account === "savebox" && boxBalance() + delta < 0) return toast("This adjustment would make the Save Box balance negative.", "error");
  const note = String(data.get("note") || "").trim();
  if (!note) return toast("Enter a reason for the adjustment.", "error");
  ledgerEntry(account, delta, "Admin adjustment", null, null, note);
  persist();
  toast("Adjustment posted to the ledger.");
  render();
}
function updateSalePreview() {
  const customer = document.getElementById("sale-customer");
  const plan = document.getElementById("sale-plan");
  const discount = document.getElementById("sale-discount");
  const preview = document.getElementById("sale-preview");
  if (!preview) return;
  preview.innerHTML = salePreviewHtml(customer ? customer.value : "", plan ? plan.value : "", Boolean(discount && discount.checked));
  applyLanguage(preview);
  if (discount && customer && plan && customer.value && plan.value) {
    const info = saleDiscountInfo(customer.value, plan.value);
    discount.disabled = !info.eligible;
    if (!info.eligible) discount.checked = false;
  }
}
function filterLedger(value) {
  const term = String(value || "").toLowerCase().trim();
  const entries = state.ledger.slice().reverse().filter(function (e) {
    return !term || [ledgerAccountName(e), e.type, e.note, e.personId ? personName(e.personId) : ""].join(" ").toLowerCase().includes(term);
  });
  const host = document.getElementById("ledger-table");
  if (host) {
    host.innerHTML = renderLedgerTable(entries, false);
    applyLanguage(host);
  }
}
function descendantsOf(id) {
  const found = new Set();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop();
    state.people.filter(function (p) { return p.referrerId === current; }).forEach(function (child) {
      if (!found.has(child.id)) { found.add(child.id); stack.push(child.id); }
    });
  }
  return found;
}

document.addEventListener("click", function (event) {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    event.preventDefault();
    switchView(nav.getAttribute("data-view"));
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.getAttribute("data-action");
  if (action === "disable-login") disableMemberLogin(document.getElementById("account-user").value);
  else if (action === "new-sale") switchView("sales");
  else if (action === "api-refresh") connectWebsiteApi();
  else if (action === "go-people") switchView("people");
  else if (action === "export-settings") exportBackup();
  else if (action === "import-settings") {
    const input = document.getElementById("import-input");
    if (input) input.click();
  }
  else if (action === "edit-person") {
    editingPersonId = button.getAttribute("data-id");
    switchView("people");
    editingPersonId = button.getAttribute("data-id");
    render();
  } else if (action === "view-member") {
    memberViewId = button.getAttribute("data-id") || "";
    switchView("member");
  } else if (action === "cancel-edit") {
    editingPersonId = null;
    render();
  } else if (action === "mark-paid") markPaid(button.getAttribute("data-id"));
  else if (action === "refund-sale") refundSaleById(button.getAttribute("data-id"));
  else if (action === "tree-toggle") {
    const list = button.closest(".tree-node").nextElementSibling;
    if (list) {
      list.classList.toggle("collapsed");
      const collapsed = list.classList.contains("collapsed");
      button.textContent = collapsed ? "+" : "−";
      button.setAttribute("aria-label", translateText((collapsed ? "Expand" : "Collapse") + " referrals"));
    }
  } else if (action === "clear-workspace" || action === "clear-demo") clearWorkspace();
  else if (action === "load-demo") loadDemoData();
});
document.addEventListener("submit", function (event) {
  if (event.target.id === "auth-form") {
    event.preventDefault();
    submitLogin(event.target);
  } else if (event.target.id === "owner-setup-form") {
    event.preventDefault();
    setupOwnerAccount(event.target);
  } else if (event.target.id === "account-access-form") {
    event.preventDefault();
    saveMemberLogin(event.target);
  } else if (event.target.id === "api-connect-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    apiConnection = {
      baseUrl: String(data.get("baseUrl") || "").trim().replace(/\/+$/, ""),
      readToken: String(data.get("readToken") || "").trim()
    };
    sessionStorage.setItem(API_PREF_KEY, JSON.stringify(apiConnection));
    apiDashboardData = null;
    connectWebsiteApi();
  } else if (event.target.id === "person-form") {
    event.preventDefault();
    addPerson(event.target);
  } else if (event.target.id === "sale-form") {
    event.preventDefault();
    addSale(event.target);
  } else if (event.target.id === "settings-form") {
    event.preventDefault();
    saveSettings(event.target);
  } else if (event.target.id === "adjustment-form") {
    event.preventDefault();
    try { addLedgerAdjustment(event.target); } catch (error) { toast(error.message, "error"); }
  }
});
document.addEventListener("change", function (event) {
  if (event.target.id === "account-user") {
    const credential = accountCredential(event.target.value);
    const usernameInput = document.getElementById("account-username");
    if (usernameInput) usernameInput.value = credential ? credential.username : (event.target.value === "owner" ? "owner" : "");
  }
  if (event.target.id === "member-select") {
    memberViewId = event.target.value;
    render();
  }
  if (["sale-customer", "sale-plan", "sale-discount"].includes(event.target.id)) updateSalePreview();
  if (event.target.id === "import-input") importBackup(event.target.files[0]);
  if (event.target.id === "person-role") {
    const inviter = document.getElementById("person-referrer");
    if (inviter) {
      const preferred = event.target.value === "employee" ? "owner" : "";
      inviter.innerHTML = referrerOptions(preferred, document.querySelector('#person-form [name="personId"]').value || null, event.target.value);
      inviter.value = preferred;
      applyLanguage(inviter);
    }
  }
  if (event.target.id === "currency-precision") {
    const places = Number(event.target.value);
    const step = places ? "0." + "0".repeat(Math.max(0, places - 1)) + "1" : "1";
    document.querySelectorAll('#settings-form input[name^="planPrice"]').forEach(function (input) { input.step = step; });
  }
});
document.addEventListener("input", function (event) {
  if (event.target.id === "ledger-search") filterLedger(event.target.value);
});
document.getElementById("export-button").addEventListener("click", exportBackup);
document.getElementById("language-toggle").addEventListener("click", function () {
  uiLanguage = uiLanguage === "fa" ? "en" : "fa";
  localStorage.setItem(LANGUAGE_KEY, uiLanguage);
  render();
});
document.getElementById("auth-language-toggle").addEventListener("click", function () {
  uiLanguage = uiLanguage === "fa" ? "en" : "fa";
  localStorage.setItem(LANGUAGE_KEY, uiLanguage);
  applyLanguage(document.body);
});
document.getElementById("owner-setup-toggle").addEventListener("click", function () {
  showAuth(document.getElementById("owner-setup-form").hidden);
});
document.getElementById("sign-out-button").addEventListener("click", function () {
  showAuth(false);
});
document.getElementById("mobile-menu").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("open");
});

initializeAuthentication();
