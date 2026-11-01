"use client";

import React from "react";
import DepartmentLoginPage from "@/components/admin/DepartmentLoginPage";
import { FileText } from "lucide-react";

export default function ContentLoginPage() {
  return (
    <DepartmentLoginPage
      department="content"
      deptTitleFa="دپارتمان محتوا و وبلاگ"
      deptTitleEn="Content & Catalog Department"
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      accentBtn="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40"
      icon={<FileText className="w-8 h-8 text-emerald-400" />}
    />
  );
}
