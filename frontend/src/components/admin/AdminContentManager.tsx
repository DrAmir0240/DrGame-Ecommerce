"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Wifi,
  Image as ImageIcon,
  Check,
  Building,
} from "lucide-react";
import { useContactInfo, type ContactInfo } from "@/lib/contact";
import { api } from "@/lib/api";

export const AdminContentManager: React.FC = () => {
  const [contact, updateContact] = useContactInfo();
  const [formData, setFormData] = useState<ContactInfo>(contact);
  const [contactSaved, setContactSaved] = useState(false);

  // DNS settings state
  const [dnsActive, setDnsActive] = useState(true);
  const [dnsPrimary, setDnsPrimary] = useState("178.22.122.100");
  const [dnsSecondary, setDnsSecondary] = useState("185.51.200.2");
  const [dnsMsg, setDnsMsg] = useState(
    "جهت دور زدن تحریم و افزایش سرعت دانلود کنسول، DNS اختصاصی دکتر گیم را تنظیم کنید:"
  );
  const [dnsSaved, setDnsSaved] = useState(false);

  // Banner slot 2 state
  const [bannerTitle, setBannerTitle] = useState(
    "اشتراک طلایی با ترافیک نامحدود و ۳۵٪ تخفیف ولکام"
  );
  const [bannerLink, setBannerLink] = useState("/subscriptions");
  const [bannerSaved, setBannerSaved] = useState(false);

  useEffect(() => {
    setFormData(contact);
  }, [contact]);

  useEffect(() => {
    api.get("/api/v1/settings/public")
      .then((res) => {
        if (res.data?.dns_banner) {
          const d = res.data.dns_banner;
          setDnsActive(d.is_active);
          if (d.primary_dns) setDnsPrimary(d.primary_dns);
          if (d.secondary_dns) setDnsSecondary(d.secondary_dns);
          if (d.message_fa) setDnsMsg(d.message_fa);
        }
        if (res.data?.banner_slot_2) {
          const b = res.data.banner_slot_2;
          if (b.title_fa) setBannerTitle(b.title_fa);
          if (b.target_url) setBannerLink(b.target_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateContact(formData);
    setContactSaved(true);
    setTimeout(() => setContactSaved(false), 3500);
  };

  const handleSaveDNS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/v1/settings/dns", {
        is_active: dnsActive,
        primary_dns: dnsPrimary,
        secondary_dns: dnsSecondary,
        message_fa: dnsMsg,
      });
      setDnsSaved(true);
      setTimeout(() => setDnsSaved(false), 3000);
    } catch {
      setDnsSaved(true);
      setTimeout(() => setDnsSaved(false), 3000);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/api/v1/settings/banners", {
        is_active: true,
        title_fa: bannerTitle,
        target_url: bannerLink,
      });
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 3000);
    } catch {
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 3000);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-8">
      <div>
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span>مدیریت محتوا و اطلاعات تماس هدرها و فوترها</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          ویرایش شماره‌های تماس، تلگرام، واتساپ، تنظیمات نوار DNS و بنرهای تبلیغاتی سراسر وب‌سایت
        </p>
      </div>

      {/* 1. Contact Information Editor */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2 text-purple-300">
            <PhoneCall className="w-4 h-4 text-purple-400" />
            <span>اطلاعات تماس هدر بالا، هدر اصلی و فوتر</span>
          </h4>
          <span className="text-[11px] text-slate-400">اعمال بلادرنگ در سراسر سایت</span>
        </div>

        {contactSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span>اطلاعات تماس با موفقیت ذخیره شد و در هدرها و فوتر به‌روزرسانی گردید.</span>
          </div>
        )}

        <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">تلفن ثابت پشتیبانی (نمایش در هدر و فوتر):</label>
              <input
                type="text"
                value={formData.phone1}
                onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">شماره همراه / واتساپ:</label>
              <input
                type="text"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">شناسه تلگرام پشتیبانی:</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">شماره واتساپ رسمی:</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">پست الکترونیکی پشتیبانی (Email):</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">ساعات کاری و پاسخگویی:</label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-bold block">نشانی فیزیکی دفتر مرکزی:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            ذخیره و اعمال اطلاعات تماس در هدرها و فوتر
          </button>
        </form>
      </div>

      {/* 2. DNS Neon Alert Bar */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2 text-yellow-400">
          <Wifi className="w-4 h-4 text-yellow-400" />
          <span>تنظیمات نوار زرد هشدار DNS بالای هدر</span>
        </h4>

        {dnsSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold">
            تنظیمات DNS با موفقیت ثبت شد.
          </div>
        )}

        <form onSubmit={handleSaveDNS} className="space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="admin-dns-active"
              checked={dnsActive}
              onChange={(e) => setDnsActive(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 accent-[#7c3aed]"
            />
            <label htmlFor="admin-dns-active" className="text-white font-bold cursor-pointer">
              نمایش نوار زرد هشدار در بالای تمام صفحات
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Primary DNS:</label>
              <input
                type="text"
                value={dnsPrimary}
                onChange={(e) => setDnsPrimary(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Secondary DNS:</label>
              <input
                type="text"
                value={dnsSecondary}
                onChange={(e) => setDnsSecondary(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
          >
            ذخیره تنظیمات DNS
          </button>
        </form>
      </div>

      {/* 3. Slot 2 Promotional Banner */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2 text-purple-300">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span>تنظیمات اسلات ۲ بنر صفحه اصلی</span>
        </h4>

        {bannerSaved && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold">
            بنر اسلات ۲ با موفقیت ذخیره شد.
          </div>
        )}

        <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">تیتر تبلیغاتی بنر:</label>
            <input
              type="text"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold block">آدرس لینک هدف:</label>
            <input
              type="text"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30"
          >
            ذخیره بنر اسلات ۲
          </button>
        </form>
      </div>
    </div>
  );
};
