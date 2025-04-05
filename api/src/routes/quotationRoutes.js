const express = require("express");
const router = express.Router();
const Quotation = require("../models/quotation");
const { protect, authorize } = require("../middleware/auth");
const kitchenPricing = require("../models/kitchenPricing");
const KitchenCalculator = require("../utils/kitchenCalculator");
const PartitionPricing = require("../models/partitionPricing");
const WardrobeCalculator = require("../utils/wardrobeCalculator");
const WardrobePricing = require("../models/wardrobePricing");
const TVUnitCalculator = require("../utils/tvUnitCalculator");
const TVUnitPricing = require("../models/tvUnitPricing");
const CustomComponent = require("../models/CustomComponent");
const CrockeryUnitCalculator = require("../utils/crockeryUnitCalculator");
const ConsoleUnitCalculator = require("../utils/consoleUnitCalculator");
const ConsoleUnitPricing = require("../models/consoleUnitPricing");
const AccessoryPricing = require("../models/accessoryPricing");
const BedPricing = require("../models/bedPricing");
const StudyTableCalculator = require("../utils/studyTableCalculator");
const StudyTablePricing = require("../models/studyTablePricing");

router.use(protect);

// Get available kitchen shapes
router.get("/kitchen-shapes", (req, res) => {
  res.json({
    success: true,
    data: Quotation.KITCHEN_SHAPES,
  });
});

// Get available room types
router.get("/room-types", (req, res) => {
  res.json({
    success: true,
    data: Quotation.ROOM_TYPES,
  });
});

router.get("/bhk-rooms/:bhk", (req, res) => {
  const rooms = Quotation.getBHKRooms(req.params.bhk);
  res.json({
    success: true,
    data: rooms,
  });
});

router.get("/", async (req, res, next) => {
  try {
    let quotations;
    if (req.user.role === "admin") {
      quotations = await Quotation.find().sort({ createdAt: -1 });
    } else {
      quotations = await Quotation.find({ createdBy: req.user.id });
    }
    res.json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    // Check authorization: only admins or the user who created the quotation can delete it
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quotation",
      });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/available-wall-components", async (req, res, next) => {
  try {
    const partitionPricing = await PartitionPricing.findOne().lean().exec();

    if (!partitionPricing || !partitionPricing.unitPrices) {
      return res.status(404).json({
        success: false,
        error: "Partition pricing data not found",
      });
    }

    const wallComponents = {};
    const wallComponentTypes = [
      "Shutters",
      "Open Unit",
      "Rolling Shutter",
      "Chimney",
    ];

    // Filter only wall components
    wallComponentTypes.forEach((componentType) => {
      if (partitionPricing.unitPrices[componentType]) {
        wallComponents[componentType] = {
          basePrice: partitionPricing.unitPrices[componentType].base || 0,
          hasModules: false,
          type: "wall",
          details: partitionPricing.unitPrices[componentType].details
            ? Object.keys(partitionPricing.unitPrices[componentType].details)
            : [],
          accessories: partitionPricing.unitPrices[componentType].accessories
            ? Object.keys(
                partitionPricing.unitPrices[componentType].accessories
              )
            : [],
        };
      }
    });

    const validationInfo = {
      supportedComponents: wallComponentTypes,
      minimumWidth: 0,
      maximumWidth: Infinity,
      requiredFields: ["width", "componentType"],
    };

    res.json({
      success: true,
      data: {
        components: wallComponents,
        validation: validationInfo,
      },
    });
  } catch (error) {
    console.error("Error in available-wall-components:", error);
    next(
      new Error("Failed to fetch available wall components: " + error.message)
    );
  }
});

router.get("/available-components", async (req, res, next) => {
  try {
    const partitionPricing = await PartitionPricing.findOne().lean().exec();

    if (!partitionPricing || !partitionPricing.unitPrices) {
      return res.status(404).json({
        success: false,
        error: "Partition pricing data not found",
      });
    }

    const formattedComponents = {};
    const wallComponentTypes = ["Shutters", "Open Unit", "Rolling Shutter"];

    Object.entries(partitionPricing.unitPrices).forEach(
      ([componentType, data]) => {
        // Skip wall components
        if (wallComponentTypes.includes(componentType)) {
          return;
        }

        formattedComponents[componentType] = {
          basePrice: data.base || 0,
          hasModules: Boolean(data.modules),
          type: "base",
          modules: {},
          accessories: [],
          details: data.details ? Object.keys(data.details) : [],
        };

        if (data.modules) {
          Object.entries(data.modules).forEach(([moduleKey, moduleData]) => {
            formattedComponents[componentType].modules[moduleKey] = {
              details: moduleData.details
                ? Object.keys(moduleData.details)
                : [],
              accessories: moduleData.accessories
                ? Object.keys(moduleData.accessories)
                : [],
            };
          });
        }

        if (data.accessories) {
          formattedComponents[componentType].accessories = Object.keys(
            data.accessories
          );
        }
      }
    );

    const validationInfo = {
      supportedComponents: Object.keys(formattedComponents),
      minimumWidth: 0,
      maximumWidth: Infinity,
      requiredFields: ["width", "componentType"],
    };

    res.json({
      success: true,
      data: {
        components: formattedComponents,
        validation: validationInfo,
      },
    });
  } catch (error) {
    console.error("Error in available-components:", error);
    next(new Error("Failed to fetch available components: " + error.message));
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate({
      path: "rooms.customComponents",
      model: "CustomComponent",
    });
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }
    // Check if user has permission to view this quotation
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this quotation",
      });
    }

    // Calculate total price for each room
    const quotationData = quotation.toObject();

    quotationData.rooms = quotationData.rooms.map((room) => {
      let roomTotal = 0;

      // Calculate kitchen price if exists
      if (room.kitchen) {
        let kitchenTotal = 0;

        // Add up section prices
        Object.keys(room.kitchen.sections).forEach((sectionKey) => {
          const section = room.kitchen.sections[sectionKey];

          // Add base unit prices
          if (section.base) {
            if (section.base.price) {
              kitchenTotal += section.base.price.total || 0;
            }

            // Calculate partition prices for base
            if (section.base.partitions && section.base.partitions.length > 0) {
              section.base.partitionsTotal = section.base.partitions.reduce(
                (total, partition) => {
                  return total + (partition.price?.total || 0);
                },
                0
              );
              kitchenTotal += section.base.partitionsTotal;
            }
          }

          // Add wall unit prices
          if (section.wall) {
            if (section.wall.price) {
              kitchenTotal += section.wall.price.total || 0;
            }

            // Calculate partition prices for wall
            if (section.wall.partitions && section.wall.partitions.length > 0) {
              section.wall.partitionsTotal = section.wall.partitions.reduce(
                (total, partition) => {
                  return total + (partition.price?.total || 0);
                },
                0
              );
              kitchenTotal += section.wall.partitionsTotal;
            }
          }

          // Add loft unit prices
          if (section.loft) {
            if (section.loft.price) {
              kitchenTotal += section.loft.price.total || 0;
            }

            // Calculate partition prices for loft
            if (section.loft.partitions && section.loft.partitions.length > 0) {
              section.loft.partitionsTotal = section.loft.partitions.reduce(
                (total, partition) => {
                  return total + (partition.price?.total || 0);
                },
                0
              );
              kitchenTotal += section.loft.partitionsTotal;
            }
          }
        });

        room.kitchen.totalPrice = kitchenTotal;
        roomTotal += kitchenTotal;
      }

      // Add wardrobe price if exists
      if (room.wardrobes && room.wardrobes.length > 0) {
        const wardrobesTotal = room.wardrobes.reduce((total, wardrobe) => {
          return total + (wardrobe.totalPrice || 0);
        }, 0);

        room.wardrobesTotal = wardrobesTotal; // Optional: add a summary property
        roomTotal += wardrobesTotal;
      }

      if (room.shoeRacks && room.shoeRacks.length > 0) {
        const shoeRacksTotal = room.shoeRacks.reduce((total, rack) => {
          return total + (rack.totalPrice || 0);
        }, 0);

        room.shoeRacksTotal = shoeRacksTotal; // Optional: add a summary property
        roomTotal += shoeRacksTotal;
      }

      if (room.crockeryUnits && room.crockeryUnits.length > 0) {
        const crockeryUnitsTotal = room.crockeryUnits.reduce((total, rack) => {
          return total + (rack.totalPrice || 0);
        }, 0);

        room.crockeryUnitsTotal = crockeryUnitsTotal; // Optional: add a summary property
        roomTotal += crockeryUnitsTotal;
      }

      // Add TV units prices if exists (now handling as an array)
      if (room.tvUnits && room.tvUnits.length > 0) {
        const tvUnitsTotal = room.tvUnits.reduce((total, unit) => {
          return total + (unit.totalPrice || 0);
        }, 0);

        room.tvUnitsTotal = tvUnitsTotal; // Optional: add a summary property
        roomTotal += tvUnitsTotal;
      }

      // Add custom components prices if any
      //   if (room.customComponents && room.customComponents.length > 0) {
      //     const customComponentsTotal = room.customComponents.reduce(
      //       (total, component) => {
      //         return total + (component.totalPrice || 0);
      //       },
      //       0
      //     );

      //     room.customComponentsTotal = customComponentsTotal; // Optional: add a summary property
      //     roomTotal += customComponentsTotal;
      //   }

      // Add total price to room
      room.totalPrice = roomTotal;

      return room;
    });

    // Calculate the total quotation price
    quotationData.totalPrice = quotationData.rooms.reduce((total, room) => {
      return total + (room.totalPrice || 0);
    }, 0);

    res.json({
      success: true,
      data: quotationData,
    });
  } catch (error) {
    next(error);
  }
});

// Create initial quotation with customer info
router.post("/", authorize("designer", "admin"), async (req, res, next) => {
  try {
    const quotation = await Quotation.create({
      ...req.body,
      rooms: [],
      createdBy: req.user.id,
    });
    res.status(201).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

// update room selection
router.patch("/:id/rooms/:roomIndex/selection", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { selected } = req.body;
    quotation.rooms[req.params.roomIndex].selected = selected;
    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/enable-onsite-work", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { enabled } = req.body;
    quotation.onsiteWorkEnabled = enabled;

    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/customRooms/:roomIndex/selection",
  async (req, res, next) => {
    try {
      const quotation = await Quotation.findById(req.params.id);

      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Check authorization
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const { selected } = req.body;
      quotation.customRooms[req.params.roomIndex].selected = selected;
      await quotation.save();

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/:id/customRooms/:roomIndex/label", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { label } = req.body;
    quotation.customRooms[req.params.roomIndex].label = label;
    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

// Update room label
router.patch("/:id/rooms/:roomIndex/label", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { label } = req.body;
    quotation.rooms[req.params.roomIndex].label = label;
    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

// Update room label
router.patch("/:id/rooms/:roomIndex/label", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { label } = req.body;
    quotation.rooms[req.params.roomIndex].label = label;
    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

// Add custom room
router.post("/:id/custom-rooms", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const { type, label } = req.body;
    quotation.customRooms.push({
      type,
      label,
      selected: true,
    });

    await quotation.save();

    res.json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
});

const KITCHEN_SHAPES = {
  NONE: "None",
  SINGLE_SLAB: "Single Slab",
  L_SHAPE: "L-Shape",
  U_SHAPE: "U-Shape",
  G_SHAPE: "G-Shape",
  PARALLEL: "Parallel",
};

router.patch("/:id/rooms/:roomIndex/kitchen-shape", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];

    if (!room || room.type !== "Kitchen") {
      return res.status(400).json({
        success: false,
        error: "Invalid room or room is not a kitchen",
      });
    }

    const { shape } = req.body;

    if (!Object.values(KITCHEN_SHAPES).includes(shape)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid kitchen shape. Must be one of: " +
          Object.values(KITCHEN_SHAPES).join(", "),
      });
    }

    const baseSection = {
      base: {
        measurements: { width: 0, depth: 0, height: 0 },
        partitions: [],
        remainingWidth: 0,
      },
      wall: {
        measurements: { width: 0, depth: 0, height: 0 },
        partitions: [],
        remainingWidth: 0,
      },
      loft: {
        measurements: { width: 0, depth: 0, height: 0 },
        partitions: [],
        remainingWidth: 0,
      },
    };

    let sections = {};
    switch (shape) {
      case KITCHEN_SHAPES.NONE:
        sections = {};
        break;
      case KITCHEN_SHAPES.SINGLE_SLAB:
        sections = {
          A: { ...baseSection },
        };
        break;
      case KITCHEN_SHAPES.L_SHAPE:
      case KITCHEN_SHAPES.PARALLEL:
        sections = {
          A: { ...baseSection },
          B: { ...baseSection },
        };
        break;
      case KITCHEN_SHAPES.U_SHAPE:
        sections = {
          A: { ...baseSection },
          B: { ...baseSection },
          C: { ...baseSection },
        };
        break;
      case KITCHEN_SHAPES.G_SHAPE:
        sections = {
          A: { ...baseSection },
          B: { ...baseSection },
          C: { ...baseSection },
          D: { ...baseSection },
        };
        break;
    }

    room.kitchen.shape = shape;
    room.kitchen.sections = sections;

    await quotation.save();

    res.json({
      success: true,
      data: {
        shape: room.kitchen.shape,
        sections: room.kitchen.sections,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update kitchen measurements for a room
router.put(
  "/:id/rooms/:roomIndex/kitchen/measurements",
  async (req, res, next) => {
    try {
      const { sections } = req.body;
      const quotation = await Quotation.findById(req.params.id);

      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      Object.keys(sections).forEach((sectionKey) => {
        const section = sections[sectionKey];
        ["base", "wall", "loft"].forEach((cabinetType) => {
          if (section[cabinetType]) {
            section[cabinetType].remainingWidth =
              section[cabinetType].measurements.width;
            section[cabinetType].partitions = [];
          }
        });
      });
      room.kitchen.sections = sections;
      await quotation.save();

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/rooms/:roomIndex/kitchen/loft-partition",
  async (req, res, next) => {
    try {
      const { sectionKey, width } = req.body;

      // Validate required fields
      if (!sectionKey || !width) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: sectionKey and width are required",
        });
      }

      // Width should be a number
      if (typeof width !== "number" || width <= 0) {
        return res.status(400).json({
          success: false,
          error: "Width must be a positive number",
        });
      }

      // Find quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Find the loft cabinet
      if (!room.kitchen?.sections?.[sectionKey]?.loft) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or loft cabinet not defined",
        });
      }

      const loftCabinet = room.kitchen.sections[sectionKey].loft;

      // Check if there's enough remaining width
      if (typeof loftCabinet.remainingWidth !== "number") {
        loftCabinet.remainingWidth = loftCabinet.measurements.width || 0;
      }

      if (width > loftCabinet.remainingWidth) {
        return res.status(400).json({
          success: false,
          error: `Insufficient space. Remaining width: ${loftCabinet.remainingWidth}mm, requested width: ${width}mm`,
        });
      }

      // Initialize partitions array if not exists
      if (!loftCabinet.partitions) {
        loftCabinet.partitions = [];
      }

      // Create a simple loft partition
      const loftPartition = {
        width: width,
        type: "loft",
        price: {
          base: 0,
          total: 0, // We can use a default price or calculate based on width if needed
        },
      };

      // Add the partition
      loftCabinet.partitions.push(loftPartition);
      loftCabinet.remainingWidth -= width;

      // Mark the kitchen section as modified
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          addedPartition: loftPartition,
          remainingWidth: loftCabinet.remainingWidth,
          totalPartitions: loftCabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Loft partition creation error:", error);
      next(error);
    }
  }
);

router.put(
  "/:id/rooms/:roomIndex/kitchen/loft-partition/:partitionIndex",
  async (req, res, next) => {
    try {
      const { sectionKey, width } = req.body;

      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Find the loft cabinet
      if (!room.kitchen?.sections?.[sectionKey]?.loft) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or loft cabinet not defined",
        });
      }

      const loftCabinet = room.kitchen.sections[sectionKey].loft;

      // Check if partition exists
      const partitionIndex = parseInt(req.params.partitionIndex);
      if (
        isNaN(partitionIndex) ||
        partitionIndex < 0 ||
        !loftCabinet.partitions ||
        partitionIndex >= loftCabinet.partitions.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Partition not found",
        });
      }

      // Get the old partition for width comparison
      const oldPartition = loftCabinet.partitions[partitionIndex];

      // Calculate width difference
      const widthDiff = width - oldPartition.width;

      // Check if there's enough remaining space for the width change
      if (widthDiff > loftCabinet.remainingWidth) {
        return res.status(400).json({
          success: false,
          error: `Insufficient space. Remaining width: ${loftCabinet.remainingWidth}mm, required additional width: ${widthDiff}mm`,
        });
      }

      // Update the partition
      loftCabinet.partitions[partitionIndex].width = width;
      loftCabinet.remainingWidth -= widthDiff;

      // Mark the kitchen section as modified
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          updatedPartition: loftCabinet.partitions[partitionIndex],
          remainingWidth: loftCabinet.remainingWidth,
          totalPartitions: loftCabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Loft partition update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/kitchen/loft-partition/:partitionIndex",
  async (req, res, next) => {
    try {
      const { sectionKey } = req.query;

      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Find the loft cabinet
      if (!room.kitchen?.sections?.[sectionKey]?.loft) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or loft cabinet not defined",
        });
      }

      const loftCabinet = room.kitchen.sections[sectionKey].loft;

      // Check if partition exists
      const partitionIndex = parseInt(req.params.partitionIndex);
      if (
        isNaN(partitionIndex) ||
        partitionIndex < 0 ||
        !loftCabinet.partitions ||
        partitionIndex >= loftCabinet.partitions.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Partition not found",
        });
      }

      // Get the partition to delete
      const partitionToDelete = loftCabinet.partitions[partitionIndex];

      // Return the width to the remaining width
      loftCabinet.remainingWidth += partitionToDelete.width;

      // Remove the partition
      loftCabinet.partitions.splice(partitionIndex, 1);

      // Mark the kitchen section as modified
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          message: "Loft partition deleted successfully",
          remainingWidth: loftCabinet.remainingWidth,
          totalPartitions: loftCabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Loft partition deletion error:", error);
      next(error);
    }
  }
);

router.post(
  "/:id/rooms/:roomIndex/kitchen/partition",
  async (req, res, next) => {
    try {
      const { sectionKey, cabinetType, partition } = req.body;

      // Validate input parameters
      if (!sectionKey || !cabinetType || !partition) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required parameters: sectionKey, cabinetType, or partition",
        });
      }

      // Fetch partition pricing data
      const partitionPricing = await PartitionPricing.findOne().lean();
      if (!partitionPricing) {
        return res.status(404).json({
          success: false,
          error: "Partition pricing data not found",
        });
      }

      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Validate room and kitchen
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Validate section and cabinet type
      if (!room.kitchen?.sections?.[sectionKey]?.[cabinetType]) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or cabinet type",
        });
      }

      const cabinet = room.kitchen.sections[sectionKey][cabinetType];

      // Validate component type
      if (!partitionPricing.unitPrices[partition.componentType]) {
        return res.status(400).json({
          success: false,
          error: `Invalid component type. Available types: ${Object.keys(
            partitionPricing.unitPrices
          ).join(", ")}`,
        });
      }

      // Special handling for zero-cost components like Chimney
      if (partition.componentType === "Chimney") {
        const partitionWithCost = {
          ...partition,
          price: {
            base: 0,
            total: 0,
          },
        };

        // Initialize partitions array if not exists
        cabinet.partitions = cabinet.partitions || [];

        // Validate remaining width
        cabinet.remainingWidth =
          cabinet.remainingWidth || cabinet.measurements.width || 0;

        if (partition.width > cabinet.remainingWidth) {
          return res.status(400).json({
            success: false,
            error: `Insufficient space. Remaining width: ${cabinet.remainingWidth}mm`,
          });
        }

        // Add partition and update remaining width
        cabinet.partitions.push(partitionWithCost);
        cabinet.remainingWidth -= partitionWithCost.width;
        room.markModified("kitchen.sections");

        await quotation.save();

        return res.json({
          success: true,
          data: {
            addedPartition: partitionWithCost,
            remainingWidth: cabinet.remainingWidth,
            totalPartitions: cabinet.partitions.length,
          },
        });
      }

      // Detailed validation for components with more complex requirements
      const componentData =
        partitionPricing.unitPrices[partition.componentType];

      // Module validation
      if (partition.module) {
        const moduleData = componentData.modules?.[partition.module];
        if (!moduleData) {
          return res.status(400).json({
            success: false,
            error: `Invalid module for ${
              partition.componentType
            }. Available modules: ${Object.keys(
              componentData.modules || {}
            ).join(", ")}`,
          });
        }
      }

      // Details validation (for drawer components)
      if (partition.componentType.includes("Drawer")) {
        const requiredDetailsCount = partition.componentType.includes(
          "2 Drawer"
        )
          ? 2
          : partition.componentType.includes("3 Drawer")
          ? 3
          : 1;

        if (
          !partition.details ||
          partition.details.length !== requiredDetailsCount
        ) {
          return res.status(400).json({
            success: false,
            error: `${partition.componentType} requires exactly ${requiredDetailsCount} details`,
          });
        }
      }

      // Accessories validation
      if (partition.accessories && partition.accessories.length > 0) {
        const validAccessories =
          componentData.modules?.[partition.module]?.accessories ||
          componentData.accessories ||
          {};

        for (const accessory of partition.accessories) {
          const accessoryName =
            typeof accessory === "string" ? accessory : accessory.name;
          if (!validAccessories[accessoryName]) {
            return res.status(400).json({
              success: false,
              error: `Invalid accessory "${accessoryName}". Available accessories: ${Object.keys(
                validAccessories
              ).join(", ")}`,
            });
          }
        }
      }

      // Calculate partition cost
      const partitionWithCost = await (cabinetType === "wall"
        ? calculateWallPartitionCost(partition, partitionPricing)
        : calculatePartitionCost(
            partition,
            partitionPricing,
            room.kitchen.type
          ));

      // Initialize partitions array and remaining width
      cabinet.partitions = cabinet.partitions || [];
      cabinet.remainingWidth =
        cabinet.remainingWidth || cabinet.measurements.width || 0;

      // Validate remaining width
      if (partitionWithCost.width > cabinet.remainingWidth) {
        return res.status(400).json({
          success: false,
          error: `Insufficient space. Remaining width: ${cabinet.remainingWidth}mm`,
        });
      }

      // Add partition and update remaining width
      cabinet.partitions.push(partitionWithCost);
      cabinet.remainingWidth -= partitionWithCost.width;
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          addedPartition: partitionWithCost,
          remainingWidth: cabinet.remainingWidth,
          totalPartitions: cabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Partition creation error:", error);
      next(error);
    }
  }
);

router.put(
  "/:id/rooms/:roomIndex/kitchen/partition/:partitionIndex",
  async (req, res, next) => {
    try {
      const { sectionKey, cabinetType, partition } = req.body;

      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Find the cabinet
      if (!room.kitchen?.sections?.[sectionKey]?.[cabinetType]) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or cabinet type",
        });
      }

      const cabinet = room.kitchen.sections[sectionKey][cabinetType];

      // Check if partition exists
      const partitionIndex = parseInt(req.params.partitionIndex);
      if (
        isNaN(partitionIndex) ||
        partitionIndex < 0 ||
        partitionIndex >= cabinet.partitions.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Partition not found",
        });
      }

      // Get partition pricing data
      const partitionPricing = await PartitionPricing.findOne().lean();
      if (!partitionPricing) {
        return res.status(404).json({
          success: false,
          error: "Partition pricing data not found",
        });
      }

      // Get the old partition for width comparison
      const oldPartition = cabinet.partitions[partitionIndex];

      // Validate component type
      if (!partitionPricing.unitPrices[partition.componentType]) {
        return res.status(400).json({
          success: false,
          error: `Invalid component type. Available types: ${Object.keys(
            partitionPricing.unitPrices
          ).join(", ")}`,
        });
      }

      // Calculate new width difference
      const widthDiff = partition.width - oldPartition.width;

      // Check if there's enough remaining space for the width change
      if (widthDiff > cabinet.remainingWidth) {
        return res.status(400).json({
          success: false,
          error: `Insufficient space. Remaining width: ${cabinet.remainingWidth}mm, required additional width: ${widthDiff}mm`,
        });
      }

      // Validate module, details, and accessories (reuse the validation from the POST endpoint)
      const componentData =
        partitionPricing.unitPrices[partition.componentType];

      // Validate module and details based on component type
      if (partition.module) {
        const moduleData = componentData.modules?.[partition.module];
        if (!moduleData) {
          return res.status(400).json({
            success: false,
            error: `Invalid module for ${
              partition.componentType
            }. Available modules: ${Object.keys(
              componentData.modules || {}
            ).join(", ")}`,
          });
        }

        // Validate details based on component type
        const requiredDetailsCount = partition.componentType.includes(
          "2 Drawer"
        )
          ? 2
          : partition.componentType.includes("3 Drawer")
          ? 3
          : 1;

        if (
          !partition.details ||
          partition.details.length !== requiredDetailsCount
        ) {
          return res.status(400).json({
            success: false,
            error: `${partition.componentType} requires exactly ${requiredDetailsCount} details`,
          });
        }

        const availableDetails = Object.keys(moduleData.details || {});
        for (const detailObj of partition.details) {
          if (!availableDetails.includes(detailObj.detail)) {
            return res.status(400).json({
              success: false,
              error: `Invalid detail for ${
                partition.componentType
              } with module ${
                partition.module
              }. Available details: ${availableDetails.join(", ")}`,
            });
          }
        }
      }

      // Validate accessories
      if (partition.accessories && partition.accessories.length > 0) {
        const validAccessories =
          componentData.modules?.[partition.module]?.accessories ||
          componentData.accessories ||
          {};

        for (const accessory of partition.accessories) {
          const accessoryName =
            typeof accessory === "string" ? accessory : accessory.name;
          if (!validAccessories[accessoryName]) {
            return res.status(400).json({
              success: false,
              error: `Invalid accessory "${accessoryName}". Available accessories: ${Object.keys(
                validAccessories
              ).join(", ")}`,
            });
          }
        }
      }

      // Calculate the updated partition with costs
      let partitionWithCost;
      if (cabinetType === "wall") {
        partitionWithCost = await calculateWallPartitionCost(
          partition,
          partitionPricing
        );
      } else {
        partitionWithCost = await calculatePartitionCost(
          partition,
          partitionPricing,
          room.kitchen.type
        );
      }

      // Update the partition and adjust the remaining width
      cabinet.partitions[partitionIndex] = partitionWithCost;
      cabinet.remainingWidth -= widthDiff;

      // Mark the kitchen section as modified for mongoose to detect changes
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          updatedPartition: partitionWithCost,
          remainingWidth: cabinet.remainingWidth,
          totalPartitions: cabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Partition update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/kitchen/partition/:partitionIndex",
  async (req, res, next) => {
    try {
      const { sectionKey, cabinetType } = req.query;

      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      // Find the cabinet
      if (!room.kitchen?.sections?.[sectionKey]?.[cabinetType]) {
        return res.status(400).json({
          success: false,
          error: "Invalid section or cabinet type",
        });
      }

      const cabinet = room.kitchen.sections[sectionKey][cabinetType];

      // Check if partition exists
      const partitionIndex = parseInt(req.params.partitionIndex);
      if (
        isNaN(partitionIndex) ||
        partitionIndex < 0 ||
        partitionIndex >= cabinet.partitions.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Partition not found",
        });
      }

      // Get the partition to delete
      const partitionToDelete = cabinet.partitions[partitionIndex];

      // Return the width to the remaining width
      cabinet.remainingWidth += partitionToDelete.width;

      // Remove the partition
      cabinet.partitions.splice(partitionIndex, 1);

      // Mark the kitchen section as modified for mongoose to detect changes
      room.markModified("kitchen.sections");

      await quotation.save();

      res.json({
        success: true,
        data: {
          message: "Partition deleted successfully",
          remainingWidth: cabinet.remainingWidth,
          totalPartitions: cabinet.partitions.length,
        },
      });
    } catch (error) {
      console.error("Partition deletion error:", error);
      next(error);
    }
  }
);

router.get(
  "/:id/rooms/:roomIndex/kitchen/remaining-space",
  async (req, res, next) => {
    try {
      const { sectionKey, cabinetType } = req.query;
      const quotation = await Quotation.findById(req.params.id);

      const room = quotation.rooms[req.params.roomIndex];
      const cabinet = room.kitchen.sections[sectionKey][cabinetType];

      res.json({
        success: true,
        data: {
          totalWidth: cabinet.measurements.width,
          totalHeight: cabinet.measurements.height,
          remainingWidth: cabinet.remainingWidth,
          usedWidth: cabinet.measurements.width - cabinet.remainingWidth,
          partitions: cabinet.partitions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/wardrobe", async (req, res, next) => {
  try {
    const { measurements, finish, carcassType, shutterMaterial, shutterType } =
      req.body;

    if (!measurements || !finish || !carcassType || !shutterMaterial) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: measurements, finish, carcassType, shutterMaterial",
      });
    }

    // Validate measurements
    if (!measurements.width || !measurements.height || !measurements.depth) {
      return res.status(400).json({
        success: false,
        error: "Invalid measurements: width, height, and depth are required",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Authorization check
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get pricing data
    const prices = await WardrobePricing.findOne();
    if (!prices) {
      return res.status(500).json({
        success: false,
        error: "Wardrobe pricing data not found",
      });
    }

    // Calculate prices
    const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
      measurements,
      { carcassType, shutterMaterial, shutterType, finish },
      prices
    );

    // Create new wardrobe object
    const newWardrobe = {
      measurements,
      finish,
      carcass: {
        type: carcassType,
        price: priceCalculation.carcass,
      },
      shutter: {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      },
      totalPrice: priceCalculation.total,
    };

    if (!room.wardrobes) {
      room.wardrobes = [];
      if (room.wardrobe) {
        room.wardrobes.push(room.wardrobe);
      }
    }

    room.wardrobes.push(newWardrobe);

    room.wardrobe = newWardrobe;

    await quotation.save();

    res.json({
      success: true,
      data: {
        wardrobes: room.wardrobes,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Wardrobe calculation error:", error);
    next(new Error("Failed to calculate wardrobe price: " + error.message));
  }
});

router.put(
  "/:id/rooms/:roomIndex/wardrobe/:wardrobeIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
      } = req.body;
      const { id, roomIndex, wardrobeIndex } = req.params;

      // Input validation
      if (!measurements || !finish || !carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: measurements, finish, carcassType, shutterMaterial",
        });
      }

      // Validate measurements
      if (!measurements.width || !measurements.height || !measurements.depth) {
        return res.status(400).json({
          success: false,
          error: "Invalid measurements: width, height, and depth are required",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if wardrobe array exists and has the specified index
      if (!room.wardrobes || !room.wardrobes[wardrobeIndex]) {
        return res.status(404).json({
          success: false,
          error: "Wardrobe not found at specified index",
        });
      }

      // Get pricing data
      const prices = await WardrobePricing.findOne();
      if (!prices) {
        return res.status(500).json({
          success: false,
          error: "Wardrobe pricing data not found",
        });
      }

      // Calculate prices
      const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
        measurements,
        { carcassType, shutterMaterial, shutterType, finish },
        prices
      );

      // Update wardrobe object
      const updatedWardrobe = {
        measurements,
        finish,
        carcass: {
          type: carcassType,
          price: priceCalculation.carcass,
        },
        shutter: {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        },
        totalPrice: priceCalculation.total,
        // Preserve existing units if any
        units: room.wardrobes[wardrobeIndex].units || [],
      };

      // Update the wardrobe at specified index
      room.wardrobes[wardrobeIndex] = updatedWardrobe;

      // If this is also the main wardrobe, update that too
      if (room.wardrobe && room.wardrobe === room.wardrobes[wardrobeIndex]) {
        room.wardrobe = updatedWardrobe;
      }

      // Recalculate room total if needed
      if (room.calculateTotal) {
        room.calculateTotal();
      }

      await quotation.save();

      res.json({
        success: true,
        data: {
          wardrobe: updatedWardrobe,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Wardrobe update error:", error);
      next(new Error("Failed to update wardrobe: " + error.message));
    }
  }
);

router.put(
  "/:id/rooms/:roomIndex/wardrobe/:wardrobeIndex/units",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish = "WHITE",
        carcassType,
        drawerQuantity,
        drawerWeight = "30KG",
        shelvesQuantity,
        verticalLineQuantity,
      } = req.body;

      // Validate inputs based on unit type
      switch (unitType) {
        case "DRAWER":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Invalid measurements for drawer",
            });
          }
          if (!drawerQuantity || drawerQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid drawer quantity is required",
            });
          }
          if (!carcassType) {
            return res.status(400).json({
              success: false,
              error: "Carcass type is required for drawer units",
            });
          }
          break;

        case "SHELVES":
          if (!shelvesQuantity || shelvesQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid shelves quantity is required",
            });
          }
          break;

        case "VERTICAL_LINE":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Measurements are required for vertical line",
            });
          }
          if (!verticalLineQuantity || verticalLineQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid vertical line quantity is required",
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Invalid unit type",
          });
      }

      // Find quotation and validate (existing authorization logic)
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check (existing logic)
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if wardrobe exists
      const wardrobe = room.wardrobes[req.params.wardrobeIndex];
      if (!wardrobe) {
        return res.status(404).json({
          success: false,
          error: "Wardrobe not found",
        });
      }

      // Get pricing data
      const wardrobePrices = await WardrobePricing.findOne();
      const tvUnitPrices = await TVUnitPricing.findOne();

      // Prepare new unit based on type
      let newDrawerUnit;
      switch (unitType) {
        case "DRAWER": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);

          // Calculate carcass cost
          const carcassPrice = TVUnitCalculator.getCarcassPrice(
            carcassType,
            finish,
            wardrobePrices
          );
          const carcassCost = Math.round(carcassPrice * sqft);

          // Calculate drawer mechanism cost
          const drawerMechanismPrice = TVUnitCalculator.getDrawerPrice(
            width,
            drawerWeight,
            tvUnitPrices
          );
          const totalDrawerMechanismCost =
            drawerMechanismPrice * drawerQuantity;

          newDrawerUnit = {
            measurements,
            unitType: "DRAWER",
            finish,
            carcass: {
              type: carcassType,
              price: carcassCost,
            },
            drawer: {
              quantity: drawerQuantity,
              weight: drawerWeight,
              mechanismPrice: drawerMechanismPrice,
              totalMechanismCost: totalDrawerMechanismCost,
            },
            totalPrice: carcassCost + totalDrawerMechanismCost,
            squareFeet: sqft,
          };
          break;
        }

        case "SHELVES": {
          const shelfPrice = 200; // Fixed price per shelf
          const totalShelvesPrice = shelfPrice * shelvesQuantity;

          newDrawerUnit = {
            unitType: "SHELVES",
            shelves: {
              quantity: shelvesQuantity,
              pricePerShelf: shelfPrice,
              totalPrice: totalShelvesPrice,
            },
            totalPrice: totalShelvesPrice,
          };
          break;
        }

        case "VERTICAL_LINE": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);
          const verticalLineRate = 200; // Rate per square foot
          const unitPrice = Math.round(sqft * verticalLineRate);
          const totalPrice = unitPrice * verticalLineQuantity;

          newDrawerUnit = {
            measurements,
            unitType: "VERTICAL_LINE",
            verticalLine: {
              quantity: verticalLineQuantity,
              totalPrice,
              squareFeet: sqft,
            },
            totalPrice,
            squareFeet: sqft,
          };
          break;
        }
      }

      // Initialize units array if not exists
      if (!wardrobe.units) {
        wardrobe.units = [];
      }

      // Add unit to wardrobe
      wardrobe.units.push(newDrawerUnit);

      // Calculate total wardrobe units cost
      wardrobe.unitsTotalPrice =
        (wardrobe.unitsTotalPrice || 0) + newDrawerUnit.totalPrice;

      // Save the quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          newUnit: newDrawerUnit,
          allUnits: wardrobe.units,
          totalUnitsCost: wardrobe.unitsTotalPrice,
        },
      });
    } catch (error) {
      console.error("Wardrobe unit calculation error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/consoleUnit", async (req, res, next) => {
  try {
    const { measurements, finish, carcassType, shutterMaterial, shutterType } =
      req.body;

    if (!measurements || !finish || !carcassType || !shutterMaterial) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: measurements, finish, carcassType, shutterMaterial",
      });
    }

    // Validate measurements
    if (!measurements.width || !measurements.height || !measurements.depth) {
      return res.status(400).json({
        success: false,
        error: "Invalid measurements: width, height, and depth are required",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Authorization check
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get pricing data
    const prices = await ConsoleUnitPricing.findOne();
    if (!prices) {
      return res.status(500).json({
        success: false,
        error: "Console unit pricing data not found",
      });
    }

    // Calculate prices
    const priceCalculation =
      await ConsoleUnitCalculator.calculateConsoleUnitPrice(
        measurements,
        { carcassType, shutterMaterial, shutterType, finish },
        prices
      );

    // Create new console unit object
    const newConsoleUnit = {
      measurements,
      finish,
      carcass: {
        type: carcassType,
        price: priceCalculation.carcass,
      },
      shutter: {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      },
      totalPrice: priceCalculation.total,
    };

    if (!room.consoleUnits) {
      room.consoleUnits = [];
      if (room.consoleUnit) {
        room.consoleUnits.push(room.consoleUnit);
      }
    }

    room.consoleUnits.push(newConsoleUnit);

    room.consoleUnit = newConsoleUnit;

    await quotation.save();

    res.json({
      success: true,
      data: {
        consoleUnits: room.consoleUnits,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Console unit calculation error:", error);
    next(new Error("Failed to calculate console unit price: " + error.message));
  }
});

router.put(
  "/:id/rooms/:roomIndex/consoleUnit/:consoleUnitIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
      } = req.body;
      const { id, roomIndex, consoleUnitIndex } = req.params;

      // Input validation
      if (!measurements || !finish || !carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: measurements, finish, carcassType, shutterMaterial",
        });
      }

      // Validate measurements
      if (!measurements.width || !measurements.height || !measurements.depth) {
        return res.status(400).json({
          success: false,
          error: "Invalid measurements: width, height, and depth are required",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if consoleUnits array exists and has the specified index
      if (!room.consoleUnits || !room.consoleUnits[consoleUnitIndex]) {
        return res.status(404).json({
          success: false,
          error: "Console unit not found at specified index",
        });
      }

      // Get pricing data
      const prices = await ConsoleUnitPricing.findOne();
      if (!prices) {
        return res.status(500).json({
          success: false,
          error: "Console unit pricing data not found",
        });
      }

      // Calculate prices
      const priceCalculation =
        await ConsoleUnitCalculator.calculateConsoleUnitPrice(
          measurements,
          { carcassType, shutterMaterial, shutterType, finish },
          prices
        );

      // Update console unit object
      const updatedConsoleUnit = {
        measurements,
        finish,
        carcass: {
          type: carcassType,
          price: priceCalculation.carcass,
        },
        shutter: {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        },
        totalPrice: priceCalculation.total,
        // Preserve existing components if any
        components: room.consoleUnits[consoleUnitIndex].components || [],
      };

      // Update the console unit at specified index
      room.consoleUnits[consoleUnitIndex] = updatedConsoleUnit;

      // If this is also the main console unit, update that too
      if (
        room.consoleUnit &&
        room.consoleUnit === room.consoleUnits[consoleUnitIndex]
      ) {
        room.consoleUnit = updatedConsoleUnit;
      }

      // Recalculate room total if needed
      if (room.calculateTotal) {
        room.calculateTotal();
      }

      await quotation.save();

      res.json({
        success: true,
        data: {
          consoleUnit: updatedConsoleUnit,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Console unit update error:", error);
      next(new Error("Failed to update console unit: " + error.message));
    }
  }
);

// API endpoint to add units to a console unit
router.put(
  "/:id/rooms/:roomIndex/consoleUnit/:consoleUnitIndex/units",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish = "WHITE",
        carcassType,
        drawerQuantity,
        drawerWeight = "30KG",
        shelvesQuantity,
        verticalLineQuantity,
      } = req.body;

      // Validate inputs based on unit type
      switch (unitType) {
        case "DRAWER":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Invalid measurements for drawer",
            });
          }
          if (!drawerQuantity || drawerQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid drawer quantity is required",
            });
          }
          if (!carcassType) {
            return res.status(400).json({
              success: false,
              error: "Carcass type is required for drawer units",
            });
          }
          break;

        case "SHELVES":
          if (!shelvesQuantity || shelvesQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid shelves quantity is required",
            });
          }
          break;

        case "VERTICAL_LINE":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Measurements are required for vertical line",
            });
          }
          if (!verticalLineQuantity || verticalLineQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid vertical line quantity is required",
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Invalid unit type",
          });
      }

      // Find quotation and validate (existing authorization logic)
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check (existing logic)
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if console unit exists
      const consoleUnit = room.consoleUnits[req.params.consoleUnitIndex];
      if (!consoleUnit) {
        return res.status(404).json({
          success: false,
          error: "Console unit not found",
        });
      }

      // Get pricing data
      const consoleUnitPrices = await ConsoleUnitPricing.findOne();
      const tvUnitPrices = await TVUnitPricing.findOne();

      // Prepare new unit based on type
      let newDrawerUnit;
      switch (unitType) {
        case "DRAWER": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);

          // Calculate carcass cost
          const carcassPrice = TVUnitCalculator.getCarcassPrice(
            carcassType,
            finish,
            consoleUnitPrices
          );
          const carcassCost = Math.round(carcassPrice * sqft);

          // Calculate drawer mechanism cost
          const drawerMechanismPrice = TVUnitCalculator.getDrawerPrice(
            width,
            drawerWeight,
            tvUnitPrices
          );
          const totalDrawerMechanismCost =
            drawerMechanismPrice * drawerQuantity;

          newDrawerUnit = {
            measurements,
            unitType: "DRAWER",
            finish,
            carcass: {
              type: carcassType,
              price: carcassCost,
            },
            drawer: {
              quantity: drawerQuantity,
              weight: drawerWeight,
              mechanismPrice: drawerMechanismPrice,
              totalMechanismCost: totalDrawerMechanismCost,
            },
            totalPrice: carcassCost + totalDrawerMechanismCost,
            squareFeet: sqft,
          };
          break;
        }

        case "SHELVES": {
          const shelfPrice = 200; // Fixed price per shelf
          const totalShelvesPrice = shelfPrice * shelvesQuantity;

          newDrawerUnit = {
            unitType: "SHELVES",
            shelves: {
              quantity: shelvesQuantity,
              pricePerShelf: shelfPrice,
              totalPrice: totalShelvesPrice,
            },
            totalPrice: totalShelvesPrice,
          };
          break;
        }

        case "VERTICAL_LINE": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);
          const verticalLineRate = 200; // Rate per square foot
          const unitPrice = Math.round(sqft * verticalLineRate);
          const totalPrice = unitPrice * verticalLineQuantity;

          newDrawerUnit = {
            measurements,
            unitType: "VERTICAL_LINE",
            verticalLine: {
              quantity: verticalLineQuantity,
              totalPrice,
              squareFeet: sqft,
            },
            totalPrice,
            squareFeet: sqft,
          };
          break;
        }
      }

      // Initialize units array if not exists
      if (!consoleUnit.units) {
        consoleUnit.units = [];
      }

      // Add unit to console unit
      consoleUnit.units.push(newDrawerUnit);

      // Calculate total console unit units cost
      consoleUnit.unitsTotalPrice =
        (consoleUnit.unitsTotalPrice || 0) + newDrawerUnit.totalPrice;

      // Save the quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          newUnit: newDrawerUnit,
          allUnits: consoleUnit.units,
          totalUnitsCost: consoleUnit.unitsTotalPrice,
        },
      });
    } catch (error) {
      console.error("Console unit unit calculation error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/crockeryUnit", async (req, res, next) => {
  try {
    const { measurements, finish, carcassType, shutterMaterial, shutterType } =
      req.body;

    if (!measurements || !finish || !carcassType || !shutterMaterial) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: measurements, finish, carcassType, shutterMaterial",
      });
    }

    // Validate measurements
    if (!measurements.width || !measurements.height || !measurements.depth) {
      return res.status(400).json({
        success: false,
        error: "Invalid measurements: width, height, and depth are required",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Authorization check
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get pricing data
    const prices = await WardrobePricing.findOne();
    if (!prices) {
      return res.status(500).json({
        success: false,
        error: "Pricing data not found",
      });
    }

    // Calculate prices
    const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
      measurements,
      { carcassType, shutterMaterial, shutterType, finish },
      prices
    );

    // Create new shoe rack object
    const newCrockeryUnit = {
      measurements,
      finish,
      carcass: {
        type: carcassType,
        price: priceCalculation.carcass,
      },
      shutter: {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      },
      totalPrice: priceCalculation.total,
    };

    if (!room.crockeryUnits) {
      room.crockeryUnits = [];
      if (room.crockeryUnit) {
        room.crockeryUnits.push(room.crockeryUnit);
      }
    }

    room.crockeryUnits.push(newCrockeryUnit);

    room.crockeryUnit = newCrockeryUnit;

    await quotation.save();

    res.json({
      success: true,
      data: {
        crockeryUnit: room.crockeryUnits,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Shoe rack calculation error:", error);
    next(new Error("Failed to calculate shoe rack price: " + error.message));
  }
});

router.put(
  "/:id/rooms/:roomIndex/crockeryUnit/:crockeryUnitIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
      } = req.body;

      // Input validation
      if (!measurements || !finish || !carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: measurements, finish, carcassType, shutterMaterial",
        });
      }

      // Validate measurements
      if (!measurements.width || !measurements.height || !measurements.depth) {
        return res.status(400).json({
          success: false,
          error: "Invalid measurements: width, height, and depth are required",
        });
      }

      // Find quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find room
      const roomIndex = parseInt(req.params.roomIndex);
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Find crockery unit
      const crockeryUnitIndex = parseInt(req.params.crockeryUnitIndex);

      // Check if crockeryUnits array exists
      if (!room.crockeryUnits || !Array.isArray(room.crockeryUnits)) {
        return res.status(404).json({
          success: false,
          error: "No crockery units found in this room",
        });
      }

      // Validate crockery unit index
      if (
        crockeryUnitIndex < 0 ||
        crockeryUnitIndex >= room.crockeryUnits.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Crockery unit not found at the specified index",
        });
      }

      // Get pricing data
      const prices = await WardrobePricing.findOne();
      if (!prices) {
        return res.status(500).json({
          success: false,
          error: "Pricing data not found",
        });
      }

      // Calculate updated prices
      const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
        measurements,
        { carcassType, shutterMaterial, shutterType, finish },
        prices
      );

      // Create updated crockery unit object
      const updatedCrockeryUnit = {
        measurements,
        finish,
        carcass: {
          type: carcassType,
          price: priceCalculation.carcass,
        },
        shutter: {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        },
        totalPrice: priceCalculation.total,
      };

      // Update the crockery unit in the crockeryUnits array
      room.crockeryUnits[crockeryUnitIndex] = updatedCrockeryUnit;

      // Update the default crockeryUnit if it matches the one being updated
      if (
        room.crockeryUnit &&
        JSON.stringify(room.crockeryUnit.measurements) ===
          JSON.stringify(room.crockeryUnits[crockeryUnitIndex].measurements)
      ) {
        room.crockeryUnit = updatedCrockeryUnit;
      }

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          crockeryUnit: updatedCrockeryUnit,
          crockeryUnits: room.crockeryUnits,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Crockery unit update error:", error);
      next(new Error("Failed to update crockery unit: " + error.message));
    }
  }
);

// Shoe Rack Units API
router.put(
  "/:id/rooms/:roomIndex/crockeryUnit/:crockeryUnitIndex/units",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish = "WHITE",
        carcassType,
        drawerQuantity,
        drawerWeight = "30KG",
        shelvesQuantity,
        verticalLineQuantity,
      } = req.body;

      // Validate inputs based on unit type
      switch (unitType) {
        case "DRAWER":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Invalid measurements for drawer",
            });
          }
          if (!drawerQuantity || drawerQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid drawer quantity is required",
            });
          }
          if (!carcassType) {
            return res.status(400).json({
              success: false,
              error: "Carcass type is required for drawer units",
            });
          }
          break;

        case "SHELVES":
          if (!shelvesQuantity || shelvesQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid shelves quantity is required",
            });
          }
          break;

        case "VERTICAL_LINE":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Measurements are required for vertical line",
            });
          }
          if (!verticalLineQuantity || verticalLineQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid vertical line quantity is required",
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Invalid unit type",
          });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if shoe rack exists
      const crockeryUnit = room.crockeryUnits[req.params.crockeryUnitIndex];
      if (!crockeryUnit) {
        return res.status(404).json({
          success: false,
          error: "Shoe rack not found",
        });
      }

      // Get pricing data
      const wardrobePrices = await WardrobePricing.findOne();
      const tvUnitPrices = await TVUnitPricing.findOne();

      // Prepare new unit based on type
      let newUnit;
      switch (unitType) {
        case "DRAWER": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);

          // Calculate carcass cost
          const carcassPrice = TVUnitCalculator.getCarcassPrice(
            carcassType,
            finish,
            wardrobePrices
          );
          const carcassCost = Math.round(carcassPrice * sqft);

          // Calculate drawer mechanism cost
          const drawerMechanismPrice = TVUnitCalculator.getDrawerPrice(
            width,
            drawerWeight,
            tvUnitPrices
          );
          const totalDrawerMechanismCost =
            drawerMechanismPrice * drawerQuantity;

          newUnit = {
            measurements,
            unitType: "DRAWER",
            finish,
            carcass: {
              type: carcassType,
              price: carcassCost,
            },
            drawer: {
              quantity: drawerQuantity,
              weight: drawerWeight,
              mechanismPrice: drawerMechanismPrice,
              totalMechanismCost: totalDrawerMechanismCost,
            },
            totalPrice: carcassCost + totalDrawerMechanismCost,
            squareFeet: sqft,
          };
          break;
        }

        case "SHELVES": {
          const shelfPrice = 200; // Fixed price per shelf
          const totalShelvesPrice = shelfPrice * shelvesQuantity;

          newUnit = {
            unitType: "SHELVES",
            shelves: {
              quantity: shelvesQuantity,
              pricePerShelf: shelfPrice,
              totalPrice: totalShelvesPrice,
            },
            totalPrice: totalShelvesPrice,
          };
          break;
        }
        case "VERTICAL_LINE": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);
          const verticalLineRate = 200; // Rate per square foot
          const unitPrice = Math.round(sqft * verticalLineRate);
          const totalPrice = unitPrice * verticalLineQuantity;

          newUnit = {
            measurements,
            unitType: "VERTICAL_LINE",
            verticalLine: {
              quantity: verticalLineQuantity,
              totalPrice,
              squareFeet: sqft,
            },
            totalPrice,
            squareFeet: sqft,
          };
          break;
        }
      }

      // Initialize units array if not exists
      if (!crockeryUnit.units) {
        crockeryUnit.units = [];
      }

      // Add unit to shoe rack
      crockeryUnit.units.push(newUnit);

      // Calculate total shoe rack units cost
      crockeryUnit.unitsTotalPrice =
        (crockeryUnit.unitsTotalPrice || 0) + newUnit.totalPrice;

      // Save the quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          newUnit: newUnit,
          allUnits: crockeryUnit.units,
          totalUnitsCost: crockeryUnit.unitsTotalPrice,
        },
      });
    } catch (error) {
      console.error("Shoe rack unit calculation error:", error);
      next(error);
    }
  }
);

// Shoe Rack API
router.put("/:id/rooms/:roomIndex/shoeRack", async (req, res, next) => {
  try {
    const { measurements, finish, carcassType, shutterMaterial, shutterType } =
      req.body;

    if (!measurements || !finish || !carcassType || !shutterMaterial) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: measurements, finish, carcassType, shutterMaterial",
      });
    }

    // Validate measurements
    if (!measurements.width || !measurements.height || !measurements.depth) {
      return res.status(400).json({
        success: false,
        error: "Invalid measurements: width, height, and depth are required",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Authorization check
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to modify this quotation",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get pricing data
    const prices = await WardrobePricing.findOne();
    if (!prices) {
      return res.status(500).json({
        success: false,
        error: "Pricing data not found",
      });
    }

    // Calculate prices
    const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
      measurements,
      { carcassType, shutterMaterial, shutterType, finish },
      prices
    );

    // Create new shoe rack object
    const newShoeRack = {
      measurements,
      finish,
      carcass: {
        type: carcassType,
        price: priceCalculation.carcass,
      },
      shutter: {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      },
      totalPrice: priceCalculation.total,
    };

    if (!room.shoeRacks) {
      room.shoeRacks = [];
      if (room.shoeRack) {
        room.shoeRacks.push(room.shoeRack);
      }
    }

    room.shoeRacks.push(newShoeRack);

    room.shoeRack = newShoeRack;

    await quotation.save();

    res.json({
      success: true,
      data: {
        shoeRacks: room.shoeRacks,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Shoe rack calculation error:", error);
    next(new Error("Failed to calculate shoe rack price: " + error.message));
  }
});

// Update (edit) an existing shoe rack
router.put(
  "/:id/rooms/:roomIndex/shoeRack/:shoeRackIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
      } = req.body;

      // Input validation
      if (!measurements || !finish || !carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: measurements, finish, carcassType, shutterMaterial",
        });
      }

      // Validate measurements
      if (!measurements.width || !measurements.height || !measurements.depth) {
        return res.status(400).json({
          success: false,
          error: "Invalid measurements: width, height, and depth are required",
        });
      }

      // Find quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      // Find room
      const roomIndex = parseInt(req.params.roomIndex);
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Find shoe rack
      const shoeRackIndex = parseInt(req.params.shoeRackIndex);

      // Check if shoeRacks array exists
      if (!room.shoeRacks || !Array.isArray(room.shoeRacks)) {
        return res.status(404).json({
          success: false,
          error: "No shoe racks found in this room",
        });
      }

      // Validate shoe rack index
      if (shoeRackIndex < 0 || shoeRackIndex >= room.shoeRacks.length) {
        return res.status(404).json({
          success: false,
          error: "Shoe rack not found at the specified index",
        });
      }

      // Get pricing data
      const prices = await WardrobePricing.findOne();
      if (!prices) {
        return res.status(500).json({
          success: false,
          error: "Pricing data not found",
        });
      }

      // Calculate updated prices
      const priceCalculation = await WardrobeCalculator.calculateWardrobePrice(
        measurements,
        { carcassType, shutterMaterial, shutterType, finish },
        prices
      );

      // Create updated shoe rack object
      const updatedShoeRack = {
        measurements,
        finish,
        carcass: {
          type: carcassType,
          price: priceCalculation.carcass,
        },
        shutter: {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        },
        totalPrice: priceCalculation.total,
      };

      // Update the shoe rack in the shoeRacks array
      room.shoeRacks[shoeRackIndex] = updatedShoeRack;

      // Update the default shoeRack if it matches the one being updated
      if (
        room.shoeRack &&
        JSON.stringify(room.shoeRack.measurements) ===
          JSON.stringify(room.shoeRacks[shoeRackIndex].measurements)
      ) {
        room.shoeRack = updatedShoeRack;
      }

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          shoeRack: updatedShoeRack,
          shoeRacks: room.shoeRacks,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Shoe rack update error:", error);
      next(new Error("Failed to update shoe rack: " + error.message));
    }
  }
);

// Shoe Rack Units API
router.put(
  "/:id/rooms/:roomIndex/shoeRack/:shoeRackIndex/units",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish = "WHITE",
        carcassType,
        drawerQuantity,
        drawerWeight = "30KG",
        shelvesQuantity,
        verticalLineQuantity,
      } = req.body;

      // Validate inputs based on unit type
      switch (unitType) {
        case "DRAWER":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Invalid measurements for drawer",
            });
          }
          if (!drawerQuantity || drawerQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid drawer quantity is required",
            });
          }
          if (!carcassType) {
            return res.status(400).json({
              success: false,
              error: "Carcass type is required for drawer units",
            });
          }
          break;

        case "SHELVES":
          if (!shelvesQuantity || shelvesQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid shelves quantity is required",
            });
          }
          break;

        case "VERTICAL_LINE":
          if (!measurements || !measurements.width || !measurements.height) {
            return res.status(400).json({
              success: false,
              error: "Measurements are required for vertical line",
            });
          }
          if (!verticalLineQuantity || verticalLineQuantity <= 0) {
            return res.status(400).json({
              success: false,
              error: "Valid vertical line quantity is required",
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            error: "Invalid unit type",
          });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Authorization check
      if (
        req.user.role !== "admin" &&
        quotation.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          error: "Not authorized to modify this quotation",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if shoe rack exists
      const shoeRack = room.shoeRacks[req.params.shoeRackIndex];
      if (!shoeRack) {
        return res.status(404).json({
          success: false,
          error: "Shoe rack not found",
        });
      }

      // Get pricing data
      const wardrobePrices = await WardrobePricing.findOne();
      const tvUnitPrices = await TVUnitPricing.findOne();

      // Prepare new unit based on type
      let newUnit;
      switch (unitType) {
        case "DRAWER": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);

          // Calculate carcass cost
          const carcassPrice = TVUnitCalculator.getCarcassPrice(
            carcassType,
            finish,
            wardrobePrices
          );
          const carcassCost = Math.round(carcassPrice * sqft);

          // Calculate drawer mechanism cost
          const drawerMechanismPrice = TVUnitCalculator.getDrawerPrice(
            width,
            drawerWeight,
            tvUnitPrices
          );
          const totalDrawerMechanismCost =
            drawerMechanismPrice * drawerQuantity;

          newUnit = {
            measurements,
            unitType: "DRAWER",
            finish,
            carcass: {
              type: carcassType,
              price: carcassCost,
            },
            drawer: {
              quantity: drawerQuantity,
              weight: drawerWeight,
              mechanismPrice: drawerMechanismPrice,
              totalMechanismCost: totalDrawerMechanismCost,
            },
            totalPrice: carcassCost + totalDrawerMechanismCost,
            squareFeet: sqft,
          };
          break;
        }

        case "SHELVES": {
          const shelfPrice = 200; // Fixed price per shelf
          const totalShelvesPrice = shelfPrice * shelvesQuantity;

          newUnit = {
            unitType: "SHELVES",
            shelves: {
              quantity: shelvesQuantity,
              pricePerShelf: shelfPrice,
              totalPrice: totalShelvesPrice,
            },
            totalPrice: totalShelvesPrice,
          };
          break;
        }

        case "VERTICAL_LINE": {
          const { width, height } = measurements;
          const sqft = TVUnitCalculator.calculateSquareFeet(width, height);
          const verticalLineRate = 200; // Rate per square foot
          const unitPrice = Math.round(sqft * verticalLineRate);
          const totalPrice = unitPrice * verticalLineQuantity;

          newUnit = {
            measurements,
            unitType: "VERTICAL_LINE",
            verticalLine: {
              quantity: verticalLineQuantity,
              totalPrice,
              squareFeet: sqft,
            },
            totalPrice,
            squareFeet: sqft,
          };
          break;
        }
      }

      // Initialize units array if not exists
      if (!shoeRack.units) {
        shoeRack.units = [];
      }

      // Add unit to shoe rack
      shoeRack.units.push(newUnit);

      // Calculate total shoe rack units cost
      shoeRack.unitsTotalPrice =
        (shoeRack.unitsTotalPrice || 0) + newUnit.totalPrice;

      // Save the quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          newUnit: newUnit,
          allUnits: shoeRack.units,
          totalUnitsCost: shoeRack.unitsTotalPrice,
        },
      });
    } catch (error) {
      console.error("Shoe rack unit calculation error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/storage-unit", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne(); // Using same pricing model as TV units
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Storage unit pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Additional validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for open unit",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for ledge unit",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid unit type: ${unitType}`,
      });
    }

    // Price calculation using existing TV Unit Calculator
    const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
      measurements,
      {
        unitType,
        finish: finish || "WHITE",
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.storageUnits) {
      room.storageUnits = [];
    }

    // Create new storage unit object
    const newStorageUnit = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newStorageUnit.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newStorageUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      if (shelvesRequired) {
        newStorageUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newStorageUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newStorageUnit.openUnit = {
        price: priceCalculation.openUnit,
      };

      if (shelvesRequired) {
        newStorageUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newStorageUnit.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newStorageUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newStorageUnit.openUnit = {
        price: priceCalculation.openUnit,
      };
    }

    // Add the new storage unit to the array
    room.storageUnits.push(newStorageUnit);

    // Calculate total price for all storage units in the room
    const totalRoomStorageUnitPrice = room.storageUnits.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.storageUnitTotalPrice = totalRoomStorageUnitPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newStorageUnit,
        allStorageUnits: room.storageUnits,
        totalPrice: totalRoomStorageUnitPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Storage unit calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/storage-unit/:storageUnitIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      if (
        !room.storageUnits ||
        !room.storageUnits[req.params.storageUnitIndex]
      ) {
        return res.status(404).json({
          success: false,
          error: "Storage unit not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne(); // Using same pricing model as TV units
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "Storage unit pricing data not found",
        });
      }

      // Specific validation for shelvesRequired and shelvesQuantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Additional validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT" || unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: `Shutter material is required for ${unitType.toLowerCase()} unit`,
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid unit type: ${unitType}`,
        });
      }

      // Price calculation using existing TV Unit Calculator
      const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

      // Create updated storage unit object
      const updatedStorageUnit = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedStorageUnit.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedStorageUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        if (shelvesRequired) {
          updatedStorageUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedStorageUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedStorageUnit.openUnit = {
          price: priceCalculation.openUnit,
        };

        if (shelvesRequired) {
          updatedStorageUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedStorageUnit.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedStorageUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedStorageUnit.openUnit = {
          price: priceCalculation.openUnit,
        };
      }

      // Update the storage unit in the array
      room.storageUnits[req.params.storageUnitIndex] = updatedStorageUnit;

      // Recalculate total price for all storage units in the room
      const totalRoomStorageUnitPrice = room.storageUnits.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );

      // Update the total price in the room
      room.storageUnitTotalPrice = totalRoomStorageUnitPrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedStorageUnit,
          allStorageUnits: room.storageUnits,
          totalPrice: totalRoomStorageUnitPrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Storage unit update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/storage-unit/:storageUnitIndex",
  async (req, res, next) => {
    try {
      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if storage units array exists
      if (!room.storageUnits) {
        return res.status(404).json({
          success: false,
          error: "No storage units found in this room",
        });
      }

      // Check if the storage unit index is valid
      const storageUnitIndex = parseInt(req.params.storageUnitIndex);
      if (
        storageUnitIndex < 0 ||
        storageUnitIndex >= room.storageUnits.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Storage unit not found",
        });
      }

      // Remove the storage unit
      room.storageUnits.splice(storageUnitIndex, 1);

      // Recalculate the total price
      const totalRoomStorageUnitPrice = room.storageUnits.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.storageUnitTotalPrice = totalRoomStorageUnitPrice;

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          storageUnits: room.storageUnits,
          totalPrice: totalRoomStorageUnitPrice,
        },
      });
    } catch (error) {
      console.error("Delete storage unit error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/vanity-storage", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne(); // Using same pricing model as TV units
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Vanity storage pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Additional validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for open unit",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for ledge unit",
        });

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid unit type: ${unitType}`,
      });
    }

    // Price calculation using existing TV Unit Calculator
    const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
      measurements,
      {
        unitType,
        finish: finish || "WHITE",
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.vanityStorage) {
      room.vanityStorage = [];
    }

    // Create new vanity storage unit object
    const newVanityStorage = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newVanityStorage.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newVanityStorage.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      if (shelvesRequired) {
        newVanityStorage.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newVanityStorage.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newVanityStorage.openUnit = {
        price: priceCalculation.openUnit,
      };

      if (shelvesRequired) {
        newVanityStorage.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newVanityStorage.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newVanityStorage.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newVanityStorage.openUnit = {
        price: priceCalculation.openUnit,
      };
    }

    // Add the new vanity storage unit to the array
    room.vanityStorage.push(newVanityStorage);

    // Calculate total price for all vanity storage units in the room
    const totalRoomVanityStoragePrice = room.vanityStorage.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.vanitystorageTotalPrice = totalRoomVanityStoragePrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newVanityStorage,
        allVanityStorage: room.vanityStorage,
        totalPrice: totalRoomVanityStoragePrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Vanity storage calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/vanity-storage/:vanityStorageIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      if (
        !room.vanityStorage ||
        !room.vanityStorage[req.params.vanityStorageIndex]
      ) {
        return res.status(404).json({
          success: false,
          error: "Vanity storage unit not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne(); // Using same pricing model as TV units
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "Vanity storage pricing data not found",
        });
      }

      // Specific validation for shelvesRequired and shelvesQuantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Additional validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT" || unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: `Shutter material is required for ${unitType.toLowerCase()} unit`,
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid unit type: ${unitType}`,
        });
      }

      // Price calculation using existing TV Unit Calculator
      const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

      // Create updated vanity storage unit object
      const updatedVanityStorage = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedVanityStorage.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedVanityStorage.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        if (shelvesRequired) {
          updatedVanityStorage.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedVanityStorage.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedVanityStorage.openUnit = {
          price: priceCalculation.openUnit,
        };

        if (shelvesRequired) {
          updatedVanityStorage.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedVanityStorage.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedVanityStorage.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedVanityStorage.openUnit = {
          price: priceCalculation.openUnit,
        };
      }

      // Update the vanity storage unit in the array
      room.vanityStorage[req.params.vanityStorageIndex] = updatedVanityStorage;

      // Recalculate total price for all vanity storage units in the room
      const totalRoomVanityStoragePrice = room.vanityStorage.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );

      // Update the total price in the room
      room.vanitystorageTotalPrice = totalRoomVanityStoragePrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedVanityStorage,
          allVanityStorage: room.vanityStorage,
          totalPrice: totalRoomVanityStoragePrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Vanity storage update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/vanity-storage/:vanityStorageIndex",
  async (req, res, next) => {
    try {
      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if vanity storage array exists
      if (!room.vanityStorage) {
        return res.status(404).json({
          success: false,
          error: "No vanity storage units found in this room",
        });
      }

      // Check if the vanity storage index is valid
      const vanityStorageIndex = parseInt(req.params.vanityStorageIndex);
      if (
        vanityStorageIndex < 0 ||
        vanityStorageIndex >= room.vanityStorage.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Vanity storage unit not found",
        });
      }

      // Remove the vanity storage unit
      room.vanityStorage.splice(vanityStorageIndex, 1);

      // Recalculate the total price
      const totalRoomVanityStoragePrice = room.vanityStorage.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.vanitystorageTotalPrice = totalRoomVanityStoragePrice;

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          vanityStorage: room.vanityStorage,
          totalPrice: totalRoomVanityStoragePrice,
        },
      });
    } catch (error) {
      console.error("Delete vanity storage error:", error);
      next(error);
    }
  }
);

// Mandir Unit API
router.put("/:id/rooms/:roomIndex/mandir-unit", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Mandir unit pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Additional validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for open unit",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "Shutter type is required for HDHMR material",
        });
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for ledge unit",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "Shutter type is required for HDHMR material",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid unit type: ${unitType}`,
      });
    }

    // Price calculation using existing TV Unit Calculator
    const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
      measurements,
      {
        unitType,
        finish: finish || "WHITE",
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.mandirUnits) {
      room.mandirUnits = [];
    }

    // Create new mandir unit object
    const newMandirUnit = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newMandirUnit.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newMandirUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      if (shelvesRequired) {
        newMandirUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newMandirUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newMandirUnit.openUnit = {
        price: priceCalculation.openUnit,
      };

      if (shelvesRequired) {
        newMandirUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newMandirUnit.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newMandirUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newMandirUnit.openUnit = {
        price: priceCalculation.openUnit,
      };
    }

    // Add the new mandir unit to the array
    room.mandirUnits.push(newMandirUnit);

    // Calculate total price for all mandir units in the room
    const totalRoomMandirUnitPrice = room.mandirUnits.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.mandirUnitTotalPrice = totalRoomMandirUnitPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newMandirUnit,
        allMandirUnits: room.mandirUnits,
        totalPrice: totalRoomMandirUnitPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Mandir unit calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/mandir-unit/:mandirUnitIndex",
  async (req, res, next) => {
    try {
      const { id, roomIndex, mandirUnitIndex } = req.params;
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Check if room exists
      if (!quotation.rooms[roomIndex]) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      const room = quotation.rooms[roomIndex];

      // Check if mandirUnits array exists and has the specified index
      if (!room.mandirUnits || !room.mandirUnits[mandirUnitIndex]) {
        return res.status(404).json({
          success: false,
          error: "Mandir unit not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne();
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "Mandir unit pricing data not found",
        });
      }

      // Specific validation for shelvesRequired and shelvesQuantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Additional validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "Shutter material is required for open unit",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      } else if (unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "Shutter material is required for ledge unit",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid unit type: ${unitType}`,
        });
      }

      // Price calculation using existing TV Unit Calculator
      const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

      // Create updated mandir unit object
      const updatedMandirUnit = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedMandirUnit.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedMandirUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        if (shelvesRequired) {
          updatedMandirUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedMandirUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedMandirUnit.openUnit = {
          price: priceCalculation.openUnit,
        };

        if (shelvesRequired) {
          updatedMandirUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedMandirUnit.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedMandirUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedMandirUnit.openUnit = {
          price: priceCalculation.openUnit,
        };
      }

      // Update the mandir unit at the specified index
      room.mandirUnits[mandirUnitIndex] = updatedMandirUnit;

      // Recalculate total price for all mandir units in the room
      const totalRoomMandirUnitPrice = room.mandirUnits.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );

      // Update the total price for the room
      room.mandirUnitTotalPrice = totalRoomMandirUnitPrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedMandirUnit,
          allMandirUnits: room.mandirUnits,
          totalPrice: totalRoomMandirUnitPrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Mandir unit update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/mandir-unit/:mandirUnitIndex",
  async (req, res, next) => {
    try {
      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if mandir units array exists
      if (!room.mandirUnits) {
        return res.status(404).json({
          success: false,
          error: "No mandir units found in this room",
        });
      }

      // Check if the mandir unit index is valid
      const mandirUnitIndex = parseInt(req.params.mandirUnitIndex);
      if (mandirUnitIndex < 0 || mandirUnitIndex >= room.mandirUnits.length) {
        return res.status(404).json({
          success: false,
          error: "Mandir unit not found",
        });
      }

      // Remove the mandir unit
      room.mandirUnits.splice(mandirUnitIndex, 1);

      // Recalculate the total price
      const totalRoomMandirUnitPrice = room.mandirUnits.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.mandirUnitTotalPrice = totalRoomMandirUnitPrice;

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          mandirUnits: room.mandirUnits,
          totalPrice: totalRoomMandirUnitPrice,
        },
      });
    } catch (error) {
      console.error("Delete mandir unit error:", error);
      next(error);
    }
  }
);

// Chest of Drawers API
router.put("/:id/rooms/:roomIndex/chest-of-drawer", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: measurements, unitType, drawerQuantity",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Chest of drawer pricing data not found",
      });
    }

    // Validation for drawer quantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Additional validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for open unit",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "Shutter type is required for HDHMR material",
        });
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "Shutter material is required for ledge unit",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "Shutter type is required for HDHMR material",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Invalid unit type for chest of drawers: ${unitType}`,
      });
    }

    // Price calculation using existing TV Unit Calculator
    const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
      measurements,
      {
        unitType,
        finish: finish || "WHITE",
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.chestofDrawers) {
      room.chestofDrawers = [];
    }

    // Create new chest of drawers object
    const newChestOfDrawer = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newChestOfDrawer.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newChestOfDrawer.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      if (shelvesRequired) {
        newChestOfDrawer.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newChestOfDrawer.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newChestOfDrawer.openUnit = {
        price: priceCalculation.openUnit,
      };

      if (shelvesRequired) {
        newChestOfDrawer.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newChestOfDrawer.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newChestOfDrawer.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newChestOfDrawer.openUnit = {
        price: priceCalculation.openUnit,
      };
    }

    // Add the new chest of drawer to the array
    room.chestofDrawers.push(newChestOfDrawer);

    // Calculate total price for all chest of drawers in the room
    const totalRoomChestOfDrawerPrice = room.chestofDrawers.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.chestofDrawerTotalPrice = totalRoomChestOfDrawerPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newChestOfDrawer,
        allChestOfDrawers: room.chestofDrawers,
        totalPrice: totalRoomChestOfDrawerPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Chest of drawer calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/chest-of-drawer/:chestOfDrawerIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      if (
        !room.chestofDrawers ||
        !room.chestofDrawers[req.params.chestOfDrawerIndex]
      ) {
        return res.status(404).json({
          success: false,
          error: "Chest of drawer not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne();
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "Chest of drawer pricing data not found",
        });
      }

      // Validation for drawer quantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Additional validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT" || unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: `Shutter material is required for ${unitType.toLowerCase()} unit`,
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "Shutter type is required for HDHMR material",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid unit type for chest of drawers: ${unitType}`,
        });
      }

      // Price calculation using existing TV Unit Calculator
      const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

      // Create updated chest of drawers object
      const updatedChestOfDrawer = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedChestOfDrawer.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedChestOfDrawer.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        if (shelvesRequired) {
          updatedChestOfDrawer.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedChestOfDrawer.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedChestOfDrawer.openUnit = {
          price: priceCalculation.openUnit,
        };

        if (shelvesRequired) {
          updatedChestOfDrawer.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedChestOfDrawer.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedChestOfDrawer.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedChestOfDrawer.openUnit = {
          price: priceCalculation.openUnit,
        };
      }

      // Update the chest of drawer in the array
      room.chestofDrawers[req.params.chestOfDrawerIndex] = updatedChestOfDrawer;

      // Recalculate total price for all chest of drawers in the room
      const totalRoomChestOfDrawerPrice = room.chestofDrawers.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );

      // Update the total price in the room
      room.chestofDrawerTotalPrice = totalRoomChestOfDrawerPrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedChestOfDrawer,
          allChestOfDrawers: room.chestofDrawers,
          totalPrice: totalRoomChestOfDrawerPrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Chest of drawer update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/chest-of-drawer/:chestOfDrawerIndex",
  async (req, res, next) => {
    try {
      // Find the quotation
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get the room
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Check if chest of drawers array exists
      if (!room.chestofDrawers) {
        return res.status(404).json({
          success: false,
          error: "No chest of drawers found in this room",
        });
      }

      // Check if the chest of drawer index is valid
      const chestOfDrawerIndex = parseInt(req.params.chestOfDrawerIndex);
      if (
        chestOfDrawerIndex < 0 ||
        chestOfDrawerIndex >= room.chestofDrawers.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Chest of drawer not found",
        });
      }

      // Remove the chest of drawer
      room.chestofDrawers.splice(chestOfDrawerIndex, 1);

      // Recalculate the total price
      const totalRoomChestOfDrawerPrice = room.chestofDrawers.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.chestofDrawerTotalPrice = totalRoomChestOfDrawerPrice;

      // Save the updated quotation
      await quotation.save();

      res.json({
        success: true,
        data: {
          chestofDrawers: room.chestofDrawers,
          totalPrice: totalRoomChestOfDrawerPrice,
        },
      });
    } catch (error) {
      console.error("Delete storage unit error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/filler", async (req, res, next) => {
  try {
    const { measurements, finish, shutterMaterial, shutterType } = req.body;

    // Input validation
    if (!measurements || !shutterMaterial) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, shutterMaterial",
      });
    }

    // Width constraint
    if (measurements.width > 150) {
      return res.status(400).json({
        success: false,
        error: "Filler width must not exceed 150mm",
      });
    }

    // Validate measurements
    if (!measurements.width || !measurements.height || !measurements.depth) {
      return res.status(400).json({
        success: false,
        error: "Invalid measurements: width, height, and depth are required",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(500).json({
        success: false,
        error: "Pricing data not found",
      });
    }

    // Specific validation for HDHMR material
    if (shutterMaterial === "HDHMR" && !shutterType) {
      return res.status(400).json({
        success: false,
        error: "Shutter type is required for HDHMR material",
      });
    }

    // Price Calculation
    const defaultFinish = finish || "WHITE";
    const calculatedPrice = await TVUnitCalculator.calculateFillerPrice(
      measurements,
      {
        shutterMaterial,
        shutterType,
        finish: defaultFinish,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.fillerUnits) {
      room.fillerUnits = [];
    }

    const newFillerUnit = {
      measurements,
      finish: defaultFinish,
      shutter: {
        material: shutterMaterial,
        type: shutterType,
        price: calculatedPrice.shutterPrice,
      },
      totalPrice: calculatedPrice.total,
    };

    room.fillerUnits.push(newFillerUnit);

    // Recalculate total filler unit price for the room
    room.fillerUnitTotalPrice = room.fillerUnits.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    await quotation.save();

    res.json({
      success: true,
      data: {
        newFillerUnit,
        allFillerUnits: room.fillerUnits,
        totalPrice: room.fillerUnitTotalPrice,
        pricing: calculatedPrice,
      },
    });
  } catch (error) {
    console.error("Filler unit calculation error:", error);
    next(error);
  }
});
router.put("/:id/rooms/:roomIndex/study-table", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      drawerQuantity,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Study table pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
      if (!carcassType) {
        return res.status(400).json({
          success: false,
          error: "For carcass with profile shutter, carcassType is required",
        });
      }

      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with profile shutter, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "GLASS_PROFILE" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For GLASS_PROFILE material, shutterType is required",
        });
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "For open units, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "For ledge units, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "DRAWER") {
      if (!drawerQuantity || drawerQuantity <= 0 || !carcassType) {
        return res.status(400).json({
          success: false,
          error:
            "For drawer units, valid drawerQuantity and carcassType are required",
        });
      }
    } else if (unitType === "TOP" || unitType === "SIDE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: `For ${unitType} units, shutterMaterial is required`,
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    }

    const priceCalculation =
      await StudyTableCalculator.calculateStudyTablePrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          drawerQuantity,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.studyTables) {
      room.studyTables = [];
    }

    const newStudyTable = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit typesi
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newStudyTable.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newStudyTable.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      // Add shelves if required
      if (shelvesRequired) {
        newStudyTable.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
      newStudyTable.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };

      newStudyTable.profileShutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.profileShutter,
      };

      if (shelvesRequired) {
        newStudyTable.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newStudyTable.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newStudyTable.openUnit = {
        price: priceCalculation.openUnit,
      };
      if (shelvesRequired) {
        newStudyTable.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newStudyTable.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newStudyTable.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newStudyTable.openUnit = {
        price: priceCalculation.openUnit,
      };
    } else if (unitType === "DRAWER") {
      newStudyTable.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newStudyTable.drawer = {
        quantity: drawerQuantity,
        price: priceCalculation.drawerMechanism,
      };
    } else if (unitType === "TOP" || unitType === "SIDE") {
      newStudyTable.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };
    }

    // Add the new study table to the array
    room.studyTables.push(newStudyTable);

    // Calculate total price for all study tables in the room
    const totalRoomStudyTablePrice = room.studyTables.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.studyTableTotalPrice = totalRoomStudyTablePrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newStudyTable,
        allStudyTables: room.studyTables,
        totalPrice: totalRoomStudyTablePrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Study table calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/study-table/:studyTableIndex",
  async (req, res, next) => {
    try {
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        drawerQuantity,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Validate room index
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Validate study table index
      if (!room.studyTables || !room.studyTables[req.params.studyTableIndex]) {
        return res.status(404).json({
          success: false,
          error: "Study table not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne();
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "Study table pricing data not found",
        });
      }

      // Specific validation for shelvesRequired and shelvesQuantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
        if (!carcassType) {
          return res.status(400).json({
            success: false,
            error: "For carcass with profile shutter, carcassType is required",
          });
        }

        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with profile shutter, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "GLASS_PROFILE" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For GLASS_PROFILE material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "For open units, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "For ledge units, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "DRAWER") {
        if (!drawerQuantity || drawerQuantity <= 0 || !carcassType) {
          return res.status(400).json({
            success: false,
            error:
              "For drawer units, valid drawerQuantity and carcassType are required",
          });
        }
      } else if (unitType === "TOP" || unitType === "SIDE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: `For ${unitType} units, shutterMaterial is required`,
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      }

      const priceCalculation =
        await StudyTableCalculator.calculateStudyTablePrice(
          measurements,
          {
            unitType,
            finish: finish || "WHITE",
            carcassType,
            shutterMaterial,
            shutterType,
            drawerQuantity,
            shelvesRequired,
            shelvesQuantity,
          },
          prices
        );

      // Update the study table object
      const updatedStudyTable = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit types
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedStudyTable.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedStudyTable.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        // Add shelves if required
        if (shelvesRequired) {
          updatedStudyTable.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
        updatedStudyTable.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };

        updatedStudyTable.profileShutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.profileShutter,
        };

        if (shelvesRequired) {
          updatedStudyTable.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedStudyTable.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedStudyTable.openUnit = {
          price: priceCalculation.openUnit,
        };
        if (shelvesRequired) {
          updatedStudyTable.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedStudyTable.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedStudyTable.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedStudyTable.openUnit = {
          price: priceCalculation.openUnit,
        };
      } else if (unitType === "DRAWER") {
        updatedStudyTable.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedStudyTable.drawer = {
          quantity: drawerQuantity,
          price: priceCalculation.drawerMechanism,
        };
      } else if (unitType === "TOP" || unitType === "SIDE") {
        updatedStudyTable.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };
      }

      // Preserve any accessories from the original study table
      if (room.studyTables[req.params.studyTableIndex].accessories) {
        updatedStudyTable.accessories =
          room.studyTables[req.params.studyTableIndex].accessories;
        updatedStudyTable.accessoriesTotalPrice =
          room.studyTables[req.params.studyTableIndex].accessoriesTotalPrice;
      }

      // Update the study table in the array
      room.studyTables[req.params.studyTableIndex] = updatedStudyTable;

      // Recalculate total price for all study tables in the room
      const totalRoomStudyTablePrice = room.studyTables.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.studyTableTotalPrice = totalRoomStudyTablePrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedStudyTable,
          allStudyTables: room.studyTables,
          totalPrice: totalRoomStudyTablePrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("Study table update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:id/rooms/:roomIndex/study-table/:studyTableIndex",
  async (req, res, next) => {
    try {
      // Find quotation and validate
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Validate room index
      const room = quotation.rooms[req.params.roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Validate study table exists
      if (!room.studyTables || !room.studyTables[req.params.studyTableIndex]) {
        return res.status(404).json({
          success: false,
          error: "Study table not found",
        });
      }

      // Remove the study table from the array
      room.studyTables.splice(req.params.studyTableIndex, 1);

      // Recalculate total price for all study tables in the room
      const totalRoomStudyTablePrice = room.studyTables.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );
      room.studyTableTotalPrice = totalRoomStudyTablePrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          message: "Study table deleted successfully",
          remainingStudyTables: room.studyTables,
          totalPrice: totalRoomStudyTablePrice,
        },
      });
    } catch (error) {
      console.error("Study table deletion error:", error);
      next(error);
    }
  }
);

router.put("/:id/rooms/:roomIndex/bed", async (req, res, next) => {
  try {
    const { bedType, accessories } = req.body;

    // Validate required fields
    if (!bedType) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: bedType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data
    const prices = await BedPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Bed pricing data not found",
      });
    }

    // Validate bed type
    if (!prices.types[bedType]) {
      return res.status(400).json({
        success: false,
        error: `Invalid bed type: ${bedType}`,
      });
    }

    // Calculate bed price without accessories
    const priceCalculation = await calculateBedPrice(bedType, prices);

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.beds) {
      room.beds = [];
    }

    // Create new bed object
    const newBed = {
      bedType,
      dimensions: {
        width: prices.types[bedType].dimensions.width,
        length: prices.types[bedType].dimensions.length,
      },
      price: priceCalculation.price,
      accessories: [],
      accessoriesTotalPrice: 0,
    };

    // Add the new bed to the array
    room.beds.push(newBed);

    // Calculate total price for all beds in the room
    const totalRoomBedPrice = room.beds.reduce(
      (total, bed) => total + bed.price + (bed.accessoriesTotalPrice || 0),
      0
    );

    // Add the total price to the room
    room.bedTotalPrice = totalRoomBedPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newBed,
        allBeds: room.beds,
        totalPrice: totalRoomBedPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Bed calculation error:", error);
    next(error);
  }
});

router.delete("/:id/rooms/:roomIndex/bed/:bedIndex", async (req, res, next) => {
  try {
    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room || !room.beds) {
      return res.status(404).json({
        success: false,
        error: "Room or beds not found",
      });
    }

    const bedIndex = parseInt(req.params.bedIndex);
    if (bedIndex < 0 || bedIndex >= room.beds.length) {
      return res.status(404).json({
        success: false,
        error: "Bed index out of range",
      });
    }

    // Remove the bed
    room.beds.splice(bedIndex, 1);

    // Recalculate total price
    const totalRoomBedPrice = room.beds.reduce(
      (total, bed) => total + bed.price,
      0
    );
    room.bedTotalPrice = totalRoomBedPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        allBeds: room.beds,
        totalPrice: totalRoomBedPrice,
      },
    });
  } catch (error) {
    console.error("Bed deletion error:", error);
    next(error);
  }
});

router.put("/:id/rooms/:roomIndex/bed/:bedIndex", async (req, res, next) => {
  try {
    const { bedType } = req.body;

    // Validate required fields
    if (!bedType) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: bedType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    const room = quotation.rooms[req.params.roomIndex];
    if (!room || !room.beds) {
      return res.status(404).json({
        success: false,
        error: "Room or beds not found",
      });
    }

    const bedIndex = parseInt(req.params.bedIndex);
    if (bedIndex < 0 || bedIndex >= room.beds.length) {
      return res.status(404).json({
        success: false,
        error: "Bed index out of range",
      });
    }

    // Get pricing data
    const prices = await BedPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Bed pricing data not found",
      });
    }

    // Validate bed type
    if (!prices.types[bedType]) {
      return res.status(400).json({
        success: false,
        error: `Invalid bed type: ${bedType}`,
      });
    }

    // Calculate price
    const priceCalculation = await calculateBedPrice(bedType, prices);

    // Update the bed
    room.beds[bedIndex] = {
      bedType,
      dimensions: {
        width: prices.types[bedType].dimensions.width,
        length: prices.types[bedType].dimensions.length,
      },
      price: priceCalculation.price,
      // Preserve any accessories that might have been added
      accessories: room.beds[bedIndex].accessories || [],
      accessoriesTotalPrice: room.beds[bedIndex].accessoriesTotalPrice || 0,
    };

    // Recalculate total price
    const totalRoomBedPrice = room.beds.reduce(
      (total, bed) => total + bed.price,
      0
    );
    room.bedTotalPrice = totalRoomBedPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        updatedBed: room.beds[bedIndex],
        allBeds: room.beds,
        totalPrice: totalRoomBedPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Bed update error:", error);
    next(error);
  }
});

// router.put("/:id/rooms/:roomIndex/shoe-rack", async (req, res, next) => {
//   try {
//     const {
//       measurements,
//       unitType,
//       finish,
//       carcassType,
//       shutterMaterial,
//       shutterType,
//       shelvesQuantity = 0,
//     } = req.body;

//     // Validate required fields
//     if (!measurements || !unitType) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing required fields: measurements, unitType",
//       });
//     }

//     // Find quotation and validate
//     const quotation = await Quotation.findById(req.params.id);
//     if (!quotation) {
//       return res.status(404).json({
//         success: false,
//         error: "Quotation not found",
//       });
//     }

//     // Get pricing data (reusing TV unit pricing for now)
//     const prices = await TVUnitPricing.findOne();
//     if (!prices) {
//       return res.status(404).json({
//         success: false,
//         error: "Pricing data not found",
//       });
//     }

//     // Specific validation based on unit type
//     if (unitType === "SHUTTER_WITH_SHELVES") {
//       if (!carcassType || !shutterMaterial) {
//         return res.status(400).json({
//           success: false,
//           error:
//             "For shutter with shelves, carcassType and shutterMaterial are required",
//         });
//       }

//       if (shutterMaterial === "HDHMR" && !shutterType) {
//         return res.status(400).json({
//           success: false,
//           error: "For HDHMR material, shutterType is required",
//         });
//       }

//       if (shelvesQuantity <= 0) {
//         return res.status(400).json({
//           success: false,
//           error:
//             "For shutter with shelves, shelvesQuantity must be greater than 0",
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid unit type for shoe rack",
//       });
//     }

//     // Calculate price using TV Unit Calculator (since logic is the same)
//     // For "SHUTTER_WITH_SHELVES", reuse the "CARCASS_WITH_SHUTTERS" logic
//     const calculationUnitType =
//       unitType === "SHUTTER_WITH_SHELVES" ? "CARCASS_WITH_SHUTTERS" : unitType;

//     const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
//       measurements,
//       {
//         unitType: calculationUnitType,
//         finish: finish || "WHITE",
//         carcassType,
//         shutterMaterial,
//         shutterType,
//         shelvesRequired: true,
//         shelvesQuantity,
//       },
//       prices
//     );

//     const room = quotation.rooms[req.params.roomIndex];

//     // Initialize shoeRacks array if it doesn't exist
//     if (!room.shoeRacks) {
//       room.shoeRacks = [];
//     }

//     // Create the new shoe rack unit object
//     const newShoeRack = {
//       measurements,
//       unitType,
//       finish: finish || "WHITE",
//       totalPrice: priceCalculation.total,
//     };

//     // Add conditional fields based on unit type
//     if (unitType === "SHUTTER_WITH_SHELVES") {
//       newShoeRack.carcass = {
//         type: carcassType,
//         price: priceCalculation.carcass,
//       };
//       newShoeRack.shutter = {
//         material: shutterMaterial,
//         type: shutterType,
//         price: priceCalculation.shutter,
//       };
//       newShoeRack.shelves = {
//         quantity: shelvesQuantity,
//         price: priceCalculation.shelves?.total || 0,
//       };
//     }

//     // Add the new shoe rack to the array
//     room.shoeRacks.push(newShoeRack);

//     // Calculate total price for all shoe racks in the room
//     const totalRoomShoeRackPrice = room.shoeRacks.reduce(
//       (total, unit) => total + unit.totalPrice,
//       0
//     );

//     // Add the total price to the room
//     room.shoeRackTotalPrice = totalRoomShoeRackPrice;

//     await quotation.save();
//     res.json({
//       success: true,
//       data: {
//         newShoeRack,
//         allShoeRacks: room.shoeRacks,
//         totalPrice: totalRoomShoeRackPrice,
//         pricing: priceCalculation,
//       },
//     });
//   } catch (error) {
//     console.error("Shoe rack calculation error:", error);
//     next(error);
//   }
// });

router.delete(
  "/:quotationId/rooms/:roomIndex/shoeRack/:shoeRacktIndex",
  async (req, res) => {
    try {
      const { quotationId, roomIndex, shoeRacktIndex } = req.params;

      // Find the quotation
      const quotation = await Quotation.findById(quotationId);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Check if room exists
      if (!quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if Shoe Rack array exists and has the requested index
      if (
        !quotation.rooms[roomIndex].shoeRacks ||
        !quotation.rooms[roomIndex].shoeRacks[shoeRacktIndex]
      ) {
        return res.status(404).json({ message: "Shoe Rack not found" });
      }

      // Remove the Shoe Rack at the specified index
      quotation.rooms[roomIndex].shoeRacks.splice(shoeRacktIndex, 1);

      // Save the updated quotation
      await quotation.save();

      return res
        .status(200)
        .json({ message: "Shoe Rack deleted successfully" });
    } catch (error) {
      console.error("Error deleting Shoe Rack:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
);

router.delete(
  "/:quotationId/rooms/:roomIndex/wardrobe/:wardrobeIndex",
  async (req, res) => {
    try {
      const { quotationId, roomIndex, wardrobeIndex } = req.params;

      // Find the quotation
      const quotation = await Quotation.findById(quotationId);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Check if room exists
      if (!quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if wardrobes array exists and has the requested index
      if (
        !quotation.rooms[roomIndex].wardrobes ||
        !quotation.rooms[roomIndex].wardrobes[wardrobeIndex]
      ) {
        return res.status(404).json({ message: "Wardrobe not found" });
      }

      // Remove the Wardrobe at the specified index
      quotation.rooms[roomIndex].wardrobes.splice(wardrobeIndex, 1);

      // Save the updated quotation
      await quotation.save();

      return res.status(200).json({ message: "Wardrobe deleted successfully" });
    } catch (error) {
      console.error("Error deleting Wardrobe:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
);

router.put("/:id/rooms/:roomIndex/tv-unit", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      drawerQuantity,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }
    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }
    // Get pricing data
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "TV unit pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    // Additional validations based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      if (!carcassType || !shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with shutters, carcassType and shutterMaterial are required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
      if (!carcassType) {
        return res.status(400).json({
          success: false,
          error: "For carcass with profile shutter, carcassType is required",
        });
      }

      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with profile shutter, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "GLASS_PROFILE" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For GLASS_PROFILE material, shutterType is required",
        });
      }
    } else if (unitType === "OPEN_UNIT") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "For open units, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "LEDGE") {
      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error: "For ledge units, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "HDHMR" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For HDHMR material, shutterType is required",
        });
      }
    } else if (unitType === "DRAWER") {
      if (!drawerQuantity || drawerQuantity <= 0 || !carcassType) {
        return res.status(400).json({
          success: false,
          error:
            "For drawer units, valid drawerQuantity and carcassType are required",
        });
      }
    }

    const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
      measurements,
      {
        unitType,
        finish: finish || "WHITE",
        carcassType,
        shutterMaterial,
        shutterType,
        drawerQuantity,
        shelvesRequired,
        shelvesQuantity,
      },
      prices
    );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.tvUnits) {
      room.tvUnits = [];
    }

    const newTVUnit = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add conditional fields based on unit type
    if (unitType === "CARCASS_WITH_SHUTTERS") {
      newTVUnit.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newTVUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.shutter,
      };

      // Add shelves if required
      if (shelvesRequired) {
        newTVUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
      newTVUnit.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };

      // Updated to include material and type for profile shutter
      newTVUnit.profileShutter = {
        material: shutterMaterial,
        type: shutterType,
        price: priceCalculation.profileShutter,
      };

      // Add shelves if required
      if (shelvesRequired) {
        newTVUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    } else if (unitType === "OPEN_UNIT") {
      newTVUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newTVUnit.openUnit = {
        price: priceCalculation.openUnit,
      };
      if (shelvesRequired) {
        newTVUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      } else {
        newTVUnit.shelves = {
          required: false,
        };
      }
    } else if (unitType === "LEDGE") {
      newTVUnit.shutter = {
        material: shutterMaterial,
        type: shutterType,
      };
      newTVUnit.openUnit = {
        price: priceCalculation.openUnit,
      };
    } else if (unitType === "DRAWER") {
      newTVUnit.carcass = {
        type: carcassType,
        price: priceCalculation.carcass,
      };
      newTVUnit.drawer = {
        quantity: drawerQuantity,
        price: priceCalculation.drawerMechanism,
      };
    } else if (unitType === "TV_PANEL") {
      newTVUnit.tvPanel = {
        price: priceCalculation.tvPanel,
      };

      // Add shelves if required
      if (shelvesRequired) {
        newTVUnit.shelves = {
          required: true,
          quantity: shelvesQuantity,
          price: priceCalculation.shelves?.total || 0,
        };
      }
    }

    // Add the new TV unit to the array
    room.tvUnits.push(newTVUnit);

    // Calculate total price for all TV units in the room
    const totalRoomTVUnitPrice = room.tvUnits.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.tvUnitTotalPrice = totalRoomTVUnitPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newTVUnit,
        allTVUnits: room.tvUnits,
        totalPrice: totalRoomTVUnitPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("TV unit calculation error:", error);
    next(error);
  }
});

router.put(
  "/:id/rooms/:roomIndex/tv-unit/:tvUnitIndex",
  async (req, res, next) => {
    try {
      const { id, roomIndex, tvUnitIndex } = req.params;
      const {
        measurements,
        unitType,
        finish,
        carcassType,
        shutterMaterial,
        shutterType,
        drawerQuantity,
        shelvesRequired,
        shelvesQuantity,
      } = req.body;

      // Validate required fields
      if (!measurements || !unitType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: measurements, unitType",
        });
      }

      // Find quotation and validate
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Check if room exists
      if (!quotation.rooms[roomIndex]) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      const room = quotation.rooms[roomIndex];

      // Check if tvUnits array exists and has the specified index
      if (!room.tvUnits || !room.tvUnits[tvUnitIndex]) {
        return res.status(404).json({
          success: false,
          error: "TV unit not found",
        });
      }

      // Get pricing data
      const prices = await TVUnitPricing.findOne();
      if (!prices) {
        return res.status(404).json({
          success: false,
          error: "TV unit pricing data not found",
        });
      }

      // Specific validation for shelvesRequired and shelvesQuantity
      if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
        return res.status(400).json({
          success: false,
          error: "If shelves are required, a valid quantity must be provided",
        });
      }

      // Additional validations based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType || !shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with shutters, carcassType and shutterMaterial are required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
        if (!carcassType) {
          return res.status(400).json({
            success: false,
            error: "For carcass with profile shutter, carcassType is required",
          });
        }

        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error:
              "For carcass with profile shutter, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "GLASS_PROFILE" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For GLASS_PROFILE material, shutterType is required",
          });
        }
      } else if (unitType === "OPEN_UNIT") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "For open units, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "LEDGE") {
        if (!shutterMaterial) {
          return res.status(400).json({
            success: false,
            error: "For ledge units, shutterMaterial is required",
          });
        }

        if (shutterMaterial === "HDHMR" && !shutterType) {
          return res.status(400).json({
            success: false,
            error: "For HDHMR material, shutterType is required",
          });
        }
      } else if (unitType === "DRAWER") {
        if (!drawerQuantity || drawerQuantity <= 0 || !carcassType) {
          return res.status(400).json({
            success: false,
            error:
              "For drawer units, valid drawerQuantity and carcassType are required",
          });
        }
      }

      const priceCalculation = await TVUnitCalculator.calculateTVUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          drawerQuantity,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

      const updatedTVUnit = {
        measurements,
        unitType,
        finish: finish || "WHITE",
        totalPrice: priceCalculation.total,
      };

      // Add conditional fields based on unit type
      if (unitType === "CARCASS_WITH_SHUTTERS") {
        updatedTVUnit.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedTVUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.shutter,
        };

        // Add shelves if required
        if (shelvesRequired) {
          updatedTVUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
        updatedTVUnit.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };

        // Updated to include material and type for profile shutter
        updatedTVUnit.profileShutter = {
          material: shutterMaterial,
          type: shutterType,
          price: priceCalculation.profileShutter,
        };

        // Add shelves if required
        if (shelvesRequired) {
          updatedTVUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      } else if (unitType === "OPEN_UNIT") {
        updatedTVUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedTVUnit.openUnit = {
          price: priceCalculation.openUnit,
        };
        if (shelvesRequired) {
          updatedTVUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        } else {
          updatedTVUnit.shelves = {
            required: false,
          };
        }
      } else if (unitType === "LEDGE") {
        updatedTVUnit.shutter = {
          material: shutterMaterial,
          type: shutterType,
        };
        updatedTVUnit.openUnit = {
          price: priceCalculation.openUnit,
        };
      } else if (unitType === "DRAWER") {
        updatedTVUnit.carcass = {
          type: carcassType,
          price: priceCalculation.carcass,
        };
        updatedTVUnit.drawer = {
          quantity: drawerQuantity,
          price: priceCalculation.drawerMechanism,
        };
      } else if (unitType === "TV_PANEL") {
        updatedTVUnit.tvPanel = {
          price: priceCalculation.tvPanel,
        };

        // Add shelves if required
        if (shelvesRequired) {
          updatedTVUnit.shelves = {
            required: true,
            quantity: shelvesQuantity,
            price: priceCalculation.shelves?.total || 0,
          };
        }
      }

      // Update the TV unit at the specified index
      room.tvUnits[tvUnitIndex] = updatedTVUnit;

      // Recalculate total price for all TV units in the room
      const totalRoomTVUnitPrice = room.tvUnits.reduce(
        (total, unit) => total + unit.totalPrice,
        0
      );

      // Update the total price in the room
      room.tvUnitTotalPrice = totalRoomTVUnitPrice;

      await quotation.save();
      res.json({
        success: true,
        data: {
          updatedTVUnit,
          allTVUnits: room.tvUnits,
          totalPrice: totalRoomTVUnitPrice,
          pricing: priceCalculation,
        },
      });
    } catch (error) {
      console.error("TV unit update error:", error);
      next(error);
    }
  }
);

router.delete(
  "/:quotationId/rooms/:roomIndex/tv-unit/:tvUnitIndex",
  async (req, res) => {
    try {
      const { quotationId, roomIndex, tvUnitIndex } = req.params;

      // Find the quotation
      const quotation = await Quotation.findById(quotationId);

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Check if room exists
      if (!quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if tvUnits array exists and has the requested index
      if (
        !quotation.rooms[roomIndex].tvUnits ||
        !quotation.rooms[roomIndex].tvUnits[tvUnitIndex]
      ) {
        return res.status(404).json({ message: "TV unit not found" });
      }

      // Remove the TV unit at the specified index
      quotation.rooms[roomIndex].tvUnits.splice(tvUnitIndex, 1);

      // Save the updated quotation
      await quotation.save();

      return res.status(200).json({ message: "TV unit deleted successfully" });
    } catch (error) {
      console.error("Error deleting TV unit:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
);
/*
router.put("/:id/rooms/:roomIndex/crockery-unit", async (req, res, next) => {
  try {
    const {
      measurements,
      unitType,
      finish,
      carcassType,
      shutterMaterial,
      shutterType,
      drawerQuantity,
      shelvesRequired,
      shelvesQuantity,
    } = req.body;

    // Validate required fields
    if (!measurements || !unitType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: measurements, unitType",
      });
    }

    // Find quotation and validate
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Get pricing data - we'll use the TV unit pricing for now
    const prices = await TVUnitPricing.findOne();
    if (!prices) {
      return res.status(404).json({
        success: false,
        error: "Pricing data not found",
      });
    }

    // Specific validation for shelvesRequired and shelvesQuantity
    if (shelvesRequired && (!shelvesQuantity || shelvesQuantity <= 0)) {
      return res.status(400).json({
        success: false,
        error: "If shelves are required, a valid quantity must be provided",
      });
    }

    if (unitType === "CARCASS_WITH_PROFILE_SHUTTER") {
      if (!carcassType) {
        return res.status(400).json({
          success: false,
          error: "For carcass with profile shutter, carcassType is required",
        });
      }

      if (!shutterMaterial) {
        return res.status(400).json({
          success: false,
          error:
            "For carcass with profile shutter, shutterMaterial is required",
        });
      }

      if (shutterMaterial === "GLASS_PROFILE" && !shutterType) {
        return res.status(400).json({
          success: false,
          error: "For GLASS_PROFILE material, shutterType is required",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error:
          "Currently only CARCASS_WITH_PROFILE_SHUTTER type is supported for crockery units",
      });
    }

    // Create a calculator for the crockery unit (we'll modify the TVUnitCalculator)
    const priceCalculation =
      await CrockeryUnitCalculator.calculateCrockeryUnitPrice(
        measurements,
        {
          unitType,
          finish: finish || "WHITE",
          carcassType,
          shutterMaterial,
          shutterType,
          shelvesRequired,
          shelvesQuantity,
        },
        prices
      );

    const room = quotation.rooms[req.params.roomIndex];
    if (!room.crockeryUnits) {
      room.crockeryUnits = [];
    }

    const newCrockeryUnit = {
      measurements,
      unitType,
      finish: finish || "WHITE",
      totalPrice: priceCalculation.total,
    };

    // Add specific fields for CARCASS_WITH_PROFILE_SHUTTER
    newCrockeryUnit.carcass = {
      type: carcassType,
      price: priceCalculation.carcass,
    };

    newCrockeryUnit.profileShutter = {
      material: shutterMaterial,
      type: shutterType,
      price: priceCalculation.profileShutter,
    };

    // Add shelves if required
    if (shelvesRequired) {
      newCrockeryUnit.shelves = {
        required: true,
        quantity: shelvesQuantity,
        price: priceCalculation.shelves?.total || 0,
      };
    }

    // Add the new crockery unit to the array
    room.crockeryUnits.push(newCrockeryUnit);

    // Calculate total price for all crockery units in the room
    const totalRoomCrockeryUnitPrice = room.crockeryUnits.reduce(
      (total, unit) => total + unit.totalPrice,
      0
    );

    // Add the total price to the room
    room.crockeryUnitTotalPrice = totalRoomCrockeryUnitPrice;

    await quotation.save();
    res.json({
      success: true,
      data: {
        newCrockeryUnit,
        allCrockeryUnits: room.crockeryUnits,
        totalPrice: totalRoomCrockeryUnitPrice,
        pricing: priceCalculation,
      },
    });
  } catch (error) {
    console.error("Crockery unit calculation error:", error);
    next(error);
  }
});
*/
router.post(
  "/:quotationId/rooms/:roomIndex/custom-component",
  async (req, res) => {
    try {
      const { quotationId, roomIndex } = req.params;
      const componentData = req.body;

      // Find the room
      const quotation = await Quotation.findById(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      if (!quotation.rooms || !quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Room not found" });
      }

      const room = quotation.rooms[roomIndex];

      // Create the custom component
      const customComponent = new CustomComponent({
        name: componentData.name,
        roomId: room._id,
        dimensions: componentData.dimensions,
        material: componentData.material,
        finish: componentData.finish,
        additionalInfo: componentData.additionalInfo,
        defineType: componentData.defineType,
        carcassType: componentData.carcassType,
        shutterMaterial: componentData.shutterMaterial,
        shutterFinish: componentData.shutterFinish,
        shelvesQuantity: componentData.shelvesQuantity || 0,
        shelvesRequired: componentData.shelvesQuantity > 0,
        drawerQuantity: componentData.drawerQuantity || 0,
      });

      await customComponent.save();

      // Add to room's customComponents array if it doesn't exist
      if (!room.customComponents) {
        room.customComponents = [];
      }

      room.customComponents.push(customComponent._id);
      await quotation.save();

      res.status(201).json({
        message: "Custom component created successfully",
        id: customComponent._id,
      });
    } catch (error) {
      console.error("Error creating custom component:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// DELETE endpoint to remove a custom component
router.delete(
  "/:quotationId/rooms/:roomIndex/custom-component/:componentId",
  async (req, res) => {
    try {
      const { quotationId, roomIndex, componentId } = req.params;

      // Find the quotation and room
      const quotation = await Quotation.findById(quotationId);
      if (!quotation || !quotation.rooms || !quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Quotation or room not found" });
      }

      const room = quotation.rooms[roomIndex];

      // Remove the component ID from the room
      if (room.customComponents) {
        room.customComponents = room.customComponents.filter(
          (id) => id.toString() !== componentId
        );
      }

      await quotation.save();

      // Delete the component
      await CustomComponent.findByIdAndDelete(componentId);

      res
        .status(200)
        .json({ message: "Custom component deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom component:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// GET endpoint to retrieve all custom components for a room
router.get(
  "/:quotationId/rooms/:roomIndex/custom-components",
  async (req, res) => {
    try {
      const { quotationId, roomIndex } = req.params;

      // Find the room
      const quotation = await Quotation.findById(quotationId);
      if (!quotation || !quotation.rooms || !quotation.rooms[roomIndex]) {
        return res.status(404).json({ message: "Quotation or room not found" });
      }

      const room = quotation.rooms[roomIndex];

      // Find all custom components for this room
      const customComponents = await CustomComponent.find({
        _id: { $in: room.customComponents || [] },
      });

      res.status(200).json(customComponents);
    } catch (error) {
      console.error("Error retrieving custom components:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update kitchen selections and calculate prices
router.put(
  "/:id/rooms/:roomIndex/kitchen/calculate",
  async (req, res, next) => {
    try {
      const { type, finish, sections } = req.body;
      const quotation = await Quotation.findById(req.params.id);
      const prices = await kitchenPricing.findOne();

      if (!prices) {
        return res.status(500).json({
          success: false,
          error:
            "Kitchen pricing data not found. Please ensure pricing data is seeded.",
        });
      }

      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      const room = quotation.rooms[req.params.roomIndex];
      if (!room || room.type !== "Kitchen") {
        return res.status(400).json({
          success: false,
          error: "Invalid room or room is not a kitchen",
        });
      }

      let formattedSections = {};
      for (const [sectionKey, section] of Object.entries(sections)) {
        formattedSections[sectionKey] = {
          base: section.base
            ? {
                ...section.base,
                price: await KitchenCalculator.calculateSectionPrice(
                  section.base,
                  "base",
                  type,
                  prices
                ),
              }
            : undefined,
          wall: section.wall
            ? {
                ...section.wall,
                price: await KitchenCalculator.calculateSectionPrice(
                  section.wall,
                  "wall",
                  type,
                  prices
                ),
              }
            : undefined,
          loft: section.loft
            ? {
                ...section.loft,
                price: await KitchenCalculator.calculateSectionPrice(
                  section.loft,
                  "loft",
                  type,
                  prices
                ),
              }
            : undefined,
        };
      }

      room.kitchen.type = type;
      room.kitchen.finish = finish;
      room.kitchen.sections = formattedSections;

      await quotation.save();

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      console.error("Calculation error:", error);
      next(error);
    }
  }
);

async function calculatePartitionCost(partition, prices, kitchenType) {
  const { componentType, module, detail, accessories = [] } = partition;

  const partitionWithCost = { ...partition, accessories: accessories || [] };

  if (!partitionWithCost.price) {
    partitionWithCost.price = {
      base: 0,
      module: 0,
      detail: 0,
      accessories: 0,
      total: 0,
    };
  }

  let totalCost = 0;

  if (prices.unitPrices[partition.componentType]?.base) {
    partitionWithCost.price.base =
      prices.unitPrices[partition.componentType].base;
  }

  if (partition.details && partition.details.length > 0) {
    let detailsCost = 0;
    for (const detailObj of partition.details) {
      const detailPrice =
        prices.unitPrices[partition.componentType].modules[partition.module]
          .details[detailObj.detail];
      detailsCost += detailPrice;
      detailObj.price = detailPrice;
    }
    partitionWithCost.price.details = detailsCost;
  }

  if (module && prices.unitPrices[componentType]?.modules?.[module]) {
    if (
      detail &&
      prices.unitPrices[componentType].modules[module].details?.[detail]
    ) {
      partitionWithCost.price.detail =
        prices.unitPrices[componentType].modules[module].details[detail];
      totalCost += partitionWithCost.price.detail;
    }

    if (
      Array.isArray(partitionWithCost.accessories) &&
      partitionWithCost.accessories.length > 0
    ) {
      let accessoriesCost = 0;
      const formattedAccessories = [];

      for (const accessory of partitionWithCost.accessories) {
        const accessoryName =
          typeof accessory === "string" ? accessory : accessory.name;
        const price =
          prices.unitPrices[componentType].modules[module].accessories?.[
            accessoryName
          ] || 0;

        accessoriesCost += price;
        formattedAccessories.push({
          name: accessoryName,
          price: price,
        });
      }

      partitionWithCost.accessories = formattedAccessories;
      partitionWithCost.price.accessories = accessoriesCost;
      totalCost += accessoriesCost;
    }
  }

  if (
    !module &&
    (componentType === "Wicker basket Unit" ||
      componentType === "Shutters Base") &&
    Array.isArray(partitionWithCost.accessories) &&
    partitionWithCost.accessories.length > 0
  ) {
    let accessoriesCost = 0;
    const formattedAccessories = [];

    for (const accessory of partitionWithCost.accessories) {
      const accessoryName =
        typeof accessory === "string" ? accessory : accessory.name;
      const price =
        prices.unitPrices[componentType].accessories?.[accessoryName] || 0;

      accessoriesCost += price;
      formattedAccessories.push({
        name: accessoryName,
        price: price,
      });
    }

    partitionWithCost.accessories = formattedAccessories;
    partitionWithCost.price.accessories = accessoriesCost;
    totalCost += accessoriesCost;
  }

  // Set shutter detail based on kitchen type
  if (kitchenType === "MODULAR") {
    partitionWithCost.shutterDetail = "Shutters on Frame";
  } else {
    partitionWithCost.shutterDetail = "Shutters on carcass";
  }

  // Set total price
  partitionWithCost.price.total = Object.values(partitionWithCost.price).reduce(
    (a, b) => a + b,
    0
  );

  return partitionWithCost;
}

async function calculateWallPartitionCost(partition, prices) {
  const { componentType, detail, accessories = [] } = partition;

  const partitionWithCost = {
    ...partition,
    accessories: accessories || [],
    price: {
      base: 0,
      detail: 0,
      accessories: 0,
      total: 0,
    },
  };

  // Get wall unit prices from the partition pricing data
  const wallUnitPrices = prices.unitPrices;

  // Handle Open Unit
  if (componentType === "Open Unit") {
    partitionWithCost.price.base = wallUnitPrices[componentType]?.base || 0;
    partitionWithCost.price.total = partitionWithCost.price.base;
    return partitionWithCost;
  }

  // Handle Rolling Shutter
  if (componentType === "Rolling Shutter" && detail) {
    const detailPrice = wallUnitPrices[componentType]?.details?.[detail] || 0;
    partitionWithCost.price.detail = detailPrice;
    partitionWithCost.price.total = detailPrice;
    return partitionWithCost;
  }

  // Handle Shutters
  if (componentType === "Shutters") {
    // Add detail cost if present
    if (detail && wallUnitPrices[componentType]?.details?.[detail]) {
      partitionWithCost.price.detail =
        wallUnitPrices[componentType].details[detail];
    }

    // Calculate accessories cost
    if (Array.isArray(accessories) && accessories.length > 0) {
      let accessoriesCost = 0;
      const formattedAccessories = [];

      for (const accessory of accessories) {
        const accessoryName =
          typeof accessory === "string" ? accessory : accessory.name;
        const price =
          wallUnitPrices[componentType]?.accessories?.[accessoryName] || 0;

        // Special handling for per sq.ft and per r.ft accessories
        if (accessoryName === "ALUMINIUM SHUTTER ADITION (ALL GLASS)") {
          accessoriesCost +=
            (price * partition.width * partition.height) / (304.8 * 304.8); // Convert to sq.ft
        } else if (accessoryName === "LIGHT WITH GROOVE") {
          accessoriesCost += price * (partition.width / 304.8); // Convert to r.ft
        } else {
          accessoriesCost += price;
        }

        formattedAccessories.push({
          name: accessoryName,
          price: accessoriesCost,
        });
      }

      partitionWithCost.accessories = formattedAccessories;
      partitionWithCost.price.accessories = accessoriesCost;
    }
  }

  // Calculate total price
  partitionWithCost.price.total = Object.values(partitionWithCost.price).reduce(
    (a, b) => a + b,
    0
  );

  return partitionWithCost;
}

async function calculateBedPrice(bedType, prices) {
  const bedPrice = prices.types[bedType].price;

  return {
    bedType,
    price: bedPrice,
    total: bedPrice,
  };
}

/// cost summary
router.get("/:id/cost-summary", async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      quotation.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this quotation's cost summary",
      });
    }

    // Initialize cost summary structure
    const costSummary = {
      quotationId: quotation._id,
      customerName: quotation.customerName,
      rooms: [],
    };

    // Process each room
    for (let roomIndex = 0; roomIndex < quotation.rooms.length; roomIndex++) {
      const room = quotation.rooms[roomIndex];

      if (!room.selected) continue;

      const roomSummary = {
        roomIndex,
        roomType: room.type,
        roomLabel: room.label || room.type,
        kitchenSummary: null,
        wardrobeSummary: null,
      };

      // Calculate kitchen summary if applicable
      if (room.type === "Kitchen" && room.kitchen) {
        const kitchenSummary = {
          shape: room.kitchen.shape,
          sections: {},
          partitionCosts: {
            total: 0,
            partitions: [],
          },
          totalCost: 0,
        };

        // Process each section
        for (const [sectionKey, section] of Object.entries(
          room.kitchen.sections || {}
        )) {
          const sectionSummary = {
            base: section.base?.price || { total: 0 },
            wall: section.wall?.price || { total: 0 },
            loft: section.loft?.price || { total: 0 },
            partitions: {
              base: extractPartitionCosts(section.base?.partitions),
              wall: extractPartitionCosts(section.wall?.partitions),
              loft: extractPartitionCosts(section.loft?.partitions),
            },
            sectionTotal: 0,
          };

          // Calculate section total
          const baseTotal = section.base?.price?.total || 0;
          const wallTotal = section.wall?.price?.total || 0;
          const loftTotal = section.loft?.price?.total || 0;

          // Add partition costs to total
          const basePartitionsTotal = sectionSummary.partitions.base.total;
          const wallPartitionsTotal = sectionSummary.partitions.wall.total;
          const loftPartitionsTotal = sectionSummary.partitions.loft.total;

          sectionSummary.sectionTotal =
            baseTotal +
            wallTotal +
            loftTotal +
            basePartitionsTotal +
            wallPartitionsTotal +
            loftPartitionsTotal;

          kitchenSummary.sections[sectionKey] = sectionSummary;
          kitchenSummary.totalCost += sectionSummary.sectionTotal;

          // Add all partitions to the flat list for easy access
          kitchenSummary.partitionCosts.partitions = [
            ...kitchenSummary.partitionCosts.partitions,
            ...sectionSummary.partitions.base.items,
            ...sectionSummary.partitions.wall.items,
            ...sectionSummary.partitions.loft.items,
          ];

          kitchenSummary.partitionCosts.total +=
            basePartitionsTotal + wallPartitionsTotal + loftPartitionsTotal;
        }

        roomSummary.kitchenSummary = kitchenSummary;
      }

      // Calculate wardrobe summary if applicable
      if (room.wardrobe) {
        roomSummary.wardrobeSummary = {
          measurements: room.wardrobe.measurements,
          carcass: {
            type: room.wardrobe.carcass?.type,
            price: room.wardrobe.carcass?.price || 0,
          },
          shutter: {
            material: room.wardrobe.shutter?.material,
            type: room.wardrobe.shutter?.type,
            price: room.wardrobe.shutter?.price || 0,
          },
          totalCost: room.wardrobe.totalPrice || 0,
        };
      }

      costSummary.rooms.push(roomSummary);
    }

    // Calculate grand total
    costSummary.grandTotal = costSummary.rooms.reduce((total, room) => {
      const kitchenTotal = room.kitchenSummary?.totalCost || 0;
      const wardrobeTotal = room.wardrobeSummary?.totalCost || 0;
      return total + kitchenTotal + wardrobeTotal;
    }, 0);

    res.json({
      success: true,
      data: costSummary,
    });
  } catch (error) {
    console.error("Cost summary error:", error);
    next(new Error("Failed to generate cost summary: " + error.message));
  }
});

// router.get('/accessories/beds', async (req, res, next) => {
//   try {
//       // Get pricing data for bed accessories
//       const bedPricing = await BedPricing.findOne();
//       if (!bedPricing) {
//           return res.status(404).json({
//               success: false,
//               error: 'Bed pricing data not found'
//           });
//       }

//       // Extract available accessories for beds
//       const availableAccessories = bedPricing.accessories;
//       if (!availableAccessories) {
//           return res.status(404).json({
//               success: false,
//               error: 'No accessories found for beds'
//           });
//       }

//       // Format the response to be consistent with other accessories
//       const formattedAccessories = Object.keys(availableAccessories).map(accessoryType => {
//           return {
//               type: accessoryType,
//               price: availableAccessories[accessoryType]
//           };
//       });

//       res.json({
//           success: true,
//           data: {
//               componentType: 'beds',
//               accessories: formattedAccessories
//           }
//       });
//   } catch (error) {
//       console.error('Get bed accessories error:', error);
//       next(error);
//   }
// });

// get all accesory option depending on component type
router.get("/accessories/:componentType", async (req, res, next) => {
  try {
    const { componentType } = req.params;

    // Map the component type from URL to the pricing category
    const componentPricingMap = {
      tvUnits: "tvUnit",
      wardrobes: "wardrobe",
      shoeRacks: "shoeRack",
      crockeryUnits: "crockeryUnit",
      consoleUnits: "consoleUnit",
      beds: "bed", // Added beds to the map
    };

    const pricingCategory = componentPricingMap[componentType];
    if (!pricingCategory) {
      return res.status(400).json({
        success: false,
        error: `Invalid component type: ${componentType}`,
      });
    }

    // Special handling for beds
    if (componentType === "beds") {
      // Get pricing data for bed accessories
      const bedPricing = await BedPricing.findOne();
      if (!bedPricing) {
        return res.status(404).json({
          success: false,
          error: "Bed pricing data not found",
        });
      }

      // Extract available accessories for beds
      const availableAccessories = bedPricing.accessories;
      if (!availableAccessories) {
        return res.status(404).json({
          success: false,
          error: "No accessories found for beds",
        });
      }

      // Format the response for bed accessories
      const formattedAccessories = Object.keys(availableAccessories).map(
        (accessoryType) => {
          return {
            type: accessoryType,
            price: availableAccessories[accessoryType],
            // Beds don't have dimensions or finishes options
            availableDimensions: ["STANDARD"],
            availableFinishes: ["STANDARD"],
          };
        }
      );

      return res.json({
        success: true,
        data: {
          componentType,
          accessories: formattedAccessories,
        },
      });
    }

    // Regular handling for other component types
    const accessoryPricing = await AccessoryPricing.findOne();
    if (!accessoryPricing) {
      return res.status(404).json({
        success: false,
        error: "Accessory pricing data not found",
      });
    }

    // Extract available accessories for the component type
    const availableAccessories = accessoryPricing[pricingCategory];
    if (!availableAccessories) {
      return res.status(404).json({
        success: false,
        error: `No accessories found for ${componentType}`,
      });
    }

    // Format the response to be more user-friendly
    const formattedAccessories = Object.keys(availableAccessories).map(
      (accessoryType) => {
        const dimensions = Object.keys(
          availableAccessories[accessoryType].dimensions
        );
        const finishes = Object.keys(
          availableAccessories[accessoryType].finishes
        );

        return {
          type: accessoryType,
          availableDimensions: dimensions,
          availableFinishes: finishes,
          pricing: {
            dimensionPrices: availableAccessories[accessoryType].dimensions,
            finishAdditionalPrices:
              availableAccessories[accessoryType].finishes,
          },
        };
      }
    );

    res.json({
      success: true,
      data: {
        componentType,
        accessories: formattedAccessories,
      },
    });
  } catch (error) {
    console.error("Get accessories error:", error);
    next(error);
  }
});

// Endpoint to get all accessories for a specific component
router.get(
  "/:id/rooms/:roomIndex/:componentType/:componentIndex/accessories",
  async (req, res, next) => {
    try {
      const { id, roomIndex, componentType, componentIndex } = req.params;

      // Find quotation
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get room
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      const componentMap = {
        tvUnits: room.tvUnits,
        wardrobes: room.wardrobes,
        shoeRacks: room.shoeRacks,
        crockeryUnits: room.crockeryUnits,
        consoleUnits: room.consoleUnits,
        beds: room.beds, // Added beds to the map
      };

      // Get component array
      const components = componentMap[componentType];
      if (!components || !Array.isArray(components)) {
        return res.status(404).json({
          success: false,
          error: `Component type ${componentType} not found in this room`,
        });
      }

      // Get specific component
      const component = components[componentIndex];
      if (!component) {
        return res.status(404).json({
          success: false,
          error: "Component not found",
        });
      }

      // Determine the total price field based on component type
      let componentTotalPrice = 0;
      if (componentType === "beds") {
        componentTotalPrice =
          component.price + (component.accessoriesTotalPrice || 0);
      } else {
        componentTotalPrice = component.totalPrice || 0;
      }

      // Return the accessories
      res.json({
        success: true,
        data: {
          accessories: component.accessories || [],
          accessoriesTotalPrice: component.accessoriesTotalPrice || 0,
          componentTotalPrice: componentTotalPrice,
        },
      });
    } catch (error) {
      console.error("Get component accessories error:", error);
      next(error);
    }
  }
);

router.put(
  "/:id/rooms/:roomIndex/:componentType/:componentIndex/accessories",
  async (req, res, next) => {
    try {
      const { id, roomIndex, componentType, componentIndex } = req.params;
      const { accessoryType, quantity, finish } = req.body;

      // Validate required fields based on component type
      if (componentType === "beds") {
        if (!accessoryType || !quantity) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields: accessoryType, quantity",
          });
        }
      } else {
        if (!accessoryType || !quantity || !finish) {
          return res.status(400).json({
            success: false,
            error:
              "Missing required fields: accessoryType, dimension, finish, quantity",
          });
        }
      }

      // Validate quantity
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be greater than 0",
        });
      }

      // Find quotation
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get room
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Map componentType to the actual component array in the room
      const componentMap = {
        tvUnits: room.tvUnits,
        wardrobes: room.wardrobes,
        shoeRacks: room.shoeRacks,
        crockeryUnits: room.crockeryUnits,
        consoleUnits: room.consoleUnits,
        beds: room.beds,
      };

      // Get component array
      const components = componentMap[componentType];
      if (!components || !Array.isArray(components)) {
        return res.status(404).json({
          success: false,
          error: `Component type ${componentType} not found in this room`,
        });
      }

      // Get specific component
      const component = components[componentIndex];
      if (!component) {
        return res.status(404).json({
          success: false,
          error: "Component not found",
        });
      }

      // Special handling for bed accessories
      if (componentType === "beds") {
        // Define bed accessory pricing (you can replace these values)
        const bedAccessoryPricing = {
          HYDRAULIC_LIFT_UP: 8000,
          BED_WITH_DRAWERS_1: 5000,
          BED_WITH_DRAWERS_2: 7500,
          MANUAL_LIFT_UP: 4000,
        };

        // Validate accessory type for beds
        if (!bedAccessoryPricing[accessoryType]) {
          return res.status(400).json({
            success: false,
            error: `Invalid bed accessory type: ${accessoryType}`,
          });
        }

        // Calculate price for bed accessory
        const unitPrice = bedAccessoryPricing[accessoryType];
        const totalPrice = unitPrice * quantity;

        // Create the accessory object
        const newAccessory = {
          type: accessoryType,
          quantity,
          unitPrice,
          totalPrice,
        };

        // Initialize accessories array if it doesn't exist
        if (!component.accessories) {
          component.accessories = [];
        }

        // Add the accessory
        component.accessories.push(newAccessory);

        // Calculate total accessories price
        component.accessoriesTotalPrice = component.accessories.reduce(
          (sum, acc) => sum + acc.totalPrice,
          0
        );

        // Update the total price of the component to include accessories
        component.totalPrice =
          (component.price || 0) + component.accessoriesTotalPrice;

        // Update the room's total bed price
        room.bedTotalPrice = room.beds.reduce(
          (total, bed) => total + bed.price + (bed.accessoriesTotalPrice || 0),
          0
        );

        // Save the changes
        await quotation.save();

        res.json({
          success: true,
          data: {
            newAccessory,
            allAccessories: component.accessories,
            accessoriesTotalPrice: component.accessoriesTotalPrice,
            componentTotalPrice: component.totalPrice,
            roomTotalPrice: room.bedTotalPrice,
          },
        });
      } else {
        // Original accessory handling for other component types
        const { dimension } = req.body;

        if (!dimension) {
          return res.status(400).json({
            success: false,
            error: "Missing required field: dimension",
          });
        }

        // Get pricing data for accessories
        const accessoryPricing = await AccessoryPricing.findOne();
        if (!accessoryPricing) {
          return res.status(404).json({
            success: false,
            error: "Accessory pricing data not found",
          });
        }

        // Map component type to the pricing category
        const componentPricingMap = {
          tvUnits: "tvUnit",
          wardrobes: "wardrobe",
          shoeRacks: "shoeRack",
          crockeryUnits: "crockeryUnit",
          consoleUnits: "consoleUnit",
        };

        const pricingCategory = componentPricingMap[componentType];

        // Check if the accessory type is valid for this component
        if (
          !accessoryPricing[pricingCategory] ||
          !accessoryPricing[pricingCategory][accessoryType]
        ) {
          return res.status(400).json({
            success: false,
            error: `Invalid accessory type for ${componentType}`,
          });
        }

        // Check if the dimension is valid for this accessory
        if (
          !accessoryPricing[pricingCategory][accessoryType].dimensions[
            dimension
          ]
        ) {
          return res.status(400).json({
            success: false,
            error: `Invalid dimension for ${accessoryType}`,
          });
        }

        // Check if the finish is valid for this accessory
        if (
          !accessoryPricing[pricingCategory][accessoryType].finishes[finish]
        ) {
          return res.status(400).json({
            success: false,
            error: `Invalid finish for ${accessoryType}`,
          });
        }

        // Calculate the price
        const basePriceForDimension =
          accessoryPricing[pricingCategory][accessoryType].dimensions[
            dimension
          ];
        const additionalPriceForFinish =
          accessoryPricing[pricingCategory][accessoryType].finishes[finish];
        const unitPrice = basePriceForDimension + additionalPriceForFinish;
        const totalPrice = unitPrice * quantity;

        // Create the accessory object
        const newAccessory = {
          type: accessoryType,
          dimension,
          finish,
          quantity,
          unitPrice,
          totalPrice,
        };

        // Initialize accessories array if it doesn't exist
        if (!component.accessories) {
          component.accessories = [];
        }

        // Add the accessory
        component.accessories.push(newAccessory);

        // Calculate total accessories price
        component.accessoriesTotalPrice = component.accessories.reduce(
          (sum, acc) => sum + acc.totalPrice,
          0
        );

        // Update the total price of the component to include accessories
        component.totalPrice =
          (component.totalPrice || 0) + newAccessory.totalPrice;

        // Save the changes
        await quotation.save();

        res.json({
          success: true,
          data: {
            newAccessory,
            allAccessories: component.accessories,
            accessoriesTotalPrice: component.accessoriesTotalPrice,
            componentTotalPrice: component.totalPrice,
          },
        });
      }
    } catch (error) {
      console.error("Accessory addition error:", error);
      next(error);
    }
  }
);

// Endpoint to remove an accessory
router.delete(
  "/:id/rooms/:roomIndex/:componentType/:componentIndex/accessories/:accessoryIndex",
  async (req, res, next) => {
    try {
      const { id, roomIndex, componentType, componentIndex, accessoryIndex } =
        req.params;

      // Find quotation
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get room
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Map componentType to the actual component array in the room
      const componentMap = {
        tvUnits: room.tvUnits,
        wardrobes: room.wardrobes,
        shoeRacks: room.shoeRacks,
        crockeryUnits: room.crockeryUnits,
        consoleUnits: room.consoleUnits,
      };

      // Get component array
      const components = componentMap[componentType];
      if (!components || !Array.isArray(components)) {
        return res.status(404).json({
          success: false,
          error: `Component type ${componentType} not found in this room`,
        });
      }

      // Get specific component
      const component = components[componentIndex];
      if (!component) {
        return res.status(404).json({
          success: false,
          error: "Component not found",
        });
      }

      // Check if accessories array exists
      if (!component.accessories || !Array.isArray(component.accessories)) {
        return res.status(404).json({
          success: false,
          error: "No accessories found for this component",
        });
      }

      // Get the accessory to be removed
      const accessory = component.accessories[accessoryIndex];
      if (!accessory) {
        return res.status(404).json({
          success: false,
          error: "Accessory not found",
        });
      }

      // Remove the accessory
      const accessoryPrice = accessory.totalPrice;
      component.accessories.splice(accessoryIndex, 1);

      // Recalculate total accessories price
      component.accessoriesTotalPrice = component.accessories.reduce(
        (sum, acc) => sum + acc.totalPrice,
        0
      );

      // Update the total price of the component
      component.totalPrice = component.totalPrice - accessoryPrice;

      // Save the changes
      await quotation.save();

      res.json({
        success: true,
        data: {
          remainingAccessories: component.accessories,
          accessoriesTotalPrice: component.accessoriesTotalPrice,
          componentTotalPrice: component.totalPrice,
        },
      });
    } catch (error) {
      console.error("Accessory removal error:", error);
      next(error);
    }
  }
);

// Endpoint to update an accessory (continuation)
router.patch(
  "/:id/rooms/:roomIndex/:componentType/:componentIndex/accessories/:accessoryIndex",
  async (req, res, next) => {
    try {
      const { id, roomIndex, componentType, componentIndex, accessoryIndex } =
        req.params;
      const { dimension, finish, quantity } = req.body;

      // Find quotation
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
      }

      // Get room and component
      const room = quotation.rooms[roomIndex];
      if (!room) {
        return res.status(404).json({
          success: false,
          error: "Room not found",
        });
      }

      // Map componentType to actual components
      const componentMap = {
        tvUnits: room.tvUnits,
        wardrobes: room.wardrobes,
        shoeRacks: room.shoeRacks,
        crockeryUnits: room.crockeryUnits,
        consoleUnits: room.consoleUnits,
      };

      const components = componentMap[componentType];
      if (!components) {
        return res.status(404).json({
          success: false,
          error: `Component type ${componentType} not found`,
        });
      }

      const component = components[componentIndex];
      if (!component) {
        return res.status(404).json({
          success: false,
          error: "Component not found",
        });
      }

      if (
        !component.accessories ||
        accessoryIndex >= component.accessories.length
      ) {
        return res.status(404).json({
          success: false,
          error: "Accessory not found",
        });
      }

      const accessory = component.accessories[accessoryIndex];
      const oldPrice = accessory.totalPrice;

      // Get pricing data for accessories
      const accessoryPricing = await AccessoryPricing.findOne();
      if (!accessoryPricing) {
        return res.status(404).json({
          success: false,
          error: "Accessory pricing data not found",
        });
      }

      // Map component type to the pricing category
      const componentPricingMap = {
        tvUnits: "tvUnit",
        wardrobes: "wardrobe",
        shoeRacks: "shoeRack",
        crockeryUnits: "crockeryUnit",
        consoleUnits: "consoleUnit",
      };

      const pricingCategory = componentPricingMap[componentType];
      const accessoryType = accessory.type;

      // Validate new values against pricing data
      if (
        dimension &&
        !accessoryPricing[pricingCategory][accessoryType].dimensions[dimension]
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid dimension for ${accessoryType}`,
        });
      }

      if (
        finish &&
        !accessoryPricing[pricingCategory][accessoryType].finishes[finish]
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid finish for ${accessoryType}`,
        });
      }

      if (quantity !== undefined && quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: "Quantity must be greater than 0",
        });
      }

      // Update the accessory properties
      const updatedDimension = dimension || accessory.dimension;
      const updatedFinish = finish || accessory.finish;
      const updatedQuantity =
        quantity !== undefined ? quantity : accessory.quantity;

      // Calculate the new price
      const basePriceForDimension =
        accessoryPricing[pricingCategory][accessoryType].dimensions[
          updatedDimension
        ];
      const additionalPriceForFinish =
        accessoryPricing[pricingCategory][accessoryType].finishes[
          updatedFinish
        ];
      const unitPrice = basePriceForDimension + additionalPriceForFinish;
      const totalPrice = unitPrice * updatedQuantity;

      // Update the accessory object
      accessory.dimension = updatedDimension;
      accessory.finish = updatedFinish;
      accessory.quantity = updatedQuantity;
      accessory.unitPrice = unitPrice;
      accessory.totalPrice = totalPrice;

      // Recalculate total accessories price
      component.accessoriesTotalPrice = component.accessories.reduce(
        (sum, acc) => sum + acc.totalPrice,
        0
      );

      // Update the total price of the component
      component.totalPrice = component.totalPrice - oldPrice + totalPrice;

      // Save the changes
      await quotation.save();

      res.json({
        success: true,
        data: {
          updatedAccessory: accessory,
          allAccessories: component.accessories,
          accessoriesTotalPrice: component.accessoriesTotalPrice,
          componentTotalPrice: component.totalPrice,
        },
      });
    } catch (error) {
      console.error("Accessory update error:", error);
      next(error);
    }
  }
);
// Helper function to extract partition costs
function extractPartitionCosts(partitions = []) {
  const result = {
    items: [],
    total: 0,
  };

  for (const partition of partitions) {
    if (partition.price && partition.price.total) {
      result.items.push({
        componentType: partition.componentType,
        width: partition.width,
        module: partition.module,
        details: partition.details,
        accessories: partition.accessories,
        cost: partition.price.total,
      });
      result.total += partition.price.total;
    }
  }

  return result;
}

module.exports = router;
