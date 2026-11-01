"use client";

import React from "react";
import DepartmentLoginPage from "@/components/admin/DepartmentLoginPage";
import { Share2 } from "lucide-react";

export default function ReferralLoginPage() {
  return (
    <DepartmentLoginPage
      department="referral"
      deptTitleFa="دپارتمان بازاریابی و رفرال"
      deptTitleEn="Referral & Payout Treasury"
      badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/30"
      accentBtn="bg-rose-600 hover:bg-rose-500 shadow-rose-950/40"
      icon={<Share2 className="w-8 h-8 text-rose-400" />}
    />
  );
}
