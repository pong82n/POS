import React, { useState, useMemo } from "react";

export default function CheckoutModal({
  subtotal,
  discountAmount,
  taxAmount,
  baseTotal,
  customerName,
  orderType,
  tableNumber,
  onClose,
  onCompleteOrder
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash"); // cash | card | mobile
  const [tipMode, setTipMode] = useState("0"); // 0 | 5 | 10 | 15 | 20 | custom
  const [customTip, setCustomTip] = useState("");
  const [cashTenderedStr, setCashTenderedStr] = useState("");
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  const tipAmount = useMemo(() => {
    if (tipMode === "0") return 0;
    if (tipMode === "custom") {
      const val = parseFloat(customTip);
      return isNaN(val) || val < 0 ? 0 : Number(val.toFixed(2));
    }
    const pct = parseFloat(tipMode) / 100;
    return Number((subtotal * pct).toFixed(2));
  }, [tipMode, customTip, subtotal]);

  const finalTotal = useMemo(() => {
    return Number((baseTotal + tipAmount).toFixed(2));
  }, [baseTotal, tipAmount]);

  const cashTendered = useMemo(() => {
    if (!cashTenderedStr) return finalTotal;
    const val = parseFloat(cashTenderedStr);
    return isNaN(val) ? 0 : val;
  }, [cashTenderedStr, finalTotal]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    return Math.max(0, Number((cashTendered - finalTotal).toFixed(2)));
  }, [paymentMethod, cashTendered, finalTotal]);

  const canCompleteCash = paymentMethod !== "cash" || cashTendered >= finalTotal - 0.001;

  const quickCashAmounts = useMemo(() => {
    const exact = finalTotal;
    const nextFifty = Math.ceil(finalTotal / 50) * 50;
    const bills = [100, 200, 500, 1000, 2000];
    const validBills = bills.filter((b) => b >= finalTotal);
    const set = new Set([exact, nextFifty, ...validBills]);
    return Array.from(set).slice(0, 5);
  }, [finalTotal]);

  const handleKeypad = (key) => {
    if (key === "C") {
      setCashTenderedStr("");
      return;
    }
    if (key === "⌫") {
      setCashTenderedStr((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "." && cashTenderedStr.includes(".")) return;
    setCashTenderedStr((prev) => `${prev}${key}`);
  };

  const handleSubmit = () => {
    if (!canCompleteCash) return;

    const methodLabels = {
      cash: "Cash",
      card: "Card (•••• 4829)",
      mobile: "GCash / Maya / QR Ph"
    };

    if (paymentMethod !== "cash") {
      setIsProcessingCard(true);
      setTimeout(() => {
        setIsProcessingCard(false);
        onCompleteOrder({
          paymentMethod: methodLabels[paymentMethod],
          tip: tipAmount,
          total: finalTotal,
          amountTendered: finalTotal,
          changeDue: 0
        });
      }, 650);
    } else {
      onCompleteOrder({
        paymentMethod: "Cash",
        tip: tipAmount,
        total: finalTotal,
        amountTendered: Number(cashTendered.toFixed(2)),
        changeDue
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-stone-900 border-t sm:border border-stone-700 rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-800 border-b border-stone-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-50">
              Complete Payment & Send to Barista
            </h2>
            <p className="text-xs text-stone-400">
              {orderType} {tableNumber ? `• ${tableNumber}` : ""} • Customer:{" "}
              <span className="text-amber-300 font-medium">{customerName || "Walk-In Guest"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Column: Summary & Tip */}
          <div className="md:col-span-5 p-6 bg-stone-900/60 border-b md:border-b-0 md:border-r border-stone-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700/80 space-y-2 text-sm">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>−₱{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-300">
                  <span>12% VAT</span>
                  <span>₱{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Barista Tip</span>
                  <span>+₱{tipAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-700 flex justify-between items-baseline">
                  <span className="font-bold text-base text-white">Total Due</span>
                  <span className="text-2xl font-extrabold text-amber-400">
                    ₱{finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tip Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Add Barista Gratuity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "0", label: "No Tip" },
                    { id: "5", label: "5%" },
                    { id: "10", label: "10%" },
                    { id: "15", label: "15%" },
                    { id: "20", label: "20%" },
                    { id: "custom", label: "Custom ₱" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipMode(t.id)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
                        tipMode === t.id
                          ? "bg-amber-600/25 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                          : "bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {tipMode === "custom" && (
                  <div className="mt-2">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="Enter custom tip (₱)"
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50">
                <div className="flex justify-between items-center text-xs text-emerald-300 uppercase tracking-wider font-semibold">
                  <span>Cash Tendered</span>
                  <span>₱{cashTendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-sm font-bold text-emerald-200">Change Due</span>
                  <span className="text-2xl font-extrabold text-emerald-400">
                    ₱{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Payment Method & Tender */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Select Tender Type
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "cash", label: "💵 Cash (PHP)", sub: "Peso Bills & Coins" },
                  { id: "card", label: "💳 Credit / Debit", sub: "Visa / Mastercard" },
                  { id: "mobile", label: "📱 GCash / Maya", sub: "QR Ph / E-Wallet" }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      paymentMethod === pm.id
                        ? "bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                        : "bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-500"
                    }`}
                  >
                    <div className="text-sm font-bold">{pm.label}</div>
                    <div className="text-[11px] text-stone-400">{pm.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" ? (
              <div className="space-y-4">
                {/* Quick Bills */}
                <div>
                  <span className="block text-xs text-stone-400 mb-1.5">Quick Cash Tender (PHP)</span>
                  <div className="flex flex-wrap gap-2">
                    {quickCashAmounts.map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashTenderedStr(amt.toFixed(2))}
                        className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-xs font-bold text-amber-300 transition"
                      >
                        {idx === 0 ? `Exact (₱${amt.toFixed(2)})` : `₱${amt.toFixed(2)}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keypad */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-700">
                    <span className="text-xs text-stone-400 uppercase">Tendered Input</span>
                    <span className="text-xl font-mono font-bold text-amber-400">
                      ₱{cashTenderedStr || finalTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["7", "8", "9", "C", "4", "5", "6", "⌫", "1", "2", "3", "00", "0", "."].map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypad(key)}
                          className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                            key === "C" || key === "⌫"
                              ? "bg-rose-950/50 border-rose-800/60 text-rose-300 hover:bg-rose-900/50"
                              : "bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700"
                          } ${key === "0" ? "col-span-2" : ""}`}
                        >
                          {key}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-stone-950/70 border border-stone-800 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl">
                  {isProcessingCard ? "⏳" : paymentMethod === "card" ? "💳" : "📲"}
                </div>
                <h3 className="text-base font-bold text-amber-100">
                  {isProcessingCard
                    ? "Authorizing Terminal..."
                    : paymentMethod === "card"
                    ? "Terminal Ready — Tap, Insert, or Swipe"
                    : "Scan QR Ph (GCash / Maya)"}
                </h3>
                <p className="text-xs text-stone-400 max-w-xs">
                  Charging <span className="text-amber-300 font-bold">₱{finalTotal.toFixed(2)}</span>{" "}
                  to customer terminal #01. Click below to confirm payment.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-sm font-semibold"
              >
                Back to Cart
              </button>
              <button
                type="button"
                disabled={!canCompleteCash || isProcessingCard}
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition ${
                  !canCompleteCash || isProcessingCard
                    ? "bg-stone-700 text-stone-500 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-950/50"
                }`}
              >
                {isProcessingCard
                  ? "Processing..."
                  : `Charge ₱${finalTotal.toFixed(2)} & Print Ticket`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
