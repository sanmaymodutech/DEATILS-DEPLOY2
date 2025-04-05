class StudyTableCalculator {

    static PROFILE_SHUTTER_RATE = 1100;

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

    static getProfileShutterPrice(material, shutterType, finish, prices) {
        if (material === 'GLASS_PROFILE') {
            if (!prices?.shutters?.[material]?.[shutterType]?.[finish.toLowerCase()]) {
                throw new Error(`Invalid profile shutter pricing for material: ${material}, type: ${shutterType} and finish: ${finish}`);
            }
            return prices.shutters[material][shutterType][finish.toLowerCase()];
        }

        // Fallback to the fixed rate for backward compatibility
        return this.PROFILE_SHUTTER_RATE;
    }

    static getOpenUnitPrice(material, shutterType, prices) {
        let basePrice;

        // For HDHMR material, use specific shutter type pricing
        if (material === 'HDHMR') {
            if (!prices?.shutters?.HDHMR?.[shutterType]) {
                throw new Error(`Invalid HDHMR shutter pricing for type: ${shutterType}`);
            }
            // Use the white finish price as base
            basePrice = prices.shutters.HDHMR[shutterType].white;
        } else {
            // For other materials, use their base shutter pricing
            if (!prices?.shutters?.[material]) {
                throw new Error(`Invalid shutter pricing for material: ${material}`);
            }
            // Use the white finish price as base
            basePrice = prices.shutters[material].white;
        }

        // Add 25% markup for open unit
        return basePrice * 1.25;
    }

    static getDrawerPrice(width, weight = '30KG', prices) {
        if (!prices?.tandemDrawers) {
            throw new Error('Drawer pricing data not found');
        }

        // Find the closest width bracket
        let widthBracket;
        if (width <= 450) widthBracket = '450mm';
        else if (width <= 600) widthBracket = '600mm';
        else widthBracket = '900mm';

        if (!prices.tandemDrawers[widthBracket]?.[weight]) {
            throw new Error(`Invalid drawer pricing for width: ${widthBracket} and weight: ${weight}`);
        }

        return prices.tandemDrawers[widthBracket][weight];
    }

    static async calculateStudyTablePrice(measurements, config, prices) {
        try {
            const { width, height, depth } = measurements;
            const {
                unitType,
                finish = 'WHITE',
                carcassType,
                shutterMaterial,
                shutterType,
                drawerQuantity,
                drawerWeight = '30KG',
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

            switch (unitType) {
                case 'CARCASS_WITH_SHUTTERS': {
                    if (!carcassType) {
                        throw new Error('Carcass type is required for carcass units');
                    }
                    if (!shutterMaterial) {
                        throw new Error('Shutter material is required for carcass units');
                    }
                    if (shutterMaterial === 'HDHMR' && !shutterType) {
                        throw new Error('Shutter type is required for HDHMR material');
                    }

                    const carcassPrice = this.getCarcassPrice(carcassType, finish, prices);
                    const shutterPrice = this.getShutterPrice(shutterMaterial, finish, shutterType, prices);

                    priceBreakdown.carcass = Math.round(carcassPrice * sqft);
                    priceBreakdown.shutter = Math.round(shutterPrice * sqft);
                    priceBreakdown.ratePerSqFt = { carcass: carcassPrice, shutter: shutterPrice };
                    totalCost = priceBreakdown.carcass + priceBreakdown.shutter;

                    totalCost += calculateShelvesCost();
                    break;
                }
                case 'CARCASS_WITH_PROFILE_SHUTTER': {
                    if (!carcassType) {
                        throw new Error('Carcass type is required for carcass with profile shutter units');
                    }

                    // Support for material and type
                    let profileShutterPrice;
                    if (shutterMaterial && shutterType) {
                        profileShutterPrice = this.getProfileShutterPrice(shutterMaterial, shutterType, finish, prices);
                    } else {
                        profileShutterPrice = this.PROFILE_SHUTTER_RATE;
                    }

                    // Calculate carcass cost
                    const carcassPrice = this.getCarcassPrice(carcassType, finish, prices);
                    const carcassCost = Math.round(carcassPrice * sqft);

                    // Calculate profile shutter cost
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
                    break;
                }
                case 'OPEN_UNIT': {
                    if (!shutterMaterial) {
                        throw new Error('Shutter material is required for open unit');
                    }

                    if (shutterMaterial === 'HDHMR' && !shutterType) {
                        throw new Error('Shutter type is required for HDHMR material');
                    }

                    const openUnitPrice = this.getOpenUnitPrice(shutterMaterial, shutterType, prices);
                    priceBreakdown.openUnit = Math.round(openUnitPrice * sqft);
                    priceBreakdown.ratePerSqFt = { openUnit: openUnitPrice };
                    priceBreakdown.baseShutterPrice = Math.round((openUnitPrice / 1.25) * sqft);
                    priceBreakdown.markup = Math.round((openUnitPrice * sqft) - (openUnitPrice / 1.25 * sqft));

                    totalCost = priceBreakdown.openUnit;

                    if (shelvesRequired && shelvesQuantity > 0) {
                        const shelfSqft = this.calculateSquareFeet(width, depth);
                        let baseShutterPrice;
                        if (shutterMaterial === 'HDHMR') {
                            baseShutterPrice = prices.shutters.HDHMR[shutterType][finish.toLowerCase()];
                        } else {
                            baseShutterPrice = prices.shutters[shutterMaterial][finish.toLowerCase()];
                        }

                        const shelfRate = baseShutterPrice * 1.25;

                        const shelfCostPerUnit = Math.round(shelfRate * shelfSqft);
                        const totalShelfCost = shelfCostPerUnit * shelvesQuantity;

                        priceBreakdown.shelves = {
                            squareFeetPerShelf: shelfSqft,
                            ratePerSqFt: shelfRate,
                            costPerShelf: shelfCostPerUnit,
                            quantity: shelvesQuantity,
                            total: totalShelfCost
                        };
                        totalCost += totalShelfCost;
                    }
                    break;
                }
                case 'LEDGE': {
                    if (!shutterMaterial) {
                        throw new Error('Shutter material is required for ledge unit');
                    }

                    if (shutterMaterial === 'HDHMR' && !shutterType) {
                        throw new Error('Shutter type is required for HDHMR material');
                    }

                    const openUnitPrice = this.getOpenUnitPrice(shutterMaterial, shutterType, prices);
                    priceBreakdown.openUnit = Math.round(openUnitPrice * sqft);
                    priceBreakdown.ratePerSqFt = { openUnit: openUnitPrice };
                    priceBreakdown.baseShutterPrice = Math.round((openUnitPrice / 1.25) * sqft);
                    priceBreakdown.markup = Math.round((openUnitPrice * sqft) - (openUnitPrice / 1.25 * sqft));

                    totalCost = priceBreakdown.openUnit;
                    break;
                }
                case 'DRAWER': {
                    if (!drawerQuantity || drawerQuantity <= 0) {
                        throw new Error('Valid drawer quantity is required');
                    }
                    if (!carcassType) {
                        throw new Error('Carcass type is required for drawer units');
                    }

                    // Calculate carcass cost
                    const carcassPrice = this.getCarcassPrice(carcassType, finish, prices);
                    const carcassCost = Math.round(carcassPrice * sqft);

                    // Calculate drawer mechanism cost
                    const drawerMechanismPrice = this.getDrawerPrice(width, drawerWeight, prices);
                    const totalDrawerMechanismCost = drawerMechanismPrice * drawerQuantity;

                    priceBreakdown.carcass = carcassCost;
                    priceBreakdown.drawerMechanism = totalDrawerMechanismCost;
                    priceBreakdown.ratePerSqFt = { carcass: carcassPrice };
                    priceBreakdown.ratePerDrawer = drawerMechanismPrice;

                    totalCost = carcassCost + totalDrawerMechanismCost;
                    break;
                }
                case 'TOP':
                case 'SIDE': {
                    if (!shutterMaterial) {
                        throw new Error(`Shutter material is required for ${unitType} unit`);
                    }

                    if (shutterMaterial === 'HDHMR' && !shutterType) {
                        throw new Error('Shutter type is required for HDHMR material');
                    }

                    // Calculate only shutter cost for TOP and SIDE units
                    const shutterPrice = this.getShutterPrice(shutterMaterial, finish, shutterType, prices);
                    priceBreakdown.shutter = Math.round(shutterPrice * sqft);
                    priceBreakdown.ratePerSqFt = { shutter: shutterPrice };
                    totalCost = priceBreakdown.shutter;
                    break;
                }
                default:
                    throw new Error(`Invalid unit type: ${unitType}`);
            }

            return {
                squareFeet: sqft,
                ...priceBreakdown,
                total: totalCost
            };
        } catch (error) {
            throw new Error(`Study table price calculation failed: ${error.message}`);
        }
    }
}

module.exports = StudyTableCalculator;