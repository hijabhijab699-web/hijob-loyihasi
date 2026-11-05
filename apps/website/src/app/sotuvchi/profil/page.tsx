'use client';

import { useEffect, useState } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface SellerProfile {
  shopName?: string;
  description?: string;
  phone?: string;
  city?: string;
  deliveryInfo?: string;
  returnPolicy?: string;
}

// Read-only view of the seller's shop profile. Edit comes later — the
// goal of this first pass is parity with the mobile Dashboard's shop
// card so a seller who signs in on the web sees the same snapshot.
export default function SellerProfilePage() {
  const auth = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.tokens?.accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/seller/profile', {
          headers: { Authorization: `Bearer ${auth.tokens!.accessToken}` },
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(body?.error ?? 'FAILED');
        setProfile(body as SellerProfile);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'FETCH_FAILED');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.tokens?.accessToken]);

  if (loading) {
    return (
      <div className="py-20 text-center text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
          <Store className="w-6 h-6 text-brand-dark" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">
            {profile?.shopName ?? 'Do\'kon profili'}
          </h2>
          <p className="text-sm text-ink-muted">
            {profile?.city ? `${profile.city} · ` : ''}
            {profile?.phone ?? ''}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Yuklab bo&apos;lmadi: {error}
        </div>
      )}

      <div className="bg-white border border-rule-light rounded-2xl p-5 space-y-4">
        <Field label="Do'kon haqida" value={profile?.description} />
        <Field label="Yetkazib berish" value={profile?.deliveryInfo} />
        <Field label="Qaytarish shartlari" value={profile?.returnPolicy} />
      </div>

      <p className="text-xs text-ink-muted">
        Do&apos;kon ma&apos;lumotlarini tahrirlash uchun mobile ilovadan foydalaning
        — tez orada bu yerda ham qo&apos;shamiz.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-ink mt-1 leading-relaxed">
        {value?.trim() || <span className="text-ink-light italic">Kiritilmagan</span>}
      </p>
    </div>
  );
}
