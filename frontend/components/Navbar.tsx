"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet } from "@/lib/wagmi";
import MagneticButton from "@/components/MagneticButton";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleConnect = async () => {
    try {
      await connectAsync({ connector: injected() });
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch {
      // user rejected connection or chain switch
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-black/[0.06]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="font-semibold text-gray-900 text-base tracking-card-title"
          >
            Hallmark
          </span>
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full bg-blue-600"
          />
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
          <Link
            href="/"
            className="link-underline hover:text-gray-900 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/register"
            className="link-underline hover:text-gray-900 transition-colors"
          >
            Register
          </Link>
          <Link
            href="/verify"
            className="link-underline hover:text-gray-900 transition-colors"
          >
            Verify
          </Link>
          <Link
            href="/assets"
            className="link-underline hover:text-gray-900 transition-colors"
          >
            Assets
          </Link>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-black/[0.06] bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-gray-700">
                {shorten(address)}
              </span>
            </div>
            <button
              onClick={() => disconnect()}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <MagneticButton
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors"
          >
            Connect Wallet
          </MagneticButton>
        )}
      </div>
    </nav>
  );
}
