'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Send,
  Instagram,
  Twitter,
  Coins,
  CreditCard,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

export default function Footer() {
  const pathname = usePathname();
  const { t } = useTranslation();
  // Deployment mode driven strictly by environment variable
  const deploymentMode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE || 'domestic';
  const footerMode = deploymentMode === 'international' ? 'international' : 'domestic';
  const { settings, fetchSettings } = useSiteSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Do not render storefront footer inside the admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const phone = settings?.contact_phone || t('footer.phone');
  const email = settings?.contact_email || t('footer.email');
  const address = settings?.contact_address || t('footer.address');
  const telegramUrl = settings?.social_telegram || settings?.telegram_url || 'https://t.me/drgame';
  const instagramUrl = settings?.social_instagram || settings?.instagram_url || 'https://instagram.com/drgame';
  const twitterUrl = settings?.twitter_url || 'https://x.com/drgame';
  const footerMessage = settings?.footer_message || t('footer.description');
  const enamadUrl = settings?.enamad_url || 'https://enamad.ir';
  const samandehiUrl = settings?.samandehi_url || 'https://samandehi.ir';

  return (
    <footer className="w-full border-t border-white/5 bg-surface-base/90 backdrop-blur-2xl relative z-10 mt-20">
      <div className="max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & About */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 p-1 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="DrGame Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">
                {t('footer.brandName')}
              </span>
              <span className="text-[10px] text-text-muted font-mono tracking-wider">DRGAME.IR</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {footerMessage}
          </p>
          <div className="flex items-center gap-3 text-text-muted">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl glass-card hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
            >
              <Send className="w-4 h-4" />
            </a>
            {footerMode === 'domestic' ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl glass-card hover:text-pink-400 hover:border-pink-400/40 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            ) : (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl glass-card hover:text-white hover:border-white/40 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4">{t('footer.quickLinks')}</h4>
          <ul className="space-y-2.5 text-xs text-text-secondary">
            <li>
              <Link href="/games" className="hover:text-white transition-colors">
                {t('footer.gamesCatalog')}
              </Link>
            </li>
            <li>
              <Link href="/subscriptions" className="hover:text-white transition-colors">
                {t('footer.subPlans')}
              </Link>
            </li>
            <li>
              <Link href="/tools" className="hover:text-white transition-colors">
                {t('footer.consoleTools')}
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                {t('footer.tutorialsAndNews')}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white transition-colors">
                سوالات متداول (FAQ)
              </Link>
            </li>
          </ul>
        </div>

        {/* Dynamic Mode Content: Contact & Support */}
        {footerMode === 'domestic' ? (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">{t('footer.domesticSupport')}</h4>
            <ul className="space-y-3 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono dir-ltr">{phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cosmic-purple shrink-0" />
                <span className="font-mono">{email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">{t('footer.internationalSupport')}</h4>
            <ul className="space-y-3 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono">{email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>USDT (TRC20 / ERC20), BTC, ETH Accepted</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-cosmic-purple shrink-0 mt-0.5" />
                <span>Global High-Speed CDN nodes across EU & Asia</span>
              </li>
            </ul>
          </div>
        )}

        {/* Dynamic Mode Badges & Payment Trust */}
        {footerMode === 'domestic' ? (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">{t('footer.licensesAndGateways')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Enamad */}
              <a
                href={enamadUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-cyan-400/40 text-center flex flex-col items-center justify-center transition-all"
              >
                <ShieldCheck className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-[11px] font-bold text-white">{t('footer.enamad')}</span>
                <span className="text-[9px] text-emerald-400">{t('footer.enamadSub')}</span>
              </a>
              {/* Samandehi */}
              <a
                href={samandehiUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-amber-400/40 text-center flex flex-col items-center justify-center transition-all"
              >
                <ShieldCheck className="w-8 h-8 text-amber-400 mb-1" />
                <span className="text-[11px] font-bold text-white">{t('footer.samandehi')}</span>
                <span className="text-[9px] text-text-muted">{t('footer.samandehiSub')}</span>
              </a>
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-text-muted">
              <span>{t('footer.shaparakGateway')}</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> {t('footer.shaparakGatewaysList')}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">{t('footer.cryptoGateways')}</h4>
            <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('footer.automatedTether')}</span>
                <span className="font-mono font-bold text-emerald-400">USDT / USDC</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('footer.supportedChains')}</span>
                <span className="text-white font-mono text-[11px]">Tron, BNB, Polygon</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{t('footer.instantQuota')}</span>
                <span className="text-cyan-400 font-bold">{t('footer.zeroConfirmation')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="border-t border-white/5 py-4 text-center text-[11px] text-text-muted">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
