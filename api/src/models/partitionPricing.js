const mongoose = require("mongoose");

const partitionPricingSchema = new mongoose.Schema({
  unitPrices: {
    "2 Drawer (2 Option)": {
      base: { type: Number, default: 0 },
      modules: {
        "SS 304": {
          details: {
            "450mm": { type: Number, default: 4716 },
            "600mm": { type: Number, default: 4716 },
            "750mm": { type: Number, default: 5216 },
            "900mm": { type: Number, default: 5316 },
          },
          accessories: {
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
        Tandem: {
          details: {
            "450mm (30KG)": { type: Number, default: 10600 },
            "600mm (30KG)": { type: Number, default: 11000 },
            "900mm (30KG)": { type: Number, default: 13400 },
            "450mm (50KG)": { type: Number, default: 14400 },
            "600mm (50KG)": { type: Number, default: 14800 },
            "900mm (50KG)": { type: Number, default: 17400 },
          },
          accessories: {
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
      },
    },
    "3 Drawer (3OP)": {
      base: { type: Number, default: 0 },
      modules: {
        "SS 304": {
          details: {
            "450mm": { type: Number, default: 4716 },
            "600mm": { type: Number, default: 4716 },
            "750mm": { type: Number, default: 5216 },
            "900mm": { type: Number, default: 5316 },
          },
          accessories: {
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
        Tandem: {
          details: {
            "450mm (30KG)": { type: Number, default: 10600 },
            "600mm (30KG)": { type: Number, default: 11000 },
            "900mm (30KG)": { type: Number, default: 13400 },
            "450mm (50KG)": { type: Number, default: 14400 },
            "600mm (50KG)": { type: Number, default: 14800 },
            "900mm (50KG)": { type: Number, default: 17400 },
          },
          accessories: {
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
      },
    },
    "1 Drawer 1 Open (2OP)": {
      base: { type: Number, default: 0 },
      modules: {
        "SS 304": {
          details: {
            "450mm": { type: Number, default: 4716 },
            "600mm": { type: Number, default: 4716 },
            "750mm": { type: Number, default: 5216 },
            "900mm": { type: Number, default: 5316 },
          },
          accessories: {
            "WICKER BASKET(HETTICH) - for potatoes, onions": {
              type: Number,
              default: 24203,
            },
            "WICKER BASKET(MODA)": { type: Number, default: 8908 },
            "WICKER BASKET(HETTICH)": { type: Number, default: 20522 },
            "WICKER BASKET(HETTICH) - for garlic": {
              type: Number,
              default: 21737,
            },
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
        Tandem: {
          details: {
            "450mm (30KG)": { type: Number, default: 10600 },
            "600mm (30KG)": { type: Number, default: 11000 },
            "900mm (30KG)": { type: Number, default: 13400 },
            "450mm (50KG)": { type: Number, default: 14400 },
            "600mm (50KG)": { type: Number, default: 14800 },
            "900mm (50KG)": { type: Number, default: 17400 },
          },
          accessories: {
            "WICKER BASKET(HETTICH) - for potatoes, onions": {
              type: Number,
              default: 24203,
            },
            "WICKER BASKET(MODA)": { type: Number, default: 8908 },
            "WICKER BASKET(HETTICH)": { type: Number, default: 20522 },
            "WICKER BASKET(HETTICH) - for garlic": {
              type: Number,
              default: 21737,
            },
            "CUTLERY TRAY(900MM)": { type: Number, default: 3000 },
            "CUTLERY TRAY(600MM)": { type: Number, default: 2400 },
            "PLATE TRAY (600MM)": { type: Number, default: 2400 },
            "BOWL OR PLATE ORGANISER": { type: Number, default: 18820 },
          },
        },
      },
    },
    "Masala Pullout": {
      base: { type: Number, default: 0 },
      modules: {
        "SS 304": {
          details: {
            "SS Masala PULL OUT UNIT T2": { type: Number, default: 4314 },
            "SS Masala PULL OUT UNIT T3": { type: Number, default: 5314 },
          },
        },
        Tandem: {
          details: {
            "Tandum Masala PULL OUT UNIT T2": { type: Number, default: 5176.8 },
            "Tandum SS PULL OUT UNIT T3": { type: Number, default: 6376.8 },
          },
        },
      },
    },
    "Wicker basket Unit": {
      base: { type: Number, default: 0 },
      accessories: {
        "WICKER BASKET(HETTICH) - for potatoes, onions": {
          type: Number,
          default: 24203,
        },
        "WICKER BASKET(MODA)": { type: Number, default: 8908 },
        "WICKER BASKET(HETTICH)": { type: Number, default: 20522 },
        "WICKER BASKET(HETTICH) - for garlic": { type: Number, default: 21737 },
      },
    },
    "Shutters Base": {
      base: { type: Number, default: 0 },
      accessories: {
        "MAGIC CORNER (MEDIUM - EXCELLENCE BRAND)": {
          type: Number,
          default: 37230,
        },
        "MAGIC CORNER (HIGH - HETTICH)": { type: Number, default: 65700 },
        "DETERGENT PULL - OUT": { type: Number, default: 6180 },
      },
    },
    Shelve: {
      base: { type: Number, default: 0 },
      accessories: {},
    },
    Shutters: {
      base: { type: Number, default: 0 },
      details: {
        "PUSH TO OPEN": { type: Number, default: 1700 },
        "HYDRAULIC LIFT-UP": { type: Number, default: 1000 },
        "AVANTOS LIFT UP - 2 DOOR": { type: Number, default: 17200 },
        "ALUMINIUM SHUTTER ADITION (ALL GLASS)": {
          type: Number,
          default: 2700,
        },
      },
      accessories: {
        "GTPT UNIT 600mm": { type: Number, default: 4100 },
        "GTPT UNIT 900mm": { type: Number, default: 5200 },
      },
    },
    "Open Unit": {
      base: { type: Number, default: 3000 },
    },
    "Rolling Shutter": {
      base: { type: Number, default: 0 },
      details: {
        "ROLLER SHUTTER (ALUMINIUM - MODA)": { type: Number, default: 48700 },
      },
    },
    Chimney: {
      base: { type: Number, default: 0 },
      details: {
        Standard: { type: Number, default: 0 },
      },
    },
  },
});

partitionPricingSchema.index({ "unitPrices.componentType": 1 });

module.exports = mongoose.model("PartitionPricing", partitionPricingSchema);
