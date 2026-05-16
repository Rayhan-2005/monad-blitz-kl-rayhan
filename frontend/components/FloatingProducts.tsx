"use client";
import { motion } from "framer-motion";

interface Product {
  src: string;
  alt: string;
  position: string;
  rotate: number;
  duration: number;
  opacity: number;
}

const PRODUCTS: Product[] = [
  {
    src: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200",
    alt: "Luxury watch",
    position: "top-[15%] left-[6%] lg:left-[10%]",
    rotate: -12,
    duration: 5,
    opacity: 0.7,
  },
  {
    src: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200",
    alt: "Designer handbag",
    position: "top-[12%] right-[6%] lg:right-[10%]",
    rotate: 8,
    duration: 7,
    opacity: 0.7,
  },
  {
    src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200",
    alt: "Fine jewelry",
    position: "bottom-[10%] left-[8%] lg:left-[14%]",
    rotate: 6,
    duration: 6,
    opacity: 0.6,
  },
  {
    src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
    alt: "Designer sneakers",
    position: "bottom-[12%] right-[8%] lg:right-[14%]",
    rotate: -8,
    duration: 8,
    opacity: 0.7,
  },
];

export default function FloatingProducts() {
  return (
    <div
      aria-hidden
      className="hidden md:block pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PRODUCTS.map((p, i) => (
        <motion.div
          key={p.alt}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
          style={{ rotate: `${p.rotate}deg`, opacity: p.opacity }}
          className={`group absolute ${p.position} w-32 h-40 rounded-2xl overflow-hidden pointer-events-auto transition-all duration-300 hover:!opacity-100 hover:scale-105 hover:z-10`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src}
            alt={p.alt}
            draggable={false}
            className="w-full h-full object-cover select-none"
          />
          <div className="absolute inset-0 bg-blue-900/20 rounded-2xl" />
        </motion.div>
      ))}
    </div>
  );
}
