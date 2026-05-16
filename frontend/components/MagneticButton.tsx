"use client";
import {
  motion,
  useMotionValue,
  useSpring,
  HTMLMotionProps,
} from "framer-motion";
import { useRef, ReactNode } from "react";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  strength?: number;
  maxOffset?: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function MagneticButton({
  children,
  strength = 0.2,
  maxOffset = 6,
  className,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 20 });
  const springY = useSpring(y, { stiffness: 280, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set(clamp((e.clientX - cx) * strength, -maxOffset, maxOffset));
    y.set(clamp((e.clientY - cy) * strength, -maxOffset, maxOffset));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
