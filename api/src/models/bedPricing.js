// bedPricing.js - corrected schema
const mongoose = require('mongoose');


const bedPricingSchema = new mongoose.Schema({
    types: {
        SINGLE_BED: {
            dimensions: {
                width: { type: Number, default: 900 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 10000 }
        },
        QUEEN_SIZE_BED: {
            dimensions: {
                width: { type: Number, default: 1500 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 25000 }
        },
        KING_SIZE_BED: {
            dimensions: {
                width: { type: Number, default: 1950 },
                length: { type: Number, default: 2100 }
            },
            price: { type: Number, default: 35000 }
        },
        CALIFORNIA_QUEEN_BED: {
            dimensions: {
                width: { type: Number, default: 1650 },
                length: { type: Number, default: 1950 }
            },
            price: { type: Number, default: 30000 }
        },
        CALIFORNIA_KING_BED: {
            dimensions: {
                width: { type: Number, default: 2100 },
                length: { type: Number, default: 2250 }
            },
            price: { type: Number, default: 40000 }
        },
        WALL_MOUNTED_SINGLE_BED: {
            dimensions: {
                width: { type: Number, default: 900 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 25000 }
        },
        WALL_MOUNTED_SINGLE_BED_WITH_STORAGE: {
            dimensions: {
                width: { type: Number, default: 900 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 35000 }
        },
        WALL_MOUNTED_QUEEN_BED: {
            dimensions: {
                width: { type: Number, default: 1500 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 45000 }
        },
        WALL_MOUNTED_QUEEN_BED_WITH_STORAGE: {
            dimensions: {
                width: { type: Number, default: 1500 },
                length: { type: Number, default: 1800 }
            },
            price: { type: Number, default: 58000 }
        }
    },
    accessories: {
        HYDRAULIC_LIFT_UP: { type: Number, default: 8000 },
        BED_WITH_DRAWERS_1: { type: Number, default: 5000 },
        BED_WITH_DRAWERS_2: { type: Number, default: 7500 },
        MANUAL_LIFT_UP: { type: Number, default: 4000 }
    }

});

module.exports = mongoose.model('BedPricing', bedPricingSchema);