"use client";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

export default function StatsBar() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTotalAssets",
  });

  const total =
    typeof totalAssets === "bigint" ? Number(totalAssets) : 0;

  const stats = [
    { label: "Assets Registered", value: total.toString() },
    { label: "Total Verified", value: "0" },
    { label: "Block Time", value: "0.4s" },
  ];

  return (
    <section className="bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 sm:divide-x divide-white/10">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:px-6">
              <div className="text-5xl font-black text-blue-400 mb-2">
                {s.value}
              </div>
              <div className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
