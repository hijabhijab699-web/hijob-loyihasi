'use client';

import { useState } from 'react';
import { Check, Copy, Send, Share2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface Props {
  title: string;
  url?: string;
}

export function ShareButtons({ title, url }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const target = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(target);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      toast.success('Havola nusxalandi');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nusxalab bo'lmadi");
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      copy();
      return;
    }
    try {
      await navigator.share({ title, url: target });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-muted mr-1">Ulashish:</span>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        className="w-9 h-9 rounded-full bg-bg-warm hover:bg-brand hover:text-white text-ink-muted flex items-center justify-center transition-colors"
        aria-label="Telegram orqali ulashish"
        title="Telegram"
      >
        <Send className="w-4 h-4" />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="w-9 h-9 rounded-full bg-bg-warm hover:bg-emerald-500 hover:text-white text-ink-muted flex items-center justify-center transition-colors"
        aria-label="WhatsApp orqali ulashish"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M20.52 3.48A11.9 11.9 0 0012.06 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 005.76 1.47h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44zM12.07 21.8h-.01a9.86 9.86 0 01-5.03-1.37l-.36-.21-3.74.98 1-3.65-.24-.37a9.84 9.84 0 01-1.51-5.28c0-5.44 4.43-9.87 9.88-9.87 2.64 0 5.11 1.03 6.97 2.9a9.8 9.8 0 012.9 6.96c0 5.45-4.43 9.9-9.87 9.9zm5.4-7.4c-.3-.14-1.74-.86-2.01-.96-.27-.1-.47-.14-.67.15s-.76.95-.93 1.14c-.17.2-.34.22-.63.08-.3-.14-1.25-.46-2.37-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.5.14-.17.19-.3.29-.5.1-.2.05-.37-.02-.51-.07-.14-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.07 2.87 1.22 3.07.14.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.08 1.74-.71 1.98-1.4.24-.68.24-1.26.17-1.4-.07-.14-.26-.21-.56-.35z" />
        </svg>
      </a>
      <button
        onClick={copy}
        className="w-9 h-9 rounded-full bg-bg-warm hover:bg-brand hover:text-white text-ink-muted flex items-center justify-center transition-colors"
        aria-label="Havolani nusxalash"
        title="Havolani nusxalash"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      <button
        onClick={nativeShare}
        className="w-9 h-9 rounded-full bg-bg-warm hover:bg-brand hover:text-white text-ink-muted flex items-center justify-center transition-colors md:hidden"
        aria-label="Ulashish"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
}
