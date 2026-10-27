'use client';

import { useEffect, useRef } from 'react';

export function useGamepadNavigation() {
  const lastPressRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleSpatialMove = (up: boolean, down: boolean, left: boolean, right: boolean) => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex="0"], [data-nav]')
      ).filter((el) => {
        // Must be visible and enabled
        return (
          el.offsetParent !== null &&
          !el.hasAttribute('disabled') &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          window.getComputedStyle(el).display !== 'none'
        );
      });

      if (focusables.length === 0) return;

      const current = document.activeElement as HTMLElement;
      if (!current || !focusables.includes(current)) {
        focusables[0]?.focus();
        focusables[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const currentRect = current.getBoundingClientRect();
      let bestTarget: HTMLElement | null = null;
      let minDistance = Infinity;

      focusables.forEach((target) => {
        if (target === current) return;
        const targetRect = target.getBoundingClientRect();

        let isValidDirection = false;
        if (down && targetRect.top >= currentRect.bottom - 15) isValidDirection = true;
        if (up && targetRect.bottom <= currentRect.top + 15) isValidDirection = true;
        if (right && targetRect.left >= currentRect.right - 15) isValidDirection = true;
        if (left && targetRect.right <= currentRect.left + 15) isValidDirection = true;

        if (isValidDirection) {
          const dx = targetRect.left + targetRect.width / 2 - (currentRect.left + currentRect.width / 2);
          const dy = targetRect.top + targetRect.height / 2 - (currentRect.top + currentRect.height / 2);
          const distance = Math.hypot(dx, dy);

          if (distance < minDistance) {
            minDistance = distance;
            bestTarget = target;
          }
        }
      });

      if (bestTarget) {
        (bestTarget as HTMLElement).focus();
        (bestTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const scanGamepad = () => {
      const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? gamepads[0] : null;

      if (gp) {
        const now = Date.now();
        // 180ms debounce for comfortable navigation
        if (now - lastPressRef.current > 180) {
          const dpadUp = gp.buttons[12]?.pressed || (gp.axes[1] && gp.axes[1] < -0.5);
          const dpadDown = gp.buttons[13]?.pressed || (gp.axes[1] && gp.axes[1] > 0.5);
          const dpadLeft = gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -0.5);
          const dpadRight = gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > 0.5);
          const buttonX = gp.buttons[0]?.pressed; // PlayStation Cross (or Xbox A)
          const buttonCircle = gp.buttons[1]?.pressed; // PlayStation Circle (Back)

          if (dpadUp || dpadDown || dpadLeft || dpadRight) {
            handleSpatialMove(!!dpadUp, !!dpadDown, !!dpadLeft, !!dpadRight);
            lastPressRef.current = now;
          } else if (buttonX) {
            const activeEl = document.activeElement as HTMLElement;
            if (activeEl) {
              activeEl.click();
            }
            lastPressRef.current = now;
          } else if (buttonCircle) {
            // Back action
            window.history.back();
            lastPressRef.current = now;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanGamepad);
    };

    // Keyboard Arrow Keys Spatial Navigation for 10-foot testing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If user is typing in an input field, do not hijack arrows
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        e.preventDefault();
        handleSpatialMove(
          e.key === 'ArrowUp',
          e.key === 'ArrowDown',
          e.key === 'ArrowLeft',
          e.key === 'ArrowRight'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    animationFrameId = requestAnimationFrame(scanGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
}
