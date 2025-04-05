const mongoose = require('mongoose');

const studyTablePricingSchema = new mongoose.Schema({
    carcass: {
        BWP: {
            white: { type: Number, default: 789 },
            fab: { type: Number, default: 995 }
        },
        BWR: {
            white: { type: Number, default: 717 },
            fab: { type: Number, default: 905 }
        },
        COM_PLY: {
            white: { type: Number, default: 760 },
            fab: { type: Number, default: 943 }
        }
    },
    shutters: {
        BWP: {
            white: { type: Number, default: 450 },
            fab: { type: Number, default: 500 }
        },
        BWR: {
            white: { type: Number, default: 409 },
            fab: { type: Number, default: 459 }
        },
        COM_PLY: {
            white: { type: Number, default: 300 },
            fab: { type: Number, default: 350 }
        },
        HDHMR: {
            ACRYLIC_GLOSSY: {
                white: { type: Number, default: 600 },
                fab: { type: Number, default: 650 }
            },
            ACRYLIC_MATTE: {
                white: { type: Number, default: 670 },
                fab: { type: Number, default: 720 }
            },
            PU: {
                white: { type: Number, default: 700 },
                fab: { type: Number, default: 750 }
            },
            ROUTED_PU: {
                white: { type: Number, default: 800 },
                fab: { type: Number, default: 850 }
            },
            GLAX: {
                white: { type: Number, default: 500 },
                fab: { type: Number, default: 550 }
            }
        },
        GLASS_PROFILE: {
            FROSTED_GLASS: {
                white: { type: Number, default: 1100 },
                fab: { type: Number, default: 1100 }
            },
            CLEAR_GLASS: {
                white: { type: Number, default: 1100 },
                fab: { type: Number, default: 1100 }
            },
            TINTED_GLASS: {
                white: { type: Number, default: 1100 },
                fab: { type: Number, default: 1100 }
            }
        }
    },
    tandemDrawers: {
        '450mm': {
            '30KG': { type: Number, default: 2000 },
            '50KG': { type: Number, default: 2000 }
        },
        '600mm': {
            '30KG': { type: Number, default: 2000 },
            '50KG': { type: Number, default: 2000 }
        },
        '900mm': {
            '30KG': { type: Number, default: 2000 },
            '50KG': { type: Number, default: 2000 }
        }
    },
    openUnit: {
        white: { type: Number, default: 400 },
        fab: { type: Number, default: 450 }
    },
});

module.exports = mongoose.model('StudyTablePricing', studyTablePricingSchema);