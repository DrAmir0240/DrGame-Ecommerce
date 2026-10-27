'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { GameCardItem, GameListResponse } from '@/types/game';
import { useAuthStore } from '@/stores/useAuthStore';
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
          title="علاقه‌مندی‌های شما (Wishlist)"
          icon={<Bookmark className="w-4 h-4 text-pink-400" />}
          viewAllHref="/profile?tab=wishlist"
          games={wishlistedGames}
        />
      )}

      {/* 4. Newly Released Games */}
      <GameCarousel
        title="تازه‌ترین بازی‌های اضافه شده به دیتابیس"
        icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        viewAllHref="/games?sort=newest"
        games={newReleases.length > 0 ? newReleases : games.slice(0, 8)}
      />

      {/* 5. Educational Tutorials Section (EXACTLY between new releases and local co-op) */}
      <TutorialBlogsSection />

      {/* 6. Local Co-op (2 Players / 2 Gamepads) */}
      <GameCarousel
        title="بازی‌های پرطرفدار دو نفره و دونفره آفلاین (Local Co-op)"
        icon={<Users className="w-4 h-4 text-cosmic-purple" />}
        viewAllHref="/games?is_two_player=true"
        games={twoPlayerGames.length > 0 ? twoPlayerGames : games.slice(0, 8)}
      />

      {/* 7. Genre Carousels (11 distinct genres) */}
      {/* Action-Adventure */}
      <GameCarousel
        title="محبوب‌ترین عناوین اکشن و ماجراجویی (Action-Adventure)"
        icon={<Flame className="w-4 h-4 text-orange-400" />}
        viewAllHref="/games?genre=action"
        games={getGamesByGenre('action')}
      />

      {/* Fighting */}
      <GameCarousel
        title="بازی‌های مبارزه‌ای و رزمی (Fighting)"
        icon={<Swords className="w-4 h-4 text-rose-500" />}
        viewAllHref="/games?genre=fighting"
        games={getGamesByGenre('fighting')}
      />

      {/* Horror & Survival */}
      <GameCarousel
        title="هیجان و وحشت بقا (Horror)"
        icon={<Ghost className="w-4 h-4 text-red-500" />}
        viewAllHref="/games?genre=horror"
        games={getGamesByGenre('horror')}
      />

      {/* Indie & Creative */}
      <GameCarousel
        title="بازی‌های مستقل و شاهکارهای خلاقانه (Indie)"
        icon={<Gamepad className="w-4 h-4 text-emerald-400" />}
        viewAllHref="/games?genre=indie"
        games={getGamesByGenre('indie')}
      />

      {/* Party & Casual */}
      <GameCarousel
        title="بازی‌های دورهمی، مهمانی و خانوادگی (Party Games)"
        icon={<Smile className="w-4 h-4 text-yellow-400" />}
        viewAllHref="/games?genre=party"
        games={getGamesByGenre('party')}
      />

      {/* Platformer & Puzzle */}
      <GameCarousel
        title="سکوبازی، پلتفرمر و معمایی (Platformer & Puzzle)"
        icon={<Boxes className="w-4 h-4 text-cyan-400" />}
        viewAllHref="/games?genre=platformer"
        games={getGamesByGenre('platformer')}
      />

      {/* RPG */}
      <GameCarousel
        title="نقش‌آفرینی عمیق و حماسی (Role-Playing / RPG)"
        icon={<Shield className="w-4 h-4 text-purple-400" />}
        viewAllHref="/games?genre=rpg"
        games={getGamesByGenre('role-playing-games-rpg')}
      />

      {/* Shooter */}
      <GameCarousel
        title="شوترهای اول‌شخص و تیراندازی تاکتیکی (Shooter)"
        icon={<Crosshair className="w-4 h-4 text-blue-400" />}
        viewAllHref="/games?genre=shooter"
        games={getGamesByGenre('shooter')}
      />

      {/* Sports & Racing */}
      <GameCarousel
        title="ورزشی، فوتبال و اتومبیل‌رانی مسابقه‌ای (Sports & Racing)"
        icon={<Trophy className="w-4 h-4 text-amber-400" />}
        viewAllHref="/games?genre=sports"
        games={getGamesByGenre('sports')}
      />

      {/* Strategy & Tactical */}
      <GameCarousel
        title="استراتژی، شبیه‌سازی و تاکتیکی (Strategy)"
        icon={<BrainCircuit className="w-4 h-4 text-indigo-400" />}
        viewAllHref="/games?genre=strategy"
        games={getGamesByGenre('strategy')}
      />

      {/* Survival & Open World */}
      <GameCarousel
        title="بقا و دنیاهای بی‌پایان جهان‌باز (Survival & Open World)"
        icon={<Compass className="w-4 h-4 text-teal-400" />}
        viewAllHref="/games?genre=adventure"
        games={getGamesByGenre('adventure')}
      />

      {/* 8. Virtual Reality (PSVR2 / VR) */}
      <GameCarousel
        title="تجربه واقعیت مجازی پلی‌استیشن (PS VR2 Spotlight)"
        icon={<Glasses className="w-4 h-4 text-cyan-300" />}
        viewAllHref="/games?has_vr=true"
        games={vrGames.length > 0 ? vrGames : games.slice(0, 8)}
      />
    </div>
  );
}
