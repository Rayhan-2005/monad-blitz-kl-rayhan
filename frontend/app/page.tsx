"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { FileCheck, ShieldCheck, Eye } from "lucide-react";
import FloatingProducts from "@/components/FloatingProducts";
import Particles from "@/components/Particles";
import MagneticButton from "@/components/MagneticButton";
import RevealOnScroll from "@/components/RevealOnScroll";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const FEATURES = [
  {
    title: "Register",
    body: "Anyone can create a permanent on-chain record for a real-world asset.",
    icon: FileCheck,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    border: "border-t-blue-500",
  },
  {
    title: "Verify",
    body: "Experts stake MON to guarantee authenticity — their money is on the line.",
    icon: ShieldCheck,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
    border: "border-t-violet-500",
  },
  {
    title: "Trust",
    body: "Buyers see exactly how much MON is at stake behind every claim.",
    icon: Eye,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    border: "border-t-emerald-500",
  },
];

export default function Home() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const router = useRouter();

  const handlePrimary = () => {
    if (isConnected) {
      router.push("/register");
    } else {
      connect({ connector: injected() });
    }
  };

  return (
    <>
      {/* Hero — dark navy gradient */}
      <section className="hero-bg relative pt-28 pb-20 px-6 overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
        <Particles count={20} />
        <FloatingProducts />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase text-blue-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Built on Monad
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-none">
              Verify what&apos;s <em className="text-blue-400 not-italic italic">real.</em>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.12}>
            <p className="text-lg md:text-xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              The open provenance layer for luxury resale. Anyone can register, verify, and trust.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagneticButton
                onClick={handlePrimary}
                className="btn-shine bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-8 py-4 font-semibold text-base transition-colors w-full sm:w-auto shadow-lg shadow-blue-500/20"
              >
                {isConnected ? "Register an Asset" : "Connect to Begin"}
              </MagneticButton>
              <Link
                href="/assets"
                className="border border-white/20 text-white hover:bg-white/10 rounded-lg px-8 py-4 font-semibold text-base transition-colors w-full sm:w-auto text-center"
              >
                Look up an Asset
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <StatsBar />

      <HowItWorks />
      <HowItWorks />

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-3">
              Three roles
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Designed for everyone in the chain of custody
            </h2>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <RevealOnScroll key={f.title} delay={i * 0.08}>
                <div
                  className={`group card-feature border-t-2 ${f.border} p-8 rounded-xl bg-[#FAFBFF] shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-transform transform hover:-translate-y-1`}
                >
                  <div
                    className={`w-16 h-16 rounded-xl ${f.iconBg} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon
                      className={`w-8 h-8 ${f.iconColor}`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-card-title">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {f.body}
                  </p>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      <Footer />
    </>
  );
}
