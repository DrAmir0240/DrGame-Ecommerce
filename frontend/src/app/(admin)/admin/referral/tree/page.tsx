'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ReferralNetworkHub from '@/components/admin/referral/ReferralNetworkHub';

export default function ReferralTreePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
          در حال بارگذاری مرکز رهگیری زنجیره...
        </div>
      }
    >
      <ReferralNetworkHub defaultTab="explorer" />
    </Suspense>
  );
}
