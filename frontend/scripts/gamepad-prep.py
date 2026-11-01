# -*- coding: utf-8 -*-
"""آماده‌سازی بیلدِ «تست دسته» (DualSense Tester) برای Next.js.

خروجیِ vite مسیرهایش مطلق است (/assets, /models) و سرویس‌ورکر ثبت می‌کند؛
این اسکریپت آن‌ها را برای سرو شدن از public/gamepad درست می‌کند و پلِ
«تم/زبان» + پالتِ رنگ را داخل index.html تزریق می‌کند.

اجرا از ریشه‌ی پروژه‌ی Next:
    python scripts/gamepad-prep.py --copy ../dualsense-tester/dist
    python scripts/gamepad-prep.py                    # فقط پچ (بدون کپی)
    python scripts/gamepad-prep.py --base /panel      # اگر next.config basePath دارد
"""
import argparse
import glob
import io
import os
import re
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)                       # ریشه‌ی پروژه‌ی Next
DEST = os.path.join(PROJECT, 'public', 'gamepad')

# رنگ‌های اصلیِ خودِ تستر که باید به پالتِ پروژه وصل شوند
ACCENT_HEX = '#2f81f7'
ACCENT_RGB = '47 129 247'

# --- پلِ تم/زبان: قبل از باندل اجرا می‌شود تا اولین رنگ‌آمیزی درست باشد ---
BRIDGE_SCRIPT = """<!-- gd-bridge:script -->
<script>(function(){
try{
  var m=/[?&]theme=(light|dark)/.exec(location.search);
  var t=m?m[1]:(localStorage.getItem('vueuse-color-scheme')||'light');
  if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.classList.add(t);
}catch(e){}
try{
  var q=/[?&]lang=([A-Za-z-]{2,10})/.exec(location.search);
  if(q)localStorage.setItem('lang',q[1]);
}catch(e){}
window.addEventListener('message',function(e){
  var d=e.data; if(!d||d.type!=='gd:theme')return;
  var t=d.theme==='light'?'light':'dark';
  document.documentElement.classList.toggle('dark',t==='dark');
  document.documentElement.classList.toggle('light',t==='light');
  try{localStorage.setItem('vueuse-color-scheme',t);}catch(e){}
});
})();</script>
<!-- /gd-bridge:script -->"""

# --- پالت + پاک‌سازی: آخرین استایل‌شیت تا روی استایل‌های خودِ تستر بیفتد ---
BRIDGE_STYLE = """<!-- gd-bridge:css -->
<style id="gd-theme">
:root{
  --gd-bg:#dfe3ec; --gd-surface:#eef1f7; --gd-text:#1b2236;
  --gd-accent:#3f6fe0; --gd-accent2:#7a5cf0;
  --gd-bg-rgb:223 227 236; --gd-surface-rgb:238 241 247; --gd-border-rgb:211 217 230;
  --gd-text-rgb:27 34 54; --gd-dim-rgb:90 101 132; --gd-accent-rgb:63 111 224;
}
html.dark{
  --gd-bg:#0a0d15; --gd-surface:#161b2b; --gd-text:#eaeef8;
  --gd-accent:#5b8cff; --gd-accent2:#8b6cff;
  --gd-bg-rgb:10 13 21; --gd-surface-rgb:22 27 43; --gd-border-rgb:37 45 67;
  --gd-text-rgb:234 238 248; --gd-dim-rgb:154 165 192; --gd-accent-rgb:91 140 255;
}
html.light,html.dark{ --bg-color:var(--gd-bg-rgb); --text-color:var(--gd-text-rgb); }
html{ color:var(--gd-text); }
:root{ --default-fonts:'Vazirmatn',Tahoma,'Segoe UI',sans-serif; }
body{ scrollbar-color:rgb(var(--gd-border-rgb)) transparent; }
.dou-sc-container{ background:var(--gd-surface); }
.tools-wrapper .switch[role="switch"]{ display:none; }
footer{ display:none; }
.tools-wrapper .v-popper:has(a[href*="github.com"]){ display:none; }
</style>
<!-- /gd-bridge:css -->"""


def patch(path, pairs, regex=()):
    with io.open(path, encoding='utf-8') as f:
        s = f.read()
    n = 0
    for a, b in pairs:
        n += s.count(a)
        s = s.replace(a, b)
    for pat, rep in regex:
        s, c = re.subn(pat, rep, s)
        n += c
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    print('  %-44s %4d' % (os.path.basename(path), n))
    return n


def one(pattern):
    """فایل‌های منطبق با الگو (نامِ فایل‌های vite هش دارد و هر بیلد عوض می‌شود)."""
    return glob.glob(os.path.join(DEST, 'assets', pattern))


def rmtree_retry(path, tries=6):
    """ویندوز فایلِ تازه‌خوانده‌شده را چند صد میلی‌ثانیه قفل نگه می‌دارد."""
    for i in range(tries):
        try:
            shutil.rmtree(path)
            return
        except PermissionError as e:
            if i == tries - 1:
                sys.exit('پوشه‌ی %s قفل است (%s). صفحه‌ی تست دسته را ببند و دوباره اجرا کن.'
                         % (path, e))
            time.sleep(0.5 * (i + 1))


def put_block(html, name, block, anchor):
    """بلوکِ نشانه‌دار را جای قبلی‌اش می‌گذارد (یا قبل از anchor) — idempotent."""
    html = re.sub(r'\s*<!-- gd-bridge:%s -->.*?<!-- /gd-bridge:%s -->\s*' % (name, name),
                  '\n', html, flags=re.S)
    if anchor not in html:
        return html
    return html.replace(anchor, block + '\n' + anchor, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--copy', metavar='DIST', help='پوشه‌ی dist خروجی vite (اول کپی می‌کند)')
    ap.add_argument('--base', default='', help='پیشوند مسیر؛ مثلاً /panel اگر basePath دارید')
    a = ap.parse_args()
    base = a.base.rstrip('/')

    if a.copy:
        src = os.path.abspath(a.copy)
        if not os.path.isdir(src):
            sys.exit('dist پیدا نشد: ' + src)
        staging = DEST + '.new'
        if os.path.isdir(staging):
            rmtree_retry(staging)
        os.makedirs(os.path.dirname(DEST), exist_ok=True)
        shutil.copytree(src, staging)
        if os.path.isdir(DEST):
            rmtree_retry(DEST)
        os.rename(staging, DEST)
        print('copied %s -> %s' % (src, DEST))

    if not os.path.isdir(DEST):
        sys.exit('پوشه‌ی public/gamepad نیست؛ اول با --copy اجرا کن.')

    # --- ۱) مسیرها ---
    print('paths:')
    patch(os.path.join(DEST, 'index.html'), [
        ('"/assets/', '"assets/'),
        ('"/pwa/', '"pwa/'),
        ('"/manifest.webmanifest"', '"manifest.webmanifest"'),
    ])
    for p in one('style.*.css'):
        patch(p, [('url(/fonts/', 'url(../fonts/')])
    for p in one('ControllerModel3D.*.js'):
        patch(p, [('`/models/', '`%s/gamepad/models/' % base)])
    for p in one('model-*.js'):
        patch(p, [('"/assets/', '"%s/gamepad/assets/' % base)])

    # --- ۲) سرویس‌ورکر خاموش (وگرنه کلِ اپِ Next را کش می‌کند) ---
    print('service worker:')
    for p in one('index.*.js'):
        patch(p, [('new e(`/sw.js`,{scope:`/`,type:`classic`})', 'null')])

    # --- ۳) پلِ تم/زبان + پالت (و حذفِ لینکِ قدیمیِ /gamepad-theme.css اگر مانده) ---
    print('bridge:')
    ix = os.path.join(DEST, 'index.html')
    with io.open(ix, encoding='utf-8') as f:
        html = f.read()
    before = html
    html = re.sub(r'\s*<link rel="stylesheet" href="/gamepad-theme\.css">', '', html)
    anchor = '<title>' if '<title>' in html else ('<meta charset="UTF-8">' if '<meta charset="UTF-8">' in html else '<head>')
    html = put_block(html, 'script', BRIDGE_SCRIPT, anchor)
    html = put_block(html, 'css', BRIDGE_STYLE, '</head>')
    if html != before:
        with io.open(ix, 'w', encoding='utf-8', newline='') as f:
            f.write(html)
    print('  index.html                                        %d' % (html != before))

    # --- ۴) رنگ‌های CSS → متغیرهای --gd-* ---
    print('colors (css):')
    for p in one('style.*.css'):
        patch(p, [
            ('background-color:rgb(255 255 255/var(--un-bg-opacity))',
             'background-color:rgb(var(--gd-surface-rgb)/var(--un-bg-opacity))'),
            ('background-color:rgb(0 0 0/var(--un-bg-opacity))',
             'background-color:rgb(var(--gd-surface-rgb)/var(--un-bg-opacity))'),
            (ACCENT_RGB, 'var(--gd-accent-rgb)'),
        ], regex=[
            (r'(?<![-a-z])color:rgb\((?:209 213 219|75 85 99)/', 'color:rgb(var(--gd-dim-rgb)/'),
            (r'(?:209 213 219|75 85 99)', 'var(--gd-border-rgb)'),
            (r'#4b5563([0-9a-f]{2})',
             lambda m: 'rgb(var(--gd-border-rgb)/%s%%)' % round(int(m.group(1), 16) / 2.55, 1)),
            (ACCENT_HEX + r'([0-9a-f]{2})',
             lambda m: 'rgb(var(--gd-accent-rgb)/%s%%)' % round(int(m.group(1), 16) / 2.55, 1)),
            (ACCENT_HEX, 'rgb(var(--gd-accent-rgb))'),
        ])

    # --- ۵) رنگ‌های بومِ سه‌بعدی (pixi/three) → خواندن از همان متغیرها ---
    print('colors (canvas js):')
    READ = '((n,d)=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||d)'
    for p in one('model-DualSense.*.js'):
        patch(p, [
            ('r.value===`dark`?{normal:`#ffffff`,background:`#000000`,primary:`#2f81f7`,active:`#c586c0`}'
             ':{normal:`#000000`,background:`#ffffff`,primary:`#2f81f7`,active:`#8546ef`}',
             '(v=>({normal:v(`--gd-text`,r.value===`dark`?`#ffffff`:`#000000`),'
             'background:v(`--gd-bg`,r.value===`dark`?`#000000`:`#ffffff`),'
             'primary:v(`--gd-accent`,`#2f81f7`),'
             'active:v(`--gd-accent2`,r.value===`dark`?`#c586c0`:`#8546ef`)}))(' + READ + ')'),
            ('xu=`#2f81f7`', 'xu=' + READ + '(`--gd-accent`,`#2f81f7`)'),
        ])
    for p in one('model-DualSenseEdge.*.js'):
        patch(p, [
            ('i.colorModeState===`dark`?{normal:`#ffffff`,active:`#2f81f7`}:{normal:`#000000`,active:`#2f81f7`}',
             '(v=>({normal:v(`--gd-text`,i.colorModeState===`dark`?`#ffffff`:`#000000`),'
             'active:v(`--gd-accent`,`#2f81f7`)}))(' + READ + ')'),
        ])

    # --- ۶) لایسنسِ MIT کنارِ بیلد بماند ---
    if a.copy:
        lic = os.path.join(os.path.dirname(os.path.abspath(a.copy)), 'LICENSE')
        if os.path.isfile(lic):
            shutil.copyfile(lic, os.path.join(DEST, 'LICENSE'))
            print('license:  LICENSE                                 1')

    print('done. -> public/gamepad')


if __name__ == '__main__':
    main()
