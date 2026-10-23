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
    const q = searchParams.get("footer_variant")?.toLowerCase();
    if (q === "iran" || q === "intl") {
      setVariant(q);
      return;
    }

    // If no explicit query param, determine from language
    if (lang === "fa" || lang === "ar") {
      setVariant("iran");
    } else {
      setVariant("intl");
    }
  }, [searchParams, lang]);

  return variant === "iran" ? <IranFooter /> : <IntlFooter />;
};

export default FooterSelector;
