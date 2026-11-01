"use client";

import React from "react";
import DepartmentLoginPage from "@/components/admin/DepartmentLoginPage";
import { BarChart3 } from "lucide-react";

export default function ReportLoginPage() {
  return (
    <DepartmentLoginPage
      department="report"
      deptTitleFa="دپارتمان گزارش‌گیری و نظارت"
      deptTitleEn="Analytics & Security Audit"
      badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/30"
      accentBtn="bg-purple-600 hover:bg-purple-500 shadow-purple-950/40"
      icon={<BarChart3 className="w-8 h-8 text-purple-400" />}
    />
  );
}
