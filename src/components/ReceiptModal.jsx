import React, { useState, useEffect } from "react";
import { SHOP_CONFIG } from "../data/menuData";
import { bluetoothPrinter } from "../utils/bluetoothPrinter";

export default function ReceiptModal({ order, onClose, onNewOrder }) {
  const [printMode, setPrintMode] = useState("receipt-58"); // "receipt-58" | "receipt-80" | "stickers"
  const [printerStatus, setPrinterStatus] = useState(bluetoothPrinter.getStatus());
  const [isBtPrinting, setIsBtPrinting] = useState(false);
  const [btMsg, setBtMsg] = useState("");
  const [btError, setBtError] = useState("");

  useEffect(() => {
    return bluetoothPrinter.subscribe((status) => {
      setPrinterStatus(status);
    });
  }, []);

  // Auto-print via Bluetooth if enabled in settings
  useEffect(() => {
    if (order && printerStatus.autoPrint && printerStatus.isConnected) {
      handlePrintBluetooth();
    }
  }, [order?.id]);

  if (!order) return null;

  const formattedDate = new Date(order.createdAt).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Expand items by quantity for individual cup stickers
  const expandedStickers = [];
  order.items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      expandedStickers.push({
        ...item,
        stickerIndex: expandedStickers.length + 1
      });
    }
  });
  const totalStickers = expandedStickers.length;

  const handleSystemPrint = () => {
    window.print();
  };

  const handlePrintBluetooth = async () => {
    setIsBtPrinting(true);
    setBtMsg("");
    setBtError("");

    try {
      if (printMode === "stickers") {
        for (const st of expandedStickers) {
          const stickerData = bluetoothPrinter.buildCupSticker58mm(st, st.stickerIndex, totalStickers, order, SHOP_CONFIG);
          await bluetoothPrinter.sendRaw(stickerData);
          await new Promise((r) => setTimeout(r, 80));
        }
        setBtMsg(`✓ ${totalStickers} cup label(s) printed to ${printerStatus.printerName || "POS-58"}!`);
      } else {
        const receiptData = bluetoothPrinter.buildReceipt58mm(order, SHOP_CONFIG);
        await bluetoothPrinter.sendRaw(receiptData);
        setBtMsg(`✓ 58mm receipt printed to ${printerStatus.printerName || "Officom OC-58H"}!`);
      }
      setTimeout(() => setBtMsg(""), 4500);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setBtError(err.message || "Could not print to Bluetooth printer.");
      }
    } finally {
      setIsBtPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl text-stone-100 my-auto">
        {/* Top Bar (Hidden when printing) */}
        <div className="no-print px-5 sm:px-6 py-4 bg-stone-850 border-b border-stone-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <div>
              <h2 className="font-bold text-amber-50 text-sm sm:text-base">
                Order #{order.orderNumber} Confirmed
              </h2>
              <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                <span>{order.orderType.toUpperCase()}</span>
                <span>•</span>
                <span className={printerStatus.isConnected ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                  {printerStatus.isConnected ? `🖨️ ${printerStatus.printerName || "OC-58H"}` : "🖨️ 58mm BT Printer Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-stone-900 p-1 border border-stone-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode("receipt-58")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  printMode === "receipt-58"
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
                title="58mm Paper Roll (Officom OC-58H / POS-58)"
              >
                🧾 58mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("receipt-80")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  printMode === "receipt-80"
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                📑 80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("stickers")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  printMode === "stickers"
                    ? "bg-amber-500 text-stone-950 shadow"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                🏷️ Cup Labels ({totalStickers})
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Banners */}
        {btMsg && (
          <div className="no-print mx-5 mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs text-center font-bold">
            {btMsg}
          </div>
        )}
        {btError && (
          <div className="no-print mx-5 mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs text-center font-bold">
            {btError}
          </div>
        )}

        {/* Printable Content Container */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto flex justify-center bg-stone-950/50">
          {printMode === "stickers" ? (
            <div id="printable-area" className="w-full max-w-sm space-y-3">
              {expandedStickers.map((st, idx) => {
                const c = st.customization || {};
                return (
                  <div
                    key={idx}
                    className="bg-amber-50 text-stone-900 rounded-xl p-4 border-2 border-stone-800 shadow-md font-mono text-xs"
                  >
                    <div className="flex justify-between items-center border-b border-stone-400 pb-1.5 mb-2">
                      <div>
                        <span className="font-extrabold text-sm">#{order.orderNumber}</span>{" "}
                        <span className="font-bold uppercase">
                          {order.customerName || "Walk-In"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-stone-900 text-amber-300 font-bold rounded text-[10px]">
                        {st.stickerIndex} of {totalStickers} • {order.orderType}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-stone-950 mb-1">
                      {st.type === "drink"
                        ? `[${(c.size || "MD").toUpperCase()} / ${(c.temp || "HOT").toUpperCase()}] `
                        : ""}
                      {st.name}
                    </div>

                    {st.type === "drink" ? (
                      <div className="grid grid-cols-2 gap-1 text-[11px] bg-white/80 p-2 rounded border border-stone-300">
                        <div>
                          <span className="text-stone-500">MILK:</span>{" "}
                          <strong>{c.milkLabel}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500">SHOTS:</span>{" "}
                          <strong>{c.shotsLabel}</strong>
                        </div>
                        <div>
                          <span className="text-stone-500">SWEET:</span>{" "}
                          <strong>{c.sweetness}%</strong>
                        </div>
                        {c.temp === "iced" && (
                          <div>
                            <span className="text-stone-500">ICE:</span>{" "}
                            <strong>{c.iceLabel}</strong>
                          </div>
                        )}
                        {c.syrupLabels?.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-stone-500">SYRUP:</span>{" "}
                            <strong>{c.syrupLabels.join(", ")}</strong>
                          </div>
                        )}
                        {c.toppingLabels?.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-stone-500">TOP:</span>{" "}
                            <strong>{c.toppingLabels.join(", ")}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] bg-white/80 p-2 rounded border border-stone-300">
                        <div>
                          <span className="text-stone-500">PREP:</span>{" "}
                          <strong>{c.warmingLabel || "Standard"}</strong>
                        </div>
                        {c.spreadLabels?.length > 0 && (
                          <div>
                            <span className="text-stone-500">ADD:</span>{" "}
                            <strong>{c.spreadLabels.join(", ")}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {c.notes && (
                      <div className="mt-1.5 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-1 rounded">
                        NOTE: {c.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              id="printable-area"
              className={`bg-stone-50 text-stone-900 rounded-xl p-5 shadow-xl font-mono text-xs leading-relaxed border border-stone-300 ${
                printMode === "receipt-58" ? "w-[58mm] max-w-[58mm] text-[11px]" : "w-full max-w-sm print-80mm"
              }`}
            >
              {/* Shop Header */}
              <div className="text-center border-b border-dashed border-stone-400 pb-3 mb-3">
                <div className="flex justify-center mb-1.5">
                  <svg className="w-10 h-10 text-stone-900" viewBox="0 0 120 120" fill="none">
                    <rect x="6" y="6" width="108" height="108" rx="26" stroke="currentColor" strokeWidth="5" />
                    <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M51 42 C48 35, 55 30, 52 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M60 39 C57 31, 65 26, 61 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M69 42 C66 35, 73 30, 70 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M35 49 H81 V62 C81 75.8 69.8 87 56 87 H60 C46.2 87 35 75.8 35 62 V49 Z" fill="currentColor" />
                    <path d="M81 54 H86 C91.5 54 95 58 95 63.5 C95 69 91.5 73 86 73 H79" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                    <ellipse cx="58" cy="66" rx="8.5" ry="11" transform="rotate(-18 58 66)" fill="#fafaf9" />
                    <path d="M55 56 C53 63, 63 68, 61 76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M32 94 H88" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl font-black tracking-wider uppercase">
                  {SHOP_CONFIG.name}
                </div>
                <div className="text-[10px] text-stone-600">{SHOP_CONFIG.tagline}</div>
                <div className="text-[9px] text-stone-500 mt-0.5">{SHOP_CONFIG.address}</div>
                <div className="text-[9px] text-stone-500">Tel: {SHOP_CONFIG.phone}</div>
              </div>

              {/* Order Meta */}
              <div className="border-b border-dashed border-stone-400 pb-2 mb-2 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>ORDER #{order.orderNumber}</span>
                  <span>{order.orderType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Guest: {order.customerName || "Walk-In"}</span>
                  {order.tableNumber && <span>Pager: {order.tableNumber}</span>}
                </div>
                <div className="flex justify-between text-[9px] text-stone-500">
                  <span>Date: {formattedDate}</span>
                  <span>Barista: {order.cashier}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-b border-dashed border-stone-400 pb-2 mb-2 space-y-1.5">
                {order.items.map((item) => {
                  const c = item.customization || {};
                  return (
                    <div key={item.lineId} className="space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span className="truncate pr-1">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="shrink-0">₱{(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.type === "drink" && (
                        <div className="pl-2 text-[10px] text-stone-600 space-y-0.5">
                          <div>• {c.sizeLabel} | {c.tempLabel}</div>
                          <div>• {c.milkLabel} | {c.shotsLabel}</div>
                          {(c.sweetness !== "100" || (c.temp === "iced" && c.ice !== "regular")) && (
                            <div>• Sweet: {c.sweetnessLabel} {c.temp === "iced" ? `| ${c.iceLabel}` : ""}</div>
                          )}
                          {c.syrupLabels?.length > 0 && <div>• +Syrup: {c.syrupLabels.join(", ")}</div>}
                          {c.toppingLabels?.length > 0 && <div>• +Top: {c.toppingLabels.join(", ")}</div>}
                          {c.notes && <div className="italic font-semibold">• Note: "{c.notes}"</div>}
                        </div>
                      )}
                      {item.type === "bakery" && (
                        <div className="pl-2 text-[10px] text-stone-600 space-y-0.5">
                          {c.warmingLabel && <div>• {c.warmingLabel}</div>}
                          {c.spreadLabels?.length > 0 && <div>• +Spread: {c.spreadLabels.join(", ")}</div>}
                          {c.notes && <div className="italic font-semibold">• Note: "{c.notes}"</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-b border-dashed border-stone-400 pb-2 mb-2 space-y-0.5">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>₱{order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>DISCOUNT</span>
                    <span>-₱{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT (12%)</span>
                  <span>₱{order.tax.toFixed(2)}</span>
                </div>
                {order.tip > 0 && (
                  <div className="flex justify-between">
                    <span>BARISTA TIP</span>
                    <span>₱{order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-stone-300">
                  <span>TOTAL DUE</span>
                  <span>₱{order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Tender Details */}
              <div className="border-b border-dashed border-stone-400 pb-2 mb-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>PAYMENT</span>
                  <span className="font-bold">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>AMOUNT TENDERED</span>
                  <span>₱{(order.amountTendered || order.total).toFixed(2)}</span>
                </div>
                {order.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>CHANGE DUE</span>
                    <span>₱{order.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center space-y-0.5 text-[9px] text-stone-600">
                <div className="font-bold">WIFI: RoastAndRitual_Guest / PASS: espresso2026</div>
                <div>Thank you for visiting ROAST & RITUAL!</div>
                <div className="text-[8px] text-stone-500">58mm ESC/POS Thermal Receipt</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="no-print px-5 sm:px-6 py-4 bg-stone-800 border-t border-stone-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintBluetooth}
              disabled={isBtPrinting}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95"
            >
              <span>{isBtPrinting ? "⏳ Printing..." : "🖨️ Print to Bluetooth (58mm)"}</span>
            </button>

            <button
              type="button"
              onClick={handleSystemPrint}
              className="px-3 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition"
              title="System Print or PDF"
            >
              <span>📄 System / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNewOrder) onNewOrder();
            }}
            className="px-5 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-amber-200 font-bold text-xs sm:text-sm transition ml-auto"
          >
            Start Next Order →
          </button>
        </div>
      </div>
    </div>
  );
}
