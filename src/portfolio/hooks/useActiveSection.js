import { useEffect, useRef, useState } from 'react';

const SECTION_IDS = ['top', 'about', 'skills', 'projects', 'experience', 'photography', 'contact'];

// Tracks which section is most visible right now, using a persistent ratio map
// rather than trusting a single IntersectionObserver callback batch (which only
// reports entries that just crossed a threshold, not every observed element).
export function useActiveSection() {
  const [active, setActive] = useState('top');
  const ratios = useRef({});

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        let bestId = null;
        let bestRatio = 0;
        for (const id of SECTION_IDS) {
          const r = ratios.current[id] || 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        }
        if (bestId) setActive(bestId);
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return active;
}
