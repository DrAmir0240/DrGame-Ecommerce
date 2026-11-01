import React from "react";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 antialiased">
      {children}
    </div>
  );
}
