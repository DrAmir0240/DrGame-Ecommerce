import React from "react";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07090e] text-slate-100 antialiased">
      {children}
    </div>
  );
}
