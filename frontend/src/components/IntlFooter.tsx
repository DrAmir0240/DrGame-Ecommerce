"use client";

import React from "react";
import Link from "next/link";
import { Globe, Shield, Lock, Cpu, Sparkles, MessageSquare } from "lucide-react";
import { PlayStationGlyph } from "./PlayStationGlyph";

export const IntlFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#151722] border-t border-white/10 text-slate-300 pt-12 pb-8 mt-20" dir="ltr">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/5">
          {/* Col 1: Global Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="DrGame"
                className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]"
              />
              <div>
                <h3 className="text-white font-extrabold text-lg">DrGame Global Network</h3>
                <p className="text-xs text-slate-400">High-Performance PlayStation Content & Data Delivery</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              DrGame delivers optimized edge caching, full package verification, DualSense hardware diagnostics, and low-latency delivery nodes for console gamers worldwide.
            </p>

            {/* Console platforms supported */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                Supported Gaming Platforms
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-bold text-blue-400 flex items-center gap-1.5">
                  <PlayStationGlyph type="triangle" className="w-3.5 h-3.5" />
                  PS5
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-bold text-blue-300 flex items-center gap-1.5">
                  <PlayStationGlyph type="circle" className="w-3.5 h-3.5" />
                  PS4 Pro
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-bold text-green-400">
                  Xbox Series X|S
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-bold text-red-400">
                  Switch
                </span>
                <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-bold text-purple-400">
                  PC Master Race
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-purple-500 ps-2.5">Catalog & Hubs</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/shop" className="hover:text-purple-400 transition-colors">Games Catalog</Link>
              </li>
              <li>
                <Link href="/subscriptions" className="hover:text-purple-400 transition-colors">Membership Tiers</Link>
              </li>
              <li>
                <Link href="/jailbreak" className="hover:text-purple-400 transition-colors">Jailbreak & Exploits</Link>
              </li>
              <li>
                <Link href="/tools/gamepad" className="hover:text-purple-400 transition-colors">DualSense WebHID Tester</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-purple-400 transition-colors">Engineering & Guides</Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-purple-400 transition-colors">Sign In / Dev Pass</Link>
              </li>
              <li>
                <Link href="/admin" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">Admin Console ↗</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Community & Social */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-orange-500 ps-2.5">Community</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                  Discord Server
                </a>
              </li>
              <li>
                <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                  Reddit Community
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                  X (formerly Twitter)
                </a>
              </li>
              <li>
                <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                  Telegram Announcements
                </a>
              </li>
              <li>
                <Link href="/panel?tab=referral" className="hover:text-orange-400 transition-colors">
                  Branch Ledger Affiliate (21%)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payments & Security */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-orange-500 ps-2.5">Security & Compliance</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Cloudflare Enterprise DDoS Protection</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-300">256-Bit SSL End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-slate-300">ESRB & PEGI Age Compliance Verified</span>
              </div>
            </div>

            {/* Global payment logos */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Accepted Global Methods:</span>
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold text-blue-300">VISA</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold text-orange-300">MasterCard</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold text-sky-400">PayPal</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold text-amber-400">BTC</span>
                <span className="px-2 py-0.5 rounded bg-white/10 font-bold text-emerald-400">USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsible Gaming & Bottom */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} DrGame Technologies Inc. All trademarks and registered assets belong to their respective holders.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono">Global Edge v1.4.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">All Edge Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default IntlFooter;
