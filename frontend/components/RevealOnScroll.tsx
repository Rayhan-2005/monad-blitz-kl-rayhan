"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface RevealOnScrollProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  y?: number;
}

export default function RevealOnScroll({
  children,
  delay = 0,
  y = 20,
  ...rest
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
