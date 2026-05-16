"use client";
import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { monadTestnet } from "@/lib/wagmi";
import { formatEther, parseEther } from "viem";
import RevealOnScroll from "@/components/RevealOnScroll";
import VerifiedBadge from "@/components/VerifiedBadge";
import UnverifiedBadge from "@/components/UnverifiedBadge";
import { FileCheck, ShieldCheck, AlertTriangle, ArrowRightLeft, Plus, ShieldCheck as ShieldCheckIcon } from "lucide-react";

type PendingAction = "request" | "verify" | "dispute" | null;
type WriteFunctionName = "requestVerification" | "verifyAsset" | "openDispute";
type ContractTuple = Record<string, unknown> & {
  [index: number]: unknown;
  length?: number;
};
type AssetData = {
  name?: string;
  brand?: string;
  serialNumber?: string;
  assetType?: string;
  originalOwner?: string;
  registeredAt?: bigint | number | string;
};
type HistoryEntry = {
  eventType?: string;
  description?: string;
  actor?: string;
  timestamp?: bigint | number | string;
};

function shorten(addr?: string) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function safeFormatEther(v: unknown): string {
  try {
    if (typeof v === "bigint") return formatEther(v);
    if (typeof v === "string" || typeof v === "number")
      return formatEther(BigInt(v));
  } catch {}
  return "—";
}

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const err = error as { shortMessage?: string; message?: string };
    return (
      err.shortMessage || err.message?.slice(0, 120) || "Transaction failed."
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

export default function AssetsPage() {
  const { isConnected } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const [searchId, setSearchId] = useState<bigint | null>(null);
  const [bounty, setBounty] = useState("");
  const [stake, setStake] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const enabled = searchId !== null;

  const { data: asset, isLoading: assetLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAsset",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const { data: history, isLoading: historyLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getHistory",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const { data: verification, refetch: refetchVerification } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getVerification",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const { data: dispute, refetch: refetchDispute } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDispute",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const handleSearch = () => {
    const id = parseInt(tokenId);
    if (!isNaN(id)) {
      setSearchId(BigInt(id));
      setActionError("");
      setBounty("");
      setStake("");
    }
  };

  const callContract = async (
    action: PendingAction,
    functionName: WriteFunctionName,
    value: bigint,
  ) => {
    if (searchId === null) return;
    if (!isConnected) {
      setActionError("Connect your wallet first.");
      return;
    }
    setActionError("");
    setPendingAction(action);
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName,
        args: [searchId],
        value,
      });
      refetchVerification();
      refetchDispute();
    } catch (e: unknown) {
      setActionError(errorMessage(e));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRequestVerification = () => {
    if (!bounty) return setActionError("Enter a bounty amount.");
    try {
      callContract("request", "requestVerification", parseEther(bounty));
    } catch {
      setActionError("Invalid bounty amount.");
    }
  };

  const handleVerify = () => {
    if (!stake) return setActionError("Enter a stake amount.");
    try {
      callContract("verify", "verifyAsset", parseEther(stake));
    } catch {
      setActionError("Invalid stake amount.");
    }
  };

  const handleDispute = () => {
    callContract("dispute", "openDispute", parseEther("0.1"));
  };

  const isLoading = assetLoading || historyLoading;
  const assetData = asset as AssetData | undefined;
  const historyData = (Array.isArray(history) ? history : []) as HistoryEntry[];

  const v = (verification ?? {}) as ContractTuple;
  const hasExtendedVerification =
    Boolean(v?.requestedBy) ||
    Boolean(v?.bountyAmount !== undefined) ||
    (Array.isArray(v) && v.length >= 5);
  const verifierAddress = (v.verifier ?? (hasExtendedVerification ? v[2] : v[0])) as
    | string
    | undefined;
  const bountyAmount =
    v.bountyAmount ??
    v.bounty ??
    v.requestBounty ??
    (hasExtendedVerification ? v[1] : undefined);
  const stakedAmount =
    v.stakeAmount ??
    v.stakedAmount ??
    v.stake ??
    (hasExtendedVerification ? v[3] : v[1]);
  const isVerified: boolean = Boolean(
    v.isVerified ?? v.verified ?? (hasExtendedVerification ? v[4] : v[2]),
  );

  const d = (dispute ?? {}) as ContractTuple;
  const isDisputed: boolean = Boolean(d.isDisputed ?? d[0]);
  const disputeOpener = (d.disputeOpener ?? d[1]) as string | undefined;

  const hasBeenTransferred = historyData.some((e) => e.eventType === "SOLD");

  // For recent assets 0..3
  const recentIds = [0n, 1n, 2n, 3n];
  const recentAssetsData = recentIds.map((id) => {
    return {
      id,
      data: id === searchId ? assetData : undefined, // current loaded asset
      verified: isVerified,
    };
  });

  // Helpers
  const onRecentClick = (id: bigint) => {
    setSearchId(id);
    setTokenId(id.toString());
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      <RevealOnScroll>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-card-title flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-violet-500" />
          Asset Lookup
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Look up any registered asset and view its on-chain provenance.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={0.05}>
        <div className="mb-6">
          <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
            Asset ID
          </label>
          <div className="flex gap-2">
            <input
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter asset ID"
              className="input-line flex-1 px-3 py-2.5 text-sm text-gray-900 font-mono"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
            >
              Look up
            </button>
          </div>
        </div>

        {/* Recent assets */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" /> Recent Assets
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentIds.map((id) => {
              const isActive = searchId === id;
              const card = isActive ? assetData : undefined;
              if (!card) return null;
              const verified = isActive ? isVerified : false;
              return (
                <button
                  key={id.toString()}
                  onClick={() => onRecentClick(id)}
                  className={`flex flex-col bg-[#FAFBFF] rounded-lg shadow-sm p-5 text-left border-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    verified ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  <span className="uppercase text-xs font-semibold tracking-widest text-gray-600 mb-1">
                    {card.assetType || "N/A"}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate max-w-[180px]">
                    {card.name}
                  </h3>
                  <span className="text-sm text-gray-600 mb-2 truncate max-w-[180px]">
                    {card.brand}
                  </span>
                  <div className="flex items-center gap-2">
                    {verified ? <VerifiedBadge stake={safeFormatEther(stakedAmount)} /> : <UnverifiedBadge />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </RevealOnScroll>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <BlueSpinner className="w-4 h-4 text-blue-600" />
          Loading…
        </div>
      )}

      {assetData && !isLoading && (
        <div className="space-y-4">
      {/* User Journey Panels */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seller actions panel */}
        <div className="bg-[#FAFBFF] border border-blue-300 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-lg tracking-card-title">
            <FileCheck className="w-6 h-6" />
            Request Verification
          </div>
          <p className="mb-4 text-sm text-gray-700">
            Post a bounty to attract verifiers
          </p>
          <input
            type="number"
            value={bounty}
            onChange={(e) => setBounty(e.target.value)}
            placeholder="Bounty amount in MON"
            className="input-line px-3 py-2 mb-3 text-sm font-mono text-gray-900 w-full"
          />
          <button
            onClick={handleRequestVerification}
            disabled={pendingAction !== null}
            className="btn-shine bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors w-full"
          >
            {pendingAction === "request" ? "Requesting…" : "Post Bounty"}
          </button>
        </div>

        {/* Verifier actions panel */}
        <div className="bg-[#FAFBFF] border border-violet-500 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-3 text-violet-600 font-bold text-lg tracking-card-title">
            <ShieldCheck className="w-6 h-6" />
            Stake & Verify
          </div>
          <p className="mb-4 text-sm text-gray-700">
            Put your reputation on the line
          </p>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="Stake amount in MON"
            className="input-line px-3 py-2 mb-3 text-sm font-mono text-gray-900 w-full"
          />
          <button
            onClick={handleVerify}
            disabled={pendingAction !== null}
            className="btn-shine bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors w-full"
          >
            {pendingAction === "verify" ? "Staking…" : "Stake & Verify"}
          </button>
          <small className="block mt-2 text-xs text-gray-500">
            Your stake is locked until the dispute window closes
          </small>
        </div>

        {/* Buyer actions panel */}
        <div className="bg-[#FAFBFF] border border-amber-300 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold text-lg tracking-card-title">
            <AlertTriangle className="w-6 h-6" />
            Open Dispute
          </div>
          <p className="mb-2 text-sm text-gray-700">
            Received a fake item? Open a dispute.
          </p>
          <p className="mb-3 text-xs text-red-600">
            Requires 0.1 MON deposit. Only use if the item is not authentic.
          </p>
          <button
            onClick={handleDispute}
            disabled={pendingAction !== null}
            className="btn-shine border border-red-500 text-red-600 rounded-lg px-4 py-2 font-medium text-sm transition-colors w-full"
          >
            {pendingAction === "dispute" ? "Opening…" : "Open Dispute"}
          </button>
        </div>
      </div>
          <RevealOnScroll>
            <div className="card-soft p-6">
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    {assetData.assetType}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-card-title">
                    {assetData.name}
                  </h2>
                  <p className="text-sm text-gray-600">{assetData.brand}</p>
                </div>
                {isVerified ? (
                  <span className="animate-verified px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium whitespace-nowrap">
                    Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-black/[0.06] text-gray-600 text-xs font-medium whitespace-nowrap">
                    Unverified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/[0.06]">
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    Serial
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {assetData.serialNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    Asset ID
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    #{searchId?.toString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    Original Owner
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {shorten(assetData.originalOwner)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    Registered
                  </div>
                  <div className="text-sm text-gray-900">
                    {assetData.registeredAt
                      ? new Date(
                          Number(assetData.registeredAt) * 1000,
                        ).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            {isVerified ? (
              <div className="card-soft p-6">
                <span className="animate-verified px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium inline-block mb-4">
                  Verified
                </span>
                <div className="space-y-4 mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                      Verified by
                    </div>
                    <div className="text-sm font-mono text-gray-900 break-all">
                      {verifierAddress || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                      Amount staked
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                      {safeFormatEther(stakedAmount)} MON staked by verifier
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  If this item is fake, the verifier loses their entire stake.
                </p>
              </div>
            ) : (
              <div className="card-soft p-6">
                <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium inline-block mb-4">
                  Unverified
                </span>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  This asset has no verifier staking on its authenticity. Post a
                  bounty to invite expert review, or stake to verify it
                  yourself.
                </p>

                {bountyAmount !== undefined && (
                  <div className="rounded-lg border border-black/[0.06] bg-gray-50 px-3 py-2.5 mb-4 text-sm text-gray-700">
                    Current bounty:{" "}
                    <span className="font-mono">
                      {safeFormatEther(bountyAmount)} MON
                    </span>
                  </div>
                )}

                <div className="border border-black/[0.06] rounded-lg p-4 mb-3">
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-2">
                    Request Verification
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      value={bounty}
                      onChange={(e) => setBounty(e.target.value)}
                      placeholder="Bounty (MON)"
                      className="input-line flex-1 px-3 py-2 text-sm text-gray-900"
                    />
                    <button
                      onClick={handleRequestVerification}
                      disabled={pendingAction !== null}
                      className="border border-black/[0.06] hover:border-blue-600/30 bg-white text-gray-700 rounded-lg px-4 py-2 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      {pendingAction === "request" && (
                        <BlueSpinner className="w-4 h-4 text-blue-600" />
                      )}
                      {pendingAction === "request" ? "Requesting…" : "Request"}
                    </button>
                  </div>
                </div>

                <div className="border border-black/[0.06] rounded-lg p-4">
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-2">
                    Verify this Asset
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    Stake MON to vouch for authenticity. Earn the bounty if
                    accepted. Lose your stake if disputed and proven fake.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      placeholder="Your stake (MON)"
                      className="input-line flex-1 px-3 py-2 text-sm text-gray-900"
                    />
                    <button
                      onClick={handleVerify}
                      disabled={pendingAction !== null}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      {pendingAction === "verify" && (
                        <BlueSpinner className="w-4 h-4 text-white" />
                      )}
                      {pendingAction === "verify" ? "Staking…" : "Stake & Verify"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </RevealOnScroll>

          {actionError && pendingAction === null && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {actionError}
            </div>
          )}

          {isVerified && hasBeenTransferred && (
            <RevealOnScroll delay={0.1}>
              <div className="card-soft p-6">
                {isDisputed ? (
                  <div>
                    <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium inline-block mb-3">
                      Dispute Open
                    </span>
                    <p className="text-sm text-gray-900 mb-1">
                      Filed by{" "}
                      <span className="font-mono">
                        {shorten(disputeOpener)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      The verifier&apos;s stake is held in escrow pending
                      resolution.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1 tracking-card-title">
                      Received a fake?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Only open a dispute if you received a fake item. Requires
                      0.1 MON deposit.
                    </p>
                    <button
                      onClick={handleDispute}
                      disabled={pendingAction !== null}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg px-4 py-2 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {pendingAction === "dispute" && (
                        <BlueSpinner className="w-4 h-4 text-red-600" />
                      )}
                      {pendingAction === "dispute" ? "Opening…" : "Open Dispute"}
                    </button>
                  </div>
                )}
              </div>
            </RevealOnScroll>
          )}

          {historyData.length > 0 && (
            <RevealOnScroll delay={0.15}>
              <div className="card-soft p-6">
                <h3 className="text-xs uppercase tracking-label text-gray-400 mb-5">
                  Provenance · {historyData.length}{" "}
                  {historyData.length === 1 ? "record" : "records"}
                </h3>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-black/[0.06]" />
                  <div className="space-y-5">
                    {historyData.map((entry, i: number) => (
                      <div key={i} className="relative pl-7">
                        <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-white border-2 border-gray-300" />
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.eventType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {entry.timestamp
                              ? new Date(
                                  Number(entry.timestamp) * 1000,
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {entry.description}
                        </p>
                        <p className="text-xs font-mono text-gray-400">
                          {shorten(entry.actor)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          )}
        </div>
      )}

      {searchId !== null && !isLoading && !assetData && (
        <div className="text-center py-12 text-sm text-gray-500">
          No record found for ID {searchId?.toString()}.
        </div>
      )}
    </div>
  );
}
