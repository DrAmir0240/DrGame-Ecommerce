# راهنمای پیاده‌سازی دانلود و اتصال سایت اصلی به Download32

تاریخ بررسی: 2026-10-31 — مبنا: اپ 01.015.000 و کد خوانده‌شده از سرور فعال dltest.gamedr.ir.
مخاطب: برنامه‌نویس بک‌اند، فرانت‌اند و زیرساخت سایت اصلی.
این سند شامل رمز، کلید خصوصی، کوکی یا توکن واقعی نیست. مقادیر نمونه صرفاً نمونه‌اند.

## ۱. نتیجهٔ مورد انتظار برای کاربر

۱. کاربر در اپ دکمهٔ Website / PS5 را می‌زند.
۲. مرورگر کنسول سایت را باز می‌کند. اگر وارد حساب نیست، ورود عادی سایت را انجام می‌دهد.
۳. فهرست فایل‌هایی که حق دانلودشان را دارد نمایش داده می‌شود.
۴. کنار فایل، «دانلود روی PS5» را می‌زند. واردکردن کد یا تأیید جداگانه لازم نیست؛ همین انتخاب، تأیید دسترسی آن فایل برای اپ است.
۵. به اپ برمی‌گردد؛ اپ مشخصات معتبر فایل و مجوز متصل به کلید دستگاه را از سرور دریافت و دانلود را شروع می‌کند.
۶. پاز/ریزوم بخش‌های ذخیره‌شده را نگه می‌دارد. پس از دریافت کامل، اپ SHA-256 کل فایل را بررسی و درخواست ابطال مجوز را ارسال می‌کند.

عبارت «ساخت لینک PS5» در این روش به معنی صدور URL عمومی دارای رمز نیست؛ یعنی ایجاد یک grant برای فایل، حساب و کلید دستگاه مشخص. URL فایل به‌تنهایی اجازهٔ دانلود نمی‌دهد.

## ۲. سه مسیر متفاوت؛ با هم اشتباه نشوند

| مسیر | انتقال به اپ | امنیت | کاربرد |
|---|---|---|---|
| DPoP + browser handoff | اپ پاسخ device/token را poll می‌کند | توکن + اثبات کلید دستگاه | مسیر اصلی سایت |
| لینک مستقیم خارجی | مرورگر به 127.0.0.1:9026 می‌رود | فقط امنیت خود میزبان خارجی؛ بدون DPoP سایت | دکمهٔ تست/لینک عمومی |
| secure-download تیکت قدیمی | URL حاوی توکن | ماهیت bearer؛ متفاوت از DPoP | سازگاری قدیمی؛ مبنای نسخهٔ جدید نباشد |

مسیر تست خارجی نباید به‌عنوان راه امن فروش/محدودکردن دانلود معرفی شود. دانلود مستقیم فایل خارجی از همان میزبان است؛ توکن یا کوکی سایت اصلی به آن فرستاده نمی‌شود.

## ۳. معماری

```text
PS5 Download32 — HTTPS + DPoP — Reverse proxy — Download API — File storage
       |                              |
       +— مرورگر سایت + session cookie — Account API / entitlement
```

در نصب فعلی: Apache روی HTTPS درخواست را به aiohttp در 127.0.0.1:8080 می‌فرستد. احراز هویت و سیاست مجوز در بک‌اند است، نه صرفاً Apache. فایل‌ها از پارت‌های تلگرام با کش سرور سرو می‌شوند. سایت اصلی می‌تواند فایل دیسک، object storage یا زیرساخت دیگری داشته باشد؛ قرارداد HTTP و هویت ثابت فایل باید حفظ شود.

اپ مستقیماً به تلگرام متصل نیست. ۳۲ اتصال اپ به سرور لزوماً برابر ۳۲ دریافت تلگرام نیست؛ دریافت پارت مشترک و کش باعث تفاوت این اعداد می‌شود.

## ۴. پیش‌نیاز انتقال به دامنهٔ اصلی — مهم

اپ فعلی فقط origin دقیق `https://dltest.gamedr.ir` را برای DPoP قبول می‌کند. این محدودیت در AUTH_ORIGIN، اعتبارسنجی browser_handoff_uri و download_url و تنظیم origin امضاکننده وجود دارد. انتقال به دامنهٔ اصلی فقط تغییر DNS یا قراردادن دکمه در سایت نیست.

قبل از تحویل، origin نهایی واحد مشخص شود؛ سپس URL مرورگر، API و دانلود با همان origin سازگار شوند و اپ مجدداً ساخته شود. ریدایرکت endpointهای DPoP پذیرفته نمی‌شود. کلید و توکن به origin دیگری منتقل نشوند.

اگر حساب کاربری سایت اصلی روی دامنه‌ای دیگر است، از اتصال معتبر سمت سرور/SSO و ایجاد session روی origin دانلود استفاده کنید؛ قرار دادن کوکی یا رمز حساب در لینک/اپ راه‌حل نیست. برای handoff باید Origin مرورگر مطابق origin مجاز باشد. CORS با `*` جایگزین احراز هویت و CSRF نیست.

## ۵. مدل دادهٔ لازم

نام جدول‌ها قابل تغییر است؛ معنا و تراکنش‌ها باید حفظ شوند.

- **File/job:** id پایدار، نام، وضعیت ready، size_bytes دقیق، SHA-256 کامل، نسخه، ETag، زمان ثابت نسخه، نگاشت به منبع ذخیره‌سازی.
- **Account/session/entitlement:** حساب فعال، session معتبر، دسترسی همان حساب به همان فایل، سهمیه و وضعیت لغو.
- **Device:** id، public JWK، thumbprint یکتا (jkt)، account_id، نام، revoked_at. کلید خصوصی هرگز روی سرور نباشد.
- **Device authorization:** hash(device_code)، user_code داخلی، jkt، public JWK، expires_at، poll interval، status، account/session/job انتخاب‌شده، grant_id و اطلاعات recovery.
- **Browser handoff:** hash(secret)، ارجاع یکتا به authorization. secret خام فقط به اپ/مرورگر داده شود.
- **Grant:** حساب، دستگاه، فایل/نسخه، hash access و refresh token، انقضا، توکن قبلی و مهلت grace/recovery، revoked_at و client_completed_at.
- **Replay:** `(jkt,jti)` یکتا همراه expiry؛ درج اتمیک و پاک‌سازی رکوردهای منقضی.
- **Storage report:** آخرین total/free و زمان دریافت برای jkt.

برای چند instance سرور، مصرف handoff، replay، refresh و سقف اتصال باید در دیتابیس/سامانهٔ مشترک هماهنگ شوند. شمارندهٔ اتصال صرفاً داخل حافظهٔ یک process، سقف کل کلاستر را تضمین نمی‌کند.

## ۶. ترتیب کامل API

### ۶.۱. شروع اتصال اپ

اپ کلید EC P-256 محلی ایجاد/بازیابی می‌کند و با آن proof می‌سازد:

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
  "storage": {"volume":"/data","total_bytes":1000000000000,"free_bytes":250000000000}
}
```

storage اختیاری است. انتخاب job در سایت انجام می‌شود؛ requested_job_id نیز می‌تواند اختیاری باشد.

نمونهٔ پاسخ 200:
```json
{
  "device_code":"dpop_dc_EXAMPLE",
  "user_code":"ABCD-EFGH",
  "browser_handoff_uri":"https://dltest.gamedr.ir/login/#ps5=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "verification_uri":"https://dltest.gamedr.ir/account/",
  "expires_in":600,
  "interval":5,
  "jkt":"PUBLIC_KEY_THUMBPRINT"
}
```

- handoff یک secret تصادفی ۳۲ بایتی با base64url بدون padding، طول ۴۳ کاراکتر است.
- device_code از همان درخواست اول به jkt متصل است؛ تعویض کلید در poll ممنوع.
- user_code برای سازگاری قرارداد موجود است و اپ فعلی همچنان شکل آن را اعتبارسنجی می‌کند، اما کاربر آن را وارد نمی‌کند.
- secret مرورگر از device_code جداست. هیچ access/refresh token داخل URL قرار نگیرد.
- lifetime نمونه ۶۰۰ ثانیه و فاصلهٔ poll پنج ثانیه است. پاسخ معتبر باید مقدار دقیق تنظیمات را برگرداند.

### ۶.۲. دریافت handoff در فرانت‌اند

Fragment به درخواست HTTP سرور ارسال نمی‌شود. فرانت‌اند آن را بخواند، در sessionStorage همان تب نگه دارد و از address bar حذف کند. این secret در برابر XSS محرمانه نیست؛ اسکریپت ثالث و analytics نباید آن را بخوانند یا ثبت کنند.

```js
let handoff = sessionStorage.getItem('download32-handoff') || '';
const incoming = new URLSearchParams(location.hash.slice(1)).get('ps5');
if (incoming && /^[A-Za-z0-9_-]{43}$/.test(incoming)) {
  handoff = incoming;
  sessionStorage.setItem('download32-handoff', handoff);
  history.replaceState(null, '', location.pathname + location.search);
}
```

اگر ورود صفحه را جابه‌جا می‌کند، secret همان تب در origin صحیح باقی بماند. بعد از ورود، فهرست فایل‌ها فقط بر اساس entitlement حساب از بک‌اند گرفته شود.

### ۶.۳. کلیک «دانلود روی PS5»

```http
POST /api/account/dpop/handoff
Content-Type: application/json
Cookie: <normal-site-session>
Origin: https://dltest.gamedr.ir
```
```json
{"handoff":"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX","job_id":"job123"}
```
پاسخ 200:
```json
{"ok":true,"job_id":"job123"}
```

فرانت‌اند:
```js
async function sendToPs5(jobId) {
  if (!handoff) throw new Error('سایت را از داخل اپ باز کنید.');
  const r = await fetch('/api/account/dpop/handoff', {
    method:'POST', credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({handoff, job_id:jobId})
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'ارسال ناموفق بود');
  sessionStorage.removeItem('download32-handoff'); handoff = '';
  // نمایش: به اپ برگردید؛ دانلود شروع می‌شود.
}
```

سرور باید در تراکنش:
۱. session و فعال‌بودن حساب، Origin دقیق، JSON و secret را بررسی کند.
۲. authorization زنده و jkt متصل را پیدا کند؛ فایل ready و دسترسی حساب را کنترل کند.
۳. حساب/session/job را به authorization متصل کند و status را approved کند.
۴. مسابقهٔ دو کلیک/حساب را اتمیک حل کند. فقط اولین claim مجاز برنده شود.
۵. تکرار همان درخواست توسط همان حساب، همان session و همان فایل را idempotent بپذیرد؛ تغییر فایل/حساب را رد کند.

برای authorization دارای handoff، endpoint قدیمی تأیید user_code نباید راه دورزدن secret باشد. از body مرورگر jkt یا account_id را به‌عنوان منبع اعتماد نپذیرید.

### ۶.۴. poll اپ و صدور مجوز

```http
POST /api/dpop/device/token
Content-Type: application/json
DPoP: <fresh-proof-from-original-key>
```
```json
{"grant_type":"urn:ietf:params:oauth:grant-type:device_code","device_code":"dpop_dc_EXAMPLE"}
```

تا قبل از انتخاب فایل: `400 {"error":"authorization_pending"}`. برای slow_down اپ interval را پنج ثانیه بیشتر می‌کند. expired_token و access_denied حالت پایانی‌اند.

پاسخ موفق سازگار با اپ:
```json
{
  "token_type":"DPoP",
  "access_token":"EXAMPLE_ACCESS",
  "refresh_token":"EXAMPLE_REFRESH",
  "expires_in":900,
  "refresh_expires_in":86400,
  "grant_id":"grant123",
  "device_id":"device123",
  "jkt":"PUBLIC_KEY_THUMBPRINT",
  "job_id":"job123",
  "download_url":"https://dltest.gamedr.ir/dpop-download/job123/file.bin",
  "file":{
    "job_id":"job123",
    "file_name":"file.bin",
    "size_bytes":10737418240,
    "sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "etag":"\"sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\"",
    "file_version":"sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  "max_connections":40,
  "recovered":false
}
```

هش نمونه باید با هش واقعی جایگزین شود. sha256 دقیقاً ۶۴ کاراکتر lowercase hex؛ ETag شامل کوتیشن؛ file_version بدون کوتیشن و با `sha256-` است. قالب قدیمی `sha256:<short-hash>` پذیرفته نمی‌شود. idها مطابق `[a-zA-Z0-9_-]{1,128}` باشند. size عدد صحیح مثبت و در محدودهٔ صحیح امن JavaScript باشد.

download_url در نسخهٔ فعلی باید دقیقاً زیر origin مجاز و `/dpop-download/{job_id}/` باشد؛ query، fragment، whitespace و backslash نداشته باشد. URL مسیر پایدار است، نه bearer secret.

صدور اولیه و recovery اتمیک باشند. پاسخ گم‌شده: همان device_code و کلید با proof تازه، در پنجرهٔ recovery (در قرارداد فعلی ۳۰۰ ثانیه) همان grant را بازیابی/توکن‌ها را rotate می‌کند؛ grant و سهمیهٔ مضاعف ایجاد نشود. صرف IP یا User-Agent مجوز recovery نیست.

## ۷. DPoP و احراز هویت درخواست‌ها

مبنای پیاده‌سازی RFC 9449، thumbprint طبق RFC 7638 و بخش device grant طبق RFC 8628 است. browser_handoff و اتصال کلید در authorize، افزونه‌های این پروژه‌اند؛ این مسیر را OAuth استانداردِ بدون افزونه فرض نکنید.

Header JWT:
```json
{"typ":"dpop+jwt","alg":"ES256","jwk":{"kty":"EC","crv":"P-256","x":"...","y":"..."}}
```
Claims:
```json
{"jti":"fresh-random-id","htm":"GET","htu":"https://dltest.gamedr.ir/dpop-download/job123/file.bin","iat":1793400000,"nonce":"SERVER_NONCE","ath":"BASE64URL_SHA256_ACCESS_TOKEN"}
```

- فقط public JWK؛ هر پارامتر کلید خصوصی رد شود. امضای ES256 به شکل استاندارد JWT، R||S با ۶۴ بایت است.
- jkt از SHA-256 نمایش canonical public JWK ساخته شود.
- htm دقیقاً متد، htu برابر URI خارجی HTTPS بدون query و fragment باشد؛ آدرس داخلی proxy معیار نیست.
- برای هر درخواست هر ورکر و هر retry، jti تازه لازم است. درج replay باید اتمیک باشد.
- iat بر حسب ثانیه؛ پنجرهٔ فعلی معمولاً ±۱۲۰ ثانیه. Server-Time برای اصلاح ساعت برگردد.
- nonce با هم‌پوشانی زمانی معتبر باشد تا ۳۲ ورکر همدیگر را باطل نکنند. nonce یک‌بارمصرف مشترک برای کل session نسازید.
- هرجا Authorization وجود دارد، `Authorization: DPoP <access_token>` و ath برابر base64url(SHA256(access_token)) لازم است. Bearer جایگزین نشود.
- در authorize/token/refresh اثبات کلید لازم است ولی access token در Authorization لازم نیست؛ refresh token داخل body می‌رود.
- DPoP، Range و body را امضا نمی‌کند. TLS و کنترل پارامترها لازم‌اند.
- proof صحیح، توکن معتبر، اتصال به همان jkt، حساب/دستگاه فعال، فایل و entitlement صحیح همگی باید بررسی شوند.

پاسخ‌های API و فایل، DPoP-Nonce و Server-Time مناسب و Cache-Control: no-store داشته باشند. برای nonce نامعتبر، `401` و `WWW-Authenticate: DPoP error="use_dpop_nonce"` همراه nonce تازه برگردد. اپ API تا سه تلاش برای nonce/clock دارد و ریدایرکت را رد می‌کند. مسیر nonce اختیاری `GET /api/dpop/nonce` نیز قابل نگه‌داشتن است.

کلید دستگاه شناسهٔ اعتماد است؛ IP، MAC یا User-Agent جای آن نیست. تغییر IP مجوز معتبر را نشکند. استخراج کلید از کنسول دست‌کاری‌شده و کپی فایل بعد از دریافت، با این روش به‌طور مطلق قابل جلوگیری نیست.

## ۸. قرارداد سرو فایل و موتور دانلود

اپ فعلی حداکثر ۳۲ ورکر با رنج‌های پایهٔ **۳۲ MiB = 33554432 bytes** دارد؛ با پایان رنج، رنج بعدی برداشته می‌شود. در پایان فایل، توقف، محدودیت سرور یا کمبود کار، کمتر از ۳۲ ورکر طبیعی است. موتور ممکن است دنبالهٔ کند یک رنج را تقسیم کند؛ رنج‌های کوچکتر معتبرند. ذخیره‌های قدیمی ممکن است اندازهٔ رنج ۸ MiB داشته باشند؛ سرور نباید اندازهٔ ثابتی را تحمیل کند.

پروب `bytes=0-0` و HEAD مجاز باشند و فایل را مصرف‌شده نکنند.

```http
GET /dpop-download/job123/file.bin
Authorization: DPoP <access-token>
DPoP: <fresh-proof>
Range: bytes=0-33554431
If-Range: "sha256-<64-hex>"
```
```http
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 0-33554431/10737418240
Content-Length: 33554432
Content-Type: application/octet-stream
ETag: "sha256-<64-hex>"
X-Content-SHA256: <64-hex>
Cache-Control: no-store
```

- offset و طول ۶۴بیتی؛ end در HTTP شامل آخرین بایت است. حجم بدنه باید دقیقاً end-start+1 باشد.
- آخرین رنج به انتهای فایل محدود شود. رنج نامعتبر: 416 با `Content-Range: bytes */TOTAL`.
- فایل immutable باشد؛ تغییر محتوا یعنی نسخه، SHA و ETag جدید. ETag با هر درخواست عوض نشود. Last-Modified، اگر هست، زمان ثابت نسخه باشد.
- پاسخ رنج نباید gzip، HTML صفحهٔ ورود، redirect به سایت دیگر یا 200 با کل فایل باشد. If-Range نامنطبق طبق HTTP می‌تواند 200 برگرداند؛ اپ نباید آن را به فایل نیمه‌کاره بچسباند.
- HEAD بدنه ندارد. پروب GET تک‌بایتی باید 206، Content-Range صحیح، Content-Length:1 و یک بایت واقعی بدهد.
- سقف اتصال سرور باید حداقل ۳۲ را پشتیبانی کند؛ ۴۰ مقدار پیشنهادی قرارداد است، نه تضمین تنظیم فعلی محیط. اپ فعلی عدد max_connections پاسخ را برای پایین‌آوردن ۳۲ مصرف نمی‌کند.
- خطای ظرفیت: 429 با retry مناسب. timeoutهای proxy با دریافت کند پارت upstream سازگار باشند؛ قطع socket در finally منابع و lease را آزاد کند.

### ذخیره و ریزوم در اپ

مسیر کنسول برای فایل انتخابی: `/data/download32/files/links/{storageId}/{filename}`؛ فایل نیمه‌کاره `.part` و متادیتا `.resume` است. تغییر لینک همان فایل باید storageId را حفظ کند؛ انتخاب فایل جدید storageId جدید می‌سازد.

checkpoint نسخهٔ ۲ از اپ 01.015 پیشوند پیوستهٔ واقعاً نوشته‌شدهٔ هر رنج را ذخیره می‌کند؛ قبل از ثبت متادیتا fsync و سپس rename اتمیک انجام می‌شود. ادامه از بایت بعدی این پیشوند است. رنج‌های split ممکن است بخش‌های غیرپیوستهٔ فراتر از شکاف داشته باشند که مجدداً دریافت می‌شوند. checkpoint نسخهٔ ۱ قابل خواندن است؛ بایت ثبت‌نشدهٔ نسخهٔ قدیمی قابل بازیابی نیست.

هویت checkpoint شامل validator، اندازه، hash و layout است؛ URL امضاشده جزو هویت نیست. لینک تازهٔ همان فایل می‌تواند ادامه یابد. بدون ETag قوی، نمونهٔ فایل از سرور با فایل محلی مقایسه می‌شود. تغییر محتوا/اندازه/validator با preservePartial باید خطا دهد و فایل قبلی را حفظ کند.

## ۹. عمر توکن، تمدید و کندی اینترنت

- access token: ۹۰۰ ثانیه.
- refresh lease: ۸۶۴۰۰ ثانیه بی‌فعالیتی معتبر.
- فعالیت معتبر شامل درخواست احرازشده/ارسال داده و refresh معتبر است؛ مجوز منقضی یا لغوشده زنده نشود.
- انقضای access token بعد از پذیرش رنج، همان استریم را وسط انتقال قطع نکند. لغو صریح دستگاه/مجوز/دسترسی می‌تواند قطع کند.
- اپ قبل از انقضا با یک refresh مشترک بین ورکرها تمدید می‌کند؛ ۳۲ refresh هم‌زمان ساخته نشود.

```http
POST /api/dpop/token/refresh
DPoP: <fresh-proof-with-same-key>
Content-Type: application/json
```
```json
{"grant_type":"refresh_token","refresh_token":"EXAMPLE_REFRESH"}
```

پاسخ باید token_type، access_token، refresh_token، expires_in، refresh_expires_in، grant_id، device_id، jkt، job_id را داشته باشد؛ etag/file_version اگر برگردند نباید هویت را تغییر دهند. file و download_url می‌توانند از پاسخ اولیه حفظ شوند. الگوی پاسخ بخش ۶.۴ با همان هویت معتبر است.

grace توکن access قبلی (در قرارداد ۶۰ ثانیه) برای ورکرهای در حال شروع و recovery refresh قبلی (۳۰۰ ثانیه) برای پاسخ گم‌شده در نظر گرفته شود؛ بدون اثبات همان کلید قابل استفاده نیست. بعد از ابطال، هیچ مسیر recovery نباید grant را زنده کند.

## ۱۰. پایان دانلود و ابطال

سرور **نباید** با پوشش کامل رنج‌ها، اتمام write_eof، نوشتن به Apache یا جمع‌شدن بایت‌های خروجی مجوز را باطل کند. تحویل به بافر proxy اثبات دریافت کامل کنسول نیست؛ خطای قبلی نزدیک 9.92 GiB ناشی از همین فرض بود.

اپ ابتدا فایل کامل را با SHA-256 مرجع مقایسه می‌کند، سپس وضعیت completion=pending را به‌طور پایدار روی دیسک می‌نویسد و مصرف آن grant را در اپ می‌بندد:

```http
POST /api/dpop/downloads/grant123/complete
Authorization: DPoP <access-token>
DPoP: <fresh-proof-including-ath>
Content-Type: application/json
```
```json
{"sha256":"<64-real-hex>","bytes_verified":10737418240,"revoke_grant":true}
```
پاسخ مورد انتظار اپ:
```json
{"ok":true,"grant_id":"grant123","job_id":"job123","sha256_verified":true,"bytes_verified":10737418240,"revoked":true}
```

ابطال اتمیک و تکرارپذیر باشد. اپ پس از موفقیت completion=revoked را ذخیره می‌کند؛ در خطای شبکه، retry پایدار هر ۱۵ ثانیه و شروع بعدی اپ انجام می‌شود. قبل از دانلود جدید، پیام‌های ابطال معوق تخلیه می‌شوند. access_revoked نیز برای بستن محلی کافی تلقی می‌شود.

برای اعلام پایان بعد از آفلاین طولانی، endpoint complete با revoke_grant=true می‌تواند توکن شناخته‌شدهٔ منقضی را همراه اثبات تازهٔ همان کلید صرفاً برای ابطال بپذیرد؛ این استثنا برای GET فایل و refresh مجاز نیست. id/path، ath، replay و کلید همچنان بررسی شوند.

**نقص مهم نسخهٔ فعلی سرور برای انتقال:** در confirm_completion فعلی، bytes_verified فقط در پاسخ برگردانده می‌شود و با اندازهٔ فایل مقایسه نمی‌شود؛ SHA خالی نیز ممکن است با SHA مرجع پر شود. برای سایت اصلی SHA کامل اجباری و برابر مرجع، و bytes_verified عدد صحیح دقیقاً برابر total_size باشد. حتی پس از این اصلاح، `sha256_verified:true` فقط پذیرش ادعای کلاینت است؛ سرور محاسبهٔ دیسک کنسول را ندیده است.

اگر دستگاه هرگز آنلاین نشود، سرور فقط با انقضای lease یا لغو مدیریتی دسترسی را می‌بندد. کلاینت دست‌کاری‌شده می‌تواند پایان را اعلام نکند. جلوگیری از آن نیازمند سیاست مستقل بودجهٔ دریافت/retry است و در نسخهٔ فعلی پیاده نشده؛ با «اولین پوشش ۱۰۰٪ رنج‌ها» جایگزین نشود.

## ۱۱. یکبارمصرف بودن و دو دستگاه

- handoff فقط یک بار برای حساب/session/file مشخص claim می‌شود؛ پاسخ گم‌شده همان claim را بازیابی می‌کند.
- download URL یکبارمصرف نیست و اصولاً secret نیست؛ مجوز grant بعد از پایان باطل می‌شود. با مجوز جدید می‌توان همان URL پایدار را استفاده کرد، اگر سیاست حساب اجازه دهد.
- پخش URL تنها، به دستگاه دیگر اجازه نمی‌دهد. توکن دزدیده‌شده بدون کلید نیز کافی نیست.
- «یک grant روی یک کلید» با «فقط یک دستگاه برای هر خرید» متفاوت است. نسخهٔ فعلی محدودیت سراسری یک grant فعال به‌ازای account/file ندارد.
- اگر سایت اصلی دانلود هم‌زمان روی دو دستگاه را ممنوع می‌خواهد، کلید منطقی `(account_id, file_version)` یا `(order_item_id, file_version)` و رزرو/قفل تراکنشی برای grant فعال تعریف کند. ایجاد grant، انتقال به دستگاه دیگر، expiry، لغو و recovery همگی باید این قفل را رعایت کنند. رزروِ منقضی با CAS/transaction آزاد شود؛ یک worker قدیمی نباید رزرو جدید را آزاد کند.
- حق دریافت مجوز جدید پس از پایان، مصرف سهمیه یا تعداد دانلود مجاز سیاست تجاری جداگانه است و باید صریح تعریف شود؛ DPoP به‌خودی‌خود آن را تعیین نمی‌کند.

## ۱۲. اطلاعات حافظه در سایت

اپ PS5 هر ۳۰ ثانیه در زمان بازبودن، فضای volume `/data` را می‌فرستد؛ مجموع همهٔ USB/دیسک‌ها نیست.

`POST /api/dpop/device/storage` با proof کلید دستگاه، بدون نیاز به access token دانلود:
```json
{"volume":"/data","total_bytes":1000000000000,"free_bytes":250000000000}
```
فقط دستگاه لغونشدهٔ متصل به حساب فعال پذیرفته شود. 0 <= free <= total و total مثبت، integer safe باشند. گزارش حافظه lease دانلود را تمدید نکند.

سایت هر ۱۰ ثانیه با کوکی و Origin صحیح:
```http
POST /api/account/storage
Content-Type: application/json
```
```json
{"handoff":"OPTIONAL_CURRENT_HANDOFF"}
```
یا `{}` برای دستگاه‌های متصل حساب.
```json
{"devices":[{"device_name":"PS5-Download32-Client","volume":"/data","total_bytes":1000000000000,"free_bytes":250000000000,"reported_at":1793400000,"age_seconds":12,"stale":false}]}
```

گزارش فقط برای همان حساب و pending handoff معتبر نمایش داده شود. دستگاه حساب دیگر با handoff هم نمایش داده نشود. زمان ثبت سمت سرور است؛ بعد از ۹۰ ثانیه stale. نبود گزارش به معنی صفر نیست. این دادهٔ کلاینت مبنای امنیت/سهمیه یا تضمین فضای واقعی نیست.

## ۱۳. مسیر مستقیم خارجی، فقط اگر لازم است

در اپ فعلی Website / PS5 علاوه بر poll امن، گیرندهٔ محلی لینک مستقیم را نیز فعال می‌کند. ترتیب الزامی: اتمام task فول‌اسکرین، شروع receiver، بازکردن URL. fullscreen و receiver هم‌زمان روی BrowserCapture اجرا نشوند.

دکمهٔ سایت:
```js
location.href = 'http://127.0.0.1:9026/dl=' + encodeURIComponent(fileUrl);
```

این navigation است، نه fetch و نه درخواست بک‌اند سایت به localhost. مرورگر باید روی همان کنسول باشد؛ localhost روی گوشی/رایانه دستگاه دیگری است. آدرس کامل شامل query باید encode شود. receiver پنج دقیقه منتظر می‌ماند؛ با بسته‌شدن dialog لغو می‌شود.

اپ لینک را با GET bytes=0-0 بررسی می‌کند، سپس انتخاب و دانلود می‌کند. پاسخ HTML/JSON/XML، Range غلط یا اندازهٔ نامعتبر رد می‌شود. محدودیت IP ایران، لینک منقضی یا صفحهٔ ورود میزبان خارجی با تغییر Range حل نمی‌شود.

این مسیر کلید/توکن سایت را منتقل نمی‌کند و امنیت grant و ابطال پس از SHA سایت را ندارد. در نسخهٔ production امن، بهتر است این مسیر اختیاری/تستی غیرفعال یا با تأیید صریح کاربر و میزبان‌های مجاز محدود شود؛ listener فعلی را endpoint احرازشدهٔ DPoP فرض نکنید.

## ۱۴. تنظیم reverse proxy و منبع فایل

- فقط HTTPS عمومی؛ پورت داخلی بک‌اند از اینترنت مستقیم در دسترس نباشد.
- Authorization، DPoP، Range، If-Range و responseهای Content-Range/Length/ETag/DPoP-Nonce/Server-Time حفظ شوند.
- URL canonical بر اساس origin پیکربندی‌شده ساخته شود؛ X-Forwarded-* فقط از proxy مورد اعتماد پذیرفته شود. کلاینت نباید با Host/forwarded header دلخواه htu یا IP را جعل کند.
- از cache عمومی پاسخ شخصی و log کردن توکن، DPoP کامل، device_code، handoff، refresh token و کوکی جلوگیری شود. برای عیب‌یابی request_id، grant_id، offset، status، latency و تعداد بایت کافی است.
- timeout و buffering با اندازهٔ رنج و سرعت واقعی سازگار باشد. پشت proxy، write_eof مساوی تأیید کلاینت نیست.
- ارسال فایل به S3/CDN با redirect معمولی، قرارداد origin و امضای اپ فعلی را می‌شکند؛ یا همان origin فایل را stream/proxy کند یا طراحی و allowlist اپ با قرارداد جدید تغییر کند.

اگر منبع تلگرام است: دریافت پارت مشترک، کش محدود، کنترل SHA پارت، اولویت demand و پیش‌دریافت لازم است. پنجرهٔ پیش‌دریافت نباید به انتهای Range فعلی محدود شود؛ پروب یک‌بایتی نباید prefetch حجیم ایجاد کند. تنظیمات گزارش‌شدهٔ نصب فعلی: سقف کش یک GiB برای هر فایل، پنجره ۲۵۶–۵۱۲ MiB، حداکثر ۸ prefetch و ۲۰ دریافت upstream. این اعداد نقطهٔ شروع‌اند، نه نیاز ثابت قرارداد یا تضمین سرعت.

## ۱۵. جدول خطا و رفتار

| خطا | رفتار |
|---|---|
| authorization_pending | poll طبق interval |
| slow_down | افزایش interval، بدون loop سریع |
| expired_token / access_denied در device flow | اتصال جدید با اقدام کاربر |
| use_dpop_nonce | nonce تازه + proof/jti تازه + retry محدود |
| dpop_clock_skew | Server-Time؛ اصلاح offset محدود، ساعت بسیار غلط باید اصلاح شود |
| token_expired در فایل | refresh مشترک و retry؛ استریم مجاز موجود قطع نشود |
| dpop_key_mismatch / invalid_ath / invalid_dpop_proof | خطای کلید/قرارداد؛ retry کور ممنوع |
| dpop_replay_detected | proof تازه؛ بررسی باگ reuse در ورکرها |
| access_revoked / scope_mismatch | توقف؛ مجوز جدید فقط طبق سیاست حساب |
| 429 / 503 | backoff و retry محدود، حفظ فایل نیمه‌کاره |
| 416 | بررسی اندازه/offset/نسخه؛ محتوا به فایل قبلی چسبانده نشود |
| HTML به جای فایل | خطای لینک/ورود/محدودیت میزبان؛ به‌عنوان فایل قبول نشود |
| SHA mismatch | completed اعلام نشود؛ فایل ناسالم منتشر نشود |
| قطع اینترنت پس از پایان | pending completion پایدار و retry بعدی |

## ۱۶. معیارهای پذیرش قبل از انتشار سایت اصلی

1. اپ از سایت فایل مجاز را بدون ورود کد انتخاب و دریافت کند؛ فایل غیرمجاز با تغییر job_id رد شود.
2. URL تنها، cookie تنها، Bearer و access token بدون کلید همگی روی مسیر DPoP رد شوند.
3. proof با کلید دیگر، ath غلط، method/URI غلط، jti تکراری و JWK خصوصی رد شود.
4. رقابت هم‌زمان دو claim یک handoff فقط یک برنده داشته باشد؛ تکرار همان درخواست grant اضافه نسازد.
5. گم‌شدن پاسخ device/token و refresh با همان کلید recover شود؛ کلید دیگر نتواند recover کند.
6. ۳۲ رنج با nonce مشترک و jti متفاوت بدون nonce storm کار کنند؛ HEAD و probe مجوز را مصرف نکنند.
7. دانلود واقعی بیش از ۲ GiB و نزدیک پایان فایل آزموده شود؛ هیچ محاسبهٔ offset ۳۲بیتی نباشد.
8. pause قبل از تکمیل اولین رنج، resume بعد از restart، رنج split، تغییر signed URL و قطع برق آزموده شوند؛ فایل نهایی با SHA مرجع مقایسه شود.
9. انقضای access وسط رنج، تغییر IP و کندی طولانی مجوز زنده را بی‌دلیل قطع نکنند.
10. انقضای ۲۴ ساعت بی‌فعالیتی و لغو صریح، دسترسی مجدد با refresh/recovery را رد کنند؛ هیچ احیای خودکاری رخ ندهد.
11. بعد از SHA موفق complete اتمیک revoke کند؛ درخواست بعدی دانلود/refresh رد شود؛ پیام پایان گم‌شده قابل retry باشد.
12. complete با SHA خالی/غلط یا bytes نامنطبق رد شود؛ توکن منقضی فقط برای revoke با proof معتبر پذیرفته شود.
13. پاسخ رنج تحویل‌شده به proxy ولی قطع‌شده پیش از کلاینت، مجوز را مصرف نکند؛ retry آخر فایل مجاز بماند.
14. دادهٔ حافظهٔ حساب دیگر قابل مشاهده نباشد؛ گزارش قدیمی/ناموجود صفر نمایش داده نشود.
15. اگر سیاست یک دستگاه برای هر خرید اضافه شد، race دو grant روی دو instance نیز تست شود.

## ۱۷. تقسیم کار تحویل

**بک‌اند سایت:** مدل داده، entitlement، handoff اتمیک، DPoP/replay/nonce، grant/refresh/recovery/complete، Range، telemetry و تست‌ها.
**فرانت‌اند:** نگه‌داری handoff در همان تب، ورود معمول، فهرست مجاز، دکمهٔ PS5، پیام برگشت به اپ و نمایش حافظه. access/refresh token نباید در فرانت‌اند باشد.
**زیرساخت:** origin ثابت و TLS، proxy قابل اعتماد، عدم cache/log اسرار، timeout، storage و هماهنگی multi-instance.
**تیم اپ:** تغییر origin/allowlist پس از مشخص‌شدن دامنه، ساخت نسخهٔ سازگار و تست سخت‌افزاری. بدون این مرحله مهاجرت دامنه کامل نیست.

تحویل برنامه‌نویس: قرارداد نهایی origin و JSON، migration، تست‌های بالا، راهنمای استقرار، تنظیمات غیرمحرمانه و گزارش تست ۳۲ ورکر/پاز/ریزوم/ابطال. مقادیر secret در فایل امن محیطی جدا نگه داشته شوند.

## ۱۸. مراجع کد و وضعیت اطمینان

اپ: downloader/auth/device-session.js، dpop-client.js، DeviceDialog.jsx، browser-launch.js، downloads/single-download.js و capture.js. موتور: overdrive/ps5-react/native/shared/network.cpp و dpop.cpp.
سرور بررسی‌شده: /opt/tgstorage/tgstorage/{web.py,secure_auth.py,db.py,downloader.py}. بخش‌های مهم: account_dpop_handoff، start_device_authorization، exchange_device_code، refresh_grant، authorize_request، confirm_completion، touch_dpop_activity.

قرارداد قدیمی DOWNLOAD32_DPOP_CONTRACT.md برای جزئیات رمزنگاری مفید است اما UI ورود کد و complete اختیاری با revoke_grant=false در آن، مبنای جریان جدید نیست.

این سند از کد فعلی تهیه شده؛ موفقیت ساخت PS5 و تست‌های محلی اثبات اجرای همهٔ حالت‌ها روی سخت‌افزار نیست. در نسخهٔ 01.015 تست اختصاصی ریزوم/SHA پاس شد؛ مجموعهٔ عمومی شبکه در دو assertion زمان‌بندی خطا شکست داشت و کامل سبز اعلام نشده است. اطلاعات کامل در reports/RESUME_AND_SPEED_FA.md موجود است. در تهیهٔ این سند تغییری روی سرویس یا بکاپ‌ها اعمال نشده است.
