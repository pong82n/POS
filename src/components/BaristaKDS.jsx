import React, { useState, useEffect } from "react";

export default function BaristaKDS({
  orders,
  onUpdateOrderStatus,
  onToggleItemCompleted,
  onToggleOrderPriority,
  onViewReceipt
}) {
  const [now, setNow] = useState(Date.now());
  const [filterMode, setFilterMode] = useState("active"); // active | all

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedText = (createdAt) => {
    const diffSec = Math.max(0, Math.floor((now - createdAt) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const getUrgencyBadge = (createdAt, status) => {
    if (status === "ready" || status === "completed") {
      return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
    }
    const mins = (now - createdAt) / 60000;
    if (mins >= 6) return "bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse";
    if (mins >= 3) return "bg-amber-950/90 text-amber-300 border-amber-600";
    return "bg-stone-800 text-stone-300 border-stone-700";
  };

  const activeOrders = orders.filter((o) =>
    filterMode === "active" ? o.status !== "completed" : true
  );

  // Sort priority first, then oldest first
  const sortTickets = (list) =>
    [...list].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return a.createdAt - b.createdAt;
    });

  const lanes = [
    {
      id: "queued",
      title: "New / Queued",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      items: sortTickets(activeOrders.filter((o) => o.status === "queued"))
    },
    {
      id: "brewing",
      title: "On Bar / Brewing",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      items: sortTickets(activeOrders.filter((o) => o.status === "brewing"))
    },
    {
      id: "ready",
      title: "Handoff Counter (Ready)",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      items: sortTickets(activeOrders.filter((o) => o.status === "ready"))
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-950 p-4 md:p-6">
      {/* KDS Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-800">
        <div>
          <h1 className="text-xl font-bold text-amber-50 flex items-center gap-2.5">
            <span>☕ Barista Kitchen Display System (KDS)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-medium">
              Live Sync
            </span>
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Click individual items to cross them off as you steam/pull shots, or bump tickets across stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs">
            <span className="flex items-center gap-1.5 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Queued: <strong>{lanes[0].items.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Brewing: <strong>{lanes[1].items.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Ready: <strong>{lanes[2].items.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column KDS Board */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-hidden">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="flex flex-col rounded-2xl bg-stone-900/70 border border-stone-800/90 overflow-hidden"
          >
            {/* Lane Header */}
            <div className="px-4 py-3 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
              <span className="font-bold text-sm text-stone-100">{lane.title}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${lane.badgeColor}`}
              >
                {lane.items.length}
              </span>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {lane.items.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-stone-500 text-xs border border-dashed border-stone-800 rounded-xl">
                  <span className="text-2xl mb-1">✨</span>
                  <span>No tickets in {lane.title}</span>
                </div>
              ) : (
                lane.items.map((order) => {
                  const allItemsChecked = order.items.every((i) => i.completed);
                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border transition shadow-lg overflow-hidden ${
                        order.priority
                          ? "bg-stone-900 border-rose-500/80 ring-1 ring-rose-500/40"
                          : "bg-stone-900 border-stone-700/80"
                      }`}
                    >
                      {/* Ticket Top Header */}
                      <div
                        className={`px-4 py-2.5 flex items-center justify-between border-b ${
                          order.priority
                            ? "bg-rose-950/50 border-rose-800/60"
                            : "bg-stone-800/80 border-stone-700/70"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-amber-300">
                              #{order.orderNumber}
                            </span>
                            <span className="font-bold text-sm text-white truncate max-w-[130px]">
                              {order.customerName || "Walk-In"}
                            </span>
                            {order.priority && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-rose-600 text-white rounded">
                                RUSH
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {order.orderType}
                            {order.tableNumber ? ` • ${order.tableNumber}` : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Toggle Rush Priority"
                            onClick={() => onToggleOrderPriority(order.id)}
                            className={`px-2 py-1 rounded text-xs border transition ${
                              order.priority
                                ? "bg-rose-600 text-white border-rose-500"
                                : "bg-stone-800 text-stone-400 border-stone-700 hover:text-white"
                            }`}
                          >
                            🔥
                          </button>
                          <button
                            type="button"
                            title="Print Cup Labels / Receipt"
                            onClick={() => onViewReceipt(order)}
                            className="px-2 py-1 rounded text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                          >
                            🏷️
                          </button>
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono font-bold border ${getUrgencyBadge(
                              order.createdAt,
                              order.status
                            )}`}
                          >
                            ⏱ {getElapsedText(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Items */}
                      <div className="p-3 space-y-2">
                        {order.items.map((item) => {
                          const c = item.customization || {};
                          return (
                            <div
                              key={item.lineId}
                              onClick={() => onToggleItemCompleted(order.id, item.lineId)}
                              className={`p-2.5 rounded-lg border cursor-pointer transition select-none ${
                                item.completed
                                  ? "bg-stone-950/60 border-stone-800 opacity-55"
                                  : "bg-stone-800/50 border-stone-700 hover:border-amber-500/60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold border ${
                                      item.completed
                                        ? "bg-emerald-500 border-emerald-500 text-stone-950"
                                        : "border-stone-500 text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <div>
                                    <div
                                      className={`font-bold text-sm ${
                                        item.completed
                                          ? "line-through text-stone-400"
                                          : "text-amber-100"
                                      }`}
                                    >
                                      {item.quantity}x {item.name}
                                    </div>

                                    {item.type === "drink" && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            c.temp === "iced"
                                              ? "bg-sky-950 text-sky-300 border border-sky-700/60"
                                              : "bg-orange-950 text-orange-300 border border-orange-700/60"
                                          }`}
                                        >
                                          {c.size?.toUpperCase()} • {c.tempLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-700 text-stone-200">
                                          {c.milkLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-700 text-amber-300">
                                          {c.shotsLabel}
                                        </span>
                                        {c.sweetness !== "100" && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-stone-300">
                                            Sweet: {c.sweetness}%
                                          </span>
                                        )}
                                        {c.temp === "iced" && c.ice !== "regular" && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-900/50 text-sky-200">
                                            {c.iceLabel}
                                          </span>
                                        )}
                                        {c.syrupLabels?.map((s, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/90 text-amber-300 border border-amber-700/50"
                                          >
                                            +{s}
                                          </span>
                                        ))}
                                        {c.toppingLabels?.map((t, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-200 border border-purple-700/50"
                                          >
                                            +{t}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {item.type === "bakery" && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300">
                                          {c.warmingLabel || "Warmed"}
                                        </span>
                                        {c.spreadLabels?.map((sp, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-stone-700 text-stone-200"
                                          >
                                            +{sp}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {c.notes && (
                                      <div className="mt-1.5 px-2 py-1 rounded bg-rose-950/80 border border-rose-700/60 text-[11px] text-rose-200 font-semibold">
                                        ⚠️ Note: {c.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ticket Action Footer */}
                      <div className="px-3 py-2.5 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between gap-2">
                        {order.status === "queued" && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus(order.id, "brewing")}
                            className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow transition"
                          >
                            Start Brewing →
                          </button>
                        )}
                        {order.status === "brewing" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, "queued")}
                              className="px-3 py-2 rounded-lg border border-stone-700 text-stone-400 hover:text-white text-xs"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, "ready")}
                              className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${
                                allItemsChecked
                                  ? "bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-lg"
                                  : "bg-emerald-700/80 hover:bg-emerald-600 text-white"
                              }`}
                            >
                              ✓ Mark Ready for Handoff
                            </button>
                          </>
                        )}
                        {order.status === "ready" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, "brewing")}
                              className="px-3 py-2 rounded-lg border border-stone-700 text-stone-400 hover:text-white text-xs"
                            >
                              ← Recall
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, "completed")}
                              className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-amber-200 font-bold text-xs transition"
                            >
                              Picked Up / Complete Archive ✓
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
