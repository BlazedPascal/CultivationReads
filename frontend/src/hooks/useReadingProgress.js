import { useEffect, useCallback } from 'react';

const KEY = (novelSlug) => `cr_progress_${novelSlug}`;

export function useReadingProgress(novelSlug) {
  const save = useCallback(
    (chapterSlug) => {
      if (!novelSlug || !chapterSlug) return;
      localStorage.setItem(KEY(novelSlug), chapterSlug);
    },
    [novelSlug]
  );

  const get = useCallback(() => {
    if (!novelSlug) return null;
    return localStorage.getItem(KEY(novelSlug));
  }, [novelSlug]);

  const clear = useCallback(() => {
    if (!novelSlug) return;
    localStorage.removeItem(KEY(novelSlug));
  }, [novelSlug]);

  return { save, get, clear };
}

export function useScrollProgress(chapterSlug, onSave) {
  useEffect(() => {
    if (!chapterSlug) return;
    onSave?.(chapterSlug);

    const savedPos = sessionStorage.getItem(`cr_scroll_${chapterSlug}`);
    if (savedPos) window.scrollTo(0, parseInt(savedPos));

    const handleScroll = () => {
      sessionStorage.setItem(`cr_scroll_${chapterSlug}`, String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterSlug, onSave]);
}
