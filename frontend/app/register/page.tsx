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
      className="w-6 h-6"
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
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-card-title">
          Register an Asset
        </h1>
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : success ? (
          <div className="card-soft p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <AnimatedCheck />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-card-title">
              Asset registered
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {form.name} is now recorded on Monad.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => router.push("/assets")}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
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
                className="border border-black/[0.06] hover:border-blue-600/30 bg-white text-gray-700 rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
              >
                Register Another
              </button>
            </div>
          </div>
        ) : (
          <div className="card-soft p-6 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
                Category
              </label>
              <div className="flex gap-2 flex-wrap">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, assetType: type })}
                    className={`chip-hover px-3 py-1.5 rounded-md text-sm font-medium ${
                      form.assetType === type
                        ? "bg-blue-600 text-white"
                        : "border border-black/[0.06] bg-white text-gray-700 hover:border-blue-600/30"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
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
              <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
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
              <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
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
              <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
