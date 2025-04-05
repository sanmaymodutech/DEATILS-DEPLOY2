const express = require("express");
const router = express.Router();
const Quotation = require("../models/quotation");
const { protect, authorize } = require("../middleware/auth");

const ONSITE_CATEGORIES = {
  PAINTING: "Painting",
  FALSE_CEILING: "False ceiling",
  CARPENTRY: "Carpentry",
  ELECTRICAL: "Electrical",
  CIVIL: "Civil",
};

const ONSITE_SERVICES = {
  [ONSITE_CATEGORIES.PAINTING]: {
    INTERIOR: {
      ROYAL: { name: "Royal", rate: 33, unit: "HxW" },
      LUSTER: { name: "Luster", rate: 38, unit: "HxW" },
      TEXTURE: { name: "Texture", rate: 45, unit: "HxW" },
      PLASTIC_PAINT: { name: "Plastic Paint", rate: 25, unit: "HxW" },
    },
    EXTERIOR: {
      UV_PROTECH: { name: "UV Protech", rate: 40, unit: "HxW" },
      SHEEN: { name: "Sheen", rate: 48, unit: "HxW" },
      DISTEMPER: { name: "Distemper", rate: 29, unit: "HxW" },
    },
  },
  [ONSITE_CATEGORIES.FALSE_CEILING]: {
    FC_LOCAL: { name: "FC Local", rate: 60, unit: "HxW" },
    FC_OMAN: { name: "FC Oman", rate: 70, unit: "HxW" },
    FC_SAINT_GOBAIN: { name: "FC Saint Gobain", rate: 95, unit: "HxW" },
    COVE: { name: "Cove", rate: 70, unit: "H / RFT" },
    POP_PARTITION: { name: "POP Partition", rate: 80, unit: "HxW" },
  },
  [ONSITE_CATEGORIES.CARPENTRY]: {
    WALL_PANEL: { name: "Wall Panel", rate: 450, unit: "HxW" },
    MIRROR_PANEL: { name: "Mirror Panel", rate: 700, unit: "HxW" },
    SAFETY_DOOR: { name: "Safety Door", rate: 25000, unit: "Quantity Count" },
    AC_PELMETS: { name: "AC Pelmets", rate: 400, unit: "HxW" },
    STORAGE: { name: "Storage", rate: 750, unit: "HxW" },
    CEMENT_SHEET: { name: "Cement sheet", rate: 550, unit: "HxW" },
  },
  [ONSITE_CATEGORIES.ELECTRICAL]: {
    AMP_5_NEW: { name: "5 AMP New", rate: 800, unit: "Quantity Count" },
    AMP_5_RL: { name: "5 AMP RL", rate: 500, unit: "Quantity Count" },
    AMP_12: { name: "12 AMP", rate: 1100, unit: "Quantity Count" },
    AMP_16: { name: "16 AMP", rate: 1300, unit: "Quantity Count" },
    CAD_6: { name: "CAD 6", rate: 2500, unit: "Quantity Count" },
    HDMI_10M: { name: "HDMI 10Mtrs", rate: 10000, unit: "Quantity Count" },
    CCTV: { name: "CCTV", rate: 0, unit: "Quantity Count" },
  },
  [ONSITE_CATEGORIES.CIVIL]: {
    WALL_BREAKING: { name: "Wall Breaking", rate: 80, unit: "HxW" },
    WALL_MAKING: { name: "Wall Making", rate: 100, unit: "HxW" },
    COUNTER_TOP_BREAKING: {
      name: "Counter top Breaking",
      rate: 100,
      unit: "HxW",
    },
    COUNTER_TOP_MAKING: { name: "Counter top Making", rate: 120, unit: "HxW" },
    FLOORING_TILE: {
      name: "Flooring (Tile Installation)",
      rate: 180,
      unit: "HxW",
    },
    BRICK_COBA: { name: "Brick Coba", rate: 50, unit: "HxW" },
    MARBLE_INSTALLATION: {
      name: "Marble Installation",
      rate: 500,
      unit: "HxW",
    },
  },
};

router.use(protect);

// Get all onsite categories
router.get("/categories", (req, res) => {
  res.json({
    success: true,
    data: Object.values(ONSITE_CATEGORIES),
  });
});

// Get services for a specific category
router.get("/services/:category", (req, res) => {
  const category = req.params.category;

  if (!ONSITE_SERVICES[category]) {
    return res.status(404).json({
      success: false,
      error: "Category not found",
    });
  }

  // Format the services for the response
  const formattedServices = {};
  const services = ONSITE_SERVICES[category];

  // For painting, format interior and exterior services separately
  if (category === ONSITE_CATEGORIES.PAINTING) {
    formattedServices.INTERIOR = Object.values(services.INTERIOR);
    formattedServices.EXTERIOR = Object.values(services.EXTERIOR);
  } else {
    // For other categories, format all services directly
    formattedServices.ALL = Object.values(services);
  }

  res.json({
    success: true,
    data: formattedServices,
  });
});

// Get rooms available for onsite work
router.get("/:id/onsite-work-rooms", async (req, res, next) => {
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
        error: "Not authorized to view this quotation",
      });
    }

    // Filter selected rooms
    const selectedRooms = quotation.rooms
      .filter((room) => room.selected)
      .map((room) => ({
        type: room.type,
        label: room.label || room.type,
        // Check if room has any onsite work
        hasOnsiteWork:
          quotation.onsiteWorkByRoom &&
          quotation.onsiteWorkByRoom.has(room.type) &&
          quotation.onsiteWorkByRoom.get(room.type).length > 0,
      }));

    res.json({
      success: true,
      data: selectedRooms,
    });
  } catch (error) {
    console.error("Get onsite work rooms error:", error);
    next(error);
  }
});

// Add/update onsite work for a room
router.post(
  "/:id/onsite-work/:roomType",
  authorize("designer", "admin"),
  async (req, res, next) => {
    try {
      const { category, serviceType, subType, area, quantity, dimensions } =
        req.body;
      const roomType = req.params.roomType;

      // Validate inputs - different validation based on category
      if (!category) {
        return res.status(400).json({
          success: false,
          error: "Category is required",
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

      const roomExists = quotation.rooms.some(
        (room) => room.type === roomType && room.selected
      );
      if (!roomExists) {
        return res.status(404).json({
          success: false,
          error: "Selected room not found or not selected in this quotation",
        });
      }

      if (!quotation.onsiteWorkByRoom) {
        quotation.onsiteWorkByRoom = new Map();
      }

      let service;
      let serviceRate = 0;
      let calculationType = "";

      // Get service details based on category
      if (category === ONSITE_CATEGORIES.PAINTING) {
        if (!serviceType || !subType) {
          return res.status(400).json({
            success: false,
            error: "For painting, serviceType and subType are required",
          });
        }

        service = ONSITE_SERVICES[category][serviceType][subType];
        if (!service) {
          return res.status(400).json({
            success: false,
            error: "Invalid service selected",
          });
        }

        serviceRate = service.rate;
        calculationType = service.unit;
      } else {
        if (!serviceType) {
          return res.status(400).json({
            success: false,
            error: "ServiceType is required",
          });
        }

        service = ONSITE_SERVICES[category][serviceType];
        if (!service) {
          return res.status(400).json({
            success: false,
            error: "Invalid service selected",
          });
        }

        serviceRate = service.rate;
        calculationType = service.unit;
      }

      // Validate required measurements based on calculation type and category
      if (
        calculationType === "HxW" &&
        !dimensions?.height &&
        !dimensions?.width &&
        !area
      ) {
        return res.status(400).json({
          success: false,
          error:
            "For HxW calculation, either area or dimensions (height and width) are required",
        });
      } else if (calculationType === "Quantity Count" && !quantity) {
        return res.status(400).json({
          success: false,
          error: "Quantity is required for this service",
        });
      } else if (
        calculationType === "H / RFT" &&
        (!dimensions?.height || !dimensions?.length)
      ) {
        return res.status(400).json({
          success: false,
          error: "Height and length are required for this service",
        });
      }

      // Calculate price based on calculation type and category
      let price = 0;
      let areaValue = 0;

      if (calculationType === "HxW") {
        // If area is directly provided, use it
        if (area) {
          areaValue = area;
        }
        // Otherwise calculate from dimensions
        else if (dimensions?.height && dimensions?.width) {
          areaValue = dimensions.height * dimensions.width;
        }
        price = serviceRate * areaValue;
      } else if (calculationType === "Quantity Count") {
        price = serviceRate * quantity;
      } else if (calculationType === "H / RFT") {
        price = serviceRate * dimensions.height * dimensions.length;
      }

      // Create onsite work object
      const onsiteWorkItem = {
        category,
        service:
          category === ONSITE_CATEGORIES.PAINTING
            ? { type: serviceType, subType, name: service.name }
            : { type: serviceType, name: service.name },
        area: areaValue || area,
        quantity,
        dimensions,
        rate: serviceRate,
        calculationType,
        price: Math.round(price),
      };

      // Add to the room's onsite work array in onsiteWorkByRoom
      const roomOnsiteWork = quotation.onsiteWorkByRoom.get(roomType) || [];
      roomOnsiteWork.push(onsiteWorkItem);
      quotation.onsiteWorkByRoom.set(roomType, roomOnsiteWork);

      // Update the room's onsiteWork array as well for backward compatibility
      const roomIndex = quotation.rooms.findIndex(
        (room) => room.type === roomType
      );
      if (roomIndex !== -1) {
        if (!quotation.rooms[roomIndex].onsiteWork) {
          quotation.rooms[roomIndex].onsiteWork = [];
        }
        quotation.rooms[roomIndex].onsiteWork.push(onsiteWorkItem);
        quotation.rooms[roomIndex].hasOnsiteWork = true;

        // Calculate total onsite work price for the room
        const roomOnsiteWorkPrice = quotation.rooms[
          roomIndex
        ].onsiteWork.reduce((total, item) => total + item.price, 0);
        quotation.rooms[roomIndex].onsiteWorkTotalPrice = roomOnsiteWorkPrice;
      }

      // Calculate total onsite work price for the entire quotation
      let totalOnsiteWorkPrice = 0;
      quotation.onsiteWorkByRoom.forEach((works) => {
        works.forEach((work) => {
          totalOnsiteWorkPrice += work.price;
        });
      });
      quotation.onsiteWorkTotalPrice = totalOnsiteWorkPrice;
      quotation.onsiteWorkEnabled = true;

      await quotation.save();

      res.json({
        success: true,
        data: {
          newOnsiteWork: onsiteWorkItem,
          roomOnsiteWork: roomOnsiteWork,
          totalPrice: totalOnsiteWorkPrice,
        },
      });
    } catch (error) {
      console.error("Onsite work error:", error);
      next(error);
    }
  }
);

// Get all onsite work for all rooms
router.get("/:id/onsite-work", async (req, res, next) => {
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
        error: "Not authorized to view this quotation",
      });
    }

    // Get selected rooms for showing in dropdown
    const selectedRooms = quotation.rooms
      .filter((room) => room.selected)
      .map((room) => ({
        type: room.type,
        label: room.label || room.type,
      }));

    // Get onsite work data organized by room
    const onsiteWorkByRoom = {};
    if (quotation.onsiteWorkByRoom) {
      quotation.onsiteWorkByRoom.forEach((works, roomType) => {
        onsiteWorkByRoom[roomType] = works;
      });
    }

    res.json({
      success: true,
      data: {
        selectedRooms,
        onsiteWorkByRoom,
        totalPrice: quotation.onsiteWorkTotalPrice || 0,
        enabled: quotation.onsiteWorkEnabled || false,
      },
    });
  } catch (error) {
    console.error("Get onsite work error:", error);
    next(error);
  }
});

// Delete onsite work for a room
router.delete(
  "/:id/onsite-work/:roomType/:workIndex",
  authorize("designer", "admin"),
  async (req, res, next) => {
    try {
      const { roomType, workIndex } = req.params;

      // Find quotation
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

      // Check if room has onsite work
      if (
        !quotation.onsiteWorkByRoom ||
        !quotation.onsiteWorkByRoom.has(roomType)
      ) {
        return res.status(404).json({
          success: false,
          error: "No onsite work found for this room",
        });
      }

      const roomOnsiteWork = quotation.onsiteWorkByRoom.get(roomType);
      if (!roomOnsiteWork[workIndex]) {
        return res.status(404).json({
          success: false,
          error: "Onsite work item not found",
        });
      }

      // Remove the onsite work item
      roomOnsiteWork.splice(workIndex, 1);
      quotation.onsiteWorkByRoom.set(roomType, roomOnsiteWork);

      // Update the room's onsiteWork array for backward compatibility
      const roomIndex = quotation.rooms.findIndex(
        (room) => room.type === roomType
      );
      if (roomIndex !== -1 && quotation.rooms[roomIndex].onsiteWork) {
        if (quotation.rooms[roomIndex].onsiteWork[workIndex]) {
          quotation.rooms[roomIndex].onsiteWork.splice(workIndex, 1);

          // Update room's onsite work total price
          const roomOnsiteWorkPrice = quotation.rooms[
            roomIndex
          ].onsiteWork.reduce((total, item) => total + item.price, 0);
          quotation.rooms[roomIndex].onsiteWorkTotalPrice = roomOnsiteWorkPrice;
        }
      }

      // Recalculate total onsite work price
      let totalOnsiteWorkPrice = 0;
      quotation.onsiteWorkByRoom.forEach((works) => {
        works.forEach((work) => {
          totalOnsiteWorkPrice += work.price;
        });
      });
      quotation.onsiteWorkTotalPrice = totalOnsiteWorkPrice;

      await quotation.save();

      res.json({
        success: true,
        data: {
          roomOnsiteWork: roomOnsiteWork,
          totalPrice: totalOnsiteWorkPrice,
        },
      });
    } catch (error) {
      console.error("Delete onsite work error:", error);
      next(error);
    }
  }
);

// Update onsite work item
router.put(
  "/:id/onsite-work/:roomType/:workIndex",
  authorize("designer", "admin"),
  async (req, res, next) => {
    try {
      const { area, quantity, dimensions } = req.body;
      const { roomType, workIndex } = req.params;

      // Find quotation
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

      if (
        !quotation.onsiteWorkByRoom ||
        !quotation.onsiteWorkByRoom.has(roomType)
      ) {
        return res.status(404).json({
          success: false,
          error: "No onsite work found for this room",
        });
      }

      const roomOnsiteWork = quotation.onsiteWorkByRoom.get(roomType);
      if (!roomOnsiteWork[workIndex]) {
        return res.status(404).json({
          success: false,
          error: "Onsite work item not found",
        });
      }

      const onsiteWork = roomOnsiteWork[workIndex];

      if (area !== undefined) onsiteWork.area = area;
      if (quantity !== undefined) onsiteWork.quantity = quantity;
      if (dimensions !== undefined) onsiteWork.dimensions = dimensions;

      let price = 0;
      let areaValue = 0;

      if (onsiteWork.calculationType === "HxW") {
        if (onsiteWork.area) {
          areaValue = onsiteWork.area;
        } else if (
          onsiteWork.dimensions?.height &&
          onsiteWork.dimensions?.width
        ) {
          areaValue =
            onsiteWork.dimensions.height * onsiteWork.dimensions.width;
        }
        price = onsiteWork.rate * areaValue;
      } else if (onsiteWork.calculationType === "Quantity Count") {
        price = onsiteWork.rate * onsiteWork.quantity;
      } else if (
        onsiteWork.calculationType === "H / RFT" &&
        onsiteWork.dimensions?.height &&
        onsiteWork.dimensions?.length
      ) {
        price =
          onsiteWork.rate *
          onsiteWork.dimensions.height *
          onsiteWork.dimensions.length;
      }

      onsiteWork.price = Math.round(price);

      const roomIndex = quotation.rooms.findIndex(
        (room) => room.type === roomType
      );
      if (roomIndex !== -1 && quotation.rooms[roomIndex].onsiteWork) {
        const compatWorkIndex = quotation.rooms[roomIndex].onsiteWork.findIndex(
          (work) =>
            work.category === onsiteWork.category &&
            work.service.name === onsiteWork.service.name
        );

        if (compatWorkIndex !== -1) {
          quotation.rooms[roomIndex].onsiteWork[compatWorkIndex] = onsiteWork;

          const roomOnsiteWorkPrice = quotation.rooms[
            roomIndex
          ].onsiteWork.reduce((total, item) => total + item.price, 0);
          quotation.rooms[roomIndex].onsiteWorkTotalPrice = roomOnsiteWorkPrice;
        }
      }

      let totalOnsiteWorkPrice = 0;
      quotation.onsiteWorkByRoom.forEach((works) => {
        works.forEach((work) => {
          totalOnsiteWorkPrice += work.price;
        });
      });
      quotation.onsiteWorkTotalPrice = totalOnsiteWorkPrice;

      await quotation.save();

      res.json({
        success: true,
        data: {
          updatedOnsiteWork: onsiteWork,
          roomOnsiteWork: roomOnsiteWork,
          totalPrice: totalOnsiteWorkPrice,
        },
      });
    } catch (error) {
      console.error("Update onsite work error:", error);
      next(error);
    }
  }
);

module.exports = {
  router,
  ONSITE_CATEGORIES,
  ONSITE_SERVICES,
};
