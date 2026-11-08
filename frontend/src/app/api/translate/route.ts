import { NextRequest, NextResponse } from 'next/server';
import { isSupportedLocale, IS_INTERNATIONAL } from '@/i18n/locale-codes';
import { translateBatchServer } from '@/lib/serverTranslation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const defaultSource = IS_INTERNATIONAL ? 'en' : 'fa';
    const { texts, targetLang, sourceLang = defaultSource } = body || {};

    if (!Array.isArray(texts) || !targetLang) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (!isSupportedLocale(targetLang)) {
      return NextResponse.json({
        translations: Object.fromEntries(texts.map((t) => [t, t])),
      });
    }

    const translations = await translateBatchServer(texts, targetLang, sourceLang);

    return NextResponse.json(
      { translations },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
