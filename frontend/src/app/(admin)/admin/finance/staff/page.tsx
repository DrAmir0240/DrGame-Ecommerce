"use client";

import React from "react";
import DepartmentStaffManager from "@/components/admin/DepartmentStaffManager";

export default function FinanceStaffPage() {
  return (
    <DepartmentStaffManager
      department="finance"
      departmentNameFa="دپارتمان امور مالی و اشتراک"
    />
  );
}
