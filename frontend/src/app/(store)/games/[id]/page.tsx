import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GameDetail } from '@/types/game';
import GameDetailClient from './GameDetailClient';
import { isSupportedLocale, type SupportedLocale } from '@/i18n/locale-codes';
import { translateBatchServer } from '@/lib/serverTranslation';

interface PageProps {
  params: { id: string };
}

function getBackendBaseUrl(): string {
  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (process.env.NODE_ENV === 'production') return 'http://backend:8000';
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
}

async function fetchGameServer(gameId: string): Promise<GameDetail | null> {
  try {
    const baseUrl = getBackendBaseUrl();
    const res = await fetch(`${baseUrl}/api/games/${gameId}`, {
      next: { revalidate: 60 },
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch game ${gameId} on server:`, err);
    return null;
  }
}

function getActiveLocale(): SupportedLocale {
  const cookieStore = cookies();
  const isIntl = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international';
  const defaultLocale: SupportedLocale = isIntl ? 'en' : 'fa';
  const cookieLang = cookieStore.get('drgame_lang')?.value;
  return cookieLang && isSupportedLocale(cookieLang) ? (cookieLang as SupportedLocale) : defaultLocale;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const game = await fetchGameServer(params.id);
  if (!game) {
    return {
      title: 'Game Not Found | DrGame',
    };
  }

  const locale = getActiveLocale();
  const isPersian = locale === 'fa';
  const baseTitle = !isPersian && game.title_en ? game.title_en : (game.title_fa || game.title_en);
  const baseDesc = !isPersian && game.description_en ? game.description_en : (game.description_fa || game.description_en || '');

  let title = baseTitle;
  let description = baseDesc.slice(0, 160);

  if (locale !== 'fa' && locale !== 'en') {
    try {
      const translations = await translateBatchServer([baseTitle, description], locale, 'en');
      if (translations[baseTitle]) title = translations[baseTitle];
      if (translations[description]) description = translations[description];
    } catch {}
  }

  return {
    title: `${title} | DrGame`,
    description,
    openGraph: {
      title: `${title} | DrGame`,
      description,
      images: game.cover_image_url ? [game.cover_image_url] : [],
    },
  };
}

export default async function GameDetailPage({ params }: PageProps) {
  const game = await fetchGameServer(params.id);
  const locale = getActiveLocale();

  let initialTranslations: Record<string, string> = {};

  if (game && locale !== 'fa' && locale !== 'en') {
    // Gather critical dynamic texts to translate ahead-of-time during SSR
    const textsToTranslate: string[] = [];
    if (game.title_en) textsToTranslate.push(game.title_en);
    if (game.title_fa) textsToTranslate.push(game.title_fa);

    const storyContent = game.description_en || game.storyline_fa || game.description_fa;
    if (storyContent) textsToTranslate.push(storyContent);

    if (Array.isArray(game.genres)) {
      game.genres.forEach((g) => textsToTranslate.push(g));
    }
    if (Array.isArray(game.awards)) {
      game.awards.forEach((a) => textsToTranslate.push(a));
    }

    try {
      initialTranslations = await translateBatchServer(
        Array.from(new Set(textsToTranslate)),
        locale,
        'en'
      );
    } catch (e) {
      console.error('SSR dynamic translation failed:', e);
    }
  }

  return (
    <GameDetailClient
      gameId={params.id}
      initialGame={game}
      initialTranslations={initialTranslations}
    />
  );
}
