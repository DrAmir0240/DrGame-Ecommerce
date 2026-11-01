# قرارداد دریافت و نمایش حافظهٔ کنسول در سایت

نسخهٔ سند: ۱ — تاریخ: 2026-10-31
مبنا: قابلیت اضافه‌شده از Download32 01.011 و کد بررسی‌شده برای نسخهٔ 01.015.
مخاطب: برنامه‌نویس سایت اصلی. این سند هیچ رمز یا توکن واقعی ندارد.

## ۱. دقیقاً چه اطلاعاتی می‌گیریم؟

سایت مستقیماً حافظهٔ کنسول را نمی‌خواند. اپ بومی کنسول فضای محل دانلود را می‌خواند، با اثبات کلید دستگاه به سرور می‌فرستد و سایت آخرین گزارش مجاز را از بک‌اند می‌گیرد:

```text
PS5: FileSystem.diskUsage('/data')
        ↓ HTTPS + DPoP
سرور: آخرین گزارش برای کلید دستگاه + زمان دریافت
        ↓ API با session حساب کاربر
سایت: فضای کل، آزاد و زمان آخرین گزارش
```

- `total_bytes`: ظرفیت کل filesystem محل `/data`.
- `free_bytes`: فضای در دسترس اپ برای نوشتن روی همان filesystem.
- واحد انتقال همیشه **بایت** و عدد صحیح است؛ تبدیل به GiB فقط برای نمایش است.
- این عدد جمع حافظهٔ داخلی، USB و همهٔ دیسک‌ها نیست و الزاماً با ظرفیت اسمی روی جعبهٔ کنسول برابر نیست.
- `total - free` را بهتر است «فضای غیرقابل‌استفاده برای دانلود» یا «کل منهای آزاد» نامید؛ ممکن است علاوه بر فایل‌ها، فضای رزروشدهٔ سیستم نیز در آن باشد.
- API مرورگر مانند navigator.storage.estimate فضای sandbox مرورگر را گزارش می‌کند؛ جایگزین خواندن حافظهٔ کنسول توسط اپ نیست.

## ۲. خواندن حافظه در اپ

کد مفهومی مطابق API موجود:

```js
const usage = FileSystem.diskUsage('/data');
const report = {
  volume: '/data',
  total_bytes: usage.total,
  free_bytes: usage.free
};
```

در پیاده‌سازی PS5، اطلاعات با API filesystem بومی خوانده می‌شود: اندازهٔ بلوک × تعداد بلوک‌های کل برای total و اندازهٔ بلوک × بلوک‌های در دسترس اپ (`f_bavail`) برای free. محاسبه باید بدون overflow باشد.

قواعد اپ:

1. فقط روی Platform.OS === 'ps5' فعال است؛ دیسک رایانه در preview به‌عنوان حافظهٔ کنسول گزارش نمی‌شود.
2. total و free باید Number.isSafeInteger باشند؛ total مثبت و 0 <= free <= total.
3. خطای خواندن دیسک باعث ارسال صفر یا توقف دانلود نمی‌شود؛ گزارش آن نوبت ارسال نشود.
4. برای telemetry کلید تازه به‌صورت خودکار ساخته نمی‌شود؛ کلید موجود دستگاه استفاده می‌شود.
5. هنگام بازبودن اپ، تلاش گزارش هر ۳۰ ثانیه است؛ ارسال هم‌زمان تکراری با single-flight جلوگیری می‌شود.
6. وقتی اپ بسته یا معلق باشد تضمینی برای گزارش دوره‌ای نیست. سایت باید قدیمی‌بودن گزارش را نشان بدهد.

## ۳. گزارش اولیه پیش از انتخاب فایل

برای اینکه کاربر قبل از انتخاب اولین فایل، فضای کنسول را ببیند، گزارش اولیه در درخواست اتصال اپ قرار می‌گیرد:

```http
POST /api/dpop/device/authorize
Content-Type: application/json
DPoP: <fresh-proof>
```
```json
{
  "device_name": "PS5-Download32-Client",
  "scope": "download:file",
  "browser_handoff": true,
  "storage": {
    "volume": "/data",
    "total_bytes": 1000000000000,
    "free_bytes": 250000000000
  }
}
```

storage اختیاری است. سرور ابتدا proof را تأیید و jkt را از public JWK معتبر استخراج می‌کند، سپس گزارش را با همان jkt ذخیره می‌کند؛ jkt/account_id ارسالی در body منبع اعتماد نیست.

پاسخ authorize حاوی آدرس `/login/#ps5=<handoff-secret>` است. پس از ورود کاربر، سایت می‌تواند با ارائهٔ همان handoff، گزارش دستگاه در حال اتصال را بگیرد، حتی اگر هنوز grant دانلود صادر نشده باشد.

handoff مجوز عمومی دیدن هر دستگاه نیست. secret باید معتبر، منقضی‌نشده و مربوط به همان جریان اتصال باشد. دستگاهی که به حساب دیگری متصل است نباید نمایش داده شود.

## ۴. API ارسال گزارش دوره‌ای — مخصوص اپ

```http
POST https://dltest.gamedr.ir/api/dpop/device/storage
Content-Type: application/json
DPoP: <fresh-proof>
```
```json
{
  "volume": "/data",
  "total_bytes": 1000000000000,
  "free_bytes": 250000000000
}
```

پاسخ موفق:
```http
HTTP/1.1 200 OK
Cache-Control: no-store
DPoP-Nonce: <server-nonce>
Server-Time: <unix-seconds>
```
```json
{"ok":true}
```

این endpoint به access token دانلود یا session cookie مرورگر نیاز ندارد؛ **DPoP proof معتبر همان کلید دستگاه** و ثبت/اتصال قبلی دستگاه به حساب فعال لازم است. صرف دانستن jkt کافی نیست.

### کنترل‌های لازم سرور

- امضای ES256 با public JWK معتبر و بدون پارامتر خصوصی.
- htm برابر POST و htu برابر URI عمومی همین endpoint، بدون query/fragment.
- iat در پنجرهٔ مجاز، nonce معتبر، jti تازه و جلوگیری اتمیک از replay.
- استخراج jkt از کلید تأییدشده، سپس یافتن device با آن jkt.
- device باید وجود داشته باشد، revoked_at خالی و account_id متصل داشته باشد.
- حساب باید وجود داشته و فعال باشد.
- volume در قرارداد فعلی دقیقاً `/data` است؛ مسیر دلخواه کلاینت برای filesystem سرور استفاده نشود.
- `type(total) is int` و `type(free) is int`؛ در پایتون bool را صریحاً رد کنید.
- `0 < total <= 9007199254740991` و `0 <= free <= total`.
- reported_at را سرور هنگام دریافت تعیین کند، نه ساعت ادعایی دستگاه.
- گزارش حافظه نباید grant را تمدید، فعال یا از حالت revoked خارج کند؛ فقط telemetry است.

نمونهٔ اعتبارسنجی:
```python
def validate_storage(data):
    if not isinstance(data, dict) or data.get('volume') != '/data':
        raise ValueError('invalid storage volume')
    total, free = data.get('total_bytes'), data.get('free_bytes')
    if type(total) is not int or type(free) is not int:
        raise ValueError('integer bytes required')
    if not (0 < total <= 2**53 - 1 and 0 <= free <= total):
        raise ValueError('invalid storage capacity')
    return total, free
```

خطاهای فعلی:

| وضعیت | معنی |
|---|---|
| 400 | ظرفیت/volume نامعتبر؛ خطاهای DPoP بسته به validator |
| 401 | proof/nonce/ساعت/replay نامعتبر؛ code دقیق DPoP بررسی شود |
| 403 | دستگاه متصل نیست، لغو شده یا حساب فعال نیست |
| 404 | سرویس DPoP فعال نیست |
| خطای شبکه | گزارش آن نوبت نرسیده؛ دانلود نباید به خاطر telemetry متوقف شود |

در سایت اصلی JSON خراب و Content-Type نامعتبر را نیز صریحاً با 400/415 مدیریت کنید. handler فعلی همهٔ خطاهای parsing را به یک JSON یکنواخت تبدیل نمی‌کند؛ فرانت‌اند نباید برای همهٔ پاسخ‌های خطا JSON را قطعی فرض کند. محدودیت اندازهٔ body و rate limit مناسب نیز اعمال شود.

## ۵. ذخیره در دیتابیس

ساختار فعلی SQLite:
```sql
CREATE TABLE IF NOT EXISTS device_storage_reports (
    jwk_thumbprint TEXT PRIMARY KEY,
    total_bytes INTEGER NOT NULL,
    free_bytes INTEGER NOT NULL,
    reported_at REAL NOT NULL
);
```

Upsert با پارامترهای bindشده:
```sql
INSERT INTO device_storage_reports
    (jwk_thumbprint, total_bytes, free_bytes, reported_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(jwk_thumbprint) DO UPDATE SET
    total_bytes = excluded.total_bytes,
    free_bytes = excluded.free_bytes,
    reported_at = excluded.reported_at;
```

یک رکورد آخرین وضعیت برای هر کلید کافی است؛ تاریخچه برای این قابلیت لازم نیست. در PostgreSQL/MySQL از نوع ۶۴بیتی مناسب برای bytes استفاده شود. نام دستگاه و مالکیت از جدول device معتبر خوانده شود؛ در گزارش، token/key خصوصی ذخیره نشود.

در پیاده‌سازی فعلی رکوردهای اولیه می‌توانند قبل از ایجاد device وجود داشته باشند، بنابراین FK اجباری به device بدون درنظرگرفتن این جریان اضافه نشود. پاک‌سازی گزارش‌های orphan/خیلی قدیمی و حذف داده هنگام حذف حساب برای production سیاست مشخص داشته باشد؛ این retention به‌صورت کامل در قابلیت فعلی تعریف نشده است.

## ۶. API خواندن حافظه — مخصوص سایت

```http
POST https://dltest.gamedr.ir/api/account/storage
Content-Type: application/json
Cookie: <normal-account-session>
Origin: https://dltest.gamedr.ir
```

بدنه برای دستگاه‌های متصل حساب:
```json
{}
```

بدنه برای مشاهدهٔ دستگاه در حال اتصال نیز:
```json
{"handoff":"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
```

### پاسخ موفق
```json
{
  "devices": [
    {
      "device_name": "PS5-Download32-Client",
      "volume": "/data",
      "total_bytes": 1000000000000,
      "free_bytes": 250000000000,
      "reported_at": 1793400000,
      "age_seconds": 12,
      "stale": false
    }
  ]
}
```

| فیلد | معنا |
|---|---|
| devices | آرایه؛ ممکن است خالی یا شامل چند دستگاه باشد |
| device_name | نام ثبت‌شدهٔ دستگاه؛ متن غیرقابل‌اعتماد برای HTML |
| volume | محل اندازه‌گیری؛ فعلاً /data |
| total_bytes / free_bytes | بایت، integer safe |
| reported_at | زمان دریافت سمت سرور، Unix seconds؛ ممکن است اعشاری باشد |
| age_seconds | max(0, floor(server_now - reported_at)) |
| stale | age_seconds > 90 |

پاسخ `Cache-Control: no-store` دارد. رکوردها در نسخهٔ فعلی بر اساس تازه‌ترین گزارش مرتب و حداکثر ۲۰ رکورد هستند. device_id در پاسخ فعلی نیست؛ نام‌ها ممکن است تکراری باشند. برای انتخاب پایدار یک کنسول از میان چند کنسول، افزودن شناسهٔ عمومی غیرمحرمانهٔ device به قرارداد پیشنهاد می‌شود، ولی نباید وجود آن را در نسخهٔ فعلی فرض کرد.

### کنترل دسترسی دقیق

۱. Origin درخواست دقیقاً با origin پیکربندی‌شده برابر باشد.
۲. session cookie معتبر و متعلق به حساب فعال باشد.
۳. دستگاه‌های گزارش‌شده باید متعلق به همان حساب و لغونشده باشند.
۴. اگر handoff موجود است: طول ۴۳، جست‌وجو با hash، انقضا در آینده، status یکی از pending/approved/consumed و account_id جریان خالی یا برابر حساب فعلی باشد.
۵. حتی با handoff معتبر، device متصل به حساب دیگر یا revoked از نتیجه حذف شود.
۶. account_id، jkt یا device_id دلخواه مرورگر نباید معیار query باشد.

handoff نامعتبر در handler فعلی لزوماً خطای کل درخواست نمی‌دهد؛ نادیده گرفته می‌شود و دستگاه‌های خود حساب همچنان برمی‌گردند. نبود گزارش پاسخ `200 {"devices":[]}` است، نه حافظهٔ صفر.

خطاهای رایج: بدون session و با Origin صحیح 401؛ Origin غلط/غایب 403؛ body غیر object برابر 400. اگر با curl تست می‌کنید Origin را باید اضافه کنید؛ مرورگر same-origin آن را برای POST تنظیم می‌کند.

## ۷. نمونهٔ کامل نمایش در فرانت‌اند

این نمونه را روی صفحهٔ احرازشده و همان origin API اجرا کنید. هیچ کلید یا توکن دانلود در فرانت‌اند نیست. برای نمایش نام دستگاه از textContent استفاده شده تا XSS ایجاد نشود.

```html
<section>
  <h2>حافظهٔ کنسول</h2>
  <p id="storageStatus">در حال دریافت اطلاعات…</p>
  <div id="storageDevices"></div>
</section>
<script>
const statusBox = document.getElementById('storageStatus');
const devicesBox = document.getElementById('storageDevices');
let stopped = false;
let timer;
let currentRequest;

function formatBytes(bytes) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) return 'نامشخص';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  let value = bytes, unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024; unit++;
  }
  return `${value.toFixed(unit ? 2 : 0)} ${units[unit]}`;
}

function readHandoff() {
  try { return sessionStorage.getItem('download32-handoff') || ''; }
  catch { return ''; }
}

function renderDevices(devices) {
  devicesBox.replaceChildren();
  if (!devices.length) {
    statusBox.textContent = 'هنوز گزارشی دریافت نشده؛ سایت را از داخل اپ کنسول باز کنید.';
    return;
  }
  statusBox.textContent = 'آخرین وضعیت گزارش‌شده از اپ';
  for (const device of devices) {
    const card = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = device.device_name || 'کنسول';
    const capacity = document.createElement('p');
    capacity.textContent = `فضای کل محل دانلود: ${formatBytes(device.total_bytes)} — آزاد: ${formatBytes(device.free_bytes)}`;
    const age = document.createElement('p');
    age.textContent = `آخرین گزارش: ${device.age_seconds} ثانیه پیش` +
      (device.stale ? ' — گزارش قدیمی است؛ اپ را باز کنید.' : '');
    card.append(title, capacity, age);
    devicesBox.append(card);
  }
}

async function refreshStorage() {
  if (stopped) return;
  if (document.hidden) {
    timer = setTimeout(refreshStorage, 10000);
    return;
  }
  currentRequest = new AbortController();
  const timeout = setTimeout(() => currentRequest?.abort(), 8000);
  try {
    const handoff = readHandoff();
    const response = await fetch('/api/account/storage', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(handoff ? {handoff} : {}),
      signal: currentRequest.signal
    });
    if (response.status === 401) {
      stopped = true;
      devicesBox.replaceChildren();
      statusBox.textContent = 'برای مشاهدهٔ حافظه وارد حساب شوید.';
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.devices)) throw new Error('Invalid response');
    if (!stopped) renderDevices(data.devices);
  } catch (_) {
    if (!stopped) {
      devicesBox.replaceChildren();
      statusBox.textContent = 'وضعیت حافظه فعلاً در دسترس نیست؛ دوباره تلاش می‌شود.';
    }
  } finally {
    clearTimeout(timeout);
    currentRequest = null;
    if (!stopped) timer = setTimeout(refreshStorage, 10000);
  }
}

function stopStorageUpdates() {
  stopped = true;
  clearTimeout(timer);
  currentRequest?.abort();
}
window.addEventListener('pagehide', stopStorageUpdates, {once:true});
refreshStorage();
</script>
```

در SPA تابع توقف را هنگام unmount/logout صدا بزنید و در mount جدید نمونهٔ جدید ایجاد کنید. در navigation با back-forward cache نیز چرخهٔ pageshow/pagehide را مطابق فریم‌ورک مدیریت کنید. این کد نمونه، جایگزین مدیریت lifecycle کل سایت نیست.

بعد از ارسال موفق فایل به PS5، handoff از sessionStorage پاک شود؛ درخواست‌های بعدی `{}`، دستگاه متصل حساب را نشان می‌دهند. اطلاعات فضای کل/آزاد در لینک دانلود یا query قرار نگیرد.

## ۸. حالت‌های رابط کاربری

| حالت | نمایش درست |
|---|---|
| free=0 و گزارش معتبر | 0 B؛ حافظهٔ آزاد واقعاً صفر گزارش شده |
| devices=[] | هنوز گزارشی دریافت نشده |
| شبکهٔ سایت قطع است / پاسخ خطا | وضعیت فعلاً در دسترس نیست |
| stale=true | مقدار آخرین گزارش همراه هشدار قدیمی‌بودن |
| اپ بسته یا معلق | پس از ۹۰ ثانیه گزارش قدیمی؛ ادعای آنلاین‌بودن نکنید |
| چند کنسول | کارت‌های جدا؛ free دستگاه‌ها را جمع نزنید |
| حساب خارج شده | اطلاعات قبلی از UI پاک و polling متوقف شود |
| مرورگر روی موبایل | فقط گزارش ذخیره‌شدهٔ کنسول‌های حساب؛ حافظهٔ موبایل خوانده نمی‌شود |

stale=false فقط یعنی گزارش اخیراً رسیده؛ تضمین اتصال لحظه‌ای یا رزروبودن فضای دیسک نیست. محدودیت ۹۰ ثانیه سه برابر فاصلهٔ معمول گزارش است، نه heartbeat قطعی سیستم‌عامل.

## ۹. مقایسهٔ حجم فایل با فضای آزاد

می‌توان هشدار نمایشی داد اگر `free_bytes < file.size_bytes` و گزارش تازه باشد، ولی تصمیم نهایی نوشتن با اپ است.

برای ریزوم نمی‌توان همیشه کل حجم فایل را با free مقایسه کرد: بخشی از فایل از قبل ذخیره شده است. برای فایل فشرده، استخراج نیز ممکن است فضای اضافه نیاز داشته باشد. این API اندازهٔ بخش ذخیره‌شده، فضای استخراج، سهمیهٔ سرویس یا رزرو سایر دانلودها را گزارش نمی‌کند. بدون اطلاعات تکمیلی، دکمهٔ دانلود را به اتکای این snapshot برای همهٔ حالت‌ها مسدود نکنید.

## ۱۰. امنیت و حریم خصوصی

- کاربر مخرب می‌تواند مقدار حافظه را جعل کند؛ DPoP مالکیت کلید را ثابت می‌کند، نه صحت اندازه‌گیری دیسک.
- مسیر گزارش بعد از پایان دانلود هم با دستگاه فعال کار می‌کند؛ این به معنی معتبرماندن grant دانلود نیست.
- سایت فقط ظرفیت volume دانلود را دریافت می‌کند، نه فهرست فایل‌های کاربر یا محتوای آن‌ها.
- اطلاعات کاربران در cache عمومی/CDN ذخیره نشود؛ کوکی، proof کامل و handoff در log نیاید.
- در چند instance، همه باید به منبع مشترک دادهٔ device/report و کنترل replay دسترسی داشته باشند.
- origin جدید سایت اصلی نیازمند هماهنگی با origin مجاز اپ و امضای DPoP است؛ تغییر دکمه یا CORS به‌تنهایی کافی نیست.
- صف گزارش قدیمی در اپ وجود ندارد؛ بعد از برگشت اینترنت نمونهٔ تازه ارسال می‌شود. از بازپخش نمونهٔ قدیمی با timestamp جدید به‌عنوان وضعیت تازه پرهیز کنید.

## ۱۱. تست‌های لازم برای تحویل برنامه‌نویس

1. total/free معتبر ذخیره و گزارش بعدی همان jkt را به‌روزرسانی کند.
2. free=0 پذیرفته شود؛ مقدار منفی، float، bool، total=0، free>total و عدد خارج safe integer رد شوند.
3. proof جعلی، jti تکراری، کلید لغوشده، حساب غیرفعال و دستگاه ثبت‌نشده نتوانند گزارش دوره‌ای بنویسند.
4. گزارش اولیهٔ authorize قبل از ایجاد grant، با handoff معتبر به حساب واردشده نمایش داده شود.
5. حساب B نتواند گزارش device متعلق به A را با jkt/device_id/handoff دست‌کاری‌شده ببیند.
6. با انقضای handoff، دسترسی pending از بین برود؛ دستگاه‌های متصل خود حساب همچنان دیده شوند.
7. قطع اینترنت/خروج/بستن اپ باعث نمایش عدد صفر یا آنلاین‌بودن کاذب نشود.
8. با گذشت بیش از ۹۰ ثانیه stale=true و age_seconds درست باشد؛ ساعت کلاینت زمان ثبت سرور را تغییر ندهد.
9. گزارش حافظه expiry/refresh/revocation مجوز دانلود را تغییر ندهد.
10. نام دستگاه شامل HTML/script صرفاً متن نمایش داده شود.
11. desktop preview دیسک کامپیوتر را به‌عنوان کنسول ارسال نکند.
12. اندازهٔ واقعی روی PS5 با فایل‌منیجر همان volume مقایسه شود؛ تفاوت GiB/GB و فضای رزروشده لحاظ شود.

## ۱۲. فایل‌های مرجع

- اپ: `downloader/auth/device-session.js`، توابع storageSnapshot و reportStorage و begin.
- زمان‌بندی و خواندن volume: `downloader/index.jsx`.
- خواندن بومی: `overdrive/ps5-react/native/ps5/host_platform.cpp`، disk_usage.
- سرور: `tgstorage/web.py`، validated_storage، dpop_device_storage، account_storage، dpop_device_authorize.
- دیتابیس: `tgstorage/db.py`، record_device_storage و account_device_storage.
- patch قابل مراجعه: `server/device-storage.patch`.
- تست سمت سرور: `server/test_device_storage.py`.
- قرارداد کلی اتصال و DPoP: [DOWNLOAD32_MAIN_SITE_INTEGRATION_FA.md](DOWNLOAD32_MAIN_SITE_INTEGRATION_FA.md).

این سند جریان موجود را شرح می‌دهد و موارد پیشنهادی production را صریح مشخص کرده است. در نوشتن این سند، سرویس، اپ یا بکاپ‌ها تغییر داده نشده‌اند.
