"use client";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet } from "@/lib/wagmi";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const handleConnect = async () => {
    try {
      await connectAsync({ connector: injected() });
      await switchChainAsync({ chainId: monadTestnet.id });
    } catch {
      // user rejected connection or chain switch
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-gray-900 text-base tracking-tight"
        >
          Hallmark
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link href="/register" className="hover:text-gray-900 transition-colors">
            Register
          </Link>
          <Link href="/verify" className="hover:text-gray-900 transition-colors">
            Verify
          </Link>
          <Link href="/assets" className="hover:text-gray-900 transition-colors">
            Assets
          </Link>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white">
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
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
