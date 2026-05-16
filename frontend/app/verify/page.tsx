"use client";
import { useState } from "react";
import {
  useAccount,
  useConnect,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { monadTestnet } from "@/lib/wagmi";
import { formatEther, parseEther } from "viem";
import RevealOnScroll from "@/components/RevealOnScroll";

type ContractTuple = Record<string, unknown> & {
  [index: number]: unknown;
  length?: number;
};
type AssetData = {
  name?: string;
  brand?: string;
  assetType?: string;
  originalOwner?: string;
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

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  // Demo leaderboard data
  const leaderboardData = [
    { rank: 1, address: "0x1234567890abcdef1234567890abcdef1234", count: 38, reputation: 1250, status: "Trusted" },
    { rank: 2, address: "0x9876543210fedcba9876543210fedcba9876", count: 25, reputation: 870, status: "Trusted" },
    { rank: 3, address: "0xabcdefabcdefabcdefabcdefabcdefabcdef", count: 18, reputation: 520, status: "Trusted" },
    { rank: 4, address: address ?? "0x000000000000000000000000000000000000", count: 0, reputation: 0, status: "New" },
  ];

  const [tokenId, setTokenId] = useState("");
  const [searchId, setSearchId] = useState<bigint | null>(null);
  const [stake, setStake] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const enabled = searchId !== null;

  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAsset",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const {
    data: verification,
    refetch: refetchVerification,
    error: verificationError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getVerification",
    args: enabled ? [searchId!] : undefined,
    query: { enabled },
  });

  const { data: reputation, refetch: refetchReputation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getReputationScore",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const handleSearch = () => {
    const id = parseInt(tokenId);
    if (!isNaN(id)) {
      setSearchId(BigInt(id));
      setActionError("");
      setStake("");
    }
  };

  const handleStakeVerify = async () => {
    if (searchId === null) return setActionError("Enter an asset ID first.");
    if (!isConnected) return setActionError("Connect your wallet first.");
    if (!stake) return setActionError("Enter a stake amount.");

    let value: bigint;
    try {
      value = parseEther(stake);
    } catch {
      return setActionError("Invalid stake amount.");
    }

    setActionError("");
    setIsPending(true);
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "verifyAsset",
        args: [searchId],
        value,
      });
      refetchVerification();
      refetchReputation();
      setStake("");
    } catch (e: unknown) {
      setActionError(errorMessage(e));
    } finally {
      setIsPending(false);
    }
  };

  const assetData = asset as AssetData | undefined;
  const v = (verification ?? {}) as ContractTuple;
  const hasExtendedVerification =
    Boolean(v.requestedBy) ||
    Boolean(v.bountyAmount !== undefined) ||
    (Array.isArray(v) && v.length >= 5);
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
  const repScore =
    typeof reputation === "bigint"
      ? Number(reputation)
      : typeof reputation === "number"
        ? reputation
        : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
      <RevealOnScroll>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-card-title">
          Verify an Asset
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Stake MON to vouch for authenticity. Earn the bounty if you&apos;re
          right — lose your stake if you&apos;re not.
        </p>
      </RevealOnScroll>

      <RevealOnScroll delay={0.05}>
        <div className="card-soft p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
              Your Reputation
            </div>
            <div className="text-2xl font-semibold text-gray-900 tracking-card-title">
              {repScore}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isConnected ? shorten(address) : "Connect wallet to view"}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 max-w-[160px] hidden sm:block">
            Verified assets with no disputes
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
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
              className="border border-black/[0.06] hover:border-blue-600/30 bg-white text-gray-700 rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
            >
              Load
            </button>
          </div>
        </div>
      </RevealOnScroll>

      {assetLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <BlueSpinner className="w-4 h-4 text-blue-600" />
          Loading asset…
        </div>
      )}

      {(assetError || verificationError) &&
        searchId !== null &&
        !assetLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 mb-4">
            {(assetError || verificationError)?.message?.slice(0, 140) ||
              "Could not load asset details."}
          </div>
        )}

      {assetData && !assetLoading && (
        <div className="space-y-4">
          <RevealOnScroll>
            <div className="card-soft p-6">
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    {assetData.assetType} · #{searchId?.toString()}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 tracking-card-title">
                    {assetData.name}
                  </h2>
                  <p className="text-sm text-gray-600">{assetData.brand}</p>
                </div>
                {isVerified ? (
                  <span className="animate-verified px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium whitespace-nowrap">
                    Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium whitespace-nowrap">
                    Awaiting verifier
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/[0.06]">
                <div>
                  <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                    Bounty
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {safeFormatEther(bountyAmount)} MON
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
                {isVerified && (
                  <div>
                    <div className="text-xs uppercase tracking-label text-gray-400 mb-1">
                      Verifier Stake
                    </div>
                    <div className="text-sm font-mono text-gray-900">
                      {safeFormatEther(stakedAmount)} MON
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RevealOnScroll>

          {!isVerified && (
            <RevealOnScroll delay={0.05}>
              <div className="card-soft p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1 tracking-card-title">
                  Stake &amp; Verify
                </h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Higher stakes signal stronger conviction. Honest verifications
                  earn the bounty. Fraudulent ones lose the entire stake.
                </p>

                <label className="text-xs uppercase tracking-label text-gray-400 mb-2 block">
                  Your Stake (MON)
                </label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="e.g. 2"
                  className="input-line w-full px-3 py-2.5 text-sm text-gray-900 mb-4"
                />

                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 mb-4">
                    {actionError}
                  </div>
                )}

                {!isConnected ? (
                  <button
                    onClick={() => connect({ connector: injected() })}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors"
                  >
                    Connect Wallet to Verify
                  </button>
                ) : (
                  <button
                    onClick={handleStakeVerify}
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending && <BlueSpinner className="w-4 h-4 text-white" />}
                    {isPending ? "Staking…" : "Stake & Verify"}
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Your stake is locked until the next ownership transfer.
                </p>
              </div>
            </RevealOnScroll>
          )}
        </div>
      )}

      {searchId === null && !assetLoading && (
        <div className="text-center py-12 text-sm text-gray-500">
          Enter an asset ID above to begin.
        </div>
      )}

      {searchId !== null &&
        !assetLoading &&
        !assetData &&
        !assetError && (
          <div className="text-center py-12 text-sm text-gray-500">
            No asset found for ID {searchId?.toString()}.
          </div>
        )}

      {/* Verifier Leaderboard */}
      <RevealOnScroll delay={0.15}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L12 20.25 14.25 17m-4.5-13.5L12 3l4.5 4.5M18 20.4a9.001 9.001 0 11-12 0" />
            </svg>
            Verifier Leaderboard
          </h2>

          <div className="overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Verified</th>
                  <th className="px-4 py-2">Reputation</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map(({ rank, address, count, reputation, status }) => {
                  const isTop3 = rank <= 3;
                  const rankColors = ["gold", "silver", "#cd7f32"];
                  return (
                    <tr
                      key={address}
                      className="border-t border-gray-200 hover:bg-gray-100"
                    >
                      <td className={`px-4 py-2 font-bold ${isTop3 ? "text-yellow-600" : "text-gray-600"}`} style={{ color: isTop3 ? rankColors[rank - 1] : undefined }}>
                        {rank}
                      </td>
                      <td className="px-4 py-2 font-mono">
                        {address.slice(0, 6) + "…" + address.slice(-4)}
                      </td>
                      <td className="px-4 py-2">
                        {count}
                      </td>
                      <td className="px-4 py-2">
                        {reputation}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                            status === "Trusted"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
