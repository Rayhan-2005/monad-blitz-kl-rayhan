"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

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
    <div className="animate-fade-in">
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6">
          Verify what&apos;s real.
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
          The open provenance layer for luxury resale. Anyone can register,
          verify, and trust.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handlePrimary}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors w-full sm:w-auto"
          >
            {isConnected ? "Register an Asset" : "Connect to Begin"}
          </button>
          <Link
            href="/assets"
            className="border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-lg px-5 py-2.5 font-medium text-sm transition-colors w-full sm:w-auto text-center"
          >
            Look up an Asset
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-gray-400 text-center">
          Built on Monad Testnet
        </div>
      </footer>
    </div>
  );
}
