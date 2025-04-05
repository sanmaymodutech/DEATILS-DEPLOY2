const mongoose = require("mongoose");

const accessoryPricingSchema = new mongoose.Schema({
  tvUnit: {
    LED_STRIP: {
      dimensions: {
        "5M": { type: Number, default: 1500 },
        "10M": { type: Number, default: 2800 },
      },
      finishes: {
        WARM_WHITE: { type: Number, default: 0 },
        COOL_WHITE: { type: Number, default: 0 },
        RGB: { type: Number, default: 500 },
      },
    },
    GLASS_SHELF: {
      dimensions: {
        "600x300": { type: Number, default: 1200 },
        "900x300": { type: Number, default: 1800 },
      },
      finishes: {
        CLEAR: { type: Number, default: 0 },
        FROSTED: { type: Number, default: 300 },
        TINTED: { type: Number, default: 500 },
      },
    },
    WIRE_MANAGEMENT: {
      dimensions: {
        STANDARD: { type: Number, default: 800 },
      },
      finishes: {
        BLACK: { type: Number, default: 0 },
        WHITE: { type: Number, default: 0 },
      },
    },
  },
  wardrobe: {
    HANGING_ROD: {
      dimensions: {
        "600MM": { type: Number, default: 600 },
        "900MM": { type: Number, default: 800 },
        "1200MM": { type: Number, default: 1000 },
      },
      finishes: {
        CHROME: { type: Number, default: 0 },
        BRASS: { type: Number, default: 300 },
      },
    },
    TIE_RACK: {
      dimensions: {
        STANDARD: { type: Number, default: 1200 },
      },
      finishes: {
        CHROME: { type: Number, default: 0 },
        BRASS: { type: Number, default: 200 },
      },
    },
    SOFT_CLOSE_HINGES: {
      dimensions: {
        STANDARD: { type: Number, default: 350 },
      },
      finishes: {
        STANDARD: { type: Number, default: 0 },
      },
    },
  },
  shoeRack: {
    PULL_OUT_RACK: {
      dimensions: {
        "600MM": { type: Number, default: 2500 },
        "900MM": { type: Number, default: 3200 },
      },
      finishes: {
        CHROME: { type: Number, default: 0 },
        BLACK: { type: Number, default: 300 },
      },
    },
    SHOE_PARTITION: {
      dimensions: {
        "600x400": { type: Number, default: 800 },
        "900x400": { type: Number, default: 1200 },
      },
      finishes: {
        WHITE: { type: Number, default: 0 },
        BLACK: { type: Number, default: 0 },
      },
    },
  },
  crockeryUnit: {
    CUTLERY_TRAY: {
      dimensions: {
        "450MM": { type: Number, default: 1200 },
        "600MM": { type: Number, default: 1500 },
      },
      finishes: {
        PLASTIC: { type: Number, default: 0 },
        WOOD: { type: Number, default: 800 },
      },
    },
    PLATE_HOLDER: {
      dimensions: {
        STANDARD: { type: Number, default: 1800 },
      },
      finishes: {
        CHROME: { type: Number, default: 0 },
        WOODEN: { type: Number, default: 500 },
      },
    },
  },
  consoleUnit: {
    CUTLERY_TRAY: {
      dimensions: {
        "450MM": { type: Number, default: 1200 },
        "600MM": { type: Number, default: 1500 },
      },
      finishes: {
        PLASTIC: { type: Number, default: 0 },
        WOOD: { type: Number, default: 800 },
      },
    },
    PLATE_HOLDER: {
      dimensions: {
        STANDARD: { type: Number, default: 1800 },
      },
      finishes: {
        CHROME: { type: Number, default: 0 },
        WOODEN: { type: Number, default: 500 },
      },
    },
  },
});

module.exports = mongoose.model("AccessoryPricing", accessoryPricingSchema);
