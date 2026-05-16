"use client";
import { useState } from "react";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { useRouter } from "next/navigation";
import { FilePlus2, Tag, Building2, Hash, Coins } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { monadTestnet } from "@/lib/wagmi";
import { parseEther } from "viem";
import RevealOnScroll from "@/components/RevealOnScroll";

const ASSET_TYPES = ["Watch", "Handbag", "Jewelry", "Sneakers", "Art"];

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const err = error as { shortMessage?: string; message?: string };
    return (
      err.shortMessage || err.message?.slice(0, 100) || "Transaction failed."
    );
  }
  return "Transaction failed.";
}

function BlueSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
    </svg>
  );
}

function AnimatedCheck() {
  return (
    <svg
      className="w-7 h-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#059669"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" className="draw-check" />
    </svg>
  );
}

export default function RegisterPage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const router = useRouter();
  const { writeContractAsync, isPending } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const [form, setForm] = useState({
    name: "",
    brand: "",
    serialNumber: "",
    assetType: "Watch",
    estimatedValue: "",
  });
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.brand ||
      !form.serialNumber ||
      !form.estimatedValue
    ) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerAsset",
        args: [
          form.name,
          form.brand,
          form.serialNumber,
          form.assetType,
          parseEther(form.estimatedValue),
        ],
      });
      setSuccess(Date.now());
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 pt-28 pb-16">
      <RevealOnScroll>
        <div className="flex items-center gap-2.5 mb-2">
          <FilePlus2 className="w-6 h-6 text-blue-600" strokeWidth={1.75} />
          <h1 className="text-3xl font-bold text-gray-900 tracking-card-title">
            Register an Asset
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-8">
          Create a permanent on-chain record for your item.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={0.05}>
        {!isConnected ? (
          <div className="card-soft p-8 text-center">
            <p className="text-sm text-gray-600 mb-6">
              Connect your wallet to begin.
            </p>
            <button
              onClick={() => connect({ connector: injected() })}
              className="btn-shine bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : success ? (
          <div className="card-soft p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <AnimatedCheck />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-card-title">
              Asset registered
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {form.name} is now recorded on Monad.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => router.push("/assets")}
                className="btn-shine bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
              >
                View Assets
              </button>
              <button
                onClick={() => {
                  setSuccess(null);
                  setForm({
                    name: "",
                    brand: "",
                    serialNumber: "",
                    assetType: "Watch",
                    estimatedValue: "",
                  });
                }}
                className="border border-black/[0.06] hover:border-blue-300 bg-white text-gray-700 rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
              >
                Register Another
              </button>
            </div>
          </div>
        ) : (
          <div className="card-soft p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2 block">
                Category
              </label>
              <div className="flex gap-2 flex-wrap">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, assetType: type })}
                    className={`chip-hover px-3.5 py-2 rounded-lg text-sm font-semibold ${
                      form.assetType === type
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                <Tag className="w-3.5 h-3.5" strokeWidth={2} />
                Item Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Daytona Chronograph"
                className="input-line w-full px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                Brand
              </label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Rolex"
                className="input-line w-full px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                <Hash className="w-3.5 h-3.5" strokeWidth={2} />
                Serial Number
              </label>
              <input
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
                placeholder="e.g. D4XXXXP7"
                className="input-line w-full px-3 py-2.5 text-sm text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
                <Coins className="w-3.5 h-3.5" strokeWidth={2} />
                Estimated Value (MON)
              </label>
              <input
                value={form.estimatedValue}
                onChange={(e) =>
                  setForm({ ...form, estimatedValue: e.target.value })
                }
                placeholder="e.g. 10"
                type="number"
                className="input-line w-full px-3 py-2.5 text-sm text-gray-900"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="btn-shine w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isPending && <BlueSpinner className="w-4 h-4 text-white" />}
              {isPending ? "Registering…" : "Register Asset"}
            </button>
          </div>
        )}
      </RevealOnScroll>
    </div>
  );
}
