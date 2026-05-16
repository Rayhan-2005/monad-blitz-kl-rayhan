"use client";
import { useReadContract } from "wagmi";
import { Clock } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

type AssetData = {
  name?: string;
  brand?: string;
  assetType?: string;
};

type VerificationTuple = Record<string, unknown> & {
  [index: number]: unknown;
  length?: number;
};

interface RecentAssetCardProps {
  tokenId: bigint;
  onClick: () => void;
}

function RecentAssetCard({ tokenId, onClick }: RecentAssetCardProps) {
  const { data: asset } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAsset",
    args: [tokenId],
  });

  const { data: verification } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getVerification",
    args: [tokenId],
  });

  const a = asset as AssetData | undefined;
  if (!a || !a.name) return null;

  const v = (verification ?? {}) as VerificationTuple;
  const hasExtended =
    Boolean(v.requestedBy) ||
    (Array.isArray(v) && v.length >= 5);
  const isVerified = Boolean(
    v.isVerified ?? v.verified ?? (hasExtended ? v[4] : v[2]),
  );

  return (
    <button
      onClick={onClick}
      className={`group text-left bg-white rounded-lg p-4 border-l-4 ${
        isVerified ? "border-l-blue-500" : "border-l-gray-300"
      } border-y border-r border-black/[0.06] hover:border-blue-300 hover:shadow-md transition-all w-full`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
          {a.assetType} · #{tokenId.toString()}
        </span>
        {isVerified ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
            Verified
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-black/[0.06] text-gray-500 text-[10px] font-semibold">
            Unverified
          </span>
        )}
      </div>
      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
        {a.name}
      </div>
      <div className="text-xs text-gray-600">{a.brand}</div>
    </button>
  );
}

interface RecentAssetsProps {
  onSelect: (id: string) => void;
  ids?: bigint[];
}

export default function RecentAssets({
  onSelect,
  ids = [0n, 1n, 2n, 3n],
}: RecentAssetsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-blue-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900 tracking-card-title">
          Recent Assets
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ids.map((id) => (
          <RecentAssetCard
            key={String(id)}
            tokenId={id}
            onClick={() => onSelect(String(id))}
          />
        ))}
      </div>
    </div>
  );
}
