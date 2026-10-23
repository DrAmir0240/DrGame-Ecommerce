// Trust pages: Terms of Service, Privacy Policy, Refund Policy (+ the E-Namad badge).
//
// The texts below are STARTER TEMPLATES written for this kind of site (a PlayStation game library).
// They are not legal advice: have them checked by a lawyer for your
// country before you rely on them. The admin can replace any text (Admin -> Legal & Trust);
// a saved text always wins over the default here.
//
// Format (very small markdown): "# Heading", "## Sub-heading", "- bullet", blank line = new paragraph.
const express = require('express');

const DOCS = ['terms', 'privacy', 'refund'];

const DEFAULTS = {
  terms: {
    title_en: 'Terms of Service',
    title_fa: 'شرایط استفاده از خدمات',
    en: `# Terms of Service

By creating an account or using this website ("the Service") you agree to these terms. If you do not agree, please do not use the Service.

## 1. What the Service is
The Service provides information and downloads for PlayStation games. Some games are free or included in the free plan; other game access requires an active paid subscription.

## 2. Your account
- You must give correct information and keep your password private. You are responsible for everything done with your account.
- One person, one account. We may suspend accounts that are shared, resold or used to abuse offers.
- We may ask you to verify your email address and phone number.

## 3. Download allowance
- Paid plans include the download allowance shown on the Subscription page.
- Unlocking a game uses quota equal to the total size of that game's available downloads.
- When the allowance is used, you cannot unlock more games. Games already unlocked remain available until the subscription expires.
- The free plan provides access only to the games listed on the Subscription page.

## 4. Subscriptions
- A paid subscription gives you the benefits and download allowance shown on the Subscription page for 30 days from activation.
- A plan does not renew by itself unless the page says so.

## 5. Unlocked files and acceptable use
- When you unlock a file you receive a personal, non-exclusive licence to download and use it for yourself.
- You may not resell, re-upload, share publicly or otherwise redistribute files from the Service.
- You may not try to bypass payments, locks or limits, attack the Service, or use it for anything illegal.

## 6. Content and copyright
Game titles, logos and artwork belong to their owners and are used here for information. If you believe something on the Service infringes your rights, tell us through the Contact page and we will review it quickly and remove it where appropriate.

## 7. Discount codes and invitations
Codes and invitation rewards are promotional. They have no cash value, may be limited or expire, and may be cancelled if they are abused.

## 8. Availability and liability
The Service is provided "as is". We try to keep it running but cannot promise it will always be available or free of errors. To the extent allowed by law, we are not liable for indirect losses, and our total liability for any claim is limited to the amount you paid us in the 3 months before it.

## 9. Ending your account
You can stop using the Service at any time. We may suspend or close accounts that break these terms.

## 10. Changes
We may update these terms. The date at the top of this page shows the latest version. Continuing to use the Service after a change means you accept it.

## 11. Contact
Questions about these terms? Use the Contact page.`,
    fa: `# شرایط استفاده از خدمات

با ساخت حساب کاربری یا استفاده از این وب‌سایت («سرویس»)، این شرایط را می‌پذیرید. اگر موافق نیستید، لطفاً از سرویس استفاده نکنید.

## ۱. سرویس چیست؟
سرویس، اطلاعات و دانلود بازی‌های پلی‌استیشن را ارائه می‌کند. بعضی بازی‌ها رایگان یا در پلن رایگان هستند و دسترسی به بازی‌های دیگر به اشتراک پولی فعال نیاز دارد.

## ۲. حساب کاربری شما
- باید اطلاعات درست وارد کنید و رمز عبور خود را محرمانه نگه دارید. مسئولیت هر کاری که با حساب شما انجام شود با خودتان است.
- هر نفر یک حساب. حساب‌هایی که به اشتراک گذاشته، فروخته یا برای سوءاستفاده از تخفیف‌ها استفاده شوند ممکن است مسدود شوند.
- ممکن است از شما خواسته شود ایمیل و شماره موبایل خود را تأیید کنید.

## ۳. سهمیه دانلود
- پلن‌های پولی سهمیه‌ای به اندازه‌ای که در صفحه اشتراک نشان داده شده ارائه می‌کنند.
- بازکردن بازی، سهمیه‌ای برابر با حجم کل دانلودهای موجود همان بازی مصرف می‌کند.
- پس از اتمام سهمیه نمی‌توانید بازی دیگری باز کنید. بازی‌های بازشده تا پایان اشتراک در دسترس می‌مانند.
- پلن رایگان فقط بازی‌های فهرست‌شده در صفحه اشتراک را شامل می‌شود.

## ۴. اشتراک
- اشتراک پولی، مزایا و سهمیه دانلود نمایش‌داده‌شده در صفحه اشتراک را برای ۳۰ روز از زمان فعال‌سازی در اختیار شما می‌گذارد.
- مگر اینکه در صفحه ذکر شده باشد، اشتراک به‌صورت خودکار تمدید نمی‌شود.

## ۵. فایل‌های بازشده و استفاده‌ی مجاز
- با باز کردن یک فایل، مجوز شخصی و غیرانحصاری دانلود و استفاده برای خودتان را دریافت می‌کنید.
- فروش مجدد، بارگذاری دوباره، اشتراک‌گذاری عمومی یا هر نوع بازنشر فایل‌های سرویس ممنوع است.
- دور زدن پرداخت‌ها، قفل‌ها و محدودیت‌ها، حمله به سرویس یا استفاده‌ی غیرقانونی ممنوع است.

## ۶. محتوا و حق نشر
نام، آرم و تصاویر بازی‌ها متعلق به صاحبان آن‌هاست و در اینجا برای اطلاع‌رسانی استفاده می‌شود. اگر فکر می‌کنید محتوایی حقوق شما را نقض می‌کند، از طریق صفحه‌ی «تماس با ما» اطلاع دهید تا سریع بررسی و در صورت لزوم حذف شود.

## ۷. کد تخفیف و دعوت دوستان
کدها و پاداش دعوت جنبه‌ی تبلیغاتی دارند، ارزش نقدی ندارند، ممکن است محدود یا منقضی شوند و در صورت سوءاستفاده لغو می‌شوند.

## ۸. در دسترس بودن و مسئولیت
سرویس «همان‌گونه که هست» ارائه می‌شود. تلاش می‌کنیم همیشه در دسترس باشد اما نمی‌توانیم دسترسی دائمی یا نبود خطا را تضمین کنیم. تا حدی که قانون اجازه می‌دهد، مسئول خسارت‌های غیرمستقیم نیستیم و مسئولیت ما در هر ادعا به مبلغی که در ۳ ماه قبل از آن به ما پرداخته‌اید محدود است.

## ۹. پایان حساب
هر زمان می‌توانید استفاده از سرویس را متوقف کنید. حساب‌هایی که این شرایط را نقض کنند ممکن است معلق یا بسته شوند.

## ۱۰. تغییرات
ممکن است این شرایط را به‌روز کنیم. تاریخ بالای این صفحه آخرین نسخه را نشان می‌دهد. ادامه‌ی استفاده پس از تغییر، به معنی پذیرش آن است.

## ۱۱. تماس
برای هر سؤال درباره‌ی این شرایط از صفحه‌ی «تماس با ما» استفاده کنید.`,
  },

  privacy: {
    title_en: 'Privacy Policy',
    title_fa: 'سیاست حریم خصوصی',
    en: `# Privacy Policy

This page explains what personal information we collect, why, and what you can do about it.

## 1. What we collect
- **Account details:** first and last name, username, email address and phone number. Your password is stored only in scrambled (hashed) form; we cannot read it.
- **Subscriptions and orders:** the plan you bought, your download allowance and usage, games you unlocked, and discount-code and invitation activity.
- **Usage:** which game pages you open and which files you use. We use this to suggest games ("For you") and to see which games are popular.
- **Messages you send us:** contact messages, problem reports, and requests for games or subtitles.
- **Technical data:** a login cookie that keeps you signed in, and small items in your browser storage (language, light/dark mode, recently viewed games).

## 2. Why we use it
- To run your account, deliver what you unlock and keep the Service secure.
- To verify your email address and phone number (by email and SMS).
- To process and support purchases.
- To improve the Service and suggest games you may like.

## 3. Who receives it
- Service providers that help us run the Service, for example for sending email and SMS verification codes and, in future, for online payments. They receive only what they need for that task.
- Authorities, when the law requires it.
- We do not sell your personal information.

## 4. How long we keep it
We keep account information while your account exists. Order and payment records may be kept longer where the law requires. You can ask us to delete your account.

## 5. Security
Passwords are hashed, sign-in uses protected cookies, and administration areas need a separate login. No system is perfectly secure, but we work to protect your data.

## 6. Your choices
You can ask to see, correct or delete your information through the Contact page. You can also clear cookies and browser storage at any time (you will be signed out).

## 7. Children
The Service is not meant for children under 13. If you think a child gave us information, contact us and we will delete it.

## 8. Changes
We may update this policy. The date at the top shows the latest version.

## 9. Contact
Privacy questions? Use the Contact page.`,
    fa: `# سیاست حریم خصوصی

این صفحه توضیح می‌دهد چه اطلاعات شخصی‌ای جمع‌آوری می‌کنیم، چرا، و شما چه اختیاری دارید.

## ۱. چه چیزی جمع‌آوری می‌کنیم
- **اطلاعات حساب:** نام و نام خانوادگی، نام کاربری، ایمیل و شماره موبایل. رمز عبور شما فقط به‌صورت رمزنگاری‌شده (هش) ذخیره می‌شود و ما نمی‌توانیم آن را بخوانیم.
- **اشتراک و سفارش‌ها:** پلن خریداری‌شده، سهمیه و سابقه دانلود، بازی‌های بازشده و فعالیت کد تخفیف و دعوت.
- **استفاده:** اینکه کدام صفحه‌ی بازی را باز می‌کنید و از کدام فایل‌ها استفاده می‌کنید. از این اطلاعات برای پیشنهاد بازی («برای شما») و تشخیص بازی‌های محبوب استفاده می‌کنیم.
- **پیام‌هایی که برای ما می‌فرستید:** پیام تماس، گزارش مشکل و درخواست بازی یا زیرنویس.
- **اطلاعات فنی:** کوکی ورود که شما را وارد نگه می‌دارد و چند مورد کوچک در حافظه‌ی مرورگر (زبان، حالت روشن/تیره، بازی‌های اخیراً دیده‌شده).

## ۲. چرا از آن استفاده می‌کنیم
- برای اداره‌ی حساب شما، تحویل آنچه باز می‌کنید و حفظ امنیت سرویس.
- برای تأیید ایمیل و شماره موبایل شما (با ایمیل و پیامک).
- برای پردازش و پشتیبانی خریدها.
- برای بهبود سرویس و پیشنهاد بازی‌هایی که ممکن است دوست داشته باشید.

## ۳. چه کسانی آن را دریافت می‌کنند
- ارائه‌دهندگان خدماتی که به اداره‌ی سرویس کمک می‌کنند، مثلاً برای ارسال کد تأیید با ایمیل و پیامک و در آینده برای پرداخت آنلاین. آن‌ها فقط آنچه برای همان کار لازم است دریافت می‌کنند.
- مراجع قانونی، در صورت الزام قانون.
- اطلاعات شخصی شما را نمی‌فروشیم.

## ۴. چه مدت نگه می‌داریم
اطلاعات حساب را تا زمانی که حساب وجود دارد نگه می‌داریم. سوابق سفارش و پرداخت ممکن است در صورت الزام قانون مدت بیشتری نگه‌داری شوند. می‌توانید درخواست حذف حساب بدهید.

## ۵. امنیت
رمز عبور هش می‌شود، ورود با کوکی محافظت‌شده انجام می‌شود و بخش مدیریت ورود جداگانه دارد. هیچ سیستمی کاملاً امن نیست اما برای محافظت از اطلاعات شما تلاش می‌کنیم.

## ۶. اختیارات شما
می‌توانید از صفحه‌ی «تماس با ما» درخواست مشاهده، اصلاح یا حذف اطلاعاتتان را بدهید. همچنین هر زمان می‌توانید کوکی‌ها و حافظه‌ی مرورگر را پاک کنید (از حساب خارج می‌شوید).

## ۷. کودکان
سرویس برای کودکان زیر ۱۳ سال در نظر گرفته نشده است. اگر فکر می‌کنید کودکی اطلاعاتی به ما داده، تماس بگیرید تا حذف کنیم.

## ۸. تغییرات
ممکن است این سیاست را به‌روز کنیم. تاریخ بالای صفحه آخرین نسخه را نشان می‌دهد.

## ۹. تماس
سؤال درباره‌ی حریم خصوصی دارید؟ از صفحه‌ی «تماس با ما» استفاده کنید.`,
  },

  refund: {
    title_en: 'Refund Policy',
    title_fa: 'سیاست بازگشت وجه',
    en: `# Refund Policy

This page explains how to request help with a subscription purchase or game download.

## 1. Subscription purchases
- A paid subscription starts when activated and lasts 30 days.
- If you were charged but the plan or download allowance did not activate correctly, contact us with the order details so we can investigate and correct the issue or provide an appropriate remedy.
- Each plan's allowance and access are shown on the Subscription page before purchase. Unlocking a game uses quota equal to the total size of that game's available downloads. Unlocked games remain available until the plan expires.

## 2. Download problems
If a game download is missing, broken or does not match its description, contact us with the game name and a description of the issue. We will review it and help restore the promised access or provide another appropriate remedy.

## 3. Refund requests
Refund requests are reviewed based on the order, subscription status, download activity and applicable consumer-protection requirements. A plan that has started or quota that has been used may affect the outcome.

## 4. Discounts
When a discount code was used, any approved refund is based on the amount actually paid.

## 5. How to ask
- Use the **Contact** page and include your username, order date and what went wrong.
- We aim to respond within 3 working days. Approved refunds are returned through the original payment method where possible.

## 6. Abuse
We may review repeated or suspicious refund requests before deciding how to resolve them.`,
    fa: `# سیاست بازگشت وجه

این صفحه روش درخواست رسیدگی به خرید اشتراک یا دانلود بازی را توضیح می‌دهد.

## ۱. خرید اشتراک
- اشتراک پولی با فعال‌سازی آغاز می‌شود و ۳۰ روز اعتبار دارد.
- اگر مبلغی پرداخت کرده‌اید اما پلن یا سهمیه دانلود درست فعال نشده است، مشخصات سفارش را برای ما بفرستید تا مشکل را بررسی و دسترسی را اصلاح کنیم یا راه‌حل مناسبی ارائه دهیم.
- سهمیه و دسترسی هر پلن پیش از خرید در صفحه اشتراک نمایش داده می‌شود. بازکردن بازی به اندازه کل حجم دانلودهای موجود همان بازی از سهمیه مصرف می‌کند. بازی‌های بازشده تا پایان اعتبار پلن در دسترس می‌مانند.

## ۲. مشکل دانلود
اگر دانلود بازی موجود نیست، خراب است یا با توضیحاتش مطابقت ندارد، نام بازی و شرح مشکل را برای ما بفرستید. موضوع را بررسی می‌کنیم و برای بازگرداندن دسترسی وعده‌داده‌شده یا ارائه راه‌حل مناسب کمک می‌کنیم.

## ۳. درخواست بازگشت وجه
درخواست‌ها با توجه به سفارش، وضعیت اشتراک، میزان استفاده از دانلود و الزامات حمایت از مصرف‌کننده بررسی می‌شوند. شروع پلن یا مصرف سهمیه ممکن است بر نتیجه اثر بگذارد.

## ۴. تخفیف
اگر از کد تخفیف استفاده شده باشد، مبلغ بازگشت وجه تأییدشده بر اساس مبلغی است که واقعاً پرداخت شده است.

## ۵. روش درخواست
- از صفحه **تماس با ما** استفاده کنید و نام کاربری، تاریخ سفارش و شرح مشکل را بنویسید.
- تلاش می‌کنیم ظرف ۳ روز کاری پاسخ دهیم. در صورت امکان، بازگشت وجه تأییدشده از روش پرداخت اولیه انجام می‌شود.

## ۶. سوءاستفاده
پیش از تصمیم‌گیری ممکن است درخواست‌های مکرر یا مشکوک را بررسی کنیم.`,
  },
};

module.exports = function mountLegal(app, h) {
  const { J, W, str, bad, limiter } = h;
  const json = express.json({ limit: '300kb' });

  const content = () => J('site-content.json', {});
  const legal = () => content().legal || {};
  const textFor = (doc, lang) => {
    const saved = legal()[doc + '_' + lang];
    return saved && saved.trim() ? saved : DEFAULTS[doc][lang === 'fa' ? 'fa' : 'en'];
  };

  // public: the text of one page, in the visitor's language
  app.get('/api/legal/:doc', limiter(120, 10 * 60 * 1000), (req, res) => {
    const doc = req.params.doc;
    if (!DOCS.includes(doc)) return bad(res, 'Unknown page', 404);
    const lang = req.query.lang === 'fa' ? 'fa' : 'en';
    res.json({ doc, lang, title: DEFAULTS[doc]['title_' + lang], body: textFor(doc, lang), updated: legal()['updated_' + doc] || null, custom: !!(legal()[doc + '_' + lang] || '').trim() });
  });

  // admin: all texts, the defaults, and the E-Namad badge
  app.get('/api/admin/legal', (req, res) => {
    const l = legal();
    const docs = {};
    for (const d of DOCS) docs[d] = { updated: l['updated_' + d] || null, en: l[d + '_en'] || '', fa: l[d + '_fa'] || '', default_en: DEFAULTS[d].en, default_fa: DEFAULTS[d].fa, title_en: DEFAULTS[d].title_en, title_fa: DEFAULTS[d].title_fa };
    res.json({ docs, enamad: l.enamad || { id: '', code: '' }, requireConsent: l.requireConsent !== false });
  });

  app.put('/api/admin/legal', json, (req, res) => {
    const b = req.body || {};
    const out = content();
    const l = { ...(out.legal || {}) };
    const changed = [];
    for (const d of DOCS) for (const lang of ['en', 'fa']) {
      const k = d + '_' + lang;
      if (b[k] === undefined) continue;
      const v = typeof b[k] === 'string' ? b[k].replace(/\r\n/g, '\n').slice(0, 40000) : '';
      if (v !== (l[k] || '')) { changed.push(k); l['updated_' + d] = new Date().toISOString().slice(0, 10); }
      l[k] = v.trim() === DEFAULTS[d][lang].trim() ? '' : v;   // identical to the default = nothing to store
    }
    if (b.enamad !== undefined) {
      const id = str(b.enamad && b.enamad.id, 20), code = str(b.enamad && b.enamad.code, 80);
      if ((id || code) && !(/^\d{1,12}$/.test(id) && /^[A-Za-z0-9]{8,80}$/.test(code))) return bad(res, 'E-Namad ID must be a number and the code letters/numbers only. Copy both from the snippet E-Namad gave you.');
      l.enamad = { id, code };
    }
    if (b.requireConsent !== undefined) l.requireConsent = !!b.requireConsent;
    out.legal = l;
    W('site-content.json', out);
    res.json({ ok: true, changed });
  });

  return { requireConsent: () => legal().requireConsent !== false };
};
module.exports.DEFAULTS = DEFAULTS;
