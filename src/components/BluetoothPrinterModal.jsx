import React, { useState, useEffect } from "react";
import { bluetoothPrinter } from "../utils/bluetoothPrinter";
import { SHOP_CONFIG } from "../data/menuData";

export default function BluetoothPrinterModal({ isOpen, onClose }) {
  const [printerStatus, setPrinterStatus] = useState(bluetoothPrinter.getStatus());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    return bluetoothPrinter.subscribe((status) => {
      setPrinterStatus(status);
    });
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      const res = await bluetoothPrinter.connect();
      setStatusMsg(`✓ Connected to ${res.printerName || "58mm Thermal Printer"}!`);
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setErrorMsg(err.message || "Could not connect to Bluetooth printer.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinter.disconnect();
    setStatusMsg("Printer disconnected.");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setErrorMsg("");
    setStatusMsg("");
    try {
      await bluetoothPrinter.printTestSlip(SHOP_CONFIG);
      setStatusMsg("✓ Test receipt sent to printer!");
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to print test slip. Make sure printer is turned on and in range.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleAutoPrint = (e) => {
    bluetoothPrinter.setAutoPrint(e.target.checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-stone-100 my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg">
              🖨️
            </span>
            <div>
              <h2 className="text-base font-bold text-amber-50">
                58mm Bluetooth Thermal Printer
              </h2>
              <p className="text-[11px] text-stone-400">
                Officom OC-58H • POS-58 • GOOJPRT • ESC/POS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            printerStatus.isConnected
              ? "bg-emerald-950/30 border-emerald-500/50"
              : "bg-stone-950/80 border-stone-800"
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${
                printerStatus.isConnected ? "bg-emerald-400 animate-pulse" : "bg-stone-600"
              }`}></span>
              <div>
                <div className="font-bold text-sm text-stone-100">
                  {printerStatus.isConnected
                    ? printerStatus.printerName || "Connected (58mm)"
                    : "No Printer Connected"}
                </div>
                <div className="text-[11px] text-stone-400">
                  {printerStatus.isConnected
                    ? "Ready to print receipts & stickers"
                    : "Pair with Officom OC-58H or POS-58"}
                </div>
              </div>
            </div>

            {printerStatus.isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold transition"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold shadow transition flex items-center gap-1.5"
              >
                <span>{isConnecting ? "Pairing..." : "Connect →"}</span>
              </button>
            )}
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-center font-bold">
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestPrint}
              disabled={isTesting}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-amber-200 font-bold flex items-center justify-center gap-2 transition"
            >
              <span>{isTesting ? "Printing Test..." : "🧪 Print 58mm Test Receipt"}</span>
            </button>

            {/* Auto Print Toggle */}
            <label className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-stone-200">⚡ Auto-Print on Checkout</div>
                <div className="text-[11px] text-stone-400">
                  Immediately print 58mm slip when order is paid
                </div>
              </div>
              <input
                type="checkbox"
                checked={printerStatus.autoPrint}
                onChange={handleToggleAutoPrint}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </label>
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800 space-y-1.5 text-[11px] text-stone-300">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
              How to pair Officom OC-58H or POS-58:
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-stone-400 leading-relaxed">
              <li>Turn on the printer with a 58mm paper roll inserted.</li>
              <li>Turn on Bluetooth on your Android phone, tablet, or PC.</li>
              <li>Pair printer in Bluetooth settings (PIN is usually <code className="text-amber-300 font-mono">0000</code> or <code className="text-amber-300 font-mono">1234</code>).</li>
              <li>Tap <strong>Connect</strong> above and select <strong>OC-58H</strong> or <strong>POS-58</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-850 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
