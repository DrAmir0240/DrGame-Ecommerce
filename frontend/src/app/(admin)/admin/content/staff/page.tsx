"use client";

import React from "react";
import DepartmentStaffManager from "@/components/admin/DepartmentStaffManager";

export default function ContentStaffPage() {
  return (
    <DepartmentStaffManager
      department="content"
      departmentNameFa="دپارتمان محتوا و کاتالوگ"
    />
  );
}
