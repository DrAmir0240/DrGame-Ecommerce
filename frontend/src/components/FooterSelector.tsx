"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IranFooter } from "./IranFooter";
import { IntlFooter } from "./IntlFooter";
import { useApp } from "@/lib/app";

interface FooterSelectorProps {
  initialVariant?: "iran" | "intl";
}

export const FooterSelector: React.FC<FooterSelectorProps> = ({ initialVariant }) => {
  const searchParams = useSearchParams();
  const { lang } = useApp();
  const [variant, setVariant] = useState<"iran" | "intl">(initialVariant || "iran");

  useEffect(() => {
    const applyVariant = () => {
      const saved = localStorage.getItem("drgame_footer_variant");
      if (saved === "iran" || saved === "intl") {
        setVariant(saved);
        return;
      }
      const q = searchParams.get("footer_variant")?.toLowerCase();
      if (q === "iran" || q === "intl") {
        setVariant(q);
        return;
      }

      // If no explicit param/storage, determine from language
      if (lang === "fa") {
        setVariant("iran");
      } else {
        setVariant("intl");
      }
    };

    applyVariant();

    const handleCustomChange = (e: any) => {
      if (e.detail === "iran" || e.detail === "intl") {
        setVariant(e.detail);
      } else {
        applyVariant();
      }
    };

    window.addEventListener("drgame_footer_change", handleCustomChange);
    return () => window.removeEventListener("drgame_footer_change", handleCustomChange);
  }, [searchParams, lang]);

  return variant === "iran" ? <IranFooter /> : <IntlFooter />;
};

export default FooterSelector;
