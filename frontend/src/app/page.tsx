'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { GameCardItem, GameListResponse } from '@/types/game';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import ReferralSummaryBanner from '@/components/home/ReferralSummaryBanner';
import DoubleHeroBanners from '@/components/home/DoubleHeroBanners';
import GameCarousel from '@/components/home/GameCarousel';
import TutorialBlogsSection from '@/components/home/TutorialBlogsSection';
import {
  Sparkles,
  Flame,
  Users,
  Glasses,
  Swords,
  Ghost,
  Gamepad,
  Smile,
  Boxes,
  Shield,
  Crosshair,
  Trophy,
  BrainCircuit,
  Compass,
  Bookmark,
} from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [games, setGames] = useState<GameCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiRequest<GameListResponse>('/games?page=1&page_size=100');
        if (res && res.items) {
          setGames(res.items);
        }
      } catch (err) {
        console.error('Failed to load games catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filter helper functions
  const newReleases = [...games]
    .sort((a, b) => (b.released || '').localeCompare(a.released || ''))
    .slice(0, 10);

  const twoPlayerGames = games.filter((g) => g.is_two_player).slice(0, 10);
  const vrGames = games.filter((g) => g.has_vr).slice(0, 10);

  const getGamesByGenre = (genreKeyword: string) => {
    const matched = games.filter((g) =>
      g.genres.some((genre) => genre.toLowerCase().includes(genreKeyword.toLowerCase()))
    );
    return matched.length > 0 ? matched.slice(0, 10) : games.slice(0, 8);
  };

  const [wishlistedGames, setWishlistedGames] = useState<GameCardItem[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      apiRequest<GameCardItem[]>('/games/wishlist')
        .then((data) => setWishlistedGames(data || []))
        .catch((err) => console.error('Failed to load wishlist:', err));
    } else {
      setWishlistedGames([]);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen pb-16">
      {/* 1. Referral Summary Banner (Top of page for logged-in users) */}
      <ReferralSummaryBanner />

      {/* 2. Double Cinematic Hero Banners (2/3 Height) */}
      <DoubleHeroBanners />

      {/* 3. Wishlisted Games (for Authenticated Users) */}
      {isAuthenticated && wishlistedGames.length > 0 && (
        <GameCarousel
          title={t('home.wishlist')}
          icon={<Bookmark className="w-4 h-4 text-pink-400" />}
          viewAllHref="/profile?tab=wishlist"
          games={wishlistedGames}
        />
      )}

      {/* 4. Newly Released Games */}
      <GameCarousel
        title={t('home.newestGames')}
        icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        viewAllHref="/games?sort=newest"
        games={newReleases.length > 0 ? newReleases : games.slice(0, 8)}
      />

      {/* 5. Educational Tutorials Section (EXACTLY between new releases and local co-op) */}
      <TutorialBlogsSection />

      {/* 6. Local Co-op (2 Players / 2 Gamepads) */}
      <GameCarousel
        title={t('home.localCoop')}
        icon={<Users className="w-4 h-4 text-cosmic-purple" />}
        viewAllHref="/games?is_two_player=true"
        games={twoPlayerGames.length > 0 ? twoPlayerGames : games.slice(0, 8)}
      />

      {/* 7. Genre Carousels (11 distinct genres) */}
      {/* Action-Adventure */}
      <GameCarousel
        title={t('home.actionAdventure')}
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        viewAllHref="/games?genre=action"
        games={getGamesByGenre('action')}
      />

      {/* Fighting */}
      <GameCarousel
        title={t('home.fighting')}
        icon={<Swords className="w-4 h-4 text-rose-500" />}
        viewAllHref="/games?genre=fighting"
        games={getGamesByGenre('fighting')}
      />

      {/* Horror & Survival */}
      <GameCarousel
        title={t('home.horror')}
        icon={<Ghost className="w-4 h-4 text-red-500" />}
        viewAllHref="/games?genre=horror"
        games={getGamesByGenre('horror')}
      />

      {/* Indie & Creative */}
      <GameCarousel
        title={t('home.indie')}
        icon={<Gamepad className="w-4 h-4 text-emerald-400" />}
        viewAllHref="/games?genre=indie"
        games={getGamesByGenre('indie')}
      />

      {/* Party & Casual */}
      <GameCarousel
        title={t('home.party')}
        icon={<Smile className="w-4 h-4 text-yellow-400" />}
        viewAllHref="/games?genre=party"
        games={getGamesByGenre('party')}
      />

      {/* Platformer & Puzzle */}
      <GameCarousel
        title={t('home.platformer')}
        icon={<Boxes className="w-4 h-4 text-cyan-400" />}
        viewAllHref="/games?genre=platformer"
        games={getGamesByGenre('platformer')}
      />

      {/* RPG */}
      <GameCarousel
        title={t('home.rpg')}
        icon={<Shield className="w-4 h-4 text-purple-400" />}
        viewAllHref="/games?genre=rpg"
        games={getGamesByGenre('role-playing-games-rpg')}
      />

      {/* Shooter */}
      <GameCarousel
        title={t('home.shooter')}
        icon={<Crosshair className="w-4 h-4 text-blue-400" />}
        viewAllHref="/games?genre=shooter"
        games={getGamesByGenre('shooter')}
      />

      {/* Sports & Racing */}
      <GameCarousel
        title={t('home.sportsRacing')}
        icon={<Trophy className="w-4 h-4 text-amber-400" />}
        viewAllHref="/games?genre=sports"
        games={getGamesByGenre('sports')}
      />

      {/* Strategy & Tactical */}
      <GameCarousel
        title={t('home.strategy')}
        icon={<BrainCircuit className="w-4 h-4 text-indigo-400" />}
        viewAllHref="/games?genre=strategy"
        games={getGamesByGenre('strategy')}
      />

      {/* Survival & Open World */}
      <GameCarousel
        title={t('home.openWorld')}
        icon={<Compass className="w-4 h-4 text-teal-400" />}
        viewAllHref="/games?genre=adventure"
        games={getGamesByGenre('adventure')}
      />

      {/* 8. Virtual Reality (PSVR2 / VR) */}
      <GameCarousel
        title={t('home.vrSpotlight')}
        icon={<Glasses className="w-4 h-4 text-cyan-300" />}
        viewAllHref="/games?has_vr=true"
        games={vrGames.length > 0 ? vrGames : games.slice(0, 8)}
      />
    </div>
  );
}
