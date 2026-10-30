import React, { useState, useEffect, useMemo } from "react";
import {
  SHOP_CONFIG,
  CATEGORIES,
  MENU_ITEMS,
  MODIFIERS,
  DISCOUNT_PRESETS,
  INITIAL_ORDERS
} from "./data/menuData";
import CustomizationModal from "./components/CustomizationModal";
import CheckoutModal from "./components/CheckoutModal";
import ReceiptModal from "./components/ReceiptModal";
import BaristaKDS from "./components/BaristaKDS";
import OrderHistory from "./components/OrderHistory";

export default function App() {
  const [activeTab, setActiveTab] = useState("pos"); // pos | kds | history
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("all"); // all | popular | hot | iced

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("Dine-In");
  const [tableNumber, setTableNumber] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState("none");
  const [heldOrders, setHeldOrders] = useState([]);

  // Modals State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [editingCartLine, setEditingCartLine] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Orders Queue & History (persisted in localStorage)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("roast_ritual_orders_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("roast_ritual_orders_v1", JSON.stringify(orders));
    } catch (e) {
      // ignore
    }
  }, [orders]);

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (quickFilter === "popular" && !item.popular) return false;
      if (quickFilter === "hot" && item.defaultTemp !== "hot") return false;
      if (quickFilter === "iced" && item.defaultTemp !== "iced") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, quickFilter, searchQuery]);

  // Quick Add default item to Cart
  const handleQuickAdd = (item, e) => {
    e.stopPropagation();
    let customization = {};
    if (item.type === "drink") {
      const milkObj = MODIFIERS.milks.find((m) => m.id === (item.defaultMilk || "whole"));
      const shotObj = MODIFIERS.shots.find((s) => s.id === (item.defaultShots || "standard"));
      customization = {
        size: "md",
        sizeLabel: "Medium (16 oz)",
        temp: item.defaultTemp || "hot",
        tempLabel: item.defaultTemp === "iced" ? "Iced" : "Hot",
        milk: item.defaultMilk || "whole",
        milkLabel: milkObj ? milkObj.name : "Whole Milk",
        shots: item.defaultShots || "standard",
        shotsLabel: shotObj ? shotObj.name : "Standard Double (2)",
        sweetness: "100",
        sweetnessLabel: "100% Standard",
        ice: item.defaultTemp === "iced" ? "regular" : "none",
        iceLabel: item.defaultTemp === "iced" ? "Regular Ice" : "",
        syrups: item.defaultSyrups || [],
        syrupLabels: (item.defaultSyrups || [])
          .map((id) => MODIFIERS.syrups.find((s) => s.id === id)?.name)
          .filter(Boolean),
        toppings: item.defaultToppings || [],
        toppingLabels: (item.defaultToppings || [])
          .map((id) => MODIFIERS.toppings.find((t) => t.id === id)?.name)
          .filter(Boolean),
        notes: ""
      };
    } else if (item.type === "bakery") {
      customization = {
        warming: "warmed",
        warmingLabel: "Warmed in Oven",
        spreads: [],
        spreadLabels: [],
        notes: ""
      };
    } else {
      customization = { notes: "" };
    }

    const newLine = {
      lineId: `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      type: item.type,
      quantity: 1,
      unitPrice: item.price,
      completed: false,
      customization
    };
    setCart((prev) => [...prev, newLine]);
  };

  // Save Customized Item
  const handleSaveCustomized = (lineItem) => {
    if (editingCartLine) {
      setCart((prev) =>
        prev.map((c) => (c.lineId === editingCartLine.lineId ? lineItem : c))
      );
    } else {
      setCart((prev) => [...prev, lineItem]);
    }
    setCustomizingItem(null);
    setEditingCartLine(null);
  };

  // Edit existing cart line
  const handleEditCartLine = (line) => {
    const baseItem = MENU_ITEMS.find((m) => m.id === line.itemId);
    if (!baseItem) return;
    setEditingCartLine(line);
    setCustomizingItem(baseItem);
  };

  // Update quantity in cart
  const handleUpdateQty = (lineId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.lineId === lineId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  // Hold / Park Current Order
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const held = {
      id: `HOLD-${Date.now()}`,
      customerName: customerName || `Guest #${heldOrders.length + 1}`,
      orderType,
      tableNumber,
      cart,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setHeldOrders((prev) => [held, ...prev]);
    setCart([]);
    setCustomerName("");
    setTableNumber("");
    setSelectedDiscountId("none");
  };

  const handleRecallHeldOrder = (held) => {
    setCart(held.cart);
    setCustomerName(held.customerName);
    setOrderType(held.orderType);
    setTableNumber(held.tableNumber);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
  };

  // Totals Calculation
  const subtotal = useMemo(() => {
    return Number(
      cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    );
  }, [cart]);

  const discountAmount = useMemo(() => {
    const preset = DISCOUNT_PRESETS.find((d) => d.id === selectedDiscountId);
    if (!preset || preset.value === 0 || subtotal === 0) return 0;
    if (preset.type === "percent") {
      return Number(((subtotal * preset.value) / 100).toFixed(2));
    }
    return Math.min(subtotal, Number(preset.value.toFixed(2)));
  }, [subtotal, selectedDiscountId]);

  const taxableSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const taxAmount = Number((taxableSubtotal * SHOP_CONFIG.taxRate).toFixed(2));
  const baseTotal = Number((taxableSubtotal + taxAmount).toFixed(2));

  // Complete Checkout
  const handleCompleteOrder = (paymentDetails) => {
    const nextNum = 1001 + orders.length + Math.floor(Math.random() * 10);
    const newOrder = {
      id: `ORD-${nextNum}`,
      orderNumber: String(nextNum),
      customerName: customerName.trim() || "Walk-In Guest",
      orderType,
      tableNumber: tableNumber.trim(),
      status: "queued",
      priority: false,
      createdAt: Date.now(),
      cashier: SHOP_CONFIG.cashierName,
      paymentMethod: paymentDetails.paymentMethod,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      tip: paymentDetails.tip,
      total: paymentDetails.total,
      amountTendered: paymentDetails.amountTendered,
      changeDue: paymentDetails.changeDue,
      items: cart
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsCheckoutOpen(false);
    setReceiptOrder(newOrder);
    setCart([]);
    setCustomerName("");
    setTableNumber("");
    setSelectedDiscountId("none");
  };

  // KDS Handlers
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              items:
                newStatus === "ready" || newStatus === "completed"
                  ? o.items.map((i) => ({ ...i, completed: true }))
                  : o.items
            }
          : o
      )
    );
  };

  const handleToggleItemCompleted = (orderId, lineId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((i) =>
                i.lineId === lineId ? { ...i, completed: !i.completed } : i
              )
            }
          : o
      )
    );
  };

  const handleToggleOrderPriority = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, priority: !o.priority } : o))
    );
  };

  const handleRefundOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "refunded" } : o))
    );
  };

  const activeKdsCount = orders.filter(
    (o) => o.status === "queued" || o.status === "brewing" || o.status === "ready"
  ).length;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-stone-950 text-stone-100 select-none">
      {/* Top POS Navigation Header */}
      <header className="no-print h-16 px-5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black text-xl shadow-md">
            ☕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-amber-50 text-base">
                {SHOP_CONFIG.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700 font-mono">
                {SHOP_CONFIG.registerId}
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              Barista on Shift: <strong className="text-stone-200">{SHOP_CONFIG.cashierName}</strong>
            </div>
          </div>
        </div>

        {/* Main View Switcher */}
        <nav className="flex items-center gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "pos"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <span>🖥️ POS Register</span>
            {cart.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-amber-400 text-[10px]">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kds")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "kds"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <span>🔥 Barista KDS Queue</span>
            {activeKdsCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "kds"
                    ? "bg-stone-950 text-amber-400"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {activeKdsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <span>🧾 Receipts & Shift Sales</span>
          </button>
        </nav>

        {/* Held Orders & Status */}
        <div className="hidden md:flex items-center gap-3">
          {heldOrders.length > 0 && (
            <div className="flex items-center gap-1.5">
              {heldOrders.slice(0, 2).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleRecallHeldOrder(h)}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>⏸ Recall: {h.customerName}</span>
                </button>
              ))}
            </div>
          )}
          <div className="text-right text-xs text-stone-400 font-mono">
            {new Date().toLocaleDateString([], { month: "short", day: "numeric" })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === "pos" && (
        <div className="no-print flex-1 flex overflow-hidden">
          {/* LEFT / CENTER: Categories + Menu Grid */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-stone-800">
            {/* Search & Quick Filter Bar */}
            <div className="p-4 bg-stone-900/60 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drinks, pastries, or SKU (e.g. Matcha, Latte, ESP-101)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-700 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-3 top-2.5 text-stone-500 text-sm">🔍</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: "All" },
                  { id: "popular", label: "⭐ Popular" },
                  { id: "hot", label: "🔥 Hot" },
                  { id: "iced", label: "🧊 Iced" }
                ].map((qf) => (
                  <button
                    key={qf.id}
                    type="button"
                    onClick={() => setQuickFilter(qf.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      quickFilter === qf.id
                        ? "bg-amber-500/20 border-amber-500 text-amber-200"
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="px-4 py-2.5 bg-stone-900/30 border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50"
                      : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setEditingCartLine(null);
                    setCustomizingItem(item);
                  }}
                  className="group relative rounded-2xl bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/60 p-4 flex flex-col justify-between cursor-pointer transition shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-inner shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.sku.split("-")[0]}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-base font-extrabold text-amber-400">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {item.calories > 0 ? `${item.calories} cal` : item.sku}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span className="inline-block mb-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}

                    <h3 className="font-bold text-sm text-stone-100 group-hover:text-amber-200 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-400/90 font-semibold group-hover:underline">
                      ⚙️ Customize
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-xs font-bold border border-stone-700 hover:border-amber-400 transition"
                    >
                      + Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Current Order Cart & Checkout Ticket */}
          <div className="w-full max-w-md bg-stone-900 flex flex-col h-full shrink-0">
            {/* Customer & Order Type Header */}
            <div className="p-4 bg-stone-900 border-b border-stone-800 space-y-3">
              <div className="grid grid-cols-4 gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                {["Dine-In", "Takeout", "Pickup", "Drive-Thru"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                      orderType === type
                        ? "bg-amber-500 text-stone-950"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (for Cup Label)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Tbl / Pager #"
                  className="w-24 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-stone-800/60 flex items-center justify-center text-2xl mb-3">
                    ☕
                  </div>
                  <p className="text-sm font-semibold text-stone-400">Current Ticket is Empty</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Tap any drink or pastry on the left to customize size, milk, espresso shots, and syrups.
                  </p>
                </div>
              ) : (
                cart.map((line) => {
                  const c = line.customization || {};
                  return (
                    <div
                      key={line.lineId}
                      className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-stone-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => handleEditCartLine(line)}
                          className="cursor-pointer flex-1"
                        >
                          <div className="font-bold text-sm text-amber-100 hover:text-amber-300 flex items-center gap-1.5">
                            <span>{line.name}</span>
                            <span className="text-[10px] text-stone-500 font-normal underline">
                              Edit
                            </span>
                          </div>

                          {line.type === "drink" && (
                            <div className="text-[11px] text-stone-400 mt-1 space-y-0.5">
                              <div className="text-amber-400/90 font-medium">
                                {c.sizeLabel} • {c.tempLabel} • {c.milkLabel}
                              </div>
                              <div>
                                {c.shotsLabel}
                                {c.sweetness !== "100" ? ` • ${c.sweetnessLabel}` : ""}
                                {c.temp === "iced" && c.ice !== "regular"
                                  ? ` • ${c.iceLabel}`
                                  : ""}
                              </div>
                              {c.syrupLabels?.length > 0 && (
                                <div className="text-stone-300">
                                  + Syrup: {c.syrupLabels.join(", ")}
                                </div>
                              )}
                              {c.toppingLabels?.length > 0 && (
                                <div className="text-stone-300">
                                  + Top: {c.toppingLabels.join(", ")}
                                </div>
                              )}
                            </div>
                          )}

                          {line.type === "bakery" && (
                            <div className="text-[11px] text-stone-400 mt-1">
                              {c.warmingLabel}
                              {c.spreadLabels?.length > 0
                                ? ` • +${c.spreadLabels.join(", ")}`
                                : ""}
                            </div>
                          )}

                          {c.notes && (
                            <div className="mt-1 text-[11px] italic text-rose-300">
                              Note: "{c.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-sm text-amber-400">
                            ${(line.unitPrice * line.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center bg-stone-900 border border-stone-700 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.lineId, -1)}
                              className="px-2 py-0.5 text-xs font-bold text-stone-400 hover:text-white"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs font-bold text-stone-100">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.lineId, 1)}
                              className="px-2 py-0.5 text-xs font-bold text-stone-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Discount, Totals & Checkout Button */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 space-y-3">
              {/* Discount Selector */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-stone-400 font-medium">Promo / Discount:</span>
                <select
                  value={selectedDiscountId}
                  onChange={(e) => setSelectedDiscountId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                >
                  {DISCOUNT_PRESETS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs border-t border-stone-800 pt-2.5">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount Applied</span>
                    <span>−${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>Tax (8.5%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline text-base font-extrabold text-white pt-1">
                  <span>Total Due</span>
                  <span className="text-xl text-amber-400">${baseTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setCart([])}
                  className="py-3 rounded-xl border border-stone-800 bg-stone-900 hover:bg-rose-950/50 hover:border-rose-800 text-stone-400 hover:text-rose-300 text-xs font-bold disabled:opacity-40 transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleHoldOrder}
                  className="py-3 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold disabled:opacity-40 transition"
                >
                  ⏸ Hold
                </button>
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckoutOpen(true)}
                  className="col-span-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-extrabold text-sm shadow-lg shadow-amber-950/40 transition"
                >
                  Pay ${baseTotal.toFixed(2)} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "kds" && (
        <BaristaKDS
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onToggleItemCompleted={handleToggleItemCompleted}
          onToggleOrderPriority={handleToggleOrderPriority}
          onViewReceipt={(ord) => setReceiptOrder(ord)}
        />
      )}

      {activeTab === "history" && (
        <OrderHistory
          orders={orders}
          onViewReceipt={(ord) => setReceiptOrder(ord)}
          onRefundOrder={handleRefundOrder}
        />
      )}

      {/* Modals */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          initialEditItem={editingCartLine}
          onClose={() => {
            setCustomizingItem(null);
            setEditingCartLine(null);
          }}
          onSave={handleSaveCustomized}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          baseTotal={baseTotal}
          customerName={customerName}
          orderType={orderType}
          tableNumber={tableNumber}
          onClose={() => setIsCheckoutOpen(false)}
          onCompleteOrder={handleCompleteOrder}
        />
      )}

      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
          onNewOrder={() => setActiveTab("pos")}
        />
      )}
    </div>
  );
}
