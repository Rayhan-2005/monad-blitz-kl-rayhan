"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";

export default function CursorSpotlight() {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [x, y]);

  const background = useMotionTemplate`radial-gradient(400px circle at ${x}px ${y}px, rgba(37, 99, 235, 0.04), transparent 60%)`;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
      style={{ background }}
    />
  );
}
