import React, { useState } from "react";
import { SHOP_CONFIG } from "../data/menuData";

export default function MobileAppQRModal({
  onClose,
  deferredPrompt,
  onTriggerInstall,
  isInstalled
}) {
  const [copied, setCopied] = useState(false);
  const [showManualSteps, setShowManualSteps] = useState(false);

  const appUrl = "https://pos-project-smoky.vercel.app/";
  const installUrl = "https://pos-project-smoky.vercel.app/?install=1";

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      onTriggerInstall();
    } else {
      setShowManualSteps(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/85 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border-t sm:border border-stone-700 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl text-stone-100 my-auto">
        {/* Header */}
        <div className="no-print px-5 py-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📱</span>
            <div>
              <h2 className="font-bold text-amber-50 text-base">
                Download Mobile POS App
              </h2>
              <p className="text-[11px] text-stone-400">
                Scan QR code or install directly onto Android, iPhone, or iPad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700"
          >
            ✕
          </button>
        </div>

        {/* Printable / Main Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* QR Card Container */}
          <div
            id="printable-area"
            className="bg-stone-950 border-2 border-amber-500/70 rounded-2xl p-5 flex flex-col items-center text-center shadow-xl"
          >
            <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              {SHOP_CONFIG.name}
            </div>
            <div className="text-sm font-bold text-stone-100 mt-0.5">
              Mobile Point of Sale & Barista KDS (PHP)
            </div>
            <span className="mt-2 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              SCAN TO OPEN & INSTALL APP
            </span>

            {/* Scannable High-Contrast QR Code with Center Logo */}
            <div className="relative my-4 p-3.5 bg-white rounded-2xl border-4 border-amber-500 shadow-lg">
              <img
                src="qr-code.svg"
                alt="Roast & Ritual Mobile POS App QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
                  <img
                    src="logo.svg"
                    alt="Roast & Ritual Crest"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="font-mono text-xs font-bold text-amber-300 break-all">
              {appUrl}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Works on Android, iPhone, iPad & Tablet Browsers
            </div>
          </div>

          {/* Direct One-Tap Install Button */}
          <div className="no-print space-y-3">
            {isInstalled ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-center text-xs text-emerald-200 font-bold">
                ✓ Roast & Ritual POS App is installed on this device!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition"
              >
                <span>⬇️ Install POS App on This Device</span>
              </button>
            )}

            {(showManualSteps || !deferredPrompt) && (
              <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700 text-xs space-y-2.5">
                <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  How to Install as a Full-Screen Mobile App:
                </div>
                <div className="flex items-start gap-2 text-stone-200">
                  <span className="font-bold text-emerald-400 shrink-0">🤖 Android (Chrome):</span>
                  <span>
                    Tap the <strong>⬇️ Install POS App</strong> button above, or tap the browser
                    menu <strong>(⋮)</strong> and select <strong>"Install app"</strong> /{" "}
                    <strong>"Add to Home screen"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-stone-200">
                  <span className="font-bold text-sky-400 shrink-0">🍎 iPhone / iPad (Safari):</span>
                  <span>
                    Tap the <strong>Share</strong> icon <strong>(⬆️)</strong> at the bottom of
                    Safari, scroll down, and tap <strong>"Add to Home Screen" (➕)</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Download / Print / Copy Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href="pos-mobile-qr-card.png"
                download="Roast-and-Ritual-POS-Mobile-QR.png"
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-200 text-xs font-bold text-center transition"
              >
                💾 Save QR PNG
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition"
              >
                🖨️ Print QR Card
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition"
              >
                {copied ? "✓ Link Copied!" : "🔗 Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
