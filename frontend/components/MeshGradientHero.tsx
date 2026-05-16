"use client";
import { motion } from "framer-motion";

const BLOBS = [
  {
    color: "#2563EB",
    opacity: 0.07,
    className: "top-[8%] left-[12%] w-[440px] h-[440px]",
    animate: { x: [0, 60, -30, 0], y: [0, 40, -20, 0] },
    duration: 12,
  },
  {
    color: "#7C3AED",
    opacity: 0.06,
    className: "top-[18%] right-[8%] w-[400px] h-[400px]",
    animate: { x: [0, -50, 30, 0], y: [0, 30, -40, 0] },
    duration: 10,
  },
  {
    color: "#0891B2",
    opacity: 0.06,
    className: "bottom-[0%] left-[30%] w-[480px] h-[480px]",
    animate: { x: [0, 30, -50, 0], y: [0, -30, 20, 0] },
    duration: 14,
  },
];

export default function MeshGradientHero() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ backgroundColor: blob.color, opacity: blob.opacity }}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
        />
      ))}
    </div>
  );
}
