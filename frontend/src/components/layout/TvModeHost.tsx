'use client';

import React, { useEffect } from 'react';
import { useTvModeStore } from '@/stores/useTvModeStore';
import ConsoleTvMode from './ConsoleTvMode';

export default function TvModeHost() {
  const { isTvMode, closeTvMode, initTvDetection } = useTvModeStore();

  useEffect(() => {
    initTvDetection();
  }, [initTvDetection]);

  return <ConsoleTvMode isOpen={isTvMode} onClose={closeTvMode} />;
}

