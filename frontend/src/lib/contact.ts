"use client";

import { useState, useEffect } from "react";

export interface ContactInfo {
  phone1: string;
  phone2: string;
  telegram: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  phone1: "۰۲۱-۸۸۸۸۹۹۹۹",
  phone2: "۰۹۱۲۳۴۵۶۷۸۹",
  telegram: "@DrGame_Support",
  whatsapp: "+989123456789",
  email: "support@drgame.ir",
  address: "تهران، خیابان مطهری، تقاطع میرزای شیرازی، ساختمان فناوری",
  workingHours: "شنبه تا پنجشنبه ۹ الی ۲۱",
};

const STORAGE_KEY = "drgame_contact_info";

export function getContactInfo(): ContactInfo {
  if (typeof window === "undefined") return DEFAULT_CONTACT_INFO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACT_INFO;
    return { ...DEFAULT_CONTACT_INFO, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONTACT_INFO;
  }
}

export function saveContactInfo(info: ContactInfo): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    window.dispatchEvent(new Event("drgame_contact_change"));
  } catch (e) {
    console.error("Failed to save contact info", e);
  }
}

export function useContactInfo(): [ContactInfo, (newInfo: ContactInfo) => void] {
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT_INFO);

  useEffect(() => {
    setContact(getContactInfo());
    const handleUpdate = () => {
      setContact(getContactInfo());
    };
    window.addEventListener("drgame_contact_change", handleUpdate);
    return () => window.removeEventListener("drgame_contact_change", handleUpdate);
  }, []);

  const update = (newInfo: ContactInfo) => {
    saveContactInfo(newInfo);
    setContact(newInfo);
  };

  return [contact, update];
}
