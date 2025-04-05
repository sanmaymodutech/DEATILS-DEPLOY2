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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";

// Constants moved to a separate object for better organization
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

const initialFormState = {
  room: "",
  category: "",
  service: "",
  height: "",
  width: "",
  quantity: "",
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

  // Load saved onsite work when component mounts
  useEffect(() => {
    if (
      quotation &&
      quotation.onsiteWorkByRoom &&
      quotation.onsiteWorkByRoom.length > 0
    ) {
      setOnsiteWorkEntries(quotation.onsiteWorkByRoom);
    }
  }, [quotation]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditIndex(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "category") {
      setFormState({
        ...formState,
        [name]: value,
        service: "", // Reset service when category changes
        height: "",
        width: "",
        quantity: "",
      });
    } else if (name === "service") {
      setFormState({
        ...formState,
        [name]: value,
        height: "",
        width: "",
        quantity: "",
      });
    } else {
      setFormState({
        ...formState,
        [name]: value,
      });
    }
  };

  const validateForm = () => {
    const { room, category, service } = formState;
    if (!room || !category || !service) {
      return false;
    }

    const selectedService = ONSITE_WORK_CONFIG.SERVICES[category][service];
    if (selectedService.unit === "HxW") {
      if (!formState.height || !formState.width) return false;
    } else if (selectedService.unit === "Quantity Count") {
      if (!formState.quantity) return false;
    }

    return true;
  };

  const calculatePrice = () => {
    const { category, service, height, width, quantity } = formState;
    if (!category || !service) return 0;

    const selectedService = ONSITE_WORK_CONFIG.SERVICES[category][service];
    if (selectedService.unit === "HxW") {
      const area = parseFloat(height) * parseFloat(width);
      return Math.round(selectedService.rate * area);
    } else {
      return Math.round(selectedService.rate * parseFloat(quantity));
    }
  };

  const handleAddOnsiteWork = () => {
    if (!validateForm()) {
      setNotification({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      return;
    }

    const { room, category, service, height, width, quantity } = formState;
    const selectedService = ONSITE_WORK_CONFIG.SERVICES[category][service];

    const newEntry = {
      room,
      category,
      service: selectedService.name,
      dimensions: { height, width },
      quantity,
      price: calculatePrice(),
      serviceKey: service, // Store original service key for editing
    };

    if (editIndex !== null) {
      // Update existing entry
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
      setOnsiteWorkEntries([...onsiteWorkEntries, newEntry]);
      setNotification({
        open: true,
        message: "Onsite work added successfully",
        severity: "success",
      });
    }

    resetForm();
  };

  const handleEditEntry = (index) => {
    const entry = onsiteWorkEntries[index];
    setFormState({
      room: entry.room,
      category: entry.category,
      service: entry.serviceKey,
      height: entry.dimensions.height,
      width: entry.dimensions.width,
      quantity: entry.quantity,
    });
    setEditIndex(index);
  };

  const handleDeleteEntry = (index) => {
    const updatedEntries = onsiteWorkEntries.filter((_, i) => i !== index);
    setOnsiteWorkEntries(updatedEntries);
    setNotification({
      open: true,
      message: "Onsite work removed successfully",
      severity: "success",
    });
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

    setLoading(true);
    try {
      await api.patch(
        `${import.meta.env.VITE_API_BASE_URL}/quotations/${
          quotation._id
        }/onsite-work`,
        { onsiteWorkByRoom: onsiteWorkEntries }
      );
      setNotification({
        open: true,
        message: "Onsite work details saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving onsite work data:", error);
      setNotification({
        open: true,
        message: "Failed to save onsite work details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // If onsite work is not enabled for this quotation, don't render
  if (!quotation?.onsiteWorkEnabled) {
    return null;
  }

  // Determine if we're showing dimensions or quantity fields
  const showDimensionsFields =
    formState.category &&
    formState.service &&
    ONSITE_WORK_CONFIG.SERVICES[formState.category][formState.service]?.unit ===
      "HxW";

  const showQuantityField =
    formState.category &&
    formState.service &&
    ONSITE_WORK_CONFIG.SERVICES[formState.category][formState.service]?.unit ===
      "Quantity Count";

  // Calculate total price for all entries
  const totalPrice = onsiteWorkEntries.reduce(
    (sum, entry) => sum + entry.price,
    0
  );

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
            `(${onsiteWorkEntries.length} items - ₹${totalPrice})`}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {editIndex !== null ? "Edit Onsite Work" : "Add Onsite Work"}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
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
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
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
              </FormControl>
            </Grid>

            {formState.category && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Select Service</InputLabel>
                  <Select
                    name="service"
                    value={formState.service}
                    onChange={handleInputChange}
                    label="Select Service"
                  >
                    {Object.entries(
                      ONSITE_WORK_CONFIG.SERVICES[formState.category]
                    ).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.name} (₹{value.rate}/
                        {value.unit === "HxW" ? "sqft" : "unit"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

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
                    inputProps={{ min: 0, step: 0.01 }}
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
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                {formState.height && formState.width && (
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
                />
              </Grid>
            )}

            {(showDimensionsFields || showQuantityField) && (
              <Grid item xs={12} md={3}>
                <TextField
                  label="Estimated Price"
                  variant="outlined"
                  fullWidth
                  type="number"
                  value={calculatePrice()}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <Typography variant="body2">₹</Typography>,
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddOnsiteWork}
                  disabled={!validateForm() || loading}
                >
                  {editIndex !== null ? "Update" : "Add"} Onsite Work
                </Button>
                {editIndex !== null && (
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

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
                        <TableCell>{entry.service}</TableCell>
                        <TableCell>
                          {entry.dimensions.height && entry.dimensions.width
                            ? `${entry.dimensions.height} x ${
                                entry.dimensions.width
                              } = ${(
                                parseFloat(entry.dimensions.height) *
                                parseFloat(entry.dimensions.width)
                              ).toFixed(2)} sqft`
                            : entry.quantity
                            ? `${entry.quantity} units`
                            : "-"}
                        </TableCell>
                        <TableCell align="right">{entry.price}</TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{ display: "flex", justifyContent: "center" }}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditEntry(index)}
                                disabled={loading}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteEntry(index)}
                                disabled={loading}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
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
                          ₹{totalPrice}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveOnsiteWork}
                sx={{ mt: 4 }}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Onsite Work Details"}
              </Button>
            </>
          )}
        </Box>

        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
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
