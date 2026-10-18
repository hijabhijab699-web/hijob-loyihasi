'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SELECTOR = '.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade';

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const reveal = (el: Element) => el.classList.add('reveal-visible');

    const isInView = (el: Element) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh - 40 && r.bottom > 0;
    };

    if (prefersReducedMotion) {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const observeAll = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.classList.contains('reveal-visible')) return;
        if (isInView(el)) {
          reveal(el);
        } else {
          observer.observe(el);
        }
      });
    };

    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches?.(SELECTOR)) {
            if (isInView(n)) {
              reveal(n);
            } else {
              observer.observe(n);
            }
          }
          observeAll(n);
        });
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
