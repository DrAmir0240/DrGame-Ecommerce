'use client';

import React, { useEffect } from 'react';
import { useTvModeStore } from '@/stores/useTvModeStore';
import TvBottomBar from './TvBottomBar';

export default function TvModeHost() {
  const { initTvDetection } = useTvModeStore();

  useEffect(() => {
    initTvDetection();
  }, [initTvDetection]);

  return <TvBottomBar />;
}
