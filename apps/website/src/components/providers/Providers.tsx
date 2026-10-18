'use client';

import { CartProvider } from './CartProvider';
import { WishlistProvider } from './WishlistProvider';
import { ToastProvider } from './ToastProvider';
import { RecentProvider } from './RecentProvider';
import { OrdersProvider } from './OrdersProvider';
import { LoyaltyProvider } from './LoyaltyProvider';
import { FaceProvider } from './FaceProvider';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        <FaceProvider>
          <LoyaltyProvider>
            <OrdersProvider>
              <RecentProvider>
                <WishlistProvider>
                  <CartProvider>{children}</CartProvider>
                </WishlistProvider>
              </RecentProvider>
            </OrdersProvider>
          </LoyaltyProvider>
        </FaceProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}
