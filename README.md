# ☕ ROAST & RITUAL — Coffee Shop POS & Barista KDS

A full-featured **Specialty Coffee Shop Point of Sale (POS)** web application built with **React 18** and **Tailwind CSS**.

## 🚀 Instant Launch (Zero Setup)
Simply open [`index.html`](./index.html) directly in any modern browser (Chrome, Edge, Firefox, Safari) — no build step required.

## 🛠️ Development Workflow (Vite + React)
If you have Node.js installed and want to run the modular source files in [`src/`](./src):
```bash
npm install
npm run dev
```

## ✨ Core Features
1. **Menu & Drink Customization (`CustomizationModal.jsx`)**:
   - Categories: Espresso & Coffee, Cold Brew & Iced, Tea & Matcha, Frappes & Blended, Bakery & Pastries, Whole Bean & Merch.
   - Full drink modifiers: Cup Size (12oz / 16oz / 20oz), Temperature (Hot / Iced / Extra Hot), 9 Milk & Alt-Dairy options, Espresso Shot counts & Decaf/Half-Caf, Multi-select Syrups, Sweetness %, Ice Level, Toppings/Cold Foam, Bakery warming & spreads, and Barista Prep Notes.
   - Instant **+ Quick Add** button on every card for standard builds, or tap to customize.
2. **Cart, Hold/Recall, Discounts & Checkout (`CheckoutModal.jsx`)**:
   - Dine-In, Takeout, Pickup, and Drive-Thru modes with Customer Name & Table/Pager number.
   - Hold / Park active orders and recall them with one click.
   - Preset discounts (Own Tumbler -\$0.50, Student 10%, Happy Hour 15%, Staff 25%, \$2 Recovery).
   - Automatic 8.5% tax calculation and customizable Barista Tip (No Tip, 10%, 15%, 18%, 20%, Custom).
   - **Cash Drawer** with quick bill buttons, numeric keypad, and automatic **Change Due** calculation, plus **Card** and **Apple Pay / NFC** terminal simulation.
3. **Barista Kitchen Display System (`BaristaKDS.jsx`)**:
   - 3-column live ticket board: **New / Queued**, **On Bar / Brewing**, and **Handoff Counter (Ready)**.
   - Live elapsed timers with color-coded urgency alerts, Rush Priority (`🔥`) toggle, and interactive item-by-item checkoffs.
4. **Printable 80mm Receipts & Cup Labels (`ReceiptModal.jsx` & `OrderHistory.jsx`)**:
   - Switch between **80mm Thermal Receipt** view and **Barista Cup Stickers (`1 of N`)** view, with `@media print` formatting for one-click printing.
   - Full Shift Sales KPIs (Gross Sales, Average Ticket, Barista Tips, Cash vs. Card breakdown) and order search/voiding.
