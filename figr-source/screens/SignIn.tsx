import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, Gamepad2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Shell";
import { Button, ShapePattern } from "../components/ui";
import { useApp } from "../lib/app";
import { GAMES } from "../lib/data";

const INPUT =
  "h-12 w-full rounded-xl border border-line-strong bg-surface-2 text-sm text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none";

function Field({
  icon,
  children,
  end,
}: {
  icon: ReactNode;
  children: ReactNode;
  end?: ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-fg-2">{icon}</span>
      {children}
      {end}
    </div>
  );
}

export default function SignIn() {
  const { t, setLang, lang } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const toHome = () => navigate("/");
  const bg = GAMES[1];

  const consent = [
    t("فهرست بازی‌های خریداری‌شده (فقط خواندن)", "Your purchased games list (read-only)"),
    t("افزودن به صف دانلود کنسول", "Adding to your console download queue"),
    t("نام کاربری و آواتار PSN", "Your PSN username and avatar"),
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <img src={bg.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-linear-to-b from-bg/60 via-bg/85 to-bg" />
      <ShapePattern />

      <div className="relative flex h-16 items-center justify-between px-6">
        <Logo />
        <button
          onClick={() => setLang(lang === "fa" ? "en" : "fa")}
          className="h-10 rounded-full px-3 text-sm font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg"
        >
          {lang === "fa" ? "English" : "فارسی"}
        </button>
      </div>

      <main className="relative flex justify-center px-6 pb-16 pt-10">
        <div className="flex w-[440px] flex-col gap-6 rounded-panel border border-line-strong bg-surface p-7 shadow-card">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-line">
            {(
              [
                ["in", "ورود", "Sign in"],
                ["up", "ثبت‌نام", "Sign up"],
              ] as const
            ).map(([key, fa, en]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`-mb-px h-11 border-b-2 text-sm font-bold ${
                  tab === key ? "border-accent-2 text-fg" : "border-transparent text-fg-2 hover:text-fg"
                }`}
              >
                {t(fa, en)}
              </button>
            ))}
          </div>

          {/* PSN primary */}
          <div className="flex flex-col gap-4">
            <Button variant="psn" size="lg" className="w-full" onClick={toHome}>
              <Gamepad2 size={20} />
              {t("ورود با PlayStation Network", "Sign in with PlayStation Network")}
            </Button>

            <div className="rounded-xl bg-surface-2 p-4">
              <p className="mb-3 text-sm font-semibold">
                {t("Nebula به این موارد دسترسی می‌گیرد", "Nebula will get access to")}
              </p>
              <ul className="flex flex-col gap-2">
                {consent.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-fg-2">
                    <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2.5 border-t border-line pt-3 text-xs text-fg-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-psn" />
                <span>{t("به رمز عبور PSN و اطلاعات پرداخت شما دسترسی نداریم.", "We don't have access to your PSN password or payment details.")}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line-strong" />
            {t("یا با ایمیل", "or with email")}
            <span className="h-px flex-1 bg-line-strong" />
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              toHome();
            }}
          >
            {tab === "up" && (
              <Field icon={<User size={17} />}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("نام نمایشی", "Display name")}
                  className={`${INPUT} ps-11 pe-4`}
                />
              </Field>
            )}
            <Field icon={<Mail size={17} />}>
              <input
                type="text"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("ایمیل یا نام کاربری", "Email or username")}
                className={`${INPUT} font-latin ps-11 pe-4`}
              />
            </Field>
            <Field
              icon={<Lock size={17} />}
              end={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t("پنهان کردن رمز", "Hide password") : t("نمایش رمز", "Show password")}
                  className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-fg-2 hover:text-fg"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            >
              <input
                type={showPw ? "text" : "password"}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("رمز عبور", "Password")}
                className={`${INPUT} font-latin ps-11 pe-12`}
              />
            </Field>

            {tab === "in" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-fg-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 accent-accent-2"
                  />
                  {t("مرا به خاطر بسپار", "Remember me")}
                </label>
                <button type="button" className="font-medium text-accent-2 hover:underline">
                  {t("فراموشی رمز عبور؟", "Forgot password?")}
                </button>
              </div>
            )}

            <Button variant="primary" size="lg" type="submit" className="w-full">
              {tab === "in" ? t("ورود به حساب کاربری", "Sign in to your account") : t("ساخت حساب", "Create account")}
            </Button>
          </form>
        </div>
      </main>

      <p className="relative pb-8 text-center text-xs text-muted">
        {t("برای دانلود، اتصال حساب PSN الزامی است.", "A linked PSN account is required to download.")}
      </p>
    </div>
  );
}
