import * as React from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";

const CustomComponentForm = ({ roomIndex, name, onComponentSaved }) => {
  const { quotationId, kitchenPricing } = useAuth();
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [customComponent, setCustomComponent] = React.useState({
    name: "",
    dimensions: { width: "", depth: "", height: "" },
    material: "",
    finish: "",
    additionalInfo: "",
    defineType: "",
    carcassType: "",
    shutterMaterial: "",
    shutterFinish: "",
    shelvesQuantity: "",
    drawerQuantity: "",
    price: "",
  });

  // For custom options in dropdowns
  const [customInputs, setCustomInputs] = React.useState({
    carcassType: "",
    finish: "",
    shutterMaterial: "",
    shutterFinish: "",
    defineType: "",
  });

  // Options for the "Define Type" dropdown
  const typeOptions = [
    { label: "CARCASS_WITH_SHUTTERS", value: "CARCASS_WITH_SHUTTERS" },
    { label: "OPEN_UNIT", value: "OPEN_UNIT" },
    { label: "DRAWER", value: "DRAWER" },
    {
      label: "CARCASS_WITH_PROFILE_SHUTTER",
      value: "CARCASS_WITH_PROFILE_SHUTTER",
    },
  ];

  // Reset messages when dialog opens/closes
  React.useEffect(() => {
    setError("");
    setSuccess("");
  }, [customDialogOpen]);

  // Handle custom component input changes
  const handleCustomInputChange = (field, value) => {
    if (field.startsWith("dimension-")) {
      const dimension = field.split("-")[1];
      setCustomComponent({
        ...customComponent,
        dimensions: {
          ...customComponent.dimensions,
          [dimension]: value,
        },
      });
    } else {
      setCustomComponent({
        ...customComponent,
        [field]: value,
      });
    }
  };

  // Handle custom dropdown option input changes
  const handleCustomOptionChange = (field, value) => {
    setCustomInputs({
      ...customInputs,
      [field]: value,
    });
  };

  // Handle adding custom option to dropdowns
  const handleAddCustomOption = (field) => {
    if (customInputs[field] && customInputs[field].trim() !== "") {
      handleCustomInputChange(field, customInputs[field]);
      setCustomInputs({
        ...customInputs,
        [field]: "",
      });
    }
  };

  // Handle custom component save
  const handleSaveCustomComponent = async () => {
    // Validate name and dimensions only - other fields are optional
    if (!customComponent.name) {
      setError("Please enter a component name");
      return;
    }

    try {
      // Define endpoint for custom components
      const endpoint = `/quotations/${quotationId}/rooms/${roomIndex}/custom-component`;

      // Create payload with all fields
      const payload = {
        name: customComponent.name,
        price: customComponent.price,
        dimensions: {
          width: parseFloat(customComponent.dimensions.width) || 0,
          depth: parseFloat(customComponent.dimensions.depth) || 0,
          height: parseFloat(customComponent.dimensions.height) || 0,
        },
        material: customComponent.material,
        finish: customComponent.finish,
        additionalInfo: customComponent.additionalInfo,
        defineType: customComponent.defineType,
        carcassType: customComponent.carcassType,
        shutterMaterial: customComponent.shutterMaterial,
        shutterFinish: customComponent.shutterFinish,
        room: name,
      };

      // Add quantities only if they have values
      if (customComponent.shelvesQuantity) {
        payload.shelvesQuantity = parseInt(customComponent.shelvesQuantity);
        payload.shelvesRequired = parseInt(customComponent.shelvesQuantity) > 0;
      }

      if (customComponent.drawerQuantity) {
        payload.drawerQuantity = parseInt(customComponent.drawerQuantity);
      }

      console.log("Sending custom component to endpoint:", endpoint);
      console.log("Payload:", payload);

      // Call API
      const response = await api.post(endpoint, payload);

      // Notify parent component
      if (onComponentSaved && typeof onComponentSaved === "function") {
        onComponentSaved({
          component: customComponent.name,
          dimensions: customComponent.dimensions,
          material: customComponent.material,
          finish: customComponent.finish,
          additionalInfo: customComponent.additionalInfo,
          defineType: customComponent.defineType,
          carcassType: customComponent.carcassType,
          shutterMaterial: customComponent.shutterMaterial,
          shutterFinish: customComponent.shutterFinish,
          shelvesQuantity: customComponent.shelvesQuantity,
          drawerQuantity: customComponent.drawerQuantity,
          isCustom: true,
          id: response.data?.id || Date.now(),
        });
      }

      // Reset form and close dialog
      setCustomComponent({
        name: "",
        price: "",
        dimensions: { width: "", depth: "", height: "" },
        material: "",
        finish: "",
        additionalInfo: "",
        defineType: "",
        carcassType: "",
        shutterMaterial: "",
        shutterFinish: "",
        shelvesQuantity: "",
        drawerQuantity: "",
      });
      setSuccess("Custom component saved successfully!");

      // Close dialog after a short delay to allow user to see success message
      setTimeout(() => {
        setCustomDialogOpen(false);
      }, 1500);
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      setError(
        `Failed to save custom component: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<AddCircleIcon />}
        onClick={() => setCustomDialogOpen(true)}
        sx={{ mt: 2 }}
      >
        Add Custom Component
      </Button>

      <Dialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Custom Component for {name}</DialogTitle>
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

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Component Name"
                variant="outlined"
                value={customComponent.name}
                onChange={(e) =>
                  handleCustomInputChange("name", e.target.value)
                }
              />
            </Grid>

            <Grid item md={3}>
              <TextField
                fullWidth
                label="Price"
                variant="outlined"
                value={customComponent.price}
                onChange={(e) =>
                  handleCustomInputChange("price", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="define-type-label">Define Type</InputLabel>
                <Select
                  labelId="define-type-label"
                  id="define-type"
                  value={customComponent.defineType}
                  onChange={(e) =>
                    handleCustomInputChange("defineType", e.target.value)
                  }
                  label="Define Type"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {typeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                  {customComponent.defineType &&
                    !typeOptions.some(
                      (opt) => opt.value === customComponent.defineType
                    ) && (
                      <MenuItem value={customComponent.defineType}>
                        {customComponent.defineType}
                      </MenuItem>
                    )}
                  <MenuItem value="custom">
                    <em>Custom...</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {customComponent.defineType === "custom" && (
                <Box sx={{ mt: 1, display: "flex" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Type"
                    value={customInputs.defineType}
                    onChange={(e) =>
                      handleCustomOptionChange("defineType", e.target.value)
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleAddCustomOption("defineType")}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Width"
                type="number"
                variant="outlined"
                value={customComponent.dimensions.width}
                onChange={(e) =>
                  handleCustomInputChange("dimension-width", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Depth"
                type="number"
                variant="outlined"
                value={customComponent.dimensions.depth}
                onChange={(e) =>
                  handleCustomInputChange("dimension-depth", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Height"
                type="number"
                variant="outlined"
                value={customComponent.dimensions.height}
                onChange={(e) =>
                  handleCustomInputChange("dimension-height", e.target.value)
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="carcass-type-label">Carcass Type</InputLabel>
                <Select
                  labelId="carcass-type-label"
                  id="carcass-type"
                  value={customComponent.carcassType}
                  onChange={(e) =>
                    handleCustomInputChange("carcassType", e.target.value)
                  }
                  label="Carcass Type"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {kitchenPricing?.carcass?.map((carcass) => (
                    <MenuItem key={carcass} value={carcass}>
                      {carcass}
                    </MenuItem>
                  )) || []}
                  {customComponent.carcassType &&
                    !kitchenPricing?.carcass?.includes(
                      customComponent.carcassType
                    ) && (
                      <MenuItem value={customComponent.carcassType}>
                        {customComponent.carcassType}
                      </MenuItem>
                    )}
                  <MenuItem value="custom">
                    <em>Custom...</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {customComponent.carcassType === "custom" && (
                <Box sx={{ mt: 1, display: "flex" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Carcass Type"
                    value={customInputs.carcassType}
                    onChange={(e) =>
                      handleCustomOptionChange("carcassType", e.target.value)
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleAddCustomOption("carcassType")}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="finish-label">Finish</InputLabel>
                <Select
                  labelId="finish-label"
                  id="finish"
                  value={customComponent.finish}
                  onChange={(e) =>
                    handleCustomInputChange("finish", e.target.value)
                  }
                  label="Finish"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {kitchenPricing?.finishs?.map((finish) => (
                    <MenuItem key={finish} value={finish}>
                      {finish}
                    </MenuItem>
                  )) || []}
                  {customComponent.finish &&
                    !kitchenPricing?.finishs?.includes(
                      customComponent.finish
                    ) && (
                      <MenuItem value={customComponent.finish}>
                        {customComponent.finish}
                      </MenuItem>
                    )}
                  <MenuItem value="custom">
                    <em>Custom...</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {customComponent.finish === "custom" && (
                <Box sx={{ mt: 1, display: "flex" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Finish"
                    value={customInputs.finish}
                    onChange={(e) =>
                      handleCustomOptionChange("finish", e.target.value)
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleAddCustomOption("finish")}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="shutter-material-label">
                  Shutter Material
                </InputLabel>
                <Select
                  labelId="shutter-material-label"
                  id="shutter-material"
                  value={customComponent.shutterMaterial}
                  onChange={(e) => {
                    handleCustomInputChange("shutterMaterial", e.target.value);
                    // Don't reset shutter finish when material changes
                  }}
                  label="Shutter Material"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {Object.keys(kitchenPricing?.shutters || {}).map(
                    (material) => (
                      <MenuItem key={material} value={material}>
                        {material}
                      </MenuItem>
                    )
                  )}
                  {customComponent.shutterMaterial &&
                    !Object.keys(kitchenPricing?.shutters || {}).includes(
                      customComponent.shutterMaterial
                    ) && (
                      <MenuItem value={customComponent.shutterMaterial}>
                        {customComponent.shutterMaterial}
                      </MenuItem>
                    )}
                  <MenuItem value="custom">
                    <em>Custom...</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {customComponent.shutterMaterial === "custom" && (
                <Box sx={{ mt: 1, display: "flex" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Shutter Material"
                    value={customInputs.shutterMaterial}
                    onChange={(e) =>
                      handleCustomOptionChange(
                        "shutterMaterial",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleAddCustomOption("shutterMaterial")}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="shutter-finish-label">
                  Shutter Finish
                </InputLabel>
                <Select
                  labelId="shutter-finish-label"
                  id="shutter-finish"
                  value={customComponent.shutterFinish}
                  onChange={(e) =>
                    handleCustomInputChange("shutterFinish", e.target.value)
                  }
                  label="Shutter Finish"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {/* Allow selection from any material's finish options */}
                  {Object.values(kitchenPricing?.shutters || {})
                    .flat()
                    .map((finish) => (
                      <MenuItem key={finish} value={finish}>
                        {finish}
                      </MenuItem>
                    ))}
                  {customComponent.shutterFinish &&
                    !Object.values(kitchenPricing?.shutters || {})
                      .flat()
                      .includes(customComponent.shutterFinish) && (
                      <MenuItem value={customComponent.shutterFinish}>
                        {customComponent.shutterFinish}
                      </MenuItem>
                    )}
                  <MenuItem value="custom">
                    <em>Custom...</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {customComponent.shutterFinish === "custom" && (
                <Box sx={{ mt: 1, display: "flex" }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Shutter Finish"
                    value={customInputs.shutterFinish}
                    onChange={(e) =>
                      handleCustomOptionChange("shutterFinish", e.target.value)
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => handleAddCustomOption("shutterFinish")}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shelves Quantity"
                type="number"
                variant="outlined"
                value={customComponent.shelvesQuantity}
                onChange={(e) =>
                  handleCustomInputChange("shelvesQuantity", e.target.value)
                }
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Drawer Quantity"
                type="number"
                variant="outlined"
                value={customComponent.drawerQuantity}
                onChange={(e) =>
                  handleCustomInputChange("drawerQuantity", e.target.value)
                }
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Information"
                variant="outlined"
                multiline
                rows={3}
                value={customComponent.additionalInfo}
                onChange={(e) =>
                  handleCustomInputChange("additionalInfo", e.target.value)
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveCustomComponent}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomComponentForm;
