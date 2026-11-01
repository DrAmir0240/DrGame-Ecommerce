"use client";

import React from "react";
import DepartmentLoginPage from "@/components/admin/DepartmentLoginPage";
import { Headphones } from "lucide-react";

export default function SupportLoginPage() {
  return (
    <DepartmentLoginPage
      department="support"
      deptTitleFa="دپارتمان پشتیبانی و کاربران"
      deptTitleEn="Customer Support & User Care"
      badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/30"
      accentBtn="bg-blue-600 hover:bg-blue-500 shadow-blue-950/40"
      icon={<Headphones className="w-8 h-8 text-blue-400" />}
    />
  );
}
