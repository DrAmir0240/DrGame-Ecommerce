"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { isPlayStationBrowser, initSpatialNavigation } from "@/lib/spatial-nav";
import { PlayStationActionBar } from "./PlayStationActionBar";

interface PSModeContextType {
  isPSMode: boolean;
  togglePSMode: () => void;
  detectedConsole?: "PS4" | "PS5";
}

const PSModeContext = createContext<PSModeContextType>({
  isPSMode: false,
  togglePSMode: () => {},
});

export const PlayStationModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPSMode, setIsPSMode] = useState(false);
  const [detectedConsole, setDetectedConsole] = useState<"PS4" | "PS5" | undefined>(undefined);

  useEffect(() => {
    // 1. Check userAgent
    const ua = navigator.userAgent || "";
    const detection = isPlayStationBrowser(ua);
    if (detection.isPS) {
      setIsPSMode(true);
      setDetectedConsole(detection.version);
    } else {
      // 2. Check manual toggle in localStorage
      const saved = localStorage.getItem("drgame_ps_mode_forced");
      if (saved === "true") {
        setIsPSMode(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isPSMode) {
        document.documentElement.classList.add("playstation-mode");
      } else {
        document.documentElement.classList.remove("playstation-mode");
      }
    }

    if (isPSMode) {
      const cleanupNav = initSpatialNavigation();
      return cleanupNav;
    }
  }, [isPSMode]);

  const togglePSMode = () => {
    setIsPSMode((prev) => {
      const next = !prev;
      localStorage.setItem("drgame_ps_mode_forced", next ? "true" : "false");
      return next;
    });
  };

  return (
    <PSModeContext.Provider value={{ isPSMode, togglePSMode, detectedConsole }}>
      {children}
      {isPSMode && <PlayStationActionBar />}
    </PSModeContext.Provider>
  );
};

export const usePlayStationMode = () => useContext(PSModeContext);
