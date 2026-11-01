'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Phone,
  Mail,
  MapPin,
  Send,
  Instagram,
  Youtube,
  Shield,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { SiteSettings, FaqItem } from '@/types/settings';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

export default function AdminSettingsPage() {
  const { setSettings: updateLocalStore } = useSiteSettingsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [primaryDns, setPrimaryDns] = useState('');
  const [secondaryDns, setSecondaryDns] = useState('');
  const [jailbreakDns, setJailbreakDns] = useState('');
  const [serverIsOnline, setServerIsOnline] = useState(true);
  const [serverStatusText, setServerStatusText] = useState('');

  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [supportHours, setSupportHours] = useState('');

  const [footerMessage, setFooterMessage] = useState('');
  const [enamadUrl, setEnamadUrl] = useState('');
  const [samandehiUrl, setSamandehiUrl] = useState('');

  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');

  const [firmwares, setFirmwares] = useState<string[]>(['9.00', '9.60', '10.01', '11.00']);
  const [newFirmware, setNewFirmware] = useState('');

  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);

  const loadSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let data: SiteSettings;
      try {
        data = await apiRequest<SiteSettings>('/settings');
      } catch {
        data = await apiRequest<SiteSettings>('/site-settings');
      }

      setPrimaryDns(data.header_dns_primary || data.primary_dns || '165.227.83.145');
      setSecondaryDns(data.header_dns_secondary || data.secondary_dns || '192.241.221.79');
      setJailbreakDns(data.jailbreak_dns || data.header_dns_primary || '165.227.83.145');
      setServerIsOnline(data.server_is_online ?? true);
      setServerStatusText(data.server_status_text || 'سرورهای دانلود و اتصال کنسول آنلاین است');

      setContactPhone(data.contact_phone || '۰۲۱-۹۱۰۱۰۰۰۰');
      setContactEmail(data.contact_email || 'support@drgame.ir');
      setContactAddress(data.contact_address || 'تهران، خیابان ولیعصر، برج فناوری دکتر گیم');
      setSupportHours(data.support_working_hours || 'پشتیبانی ۲۴ ساعته در ۷ روز هفته');

      setFooterMessage(data.footer_message || 'دکتر گیم؛ مرجع تخصصی دیتای بازی‌های کنسولی و خدمات نوین گیمینگ در ایران.');
      setEnamadUrl(data.enamad_url || 'https://enamad.ir');
      setSamandehiUrl(data.samandehi_url || 'https://samandehi.ir');

      setSocialTelegram(data.social_telegram || data.telegram_url || 'https://t.me/DrGame_ir');
      setSocialInstagram(data.social_instagram || data.instagram_url || 'https://instagram.com/DrGame_ir');
      setSocialYoutube(data.social_youtube || data.youtube_url || 'https://youtube.com/@DrGame_ir');

      const fws = data.jailbreak_supported_firmwares || data.jailbreak_config?.supported_firmwares;
      if (Array.isArray(fws) && fws.length > 0) {
        setFirmwares(fws);
      }

      if (Array.isArray(data.faq_items)) {
        setFaqItems(data.faq_items);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در دریافت تنظیمات سایت از سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleAddFirmware = () => {
    if (!newFirmware.trim()) return;
    if (!firmwares.includes(newFirmware.trim())) {
      setFirmwares([...firmwares, newFirmware.trim()]);
    }
    setNewFirmware('');
  };

  const handleRemoveFirmware = (fw: string) => {
    setFirmwares(firmwares.filter((f) => f !== fw));
  };

  const handleAddFaq = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqItems];
    updated[index][field] = value;
    setFaqItems(updated);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      header_dns_primary: primaryDns.trim(),
      header_dns_secondary: secondaryDns.trim(),
      primary_dns: primaryDns.trim(),
      secondary_dns: secondaryDns.trim(),
      jailbreak_dns: jailbreakDns.trim(),
      server_is_online: serverIsOnline,
      server_status_text: serverStatusText.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      contact_address: contactAddress.trim(),
      support_working_hours: supportHours.trim(),
      footer_message: footerMessage.trim(),
      enamad_url: enamadUrl.trim(),
      samandehi_url: samandehiUrl.trim(),
      social_telegram: socialTelegram.trim(),
      telegram_url: socialTelegram.trim(),
      social_instagram: socialInstagram.trim(),
      instagram_url: socialInstagram.trim(),
      social_youtube: socialYoutube.trim(),
      youtube_url: socialYoutube.trim(),
      jailbreak_supported_firmwares: firmwares,
      jailbreak_config: {
        supported_firmwares: firmwares,
        dns_servers: [primaryDns.trim(), secondaryDns.trim()],
      },
      faq_items: faqItems.filter((f) => f.question.trim() && f.answer.trim()),
    };

    try {
      const res = await apiRequest<SiteSettings>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      updateLocalStore(res);
      setSuccessMsg('تنظیمات سایت با موفقیت در پایگاه داده و کش ردیس ذخیره شد.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره‌سازی تنظیمات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-vazir pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-cosmic-purple" />
            <span>تنظیمات عمومی سایت و هسته پلتفرم</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            مدیریت سرخط DNSهای کنسول، اطلاعات تماس فوتر، فریمورهای جیلبریک و سوالات متداول
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-text-muted text-sm">
          در حال بارگذاری تنظیمات از سرور...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: DNS & Server Status */}
          <div className="rounded-3xl glass-card border border-white/10 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>پیکربندی DNS اختصاصی کنسول و وضعیت سرور</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                  دی‌ان‌اس اصلی (Primary DNS)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={primaryDns}
                  onChange={(e) => setPrimaryDns(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-nebula-violet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                  دی‌ان‌اس کمکی (Secondary DNS)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={secondaryDns}
                  onChange={(e) => setSecondaryDns(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-nebula-violet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                  دی‌ان‌اس ابزار جیلبریک (Jailbreak DNS)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={jailbreakDns}
                  onChange={(e) => setJailbreakDns(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-nebula-violet"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">
                  پیام نوار وضعیت سرورها
                </label>
                <input
                  type="text"
                  value={serverStatusText}
                  onChange={(e) => setServerStatusText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="serverStatus"
                  checked={serverIsOnline}
                  onChange={(e) => setServerIsOnline(e.target.checked)}
                  className="w-4 h-4 rounded text-cosmic-purple focus:ring-0 bg-[#0d121f] border-white/20"
                />
                <label htmlFor="serverStatus" className="text-xs text-white font-bold cursor-pointer">
                  وضعیت سرور آنلاین و فعال است
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="rounded-3xl glass-card border border-white/10 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>اطلاعات تماس، پشتیبانی و آدرس</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">تلفن پشتیبانی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">ایمیل پشتیبانی</label>
                <input
                  type="email"
                  dir="ltr"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">ساعات کاری پشتیبانی</label>
                <input
                  type="text"
                  value={supportHours}
                  onChange={(e) => setSupportHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">آدرس فیزیکی دفتر</label>
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social & Trust Links */}
          <div className="rounded-3xl glass-card border border-white/10 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Send className="w-5 h-5 text-pink-400" />
              <span>شبکه‌های اجتماعی، نمادها و پیام فوتر</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">کانال تلگرام</label>
                <input
                  type="text"
                  dir="ltr"
                  value={socialTelegram}
                  onChange={(e) => setSocialTelegram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">پیج اینستاگرام</label>
                <input
                  type="text"
                  dir="ltr"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">کانال یوتیوب</label>
                <input
                  type="text"
                  dir="ltr"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">لینک اینماد (Enamad)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={enamadUrl}
                  onChange={(e) => setEnamadUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">لینک ساماندهی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={samandehiUrl}
                  onChange={(e) => setSamandehiUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5 font-medium">متن پیام فوتر</label>
                <input
                  type="text"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Jailbreak Supported Firmwares */}
          <div className="rounded-3xl glass-card border border-white/10 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>فریمورهای پشتیبانی‌شده جیلبریک</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {firmwares.map((fw) => (
                <span
                  key={fw}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold"
                >
                  <span>FW {fw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFirmware(fw)}
                    className="hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                dir="ltr"
                placeholder="مثلاً 10.00"
                value={newFirmware}
                onChange={(e) => setNewFirmware(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-nebula-violet"
              />
              <button
                type="button"
                onClick={handleAddFirmware}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold whitespace-nowrap hover:bg-cyan-500/30 cursor-pointer"
              >
                افزودن
              </button>
            </div>
          </div>

          {/* Section 5: FAQs Manager */}
          <div className="rounded-3xl glass-card border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>مدیریت سوالات متداول (FAQ Items)</span>
              </h2>

              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سوال جدید</span>
              </button>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cosmic-purple">سوال {idx + 1}:</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-text-muted hover:text-rose-400 text-xs p-1 cursor-pointer transition-colors"
                      title="حذف این سوال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                    placeholder="متن سوال..."
                    className="w-full px-4 py-2 rounded-xl bg-[#0d121f] border border-white/15 text-white text-xs font-bold focus:outline-none focus:border-nebula-violet"
                    required
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                    placeholder="پاسخ کامل سوال..."
                    className="w-full px-4 py-2 rounded-xl bg-[#0d121f] border border-white/15 text-white text-xs leading-relaxed focus:outline-none focus:border-nebula-violet"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-cosmic-gradient hover:opacity-95 text-white font-bold text-sm shadow-neon-purple transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره و اعمال سراسری تنظیمات'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

