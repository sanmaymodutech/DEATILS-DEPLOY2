

class KitchenCalculator {
    static calculateSquareFeet(width, height) {
        return (width * height) / 92900;
    }

    static async calculateSectionPrice(section, type, kitchenType, prices) {
        const sqft = this.calculateSquareFeet(
            section.measurements.width,
            section.measurements.height
        );

        let totalPrice = 0;

        // For loft or semi-modular base, only calculate shutter price
        if (type === 'loft' || (type === 'base' && kitchenType === 'SEMI_MODULAR')) {
            const shutterPrice = this.getShutterPrice(section.shutterType, prices);
            totalPrice = shutterPrice * sqft;

            return {
                shutter: shutterPrice * sqft,
                total: totalPrice
            };
        }

        // For modular kitchen base and wall
        const carcassPrice = this.getCarcassPrice(section.carcassType, prices);
        const shutterPrice = this.getShutterPrice(section.shutterType, prices);
        totalPrice = (carcassPrice + shutterPrice) * sqft;

        return {
            carcass: carcassPrice * sqft,
            shutter: shutterPrice * sqft,
            total: totalPrice
        };
    }

    static getCarcassPrice(type, prices) {
        return prices.carcass[type] || 0;
    }

    static getShutterPrice(shutterType, prices) {
        if (shutterType.material === 'HDHMR_WHITE') {
            return prices.shutters.HDHMR_WHITE[shutterType.finish];
        }
        return prices.shutters[shutterType.material] || 0;
    }
}

module.exports = KitchenCalculator;