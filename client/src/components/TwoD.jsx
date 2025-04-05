import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import api from "../utils/api";
import { useAuth } from "../context/Authcontext";

const TwoD = ({ setTwoD, sectionKey, quotationID, category }) => {
  const {
    twoDdata,
    settwoDdata,
    kitchenRemainingWidths,
    setKitchenRemainingWidths,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [partitionWidth, setPartitionWidth] = useState("");
  const [components, setComponents] = useState({});
  const [selectedComponent, setSelectedComponent] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const canvasRef = useRef(null);

  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Add this effect to calculate the appropriate scale
  useEffect(() => {
    if (twoDdata && containerRef.current) {
      // Get the available width of the container
      const containerWidth = containerRef.current.clientWidth;
      // Calculate scale needed to fit the cabinet width within container
      const newScale = Math.min(1, (containerWidth - 20) / twoDdata.totalWidth);
      setScale(newScale);
    }
  }, [twoDdata]);

  // Add states for edit/delete functionality
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPartitionIndex, setEditPartitionIndex] = useState(null);
  const [partitionDetailsOpen, setPartitionDetailsOpen] = useState(false);
  const [selectedPartitionIndex, setSelectedPartitionIndex] = useState(null);

  useEffect(() => {
    if (twoDdata && twoDdata.remainingWidth !== undefined) {
      setKitchenRemainingWidths((prev) => ({
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || {}),
          [category]: twoDdata.remainingWidth,
        },
      }));
    }
  }, [twoDdata, sectionKey, category]);

  // Also update when closing TwoD
  const handleBackToMeasurements = () => {
    if (twoDdata && twoDdata.remainingWidth !== undefined) {
      setKitchenRemainingWidths((prev) => ({
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || {}),
          [category]: twoDdata.remainingWidth,
        },
      }));
    }
    setTwoD(false);
  };

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        let response;
        if (category === "wall") {
          response = await api.get("/quotations/available-wall-components");
        } else {
          response = await api.get("/quotations/available-components");
        }
        setComponents(response.data.data.components);
      } catch (err) {
        setError("Failed to fetch components");
      }
    };
    fetchComponents();
  }, [category]);

  // Fetch the data for the cabinet
  useEffect(() => {
    if (!sectionKey || !category) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/quotations/${quotationID}/rooms/0/kitchen/remaining-space`,
          {
            params: { sectionKey, cabinetType: category },
          }
        );
        settwoDdata(response.data.data);
      } catch (err) {
        setError("Failed to fetch data");
      }
      setLoading(false);
    };

    fetchData();
  }, [sectionKey, category, quotationID]);

  // Draw the cabinet and partitions on the canvas
  useEffect(() => {
    if (twoDdata && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the cabinet border
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, twoDdata.totalWidth, 400);

      // Draw the existing partitions with just a border
      let currentX = 0;
      twoDdata.partitions.forEach((partition, index) => {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(currentX, 0, partition.width, 400);

        // Display partition type text in the center
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        const text = partition.componentType || category;
        const textMetrics = ctx.measureText(text);
        const textX = currentX + partition.width / 2 - textMetrics.width / 2;
        ctx.fillText(text, textX, 400 / 2);

        currentX += partition.width;
      });
    }
  }, [twoDdata]);

  // Handle partition width input change
  const handlePartitionWidthChange = (e) => {
    setPartitionWidth(e.target.value);
  };

  // Add partition to the cabinet
  const handleAddPartition = async () => {
    if (!partitionWidth || isNaN(partitionWidth)) {
      setError("Please enter a valid partition width.");
      return;
    }

    const partition = {
      width: parseInt(partitionWidth),
      componentType: selectedComponent || null,
      module: selectedModule || null,
      details: selectedDetails,
      accessories: selectedAccessories,
    };

    try {
      setLoading(true);

      // Change API endpoint based on category
      let response;
      if (category === "loft") {
        response = await api.post(
          `/quotations/${quotationID}/rooms/0/kitchen/loft-partition`,
          {
            sectionKey,
            width: parseInt(partitionWidth), // For loft, only send width
          }
        );
      } else {
        response = await api.post(
          `/quotations/${quotationID}/rooms/0/kitchen/partition`,
          {
            sectionKey,
            cabinetType: category,
            partition,
          }
        );
      }

      settwoDdata((prevData) => ({
        ...prevData,
        partitions: [...prevData.partitions, partition],
        remainingWidth: response.data.data.remainingWidth,
      }));

      // Clear form
      setPartitionWidth("");
      setSelectedComponent("");
      setSelectedModule("");
      setSelectedDetails([]);
      setSelectedAccessories([]);
      setError(null);
    } catch (err) {
      setError("Failed to add partition.");
    } finally {
      setLoading(false);
    }
  };

  // Update partition
  const handleUpdatePartition = async () => {
    if (!partitionWidth || isNaN(partitionWidth)) {
      setError("Please enter a valid partition width.");
      return;
    }

    const partition = {
      width: parseInt(partitionWidth),
      componentType: selectedComponent || null,
      module: selectedModule || null,
      details: selectedDetails,
      accessories: selectedAccessories,
    };

    try {
      setLoading(true);

      // Change API endpoint based on category
      let response;
      if (category === "loft") {
        response = await api.put(
          `/quotations/${quotationID}/rooms/0/kitchen/loft-partition/${editPartitionIndex}`,
          {
            sectionKey,
            width: parseInt(partitionWidth), // For loft, only send width
          }
        );
      } else {
        response = await api.put(
          `/quotations/${quotationID}/rooms/0/kitchen/partition/${editPartitionIndex}`,
          {
            sectionKey,
            cabinetType: category,
            partition,
          }
        );
      }

      // Update the partitions in the twoDdata state
      settwoDdata((prevData) => {
        const updatedPartitions = [...prevData.partitions];
        updatedPartitions[editPartitionIndex] = partition;

        return {
          ...prevData,
          partitions: updatedPartitions,
          remainingWidth: response.data.data.remainingWidth,
        };
      });

      // Clear form and exit edit mode
      setPartitionWidth("");
      setSelectedComponent("");
      setSelectedModule("");
      setSelectedDetails([]);
      setSelectedAccessories([]);
      setIsEditMode(false);
      setEditPartitionIndex(null);
      setError(null);
    } catch (err) {
      setError("Failed to update partition.");
    } finally {
      setLoading(false);
    }
  };

  // Delete partition
  const handleDeletePartition = async (index) => {
    try {
      setLoading(true);

      // Change API endpoint based on category
      let response;
      if (category === "loft") {
        response = await api.delete(
          `/quotations/${quotationID}/rooms/0/kitchen/loft-partition/${index}`,
          {
            params: { sectionKey },
          }
        );
      } else {
        response = await api.delete(
          `/quotations/${quotationID}/rooms/0/kitchen/partition/${index}`,
          {
            params: { sectionKey, cabinetType: category },
          }
        );
      }

      // Update the state by removing the deleted partition
      settwoDdata((prevData) => {
        const updatedPartitions = [...prevData.partitions];
        updatedPartitions.splice(index, 1);

        return {
          ...prevData,
          partitions: updatedPartitions,
          remainingWidth: response.data.data.remainingWidth,
        };
      });

      setError(null);
    } catch (err) {
      setError("Failed to delete partition.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click for a partition
  const handleEditClick = (index) => {
    const partition = twoDdata.partitions[index];

    // Populate form with partition data
    setPartitionWidth(partition.width.toString());
    setSelectedComponent(partition.componentType);
    setSelectedModule(partition.module || "");
    setSelectedDetails(partition.details || []);
    setSelectedAccessories(partition.accessories || []);

    // Set edit mode
    setIsEditMode(true);
    setEditPartitionIndex(index);
  };

  // Handle canvas click to select a partition
  const handleCanvasClick = (e) => {
    if (!twoDdata || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Adjust the click coordinate based on the scale
    const x = (e.clientX - rect.left) / scale;

    // Find which partition was clicked
    let currentX = 0;
    for (let i = 0; i < twoDdata.partitions.length; i++) {
      const partition = twoDdata.partitions[i];
      if (x >= currentX && x <= currentX + partition.width) {
        setSelectedPartitionIndex(i);
        setPartitionDetailsOpen(true);
        break;
      }
      currentX += partition.width;
    }
  };

  // Reset form and exit edit mode
  const handleCancelEdit = () => {
    setPartitionWidth("");
    setSelectedComponent("");
    setSelectedModule("");
    setSelectedDetails([]);
    setSelectedAccessories([]);
    setIsEditMode(false);
    setEditPartitionIndex(null);
  };

  return (
    <div>
      <h2 className="text-xl font-black">
        Section {sectionKey} {category}
      </h2>

      {loading && <CircularProgress />}
      {error && (
        <>
          <p style={{ color: "red" }}>{error}</p>
        </>
      )}

      {error && !twoDdata && (
        <>
          <p style={{ color: "red" }}>{error}</p>
          <Button variant="outlined" onClick={handleBackToMeasurements}>
            Back to Measurements
          </Button>
        </>
      )}

      {twoDdata && (
        <>
          <div className="flex w-xl justify-between">
            <p>
              <strong>Total Width:</strong> {twoDdata.totalWidth}mm
            </p>
            <p>
              <strong>Total Height:</strong> {twoDdata.totalHeight}mm
            </p>
            <p>
              <strong>Remaining Width:</strong> {twoDdata.remainingWidth}mm
            </p>
          </div>

          <div className="flex mt-4 items-center">
            {category !== "loft" && (
              <TextField
                select
                sx={{ m: 1, minWidth: 120 }}
                label="Units"
                variant="outlined"
                size="small"
                className="w-[180px]"
                value={selectedComponent}
                onChange={(e) => {
                  setSelectedComponent(e.target.value);
                  setSelectedModule(""); // Reset module selection
                  setSelectedDetails([]); // Reset details selection
                  setSelectedAccessories([]); // Reset accessories selection
                }}
              >
                <MenuItem value="">Select Component</MenuItem>
                {Object.keys(components).map((comp) => (
                  <MenuItem key={comp} value={comp}>
                    {comp}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              sx={{ m: 1, minWidth: 120 }}
              label="Partition Width (mm)"
              className="w-[180px] "
              size="small"
              value={partitionWidth}
              onChange={handlePartitionWidthChange}
              type="number"
            />

            {/* Module Selection (Only if hasModules is true) */}
            {selectedComponent && components[selectedComponent]?.hasModules && (
              <TextField
                select
                label="Modules"
                variant="outlined"
                size="small"
                className="w-[180px]"
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setSelectedDetails([]); // Reset details when module changes
                  setSelectedAccessories([]); // Reset accessories when module changes
                }}
              >
                <MenuItem value="">Select Module</MenuItem>
                {Object.keys(components[selectedComponent]?.modules || {}).map(
                  (mod) => (
                    <MenuItem key={mod} value={mod}>
                      {mod}
                    </MenuItem>
                  )
                )}
              </TextField>
            )}

            {/* Details Selection */}
            {selectedComponent &&
              (components[selectedComponent]?.hasModules
                ? selectedModule &&
                  components[selectedComponent]?.modules[selectedModule]
                    ?.details?.length > 0
                : components[selectedComponent]?.details?.length > 0) && (
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                  <InputLabel id="details-label">Details</InputLabel>
                  <Select
                    labelId="details-label"
                    id="details"
                    multiple
                    value={selectedDetails.map((item) => item.detail)}
                    onChange={(e) => {
                      const selectedValues = e.target.value;
                      setSelectedDetails(
                        selectedValues.map((value) => ({ detail: value }))
                      );
                    }}
                    input={<OutlinedInput label="Details" />}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {(components[selectedComponent]?.hasModules
                      ? components[selectedComponent]?.modules[selectedModule]
                          ?.details
                      : components[selectedComponent]?.details
                    ).map((detail) => (
                      <MenuItem key={detail} value={detail}>
                        {detail}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

            {/* Accessories Selection */}
            {selectedComponent &&
              (components[selectedComponent]?.hasModules
                ? selectedModule &&
                  components[selectedComponent]?.modules[selectedModule]
                    ?.accessories.length > 0
                : components[selectedComponent]?.accessories.length > 0) && (
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                  <InputLabel id="accessories-label">Accessories</InputLabel>
                  <Select
                    labelId="accessories-label"
                    id="accessories"
                    multiple
                    value={selectedAccessories.map((item) => item.name)}
                    onChange={(e) => {
                      const selectedValues = e.target.value;
                      setSelectedAccessories(
                        selectedValues.map((value) => ({ name: value }))
                      );
                    }}
                    input={<OutlinedInput label="Accessories" />}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {(components[selectedComponent]?.hasModules
                      ? components[selectedComponent]?.modules[selectedModule]
                          ?.accessories
                      : components[selectedComponent]?.accessories
                    ).map((acc) => (
                      <MenuItem key={acc} value={acc}>
                        {acc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
          </div>

          <div className="flex">
            {isEditMode ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ marginX: "10px" }}
                  onClick={handleUpdatePartition}
                >
                  Update Partition
                </Button>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  className="text-balance"
                  sx={{ marginX: "10px" }}
                  onClick={handleAddPartition}
                  disabled={twoDdata.remainingWidth === 0}
                >
                  Add Partition
                </Button>
                <Button variant="outlined" onClick={() => setTwoD(false)}>
                  Back to Measurements
                </Button>
              </>
            )}
          </div>

          <div className="mt-5" ref={containerRef}>
            <div
              style={{
                width: twoDdata.totalWidth * scale,
                height: 400,
                position: "relative",
                overflow: "visible",
              }}
            >
              <canvas
                ref={canvasRef}
                width={twoDdata.totalWidth}
                height={400}
                style={{
                  border: "1px solid black",
                  cursor: "pointer",
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                onClick={handleCanvasClick}
              />
            </div>
          </div>

          {/* Partitions List */}
          {twoDdata.partitions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Partitions:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border">Width</th>
                      <th className="py-2 px-4 border">Component Type</th>
                      <th className="py-2 px-4 border">Module</th>
                      <th className="py-2 px-4 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {twoDdata.partitions.map((partition, index) => (
                      <tr key={index}>
                        <td className="py-2 px-4 border">
                          {partition.width}mm
                        </td>
                        <td className="py-2 px-4 border">
                          {partition.componentType || category}
                        </td>
                        <td className="py-2 px-4 border">
                          {partition.module || "N/A"}
                        </td>
                        <td className="py-2 px-4 border">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditClick(index)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeletePartition(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Partition Details Dialog */}
          <Dialog
            open={partitionDetailsOpen}
            onClose={() => setPartitionDetailsOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Partition Details</DialogTitle>
            <DialogContent>
              {selectedPartitionIndex !== null &&
                twoDdata.partitions[selectedPartitionIndex] && (
                  <div>
                    <p>
                      <strong>Width:</strong>{" "}
                      {twoDdata.partitions[selectedPartitionIndex].width}mm
                    </p>
                    <p>
                      <strong>Component Type:</strong>{" "}
                      {
                        twoDdata.partitions[selectedPartitionIndex]
                          .componentType
                      }
                    </p>

                    {twoDdata.partitions[selectedPartitionIndex].module && (
                      <p>
                        <strong>Module:</strong>{" "}
                        {twoDdata.partitions[selectedPartitionIndex].module}
                      </p>
                    )}

                    {twoDdata.partitions[selectedPartitionIndex].details &&
                      twoDdata.partitions[selectedPartitionIndex].details
                        .length > 0 && (
                        <div className="mt-2">
                          <p>
                            <strong>Details:</strong>
                          </p>
                          <ul className="list-disc pl-5">
                            {twoDdata.partitions[
                              selectedPartitionIndex
                            ].details.map((detail, idx) => (
                              <li key={idx}>{detail.detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {twoDdata.partitions[selectedPartitionIndex].accessories &&
                      twoDdata.partitions[selectedPartitionIndex].accessories
                        .length > 0 && (
                        <div className="mt-2">
                          <p>
                            <strong>Accessories:</strong>
                          </p>
                          <ul className="list-disc pl-5">
                            {twoDdata.partitions[
                              selectedPartitionIndex
                            ].accessories.map((acc, idx) => (
                              <li key={idx}>
                                {typeof acc === "string" ? acc : acc.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {twoDdata.partitions[selectedPartitionIndex].price && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="font-bold">Price Information:</h4>
                        <p>
                          <strong>Base Price:</strong>{" "}
                          {twoDdata.partitions[selectedPartitionIndex].price
                            .base || 0}
                        </p>
                        {twoDdata.partitions[selectedPartitionIndex].price
                          .module > 0 && (
                          <p>
                            <strong>Module Price:</strong>{" "}
                            {
                              twoDdata.partitions[selectedPartitionIndex].price
                                .module
                            }
                          </p>
                        )}
                        {twoDdata.partitions[selectedPartitionIndex].price
                          .details > 0 && (
                          <p>
                            <strong>Details Price:</strong>{" "}
                            {
                              twoDdata.partitions[selectedPartitionIndex].price
                                .details
                            }
                          </p>
                        )}
                        {twoDdata.partitions[selectedPartitionIndex].price
                          .accessories > 0 && (
                          <p>
                            <strong>Accessories Price:</strong>{" "}
                            {
                              twoDdata.partitions[selectedPartitionIndex].price
                                .accessories
                            }
                          </p>
                        )}
                        <p className="font-bold mt-1">
                          <strong>Total Price:</strong>{" "}
                          {twoDdata.partitions[selectedPartitionIndex].price
                            .total || 0}
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPartitionDetailsOpen(false)}>
                Close
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  handleEditClick(selectedPartitionIndex);
                  setPartitionDetailsOpen(false);
                }}
              >
                Edit
              </Button>
              <Button
                color="error"
                onClick={() => {
                  handleDeletePartition(selectedPartitionIndex);
                  setPartitionDetailsOpen(false);
                }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default TwoD;
