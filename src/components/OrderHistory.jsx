import React, { useState, useMemo } from "react";

export default function OrderHistory({ orders, onViewReceipt, onRefundOrder }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "refunded");
    const revenue = valid.reduce((acc, o) => acc + o.total, 0);
    const tips = valid.reduce((acc, o) => acc + (o.tip || 0), 0);
    const cashTotal = valid
      .filter((o) => o.paymentMethod === "Cash")
      .reduce((acc, o) => acc + o.total, 0);
    const cardTotal = revenue - cashTotal;
    const avgTicket = valid.length > 0 ? revenue / valid.length : 0;

    return {
      count: valid.length,
      revenue,
      tips,
      cashTotal,
      cardTotal,
      avgTicket
    };
  }, [orders]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-stone-950 p-4 md:p-6 space-y-6">
      {/* Shift KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400 uppercase font-semibold">Gross Shift Sales</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            ₱{stats.revenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">{stats.count} Paid Orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400 uppercase font-semibold">Average Ticket</div>
          <div className="text-2xl font-extrabold text-stone-100 mt-1">
            ₱{stats.avgTicket.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Per transaction</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400 uppercase font-semibold">Barista Tips</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            ₱{stats.tips.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">100% distributed to crew</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400 uppercase font-semibold">Cash Drawer Sales</div>
          <div className="text-2xl font-extrabold text-stone-200 mt-1">
            ₱{stats.cashTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Physical PHP tender</div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs text-stone-400 uppercase font-semibold">Card & E-Wallet Sales</div>
          <div className="text-2xl font-extrabold text-sky-400 mt-1">
            ₱{stats.cardTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Card / GCash / Maya</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-900 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Customer Name, or Drink..."
            className="w-full px-4 py-2 rounded-xl bg-stone-950 border border-stone-700 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "queued", "brewing", "ready", "completed", "refunded"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-amber-600 text-stone-950"
                  : "bg-stone-800 text-stone-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-800/80 text-stone-400 text-xs uppercase border-b border-stone-700">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Customer & Type</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                    #{order.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-stone-100">
                      {order.customerName || "Walk-In Guest"}
                    </div>
                    <div className="text-xs text-stone-400">
                      {order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ""}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-xs text-stone-300 truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-stone-300">{order.paymentMethod}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        order.status === "completed"
                          ? "bg-stone-800 text-stone-300"
                          : order.status === "ready"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                          : order.status === "refunded"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : "bg-amber-950 text-amber-300 border border-amber-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                    ₱{order.total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => onViewReceipt(order)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold border border-stone-700 transition"
                    >
                      🧾 Receipt / Labels
                    </button>
                    {order.status !== "refunded" && (
                      <button
                        type="button"
                        onClick={() => onRefundOrder(order.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs border border-rose-800/50 transition"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
