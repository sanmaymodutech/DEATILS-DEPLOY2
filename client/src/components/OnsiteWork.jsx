import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";

// Constants definition - structured for better organization and clarity
const ONSITE_WORK_CONFIG = {
  CATEGORIES: {
    PAINTING: "Painting",
    FALSE_CEILING: "False ceiling",
    CARPENTRY: "Carpentry",
    ELECTRICAL: "Electrical",
    CIVIL: "Civil",
  },
  SERVICES: {
    Painting: {
      // For Painting, we need a different structure to handle the interior/exterior subtypes
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
    "False ceiling": {
      FC_LOCAL: { name: "FC Local", rate: 60, unit: "HxW" },
      FC_OMAN: { name: "FC Oman", rate: 70, unit: "HxW" },
      FC_SAINT_GOBAIN: { name: "FC Saint Gobain", rate: 95, unit: "HxW" },
      COVE: { name: "Cove", rate: 70, unit: "H / RFT" },
      POP_PARTITION: { name: "POP Partition", rate: 80, unit: "HxW" },
    },
    Carpentry: {
      WALL_PANEL: { name: "Wall Panel", rate: 450, unit: "HxW" },
      MIRROR_PANEL: { name: "Mirror Panel", rate: 700, unit: "HxW" },
      SAFETY_DOOR: { name: "Safety Door", rate: 25000, unit: "Quantity Count" },
      AC_PELMETS: { name: "AC Pelmets", rate: 400, unit: "HxW" },
      STORAGE: { name: "Storage", rate: 750, unit: "HxW" },
      CEMENT_SHEET: { name: "Cement sheet", rate: 550, unit: "HxW" },
    },
    Electrical: {
      AMP_5_NEW: { name: "5 AMP New", rate: 800, unit: "Quantity Count" },
      AMP_5_RL: { name: "5 AMP RL", rate: 500, unit: "Quantity Count" },
      AMP_12: { name: "12 AMP", rate: 1100, unit: "Quantity Count" },
      AMP_16: { name: "16 AMP", rate: 1300, unit: "Quantity Count" },
      CAD_6: { name: "CAD 6", rate: 2500, unit: "Quantity Count" },
      HDMI_10M: { name: "HDMI 10Mtrs", rate: 10000, unit: "Quantity Count" },
      CCTV: { name: "CCTV", rate: 0, unit: "Quantity Count" },
    },
    Civil: {
      WALL_BREAKING: { name: "Wall Breaking", rate: 80, unit: "HxW" },
      WALL_MAKING: { name: "Wall Making", rate: 100, unit: "HxW" },
      COUNTER_TOP_BREAKING: {
        name: "Counter top Breaking",
        rate: 100,
        unit: "HxW",
      },
      COUNTER_TOP_MAKING: {
        name: "Counter top Making",
        rate: 120,
        unit: "HxW",
      },
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
  },
};

// Initial form state
const initialFormState = {
  room: "",
  category: "",
  serviceGroup: "", // For Painting (INTERIOR/EXTERIOR)
  service: "",
  height: "",
  width: "",
  length: "", // For services that require length (like Cove)
  quantity: "",
  errors: {}, // Field-specific error messages
};

const OnsiteWork = () => {
  const { quotation, expanded, setExpanded } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
  const [onsiteWorkEntries, setOnsiteWorkEntries] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

  // Load saved onsite work when component mounts or quotation changes
  useEffect(() => {
    if (quotation && quotation._id) {
      loadOnsiteWorkData();
    }
  }, [quotation]);

  // Function to fetch onsite work data from API
  const loadOnsiteWorkData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/quotation/onsite-work/${quotation._id}/onsite-work`
      );

      if (response.data.success && response.data.data.onsiteWorkByRoom) {
        // Convert API data format to component state format
        const entries = [];
        const onsiteWorkByRoom = response.data.data.onsiteWorkByRoom;

        Object.entries(onsiteWorkByRoom).forEach(([roomType, works]) => {
          works.forEach((work) => {
            entries.push({
              room: roomType,
              category: work.category,
              service: work.service.name,
              serviceKey: getServiceKeyFromName(work.category, work.service),
              serviceGroup: work.service.type, // For painting (INTERIOR/EXTERIOR)
              dimensions: work.dimensions || { height: "", width: "" },
              quantity: work.quantity || "",
              price: work.price,
            });
          });
        });

        setOnsiteWorkEntries(entries);
      }
    } catch (error) {
      console.error("Error loading onsite work data:", error);
      setNotification({
        open: true,
        message: "Failed to load onsite work details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleSaveOnsiteWorkEntry = async (entry, isNew = true) => {
  //   try {
  //     const roomType = entry.room;

  //     // Format the data for API
  //     const formattedData = {
  //       category: entry.category,
  //       serviceType:
  //         entry.category === "Painting" ? entry.serviceGroup : entry.serviceKey,
  //       subType: entry.category === "Painting" ? entry.serviceKey : undefined,
  //       dimensions: entry.dimensions,
  //       quantity: entry.quantity,
  //     };

  //     if (isNew) {
  //       // Add new onsite work entry
  //       const response = await api.post(
  //         `/quotations/${quotation._id}/onsite-work/${roomType}`,
  //         formattedData
  //       );

  //       return response.data;
  //     } else {
  //       // Find the index of this entry in the onsiteWorkByRoom array
  //       const entryIndex = onsiteWorkEntries.findIndex(
  //         (item) =>
  //           item.room === entry.room &&
  //           item.category === entry.category &&
  //           item.service === entry.service &&
  //           item.serviceKey === entry.serviceKey
  //       );

  //       // Update existing onsite work entry
  //       const response = await api.put(
  //         `/quotations/${quotation._id}/onsite-work/${roomType}/${entryIndex}`,
  //         formattedData
  //       );

  //       return response.data;
  //     }
  //   } catch (error) {
  //     console.error("Error saving onsite work entry:", error);
  //     throw error;
  //   }
  // };

  // Helper function to get service key from name
  const getServiceKeyFromName = (category, service) => {
    if (category === "Painting") {
      // For painting, we need to check both INTERIOR and EXTERIOR
      for (const groupKey of ["INTERIOR", "EXTERIOR"]) {
        for (const [serviceKey, serviceObj] of Object.entries(
          ONSITE_WORK_CONFIG.SERVICES[category][groupKey]
        )) {
          if (serviceObj.name === service.name) {
            return serviceKey;
          }
        }
      }
    } else {
      // For other categories
      for (const [serviceKey, serviceObj] of Object.entries(
        ONSITE_WORK_CONFIG.SERVICES[category]
      )) {
        if (serviceObj.name === service.name) {
          return serviceKey;
        }
      }
    }
    return "";
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditIndex(null);
  };

  const validateField = (name, value) => {
    let error = "";

    if (!value && name !== "length") {
      // length is optional for most services
      error = "This field is required";
    } else if (
      (name === "height" ||
        name === "width" ||
        name === "length" ||
        name === "quantity") &&
      value &&
      (!isNumeric(value) || parseFloat(value) <= 0)
    ) {
      error = "Must be a positive number";
    }

    return error;
  };

  const isNumeric = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let updatedFormState = { ...formState };
    let updatedErrors = { ...formState.errors };

    // Validate field
    const error = validateField(name, value);
    if (error) {
      updatedErrors[name] = error;
    } else {
      delete updatedErrors[name];
    }

    // Special handling for category change
    if (name === "category") {
      updatedFormState = {
        ...formState,
        [name]: value,
        serviceGroup: value === "Painting" ? "" : null, // Reset serviceGroup for non-painting
        service: "", // Reset service when category changes
        height: "",
        width: "",
        length: "",
        quantity: "",
        errors: updatedErrors,
      };
    }
    // Special handling for serviceGroup change (only for Painting)
    else if (name === "serviceGroup") {
      updatedFormState = {
        ...formState,
        [name]: value,
        service: "", // Reset service when serviceGroup changes
        height: "",
        width: "",
        length: "",
        quantity: "",
        errors: updatedErrors,
      };
    }
    // Special handling for service change
    else if (name === "service") {
      updatedFormState = {
        ...formState,
        [name]: value,
        height: "",
        width: "",
        length: "",
        quantity: "",
        errors: updatedErrors,
      };
    } else {
      updatedFormState = {
        ...formState,
        [name]: value,
        errors: updatedErrors,
      };
    }

    setFormState(updatedFormState);
  };

  const validateForm = () => {
    const { room, category, service } = formState;
    if (!room || !category || !service) {
      return false;
    }

    // For Painting, verify serviceGroup is selected
    if (category === "Painting" && !formState.serviceGroup) {
      return false;
    }

    // Determine what measurement fields are required based on service unit
    let unitType = "";
    if (category === "Painting") {
      unitType =
        ONSITE_WORK_CONFIG.SERVICES[category][formState.serviceGroup][service]
          .unit;
    } else {
      unitType = ONSITE_WORK_CONFIG.SERVICES[category][service].unit;
    }

    if (unitType === "HxW") {
      if (
        !formState.height ||
        !formState.width ||
        formState.errors.height ||
        formState.errors.width
      ) {
        return false;
      }
    } else if (unitType === "Quantity Count") {
      if (!formState.quantity || formState.errors.quantity) {
        return false;
      }
    } else if (unitType === "H / RFT") {
      if (
        !formState.height ||
        !formState.length ||
        formState.errors.height ||
        formState.errors.length
      ) {
        return false;
      }
    }

    return true;
  };

  const calculatePrice = () => {
    const { category, serviceGroup, service, height, width, length, quantity } =
      formState;
    if (!category || !service) return 0;

    let selectedService;
    let unitType;

    if (category === "Painting") {
      if (!serviceGroup) return 0;
      selectedService =
        ONSITE_WORK_CONFIG.SERVICES[category][serviceGroup][service];
    } else {
      selectedService = ONSITE_WORK_CONFIG.SERVICES[category][service];
    }

    if (!selectedService) return 0;
    unitType = selectedService.unit;

    if (unitType === "HxW") {
      if (!height || !width || isNaN(height) || isNaN(width)) return 0;
      const area = parseFloat(height) * parseFloat(width);
      return Math.round(selectedService.rate * area);
    } else if (unitType === "Quantity Count") {
      if (!quantity || isNaN(quantity)) return 0;
      return Math.round(selectedService.rate * parseFloat(quantity));
    } else if (unitType === "H / RFT") {
      if (!height || !length || isNaN(height) || isNaN(length)) return 0;
      return Math.round(
        selectedService.rate * parseFloat(height) * parseFloat(length)
      );
    }

    return 0;
  };

  const getServiceObject = () => {
    const { category, serviceGroup, service } = formState;

    if (!category || !service) return null;

    if (category === "Painting") {
      if (!serviceGroup) return null;
      return ONSITE_WORK_CONFIG.SERVICES[category][serviceGroup][service];
    } else {
      return ONSITE_WORK_CONFIG.SERVICES[category][service];
    }
  };

  const handleAddOnsiteWork = async () => {
    if (!validateForm()) {
      setNotification({
        open: true,
        message: "Please fill all required fields correctly",
        severity: "error",
      });
      return;
    }

    const {
      room,
      category,
      serviceGroup,
      service,
      height,
      width,
      length,
      quantity,
    } = formState;
    const selectedService = getServiceObject();

    if (!selectedService) {
      setNotification({
        open: true,
        message: "Invalid service selection",
        severity: "error",
      });
      return;
    }

    // Create dimensions object based on the service unit type
    const dimensions = { height: "", width: "", length: "" };
    if (selectedService.unit === "HxW") {
      dimensions.height = height;
      dimensions.width = width;
    } else if (selectedService.unit === "H / RFT") {
      dimensions.height = height;
      dimensions.length = length;
    }

    const newEntry = {
      room,
      category,
      serviceGroup: category === "Painting" ? serviceGroup : null,
      service: selectedService.name,
      serviceKey: service, // Store original service key for editing
      dimensions,
      quantity: selectedService.unit === "Quantity Count" ? quantity : "",
      price: calculatePrice(),
    };

    setSavingInProgress(true);

    try {
      // Format the data for API
      const formattedData = {
        category: newEntry.category,
        serviceType:
          newEntry.category === "Painting"
            ? newEntry.serviceGroup
            : newEntry.serviceKey,
        subType:
          newEntry.category === "Painting" ? newEntry.serviceKey : undefined,
        dimensions: newEntry.dimensions,
        quantity: newEntry.quantity,
      };

      if (editIndex !== null) {
        // Update existing entry
        await api.put(
          `/quotation/onsite-work/${quotation._id}/onsite-work/${newEntry.room}/${editIndex}`,
          formattedData
        );

        // Update local state
        const updatedEntries = [...onsiteWorkEntries];
        updatedEntries[editIndex] = newEntry;
        setOnsiteWorkEntries(updatedEntries);

        setNotification({
          open: true,
          message: "Onsite work updated successfully",
          severity: "success",
        });
      } else {
        // Add new entry
        await api.post(
          `/quotation/onsite-work/${quotation._id}/onsite-work/${newEntry.room}`,
          formattedData
        );

        // Update local state
        setOnsiteWorkEntries([...onsiteWorkEntries, newEntry]);

        setNotification({
          open: true,
          message: "Onsite work added successfully",
          severity: "success",
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving onsite work:", error);
      setNotification({
        open: true,
        message: `Failed to save: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    } finally {
      setSavingInProgress(false);
    }
  };

  const handleEditEntry = (index) => {
    const entry = onsiteWorkEntries[index];

    const formData = {
      room: entry.room,
      category: entry.category,
      serviceGroup: entry.serviceGroup, // For painting (INTERIOR/EXTERIOR)
      service: entry.serviceKey,
      height: entry.dimensions?.height || "",
      width: entry.dimensions?.width || "",
      length: entry.dimensions?.length || "",
      quantity: entry.quantity || "",
      errors: {},
    };

    setFormState(formData);
    setEditIndex(index);

    // Scroll to form
    document
      .getElementById("onsite-work-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteEntry = async (index) => {
    try {
      setSavingInProgress(true);
      const entryToDelete = onsiteWorkEntries[index];

      // Call API to delete the entry
      await api.delete(
        `/quotation/onsite-work/${quotation._id}/onsite-work/${entryToDelete.room}/${index}`
      );

      // Update local state
      const updatedEntries = onsiteWorkEntries.filter((_, i) => i !== index);
      setOnsiteWorkEntries(updatedEntries);

      setNotification({
        open: true,
        message: "Onsite work removed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting onsite work:", error);
      setNotification({
        open: true,
        message: `Failed to delete: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    } finally {
      setSavingInProgress(false);
    }
  };

  const handleSaveOnsiteWork = async () => {
    if (onsiteWorkEntries.length === 0) {
      setNotification({
        open: true,
        message: "No onsite work entries to save",
        severity: "warning",
      });
      return;
    }

    setSavingInProgress(true);
    try {
      // Format the entries for API submission
      // The API expects a different format from what we're using in the state
      const onsiteWorkByRoom = {};

      onsiteWorkEntries.forEach((entry) => {
        if (!onsiteWorkByRoom[entry.room]) {
          onsiteWorkByRoom[entry.room] = [];
        }

        const workItem = {
          category: entry.category,
          service:
            entry.category === "Painting"
              ? {
                  type: entry.serviceGroup,
                  subType: entry.serviceKey,
                  name: entry.service,
                }
              : { type: entry.serviceKey, name: entry.service },
          dimensions: entry.dimensions,
          quantity: entry.quantity,
          price: entry.price,
        };

        onsiteWorkByRoom[entry.room].push(workItem);
      });

      await api.patch(`/quotation/onsite-work/${quotation._id}/onsite-work`, {
        onsiteWorkByRoom,
      });

      setNotification({
        open: true,
        message: "Onsite work details saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving onsite work data:", error);
      setNotification({
        open: true,
        message: `Failed to save onsite work details: ${
          error.response?.data?.error || error.message
        }`,
        severity: "error",
      });
    } finally {
      setSavingInProgress(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // If onsite work is not enabled for this quotation, don't render
  if (!quotation?.onsiteWorkEnabled) {
    return null;
  }

  // Get selected service object
  const selectedService = getServiceObject();

  // Determine which measurement fields to show based on the service unit
  const showDimensionsFields = selectedService?.unit === "HxW";
  const showQuantityField = selectedService?.unit === "Quantity Count";
  const showLengthField = selectedService?.unit === "H / RFT";

  // Calculate total price for all entries
  const totalPrice = onsiteWorkEntries.reduce(
    (sum, entry) => sum + entry.price,
    0
  );

  // Get available services based on category and service group
  const getAvailableServices = () => {
    const { category, serviceGroup } = formState;

    if (!category) return [];

    if (category === "Painting") {
      if (!serviceGroup) return [];
      return Object.entries(
        ONSITE_WORK_CONFIG.SERVICES[category][serviceGroup]
      );
    } else {
      return Object.entries(ONSITE_WORK_CONFIG.SERVICES[category]);
    }
  };

  return (
    <Accordion
      expanded={expanded === "onsiteWorkPanel"}
      onChange={() =>
        setExpanded(expanded === "onsiteWorkPanel" ? false : "onsiteWorkPanel")
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" fontWeight="bold">
          Onsite Work{" "}
          {onsiteWorkEntries.length > 0 &&
            `(${
              onsiteWorkEntries.length
            } items - ₹${totalPrice.toLocaleString()})`}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 2 }} id="onsite-work-form">
            <Typography variant="h6" gutterBottom>
              {editIndex !== null ? "Edit Onsite Work" : "Add Onsite Work"}
            </Typography>

            <Grid container spacing={2}>
              {/* Step 1: Room Selection */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth required error={!!formState.errors.room}>
                  <InputLabel>Select Room</InputLabel>
                  <Select
                    name="room"
                    value={formState.room}
                    onChange={handleInputChange}
                    label="Select Room"
                  >
                    {quotation?.rooms
                      .filter((room) => room.selected)
                      .map((room) => (
                        <MenuItem key={room._id} value={room.type}>
                          {room.type} {room.label ? `- ${room.label}` : ""}
                        </MenuItem>
                      ))}
                  </Select>
                  {formState.errors.room && (
                    <FormHelperText>{formState.errors.room}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Step 2: Category Selection */}
              <Grid item xs={12} md={2}>
                <FormControl
                  fullWidth
                  required
                  error={!!formState.errors.category}
                >
                  <InputLabel>Select Category</InputLabel>
                  <Select
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    label="Select Category"
                  >
                    {Object.values(ONSITE_WORK_CONFIG.CATEGORIES).map(
                      (category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      )
                    )}
                  </Select>
                  {formState.errors.category && (
                    <FormHelperText>{formState.errors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Step 3A: Service Group Selection (Only for Painting) */}
              {formState.category === "Painting" && (
                <Grid item xs={12} md={4}>
                  <FormControl
                    fullWidth
                    required
                    error={!!formState.errors.serviceGroup}
                  >
                    <InputLabel>Select Type</InputLabel>
                    <Select
                      name="serviceGroup"
                      value={formState.serviceGroup}
                      onChange={handleInputChange}
                      label="Select Type"
                    >
                      <MenuItem value="INTERIOR">Interior</MenuItem>
                      <MenuItem value="EXTERIOR">Exterior</MenuItem>
                    </Select>
                    {formState.errors.serviceGroup && (
                      <FormHelperText>
                        {formState.errors.serviceGroup}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Step 3B: Service Selection */}
              {((formState.category === "Painting" && formState.serviceGroup) ||
                (formState.category && formState.category !== "Painting")) && (
                <Grid
                  item
                  xs={12}
                  md={formState.category === "Painting" ? 4 : 4}
                >
                  <FormControl
                    fullWidth
                    required
                    error={!!formState.errors.service}
                  >
                    <InputLabel>Select Service</InputLabel>
                    <Select
                      name="service"
                      value={formState.service}
                      onChange={handleInputChange}
                      label="Select Service"
                    >
                      {getAvailableServices().map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          {value.name} (₹{value.rate}/
                          {value.unit === "HxW"
                            ? "sqft"
                            : value.unit === "Quantity Count"
                            ? "unit"
                            : "rft"}
                          )
                        </MenuItem>
                      ))}
                    </Select>
                    {formState.errors.service && (
                      <FormHelperText>
                        {formState.errors.service}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Step 4: Measurement Fields (Height x Width) */}
              {showDimensionsFields && (
                <>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Height (ft)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      name="height"
                      value={formState.height}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      error={!!formState.errors.height}
                      helperText={formState.errors.height}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Width (ft)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      name="width"
                      value={formState.width}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      error={!!formState.errors.width}
                      helperText={formState.errors.width}
                    />
                  </Grid>

                  {formState.height &&
                    formState.width &&
                    !formState.errors.height &&
                    !formState.errors.width && (
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Area (sqft)"
                          variant="outlined"
                          fullWidth
                          type="number"
                          value={(
                            parseFloat(formState.height) *
                            parseFloat(formState.width)
                          ).toFixed(2)}
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                    )}
                </>
              )}

              {/* Step 4 Alternative: Length Field (for H / RFT) */}
              {showLengthField && (
                <>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Height (ft)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      name="height"
                      value={formState.height}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      error={!!formState.errors.height}
                      helperText={formState.errors.height}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Length (rft)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      name="length"
                      value={formState.length}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      error={!!formState.errors.length}
                      helperText={formState.errors.length}
                    />
                  </Grid>
                </>
              )}

              {/* Step 4 Alternative: Quantity Field */}
              {showQuantityField && (
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Quantity"
                    variant="outlined"
                    fullWidth
                    type="number"
                    name="quantity"
                    value={formState.quantity}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 1, step: 1 }}
                    error={!!formState.errors.quantity}
                    helperText={formState.errors.quantity}
                  />
                </Grid>
              )}

              {/* Price Calculation Field */}
              {selectedService && (
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Estimated Price"
                    variant="outlined"
                    fullWidth
                    value={`₹ ${calculatePrice().toLocaleString()}`}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddOnsiteWork}
                    disabled={!validateForm() || loading || savingInProgress}
                  >
                    {editIndex !== null ? "Update" : "Add"} Onsite Work
                  </Button>
                  {editIndex !== null && (
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      disabled={loading || savingInProgress}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Onsite Work Entries Table */}
            {onsiteWorkEntries.length > 0 && (
              <>
                <TableContainer component={Paper} sx={{ mt: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Room</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Dimensions/Quantity</TableCell>
                        <TableCell align="right">Price (₹)</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {onsiteWorkEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.room}</TableCell>
                          <TableCell>{entry.category}</TableCell>
                          <TableCell>
                            {entry.category === "Painting"
                              ? `${
                                  entry.serviceGroup === "INTERIOR"
                                    ? "Interior"
                                    : "Exterior"
                                } - ${entry.service}`
                              : entry.service}
                          </TableCell>
                          <TableCell>
                            {entry.dimensions?.height && entry.dimensions?.width
                              ? `${entry.dimensions.height} x ${
                                  entry.dimensions.width
                                } = ${(
                                  parseFloat(entry.dimensions.height) *
                                  parseFloat(entry.dimensions.width)
                                ).toFixed(2)} sqft`
                              : entry.dimensions?.height &&
                                entry.dimensions?.length
                              ? `${entry.dimensions.height}ft height × ${entry.dimensions.length} rft`
                              : entry.quantity
                              ? `${entry.quantity} units`
                              : ""}
                          </TableCell>
                          <TableCell align="right">
                            {entry.price.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditEntry(index)}
                                disabled={loading || savingInProgress}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteEntry(index)}
                                disabled={loading || savingInProgress}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            ₹{totalPrice.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleSaveOnsiteWork}
                    disabled={loading || savingInProgress}
                    sx={{ minWidth: 150 }}
                  >
                    {savingInProgress ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Save All"
                    )}
                  </Button>
                </Box> */}
              </>
            )}

            {onsiteWorkEntries.length === 0 && !loading && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                >
                  No onsite work items added yet. Add your first onsite work
                  item above.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </AccordionDetails>
    </Accordion>
  );
};

export default OnsiteWork;
