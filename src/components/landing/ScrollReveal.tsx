"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealVariant = "up" | "left" | "right" | "fade";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
}

const VARIANT_CLASSES: Record<RevealVariant, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  fade: "reveal-fade",
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay) {
              setTimeout(() => {
                entry.target.classList.add("is-visible");
              }, delay);
            } else {
              entry.target.classList.add("is-visible");
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal-on-scroll ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </div>
  );
}
