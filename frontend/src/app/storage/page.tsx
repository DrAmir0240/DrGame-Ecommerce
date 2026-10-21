"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HardDrive,
  Usb,
  Cpu,
  ShieldCheck,
  ArrowLeftRight,
  Trash2,
  Play,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderSync,
  Layers,
  Sparkles,
  Info,
  Server,
  FileCode,
  DownloadCloud,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, PlatformBadge, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { STORAGE_DEVICES, STORAGE_FILES, StorageDevice, StorageFile, game } from "@/lib/data";

export default function StoragePage() {
  const { t, n } = useApp();

  // Local state for files (so moves and integrity checks can be simulated interactively)
  const [files, setFiles] = useState<StorageFile[]>(STORAGE_FILES);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Compute live device stats based on file allocations
  const devices = useMemo(() => {
    return STORAGE_DEVICES.map((dev) => {
      const devFiles = files.filter((f) => f.locationId === dev.id);
      const used = devFiles.reduce((acc, f) => acc + f.sizeGb, 0);
      return {
        ...dev,
        liveUsedGb: Number(used.toFixed(1)),
        liveFreeGb: Number(Math.max(0, dev.totalGb - used).toFixed(1)),
      };
    });
  }, [files]);

  // Filtered file list
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchDevice = selectedDevice === "all" || f.locationId === selectedDevice;
      const matchType = selectedType === "all" || f.type === selectedType;
      const matchSearch =
        searchQuery.trim() === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.gameTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDevice && matchType && matchSearch;
    });
  }, [files, selectedDevice, selectedType, searchQuery]);

  // Move a file to another storage location
  const handleMoveFile = (fileId: string, targetLocationId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return { ...f, locationId: targetLocationId };
        }
        return f;
      })
    );
    const targetDev = STORAGE_DEVICES.find((d) => d.id === targetLocationId);
    setAlertMessage(
      t(
        `فایل با موفقیت به «${targetDev?.nameFa}» منتقل شد.`,
        `File successfully moved to "${targetDev?.nameEn}".`
      )
    );
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Run integrity verification
  const handleVerifyIntegrity = (fileId?: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      if (fileId) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, integrity: "verified" } : f))
        );
      } else {
        setFiles((prev) => prev.map((f) => ({ ...f, integrity: "verified" })));
      }
      setIsVerifying(false);
      setAlertMessage(
        t(
          "اعتبارسنجی هش SHA256 تمام فایل‌ها با سرور مرکزی CDN با موفقیت تایید شد.",
          "SHA-256 hash integrity check verified successfully against CDN edge."
        )
      );
      setTimeout(() => setAlertMessage(null), 4500);
    }, 900);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map((f) => f.id));
    }
  };

  // Delete selected files
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setFiles((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
    setSelectedIds([]);
    setAlertMessage(
      t("فایل‌های انتخاب‌شده از حافظه حذف شدند.", "Selected files were removed from storage.")
    );
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const getDeviceIcon = (type: StorageDevice["type"]) => {
    switch (type) {
      case "internal":
        return <Cpu className="text-psn" size={24} />;
      case "m2":
        return <HardDrive className="text-accent-2" size={24} />;
      case "external":
        return <Usb className="text-warning" size={24} />;
    }
  };

  const getTypeBadge = (type: StorageFile["type"]) => {
    switch (type) {
      case "game_pkg":
        return <Pill tone="psn">{t("دیتای کامل بازی", "Base Game")}</Pill>;
      case "patch":
        return <Pill tone="accent">{t("آپدیت / پچ", "Update Patch")}</Pill>;
      case "subtitle":
        return <Pill tone="success">{t("زیرنویس فارسی", "Persian Sub")}</Pill>;
      case "dlc":
        return <Pill tone="warning">{t("بسته الحاقی DLC", "DLC Addon")}</Pill>;
    }
  };

  const getLocationBadge = (locationId: string) => {
    const dev = STORAGE_DEVICES.find((d) => d.id === locationId);
    if (!dev) return null;
    const tone =
      dev.type === "internal" ? "psn" : dev.type === "m2" ? "accent" : "warning";
    return (
      <Pill tone={tone}>
        {dev.type === "internal" ? (
          <Cpu size={12} className="inline me-1" />
        ) : dev.type === "m2" ? (
          <HardDrive size={12} className="inline me-1" />
        ) : (
          <Usb size={12} className="inline me-1" />
        )}
        {t(dev.nameFa.split("(")[0].trim(), dev.nameEn.split("(")[0].trim())}
      </Pill>
    );
  };

  return (
    <Page>
      {/* Toast Notification */}
      {alertMessage && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-xl border border-accent/40 bg-surface-2/95 px-5 py-3.5 text-sm font-semibold text-fg shadow-glow backdrop-blur-md transition-all">
          <CheckCircle2 size={18} className="text-success" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
        <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-psn/15 text-psn">
                <FolderSync size={20} />
              </span>
              <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                PlayStation Storage & File Hub
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
              {t("مدیریت حافظه و فایل‌های کنسول", "Console Storage & File Manager")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
              {t(
                "مشاهده لحظه‌ای وضعیت حافظه داخلی، SSD فوق‌سریع و هارد اکسترنال USB. مدیریت دیتای بازی‌ها (PKG)، انتقال بین حافظه‌ها و تست سلامت با شبکه لبه CDN دکتر گیم.",
                "Real-time overview of internal SSD, M.2 expansion and USB extended storage. Manage game packages (PKG), cross-storage transfers, and verify edge integrity."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              disabled={isVerifying}
              onClick={() => handleVerifyIntegrity()}
            >
              <RefreshCw size={16} className={isVerifying ? "animate-spin" : ""} />
              {isVerifying
                ? t("در حال بررسی هش...", "Verifying Hashes...")
                : t("بررسی یکپارچگی فایل‌ها", "Verify Integrity")}
            </Button>
            <Button variant="primary" size="md" to="/games">
              <DownloadCloud size={16} />
              {t("دانلود بازی جدید", "Get New Games")}
            </Button>
          </div>
        </div>
      </section>

      {/* Storage Devices Grid */}
      <section className="mt-6">
        <SectionTitle
          action={
            <div className="flex items-center gap-2 text-xs font-semibold text-fg-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              {t("تمام حافظه‌ها آماده و متصل", "All storages online & mounted")}
            </div>
          }
        >
          {t("حافظه‌های ذخیره‌سازی کنسول", "Console Storage Drives")}
        </SectionTitle>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {devices.map((d) => {
            const usagePercent = Math.min(100, Math.round((d.liveUsedGb / d.totalGb) * 100));
            const isFull = usagePercent > 90;
            return (
              <Card
                key={d.id}
                className={`relative overflow-hidden p-5 transition-all duration-200 hover:border-line-strong ${
                  selectedDevice === d.id ? "ring-2 ring-accent-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-surface-2 border border-line">
                      {getDeviceIcon(d.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-fg text-sm">{t(d.nameFa, d.nameEn)}</h3>
                      <p className="font-latin text-xs text-muted mt-0.5">{d.filesystem}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isFull
                        ? "bg-danger-soft text-danger"
                        : "bg-success-soft text-success"
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {t("سالم", "Healthy")}
                  </span>
                </div>

                {/* Meter */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-fg-2">{t("فضای اشغال‌شده", "Space Used")}</span>
                    <span dir="ltr" className="font-latin font-bold text-fg">
                      {n(d.liveUsedGb)} / {n(d.totalGb)} GB ({n(usagePercent)}%)
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? "bg-danger"
                          : d.type === "internal"
                          ? "bg-psn"
                          : d.type === "m2"
                          ? "bg-accent-2"
                          : "bg-warning"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-fg-2">
                    <span>{t("فضای خالی:", "Free space:")}</span>
                    <span dir="ltr" className="font-latin font-bold text-success">
                      {n(d.liveFreeGb)} GB
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDevice(selectedDevice === d.id ? "all" : d.id)}
                    className="font-semibold text-accent-2 hover:underline cursor-pointer"
                  >
                    {selectedDevice === d.id
                      ? t("نمایش همه", "Show All")
                      : t("فیلتر این حافظه", "Filter Drive")}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* File Manager Section */}
      <section className="mt-8">
        <SectionTitle
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fg-2">
                {t(`مجموع ${n(filteredFiles.length)} فایل`, `Total ${n(filteredFiles.length)} files`)}
              </span>
            </div>
          }
        >
          {t("مدیریت و سازماندهی فایل‌های بازی (PKG Manager)", "Game Files & Package Explorer")}
        </SectionTitle>

        {/* Filter & Action Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Device */}
            <div className="flex items-center rounded-lg border border-line bg-surface-2 p-1 text-xs font-semibold">
              <button
                onClick={() => setSelectedDevice("all")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  selectedDevice === "all" ? "bg-accent-2 text-white shadow-xs" : "text-fg-2 hover:text-fg"
                }`}
              >
                {t("همه حافظه‌ها", "All Drives")}
              </button>
              <button
                onClick={() => setSelectedDevice("internal")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  selectedDevice === "internal" ? "bg-accent-2 text-white shadow-xs" : "text-fg-2 hover:text-fg"
                }`}
              >
                {t("حافظه داخلی", "Internal SSD")}
              </button>
              <button
                onClick={() => setSelectedDevice("m2")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  selectedDevice === "m2" ? "bg-accent-2 text-white shadow-xs" : "text-fg-2 hover:text-fg"
                }`}
              >
                {t("اسلات M.2", "M.2 NVMe")}
              </button>
              <button
                onClick={() => setSelectedDevice("external")}
                className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
                  selectedDevice === "external" ? "bg-accent-2 text-white shadow-xs" : "text-fg-2 hover:text-fg"
                }`}
              >
                {t("هارد اکسترنال", "USB Extended")}
              </button>
            </div>

            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 rounded-lg border border-line bg-surface-2 px-3 text-xs font-semibold text-fg outline-none focus:border-accent-2"
            >
              <option value="all">{t("همه دسته‌بندی‌ها", "All Types")}</option>
              <option value="game_pkg">{t("دیتای بازی (Game PKG)", "Game PKG")}</option>
              <option value="patch">{t("آپدیت / پچ", "Update Patch")}</option>
              <option value="subtitle">{t("زیرنویس فارسی", "Persian Subtitle")}</option>
              <option value="dlc">{t("بسته‌های الحاقی (DLC)", "DLC")}</option>
            </select>
          </div>

          {/* Search Box & Batch Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search
                size={16}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder={t("جستجوی فایل یا نام بازی...", "Search file or game...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-line bg-surface-2 ps-9 pe-3 text-xs font-medium text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none"
              />
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="text-danger hover:border-danger hover:bg-danger-soft"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={14} />
                {t(`حذف (${n(selectedIds.length)})`, `Delete (${n(selectedIds.length)})`)}
              </Button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-fg-2">
                <th className="p-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredFiles.length > 0 && selectedIds.length === filteredFiles.length
                    }
                    onChange={selectAll}
                    className="size-4 rounded border-line accent-accent-2 cursor-pointer"
                  />
                </th>
                <th className="p-3.5 text-start font-bold">{t("فایل و عنوان بازی", "File & Game")}</th>
                <th className="p-3.5 text-start font-bold">{t("نوع پکیج", "Package Type")}</th>
                <th className="p-3.5 text-start font-bold">{t("پلتفرم", "Platform")}</th>
                <th className="p-3.5 text-start font-bold">{t("نسخه", "Version")}</th>
                <th className="p-3.5 text-start font-bold">{t("حجم", "Size")}</th>
                <th className="p-3.5 text-start font-bold">{t("محل ذخیره فعلی", "Current Storage")}</th>
                <th className="p-3.5 text-start font-bold">{t("وضعیت هش", "Integrity")}</th>
                <th className="p-3.5 text-center font-bold">{t("عملیات انتقال و مدیریت", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-fg-2">
                    <FileCode size={36} className="mx-auto text-muted mb-2 opacity-50" />
                    <p className="font-semibold text-sm">
                      {t("هیچ فایلی با این مشخصات یافت نشد.", "No files matching your filter.")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const g = game(file.gameSlug);
                  const isChecked = selectedIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      className={`transition-colors hover:bg-surface-2/40 ${
                        isChecked ? "bg-accent-soft/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(file.id)}
                          className="size-4 rounded border-line accent-accent-2 cursor-pointer"
                        />
                      </td>

                      {/* File & Game Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={g.image}
                            alt={file.gameTitle}
                            className="size-10 rounded-lg object-cover ring-1 ring-line shrink-0"
                          />
                          <div>
                            <Link
                              href={`/games/${file.gameSlug}`}
                              className="font-bold text-fg hover:text-accent-2 hover:underline"
                            >
                              {file.gameTitle}
                            </Link>
                            <div
                              dir="ltr"
                              className="font-mono text-[11px] text-muted truncate max-w-xs block"
                            >
                              {file.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3.5">{getTypeBadge(file.type)}</td>

                      {/* Platform */}
                      <td className="p-3.5">
                        <PlatformBadge p={file.platform} solid={file.platform === "PS5"} />
                      </td>

                      {/* Version */}
                      <td className="p-3.5">
                        <span dir="ltr" className="font-mono font-medium text-fg-2">
                          {file.version}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="p-3.5">
                        <span dir="ltr" className="font-latin font-bold text-fg">
                          {n(file.sizeGb)} GB
                        </span>
                      </td>

                      {/* Current Storage */}
                      <td className="p-3.5">{getLocationBadge(file.locationId)}</td>

                      {/* Integrity */}
                      <td className="p-3.5">
                        {file.integrity === "verified" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-success">
                            <ShieldCheck size={14} />
                            {t("تایید شده", "Verified")}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyIntegrity(file.id)}
                            className="inline-flex items-center gap-1 font-semibold text-warning hover:underline cursor-pointer"
                          >
                            <AlertCircle size={14} />
                            {t("بررسی هش", "Check Hash")}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Move Menu / Button */}
                          {file.locationId !== "internal" && (
                            <button
                              onClick={() => handleMoveFile(file.id, "internal")}
                              title={t("انتقال به حافظه داخلی SSD", "Move to Internal SSD")}
                              className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-psn hover:border-psn transition-colors cursor-pointer"
                            >
                              <Cpu size={14} />
                            </button>
                          )}
                          {file.locationId !== "m2" && (
                            <button
                              onClick={() => handleMoveFile(file.id, "m2")}
                              title={t("انتقال به حافظه M.2 NVMe", "Move to M.2 NVMe")}
                              className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-accent-2 hover:border-accent-2 transition-colors cursor-pointer"
                            >
                              <HardDrive size={14} />
                            </button>
                          )}
                          {file.locationId !== "external" && (
                            <button
                              onClick={() => handleMoveFile(file.id, "external")}
                              title={t("انتقال به هارد اکسترنال USB", "Move to External USB")}
                              className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-warning hover:border-warning transition-colors cursor-pointer"
                            >
                              <Usb size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setFiles((prev) => prev.filter((f) => f.id !== file.id));
                              setAlertMessage(t("فایل با موفقیت حذف شد.", "File deleted successfully."));
                              setTimeout(() => setAlertMessage(null), 3000);
                            }}
                            title={t("حذف فایل", "Delete File")}
                            className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-danger hover:border-danger transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guide Info Box */}
      <section className="mt-8 rounded-card border border-line bg-surface-2/40 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-2">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-fg text-sm">
              {t("راهنمای مدیریت دیتای بازی‌های کنسول PS5", "PS5 Storage Management Guide")}
            </h4>
            <ul className="mt-2 flex flex-col gap-1.5 text-xs text-fg-2 leading-relaxed">
              <li>
                •{" "}
                {t(
                  "بازی‌های اختصاصی پلی‌استیشن ۵ حتماً باید بر روی حافظه داخلی (Internal SSD) یا حافظه M.2 پرسرعت نصب شوند تا بتوانید آن‌ها را اجرا کنید.",
                  "PS5 native games require Internal SSD or certified M.2 NVMe for active gameplay."
                )}
              </li>
              <li>
                •{" "}
                {t(
                  "هارد دیسک اکسترنال USB برای آرشیو دیتای بازی‌های PS5 و اجرای مستقیم بازی‌های نسل قبل (PS4) ایده‌آل است.",
                  "USB Extended Storage is ideal for archiving PS5 PKGs and directly playing PS4 backward-compatible titles."
                )}
              </li>
              <li>
                •{" "}
                {t(
                  "تمامی پکیج‌ها قبل از ارسال، با هش اختصاصی نود تهران ۱ دکتر گیم اعتبارسنجی می‌شوند تا خطای دیتای خراب در کنسول ایجاد نشود.",
                  "All packages are verified against DrGame Tehran-1 Edge hash signatures to prevent corrupted data errors on console."
                )}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Page>
  );
}
