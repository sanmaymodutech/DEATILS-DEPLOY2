const mongoose = require('mongoose');

const kitchenPricingSchema = new mongoose.Schema({
    carcass: {
        BWP: { type: Number, default: 789 },
        BWR: { type: Number, default: 717 },
        COM_PLY: { type: Number, default: 760 }
    },
    shutters: {
        BWP_WHITE: { type: Number, default: 450 },
        BWP_FAB_KITCHEN: { type: Number, default: 490 },
        BWR_WHITE: { type: Number, default: 409 },
        COM_PLY_WHITE: { type: Number, default: 300 },
        HDHMR_WHITE: {
            ACRYLIC_GLOSSY: { type: Number, default: 600 },
            ACRYLIC_MATTE: { type: Number, default: 670 },
            PU: { type: Number, default: 700 },
            ROUTED_PU: { type: Number, default: 800 },
            GLAX: { type: Number, default: 800 }
        }
    }
});

module.exports = mongoose.model('KitchenPricing', kitchenPricingSchema);