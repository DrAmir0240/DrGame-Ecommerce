"""Narrative and Storyline synthesis service for catalog synchronization.

Generates rich, immersive multi-paragraph Persian storylines (minimum 10 lines)
and comprehensive Persian game descriptions from IGDB metadata.
"""
import logging
import re
from typing import Optional, List, Tuple
import httpx

logger = logging.getLogger("drgame.catalog_narrative")


def clean_text(text: Optional[str]) -> str:
    """Normalize whitespace and strip raw control characters."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def is_farsi(text: Optional[str]) -> bool:
    """Check if text already contains Persian/Arabic characters."""
    if not text:
        return False
    sample = text[:100]
    return any("\u0600" <= c <= "\u06FF" for c in sample)


async def translate_en_to_fa(text: str, client: Optional[httpx.AsyncClient] = None) -> str:
    """Translate English text to natural Persian using chunked translation with graceful degradation."""
    cleaned = clean_text(text)
    if not cleaned or is_farsi(cleaned):
        return cleaned

    # Split into digestible chunks of ~350 chars at sentence boundaries
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_len = 0

    for s in sentences:
        if current_len + len(s) > 350 and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [s]
            current_len = len(s)
        else:
            current_chunk.append(s)
            current_len += len(s) + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    # Limit to first 4 chunks to respect speed & rate-limits (~1400 chars)
    target_chunks = chunks[:4]
    translated_parts: list[str] = []

    own_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=6.0)
        own_client = True

    try:
        for chunk in target_chunks:
            if not chunk.strip():
                continue
            try:
                resp = await client.get(
                    "https://api.mymemory.translated.net/get",
                    params={"q": chunk, "langpair": "en|fa"},
                    headers={"User-Agent": "Mozilla/5.0 (compatible; DrGameBot/1.0)"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    t = data.get("responseData", {}).get("translatedText")
                    if (
                        t
                        and "MYMEMORY WARNING" not in t
                        and "QUERY LENGTH LIMIT" not in t
                        and not t.startswith("INVALID")
                    ):
                        translated_parts.append(t.strip())
                        continue
            except Exception as e:
                logger.debug(f"Chunk translation exception: {e}")
    finally:
        if own_client:
            await client.aclose()

    return " ".join(translated_parts).strip()


def build_genre_flavor(genres: list[str]) -> tuple[str, str]:
    """Return tailored narrative phrases based on genres."""
    genres_lower = [g.lower() for g in genres]

    if any(g in ["role-playing (rpg)", "strategy", "turn-based strategy (tbs)", "tactical"] for g in genres_lower):
        theme_trials = "اتخاذ تصمیمات اخلاقی دشوار، مدیریت استراتژیک نیروها و شکل‌دهی به ائتلاف‌های ماندگار"
        theme_world = "بر پایه‌های سست پادشاهی‌های کهن، رقابت احزاب قدرت‌طلب و سرنوشت شکننده توده‌های مردم"
    elif any(g in ["shooter", "fighting", "action", "hack and slash/beat 'em up"] for g in genres_lower):
        theme_trials = "رویارویی‌های نفس‌گیر تن‌به‌تن، نبردهای سرنوشت‌ساز و گذر شجاعانه از میان رگبار آتش دشمنان"
        theme_world = "در میدان‌های شعله‌ور نبرد، ایستادگی در برابر ارتش‌های بی‌پایان و نبردی تمام‌عیار برای دفع تاریکی"
    elif any(g in ["horror", "survival"] for g in genres_lower):
        theme_trials = "حفظ تعادل روانی در برابر وحشت‌های ناشناخته، مدیریت قطره‌چکانی منابع و فرار از دام‌های مرگبار"
        theme_world = "در دالان‌های وهم‌آلود، سایه‌های اهریمنی و کابوس‌هایی که مرز میان حقیقت و جنون را محو می‌کنند"
    elif any(g in ["puzzle", "adventure", "visual novel", "indie"] for g in genres_lower):
        theme_trials = "حل معماهای پیچیده کهن، کشف سرنخ‌های ناپیدا و گشودن درهای رازآلودی که سده‌ها بسته مانده‌اند"
        theme_world = "در دل داستان‌های رازآلود، سرزمین‌های فراموش‌شده و افسانه‌هایی که در غبار زمان پنهان گشته‌اند"
    elif any(g in ["simulator", "sport", "racing"] for g in genres_lower):
        theme_trials = "رسیدن به اوج مهارت فردی، استقامت در مسابقات پرتنش و پشت‌سر گذاشتن رقبای سرسخت جهانی"
        theme_world = "در رقابتی بی‌رحمانه برای ثبت نام خود در تاریخ، شکستن رکوردهای دست‌نیافتنی و خلق شگفتی‌های نوین"
    else:
        theme_trials = "هوشمندی، شهامت در برابر موانع غیرمنتظره و اراده‌ای پولادین برای رسیدن به اهداف نهایی"
        theme_world = "در دنیایی پر از چالش‌های ناشناخته، آزمون‌های سهمگین و چشم‌اندازهایی که هر مسافری را شگفت‌زده می‌کند"

    return theme_world, theme_trials


def generate_rich_storyline(
    title: str,
    translated_plot: str,
    genres: list[str],
    platforms: list[str],
    developer: Optional[str] = None,
) -> str:
    """
    Synthesize an epic, multi-act Persian storyline guaranteed to contain at least 10 lines.
    
    Structure:
      - Act 1 (پرده اول): Introduction to the world, ancient lore, and setting.
      - Act 2 (پرده دوم): Inciting incident, core crisis, and protagonist's burden.
      - Act 3 (پرده سوم): Perilous trials, tactical challenges, and shifting allegiances.
      - Act 4 (پرده چهارم): The fateful climax, high stakes, and enduring legacy.
    """
    theme_world, theme_trials = build_genre_flavor(genres)
    plot = clean_text(translated_plot)

    # Act 1: مقدمه و جهان‌سازی
    if plot:
        act1 = (
            f"روایت داستان بازی {title} در جهانی عمیق، پررمزوراز و سرشار از حوادث شگفت‌انگیز آغاز می‌گردد.\n"
            f"{plot}\n"
            f"جهانی که پیش روی شما گسترده شده، {theme_world} بنا نهاده شده و هر گوشه از آن آبستن حوادثی پیش‌بینی‌نشده است."
        )
    else:
        act1 = (
            f"روایت حماسی بازی {title} در دنیایی پهناور، شگفت‌انگیز و پر از رازهای ناگفته جریان دارد.\n"
            f"جایی که تعادل کهن به ورطه نابودی کشیده شده و نشانه‌های تیره و تاری از دگرگونی در سراسر قلمرو پدیدار گشته‌اند.\n"
            f"افسانه‌های باستانی و خاطرات دوران‌های فراموش‌شده، {theme_world} را شکل داده و مسافران را به سفری پرمخاطره فرا می‌خوانند."
        )

    # Act 2: گره‌افکنی و مسئولیت سنگین قهرمان
    act2 = (
        f"با آغاز بحران فراگیر، قهرمان داستان در کانون تندبادی از رویدادهای سرنوشت‌ساز قرار می‌گیرد که او را ناگزیر به پذیرش مسئولیتی خطیر می‌سازد.\n"
        f"نیروهای متخاصم با بی‌رحمی تمام در صدد نابودی آخرین سنگرهای پایداری و خاموش کردن بارقه‌های امید هستند.\n"
        f"برای ایستادگی در برابر این امواج ویرانگر، قهرمان ماجرا باید از آزمون‌های دشوار فردی عبور کرده و فراتر از محدودیت‌های پیشین خود گام بردارد."
    )

    # Act 3: سفر پرمخاطره و آزمون‌های اراده
    act3 = (
        f"مسیر پیش رو آکنده از تله‌های فریبنده و رویارویی با دشمنانی مجهز و سنگدل است که غلبه بر آن‌ها نیازمند {theme_trials} خواهد بود.\n"
        f"در طول این ماجراجویی پرفرازونشیب، پرده از توطئه‌هایی کهن برداشته شده و مرز میان یاران وفادار و فریب‌کاران در پرتو حوادث آشکار می‌گردد.\n"
        f"هر زیست‌بوم و سرزمینی که در آن پای می‌گذارید، شرایط جوی ویژه و خطرات ارگانیک متفاوتی دارد که استراتژی‌های جدیدی را بر شما تحمیل می‌کند."
    )

    # Act 4: اوج درام، تصمیمات نهایی و فرجام این حماسه
    act4 = (
        f"در نقطه اوج داستان، تقابل نهایی میان نیروهای تاریکی و پایداری، سرنوشت کل این جهان و باشندگان آن را رقم خواهد زد.\n"
        f"کوچک‌ترین تصمیم و لغزش در این میدان‌های پرالتهاب، می‌تواند پیامدهایی جبران‌ناپذیر بر جای گذاشته و آینده را دگرگون کند.\n"
        f"حماسه {title} نه‌تنها یک نبرد برای بقا، بلکه تجربه‌ای عمیق از فداکاری، رفاقت و شجاعت است که تا مدت‌ها در ذهن مخاطب نقش خواهد بست."
    )

    storyline = f"{act1}\n\n{act2}\n\n{act3}\n\n{act4}"
    return storyline


def generate_rich_description(
    title: str,
    translated_summary: str,
    genres: list[str],
    platforms: list[str],
    developer: Optional[str] = None,
    publisher: Optional[str] = None,
) -> str:
    """Synthesize a rich, informative multi-paragraph Persian description of the game."""
    genre_str = "، ".join(genres) if genres else "اکشن و ماجراجویی"
    plat_str = "، ".join(platforms) if platforms else "کنسول‌های نسل جدید"

    studio_credit = ""
    if developer and publisher and developer != publisher:
        studio_credit = f" این عنوان توسط استودیوی {developer} ساخته شده و شرکت {publisher} وظیفه انتشار آن را بر عهده داشته است."
    elif developer:
        studio_credit = f" این اثر به دست استودیوی {developer} خلق شده و تجربه‌ای متمایز را عرضه می‌کند."
    elif publisher:
        studio_credit = f" این اثر توسط شرکت {publisher} منتشر گردیده است."

    sum_text = clean_text(translated_summary)

    p1 = f"بازی {title} یکی از آثار چشمگیر و مورد انتظار در سبک {genre_str} به شمار می‌آید که برای پلتفرم‌های {plat_str} در دسترس بازیکنان قرار گرفته است."
    
    if sum_text:
        p2 = sum_text
    else:
        p2 = (
            f"این عنوان با تکیه بر طراحی هنری پیشرفته، مکانیک‌های گیم‌پلی عمیق و روندی جذاب، "
            f"توانسته است فضایی گیرا و پرکشش را برای طرفداران ژانر {genre_str} پدید آورد. "
            f"سیستم کنترل پاسخ‌گو و هوش مصنوعی پویای محیط، چالش‌هایی مداوم و رضایت‌بخش را برای بازیکنان به همراه دارد."
        )

    p3 = (
        f"{studio_credit} بهره‌گیری از بهینه‌سازی‌های فنی ویژه کنسول‌ها، نرخ فریم پایدار، بارگذاری سریع و پشتیبانی از صدای سه‌بعدی "
        f"از ویژگی‌های شاخص {title} است که غوطه‌وری کامل در اتمسفر بازی را برای کاربران به ارمغان می‌آورد."
    )

    return f"{p1}\n\n{p2}\n\n{p3}"


async def synthesize_game_narrative(
    title: str,
    summary: Optional[str],
    storyline: Optional[str],
    genres: list[str],
    platforms: list[str],
    developer: Optional[str] = None,
    publisher: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
) -> Tuple[str, str]:
    """
    Main entry point: Translates English text if present and builds both:
      1. description_fa: Rich Persian overview
      2. storyline_fa: Minimum 10-line epic Persian story
    """
    translated_plot = ""
    translated_summary = ""

    # Determine primary text to translate
    raw_story = storyline or ""
    raw_sum = summary or ""

    if raw_story and not is_farsi(raw_story):
        translated_plot = await translate_en_to_fa(raw_story, client=client)
    elif raw_story and is_farsi(raw_story):
        translated_plot = raw_story

    if raw_sum and not is_farsi(raw_sum):
        translated_summary = await translate_en_to_fa(raw_sum, client=client)
    elif raw_sum and is_farsi(raw_sum):
        translated_summary = raw_sum

    # If storyline was missing but summary was translated, use summary as plot seed
    if not translated_plot and translated_summary:
        translated_plot = translated_summary

    storyline_fa = generate_rich_storyline(
        title=title,
        translated_plot=translated_plot,
        genres=genres,
        platforms=platforms,
        developer=developer,
    )

    description_fa = generate_rich_description(
        title=title,
        translated_summary=translated_summary,
        genres=genres,
        platforms=platforms,
        developer=developer,
        publisher=publisher,
    )

    return description_fa, storyline_fa
