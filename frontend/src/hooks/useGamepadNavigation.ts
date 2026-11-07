'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTvModeStore } from '@/stores/useTvModeStore';

export function useGamepadNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTvMode, toggleTvMode, closeTvMode, adjustZoom } = useTvModeStore();
  const lastPressRef = useRef<number>(0);
  const lastZoomTickRef = useRef<number>(0);
  const currentFocusedElRef = useRef<HTMLElement | null>(null);

  // CRITICAL: When the user is on the gamepad diagnostics/testing page,
  // do NOT intercept gamepad buttons for site navigation!
  const isTestingPage = pathname?.startsWith('/gamepad') || pathname?.startsWith('/tools/gamepad');

  useEffect(() => {
    if (isTestingPage) {
      return;
    }
    let animationFrameId: number;

    const setGamepadFocus = (el: HTMLElement) => {
      if (currentFocusedElRef.current && currentFocusedElRef.current !== el) {
        currentFocusedElRef.current.removeAttribute('data-tv-focused');
      }
      currentFocusedElRef.current = el;
      el.setAttribute('data-tv-focused', 'true');
      el.focus({ preventScroll: true });

      // If inside a horizontal carousel track, scroll smoothly to center the card horizontally
      const carouselTrack =
        el.closest<HTMLElement>('[data-carousel-track]') ||
        el.closest<HTMLElement>('.overflow-x-auto');

      if (carouselTrack) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    };

    const handleSpatialMove = (up: boolean, down: boolean, left: boolean, right: boolean) => {
      const current = (document.activeElement as HTMLElement) || currentFocusedElRef.current;

      // ─────────────────────────────────────────────────────────────────
      // 1. CAROUSEL-AWARE HORIZONTAL NAVIGATION (ورق خوردن اسلایدر)
      // When current element is inside a horizontal slider, pressing Left
      // or Right moves card-by-card and scrolls the slider horizontally.
      // It STRICTLY stays inside this carousel and NEVER jumps down/up!
      // ─────────────────────────────────────────────────────────────────
      if (current && (left || right)) {
        const carouselTrack =
          current.closest<HTMLElement>('[data-carousel-track]') ||
          current.closest<HTMLElement>('.overflow-x-auto');

        if (carouselTrack) {
          const items = Array.from(
            carouselTrack.querySelectorAll<HTMLElement>('[data-carousel-item], a, button')
          ).filter((el) => {
            if (
              el.hasAttribute('data-no-gamepad') ||
              el.getAttribute('tabindex') === '-1' ||
              el.hasAttribute('disabled')
            ) {
              return false;
            }
            return (
              el.offsetParent !== null &&
              window.getComputedStyle(el).visibility !== 'hidden' &&
              window.getComputedStyle(el).display !== 'none'
            );
          });

          // Deduplicate nested matches so only the primary interactive card is navigated
          const uniqueItems = items.filter(
            (el) => !items.some((other) => other !== el && other.contains(el))
          );

          if (uniqueItems.length > 0) {
            let currentIndex = uniqueItems.findIndex(
              (it) => it === current || it.contains(current)
            );

            if (currentIndex === -1) {
              currentIndex = 0;
            }

            const isRtl =
              document.documentElement.dir === 'rtl' ||
              document.dir === 'rtl' ||
              document.documentElement.lang === 'fa' ||
              document.documentElement.lang === 'ar';

            // In RTL: Left moves to next card (+1), Right moves to previous card (-1)
            // In LTR: Right moves to next card (+1), Left moves to previous card (-1)
            const targetIndex = isRtl
              ? left ? currentIndex + 1 : currentIndex - 1
              : right ? currentIndex + 1 : currentIndex - 1;

            if (targetIndex >= 0 && targetIndex < uniqueItems.length) {
              const nextTarget = uniqueItems[targetIndex];
              setGamepadFocus(nextTarget);
              return;
            } else {
              // Boundary hit (at start or end of this carousel):
              // DO NOT jump down to next section! Keep card focused and centered.
              const boundaryIndex = Math.max(0, Math.min(uniqueItems.length - 1, targetIndex));
              const boundaryItem = uniqueItems[boundaryIndex];
              if (boundaryItem) {
                setGamepadFocus(boundaryItem);
              }
              return;
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // 2. GENERAL 2D SPATIAL NAVIGATION (FOR UP/DOWN & NON-CAROUSEL)
      // ─────────────────────────────────────────────────────────────────
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex="0"], [data-nav], [role="button"]'
        )
      ).filter((el) => {
        // Controller MUST NEVER navigate into the fixed TV bottom bar or footer
        if (
          el.closest('footer') ||
          el.closest('[data-tv-bar]') ||
          el.closest('[role="region"][aria-label*="tv"]') ||
          el.hasAttribute('data-no-gamepad') ||
          el.getAttribute('tabindex') === '-1'
        ) {
          return false;
        }

        return (
          el.offsetParent !== null &&
          !el.hasAttribute('disabled') &&
          window.getComputedStyle(el).visibility !== 'hidden' &&
          window.getComputedStyle(el).display !== 'none'
        );
      });

      if (focusables.length === 0) return;

      if (!current || !focusables.includes(current)) {
        setGamepadFocus(focusables[0]);
        return;
      }

      const currentRect = current.getBoundingClientRect();
      let bestTarget: HTMLElement | null = null;
      let minDistance = Infinity;

      focusables.forEach((target) => {
        if (target === current || target.contains(current) || current.contains(target)) return;
        const targetRect = target.getBoundingClientRect();

        const dx = targetRect.left + targetRect.width / 2 - (currentRect.left + currentRect.width / 2);
        const dy = targetRect.top + targetRect.height / 2 - (currentRect.top + currentRect.height / 2);

        let isValidDirection = false;
        if (down && targetRect.top >= currentRect.bottom - 20) {
          // Downward target: must not be drastically more horizontal than vertical
          if (Math.abs(dx) <= Math.abs(dy) * 2.8) isValidDirection = true;
        }
        if (up && targetRect.bottom <= currentRect.top + 20) {
          // Upward target: must not be drastically more horizontal than vertical
          if (Math.abs(dx) <= Math.abs(dy) * 2.8) isValidDirection = true;
        }
        if (right && targetRect.left >= currentRect.right - 20) {
          // Rightward target: must be on roughly the same horizontal level, not jumping down/up
          if (Math.abs(dy) <= Math.abs(dx) * 1.2 || Math.abs(dy) < 80) isValidDirection = true;
        }
        if (left && targetRect.right <= currentRect.left + 20) {
          // Leftward target: must be on roughly the same horizontal level, not jumping down/up
          if (Math.abs(dy) <= Math.abs(dx) * 1.2 || Math.abs(dy) < 80) isValidDirection = true;
        }

        if (isValidDirection) {
          let axisPenalty = 1;
          if (up || down) {
            axisPenalty += Math.abs(dx) * 2;
          } else if (left || right) {
            // Heavily penalize vertical drift when moving horizontally
            axisPenalty += Math.abs(dy) * 6;
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

        // 1. Check L3 (Left Stick Click - Button 10)
        const isL3Pressed = !!gp.buttons[10]?.pressed;

        // 2. Right Stick (RX: axes[2], RY: axes[3])
        const rx = gp.axes[2] || 0;
        const ry = gp.axes[3] || 0;

        if (isL3Pressed) {
          // L3 + Right Joystick: ZOOM IN / ZOOM OUT
          if (Math.abs(ry) > 0.22 && now - lastZoomTickRef.current > 70) {
            // Tilting Up (ry < -0.22): Zoom IN (+0.02)
            // Tilting Down (ry > 0.22): Zoom OUT (-0.02)
            const zoomDelta = ry < -0.22 ? 0.02 : -0.02;
            adjustZoom(zoomDelta);
            lastZoomTickRef.current = now;
          }
        } else {
          // Right Joystick Alone: ANALOG CONTINUOUS SCROLLING
          if (Math.abs(ry) > 0.15) {
            const scrollDelta = ry * 24;
            window.scrollBy({ top: scrollDelta, behavior: 'auto' });
          }

          if (Math.abs(rx) > 0.25) {
            const current = (document.activeElement as HTMLElement) || currentFocusedElRef.current;
            const carousel = current?.closest('.overflow-x-auto') || document.querySelector('.overflow-x-auto');
            if (carousel) {
              carousel.scrollBy({ left: rx * 22, behavior: 'auto' });
            } else {
              window.scrollBy({ left: rx * 22, behavior: 'auto' });
            }
          }
        }

        // 3. Debounced D-Pad and Face Buttons Navigation
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
            const activeEl = document.activeElement as HTMLElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
              activeEl.blur();
            } else {
              window.history.back();
            }
            lastPressRef.current = now;
          } else if (buttonSquare) {
            router.push('/subscriptions');
            lastPressRef.current = now;
          } else if (buttonTriangle) {
            router.push('/games');
            lastPressRef.current = now;
          } else if (buttonL1) {
            window.scrollBy({ top: -450, behavior: 'smooth' });
            lastPressRef.current = now;
          } else if (buttonR1) {
            window.scrollBy({ top: 450, behavior: 'smooth' });
            lastPressRef.current = now;
          } else if (buttonSelect) {
            toggleTvMode();
            lastPressRef.current = now;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanGamepad);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
  }, [router, isTvMode, toggleTvMode, closeTvMode, adjustZoom, isTestingPage]);
}