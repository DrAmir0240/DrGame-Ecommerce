"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, CreditCard, User, Newspaper } from "lucide-react";
import { useLangStore } from "@/stores/langStore";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { lang } = useLangStore();

  const items = [
    { href: "/", label: lang === "fa" ? "خانه" : "Home", icon: Home },
    { href: "/games", label: lang === "fa" ? "بازی‌ها" : "Games", icon: Gamepad2 },
    { href: "/subscriptions", label: lang === "fa" ? "اشتراک" : "Plans", icon: CreditCard },
    { href: "/news", label: lang === "fa" ? "اخبار" : "News", icon: Newspaper },
    { href: "/profile", label: lang === "fa" ? "پروفایل" : "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-panel border-t border-white/10 px-2 py-1.5 backdrop-blur-xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-nav-item="true"
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-cosmic-light scale-105 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
