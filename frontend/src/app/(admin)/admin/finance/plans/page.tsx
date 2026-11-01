"use client";

import React, { useEffect, useState } from "react";
import { Layers, Plus, Edit } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function FinancePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, planList] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-finance/auth/me"),
        apiRequest<any[]>("/admin-finance/plans"),
      ]);
      setCurrentUser(profile);
      setPlans(planList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت پلن‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            پلن‌های اشتراک پلتفرم
          </h1>
          <p className="text-xs text-slate-400 mt-1">تعیین تعرفه، سهمیه دانلود ماهیانه و محدودیت‌های سرعت هر اشتراک</p>
        </div>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): شما صرفاً اجازه مشاهده تنظیمات پلن‌ها را دارید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500">در حال دریافت...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500">هیچ پلنی یافت نشد.</div>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-800 bg-[#0c1017] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {p.code}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {p.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{p.name_fa}</h3>
                <div className="text-lg font-mono font-extrabold text-amber-400 mt-1">
                  {(p.price_toman || 0).toLocaleString()} تومان
                </div>
              </div>
              <div className="text-xs text-slate-400 space-y-1.5 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>سهمیه دانلود:</span>
                  <span className="font-mono text-white">{p.quota_gb || 0} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>سقف سرعت:</span>
                  <span className="font-mono text-white">{p.speed_limit_mbps || 0} Mbps</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
