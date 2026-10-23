/**
 * PlayStation Mode 10-Foot Spatial Navigation Engine
 * Manages D-Pad arrow directional navigation between focusable elements
 */

export const PS_CONSOLE_UA_REGEX = /PlayStation\s*(?:;\s*PlayStation)?\s*(5|4)[\/ ]?([\d.-]*)/i;

export function isPlayStationBrowser(userAgent: string): { isPS: boolean; version?: "PS4" | "PS5" } {
  const match = userAgent.match(PS_CONSOLE_UA_REGEX);
  if (!match) return { isPS: false };
  return { isPS: true, version: match[1] === "5" ? "PS5" : "PS4" };
}

export function initSpatialNavigation(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only intercept arrow keys if in playstation-mode
    if (!document.documentElement.classList.contains("playstation-mode")) {
      return;
    }

    const directionMap: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const dir = directionMap[e.key];
    if (!dir) return;

    e.preventDefault();

    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
    });

    if (focusables.length === 0) return;

    const current = (document.activeElement as HTMLElement) || focusables[0];
    const currentRect = current.getBoundingClientRect();

    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const target of focusables) {
      if (target === current) continue;
      const targetRect = target.getBoundingClientRect();

      const dx = targetRect.left + targetRect.width / 2 - (currentRect.left + currentRect.width / 2);
      const dy = targetRect.top + targetRect.height / 2 - (currentRect.top + currentRect.height / 2);

      let isValidDirection = false;
      if (dir === "up" && dy < -5) isValidDirection = true;
      if (dir === "down" && dy > 5) isValidDirection = true;
      if (dir === "left" && dx < -5) isValidDirection = true;
      if (dir === "right" && dx > 5) isValidDirection = true;

      if (isValidDirection) {
        // Euclidean distance with directional weighting
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          bestCandidate = target;
        }
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
      bestCandidate.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
