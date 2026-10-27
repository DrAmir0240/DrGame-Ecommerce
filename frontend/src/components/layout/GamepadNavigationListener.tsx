'use client';

import { useGamepadNavigation } from '@/hooks/useGamepadNavigation';

export default function GamepadNavigationListener() {
  useGamepadNavigation();
  return null;
}
