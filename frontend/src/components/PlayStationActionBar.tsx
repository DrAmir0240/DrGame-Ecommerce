"use client";

import React from "react";
import { PlayStationGlyph } from "./PlayStationGlyph";
import { useApp } from "@/lib/app";

export const PlayStationActionBar: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none py-2 px-6 flex justify-center">
      <div className="rounded-2xl border border-white/15 bg-black/85 backdrop-blur-md px-6 py-2.5 shadow-2xl flex items-center gap-6 text-xs font-bold text-slate-200 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <PlayStationGlyph type="cross" size={16} />
          <span>{t("انتخاب", "Select")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <PlayStationGlyph type="circle" size={16} />
          <span>{t("بازگشت", "Back")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <PlayStationGlyph type="square" size={16} />
          <span>{t("فیلترها / جستجو", "Filters / Search")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <PlayStationGlyph type="triangle" size={16} />
          <span>{t("پیش‌نمایش ویدیو", "Preview")}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <PlayStationGlyph type="l1" size={16} />
          <PlayStationGlyph type="r1" size={16} />
          <span>{t("تغییر تب", "Next / Prev Tab")}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          <PlayStationGlyph type="options" size={16} />
          <span>{t("منو", "Options")}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayStationActionBar;
