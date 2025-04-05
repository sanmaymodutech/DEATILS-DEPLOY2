class WardrobeCalculator {
    static calculateSquareFeet(width, height) {
        // Convert mm to square feet (1 sq ft = 92,900 sq mm)
        const sqft = (width * height) / 92900;
        return Math.round(sqft * 100) / 100; // Round to 2 decimal places
    }

    static getCarcassPrice(type, finish, prices) {
        if (!prices?.carcass?.[type]?.[finish.toLowerCase()]) {
            throw new Error(`Invalid carcass pricing for type: ${type} and finish: ${finish}`);
        }
        return prices.carcass[type][finish.toLowerCase()];
    }

    static getShutterPrice(material, finish, shutterType, prices) {
        if (material === 'HDHMR') {
            if (!prices?.shutters?.HDHMR?.[shutterType]?.[finish.toLowerCase()]) {
                throw new Error(`Invalid HDHMR shutter pricing for type: ${shutterType} and finish: ${finish}`);
            }
            return prices.shutters.HDHMR[shutterType][finish.toLowerCase()];
        }

        if (!prices?.shutters?.[material]?.[finish.toLowerCase()]) {
            throw new Error(`Invalid shutter pricing for material: ${material} and finish: ${finish}`);
        }
        return prices.shutters[material][finish.toLowerCase()];
    }

    static async calculateWardrobePrice(measurements, materials, prices) {
        try {
            const { width, height } = measurements;
            const { carcassType, shutterMaterial, shutterType, finish } = materials;

            // Validate inputs
            if (!width || !height || width <= 0 || height <= 0) {
                throw new Error('Invalid measurements');
            }

            if (!carcassType || !shutterMaterial || !finish) {
                throw new Error('Missing required materials information');
            }

            const sqft = this.calculateSquareFeet(width, height);
            const carcassPrice = this.getCarcassPrice(carcassType, finish, prices);
            const shutterPrice = this.getShutterPrice(shutterMaterial, finish, shutterType, prices);

            const carcassCost = Math.round(carcassPrice * sqft);
            const shutterCost = Math.round(shutterPrice * sqft);
            const totalCost = carcassCost + shutterCost;

            return {
                squareFeet: sqft,
                carcass: carcassCost,
                shutter: shutterCost,
                total: totalCost,
                ratePerSqFt: {
                    carcass: carcassPrice,
                    shutter: shutterPrice
                }
            };
        } catch (error) {
            throw new Error(`Wardrobe price calculation failed: ${error.message}`);
        }
    }
}

module.exports = WardrobeCalculator;