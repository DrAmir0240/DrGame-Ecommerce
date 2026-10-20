"use client";

import { useEffect, useRef } from "react";

export function useGamepadNavigation() {
  const lastButtonPress = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const getNavElements = (): HTMLElement[] => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-nav-item="true"], a[href], button:not([disabled]), input:not([disabled])'
        )
      );
      return elements.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
      });
    };

    const navigate = (direction: "up" | "down" | "left" | "right") => {
      const elements = getNavElements();
      if (!elements.length) return;

      const current = (document.activeElement as HTMLElement) || elements[0];
      const currentIndex = elements.indexOf(current);

      if (currentIndex === -1) {
        elements[0].focus();
        elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const currentRect = current.getBoundingClientRect();
      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      elements.forEach((el) => {
        if (el === current) return;
        const rect = el.getBoundingClientRect();

        let isValid = false;
        if (direction === "down" && rect.top >= currentRect.bottom - 10) isValid = true;
        if (direction === "up" && rect.bottom <= currentRect.top + 10) isValid = true;
        if (direction === "right" && rect.left >= currentRect.right - 10) isValid = true;
        if (direction === "left" && rect.right <= currentRect.left + 10) isValid = true;

        if (isValid) {
          const dx = rect.left + rect.width / 2 - (currentRect.left + currentRect.width / 2);
          const dy = rect.top + rect.height / 2 - (currentRect.top + currentRect.height / 2);
          const distance = Math.hypot(dx, dy);

          if (distance < minDistance) {
            minDistance = distance;
            bestCandidate = el;
          }
        }
      });

      if (bestCandidate) {
        (bestCandidate as HTMLElement).focus();
        (bestCandidate as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    // Keyboard Arrow Keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (document.activeElement?.tagName === "INPUT") return;
        e.preventDefault();
        if (e.key === "ArrowUp") navigate("up");
        if (e.key === "ArrowDown") navigate("down");
        if (e.key === "ArrowLeft") navigate("left");
        if (e.key === "ArrowRight") navigate("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Gamepad Polling Loop
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];
      const now = Date.now();

      if (gp && now - lastButtonPress.current > 200) {
        // D-Pad buttons
        if (gp.buttons[12]?.pressed) {
          navigate("up");
          lastButtonPress.current = now;
        } else if (gp.buttons[13]?.pressed) {
          navigate("down");
          lastButtonPress.current = now;
        } else if (gp.buttons[14]?.pressed) {
          navigate("left");
          lastButtonPress.current = now;
        } else if (gp.buttons[15]?.pressed) {
          navigate("right");
          lastButtonPress.current = now;
        } else if (gp.buttons[0]?.pressed) {
          // X / A button (Select/Click)
          const active = document.activeElement as HTMLElement;
          if (active && typeof active.click === "function") {
            active.click();
            lastButtonPress.current = now;
          }
        }
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}
