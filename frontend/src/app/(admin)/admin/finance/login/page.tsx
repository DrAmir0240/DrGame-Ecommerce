"use client";

import React from "react";
import DepartmentLoginPage from "@/components/admin/DepartmentLoginPage";
import { DollarSign } from "lucide-react";

export default function FinanceLoginPage() {
  return (
    <DepartmentLoginPage
      department="finance"
      deptTitleFa="دپارتمان امور مالی و اشتراک"
      deptTitleEn="Finance & Subscription Department"
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/30"
      accentBtn="bg-amber-600 hover:bg-amber-500 shadow-amber-950/40"
      icon={<DollarSign className="w-8 h-8 text-amber-400" />}
    />
  );
}
