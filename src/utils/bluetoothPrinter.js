// bluetoothPrinter.js - Web Bluetooth ESC/POS engine for 58mm thermal printers
// Fully compatible with JP58H-BT71, Officom OC-58H, POS-58, GOOJPRT PT-210, MPT-II, and standard ESC/POS Bluetooth printers.

export const BT_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS Printer Service
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / CC2540 / Serial UART
  "0000ff00-0000-1000-8000-00805f9b34fb", // JP58H-BT71 / Jiebao Custom UART
  "0000ae00-0000-1000-8000-00805f9b34fb", // JP58 / Telink BLE UART
  "0000ae30-0000-1000-8000-00805f9b34fb", // JP-58H Extended BLE
  "0000fee7-0000-1000-8000-00805f9b34fb", // Telink / JP58H Profile
  "0000fef5-0000-1000-8000-00805f9b34fb", // Dialog / Telink BLE UART
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent UART
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Generic Thermal Printer Service
  0x18f0,
  0xffe0,
  0xff00,
  0xae00,
  0xae30,
  0xfee7,
  0xfef5
];

class BluetoothThermalPrinter {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.printerName = typeof localStorage !== "undefined" ? (localStorage.getItem("pos_bt_printer_name") || "") : "";
    this.autoPrint = typeof localStorage !== "undefined" ? (localStorage.getItem("pos_bt_autoprint") === "true") : false;
    this.listeners = new Set();
  }

  isSupported() {
    return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
  }

  isConnected() {
    return Boolean(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getStatus());
    return () => this.listeners.delete(fn);
  }

  getStatus() {
    return {
      isSupported: this.isSupported(),
      isConnected: this.isConnected(),
      printerName: this.device ? (this.device.name || "Bluetooth Printer") : this.printerName,
      autoPrint: this.autoPrint
    };
  }

  setAutoPrint(val) {
    this.autoPrint = Boolean(val);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pos_bt_autoprint", String(this.autoPrint));
    }
    this.notify();
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser. Please use Chrome or Edge on Android or Desktop.");
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_PRINTER_SERVICES
      });

      this.device = device;
      this.printerName = device.name || "58mm Thermal Printer";
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("pos_bt_printer_name", this.printerName);
      }

      device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.notify();
      });

      const server = await device.gatt.connect();
      this.server = server;

      let foundChar = null;

      // Scan known thermal printer services
      for (const serviceUuid of BT_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const c of characteristics) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              foundChar = c;
              break;
            }
          }
          if (foundChar) break;
        } catch (e) {}
      }

      // If not in known list, scan all exposed services
      if (!foundChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const service of allServices) {
            try {
              const chars = await service.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  foundChar = c;
                  break;
                }
              }
              if (foundChar) break;
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (!foundChar) {
        throw new Error("Connected to " + (device.name || "device") + ", but no writable printer characteristic was found.");
      }

      this.characteristic = foundChar;
      this.notify();
      return this.getStatus();
    } catch (err) {
      this.notify();
      throw err;
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.characteristic = null;
    this.notify();
  }

  async sendRaw(byteArray) {
    if (!this.isConnected()) {
      await this.connect();
    }

    const data = byteArray instanceof Uint8Array ? byteArray : new Uint8Array(byteArray);
    const CHUNK_SIZE = 64; // Safe BLE MTU chunk

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 20)); // Buffer pacing
    }
  }

  // 58mm ESC/POS Receipt Builder (32 columns width)
  buildReceipt58mm(order, shopConfig) {
    const encoder = new TextEncoder();
    const bytes = [];

    const addBytes = (...arr) => {
      for (const b of arr) bytes.push(b);
    };

    const addText = (str) => {
      const clean = str.replace(/\u20B1/g, "PHP ");
      const encoded = encoder.encode(clean);
      for (const b of encoded) bytes.push(b);
    };

    const addLine = (str = "") => {
      addText(str);
      addBytes(0x0a);
    };

    const format2Cols = (left, right, width = 32) => {
      const cleanLeft = left.replace(/\u20B1/g, "PHP ");
      const cleanRight = right.replace(/\u20B1/g, "PHP ");
      const maxLeftLen = width - cleanRight.length - 1;
      if (cleanLeft.length + cleanRight.length + 1 <= width) {
        const spaces = " ".repeat(width - cleanLeft.length - cleanRight.length);
        return cleanLeft + spaces + cleanRight;
      } else {
        return cleanLeft.substring(0, Math.max(0, maxLeftLen)) + " " + cleanRight;
      }
    };

    const DIVIDER = "-".repeat(32);
    const DOUBLE_DIVIDER = "=".repeat(32);

    // ESC @: Initialize
    addBytes(0x1b, 0x40);

    // Centered Store Header
    addBytes(0x1b, 0x61, 0x01); // Center
    addBytes(0x1d, 0x21, 0x11); // Double width & height
    addBytes(0x1b, 0x45, 0x01); // Bold on
    addLine(shopConfig?.name || "ROAST & RITUAL");

    addBytes(0x1d, 0x21, 0x00); // Normal
    addBytes(0x1b, 0x45, 0x00); // Bold off
    addLine(shopConfig?.tagline || "Specialty Coffee & Bakery");
    if (shopConfig?.address) addLine(shopConfig.address.substring(0, 32));
    if (shopConfig?.phone) addLine("Tel: " + shopConfig.phone);
    addLine(DOUBLE_DIVIDER);

    // Order Meta
    addBytes(0x1b, 0x61, 0x00); // Left align
    addBytes(0x1b, 0x45, 0x01); // Bold on
    addLine(format2Cols("ORDER #" + order.orderNumber, (order.orderType || "DINE-IN").toUpperCase()));
    addBytes(0x1b, 0x45, 0x00); // Bold off

    const dateStr = new Date(order.createdAt || Date.now()).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    addLine(format2Cols("Date: " + dateStr, "Reg: " + (shopConfig?.registerId || "REG-01")));
    addLine(format2Cols("Guest: " + (order.customerName || "Walk-In"), order.tableNumber ? "Pager: " + order.tableNumber : ""));
    addLine("Barista: " + (order.cashier || shopConfig?.cashierName || "Alex Rivera"));
    addLine(DIVIDER);

    // Line Items Header
    addBytes(0x1b, 0x45, 0x01);
    addLine(format2Cols("ITEM", "QTY   PRICE"));
    addBytes(0x1b, 0x45, 0x00);
    addLine(DIVIDER);

    for (const item of order.items || []) {
      const c = item.customization || {};
      const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
      const itemName = item.name.length > 20 ? item.name.substring(0, 19) + "." : item.name;

      addBytes(0x1b, 0x45, 0x01);
      addLine(format2Cols(item.quantity + "x " + itemName, itemTotal));
      addBytes(0x1b, 0x45, 0x00);

      if (item.type === "drink") {
        if (c.sizeLabel || c.tempLabel) {
          addLine("  * " + (c.sizeLabel || "") + " | " + (c.tempLabel || ""));
        }
        if (c.milkLabel || c.shotsLabel) {
          addLine("  * " + (c.milkLabel || "") + " | " + (c.shotsLabel || ""));
        }
        if (c.sweetnessLabel && c.sweetness !== "100") {
          addLine("  * Sweet: " + c.sweetnessLabel + (c.iceLabel ? " | " + c.iceLabel : ""));
        }
        if (c.syrupLabels && c.syrupLabels.length > 0) {
          addLine("  * Syrup: " + c.syrupLabels.join(", "));
        }
        if (c.toppingLabels && c.toppingLabels.length > 0) {
          addLine("  * Top: " + c.toppingLabels.join(", "));
        }
      } else if (item.type === "bakery") {
        if (c.warmingLabel) addLine("  * " + c.warmingLabel);
        if (c.spreadLabels && c.spreadLabels.length > 0) addLine("  * " + c.spreadLabels.join(", "));
      }
      if (c.notes) {
        addLine("  ! Note: \"" + c.notes + "\"");
      }
    }

    addLine(DIVIDER);

    // Subtotal & Calculations
    addLine(format2Cols("SUBTOTAL", order.subtotal.toFixed(2)));
    if (order.discount > 0) {
      addLine(format2Cols("DISCOUNT", "-" + order.discount.toFixed(2)));
    }
    addLine(format2Cols("VAT (12%)", order.tax.toFixed(2)));
    if (order.tip > 0) {
      addLine(format2Cols("BARISTA TIP", order.tip.toFixed(2)));
    }

    addLine(DIVIDER);
    addBytes(0x1d, 0x21, 0x01); // Double height
    addBytes(0x1b, 0x45, 0x01); // Bold on
    addLine(format2Cols("TOTAL DUE:", "PHP " + order.total.toFixed(2)));
    addBytes(0x1d, 0x21, 0x00); // Normal
    addBytes(0x1b, 0x45, 0x00); // Bold off
    addLine(DIVIDER);

    // Payment details
    addLine(format2Cols("PAYMENT: " + (order.paymentMethod || "CASH"), (order.amountTendered || order.total).toFixed(2)));
    if (order.changeDue > 0) {
      addBytes(0x1b, 0x45, 0x01);
      addLine(format2Cols("CHANGE DUE", order.changeDue.toFixed(2)));
      addBytes(0x1b, 0x45, 0x00);
    }

    addLine(DOUBLE_DIVIDER);

    // Footer
    addBytes(0x1b, 0x61, 0x01); // Center
    addLine("Thank you for your visit!");
    addLine("WIFI: RoastAndRitual_Guest");
    addLine("PASS: espresso2026");
    addLine("--- JP58H-BT71 / OC-58H / POS-58 ---");

    // Feed lines & cut
    addBytes(0x1b, 0x64, 0x05); // Feed 5 lines
    addBytes(0x1d, 0x56, 0x01); // Partial cut

    return new Uint8Array(bytes);
  }

  // 58mm Cup Sticker Label Builder
  buildCupSticker58mm(item, stickerIndex, totalStickers, order, shopConfig) {
    const encoder = new TextEncoder();
    const bytes = [];

    const addBytes = (...arr) => {
      for (const b of arr) bytes.push(b);
    };

    const addText = (str) => {
      const clean = str.replace(/\u20B1/g, "PHP ");
      const encoded = encoder.encode(clean);
      for (const b of encoded) bytes.push(b);
    };

    const addLine = (str = "") => {
      addText(str);
      addBytes(0x0a);
    };

    const format2Cols = (left, right, width = 32) => {
      const cleanLeft = left.replace(/\u20B1/g, "PHP ");
      const cleanRight = right.replace(/\u20B1/g, "PHP ");
      const maxLeftLen = width - cleanRight.length - 1;
      if (cleanLeft.length + cleanRight.length + 1 <= width) {
        const spaces = " ".repeat(width - cleanLeft.length - cleanRight.length);
        return cleanLeft + spaces + cleanRight;
      } else {
        return cleanLeft.substring(0, Math.max(0, maxLeftLen)) + " " + cleanRight;
      }
    };

    const c = item.customization || {};

    addBytes(0x1b, 0x40); // Reset
    addBytes(0x1b, 0x61, 0x00); // Left align
    addLine("=".repeat(32));

    addBytes(0x1b, 0x45, 0x01); // Bold on
    addLine(format2Cols("#" + order.orderNumber + " " + (order.customerName || "Guest"), stickerIndex + " of " + totalStickers));
    addBytes(0x1b, 0x45, 0x00); // Bold off
    addLine("-".repeat(32));

    // Drink Name
    addBytes(0x1d, 0x21, 0x01); // Double height
    addBytes(0x1b, 0x45, 0x01);
    addLine(item.name.substring(0, 18));
    addBytes(0x1d, 0x21, 0x00);
    addBytes(0x1b, 0x45, 0x00);

    if (item.type === "drink") {
      addLine("SIZE/TEMP: " + (c.sizeLabel || "Medium") + " | " + (c.tempLabel || "Hot"));
      addLine("MILK:      " + (c.milkLabel || "Whole Milk"));
      addLine("SHOTS:     " + (c.shotsLabel || "Standard"));
      addLine("SWEET:     " + (c.sweetness || "100") + "%" + (c.temp === "iced" ? " | " + (c.iceLabel || "Regular Ice") : ""));
      if (c.syrupLabels && c.syrupLabels.length > 0) {
        addLine("SYRUP:     " + c.syrupLabels.join(", "));
      }
      if (c.toppingLabels && c.toppingLabels.length > 0) {
        addLine("TOPPING:   " + c.toppingLabels.join(", "));
      }
    } else {
      addLine("PREP:      " + (c.warmingLabel || "Standard"));
      if (c.spreadLabels && c.spreadLabels.length > 0) {
        addLine("SPREAD:    " + c.spreadLabels.join(", "));
      }
    }

    if (c.notes) {
      addLine("NOTE: " + c.notes);
    }

    addLine("-".repeat(32));
    addLine(format2Cols("TYPE: " + order.orderType, "BARISTA: " + (order.cashier || "Alex R.")));
    addLine("=".repeat(32));

    addBytes(0x1b, 0x64, 0x03);
    addBytes(0x1d, 0x56, 0x01);

    return new Uint8Array(bytes);
  }

  // Print Test Slip
  async printTestSlip(shopConfig) {
    const encoder = new TextEncoder();
    const bytes = [];
    const addBytes = (...arr) => { for (const b of arr) bytes.push(b); };
    const addLine = (str = "") => {
      const clean = str.replace(/\u20B1/g, "PHP ");
      const encoded = encoder.encode(clean);
      for (const b of encoded) bytes.push(b);
      bytes.push(0x0a);
    };

    addBytes(0x1b, 0x40); // Reset
    addBytes(0x1b, 0x61, 0x01); // Center
    addBytes(0x1d, 0x21, 0x11); // Double size
    addBytes(0x1b, 0x45, 0x01);
    addLine("PRINTER READY");
    addBytes(0x1d, 0x21, 0x00);
    addBytes(0x1b, 0x45, 0x00);
    addLine("================================");
    addLine(shopConfig?.name || "ROAST & RITUAL");
    addLine("58mm Thermal Printer Connected");
    addLine("Model: " + (this.printerName || "JP58H-BT71 / OC-58H / POS-58"));
    addLine("Date: " + new Date().toLocaleString());
    addLine("--------------------------------");
    addLine("✓ 32 Columns ESC/POS OK");
    addLine("✓ Web Bluetooth BLE OK");
    addLine("✓ High-Speed Thermal Print OK");
    addLine("================================");
    addBytes(0x1b, 0x64, 0x05);
    addBytes(0x1d, 0x56, 0x01);

    await this.sendRaw(new Uint8Array(bytes));
  }
}

export const bluetoothPrinter = new BluetoothThermalPrinter();
