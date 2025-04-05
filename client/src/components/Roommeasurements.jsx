import * as React from "react";
import Box from "@mui/material/Box";
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Grid,
  Alert,
} from "@mui/material";
import { TrashIcon } from "lucide-react";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";
import CustomComponentForm from "./CustomComponentForm";
import WardrobeUnitsModal from "./WardrobeUnitsModal";
import ConsoleUnitsModal from "./ConsoleUnitsModal";
import CrockeryUnitsModal from "./CrockeryUnitsModal";
import ShoeRackUnitsModal from "./ShoeRackUnitsModal";
import AccessoriesModal from "./AccessoriesModal";

const RoomMeasurements = ({ roomIndex, name }) => {
  const {
    RoomPricing,
    quotationId,
    quotation,
    TV_UNIT_TYPES,
    setQuotation,
    fetchQuotationById,
  } = useAuth();
  const [expandedUnits, setExpandedUnits] = React.useState(null);
  const [selectedComponent, setSelectedComponent] = React.useState("");
  const [dimensions, setDimensions] = React.useState({
    width: "",
    depth: "",
    height: "",
  });
  const [selectedOptions, setSelectedOptions] = React.useState("");
  const [entries, setEntries] = React.useState([]);
  const [roomData, setRoomData] = React.useState({});
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // State for component-specific dropdowns
  const [carcassType, setCarcassType] = React.useState("");
  const [finish, setFinish] = React.useState("");
  const [shutterMaterial, setShutterMaterial] = React.useState("");
  const [shutterFinish, setShutterFinish] = React.useState("");
  // State for quantity
  const [drawerQuantity, setDrawerQuantity] = React.useState(1);
  const [shelvesQuantity, setShelvesQuantity] = React.useState(1);

  const [accessoriesModalOpen, setAccessoriesModalOpen] = React.useState(false);
  const [selectedComponentIndex, setSelectedComponentIndex] =
    React.useState(null);
  const [selectedComponentType, setSelectedComponentType] = React.useState("");

  const [isEditing, setIsEditing] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState(null);

  // Inside RoomMeasurements component, add this state for modal control
  const [unitsModalOpen, setUnitsModalOpen] = React.useState(false);
  const [selectedWardrobeIndex, setSelectedWardrobeIndex] =
    React.useState(null);

  const [consoleUnitsModalOpen, setConsoleUnitsModalOpen] =
    React.useState(false);
  const [selectedConsoleUnitIndex, setSelectedConsoleUnitIndex] =
    React.useState(null);
  const [crockeryUnitsModalOpen, setCrockeryUnitsModalOpen] =
    React.useState(false);
  const [selectedCrockeryUnitIndex, setSelectedCrockeryUnitIndex] =
    React.useState(null);
  const [shoeRackUnitsModalOpen, setShoeRackUnitsModalOpen] =
    React.useState(false);
  const [selectedShoeRackIndex, setSelectedShoeRackIndex] =
    React.useState(null);
  const [wardrobeDepthOption, setWardrobeDepthOption] = React.useState("600");
  const [customDepth, setCustomDepth] = React.useState("");

  const handleWardrobeDepthChange = (event) => {
    setWardrobeDepthOption(event.target.value);
    if (event.target.value !== "custom") {
      setDimensions({
        ...dimensions,
        depth: event.target.value === "600" ? "600" : "400",
      });
    }
  };

  // Add this function to handle custom depth input
  const handleCustomDepthChange = (event) => {
    setCustomDepth(event.target.value);
    setDimensions({
      ...dimensions,
      depth: event.target.value,
    });
  };
  // Add this function to handle edit button click
  const handleEditEntry = (index) => {
    const entryToEdit = entries[index];

    // Don't allow editing units, only parent components
    if (
      entryToEdit.isWardrobeUnit ||
      entryToEdit.isConsoleUnitComponent ||
      entryToEdit.isCrockeryUnitComponent ||
      entryToEdit.isShoeRackUnit
    ) {
      return;
    }

    // Set form values to match the selected component
    setSelectedComponent(entryToEdit.component);
    setDimensions({
      width: entryToEdit.dimensions.width,
      depth: entryToEdit.dimensions.depth,
      height: entryToEdit.dimensions.height,
    });

    // Set wardrobe depth options if editing a wardrobe
    if (entryToEdit.component === "Wardrobe") {
      const depth = entryToEdit.dimensions.depth;
      if (depth === "600") {
        setWardrobeDepthOption("600");
      } else if (depth === "400") {
        setWardrobeDepthOption("400");
      } else {
        setWardrobeDepthOption("custom");
        setCustomDepth(depth);
      }
    }
    setSelectedOptions(entryToEdit.options || "");
    setCarcassType(entryToEdit.carcassType || "");
    setFinish(entryToEdit.finish || "");
    setShutterMaterial(entryToEdit.shutterMaterial || "");
    setShutterFinish(entryToEdit.shutterFinish || "");
    setDrawerQuantity(entryToEdit.drawerQuantity || 1);
    setShelvesQuantity(entryToEdit.shelvesQuantity || 1);

    // Set editing state
    setIsEditing(true);
    setEditingIndex(index);

    // Scroll to form
    window.scrollTo(0, 0);
  };
  // Add these functions for modal control

  const handleOpenAccessoriesModal = (index) => {
    const selectedEntry = entries[index];

    if (!selectedEntry) {
      console.error("No component found at this index");
      return;
    }

    // Define a dynamic mapping for component names to their keys
    const componentMappings = {
      "Tv Unit": "tvUnits",
      Wardrobe: "wardrobes",
      "Console Unit": "consoleUnits",
      "Crockery Unit": "crockeryUnits",
      "Shoe Rack": "shoeRacks",
      "Storage Unit": "storageUnits",
      "Vanity Storage": "vanityStorage",
      "Mandir Unit": "mandirUnits",
      "Chest of Drawers": "chestofDrawers",
      Bed: "beds",
      "Study Table": "studyTables",
    };

    const componentTypeKey = componentMappings[selectedEntry.component];

    if (!componentTypeKey) {
      console.error("Unsupported component type:", selectedEntry.component);
      return;
    }

    // Extract the dynamic index key from the component type
    const componentIndexKey = `${componentTypeKey.slice(0, -1)}Index`; // Removing 's' from the end

    // Set the selected component index and type before opening the modal
    setSelectedComponentIndex(selectedEntry[componentIndexKey]);
    setSelectedComponentType(componentTypeKey);
    setAccessoriesModalOpen(true);
  };

  const handleCloseAccessoriesModal = () => {
    setAccessoriesModalOpen(false);
    setSelectedComponentIndex(null);
    setSelectedComponentType("");

    // Get the latest room data from the quotation in context
    const updatedRoomData = quotation?.rooms?.[roomIndex];

    if (updatedRoomData) {
      const newEntries = [...entries];

      // Find the correct component and update its accessories
      if (selectedComponentType && selectedComponentIndex !== null) {
        newEntries.forEach((entry) => {
          if (
            entry.component === selectedComponentType.replace(/s$/, "") &&
            entry[`${selectedComponentType.replace(/s$/, "")}Index`] ===
              selectedComponentIndex
          ) {
            // Update the accessories directly from the latest quotation data
            entry.accessories =
              updatedRoomData[selectedComponentType]?.[selectedComponentIndex]
                ?.accessories || [];
          }
        });
      }

      // Update the state to reflect the changes in the table
      setEntries(newEntries);
    }
  };

  const handleOpenUnitsModal = (wardrobeIndex) => {
    if (wardrobeIndex === undefined || wardrobeIndex === null) {
      // Show an error message
      console.log("Cannot define units: Wardrobe index is missing");
      setError("Cannot define units: Wardrobe index is missing");
      return;
    }
    setSelectedWardrobeIndex(wardrobeIndex);
    setUnitsModalOpen(true);
  };

  const handleCloseUnitsModal = async () => {
    setUnitsModalOpen(false);
    setSelectedWardrobeIndex(null);

    // Refresh quotation data when modal closes
    try {
      const response = await api.get(`/quotations/${quotationId}`);
      if (response.data && response.data.quotation) {
        setQuotation(response.data.quotation);
      }
    } catch (error) {
      console.error("Failed to refresh quotation data:", error);
      setError("Failed to refresh data after closing units modal");
    }
  };

  const handleOpenConsoleUnitsModal = (consoleUnitIndex) => {
    if (consoleUnitIndex === undefined || consoleUnitIndex === null) {
      console.log("Cannot define units: Console Unit index is missing");
      setError("Cannot define units: Console Unit index is missing");
      return;
    }
    setSelectedConsoleUnitIndex(consoleUnitIndex);
    setConsoleUnitsModalOpen(true);
  };

  const handleCloseConsoleUnitsModal = async () => {
    setConsoleUnitsModalOpen(false);
    setSelectedConsoleUnitIndex(null);

    // Refresh quotation data when modal closes
    try {
      const response = await api.get(`/quotations/${quotationId}`);
      if (response.data && response.data.quotation) {
        setQuotation(response.data.quotation);
      }
    } catch (error) {
      console.error("Failed to refresh quotation data:", error);
      setError("Failed to refresh data after closing units modal");
    }
  };

  const handleOpenCrockeryUnitsModal = (crockeryUnitIndex) => {
    if (crockeryUnitIndex === undefined || crockeryUnitIndex === null) {
      console.log("Cannot define units: Crockery Unit index is missing");
      setError("Cannot define units: Crockery Unit index is missing");
      return;
    }
    setSelectedCrockeryUnitIndex(crockeryUnitIndex);
    setCrockeryUnitsModalOpen(true);
  };

  const handleCloseCrockeryUnitsModal = async () => {
    setCrockeryUnitsModalOpen(false);
    setSelectedCrockeryUnitIndex(null);

    // Refresh quotation data when modal closes
    try {
      const response = await api.get(`/quotations/${quotationId}`);
      if (response.data && response.data.quotation) {
        setQuotation(response.data.quotation);
      }
    } catch (error) {
      console.error("Failed to refresh quotation data:", error);
      setError("Failed to refresh data after closing units modal");
    }
  };

  const handleOpenShoeRackUnitsModal = (shoeRackIndex) => {
    if (shoeRackIndex === undefined || shoeRackIndex === null) {
      console.log("Cannot define units: Shoe Rack index is missing");
      setError("Cannot define units: Shoe Rack index is missing");
      return;
    }
    setSelectedShoeRackIndex(shoeRackIndex);
    setShoeRackUnitsModalOpen(true);
  };

  const handleCloseShoeRackUnitsModal = async () => {
    setShoeRackUnitsModalOpen(false);
    setSelectedShoeRackIndex(null);

    // Refresh quotation data when modal closes
    try {
      const response = await api.get(`/quotations/${quotationId}`);
      if (response.data && response.data.quotation) {
        setQuotation(response.data.quotation);
      }
    } catch (error) {
      console.error("Failed to refresh quotation data:", error);
      setError("Failed to refresh data after closing units modal");
    }
  };

  // Load existing data from quotation when component mounts
  React.useEffect(() => {
    if (quotation?.rooms?.[roomIndex]) {
      const roomData = quotation.rooms[roomIndex];
      const newEntries = [];

      if (roomData.wardrobes && roomData.wardrobes.length > 0) {
        roomData.wardrobes.forEach((wardrobe, wardrobeIndex) => {
          // Create the main wardrobe entry
          const wardrobeEntry = {
            component: "Wardrobe",
            dimensions: wardrobe.measurements,
            carcassType: wardrobe.carcass?.type || "",
            finish: wardrobe.finish || "",
            shutterMaterial: wardrobe.shutter?.material || "",
            shutterFinish: wardrobe.shutter?.type || "",
            options: wardrobe.unitType || "",
            wardrobeIndex: Number(wardrobeIndex),
          };

          // Add wardrobe to entries
          newEntries.push(wardrobeEntry);

          // Add associated units if they exist
          if (wardrobe.units && wardrobe.units.length > 0) {
            wardrobe.units.forEach((unit) => {
              newEntries.push({
                component: `Wardrobe Unit (${wardrobe.measurements.width}x${wardrobe.measurements.height})`,
                dimensions: unit.measurements || {
                  width: "-",
                  height: "-",
                  depth: "-",
                },
                unitType: unit.unitType,
                finish: unit.finish,
                carcassType: unit.carcass?.type || "",
                drawerQuantity: unit.drawer?.quantity || 0,
                shelvesQuantity: unit.shelves?.quantity || 0,
                verticalLineQuantity: unit.verticalLine?.quantity || 0,
                totalPrice: unit.totalPrice,
                isWardrobeUnit: true,
                parentWardrobeIndex: wardrobeIndex,
                parentDescription: `For wardrobe ${wardrobe.measurements.width}x${wardrobe.measurements.height}`,
              });
            });
          }
        });
      }

      if (roomData.consoleUnits && roomData.consoleUnits.length > 0) {
        roomData.consoleUnits.forEach((consoleUnit, consoleUnitIndex) => {
          // Create the main console unit entry
          const consoleUnitEntry = {
            component: "Console Unit",
            dimensions: consoleUnit.measurements,
            carcassType: consoleUnit.carcass?.type || "",
            finish: consoleUnit.finish || "",
            shutterMaterial: consoleUnit.shutter?.material || "",
            shutterFinish: consoleUnit.shutter?.type || "",
            options: consoleUnit.unitType || "",
            consoleUnitIndex: Number(consoleUnitIndex),
          };

          // Add console unit to entries
          newEntries.push(consoleUnitEntry);

          // Add associated units if they exist
          if (consoleUnit.units && consoleUnit.units.length > 0) {
            consoleUnit.units.forEach((unit) => {
              newEntries.push({
                component: `Console Unit Component (${consoleUnit.measurements.width}x${consoleUnit.measurements.height})`,
                dimensions: unit.measurements || {
                  width: "-",
                  height: "-",
                  depth: "-",
                },
                unitType: unit.unitType,
                finish: unit.finish,
                carcassType: unit.carcass?.type || "",
                drawerQuantity: unit.drawer?.quantity || 0,
                shelvesQuantity: unit.shelves?.quantity || 0,
                verticalLineQuantity: unit.verticalLine?.quantity || 0,
                totalPrice: unit.totalPrice,
                isConsoleUnitComponent: true,
                parentConsoleUnitIndex: consoleUnitIndex,
                parentDescription: `For console unit ${consoleUnit.measurements.width}x${consoleUnit.measurements.height}`,
              });
            });
          }
        });
      }

      if (roomData.crockeryUnits && roomData.crockeryUnits.length > 0) {
        roomData.crockeryUnits.forEach((crockeryUnit, crockeryUnitIndex) => {
          // Create the main crockery unit entry
          const crockeryUnitEntry = {
            component: "Crockery Unit",
            dimensions: crockeryUnit.measurements,
            carcassType: crockeryUnit.carcass?.type || "",
            finish: crockeryUnit.finish || "",
            shutterMaterial: crockeryUnit.shutter?.material || "", // Always GLASS_PROFILE for crockery units
            shutterFinish: crockeryUnit.shutter?.type || "", // This comes from profileShutter.type
            options: crockeryUnit.unitType || "", // Always this type
            crockeryUnitIndex: Number(crockeryUnitIndex),
          };

          // Add crockery unit to entries
          newEntries.push(crockeryUnitEntry);

          // Add associated units if they exist
          if (crockeryUnit.units && crockeryUnit.units.length > 0) {
            crockeryUnit.units.forEach((unit) => {
              newEntries.push({
                component: `Crockery Unit Component (${crockeryUnit.measurements.width}x${crockeryUnit.measurements.height})`,
                dimensions: unit.measurements || {
                  width: "-",
                  height: "-",
                  depth: "-",
                },
                unitType: unit.unitType,
                finish: unit.finish,
                carcassType: unit.carcass?.type || "",
                drawerQuantity: unit.drawer?.quantity || 0,
                shelvesQuantity: unit.shelves?.quantity || 0,
                verticalLineQuantity: unit.verticalLine?.quantity || 0,
                totalPrice: unit.totalPrice,
                isCrockeryUnitComponent: true,
                parentCrockeryUnitIndex: crockeryUnitIndex,
                parentDescription: `For crockery unit ${crockeryUnit.measurements.width}x${crockeryUnit.measurements.height}`,
              });
            });
          }
        });
      }

      if (roomData.shoeRacks && roomData.shoeRacks.length > 0) {
        roomData.shoeRacks.forEach((shoeRack, shoeRackIndex) => {
          // Create the main shoe rack entry
          const shoeRackEntry = {
            component: "Shoe Rack",
            dimensions: shoeRack.measurements,
            carcassType: shoeRack.carcass?.type || "",
            finish: shoeRack.finish || "",
            shutterMaterial: shoeRack.shutter?.material || "",
            shutterFinish: shoeRack.shutter?.type || "",
            options: shoeRack.unitType || "",
            shelvesQuantity: shoeRack.shelves?.quantity || 0,
            shoeRackIndex: Number(shoeRackIndex),
          };

          // Add shoe rack to entries
          newEntries.push(shoeRackEntry);

          // Add associated units if they exist
          if (shoeRack.units && shoeRack.units.length > 0) {
            shoeRack.units.forEach((unit) => {
              newEntries.push({
                component: `Shoe Rack Unit (${shoeRack.measurements.width}x${shoeRack.measurements.height})`,
                dimensions: unit.measurements || {
                  width: "-",
                  height: "-",
                  depth: "-",
                },
                unitType: unit.unitType,
                finish: unit.finish,
                shelvesQuantity: unit.shelves?.quantity || 0,
                verticalLineQuantity: unit.verticalLine?.quantity || 0,
                totalPrice: unit.totalPrice,
                isShoeRackUnit: true,
                parentShoeRackIndex: shoeRackIndex,
                parentDescription: `For shoe rack ${shoeRack.measurements.width}x${shoeRack.measurements.height}`,
              });
            });
          }
        });
      }

      // Change from tvUnit to tvUnits (array)
      if (roomData.tvUnits && roomData.tvUnits.length > 0) {
        roomData.tvUnits.forEach((tvUnit, tvUnitIndex) => {
          newEntries.push({
            component: "Tv Unit",
            dimensions: tvUnit.measurements,
            unitType: tvUnit.unitType,
            finish: tvUnit.finish || "",
            carcassType: tvUnit.carcass?.type || "",
            shutterMaterial: tvUnit.shutter?.material || "",
            shutterFinish: tvUnit.shutter?.type || "",
            options: tvUnit.unitType || "",
            drawerQuantity: tvUnit.drawer?.quantity || 0,
            // Add shelves information
            shelvesRequired: tvUnit.shelves?.required || false,
            shelvesQuantity: tvUnit.shelves?.quantity || 0,
            tvUnitIndex: tvUnitIndex,
          });
        });
      }
      if (roomData.studyTables && roomData.studyTables.length > 0) {
        roomData.studyTables.forEach((studyTable, studyTableIndex) => {
          newEntries.push({
            component: "Study Table",
            dimensions: studyTable.measurements,
            unitType: studyTable.unitType,
            finish: studyTable.finish || "",
            carcassType: studyTable.carcass?.type || "",
            shutterMaterial: studyTable.shutter?.material || "",
            shutterFinish: studyTable.shutter?.type || "",
            options: studyTable.unitType || "",
            drawerQuantity: studyTable.drawer?.quantity || 0,
            shelvesRequired: studyTable.shelves?.required || false,
            shelvesQuantity: studyTable.shelves?.quantity || 0,
            studyTableIndex: studyTableIndex,
          });
        });
      }
      if (roomData.storageUnits && roomData.storageUnits.length > 0) {
        roomData.storageUnits.forEach((storageUnit, storageUnitIndex) => {
          newEntries.push({
            component: "Storage Unit",
            dimensions: storageUnit.measurements,
            unitType: storageUnit.unitType,
            finish: storageUnit.finish || "",
            carcassType: storageUnit.carcass?.type || "",
            shutterMaterial: storageUnit.shutter?.material || "",
            shutterFinish: storageUnit.shutter?.type || "",
            options: storageUnit.unitType || "",
            drawerQuantity: storageUnit.drawer?.quantity || 0,
            shelvesRequired: storageUnit.shelves?.required || false,
            shelvesQuantity: storageUnit.shelves?.quantity || 0,
            storageUnitIndex: storageUnitIndex,
          });
        });
      }
      if (roomData.fillerUnits && roomData.fillerUnits.length > 0) {
        roomData.fillerUnits.forEach((filler, fillerIndex) => {
          newEntries.push({
            component: "Filler",
            dimensions: filler.measurements,
            finish: filler.finish || "WHITE",
            shutterMaterial: filler.shutter?.material || "",
            shutterFinish: filler.shutter?.type || "",
            totalPrice: filler.totalPrice,
            fillerIndex: fillerIndex,
          });
        });
      }
      if (roomData.vanityStorage && roomData.vanityStorage.length > 0) {
        roomData.vanityStorage.forEach((vanityStorage, vanityStorageIndex) => {
          newEntries.push({
            component: "Vanity Storage",
            dimensions: vanityStorage.measurements,
            unitType: vanityStorage.unitType,
            finish: vanityStorage.finish || "",
            carcassType: vanityStorage.carcass?.type || "",
            shutterMaterial: vanityStorage.shutter?.material || "",
            shutterFinish: vanityStorage.shutter?.type || "",
            options: vanityStorage.unitType || "",
            drawerQuantity: vanityStorage.drawer?.quantity || 0,
            shelvesRequired: vanityStorage.shelves?.required || false,
            shelvesQuantity: vanityStorage.shelves?.quantity || 0,
            vanityStorageIndex: vanityStorageIndex,
          });
        });
      }
      if (roomData.mandirUnits && roomData.mandirUnits.length > 0) {
        roomData.mandirUnits.forEach((mandirUnit, mandirUnitIndex) => {
          newEntries.push({
            component: "Mandir Unit",
            dimensions: mandirUnit.measurements,
            unitType: mandirUnit.unitType,
            finish: mandirUnit.finish || "",
            carcassType: mandirUnit.carcass?.type || "",
            shutterMaterial: mandirUnit.shutter?.material || "",
            shutterFinish: mandirUnit.shutter?.type || "",
            options: mandirUnit.unitType || "",
            shelvesRequired: mandirUnit.shelves?.required || false,
            shelvesQuantity: mandirUnit.shelves?.quantity || 0,
            mandirUnitIndex: mandirUnitIndex,
          });
        });
      }
      if (roomData.beds && roomData.beds.length > 0) {
        roomData.beds.forEach((bed, bedIndex) => {
          newEntries.push({
            component: "Bed",
            dimensions: {
              width: bed.dimensions.width,
              depth: "-", // Beds typically don't have depth
              height: bed.dimensions.length, // Using length as height
            },
            options: bed.bedType,
            bedIndex: bedIndex,
            price: bed.price,
          });
        });
      }
      if (roomData.chestofDrawers && roomData.chestofDrawers.length > 0) {
        roomData.chestofDrawers.forEach((chestOfDrawer, chestOfDrawerIndex) => {
          newEntries.push({
            component: "Chest of Drawers",
            dimensions: chestOfDrawer.measurements,
            unitType: chestOfDrawer.unitType,
            finish: chestOfDrawer.finish || "",
            carcassType: chestOfDrawer.carcass?.type || "",
            shutterMaterial: chestOfDrawer.shutter?.material || "",
            shutterFinish: chestOfDrawer.shutter?.type || "",
            options: chestOfDrawer.unitType || "",
            drawerQuantity: chestOfDrawer.drawer?.quantity || 0,
            shelvesRequired: chestOfDrawer.shelves?.required || false,
            shelvesQuantity: chestOfDrawer.shelves?.quantity || 0,
            chestOfDrawerIndex: chestOfDrawerIndex,
          });
        });
      }
      // if (roomData.shoeRacks && roomData.shoeRacks.length > 0) {
      //   roomData.shoeRacks.forEach((shoeRack, shoeRackIndex) => {
      //     newEntries.push({
      //       component: "Shoe Rack",
      //       dimensions: shoeRack.measurements,
      //       unitType: shoeRack.unitType,
      //       finish: shoeRack.finish || "",
      //       carcassType: shoeRack.carcass?.type || "",
      //       shutterMaterial: shoeRack.shutter?.material || "",
      //       shutterFinish: shoeRack.shutter?.type || "",
      //       options: shoeRack.unitType || "",
      //       shelvesQuantity: shoeRack.shelves?.quantity || 0,
      //       shoeRackIndex: shoeRackIndex,
      //     });
      //   });
      // }

      // if (roomData.crockeryUnits && roomData.crockeryUnits.length > 0) {
      //   roomData.crockeryUnits.forEach((crockeryUnit, crockeryUnitIndex) => {
      //     newEntries.push({
      //       component: "Crockery Unit",
      //       dimensions: crockeryUnit.measurements,
      //       unitType: "CARCASS_WITH_PROFILE_SHUTTER",
      //       finish: crockeryUnit.finish || "",
      //       carcassType: crockeryUnit.carcass?.type || "",
      //       shutterMaterial: "GLASS_PROFILE", // Always GLASS_PROFILE for crockery units
      //       shutterFinish: crockeryUnit.profileShutter?.type || "", // This comes from profileShutter.type
      //       options: "CARCASS_WITH_PROFILE_SHUTTER", // Always this type
      //       shelvesRequired: crockeryUnit.shelves?.required || false,
      //       shelvesQuantity: crockeryUnit.shelves?.quantity || 0,
      //       crockeryUnitIndex: crockeryUnitIndex,
      //     });
      //   });
      // }

      if (roomData.customComponents) {
        roomData.customComponents.forEach((component) => {
          newEntries.push({
            component: component.name,
            dimensions: component.dimensions,
            material: component.material,
            finish: component.finish,
            additionalInfo: component.additionalInfo,
            carcassType: component?.carcassType || "",
            shutterMaterial: component?.shutterMaterial || "",
            shutterFinish: component?.shutterFinish || "",
            options: component.defineType || "",
            drawerQuantity: component?.drawerQuantity || 0,
            shelvesRequired: component?.shelvesRequired || false,
            shelvesQuantity: component?.shelvesQuantity || 0,
            isCustom: true,
            id: component._id, // Store ID for deletion reference
          });
        });
      }

      setEntries(newEntries);
    }
  }, [quotation, roomIndex]);

  const bedrooms = [
    { label: "Bed", value: "Bed" },
    { label: "Side Table", value: "Side Table" },
    { label: "Dresser Unit", value: "Dresser Unit" },
    { label: "Wardrobe", value: "Wardrobe" },
    { label: "Lofts", value: "Lofts" },
    { label: "Tv Unit", value: "Tv Unit" },
    { label: "Storage Unit", value: "Storage Unit" },
    { label: "Wooden Panel", value: "Wooden Panel" },
    { label: "Vanity Storage", value: "Vanity Storage" },
    { label: "Chest of Drawers", value: "Chest of Drawers" },
    { label: "Study Table", value: "Study Table" },
    { label: "Filler", value: "Filler" },
  ];

  const livingRooms = [
    { label: "TV Unit", value: "Tv Unit" },
    { label: "Storage Unit", value: "Storage Unit" },
    { label: "Wooden Panel", value: "Wooden Panel" },
    { label: "Crockery Unit", value: "Crockery Unit" },
    { label: "Shoe Rack", value: "Shoe Rack" },
    { label: "Console Unit", value: "Console Unit" },
    { label: "Chest of Drawers", value: "Chest of Drawers" },
    { label: "Vanity Storage", value: "Vanity Storage" },
    { label: "Mandir Unit", value: "Mandir Unit" },
    { label: "Study Table", value: "Study Table" },
    { label: "Filler", value: "Filler" },
  ];

  const customRooms = [
    { label: "Tv Unit", value: "Tv Unit" },
    { label: "Storage Unit", value: "Storage Unit" },
    { label: "Wooden Panel", value: "Wooden Panel" },
    { label: "Crockery Unit", value: "Crockery Unit" },
    { label: "Shoe Rack", value: "Shoe Rack" },
    { label: "Console Unit", value: "Console Unit" },
    { label: "Chest of Drawers", value: "Chest of Drawers" },
    { label: "Mandir Unit", value: "Mandir Unit" },
    { label: "Bed", value: "Bed" },
    { label: "Side Table", value: "Side Table" },
    { label: "Dresser Unit", value: "Dresser Unit" },
    { label: "Wardrobe", value: "Wardrobe" },
    { label: "Lofts", value: "Lofts" },
    { label: "Vanity Storage", value: "Vanity Storage" },
    { label: "Study Table", value: "Study Table" },
    { label: "Filler", value: "Filler" },
  ];

  const components =
    name === "Living Room"
      ? livingRooms
      : name === "Bedroom" || name === "Master Bedroom"
      ? bedrooms
      : customRooms;

  const options = [
    { label: "CARCASS_WITH_SHUTTERS", value: "CARCASS_WITH_SHUTTERS" },
    { label: "OPEN_UNIT", value: "OPEN_UNIT" },
    { label: "LEDGE", value: "LEDGE" },
    { label: "TV_PANEL", value: "TV_PANEL" },
    { label: "DRAWER", value: "DRAWER" },
    { label: "SHUTTER_WITH_SHELVES", value: "SHUTTER_WITH_SHELVES" },
    {
      label: "CARCASS_WITH_PROFILE_SHUTTER",
      value: "CARCASS_WITH_PROFILE_SHUTTER",
    },
  ];

  const bedTypes = [
    { label: "SINGLE_BED", value: "SINGLE_BED" },
    { label: "QUEEN_SIZE_BED", value: "QUEEN_SIZE_BED" },
    { label: "KING_SIZE_BED", value: "KING_SIZE_BED" },
    { label: "WALL_MOUNTED_SINGLE_BED", value: "WALL_MOUNTED_SINGLE_BED" },
    {
      label: "WALL_MOUNTED_SINGLE_BED_WITH_STORAGE",
      value: "WALL_MOUNTED_SINGLE_BED_WITH_STORAGE",
    },
    { label: "WALL_MOUNTED_QUEEN_BED", value: "WALL_MOUNTED_QUEEN_BED" },
    {
      label: "WALL_MOUNTED_QUEEN_BED_WITH_STORAGE",
      value: "WALL_MOUNTED_QUEEN_BED_WITH_STORAGE",
    },
  ];

  console.log("entries:", entries);

  const handleComponentChange = (event) => {
    setSelectedComponent(event.target.value);
    // Reset fields when component changes
    setDimensions({ width: "", depth: "", height: "" });
    setSelectedOptions("");
    setCarcassType("");
    setFinish("");
    setShutterMaterial("");
    setShutterFinish("");
    setWardrobeDepthOption("600"); // Reset to default
    setCustomDepth(""); // Reset custom depth
    setError("");
    setSuccess("");
  };

  const handleCustomComponentSaved = (customComponent) => {
    // Add the new custom component to entries
    setEntries([...entries, customComponent]);
    setSuccess(`${customComponent.component} saved successfully!`);
  };

  const handleDimensionChange = (event) => {
    setDimensions({ ...dimensions, [event.target.name]: event.target.value });
  };

  const handleOptionsChange = (event) => {
    setSelectedOptions(event.target.value);
  };

  const validateInputs = () => {
    // Validate dimensions
    if (
      selectedComponent !== "Bed" &&
      (!dimensions.width || !dimensions.depth || !dimensions.height)
    ) {
      setError("Please enter all dimensions");
      return false;
    }
    if (selectedComponent === "Bed") {
      if (!selectedOptions) {
        setError("Please select a bed type");
        return false;
      }
      return true; // Skip other validations for Bed
    }
    if (selectedComponent === "Shoe Rack") {
      // if (selectedOptions !== "SHUTTER_WITH_SHELVES") {
      //   setError("Only SHUTTER_WITH_SHELVES is supported for Shoe Rack");
      //   return false;
      // }

      if (!carcassType) {
        setError("For shutter with shelves, carcassType is required");
        return false;
      }

      if (!shutterMaterial) {
        setError("For shutter with shelves, shutterMaterial is required");
        return false;
      }

      if (shutterMaterial === "HDHMR" && !shutterFinish) {
        setError("For HDHMR material, shutterType is required");
        return false;
      }

      // if (!shelvesQuantity || shelvesQuantity <= 0) {
      //   setError(
      //     "For shutter with shelves, shelvesQuantity must be greater than 0"
      //   );
      //   return false;
      // }
    }
    // Different validation logic based on component type
    else if (
      selectedComponent === "Tv Unit" ||
      selectedComponent === "Storage Unit"
    ) {
      // TV Unit specific validation
      if (!selectedOptions) {
        setError("Please select a unit type");
        return false;
      }

      // For CARCASS_WITH_SHUTTERS, validate required fields
      if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType) {
          setError("For carcass with shutters, carcassType is required");
          return false;
        }

        if (!shutterMaterial) {
          setError("For carcass with shutters, shutterMaterial is required");
          return false;
        }

        if (shutterMaterial === "HDHMR" && !shutterFinish) {
          setError("For HDHMR material, shutterType is required");
          return false;
        }
      }
      // For OPEN_UNIT or LEDGE, validate required fields
      else if (selectedOptions === "OPEN_UNIT" || selectedOptions === "LEDGE") {
        if (!shutterMaterial) {
          setError(`For ${selectedOptions}, shutterMaterial is required`);
          return false;
        }

        if (shutterMaterial === "HDHMR" && !shutterFinish) {
          setError("For HDHMR material, shutterType is required");
          return false;
        }
      }
      // For DRAWER units, validate drawer quantity
      else if (selectedOptions === "DRAWER") {
        if (!drawerQuantity || drawerQuantity <= 0) {
          setError("For drawer units, valid drawerQuantity is required");
          return false;
        }

        if (!carcassType) {
          setError("For drawer units, carcassType is required");
          return false;
        }
      }

      // CARCASS_WITH_PROFILE_SHUTTER and TV_PANEL don't need additional validation
      // } else if (selectedComponent === "Filler") {
      //   if (!shutterMaterial) {
      //     setError("Shutter material is required for filler");
      //     return false;
      //   }

      //   if (shutterMaterial === "HDHMR" && !shutterFinish) {
      //     setError("Shutter finish is required for HDHMR material");
      //     return false;
      //   }

      //   // Validate dimensions
      //   const width = parseFloat(dimensions.width);
      //   if (isNaN(width) || width > 150) {
      //     setError("Filler width must be a number and not exceed 150mm");
      //     return false;
      //   }
      // } else if (selectedComponent === "Study Table") {
      // Study Table specific validation
      if (!selectedOptions) {
        setError("Please select a unit type");
        return false;
      }

      // For CARCASS_WITH_SHUTTERS, validate required fields
      if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
        if (!carcassType) {
          setError("For carcass with shutters, carcassType is required");
          return false;
        }

        if (!shutterMaterial) {
          setError("For carcass with shutters, shutterMaterial is required");
          return false;
        }

        if (shutterMaterial === "HDHMR" && !shutterFinish) {
          setError("For HDHMR material, shutterType is required");
          return false;
        }
      }
      // For OPEN_UNIT or LEDGE, validate required fields
      else if (selectedOptions === "OPEN_UNIT" || selectedOptions === "LEDGE") {
        if (!shutterMaterial) {
          setError(`For ${selectedOptions}, shutterMaterial is required`);
          return false;
        }

        if (shutterMaterial === "HDHMR" && !shutterFinish) {
          setError("For HDHMR material, shutterType is required");
          return false;
        }
      }
      // For DRAWER units, validate drawer quantity
      else if (selectedOptions === "DRAWER") {
        if (!drawerQuantity || drawerQuantity <= 0) {
          setError("For drawer units, valid drawerQuantity is required");
          return false;
        }

        if (!carcassType) {
          setError("For drawer units, carcassType is required");
          return false;
        }
      }
    } else if (
      selectedComponent === "Wardrobe" ||
      selectedComponent === "Crockery Unit" ||
      selectedComponent === "Console Unit" ||
      selectedComponent === "Shoe Rack"
    ) {
      // Wardrobe validation remains unchanged
      if (!carcassType) {
        setError("Please select a carcass type");
        return false;
      }

      if (!finish) {
        setError("Please select a finish");
        return false;
      }

      if (!shutterMaterial) {
        setError("Please select a shutter material");
        return false;
      }

      if (shutterMaterial === "HDHMR" && !shutterFinish) {
        setError("Please select a shutter finish");
        return false;
      }
    } else {
      // Generic validation for other components
      if (!selectedOptions) {
        setError("Please select a unit type");
        return false;
      }
    }

    return true;
  };

  const getEndpointAndPayload = () => {
    // Base payload structure for each component type
    let endpoint = "";
    let payload = {};

    // Common measurements for all components
    const measurements = {
      width: parseFloat(dimensions.width),
      depth: parseFloat(dimensions.depth),
      height: parseFloat(dimensions.height),
    };

    // Add component-specific fields and determine endpoint
    switch (selectedComponent) {
      case "Wardrobe":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe`;
        payload = {
          measurements,
          finish,
          carcassType,
          shutterMaterial,
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };
        break;

      case "Console Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/consoleUnit`;
        payload = {
          measurements,
          finish,
          carcassType,
          shutterMaterial,
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };
        break;

      case "Crockery Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/crockeryUnit`;
        payload = {
          measurements,
          finish,
          carcassType,
          shutterMaterial, // The API expects shutterMaterial and shutterType separately
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };

        // Add shelves if quantity is provided
        if (shelvesQuantity > 0) {
          payload.shelvesRequired = true;
          payload.shelvesQuantity = parseInt(shelvesQuantity);
        }
        break;

      case "Shoe Rack":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/shoeRack`;
        payload = {
          measurements,
          finish,
          carcassType,
          shutterMaterial,
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };

        // Add shelves if quantity is provided
        if (shelvesQuantity > 0) {
          payload.shelvesRequired = true;
          payload.shelvesQuantity = parseInt(shelvesQuantity);
        }
        break;

      case "Tv Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/tv-unit`;

        // Start with base required fields
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "CARCASS_WITH_PROFILE_SHUTTER") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "TV_PANEL") {
          // No additional fields required for TV panel
          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "DRAWER") {
          payload.carcassType = carcassType;
          payload.drawerQuantity = parseInt(drawerQuantity);
        }
        break;
      case "Study Table":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/study-table`;
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "CARCASS_WITH_PROFILE_SHUTTER") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "DRAWER") {
          payload.carcassType = carcassType;
          payload.drawerQuantity = parseInt(drawerQuantity);
        }
        break;
      case "Filler":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/filler`;
        payload = {
          measurements: {
            width: parseFloat(dimensions.width),
            height: parseFloat(dimensions.height),
            depth: parseFloat(dimensions.depth),
          },
          finish: finish || "WHITE",
          shutterMaterial,
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };
        break;
      case "Storage Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/storage-unit`;

        // Start with base required fields
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "DRAWER") {
          payload.carcassType = carcassType;
          payload.drawerQuantity = parseInt(drawerQuantity);
        }
        break;
      case "Vanity Storage":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/vanity-storage`;
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (selectedOptions === "DRAWER") {
          payload.carcassType = carcassType;
          payload.drawerQuantity = parseInt(drawerQuantity);
        }
        break;

      case "Mandir Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/mandir-unit`;

        // Start with base required fields
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        }
        break;
      case "Bed":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/bed`;
        payload = {
          bedType: selectedOptions, // We'll use selectedOptions for bed type
        };
        break;
      case "Chest of Drawers":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/chest-of-drawer`;
        payload = {
          measurements,
          unitType: selectedOptions,
          finish: finish || "WHITE", // Default to WHITE if not specified
        };

        // Add type-specific fields
        if (selectedOptions === "CARCASS_WITH_SHUTTERS") {
          payload.carcassType = carcassType;
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves if required
          if (shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        } else if (
          selectedOptions === "OPEN_UNIT" ||
          selectedOptions === "LEDGE"
        ) {
          payload.shutterMaterial = shutterMaterial;
          if (shutterMaterial === "HDHMR") {
            payload.shutterType = shutterFinish;
          }

          // Add shelves for OPEN_UNIT if required
          if (selectedOptions === "OPEN_UNIT" && shelvesQuantity > 0) {
            payload.shelvesRequired = true;
            payload.shelvesQuantity = parseInt(shelvesQuantity);
          }
        }
        break;
      // Other component cases remain unchanged
      case "Wooden Panel":
      case "Console Unit":
      case "Chest of Drawers":
      case "Vanity Storage":
      case "Mandir Unit":
      case "Bed":
      case "Side Table":
      case "Dresser Unit":
      case "Lofts":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/${selectedComponent
          .toLowerCase()
          .replace(" ", "-")}`;
        payload = {
          measurements,
          unitType: selectedOptions,
          finish,
          carcassType,
          shutterMaterial,
          ...(shutterMaterial === "HDHMR" && { shutterType: shutterFinish }),
        };
        break;

      default:
        setError(`No endpoint defined for ${selectedComponent}`);
        return null;
    }

    return { endpoint, payload };
  };
  const handleSave = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    // Get endpoint and payload
    const endpointInfo = getEndpointAndPayload();
    if (!endpointInfo) return;

    let { endpoint, payload } = endpointInfo;

    try {
      if (isEditing) {
        // Handle editing an existing component
        const entryToEdit = entries[editingIndex];

        // Modify endpoint for update based on component type and index
        if (entryToEdit.component === "Wardrobe") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe/${entryToEdit.wardrobeIndex}`;
        } else if (entryToEdit.component === "Console Unit") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/consoleUnit/${entryToEdit.consoleUnitIndex}`;
        } else if (entryToEdit.component === "Crockery Unit") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/crockeryUnit/${entryToEdit.crockeryUnitIndex}`;
        } else if (entryToEdit.component === "Shoe Rack") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/shoeRack/${entryToEdit.shoeRackIndex}`;
        } else if (entryToEdit.component === "Tv Unit") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/tv-unit/${entryToEdit.tvUnitIndex}`;
        } else if (entryToEdit.component === "Storage Unit") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/storage-unit/${entryToEdit.storageUnitIndex}`;
        } else if (entryToEdit.component === "Vanity Storage") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/vanity-storage/${entryToEdit.vanityStorageIndex}`;
        } else if (entryToEdit.component === "Mandir Unit") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/mandir-unit/${entryToEdit.mandirUnitIndex}`;
        } else if (entryToEdit.component === "Chest of Drawers") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/chest-of-drawer/${entryToEdit.chestOfDrawerIndex}`;
        } else if (entryToEdit.component === "Bed") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/bed/${entryToEdit.bedIndex}`;
        } else if (entryToEdit.component === "Study Table") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/study-table/${entryToEdit.studyTableIndex}`;
        } else if (entryToEdit.component === "Filler") {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/filler/${entryToEdit.fillerIndex}`;
        } else if (entryToEdit.isCustom) {
          endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/custom-component/${entryToEdit.id}`;
        }

        // Use PUT for update
        await api.put(endpoint, payload);

        // Update the entry in local state
        const updatedEntries = [...entries];
        updatedEntries[editingIndex] = {
          ...entryToEdit,
          dimensions: dimensions,
          options: selectedOptions,
          carcassType,
          finish,
          shutterMaterial,
          shutterFinish,
          drawerQuantity,
          shelvesQuantity,
        };

        setEntries(updatedEntries);
        setSuccess(`${selectedComponent} updated successfully!`);
      } else {
        // Original add functionality
        await api.put(endpoint, payload);
        await fetchQuotationById(quotationId);

        const newEntry = {
          component: selectedComponent,
          dimensions: dimensions,
          options: selectedOptions,
          carcassType,
          finish,
          shutterMaterial,
          shutterFinish,
        };

        if (selectedComponent === "Tv Unit") {
          if (selectedOptions === "DRAWER") {
            newEntry.drawerQuantity = drawerQuantity;
          } else if (selectedOptions === "OPEN_UNIT") {
            newEntry.shelvesQuantity = shelvesQuantity;
            newEntry.shelvesRequired = shelvesQuantity > 0;
          }
        }

        setEntries([...entries, newEntry]);
        setSuccess(`${selectedComponent} saved successfully!`);
      }

      // Reset form and editing state
      setSelectedComponent("");
      setDimensions({ width: "", depth: "", height: "" });
      setSelectedOptions("");
      setCarcassType("");
      setFinish("");
      setShutterMaterial("");
      setShutterFinish("");
      setIsEditing(false);
      setEditingIndex(null);
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      setError(
        `Failed to ${isEditing ? "update" : "save"}: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleCancelEdit = () => {
    // Reset form
    setSelectedComponent("");
    setDimensions({ width: "", depth: "", height: "" });
    setSelectedOptions("");
    setCarcassType("");
    setFinish("");
    setShutterMaterial("");
    setShutterFinish("");
    setDrawerQuantity(1);
    setShelvesQuantity(1);
    setWardrobeDepthOption("600"); // Reset to default
    setCustomDepth(""); // Reset custom depth

    // Reset editing state
    setIsEditing(false);
    setEditingIndex(null);
    setError("");
    setSuccess("");
  };

  const handleRemoveEntry = async (index) => {
    // Get the entry to be removed
    const entryToRemove = entries[index];

    // Check if it's a custom component
    if (entryToRemove.isCustom) {
      // Define the endpoint for custom component
      const endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/custom-component/${
        entryToRemove.id || entryToRemove.component
      }`;

      try {
        // Call DELETE on the appropriate endpoint
        await api.delete(endpoint);

        // Update local state after successful API call
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
        setSuccess(`${entryToRemove.component} removed successfully!`);
      } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        setError(
          `Failed to remove: ${error.response?.data?.message || error.message}`
        );
      }
      return;
    }

    // Original code for non-custom components
    // Determine the endpoint based on component
    let endpoint = "";
    switch (entryToRemove.component) {
      case "Wardrobe":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe/${entryToRemove.wardrobeIndex}`;
        break;
      case "Console Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/consoleUnit/${entryToRemove.consoleUnitIndex}`;
        break;
      case "Crockery Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/crockeryUnit/${entryToRemove.crockeryUnitIndex}`;
        break;
      case "Shoe Rack":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/shoeRack/${entryToRemove.shoeRackIndex}`;
        break;
      case "Tv Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/tv-unit/${entryToRemove.tvUnitIndex}`;
        break;
      case "Study Table":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/study-table/${entryToRemove.studyTableIndex}`;
        break;
      case "Storage Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/storage-unit/${entryToRemove.storageUnitIndex}`;
        break;
      case "Vanity Storage":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/vanity-storage/${entryToRemove.vanityStorageIndex}`;
        break;
      case "Mandir Unit":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/mandir-unit/${entryToRemove.mandirUnitIndex}`;
        break;
      case "Chest of Drawers":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/chest-of-drawer/${entryToRemove.chestOfDrawerIndex}`;
        break;
      case "Bed":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/bed/${entryToRemove.bedIndex}`;
        break;
      case "Filler":
        endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/filler/${entryToRemove.fillerIndex}`;
        break;
      // Add cases for other components as needed
      default:
        // If no specific endpoint, just remove from local state
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
        return;
    }

    try {
      // Call DELETE on the appropriate endpoint
      await api.delete(endpoint);

      // Update local state after successful API call
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
      setSuccess(`${entryToRemove.component} removed successfully!`);
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      setError(
        `Failed to remove: ${error.response?.data?.message || error.message}`
      );
    }
  };

  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2} alignItems="center">
        {/* Component Dropdown */}
        <Grid item md={2}>
          <TextField
            select
            sx={{ marginTop: 2.4 }}
            label="Select Component"
            variant="outlined"
            size="small"
            fullWidth
            value={selectedComponent}
            onChange={handleComponentChange}
          >
            <MenuItem value="">Select Component</MenuItem>
            {components.map((component) => (
              <MenuItem key={component.value} value={component.value}>
                {component.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Only show bed type field when Bed is selected */}
        {selectedComponent === "Bed" && (
          <Grid item md={1.5}>
            <FormControl sx={{ marginTop: 2.4 }} fullWidth size="small">
              <InputLabel id="bed-type-label">Bed Type</InputLabel>
              <Select
                labelId="bed-type-label"
                id="bed-type"
                value={selectedOptions}
                onChange={handleOptionsChange}
                input={<OutlinedInput label="Bed Type" />}
              >
                <MenuItem value="">Select Bed Type</MenuItem>
                {bedTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {selectedComponent === "Wardrobe" && (
          <>
            <Grid item md={1.5}>
              <FormControl sx={{ marginTop: 2.4 }} fullWidth size="small">
                <InputLabel id="wardrobe-depth-label">
                  Wardrobe Depth
                </InputLabel>
                <Select
                  labelId="wardrobe-depth-label"
                  id="wardrobe-depth"
                  value={wardrobeDepthOption}
                  onChange={handleWardrobeDepthChange}
                  input={<OutlinedInput label="Wardrobe Depth" />}
                >
                  <MenuItem value="600">600mm</MenuItem>
                  <MenuItem value="400">400mm</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {wardrobeDepthOption === "custom" && (
              <Grid item md={1.5}>
                <TextField
                  sx={{ marginTop: 2.4 }}
                  label="Custom Depth (mm)"
                  type="number"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={customDepth}
                  onChange={handleCustomDepthChange}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            )}
          </>
        )}

        {/* Show other fields for non-Bed components */}
        {selectedComponent && selectedComponent !== "Bed" && (
          <>
            {![
              "Wardrobe",
              "Shoe Rack",
              "Console Unit",
              "Crockery Unit",
            ].includes(selectedComponent) && (
              <Grid item md={1.5}>
                <FormControl sx={{ marginTop: 2.4 }} fullWidth size="small">
                  <InputLabel id="Define-Type-label">Define Type</InputLabel>
                  <Select
                    labelId="Define-Type-label"
                    id="Define-Type"
                    value={selectedOptions}
                    onChange={handleOptionsChange}
                    input={<OutlinedInput label="Define Type" />}
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {selectedComponent === "Tv Unit" &&
              selectedOptions === "DRAWER" && (
                <Grid item md={1.5}>
                  <TextField
                    sx={{ marginTop: 2.4 }}
                    label="Drawer Quantity"
                    type="number"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={drawerQuantity}
                    onChange={(e) => setDrawerQuantity(e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              )}

            {(selectedComponent === "Tv Unit" ||
              selectedComponent === "Shoe Rack") &&
              (selectedOptions === "OPEN_UNIT" ||
                selectedOptions === "CARCASS_WITH_SHUTTERS" ||
                selectedOptions === "SHUTTER_WITH_SHELVES" ||
                selectedOptions === "CARCASS_WITH_PROFILE_SHUTTER") && (
                <Grid item md={1.5}>
                  <TextField
                    sx={{ marginTop: 2.4 }}
                    label="Shelves Quantity"
                    type="number"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={shelvesQuantity}
                    onChange={(e) => setShelvesQuantity(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              )}

            {/* Dimensions Inputs - hide for Bed */}
            {selectedComponent !== "Bed" && (
              <Grid item md={4}>
                <Grid container spacing={2}>
                  {["width", "height"].map((dim) => (
                    <Grid
                      item
                      xs={selectedComponent === "Wardrobe" ? 6 : 4}
                      key={dim}
                    >
                      <TextField
                        fullWidth
                        sx={{ marginTop: 2.4 }}
                        label={dim.charAt(0).toUpperCase() + dim.slice(1)}
                        type="number"
                        size="small"
                        variant="outlined"
                        name={dim}
                        value={dimensions[dim]}
                        onChange={handleDimensionChange}
                      />
                    </Grid>
                  ))}
                  {/* Only show depth input for non-Wardrobe components */}
                  {selectedComponent !== "Wardrobe" && (
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        sx={{ marginTop: 2.4 }}
                        label="Depth"
                        type="number"
                        size="small"
                        variant="outlined"
                        name="depth"
                        value={dimensions.depth}
                        onChange={handleDimensionChange}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}

            {/* Component-Specific Dropdowns - hide for Bed */}
            {selectedComponent !== "Bed" && selectedOptions !== "TV_PANEL" && (
              <>
                {selectedOptions !== "OPEN_UNIT" && (
                  <Grid item md={1}>
                    <TextField
                      select
                      sx={{ marginTop: 2.4 }}
                      label="Carcass Type"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={carcassType}
                      onChange={(e) => setCarcassType(e.target.value)}
                    >
                      <MenuItem value="">Select Carcass Type</MenuItem>
                      {RoomPricing?.carcass?.map((carcass) => (
                        <MenuItem key={carcass} value={carcass}>
                          {carcass}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                {selectedOptions !== "OPEN_UNIT" && (
                  <Grid item md={1}>
                    <TextField
                      sx={{ marginTop: 2.4 }}
                      select
                      label="Finish"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                    >
                      <MenuItem value="">Select Finish</MenuItem>
                      {RoomPricing?.finishs?.map((finish) => (
                        <MenuItem key={finish} value={finish}>
                          {finish}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                <Grid item md={1}>
                  <TextField
                    select
                    label={
                      selectedOptions === "OPEN_UNIT"
                        ? "Finish"
                        : "Shutter Material"
                    }
                    sx={{ marginTop: 2.4 }}
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={shutterMaterial}
                    onChange={(e) => {
                      setShutterMaterial(e.target.value);
                      setShutterFinish("");
                    }}
                  >
                    <MenuItem value="">
                      {selectedOptions === "OPEN_UNIT"
                        ? "Select Finish"
                        : "Select Shutter Material"}
                    </MenuItem>
                    {Object.keys(RoomPricing?.shutters || {}).map(
                      (material) => (
                        <MenuItem key={material} value={material}>
                          {material}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                </Grid>

                {shutterMaterial === "HDHMR" && (
                  <Grid item md={1}>
                    <TextField
                      select
                      sx={{ marginTop: 2.4 }}
                      label={
                        selectedOptions === "OPEN_UNIT"
                          ? "Finish Type"
                          : "Shutter Finish"
                      }
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={shutterFinish}
                      onChange={(e) => setShutterFinish(e.target.value)}
                    >
                      <MenuItem value="">
                        {selectedOptions === "OPEN_UNIT"
                          ? "Select Finish Type"
                          : "Select Shutter Finish"}
                      </MenuItem>
                      {shutterMaterial &&
                        RoomPricing?.shutters[shutterMaterial]?.map(
                          (finish) => (
                            <MenuItem key={finish} value={finish}>
                              {finish}
                            </MenuItem>
                          )
                        )}
                    </TextField>
                  </Grid>
                )}
                {shutterMaterial === "GLASS_PROFILE" && (
                  <Grid item md={1}>
                    <TextField
                      select
                      sx={{ marginTop: 2.4 }}
                      label={
                        selectedOptions === "OPEN_UNIT"
                          ? "Finish Type"
                          : "Shutter Finish"
                      }
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={shutterFinish}
                      onChange={(e) => setShutterFinish(e.target.value)}
                    >
                      <MenuItem value="">
                        {selectedOptions === "OPEN_UNIT"
                          ? "Select Finish Type"
                          : "Select Shutter Finish"}
                      </MenuItem>
                      {shutterMaterial &&
                        RoomPricing?.shutters[shutterMaterial]?.map(
                          (finish) => (
                            <MenuItem key={finish} value={finish}>
                              {finish}
                            </MenuItem>
                          )
                        )}
                    </TextField>
                  </Grid>
                )}
              </>
            )}
          </>
        )}
      </Grid>

      {selectedComponent && (
        <div>
          <Button
            sx={{ marginTop: 2, marginRight: 2 }}
            variant="contained"
            color="primary"
            onClick={handleSave}
          >
            {isEditing ? "Update" : "Add"}
          </Button>

          {isEditing && (
            <Button
              sx={{ marginTop: 2 }}
              variant="outlined"
              color="secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      <CustomComponentForm
        roomIndex={roomIndex}
        name={name}
        onComponentSaved={handleCustomComponentSaved}
      />

      <>
        {entries.length === 0 ? (
          ""
        ) : (
          <div className="w-full mt-5 overflow-x-auto rounded-lg shadow border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300"></tr>
                <tr>
                  {/* Main Categories */}
                  <th className="p-3 text-left font-semibold text-gray-700 border border-gray-300">
                    Unit Details
                  </th>
                  <th
                    colSpan={3}
                    className="p-3 text-left font-semibold text-gray-700 border border-gray-300"
                  >
                    Dimensions
                  </th>
                  <th
                    colSpan={2}
                    className="p-3 text-left font-semibold text-gray-700 border border-gray-300"
                  >
                    Specifications
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-700 border border-gray-300">
                    Actions
                  </th>
                </tr>
                <tr>
                  {/* Sub Categories */}
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Component Type
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Width
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Depth
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Height
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Material Details
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Additional Info
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Controls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entries.map((entry, index) => {
                  // Skip rendering unit components in the main list
                  if (
                    entry.isWardrobeUnit ||
                    entry.isConsoleUnitComponent ||
                    entry.isCrockeryUnitComponent ||
                    entry.isShoeRackUnit
                  ) {
                    return null;
                  }

                  return (
                    <React.Fragment key={index}>
                      <tr className="bg-white hover:bg-gray-50">
                        {/* Component Type */}
                        <td className="p-2 text-sm border border-gray-300">
                          <div className="font-medium">
                            {entry.component}
                            {entry.isCustom && (
                              <span className="inline-block ms-2 px-2 py-1 text-xs bg-blue-200 text-black rounded-full">
                                Custom
                              </span>
                            )}
                          </div>

                          {entry.options && (
                            <div className="text-xs text-gray-500 mt-1">
                              Type: {entry.options}
                            </div>
                          )}
                        </td>

                        {/* Dimensions */}
                        {entry.component === "Bed" ? (
                          <>
                            <td className="p-2 text-sm border border-gray-300">
                              {entry.dimensions.width}
                            </td>
                            <td className="p-2 text-sm border border-gray-300">
                              -
                            </td>
                            <td className="p-2 text-sm border border-gray-300">
                              {entry.dimensions.height}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-sm border border-gray-300">
                              {entry.dimensions.width}
                            </td>
                            <td className="p-2 text-sm border border-gray-300">
                              {entry.dimensions.depth}
                            </td>
                            <td className="p-2 text-sm border border-gray-300">
                              {entry.dimensions.height}
                            </td>
                          </>
                        )}

                        {/* Material Details */}
                        <td className="p-2 text-sm border border-gray-300">
                          <div className="space-y-1">
                            {entry.carcassType && (
                              <div className="flex gap-2">
                                <span className="font-medium">Carcass:</span>
                                {entry.carcassType}
                              </div>
                            )}
                            {entry.finish && (
                              <div className="flex gap-2">
                                <span className="font-medium">Finish:</span>
                                {entry.finish}
                              </div>
                            )}
                            {entry.shutterMaterial && (
                              <div className="flex gap-2">
                                <span className="font-medium">Shutter:</span>
                                {entry.shutterMaterial}
                              </div>
                            )}
                            {entry.shutterFinish && (
                              <div className="flex gap-2">
                                <span className="font-medium">
                                  Shutter Finish:
                                </span>
                                {entry.shutterFinish}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Additional Details */}
                        <td className="p-2 text-sm border border-gray-300">
                          <div className="space-y-1">
                            {entry.drawerQuantity > 0 && (
                              <div className="flex gap-2">
                                <span className="font-medium">Drawers:</span>
                                {entry.drawerQuantity}
                              </div>
                            )}
                            {entry.shelvesQuantity > 0 && (
                              <div className="flex gap-2">
                                <span className="font-medium">Shelves:</span>
                                {entry.shelvesQuantity}
                              </div>
                            )}
                            {entry.material && (
                              <div className="flex gap-2">
                                <span className="font-medium">Material:</span>
                                {entry.material}
                              </div>
                            )}
                            {entry.additionalInfo && (
                              <div className="text-xs text-gray-500 mt-1">
                                {entry.additionalInfo}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-sm border border-gray-300">
                          <div className="flex space-x-2">
                            {/* Toggle Units Button for the 4 special components */}
                            {(entry.component === "Wardrobe" ||
                              entry.component === "Console Unit" ||
                              entry.component === "Crockery Unit" ||
                              entry.component === "Shoe Rack") && (
                              <button
                                onClick={() => {
                                  setExpandedUnits((prev) =>
                                    prev === index ? null : index
                                  );
                                }}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                                aria-label="toggle-units"
                              >
                                <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
                                  {expandedUnits === index
                                    ? "Hide Units"
                                    : "Show Units"}
                                </span>
                              </button>
                            )}

                            {/* Define Units Button (original functionality) */}
                            {(entry.component === "Wardrobe" ||
                              entry.component === "Console Unit" ||
                              entry.component === "Crockery Unit" ||
                              entry.component === "Shoe Rack") && (
                              <button
                                onClick={() => {
                                  if (entry.component === "Wardrobe") {
                                    handleOpenUnitsModal(entry.wardrobeIndex);
                                  } else if (
                                    entry.component === "Console Unit"
                                  ) {
                                    handleOpenConsoleUnitsModal(
                                      entry.consoleUnitIndex
                                    );
                                  } else if (
                                    entry.component === "Crockery Unit"
                                  ) {
                                    handleOpenCrockeryUnitsModal(
                                      entry.crockeryUnitIndex
                                    );
                                  } else if (entry.component === "Shoe Rack") {
                                    handleOpenShoeRackUnitsModal(
                                      entry.shoeRackIndex
                                    );
                                  }
                                }}
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                                aria-label="define"
                              >
                                <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
                                  Define
                                </span>
                              </button>
                            )}

                            {/* Accessories button for main components only */}
                            <button
                              onClick={() => handleOpenAccessoriesModal(index)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                              aria-label="accessories"
                            >
                              <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
                                Accessories
                              </span>
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleEditEntry(index)}
                              className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full transition-colors"
                              aria-label="edit"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveEntry(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                              aria-label="delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Units Section */}
                      {expandedUnits === index && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-gray-50 border-t border-b border-gray-200 p-3">
                              <h4 className="font-medium text-gray-700 mb-2">
                                {entry.component} Units
                              </h4>
                              <div className="overflow-x-auto rounded border border-gray-300">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Unit Type
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Width
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Depth
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Height
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Material Details
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Additional Info
                                      </th>
                                      <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-100">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entries
                                      .filter((unit) => {
                                        if (
                                          entry.component === "Wardrobe" &&
                                          unit.isWardrobeUnit
                                        ) {
                                          return (
                                            unit.parentWardrobeIndex ===
                                            entry.wardrobeIndex
                                          );
                                        } else if (
                                          entry.component === "Console Unit" &&
                                          unit.isConsoleUnitComponent
                                        ) {
                                          return (
                                            unit.parentConsoleUnitIndex ===
                                            entry.consoleUnitIndex
                                          );
                                        } else if (
                                          entry.component === "Crockery Unit" &&
                                          unit.isCrockeryUnitComponent
                                        ) {
                                          return (
                                            unit.parentCrockeryUnitIndex ===
                                            entry.crockeryUnitIndex
                                          );
                                        } else if (
                                          entry.component === "Shoe Rack" &&
                                          unit.isShoeRackUnit
                                        ) {
                                          return (
                                            unit.parentShoeRackIndex ===
                                            entry.shoeRackIndex
                                          );
                                        }
                                        return false;
                                      })
                                      .map((unit, unitIdx) => {
                                        // Find the actual index in the entries array for edit/delete operations
                                        const unitEntryIndex =
                                          entries.findIndex((e) => e === unit);

                                        return (
                                          <tr
                                            key={`unit-${unitIdx}`}
                                            className="bg-white hover:bg-gray-50"
                                          >
                                            {/* Unit Type */}
                                            <td className="p-2 text-sm border border-gray-300">
                                              <div className="font-medium">
                                                {unit.unitType}
                                                <span className="inline-block ms-2 px-2 py-1 text-xs bg-green-200 text-black rounded-full">
                                                  Unit
                                                </span>
                                              </div>
                                              {unit.parentDescription && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {unit.parentDescription}
                                                </div>
                                              )}
                                            </td>

                                            {/* Dimensions */}
                                            <td className="p-2 text-sm border border-gray-300">
                                              {unit.dimensions.width}
                                            </td>
                                            <td className="p-2 text-sm border border-gray-300">
                                              {unit.dimensions.depth}
                                            </td>
                                            <td className="p-2 text-sm border border-gray-300">
                                              {unit.dimensions.height}
                                            </td>

                                            {/* Material Details */}
                                            <td className="p-2 text-sm border border-gray-300">
                                              <div className="space-y-1">
                                                {unit.carcassType && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Carcass:
                                                    </span>
                                                    {unit.carcassType}
                                                  </div>
                                                )}
                                                {unit.finish && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Finish:
                                                    </span>
                                                    {unit.finish}
                                                  </div>
                                                )}
                                                {unit.shutterMaterial && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Shutter:
                                                    </span>
                                                    {unit.shutterMaterial}
                                                  </div>
                                                )}
                                                {unit.shutterFinish && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Shutter Finish:
                                                    </span>
                                                    {unit.shutterFinish}
                                                  </div>
                                                )}
                                              </div>
                                            </td>

                                            {/* Additional Info */}
                                            <td className="p-2 text-sm border border-gray-300">
                                              <div className="space-y-1">
                                                {unit.drawerQuantity > 0 && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Drawers:
                                                    </span>
                                                    {unit.drawerQuantity}
                                                  </div>
                                                )}
                                                {unit.shelvesQuantity > 0 && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Shelves:
                                                    </span>
                                                    {unit.shelvesQuantity}
                                                  </div>
                                                )}
                                                {unit.material && (
                                                  <div className="flex gap-2">
                                                    <span className="font-medium">
                                                      Material:
                                                    </span>
                                                    {unit.material}
                                                  </div>
                                                )}
                                                {unit.additionalInfo && (
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    {unit.additionalInfo}
                                                  </div>
                                                )}
                                              </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-2 text-sm border border-gray-300">
                                              <div className="flex space-x-2">
                                                {/* Edit button
                                                <button
                                                  onClick={() =>
                                                    handleEditEntry(
                                                      unitEntryIndex
                                                    )
                                                  }
                                                  className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full transition-colors"
                                                  aria-label="edit"
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                  >
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                  </svg>
                                                </button> */}

                                                {/* Delete button */}
                                                <button
                                                  onClick={() =>
                                                    handleRemoveEntry(
                                                      unitEntryIndex
                                                    )
                                                  }
                                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                                                  aria-label="delete"
                                                >
                                                  <TrashIcon className="w-5 h-5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>

                                {entries.filter((unit) => {
                                  if (
                                    entry.component === "Wardrobe" &&
                                    unit.isWardrobeUnit
                                  ) {
                                    return (
                                      unit.parentWardrobeIndex ===
                                      entry.wardrobeIndex
                                    );
                                  } else if (
                                    entry.component === "Console Unit" &&
                                    unit.isConsoleUnitComponent
                                  ) {
                                    return (
                                      unit.parentConsoleUnitIndex ===
                                      entry.consoleUnitIndex
                                    );
                                  } else if (
                                    entry.component === "Crockery Unit" &&
                                    unit.isCrockeryUnitComponent
                                  ) {
                                    return (
                                      unit.parentCrockeryUnitIndex ===
                                      entry.crockeryUnitIndex
                                    );
                                  } else if (
                                    entry.component === "Shoe Rack" &&
                                    unit.isShoeRackUnit
                                  ) {
                                    return (
                                      unit.parentShoeRackIndex ===
                                      entry.shoeRackIndex
                                    );
                                  }
                                  return false;
                                }).length === 0 && (
                                  <div className="p-4 text-center text-gray-500">
                                    No units defined yet. Click "Define" to add
                                    units.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Accessories Section (unchanged) */}
                      {entry.accessories && entry.accessories.length > 0 && (
                        <tr>
                          <td colSpan={7}>
                            <TableContainer component={Paper}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Dimension</TableCell>
                                    <TableCell>Finish</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {entry.accessories.map((accessory, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{accessory.type}</TableCell>
                                      <TableCell>
                                        {accessory.dimension}
                                      </TableCell>
                                      <TableCell>{accessory.finish}</TableCell>
                                      <TableCell>
                                        {accessory.quantity}
                                      </TableCell>
                                      <TableCell>
                                        {accessory.totalPrice}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {entries.length === 0 && (
              <div className="p-4 text-center text-gray-500 border-t border-gray-300">
                No entries found
              </div>
            )}
          </div>
        )}
      </>
      {/* Wardrobe Units Modal */}
      <WardrobeUnitsModal
        open={unitsModalOpen}
        onClose={handleCloseUnitsModal}
        quotationId={quotationId}
        roomIndex={roomIndex}
        wardrobeIndex={selectedWardrobeIndex}
        onUnitAdded={async () => {
          try {
            // Fetch the latest quotation data
            await fetchQuotationById(quotationId);
          } catch (error) {
            console.error("Failed to refresh quotation data:", error);
            setError("Failed to refresh data after adding unit");
          }
        }}
      />

      <ConsoleUnitsModal
        open={consoleUnitsModalOpen}
        onClose={handleCloseConsoleUnitsModal}
        quotationId={quotationId}
        roomIndex={roomIndex}
        consoleUnitIndex={selectedConsoleUnitIndex}
        onUnitAdded={async () => {
          try {
            // Fetch the latest quotation data
            await fetchQuotationById(quotationId);
          } catch (error) {
            console.error("Failed to refresh quotation data:", error);
            setError("Failed to refresh data after adding unit");
          }
        }}
      />
      <CrockeryUnitsModal
        open={crockeryUnitsModalOpen}
        onClose={handleCloseCrockeryUnitsModal}
        quotationId={quotationId}
        roomIndex={roomIndex}
        crockeryUnitIndex={selectedCrockeryUnitIndex}
        onUnitAdded={async () => {
          try {
            // Fetch the latest quotation data
            await fetchQuotationById(quotationId);
          } catch (error) {
            console.error("Failed to refresh quotation data:", error);
            setError("Failed to refresh data after adding unit");
          }
        }}
      />
      <ShoeRackUnitsModal
        open={shoeRackUnitsModalOpen}
        onClose={handleCloseShoeRackUnitsModal}
        quotationId={quotationId}
        roomIndex={roomIndex}
        shoeRackIndex={selectedShoeRackIndex}
        onUnitAdded={async () => {
          try {
            // Fetch the latest quotation data
            await fetchQuotationById(quotationId);
          } catch (error) {
            console.error("Failed to refresh quotation data:", error);
            setError("Failed to refresh data after adding unit");
          }
        }}
      />
      <AccessoriesModal
        open={accessoriesModalOpen}
        onClose={handleCloseAccessoriesModal}
        quotationId={quotationId}
        roomIndex={roomIndex}
        componentType={selectedComponentType}
        componentIndex={selectedComponentIndex}
      />
    </Box>
  );
};

export default RoomMeasurements;
