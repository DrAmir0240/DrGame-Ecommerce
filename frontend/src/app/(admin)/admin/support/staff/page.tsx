"use client";

import React from "react";
import DepartmentStaffManager from "@/components/admin/DepartmentStaffManager";

export default function SupportStaffPage() {
  return (
    <DepartmentStaffManager
      department="support"
      departmentNameFa="دپارتمان پشتیبانی و کاربران"
    />
  );
}
