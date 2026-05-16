import { AlertCircle } from "lucide-react";

export default function UnverifiedBadge() {
  return (
    <div className="inline-flex flex-col items-center text-amber-700">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
        <AlertCircle className="w-8 h-8" />
      </div>
      <span className="uppercase text-xs font-semibold tracking-widest mt-2">
        AWAITING VERIFICATION
      </span>
    </div>
  );
}
