"use client";

import React, { Suspense } from "react";
import { FooterSelector } from "./FooterSelector";
import { IranFooter } from "./IranFooter";

export const Footer: React.FC = () => {
  return (
    <Suspense fallback={<IranFooter />}>
      <FooterSelector />
    </Suspense>
  );
};

export default Footer;
