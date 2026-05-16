"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import MeshGradientHero from "@/components/MeshGradientHero";
import MagneticButton from "@/components/MagneticButton";
import TiltCard from "@/components/TiltCard";
import RevealOnScroll from "@/components/RevealOnScroll";

const FEATURES = [
  {
    title: "Register",
    body: "Anyone can create a permanent on-chain record for a real-world asset.",
  },
  {
    title: "Verify",
    body: "Experts stake MON to guarantee authenticity — their money is on the line.",
  },
  {
    title: "Trust",
    body: "Buyers see exactly how much MON is at stake behind every claim.",
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
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <MeshGradientHero />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h1 className="hero-headline font-semibold text-gray-900 mb-6">
              Verify what&apos;s real.
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
              The open provenance layer for luxury resale. Anyone can register,
              verify, and trust.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <MagneticButton
                onClick={handlePrimary}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors w-full sm:w-auto"
              >
                {isConnected ? "Register an Asset" : "Connect to Begin"}
              </MagneticButton>
              <Link
                href="/assets"
                className="border border-black/[0.06] hover:border-blue-600/30 bg-white text-gray-700 rounded-lg px-5 py-2.5 font-medium text-sm transition-colors w-full sm:w-auto text-center"
              >
                Look up an Asset
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 0.1}>
              <TiltCard className="card-feature p-6 h-full">
                <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-card-title">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {f.body}
                </p>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-gray-400 text-center tracking-label uppercase">
          Built on Monad Testnet
        </div>
      </footer>
    </>
  );
}
