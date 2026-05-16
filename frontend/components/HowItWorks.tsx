"use client";
import { FilePlus2, ShieldCheck, Handshake } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    icon: FilePlus2,
    title: "Register your item on-chain",
    body: "Create a permanent record with its serial, brand, and value.",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Experts stake MON to verify it",
    body: "Verifiers put real money on the line. Honesty earns the bounty.",
  },
  {
    num: "03",
    icon: Handshake,
    title: "Buyers trust the stake, not the seller",
    body: "Anyone can see how much MON guarantees the claim of authenticity.",
  },
];

export default function HowItWorks() {
  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-3">
            How it works
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Three steps to trustless provenance
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          <div
            aria-hidden
            className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0"
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: i * 0.12,
                }}
                className="relative text-center md:text-left"
              >
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 border border-blue-500/30 mb-5">
                  <Icon className="w-6 h-6 text-blue-400" strokeWidth={1.75} />
                </div>
                <div className="text-xs font-semibold tracking-widest uppercase text-blue-400 mb-2">
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-card-title">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {s.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
