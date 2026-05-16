import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/[0.06] bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black text-lg">
            M
          </div>
          <div className="text-center md:text-left">
            <div className="text-sm font-semibold text-gray-900">
              Built on Monad Testnet
            </div>
            <div className="text-xs text-gray-500">
              10,000 TPS · 0.4s finality
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link
            href="https://github.com/Rayhan-2005/monad-blitz-kl-rayhan"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="https://testnet.monadexplorer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
          >
            Explorer
          </Link>
          <Link
            href="https://docs.monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
          >
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
