"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { Shield } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { monadTestnet } from "@/lib/wagmi";
import MagneticButton from "@/components/MagneticButton";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const NAV = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/verify", label: "Verify" },
  { href: "/assets", label: "Assets" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const controls = useAnimation();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolledNow = window.scrollY > 40;
      setScrolled(scrolledNow);
      if (scrolledNow) {
        controls.start({ backgroundColor: "#ffffff", color: "#1f2937", borderBottomColor: "#e5e7eb", transition: { duration: 0.5 } });
      } else {
        controls.start({ backgroundColor: "transparent", color: "#ffffff", borderBottomColor: "transparent", transition: { duration: 0.5 } });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [controls]);

  const isLanding = pathname === "/";
  const darkMode = isLanding && !scrolled;

  const handleConnect = async () => {
    try {
      await connectAsync({ connector: injected() });
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch {
      // user rejected
    }
  };

  return (
    <motion.nav
      animate={controls}
      className="fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300"
      style={{ borderBottomColor: darkMode ? "transparent" : "#e5e7eb" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield
            className={`w-5 h-5 transition-colors ${darkMode ? "text-blue-400" : "text-blue-600"}`}
            strokeWidth={2}
            fill={darkMode ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.08)"}
          />
          <span
            className={`font-bold text-base tracking-card-title transition-colors ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Hallmark
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`link-underline transition-colors ${active ? "is-active" : ""} ${darkMode ? (active ? "text-white" : "text-gray-300 hover:text-white") : active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${darkMode ? "border-white/15 bg-white/5" : "border-black/[0.06] bg-white"}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span
                className={`text-xs font-mono transition-colors ${darkMode ? "text-gray-100" : "text-gray-700"}`}
              >
                {shorten(address)}
              </span>
            </div>
            <button
              onClick={() => disconnect()}
              className={`text-sm transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <MagneticButton
            onClick={handleConnect}
            className={`btn-shine rounded-lg px-4 py-2 font-medium text-sm transition-colors ${darkMode ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            Connect Wallet
          </MagneticButton>
        )}
      </div>
    </motion.nav>
  );
}
