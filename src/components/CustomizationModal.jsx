import React, { useState, useMemo } from "react";
import { MODIFIERS } from "../data/menuData";

export default function CustomizationModal({ item, initialEditItem, onClose, onSave }) {
  const isDrink = item.type === "drink";
  const isBakery = item.type === "bakery";

  const existing = initialEditItem?.customization || {};

  const [size, setSize] = useState(existing.size || "md");
  const [temp, setTemp] = useState(existing.temp || item.defaultTemp || "hot");
  const [milk, setMilk] = useState(existing.milk || item.defaultMilk || "whole");
  const [shots, setShots] = useState(existing.shots || item.defaultShots || "standard");
  const [sweetness, setSweetness] = useState(existing.sweetness || "100");
  const [ice, setIce] = useState(existing.ice || "regular");
  const [syrups, setSyrups] = useState(existing.syrups || item.defaultSyrups || []);
  const [toppings, setToppings] = useState(existing.toppings || item.defaultToppings || []);
  const [warming, setWarming] = useState(existing.warming || "warmed");
  const [spreads, setSpreads] = useState(existing.spreads || []);
  const [notes, setNotes] = useState(existing.notes || "");
  const [quantity, setQuantity] = useState(initialEditItem?.quantity || 1);

  const toggleArrayItem = (list, setList, id) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  const unitPrice = useMemo(() => {
    let total = item.price;
    if (isDrink) {
      const sizeObj = MODIFIERS.sizes.find((s) => s.id === size);
      if (sizeObj) total += sizeObj.price;

      const milkObj = MODIFIERS.milks.find((m) => m.id === milk);
      if (milkObj && milk !== item.defaultMilk) {
        total += milkObj.price;
      } else if (milkObj && milk === item.defaultMilk && milkObj.price > 0 && !item.defaultMilk) {
        total += milkObj.price;
      }

      const shotObj = MODIFIERS.shots.find((sh) => sh.id === shots);
      if (shotObj && shots !== (item.defaultShots || "standard")) {
        total += shotObj.price;
      }

      syrups.forEach((sId) => {
        if (!(item.defaultSyrups || []).includes(sId)) {
          const sObj = MODIFIERS.syrups.find((s) => s.id === sId);
          if (sObj) total += sObj.price;
        }
      });

      toppings.forEach((tId) => {
        if (!(item.defaultToppings || []).includes(tId)) {
          const tObj = MODIFIERS.toppings.find((t) => t.id === tId);
          if (tObj) total += tObj.price;
        }
      });
    } else if (isBakery) {
      spreads.forEach((spId) => {
        const spObj = MODIFIERS.bakerySpreads.find((s) => s.id === spId);
        if (spObj) total += spObj.price;
      });
    }
    return Math.max(0.5, Number(total.toFixed(2)));
  }, [item, isDrink, isBakery, size, milk, shots, syrups, toppings, spreads]);

  const handleConfirm = () => {
    let customization = {};
    if (isDrink) {
      const sizeObj = MODIFIERS.sizes.find((s) => s.id === size);
      const tempObj = MODIFIERS.temperatures.find((t) => t.id === temp);
      const milkObj = MODIFIERS.milks.find((m) => m.id === milk);
      const shotObj = MODIFIERS.shots.find((s) => s.id === shots);
      const sweetObj = MODIFIERS.sweetness.find((s) => s.id === sweetness);
      const iceObj = MODIFIERS.iceLevels.find((i) => i.id === ice);

      customization = {
        size,
        sizeLabel: sizeObj ? `${sizeObj.name} (${sizeObj.oz})` : "Medium",
        temp,
        tempLabel: tempObj ? tempObj.name : "Hot",
        milk,
        milkLabel: milkObj ? milkObj.name : "Whole Milk",
        shots,
        shotsLabel: shotObj ? shotObj.name : "Standard Double (2)",
        sweetness,
        sweetnessLabel: sweetObj ? sweetObj.name : "100% Standard",
        ice: temp === "iced" ? ice : "none",
        iceLabel: temp === "iced" && iceObj ? iceObj.name : "",
        syrups,
        syrupLabels: syrups.map((id) => MODIFIERS.syrups.find((s) => s.id === id)?.name).filter(Boolean),
        toppings,
        toppingLabels: toppings.map((id) => MODIFIERS.toppings.find((t) => t.id === id)?.name).filter(Boolean),
        notes: notes.trim()
      };
    } else if (isBakery) {
      const warmObj = MODIFIERS.bakeryOptions.find((w) => w.id === warming);
      customization = {
        warming,
        warmingLabel: warmObj ? warmObj.name : "Warmed in Oven",
        spreads,
        spreadLabels: spreads.map((id) => MODIFIERS.bakerySpreads.find((s) => s.id === id)?.name).filter(Boolean),
        notes: notes.trim()
      };
    } else {
      customization = {
        notes: notes.trim()
      };
    }

    onSave({
      lineId: initialEditItem?.lineId || `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      name: item.name,
      sku: item.sku,
      type: item.type,
      quantity,
      unitPrice,
      completed: false,
      customization
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-800/80 border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-inner"
              style={{ backgroundColor: item.color || "#7c4a2d" }}
            >
              {item.sku.split("-")[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-50 flex items-center gap-2">
                {item.name}
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-stone-700 text-stone-300">
                  Base ${item.price.toFixed(2)}
                </span>
              </h2>
              <p className="text-xs text-stone-400">{item.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isDrink && (
            <>
              {/* Size & Temperature Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                    1. Cup Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODIFIERS.sizes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSize(s.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          size === s.id
                            ? "bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                            : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        <div className="font-semibold text-sm">{s.name}</div>
                        <div className="text-xs text-stone-400">{s.oz}</div>
                        <div className="text-xs font-medium text-amber-400 mt-1">
                          {s.price === 0
                            ? "Base"
                            : s.price > 0
                            ? `+$${s.price.toFixed(2)}`
                            : `-$${Math.abs(s.price).toFixed(2)}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                    2. Temperature
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODIFIERS.temperatures.map((t) => {
                      const disabled = !item.allowTempChange && t.id !== item.defaultTemp && !(item.defaultTemp === "hot" && t.id === "extra-hot");
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTemp(t.id)}
                          className={`p-3 rounded-xl border text-left transition ${
                            disabled
                              ? "opacity-40 cursor-not-allowed bg-stone-900 border-stone-800"
                              : temp === t.id
                              ? "bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                              : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                          }`}
                        >
                          <div className="font-semibold text-sm">{t.name}</div>
                          <div className="text-xs text-stone-400">
                            {t.id === "iced" ? "Over Ice" : "Steamed"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Milk Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  3. Milk & Dairy Option
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {MODIFIERS.milks.map((m) => {
                    const isDefault = m.id === item.defaultMilk;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMilk(m.id)}
                        className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          milk === m.id
                            ? "bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                            : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        <span className="text-xs font-medium truncate">{m.name}</span>
                        <span className="text-[11px] text-amber-400 ml-1 shrink-0">
                          {isDefault ? "Incl" : m.price > 0 ? `+$${m.price.toFixed(2)}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Espresso Shots */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  4. Espresso Shots & Roast
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODIFIERS.shots.map((sh) => {
                    const isDefault = sh.id === (item.defaultShots || "standard");
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setShots(sh.id)}
                        className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          shots === sh.id
                            ? "bg-amber-600/20 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                            : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        <span className="text-xs font-medium">{sh.name}</span>
                        <span className="text-[11px] text-amber-400 ml-1">
                          {isDefault
                            ? "Incl"
                            : sh.price > 0
                            ? `+$${sh.price.toFixed(2)}`
                            : sh.price < 0
                            ? `-$${Math.abs(sh.price).toFixed(2)}`
                            : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Syrups & Flavors */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  5. Syrups & Flavorings (Multi-Select)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODIFIERS.syrups.map((s) => {
                    const selected = syrups.includes(s.id);
                    const isDefault = (item.defaultSyrups || []).includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleArrayItem(syrups, setSyrups, s.id)}
                        className={`px-3 py-2.5 rounded-xl border text-left transition ${
                          selected
                            ? "bg-amber-600/25 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                            : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        <div className="text-xs font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-amber-400">
                          {isDefault ? "Included" : `+$${s.price.toFixed(2)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sweetness & Ice Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                    6. Sweetness Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODIFIERS.sweetness.map((sw) => (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => setSweetness(sw.id)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-medium transition ${
                          sweetness === sw.id
                            ? "bg-amber-600/20 border-amber-500 text-amber-200"
                            : "bg-stone-800/70 border-stone-700 text-stone-300"
                        }`}
                      >
                        {sw.name}
                      </button>
                    ))}
                  </div>
                </div>

                {temp === "iced" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                      7. Ice Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MODIFIERS.iceLevels.map((ic) => (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setIce(ic.id)}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
                            ice === ic.id
                              ? "bg-amber-600/20 border-amber-500 text-amber-200"
                              : "bg-stone-800/70 border-stone-700 text-stone-300"
                          }`}
                        >
                          {ic.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toppings */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  8. Toppings & Finishing (Multi-Select)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODIFIERS.toppings.map((t) => {
                    const selected = toppings.includes(t.id);
                    const isDefault = (item.defaultToppings || []).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleArrayItem(toppings, setToppings, t.id)}
                        className={`px-3 py-2.5 rounded-xl border text-left transition ${
                          selected
                            ? "bg-amber-600/25 border-amber-500 text-amber-200 ring-1 ring-amber-500"
                            : "bg-stone-800/70 border-stone-700 text-stone-300 hover:border-stone-500"
                        }`}
                      >
                        <div className="text-xs font-medium">{t.name}</div>
                        <div className="text-[11px] text-amber-400">
                          {isDefault ? "Included" : t.price === 0 ? "Free" : `+$${t.price.toFixed(2)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {isBakery && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  1. Preparation / Warming
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {MODIFIERS.bakeryOptions.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWarming(w.id)}
                      className={`p-3 rounded-xl border text-sm font-medium transition ${
                        warming === w.id
                          ? "bg-amber-600/20 border-amber-500 text-amber-200"
                          : "bg-stone-800/70 border-stone-700 text-stone-300"
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  2. Spreads & Accompaniments
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODIFIERS.bakerySpreads.map((sp) => {
                    const selected = spreads.includes(sp.id);
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => toggleArrayItem(spreads, setSpreads, sp.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selected
                            ? "bg-amber-600/20 border-amber-500 text-amber-200"
                            : "bg-stone-800/70 border-stone-700 text-stone-300"
                        }`}
                      >
                        <div className="text-xs font-medium">{sp.name}</div>
                        <div className="text-xs text-amber-400">+${sp.price.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              Barista / Kitchen Prep Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Double cup, kids temp (130°F), allergy alert, extra napkins..."
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-800/90 border-t border-stone-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">Qty</span>
            <div className="flex items-center bg-stone-900 border border-stone-700 rounded-xl">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-2 text-lg font-bold text-stone-300 hover:text-white"
              >
                −
              </button>
              <span className="px-4 py-2 font-bold text-amber-400">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-2 text-lg font-bold text-stone-300 hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-600 text-stone-300 hover:bg-stone-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-900/30 transition"
            >
              {initialEditItem ? "Update Item" : "Add to Order"} • ${(unitPrice * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
