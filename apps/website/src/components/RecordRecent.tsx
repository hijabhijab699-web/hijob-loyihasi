'use client';

import { useEffect } from 'react';
import { useRecent } from '@/components/providers/RecentProvider';

export function RecordRecent({ productId }: { productId: string }) {
  const { add, isHydrated } = useRecent();
  useEffect(() => {
    if (isHydrated) add(productId);
  }, [productId, add, isHydrated]);
  return null;
}
