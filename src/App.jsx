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
import MobileAppQRModal from "./components/MobileAppQRModal";

function BrandLogo({ className = "w-11 h-11" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rrGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="rrBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#29201B" />
          <stop offset="100%" stopColor="#120E0C" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        rx="28"
        fill="url(#rrBg)"
        stroke="url(#rrGold)"
        strokeWidth="3.5"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="url(#rrGold)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <path
        d="M26 72 C20 56, 26 38, 40 32 C38 48, 34 62, 26 72 Z"
        fill="url(#rrGold)"
        opacity="0.28"
      />
      <path
        d="M94 72 C100 56, 94 38, 80 32 C82 48, 86 62, 94 72 Z"
        fill="url(#rrGold)"
        opacity="0.28"
      />
      <path
        d="M51 42 C48 35, 55 30, 52 22"
        stroke="url(#rrGold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60 39 C57 31, 65 26, 61 17"
        stroke="url(#rrGold)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M69 42 C66 35, 73 30, 70 22"
        stroke="url(#rrGold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M35 49 H81 V62 C81 75.8 69.8 87 56 87 H60 C46.2 87 35 75.8 35 62 V49 Z"
        fill="url(#rrGold)"
      />
      <path
        d="M81 54 H86 C91.5 54 95 58 95 63.5 C95 69 91.5 73 86 73 H79"
        stroke="url(#rrGold)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="58"
        cy="66"
        rx="9"
        ry="11.5"
        transform="rotate(-18 58 66)"
        fill="#1C1410"
      />
      <path
        d="M55 56 C53 63, 63 68, 61 76"
        stroke="url(#rrGold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M32 94 H88"
        stroke="url(#rrGold)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M42 100 H78"
        stroke="url(#rrGold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export default function App() {
  // activeTab: "pos" | "cart" (mobile ticket view) | "kds" | "history"
  const [activeTab, setActiveTab] = useState("pos");
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
  const [isQrModalOpen, setIsQrModalOpen] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("install") === "1";
    } catch (e) {
      return false;
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [autoUpdateCountdown, setAutoUpdateCountdown] = useState(null);

  useEffect(() => {
    const handleUpdate = (e) => {
      const detail = e?.detail || { source: "service-worker" };
      setUpdateInfo(detail);
    };
    const handleRefreshed = () => {
      if (cart.length === 0) {
        if (window.triggerAppAutoUpdate) {
          window.triggerAppAutoUpdate("controllerchange-idle");
        } else {
          window.location.reload();
        }
      } else {
        setUpdateInfo({ source: "service-worker" });
      }
    };
    window.addEventListener("posAppUpdateDetected", handleUpdate);
    window.addEventListener("swUpdateAvailable", handleUpdate);
    window.addEventListener("swRefreshed", handleRefreshed);
    return () => {
      window.removeEventListener("posAppUpdateDetected", handleUpdate);
      window.removeEventListener("swUpdateAvailable", handleUpdate);
      window.removeEventListener("swRefreshed", handleRefreshed);
    };
  }, [cart.length]);

  // Seamless auto-update countdown when idle (cart is empty)
  useEffect(() => {
    if (!updateInfo) return;
    if (cart.length === 0) {
      setAutoUpdateCountdown(3);
      const timer = setInterval(() => {
        setAutoUpdateCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (window.triggerAppAutoUpdate) {
              window.triggerAppAutoUpdate("countdown-complete");
            } else {
              window.location.reload();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setAutoUpdateCountdown(null);
    }
  }, [updateInfo, cart.length]);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Orders Queue & History (persisted in localStorage)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("roast_ritual_orders_en_php_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("roast_ritual_orders_en_php_v2", JSON.stringify(orders));
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
        milkLabel: milkObj ? milkObj.name : "Full Cream Whole Milk",
        shots: item.defaultShots || "standard",
        shotsLabel: shotObj ? shotObj.name : "Standard Double (2)",
        sweetness: "100",
        sweetnessLabel: "100% Regular Sweet",
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
  const totalCartItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

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
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col bg-stone-950 text-stone-100 select-none">
      {/* Real-time Update Banner when Changes are Detected on GitHub or Webpage */}
      {updateInfo && (
        <div className="no-print fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-50 animate-bounce">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500 text-stone-950 shadow-2xl flex items-center justify-between gap-3 border-2 border-stone-950 font-bold max-w-md">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-spin">⚡</span>
              <div className="text-left">
                <div className="text-xs uppercase font-black text-stone-950 tracking-wider flex items-center gap-1.5">
                  <span>{updateInfo.source === "github" ? "GitHub Update Pushed!" : "Webpage Updated!"}</span>
                  {updateInfo.sha && (
                    <span className="font-mono text-[10px] bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded">
                      {updateInfo.sha}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-semibold text-stone-900 leading-tight">
                  {cart.length === 0 ? (
                    autoUpdateCountdown !== null ? (
                      <span>Auto-applying update in <span className="font-mono font-black text-xs text-stone-950 underline">{autoUpdateCountdown}s</span>...</span>
                    ) : (
                      "Newest improvements are applying..."
                    )
                  ) : (
                    "Order in progress: auto-updates right after checkout."
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.triggerAppAutoUpdate) {
                  window.triggerAppAutoUpdate("user-clicked-banner");
                } else {
                  window.location.reload();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-850 active:scale-95 text-amber-300 text-xs font-black shrink-0 shadow transition flex items-center gap-1"
            >
              <span>Update Now</span>
              <span>↻</span>
            </button>
          </div>
        </div>
      )}
      {/* Top POS Navigation Header */}
      <header className="no-print h-14 sm:h-16 px-3 sm:px-5 bg-stone-900 border-b border-stone-800 flex items-center justify-between shrink-0">
        <div
          onClick={() => setActiveTab("pos")}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer"
        >
          <BrandLogo className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-md" />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black tracking-wider text-amber-50 text-base sm:text-lg md:text-xl lg:text-2xl leading-none">
                {SHOP_CONFIG.name}
              </span>
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded bg-stone-800 text-amber-400 border border-stone-700 font-mono">
                {SHOP_CONFIG.registerId}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-stone-400 truncate max-w-[200px] sm:max-w-none">
              {SHOP_CONFIG.tagline} •{" "}
              <strong className="text-stone-200">{SHOP_CONFIG.cashierName}</strong>
            </div>
          </div>
        </div>

        {/* Desktop Main View Switcher (lg+) */}
        <nav className="hidden lg:flex items-center gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "pos" || activeTab === "cart"
                ? "bg-amber-500 text-stone-950 shadow"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <span>🖥️ POS Register</span>
            {totalCartItems > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-amber-400 text-[10px]">
                {totalCartItems}
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

        {/* Held Orders, QR Mobile App Button & Date */}
        <div className="flex items-center gap-2">
          {heldOrders.length > 0 && (
            <div className="flex items-center gap-1.5">
              {heldOrders.slice(0, 1).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    handleRecallHeldOrder(h);
                    setActiveTab("cart");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 text-amber-200 text-[11px] font-semibold flex items-center gap-1 transition"
                >
                  <span>⏸ Recall ({heldOrders.length})</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <span>📱</span>
            <span className="hidden xs:inline sm:inline">App QR</span>
          </button>

          <div className="hidden md:block text-right text-xs text-stone-400 font-mono">
            {new Date().toLocaleDateString([], { month: "short", day: "numeric" })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {(activeTab === "pos" || activeTab === "cart") && (
        <div className="no-print flex-1 flex overflow-hidden relative">
          {/* LEFT / CENTER: Categories + Menu Grid (Visible on Desktop OR when activeTab === "pos" on Mobile) */}
          <div
            className={`${
              activeTab === "cart" ? "hidden lg:flex" : "flex"
            } flex-1 flex-col overflow-hidden lg:border-r border-stone-800`}
          >
            {/* Search & Quick Filter Bar */}
            <div className="p-2.5 sm:p-4 bg-stone-900/60 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drinks, pastries, or SKU..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-3 top-2 sm:top-2.5 text-stone-500 text-sm">🔍</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2 sm:top-2.5 text-xs text-stone-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
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
            <div className="px-2.5 sm:px-4 py-2 bg-stone-900/30 border-b border-stone-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50"
                      : "bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu Grid (2 columns on mobile phones, 3-4 columns on larger screens) */}
            <div
              className={`flex-1 overflow-y-auto p-2.5 sm:p-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 content-start ${
                totalCartItems > 0 ? "pb-36 lg:pb-4" : "pb-20 lg:pb-4"
              }`}
            >
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setEditingCartLine(null);
                    setCustomizingItem(item);
                  }}
                  className="group relative rounded-2xl bg-stone-900/90 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/60 p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-extrabold text-white shadow-inner shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.sku.split("-")[0]}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm sm:text-base font-extrabold text-amber-400">
                          ₱{item.price.toFixed(2)}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono">
                          {item.calories > 0 ? `${item.calories} cal` : item.sku}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span className="inline-block mb-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}

                    <h3 className="font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-200 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] sm:text-[11px] text-amber-400/90 font-semibold group-hover:underline">
                      ⚙️ Customize
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-800 active:bg-amber-500 hover:bg-amber-500 hover:text-stone-950 text-stone-200 text-[11px] sm:text-xs font-bold border border-stone-700 hover:border-amber-400 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Floating "View Order Ticket" Bar when cart has items (< lg) */}
            {totalCartItems > 0 && activeTab === "pos" && (
              <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30">
                <button
                  type="button"
                  onClick={() => setActiveTab("cart")}
                  className="w-full px-4 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm shadow-2xl shadow-stone-950 flex items-center justify-between border border-amber-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-stone-950 text-amber-400 text-xs font-extrabold">
                      {totalCartItems} {totalCartItems === 1 ? "item" : "items"}
                    </span>
                    <span>View Order Ticket</span>
                  </div>
                  <span className="text-base font-black">₱{baseTotal.toFixed(2)} →</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Current Order Cart & Checkout Ticket (Visible on Desktop OR when activeTab === "cart" on Mobile) */}
          <div
            className={`${
              activeTab === "cart" ? "flex w-full" : "hidden lg:flex lg:w-full lg:max-w-md"
            } bg-stone-900 flex-col h-full shrink-0 pb-16 lg:pb-0`}
          >
            {/* Mobile Cart Back Header (< lg) */}
            <div className="lg:hidden px-4 py-3 bg-stone-800/80 border-b border-stone-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("pos")}
                className="text-xs font-bold text-amber-300 flex items-center gap-1"
              >
                ← Back to Menu
              </button>
              <span className="text-xs font-bold text-stone-200">
                Current Order Ticket ({totalCartItems})
              </span>
            </div>

            {/* Customer & Order Type Header */}
            <div className="p-3.5 sm:p-4 bg-stone-900 border-b border-stone-800 space-y-2.5">
              <div className="grid grid-cols-4 gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
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
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 p-6">
                  <div className="mb-3 opacity-85">
                    <BrandLogo className="w-16 h-16" />
                  </div>
                  <p className="text-sm font-semibold text-stone-300">Current Ticket is Empty</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Tap any drink or pastry on the menu to customize size, milk, espresso shots, and syrups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pos")}
                    className="lg:hidden mt-4 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    Browse Coffee Menu
                  </button>
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
                            ₱{(line.unitPrice * line.quantity).toFixed(2)}
                          </span>
                          <div className="flex items-center bg-stone-900 border border-stone-700 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.lineId, -1)}
                              className="px-2.5 py-1 text-xs font-bold text-stone-400 hover:text-white"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs font-bold text-stone-100">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(line.lineId, 1)}
                              className="px-2.5 py-1 text-xs font-bold text-stone-400 hover:text-white"
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
            <div className="p-3.5 sm:p-4 bg-stone-950 border-t border-stone-800 space-y-2.5">
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
              <div className="space-y-1 text-xs border-t border-stone-800 pt-2">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({totalCartItems} items)</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount Applied</span>
                    <span>−₱{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>12% VAT</span>
                  <span>₱{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline text-base font-extrabold text-white pt-1">
                  <span>Total Due</span>
                  <span className="text-xl text-amber-400">₱{baseTotal.toFixed(2)}</span>
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
                  Pay ₱{baseTotal.toFixed(2)} →
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

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 grid grid-cols-4 z-40 px-2">
        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            activeTab === "pos" ? "text-amber-400" : "text-stone-400"
          }`}
        >
          <span className="text-base">☕</span>
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cart")}
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            activeTab === "cart" ? "text-amber-400" : "text-stone-400"
          }`}
        >
          <span className="text-base">🛒</span>
          <span>Ticket</span>
          {totalCartItems > 0 && (
            <span className="absolute top-1.5 right-5 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold">
              {totalCartItems}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kds")}
          className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            activeTab === "kds" ? "text-amber-400" : "text-stone-400"
          }`}
        >
          <span className="text-base">🔥</span>
          <span>Barista KDS</span>
          {activeKdsCount > 0 && (
            <span className="absolute top-1.5 right-4 px-1.5 py-0.2 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-extrabold">
              {activeKdsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${
            activeTab === "history" ? "text-amber-400" : "text-stone-400"
          }`}
        >
          <span className="text-base">🧾</span>
          <span>Sales</span>
        </button>
      </nav>

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

      {isQrModalOpen && (
        <MobileAppQRModal
          onClose={() => setIsQrModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onTriggerInstall={handleTriggerInstall}
          isInstalled={isAppInstalled}
        />
      )}
    </div>
  );
}
