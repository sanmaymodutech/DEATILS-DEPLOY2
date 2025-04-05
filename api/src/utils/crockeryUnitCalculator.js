class CrockeryUnitCalculator {

    static calculateSquareFeet(width, height) {
        const sqft = (width * height) / 92900;
        return Math.round(sqft * 100) / 100;
    }

    static getCarcassPrice(type, finish, prices) {
        if (!prices?.carcass?.[type]?.[finish.toLowerCase()]) {
            throw new Error(`Invalid carcass pricing for type: ${type} and finish: ${finish}`);
        }
        return prices.carcass[type][finish.toLowerCase()];
    }

    static getProfileShutterPrice(material, shutterType, finish, prices) {
        if (!prices?.shutters?.[material]?.[shutterType]?.[finish.toLowerCase()]) {
            throw new Error(`Invalid profile shutter pricing for material: ${material}, type: ${shutterType} and finish: ${finish}`);
        }
        return prices.shutters[material][shutterType][finish.toLowerCase()];
    }

    static async calculateCrockeryUnitPrice(measurements, config, prices) {
        try {
            const { width, height, depth } = measurements;
            const {
                unitType,
                finish = 'WHITE',
                carcassType,
                shutterMaterial,
                shutterType,
                shelvesRequired = false,
                shelvesQuantity = 0
            } = config;

            if (!width || !height || width <= 0 || height <= 0) {
                throw new Error('Invalid measurements');
            }

            const sqft = this.calculateSquareFeet(width, height);
            let totalCost = 0;
            const priceBreakdown = {};

            const calculateShelvesCost = () => {
                if (shelvesRequired && shelvesQuantity > 0) {
                    // Fixed price per shelf (200 INR)
                    const shelfCostPerUnit = 200;
                    const totalShelfCost = shelfCostPerUnit * shelvesQuantity;

                    priceBreakdown.shelves = {
                        costPerShelf: shelfCostPerUnit,
                        quantity: shelvesQuantity,
                        total: totalShelfCost
                    };

                    return totalShelfCost;
                }
                return 0;
            };

            // Currently only supporting CARCASS_WITH_PROFILE_SHUTTER
            if (unitType === 'CARCASS_WITH_PROFILE_SHUTTER') {
                if (!carcassType) {
                    throw new Error('Carcass type is required for carcass with profile shutter units');
                }
                if (!shutterMaterial) {
                    throw new Error('Shutter material is required for profile shutter');
                }
                if (shutterMaterial === 'GLASS_PROFILE' && !shutterType) {
                    throw new Error('Shutter type is required for GLASS_PROFILE material');
                }

                // Calculate carcass cost
                const carcassPrice = this.getCarcassPrice(carcassType, finish, prices);
                const carcassCost = Math.round(carcassPrice * sqft);

                // Calculate profile shutter cost
                const profileShutterPrice = this.getProfileShutterPrice(shutterMaterial, shutterType, finish, prices);
                const profileShutterCost = Math.round(profileShutterPrice * sqft);

                priceBreakdown.carcass = carcassCost;
                priceBreakdown.profileShutter = profileShutterCost;
                priceBreakdown.ratePerSqFt = {
                    carcass: carcassPrice,
                    profileShutter: profileShutterPrice
                };

                totalCost = carcassCost + profileShutterCost;

                // Add shelves cost if required
                totalCost += calculateShelvesCost();
            } else {
                throw new Error(`Invalid unit type: ${unitType}. Only CARCASS_WITH_PROFILE_SHUTTER is supported.`);
            }

            return {
                squareFeet: sqft,
                ...priceBreakdown,
                total: totalCost
            };
        } catch (error) {
            throw new Error(`Crockery unit price calculation failed: ${error.message}`);
        }
    }
}

module.exports = CrockeryUnitCalculator;