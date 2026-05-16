"use client";
import { useAccount, useReadContract } from "wagmi";
import { Trophy } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

function shorten(addr?: string) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const RANK_STYLES: Record<number, string> = {
  1: "text-amber-500",
  2: "text-gray-400",
  3: "text-orange-600",
};

export default function VerifierLeaderboard() {
  const { address, isConnected } = useAccount();

  const { data: reputation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getReputationScore",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const repScore =
    typeof reputation === "bigint" ? Number(reputation) : 0;

  const entries = isConnected
    ? [
        {
          rank: 1,
          address: address!,
          verified: repScore,
          score: repScore,
          isYou: true,
          status: repScore > 0 ? "Trusted" : "New",
        },
      ]
    : [];

  return (
    <div className="card-soft p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-amber-500" strokeWidth={1.75} />
        <h3 className="text-lg font-bold text-gray-900 tracking-card-title">
          Verifier Leaderboard
        </h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-gray-500 py-6 text-center">
          Connect your wallet to see your rank.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold tracking-widest uppercase text-gray-400">
                <th className="px-2 py-3 w-12">Rank</th>
                <th className="px-2 py-3">Verifier</th>
                <th className="px-2 py-3 text-right">Verified</th>
                <th className="px-2 py-3 text-right">Score</th>
                <th className="px-2 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {entries.map((e) => (
                <tr key={e.address} className="hover:bg-blue-50/30 transition-colors">
                  <td
                    className={`px-2 py-3 font-black ${
                      RANK_STYLES[e.rank] ?? "text-gray-500"
                    }`}
                  >
                    #{e.rank}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-700">
                        {shorten(e.address)}
                      </span>
                      {e.isYou && (
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-blue-600">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right text-gray-900 font-semibold">
                    {e.verified}
                  </td>
                  <td className="px-2 py-3 text-right text-gray-900 font-semibold">
                    {e.score}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {e.status === "Trusted" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                        Trusted
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-50 border border-black/[0.06] text-gray-500 text-[10px] font-semibold">
                        New
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
