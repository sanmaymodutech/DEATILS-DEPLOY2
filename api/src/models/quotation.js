const mongoose = require("mongoose");

const KITCHEN_SHAPES = {
  NONE: "None",
  SINGLE_SLAB: "Single Slab",
  L_SHAPE: "L-Shape",
  U_SHAPE: "U-Shape",
  G_SHAPE: "G-Shape",
  PARALLEL: "Parallel",
};

const COMPONENT_TYPES = {
  "2_DRAWER": "2 Drawer (2 Option)",
  "3_DRAWER": "3 Drawer (3OP)",
  "1_DRAWER_1_OPEN": "1 Drawer 1 Open (2OP)",
  MASALA_PULLOUT: "Masala Pullout",
  WICKER_BASKET: "Wicker basket Unit",
  SHUTTER_BASE: "Shutters Base",
  SHELF: "Shelve",
  SHUTTER: "Shutters",
  Open_UNIT: "Open Unit",
  ROLLING_SHUTTER: "Rolling Shutter",
  CHIMNEY: "Chimney",
};

const partitionSchema = new mongoose.Schema({
  width: {
    type: Number,
    required: true,
    min: [0, "Width must be greater than 0"],
  },
  componentType: {
    type: String,
    enum: Object.values(COMPONENT_TYPES),
  },
  module: {
    type: String,
    enum: ["Tandem", "SS 304", null],
  },
  details: [
    {
      detail: String,
      price: Number,
    },
  ],
  accessories: [
    {
      name: String,
      price: Number,
    },
  ],
  price: {
    base: Number,
    module: Number,
    details: Number,
    accessories: Number,
    total: Number,
  },
  shutterDetail: String,
  specifications: {
    type: Map,
    of: String,
  },
});

const ROOM_TYPES = {
  KITCHEN: "Kitchen",
  LIVING_ROOM: "Living Room",
  MASTER_BEDROOM: "Master Bedroom",
  BEDROOM: "Bedroom",
  BATHROOM: "Bathroom",
};

const TV_UNIT_TYPES = {
  CARCASS_WITH_SHUTTERS: "CARCASS_WITH_SHUTTERS",
  OPEN_UNIT: "OPEN_UNIT",
  DRAWER: "DRAWER",
  CARCASS_WITH_PROFILE_SHUTTER: "CARCASS_WITH_PROFILE_SHUTTER",
  TV_PANEL: "TV_PANEL",
  LEDGE: "LEDGE",
  GLASS_PROFILE: "GLASS_PROFILE",
};

const BHK_ROOM_CONFIGS = {
  "1BHK": [
    { type: "Kitchen", defaultShape: "Single Slab" },
    { type: "Living Room" },
    { type: "Master Bedroom" },
  ],
  "2BHK": [
    { type: "Kitchen", defaultShape: "Single Slab" },
    { type: "Living Room" },
    { type: "Master Bedroom" },
    { type: "Bedroom" },
  ],
  "3BHK": [
    { type: "Kitchen", defaultShape: "Single Slab" },
    { type: "Living Room" },
    { type: "Master Bedroom" },
    { type: "Master Bedroom" },
    { type: "Bedroom" },
  ],
};

const measurementSchema = new mongoose.Schema({
  width: {
    type: Number,
    required: true,
    min: [0, "Width must be greater than 0"],
  },
  depth: {
    type: Number,
    required: true,
    min: [0, "Depth must be greater than 0"],
  },
  height: {
    type: Number,
    required: true,
    min: [0, "Height must be greater than 0"],
  },
});

const kitchenSchema = new mongoose.Schema({
  shape: {
    type: String,
    required: true,
    enum: Object.values(KITCHEN_SHAPES),
  },
  finish: {
    type: String,
    enum: ["FAB", "WHITE"],
  },
  shape: {
    type: String,
    required: true,
    enum: Object.values(KITCHEN_SHAPES),
  },

  sections: {
    A: {
      base: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      wall: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      loft: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        shutterType: {
          material: String,
          finish: String,
        },
        price: {
          shutter: Number,
          total: Number,
        },
      },
    },
    B: {
      base: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      wall: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      loft: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        shutterType: {
          material: String,
          finish: String,
        },
        price: {
          shutter: Number,
          total: Number,
        },
      },
    },
    C: {
      base: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      wall: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      loft: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        shutterType: {
          material: String,
          finish: String,
        },
        price: {
          shutter: Number,
          total: Number,
        },
      },
    },
    D: {
      base: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      wall: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        carcassType: {
          type: String,
          enum: ["BWP", "BWR", "COM_PLY", "NONE"],
        },
        shutterType: {
          material: {
            type: String,
            enum: [
              "BWP_WHITE",
              "BWP_FAB_KITCHEN",
              "BWR_WHITE",
              "COM_PLY_WHITE",
              "HDHMR_WHITE",
            ],
          },
          finish: {
            type: String,
            enum: [
              "ACRYLIC_GLOSSY",
              "ACRYLIC_MATTE",
              "PU",
              "ROUTED_PU",
              "GLAX",
            ],
          },
        },
        price: {
          carcass: Number,
          shutter: Number,
          total: Number,
        },
      },
      loft: {
        measurements: measurementSchema,
        partitions: [partitionSchema],
        remainingWidth: Number,
        shutterType: {
          material: String,
          finish: String,
        },
        price: {
          shutter: Number,
          total: Number,
        },
      },
    },
  },
});

const accessorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  dimension: {
    type: String,
  },
  finish: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const wardrobeUnitSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number },

    height: { type: Number },

    depth: { type: Number },
  },

  unitType: {
    type: String,

    enum: ["DRAWER", "SHELVES", "VERTICAL_LINE"], // Expanded unit types

    required: true,
  },

  finish: {
    type: String,

    enum: ["WHITE", "FAB"],
  },

  carcass: {
    type: {
      type: String,

      enum: ["BWP", "BWR", "COM_PLY"],
    },

    price: Number,
  },

  drawer: {
    quantity: Number,

    weight: {
      type: String,

      enum: ["30KG", "50KG"],
    },

    mechanismPrice: Number,

    totalMechanismCost: Number,
  },

  shelves: {
    quantity: Number,

    pricePerShelf: {
      type: Number,

      default: 200,
    },

    totalPrice: Number,
  },

  verticalLine: {
    quantity: Number,

    totalPrice: Number,

    squareFeet: Number,
  },

  totalPrice: Number,

  squareFeet: Number,
});

const wardrobeSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
    required: true,
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: true,
    },
    price: Number,
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      required: true,
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter.material === "HDHMR";
      },
    },
    price: Number,
  },
  units: [wardrobeUnitSchema],

  unitsTotalPrice: {
    type: Number,

    default: 0,
  },
  totalPrice: Number,
});

const shoeRackSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
    required: true,
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: true,
    },
    price: Number,
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      required: true,
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter.material === "HDHMR";
      },
    },
    price: Number,
  },
  units: [wardrobeUnitSchema], // Reusing the same schema as wardrobe units
  unitsTotalPrice: {
    type: Number,
    default: 0,
  },
  totalPrice: Number,
});

// Component schema for console unit parts - exactly like wardrobe unit schema
const consoleUnitComponentSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number },
    height: { type: Number },
    depth: { type: Number },
  },
  unitType: {
    type: String,
    enum: ["DRAWER", "SHELVES", "VERTICAL_LINE"],
    required: true,
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
    },
    price: Number,
  },
  drawer: {
    quantity: Number,
    weight: {
      type: String,
      enum: ["30KG", "50KG"],
    },
    mechanismPrice: Number,
    totalMechanismCost: Number,
  },
  shelves: {
    quantity: Number,
    pricePerShelf: {
      type: Number,
      default: 200,
    },
    totalPrice: Number,
  },
  verticalLine: {
    quantity: Number,
    totalPrice: Number,
    squareFeet: Number,
  },
  totalPrice: Number,
  squareFeet: Number,
});

const consoleUnitSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
    required: true,
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: true,
    },
    price: Number,
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      // required: true
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter.material === "HDHMR";
      },
    },
    price: Number,
  },
  units: [consoleUnitComponentSchema],
  unitsTotalPrice: {
    type: Number,
    default: 0,
  },
  totalPrice: Number,
});

const tvUnitSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
  },
  unitType: {
    type: String,
    enum: Object.values(TV_UNIT_TYPES),
    required: true,
  },
  shelves: {
    required: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: function () {
        return this.unitType === "CARCASS_WITH_SHUTTERS";
      },
    },
    price: Number,
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      required: function () {
        return ["CARCASS_WITH_SHUTTERS", "OPEN_UNIT"].includes(this.unitType);
      },
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter?.material === "HDHMR";
      },
    },
    price: Number,
  },
  drawer: {
    quantity: {
      type: Number,
      required: function () {
        return this.unitType === "DRAWER";
      },
    },
    price: Number,
  },
  totalPrice: Number,
});

const CROCKERY_UNIT_TYPES = {
  CARCASS_WITH_PROFILE_SHUTTER: "CARCASS_WITH_PROFILE_SHUTTER",
};

const crockerySchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
    required: true,
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: true,
    },
    price: Number,
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      // required: true
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter.material === "HDHMR";
      },
    },
    price: Number,
  },
  units: [wardrobeUnitSchema],
  unitsTotalPrice: {
    type: Number,
    default: 0,
  },
  totalPrice: Number,
});

const crockeryUnitSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
  },
  unitType: {
    type: String,
    enum: Object.values(TV_UNIT_TYPES),
    required: true,
  },
  carcass: {
    type: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY"],
      required: true,
    },
    price: Number,
  },
  profileShutter: {
    material: {
      type: String,
      enum: ["GLASS_PROFILE"],
      required: true,
    },
    type: {
      type: String,
      enum: ["FROSTED_GLASS", "CLEAR_GLASS", "TINTED_GLASS"],
      required: true,
    },
    price: Number,
  },
  shelves: {
    required: Boolean,
    quantity: Number,
    price: Number,
  },
  totalPrice: Number,
});

const tallUnitSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },

    height: { type: Number, required: true },

    depth: { type: Number, required: true },
  },

  finish: {
    type: String,

    enum: ["WHITE", "FAB"],
  },

  unitType: {
    type: String,

    enum: Object.values(TV_UNIT_TYPES),

    required: true,
  },

  carcass: {
    type: {
      type: String,

      enum: ["BWP", "BWR", "COM_PLY"],

      required: true,
    },

    price: Number,
  },

  profileShutter: {
    material: {},
  },

  profileShutter: {
    material: {
      type: String,

      enum: ["GLASS_PROFILE"],

      required: true,
    },

    type: {
      type: String,

      enum: ["FROSTED_GLASS", "CLEAR_GLASS", "TINTED_GLASS"],

      required: true,
    },

    price: Number,
  },

  shelves: {
    required: Boolean,

    quantity: Number,

    price: Number,
  },

  totalPrice: Number,
});

const onsiteWorkSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ["Painting", "False ceiling", "Carpentry", "Electrical", "Civil"],
  },
  service: {
    type: {
      type: String,
    },
    subType: String,
    name: String,
  },
  area: Number,
  quantity: Number,
  dimensions: {
    height: Number,
    length: Number,
    width: Number,
  },
  rate: Number,
  calculationType: String,
  price: Number,
});

const bedSchema = new mongoose.Schema({
  bedType: {
    type: String,
    enum: [
      "SINGLE_BED",
      "QUEEN_SIZE_BED",
      "KING_SIZE_BED",
      "CALIFORNIA_QUEEN_BED",
      "CALIFORNIA_KING_BED",
      "WALL_MOUNTED_SINGLE_BED",
      "WALL_MOUNTED_SINGLE_BED_WITH_STORAGE",
      "WALL_MOUNTED_QUEEN_BED",
      "WALL_MOUNTED_QUEEN_BED_WITH_STORAGE",
    ],
    required: true,
  },
  dimensions: {
    width: { type: Number, required: true },
    length: { type: Number, required: true },
  },
  price: { type: Number, required: true },
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});
const fillerSchema = new mongoose.Schema({
  measurements: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
  },
  finish: {
    type: String,
    enum: ["WHITE", "FAB"],
    default: "WHITE",
  },
  shutter: {
    material: {
      type: String,
      enum: ["BWP", "BWR", "COM_PLY", "HDHMR"],
      required: true,
    },
    type: {
      type: String,
      enum: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
      required: function () {
        return this.shutter.material === "HDHMR";
      },
    },
    price: Number,
  },
  totalPrice: Number,
});
const roomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  selected: {
    type: Boolean,
    default: true,
  },
  kitchen: kitchenSchema,
  wardrobe: wardrobeSchema,
  wardrobes: [wardrobeSchema],
  beds: [bedSchema],
  bedTotalPrice: Number,
  shoeRack: shoeRackSchema,
  shoeRacks: [shoeRackSchema],
  consoleUnit: consoleUnitSchema,
  consoleUnits: [consoleUnitSchema],
  crockeryUnit: crockerySchema,
  crockeryUnits: [crockerySchema],
  consoleUnitTotalPrice: Number,

  tvUnits: [tvUnitSchema],
  // crockeryUnits: [crockeryUnitSchema],
  studyTables: [tvUnitSchema],
  studyTableTotalPrice: Number,
  tallUnits: [tallUnitSchema],

  storageUnits: [tvUnitSchema],
  vanityStorage: [tvUnitSchema],
  mandirUnits: [tvUnitSchema],
  chestofDrawers: [tvUnitSchema],
  fillerUnits: [fillerSchema],
  fillerUnitTotalPrice: Number,
  storageUnitTotalPrice: Number,
  vanitystorageTotalPrice: Number,
  mandirUnitTotalPrice: Number,
  chestofDrawerTotalPrice: Number,
  onsiteWork: [onsiteWorkSchema],
  onsiteWorkTotalPrice: Number,
  hasOnsiteWork: {
    type: Boolean,
    default: false,
  },
  customComponents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomComponent",
    },
  ],
});

const quotationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    propertyName: {
      type: String,
      required: [true, "Property name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    bhk: {
      type: String,
      required: [true, "BHK is required"],
      enum: ["1BHK", "2BHK", "3BHK"],
    },
    rooms: [roomSchema],
    customRooms: [roomSchema],
    onsiteWorkEnabled: {
      type: Boolean,
      default: false,
    },
    onsiteWorkByRoom: {
      type: Map,
      of: [onsiteWorkSchema],
      default: () => new Map(),
    },
    onsiteWorkTotalPrice: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.pre("save", function (next) {
  if (this.isNew) {
    const defaultRooms = BHK_ROOM_CONFIGS[this.bhk].map((config) => {
      const room = {
        type: config.type,
        label: "",
        selected: true,
      };

      if (config.type === "Kitchen") {
        room.kitchen = {
          shape: config.defaultShape,
          sections: {
            A: {
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
            },
          },
        };
      }
      return room;
    });

    this.rooms = defaultRooms;
  }
  next();
});

tvUnitSchema.add({
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});

// Similarly for other component schemas:
wardrobeSchema.add({
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});

shoeRackSchema.add({
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});

crockerySchema.add({
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});
consoleUnitSchema.add({
  accessories: [accessorySchema],
  accessoriesTotalPrice: {
    type: Number,
    default: 0,
  },
});
quotationSchema.index({ createdBy: 1 });
quotationSchema.index({ "rooms.type": 1 });
quotationSchema.statics.getBHKRooms = function (bhkType) {
  return BHK_ROOM_CONFIGS[bhkType] || [];
};
quotationSchema.statics.KITCHEN_SHAPES = KITCHEN_SHAPES;
quotationSchema.statics.ROOM_TYPES = ROOM_TYPES;
quotationSchema.statics.CROCKERY_UNIT_TYPES = CROCKERY_UNIT_TYPES;
quotationSchema.statics.BHK_ROOM_CONFIGS = BHK_ROOM_CONFIGS;
module.exports = mongoose.model("Quotation", quotationSchema);
