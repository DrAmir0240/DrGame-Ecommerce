"use client";

import React from "react";
import DepartmentStaffManager from "@/components/admin/DepartmentStaffManager";

export default function ReferralStaffPage() {
  return (
    <DepartmentStaffManager
      department="referral"
      departmentNameFa="دپارتمان بازاریابی و رفرال"
      accentColor="rose"
    />
  );
}
