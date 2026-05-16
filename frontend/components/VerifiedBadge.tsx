import { ShieldCheck } from "lucide-react";

export default function VerifiedBadge({ stake }: { stake: string }) {
  return (
    <div className="inline-flex flex-col items-center text-emerald-700">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
        <ShieldCheck className="w-8 h-8" />
        <span className="absolute animate-ping rounded-full ring-2 ring-emerald-500/30 ring-offset-2 inset-0" />
      </div>
      <span className="uppercase text-xs font-semibold tracking-widest mt-2">
        VERIFIED ON MONAD
      </span>
      <span className="text-sm font-semibold mt-1">
        {stake} MON guaranteed by verifier
      </span>
      <a
        href="https://testnet.monadexplorer.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 underline mt-1"
      >
        Verify on Explorer
      </a>
    </div>
  );
}
