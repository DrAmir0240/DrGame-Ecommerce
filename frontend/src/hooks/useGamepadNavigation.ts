'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTvModeStore } from '@/stores/useTvModeStore';

export function useGamepadNavigation() {
  const router = useRouter();
  const { isTvMode, toggleTvMode, closeTvMode } = useTvModeStore();
  const lastPressRef = useRef<number>(0);
  const currentFocusedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const setGamepadFocus = (el: HTMLElement) => {
      if (currentFocusedElRef.current && currentFocusedElRef.current !== el) {
        currentFocusedElRef.current.removeAttribute('data-tv-focused');
      }
      currentFocusedElRef.current = el;
      el.setAttribute('data-tv-focused', 'true');
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };

    const handleSpatialMove = (up: boolean, down: boolean, left: boolean, right: boolean) => {
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex="0"], [data-nav], [role="button"]'
        )
      ).filter((el) => {
        // Exclude elements inside the fixed bottom bar from standard page spatial jump
        // unless explicitly needed, or make sure they are visible and not disabled
        return (
          el.offsetParent !== null &&
          !el.hasAttribute('disabled') &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          window.getComputedStyle(el).display !== 'none'
        );
      });

      if (focusables.length === 0) return;

      const current = (document.activeElement as HTMLElement) || currentFocusedElRef.current;
      if (!current || !focusables.includes(current)) {
        setGamepadFocus(focusables[0]);
        return;
      }

      const currentRect = current.getBoundingClientRect();
      let bestTarget: HTMLElement | null = null;
      let minDistance = Infinity;

      focusables.forEach((target) => {
        if (target === current) return;
        const targetRect = target.getBoundingClientRect();

        let isValidDirection = false;
        // Directional validation with threshold tolerance
        if (down && targetRect.top >= currentRect.bottom - 20) isValidDirection = true;
        if (up && targetRect.bottom <= currentRect.top + 20) isValidDirection = true;
        if (right && targetRect.left >= currentRect.right - 20) isValidDirection = true;
        if (left && targetRect.right <= currentRect.left + 20) isValidDirection = true;

        if (isValidDirection) {
          const dx = targetRect.left + targetRect.width / 2 - (currentRect.left + currentRect.width / 2);
          const dy = targetRect.top + targetRect.height / 2 - (currentRect.top + currentRect.height / 2);

          // Angle penalty: Elements aligned strictly along the primary navigation axis get preference
          let axisPenalty = 1;
          if (up || down) {
            axisPenalty += Math.abs(dx) * 1.5;
          } else if (left || right) {
            axisPenalty += Math.abs(dy) * 1.5;
          }

          const distance = Math.hypot(dx, dy) + axisPenalty;

          if (distance < minDistance) {
            minDistance = distance;
            bestTarget = target;
          }
        }
      });

      if (bestTarget) {
        setGamepadFocus(bestTarget as HTMLElement);
      }
    };

    const scanGamepad = () => {
      const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? Array.from(gamepads).find((g) => g !== null) : null;

      if (gp) {
        const now = Date.now();
        // 170ms debounce for comfortable, responsive navigation
        if (now - lastPressRef.current > 170) {
          const dpadUp = gp.buttons[12]?.pressed || (gp.axes[1] && gp.axes[1] < -0.5);
          const dpadDown = gp.buttons[13]?.pressed || (gp.axes[1] && gp.axes[1] > 0.5);
          const dpadLeft = gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -0.5);
          const dpadRight = gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > 0.5);

          const buttonCross = gp.buttons[0]?.pressed; // PlayStation Cross (or Xbox A)
          const buttonCircle = gp.buttons[1]?.pressed; // PlayStation Circle (or Xbox B)
          const buttonSquare = gp.buttons[2]?.pressed; // PlayStation Square (or Xbox X)
          const buttonTriangle = gp.buttons[3]?.pressed; // PlayStation Triangle (or Xbox Y)
          const buttonL1 = gp.buttons[4]?.pressed; // L1 bumper
          const buttonR1 = gp.buttons[5]?.pressed; // R1 bumper
          const buttonSelect = gp.buttons[8]?.pressed; // Share / Back / View

          if (dpadUp || dpadDown || dpadLeft || dpadRight) {
            handleSpatialMove(!!dpadUp, !!dpadDown, !!dpadLeft, !!dpadRight);
            lastPressRef.current = now;
          } else if (buttonCross) {
            const activeEl = (document.activeElement as HTMLElement) || currentFocusedElRef.current;
            if (activeEl) {
              activeEl.click();
            }
            lastPressRef.current = now;
          } else if (buttonCircle) {
            // Circle: Back in navigation
            const activeEl = document.activeElement as HTMLElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
              activeEl.blur();
            } else {
              window.history.back();
            }
            lastPressRef.current = now;
          } else if (buttonSquare) {
            // Square: Quick access to subscriptions
            router.push('/subscriptions');
            lastPressRef.current = now;
          } else if (buttonTriangle) {
            // Triangle: Quick access to games catalog
            router.push('/games');
            lastPressRef.current = now;
          } else if (buttonL1) {
            // L1: Smooth page scroll up
            window.scrollBy({ top: -450, behavior: 'smooth' });
            lastPressRef.current = now;
          } else if (buttonR1) {
            // R1: Smooth page scroll down
            window.scrollBy({ top: 450, behavior: 'smooth' });
            lastPressRef.current = now;
          } else if (buttonSelect) {
            // Toggle TV Mode
            toggleTvMode();
            lastPressRef.current = now;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanGamepad);
    };

    // Keyboard Arrow Keys Spatial Navigation for 10-foot keyboard or remote testing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If typing inside an input field, do not hijack arrows
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        e.preventDefault();
        handleSpatialMove(
          e.key === 'ArrowUp',
          e.key === 'ArrowDown',
          e.key === 'ArrowLeft',
          e.key === 'ArrowRight'
        );
      } else if (e.key === 'Escape') {
        if (isTvMode) {
          closeTvMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    animationFrameId = requestAnimationFrame(scanGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
      if (currentFocusedElRef.current) {
        currentFocusedElRef.current.removeAttribute('data-tv-focused');
      }
    };
  }, [router, isTvMode, toggleTvMode, closeTvMode]);
}
