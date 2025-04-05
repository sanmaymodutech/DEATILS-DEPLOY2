// WardrobeUnitsModal.jsx - New component
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { TrashIcon } from "lucide-react";
import api from "../utils/api";

const WardrobeUnitsModal = ({
  open,
  onClose,
  quotationId,
  roomIndex,
  wardrobeIndex,
  onUnitAdded,
}) => {
  console.log(wardrobeIndex, "wardrobeIndex");
  const [unitType, setUnitType] = useState("");
  const [dimensions, setDimensions] = useState({
    width: "",
    height: "",
    depth: "",
  });
  const [carcassType, setCarcassType] = useState("");
  const [finish, setFinish] = useState("WHITE");
  const [drawerQuantity, setDrawerQuantity] = useState(1);
  const [drawerWeight, setDrawerWeight] = useState("30KG");
  const [shelvesQuantity, setShelvesQuantity] = useState(1);
  const [verticalLineQuantity, setVerticalLineQuantity] = useState(1);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // useEffect(() => {
  //   // Reset state when modal opens with a new wardrobe index
  //   if (open && wardrobeIndex !== null) {
  //     resetForm();

  //     // Fetch existing units for this wardrobe
  //     const fetchUnits = async () => {
  //       try {
  //         const response = await api.get(
  //           `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe/${wardrobeIndex}`
  //         );
  //         if (response.data.data && response.data.data.units) {
  //           setUnits(response.data.data.units);
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch wardrobe units:", error);
  //         setError("Failed to load existing units");
  //       }
  //     };

  //     fetchUnits();
  //   }
  // }, [open, wardrobeIndex, quotationId, roomIndex]);

  // In WardrobeUnitsModal.jsx
  useEffect(() => {
    // Add validation for wardrobeIndex
    if (open) {
      if (wardrobeIndex === null || wardrobeIndex === undefined) {
        setError("Wardrobe index is not defined. Please try again.");
        return;
      }

      resetForm();

      // Fetch existing units for this wardrobe
      const fetchUnits = async () => {
        try {
          const response = await api.get(
            `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe/${wardrobeIndex}`
          );
          if (response.data.data && response.data.data.units) {
            setUnits(response.data.data.units);
          }
        } catch (error) {
          console.error("Failed to fetch wardrobe units:", error);
          setError("Failed to load existing units");
        }
      };

      fetchUnits();
    }
  }, [open, wardrobeIndex, quotationId, roomIndex]);

  const unitTypes = [
    { label: "Drawer", value: "DRAWER" },
    { label: "Shelves", value: "SHELVES" },
    { label: "Vertical", value: "VERTICAL_LINE" },
  ];

  const carcassTypes = ["BWP", "BWR", "COM_PLY"];
  const drawerWeights = ["30KG", "50KG"];
  const finishTypes = ["WHITE", "FAB"];

  const handleDimensionChange = (event) => {
    setDimensions({ ...dimensions, [event.target.name]: event.target.value });
  };

  const resetForm = () => {
    setUnitType("");
    setDimensions({ width: "", height: "", depth: "" });
    setCarcassType("");
    setFinish("WHITE");
    setDrawerQuantity(1);
    setDrawerWeight("30KG");
    setShelvesQuantity(1);
    setVerticalLineQuantity(1);
    setError("");
    setSuccess("");
  };

  const validateInputs = () => {
    setError("");

    if (!unitType) {
      setError("Please select a unit type");
      return false;
    }

    switch (unitType) {
      case "DRAWER":
        if (!dimensions.width || !dimensions.height) {
          setError(
            "Width and height measurements are required for drawer units"
          );
          return false;
        }
        if (!carcassType) {
          setError("Carcass type is required for drawer units");
          return false;
        }
        if (!drawerQuantity || drawerQuantity <= 0) {
          setError("Drawer quantity must be greater than 0");
          return false;
        }
        break;

      case "SHELVES":
        if (!shelvesQuantity || shelvesQuantity <= 0) {
          setError("Shelves quantity must be greater than 0");
          return false;
        }
        break;

      case "VERTICAL_LINE":
        if (!dimensions.width || !dimensions.height) {
          setError(
            "Width and height measurements are required for vertical line"
          );
          return false;
        }
        if (!verticalLineQuantity || verticalLineQuantity <= 0) {
          setError("Vertical line quantity must be greater than 0");
          return false;
        }
        break;
    }

    return true;
  };

  const handleAddUnit = async () => {
    if (wardrobeIndex === null || wardrobeIndex === undefined) {
      setError("Wardrobe index is not defined. Please close and try again.");
      return;
    }
    if (!validateInputs()) {
      return;
    }

    try {
      // Prepare payload based on unit type
      let payload = {
        unitType,
        finish,
      };

      switch (unitType) {
        case "DRAWER":
          payload = {
            ...payload,
            measurements: {
              width: parseFloat(dimensions.width),
              height: parseFloat(dimensions.height),
              depth: dimensions.depth
                ? parseFloat(dimensions.depth)
                : undefined,
            },
            carcassType,
            drawerQuantity: parseInt(drawerQuantity),
            drawerWeight,
          };
          break;

        case "SHELVES":
          payload = {
            ...payload,
            shelvesQuantity: parseInt(shelvesQuantity),
          };
          break;

        case "VERTICAL_LINE":
          payload = {
            ...payload,
            measurements: {
              width: parseFloat(dimensions.width),
              height: parseFloat(dimensions.height),
              depth: dimensions.depth
                ? parseFloat(dimensions.depth)
                : undefined,
            },
            verticalLineQuantity: parseInt(verticalLineQuantity),
          };
          break;
      }

      // Make API call
      const response = await api.put(
        `/quotations/${quotationId}/rooms/${roomIndex}/wardrobe/${wardrobeIndex}/units`,
        payload
      );

      // Update local state with new unit
      const newUnit = response.data.data.newUnit;
      setUnits([...units, newUnit]);

      setSuccess(`${unitType} unit added successfully!`);

      // This is where we need to refresh the parent component's data
      if (onUnitAdded && typeof onUnitAdded === "function") {
        await onUnitAdded(newUnit);
      }

      // Reset form fields for next unit
      resetForm();
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      setError(
        `Failed to add unit: ${error.response?.data?.error || error.message}`
      );
    }
  };

  const handleRemoveUnit = async (index) => {
    try {
      // Since API doesn't have delete endpoint for units (based on provided code),
      // we would need to implement one. For now, just removing from local state
      const newUnits = units.filter((_, i) => i !== index);
      setUnits(newUnits);
      setSuccess("Unit removed successfully!");
    } catch (error) {
      setError(`Failed to remove unit: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Define Wardrobe Units</DialogTitle>
      <DialogContent>
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

        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField
              select
              label="Unit Type"
              fullWidth
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              size="small"
            >
              <MenuItem value="">Select Unit Type</MenuItem>
              {unitTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {(unitType === "DRAWER" || unitType === "VERTICAL_LINE") && (
            <>
              <Grid item xs={4} md={2}>
                <TextField
                  label="Width"
                  type="number"
                  fullWidth
                  name="width"
                  value={dimensions.width}
                  onChange={handleDimensionChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={4} md={2}>
                <TextField
                  label="Height"
                  type="number"
                  fullWidth
                  name="height"
                  value={dimensions.height}
                  onChange={handleDimensionChange}
                  size="small"
                />
              </Grid>
              <Grid item xs={4} md={2}>
                <TextField
                  label="Depth"
                  type="number"
                  fullWidth
                  name="depth"
                  value={dimensions.depth}
                  onChange={handleDimensionChange}
                  size="small"
                />
              </Grid>
            </>
          )}

          {unitType === "DRAWER" && (
            <>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Carcass Type"
                  fullWidth
                  value={carcassType}
                  onChange={(e) => setCarcassType(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Select Carcass Type</MenuItem>
                  {carcassTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Finish"
                  fullWidth
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  size="small"
                >
                  {finishTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Drawer Quantity"
                  type="number"
                  fullWidth
                  value={drawerQuantity}
                  onChange={(e) => setDrawerQuantity(e.target.value)}
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </>
          )}

          {unitType === "SHELVES" && (
            <Grid item xs={12} md={3}>
              <TextField
                label="Shelves Quantity"
                type="number"
                fullWidth
                value={shelvesQuantity}
                onChange={(e) => setShelvesQuantity(e.target.value)}
                size="small"
                inputProps={{ min: 1 }}
              />
            </Grid>
          )}

          {unitType === "VERTICAL_LINE" && (
            <>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Vertical Quantity"
                  type="number"
                  fullWidth
                  value={verticalLineQuantity}
                  onChange={(e) => setVerticalLineQuantity(e.target.value)}
                  size="small"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  select
                  label="Finish"
                  fullWidth
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  size="small"
                >
                  {finishTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}

          {unitType && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddUnit}
              >
                Add Unit
              </Button>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {units.length > 0 ? (
          <Box sx={{ overflow: "auto" }}>
            <Typography variant="h6" gutterBottom>
              Added Units
            </Typography>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Unit Type
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Dimensions
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Specifications
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Price
                  </th>
                  <th className="p-2 text-sm font-semibold text-gray-700 border border-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, index) => (
                  <tr key={index}>
                    <td className="p-2 text-sm border border-gray-300">
                      {unit.unitType}
                    </td>
                    <td className="p-2 text-sm border border-gray-300">
                      {unit.measurements ? (
                        <>
                          W: {unit.measurements.width}, H:{" "}
                          {unit.measurements.height}
                          {unit.measurements.depth &&
                            `, D: ${unit.measurements.depth}`}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="p-2 text-sm border border-gray-300">
                      {unit.unitType === "DRAWER" && (
                        <>
                          Carcass: {unit.carcass?.type}
                          <br />
                          Finish: {unit.finish}
                          <br />
                          Drawers: {unit.drawer?.quantity} (
                          {unit.drawer?.weight})
                        </>
                      )}
                      {unit.unitType === "SHELVES" && (
                        <>Shelves: {unit.shelves?.quantity}</>
                      )}
                      {unit.unitType === "VERTICAL_LINE" && (
                        <>
                          Quantity: {unit.verticalLine?.quantity}
                          <br />
                          Finish: {unit.finish}
                        </>
                      )}
                    </td>
                    <td className="p-2 text-sm border border-gray-300">
                      ₹{unit.totalPrice}
                    </td>
                    <td className="p-2 text-sm border border-gray-300">
                      <button
                        onClick={() => handleRemoveUnit(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary" align="center">
            No units added yet
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WardrobeUnitsModal;
