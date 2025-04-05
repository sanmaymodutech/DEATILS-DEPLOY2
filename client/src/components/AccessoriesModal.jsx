import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../utils/api";
import { Trash2, Edit } from "lucide-react";

const AccessoriesModal = ({
  open,
  onClose,
  quotationId,
  roomIndex,
  componentType,
  componentIndex,
}) => {
  // State for form inputs
  const [accessoryType, setAccessoryType] = useState("");
  const [dimension, setDimension] = useState("");
  const [finish, setFinish] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [accessories, setAccessories] = useState([]);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [editingAccessoryIndex, setEditingAccessoryIndex] = useState(null);

  // State for available options
  const [accessoryOptions, setAccessoryOptions] = useState([]);

  useEffect(() => {
    const fetchExistingAccessories = async () => {
      if (!open || !componentType || componentIndex === null) return;

      try {
        const response = await api.get(
          `/quotations/${quotationId}/rooms/${roomIndex}/${componentType}/${componentIndex}/accessories`
        );

        if (response.data.success) {
          setAccessories(response.data.data.accessories || []);
        } else {
          toast.error("Failed to load existing accessories");
        }
      } catch (error) {
        console.error("Error fetching existing accessories:", error);
        toast.error("Failed to load existing accessories");
      }
    };

    fetchExistingAccessories();
  }, [open, quotationId, roomIndex, componentType, componentIndex]);

  // Fetch accessory options based on component type
  useEffect(() => {
    const fetchAccessoryOptions = async () => {
      if (!open || !componentType) return;

      try {
        const response = await api.get(
          `/quotations/accessories/${componentType}`
        );
        console.log("Accessory Options Response:", response.data);

        if (response.data.success) {
          const accessories = response.data.data?.accessories || [];
          console.log("Accessories:", accessories);
          setAccessoryOptions(accessories);
        } else {
          toast.error("Failed to load accessory options");
          setAccessoryOptions([]);
        }
      } catch (error) {
        console.error("Error fetching accessory options:", error);
        toast.error("Failed to load accessory options");
        setAccessoryOptions([]);
      }
    };

    fetchAccessoryOptions();
  }, [open, componentType]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Only reset if not in editing mode
      if (editingAccessoryIndex === null) {
        resetForm();
      }
    }
  }, [open, editingAccessoryIndex]);

  useEffect(() => {
    if (!open) {
      resetForm();
      setEditingAccessoryIndex(null);
    }
  }, [open]);

  useEffect(() => {
    console.log("State Changed:", {
      accessoryType,
      dimension,
      finish,
      quantity,
      editingAccessoryIndex,
      selectedAccessory,
    });
  }, [
    accessoryType,
    dimension,
    finish,
    quantity,
    editingAccessoryIndex,
    selectedAccessory,
  ]);

  const resetForm = () => {
    setAccessoryType("");
    setDimension("");
    setFinish("");
    setQuantity(1);
    setSelectedAccessory(null);
    setEditingAccessoryIndex(null);
  };

  const handleAccessoryTypeChange = (type) => {
    const accessory = accessoryOptions.find((acc) => acc.type === type);
    setAccessoryType(type);
    setSelectedAccessory(accessory);
    // Reset dependent fields
    setDimension("");
    setFinish("");
  };

  const handleDimensionChange = (dim) => {
    setDimension(dim);
    // Reset finish
    setFinish("");
  };
  const handleEditAccessory = (index) => {
    // Log the entire context of the edit action
    console.log("Edit Clicked - Full Context:", {
      index,
      accessories: accessories,
      accessoryOptions: accessoryOptions,
      currentState: {
        accessoryType,
        dimension,
        finish,
        quantity,
        editingAccessoryIndex,
      },
    });

    // Ensure accessories array exists and the index is valid
    if (!accessories || index < 0 || index >= accessories.length) {
      console.error("Invalid accessory index:", index);
      toast.error("Invalid accessory selection");
      return;
    }

    const accessoryToEdit = accessories[index];

    console.log("Accessory to Edit:", accessoryToEdit);

    // Find the corresponding accessory option for the selected accessory
    const correspondingOption = accessoryOptions.find(
      (option) => option.type === accessoryToEdit.type
    );

    console.log("Corresponding Option:", correspondingOption);

    // Set state for editing
    setAccessoryType(accessoryToEdit.type);
    setDimension(accessoryToEdit.dimension);
    setFinish(accessoryToEdit.finish);
    setQuantity(accessoryToEdit.quantity);
    setSelectedAccessory(correspondingOption);
    setEditingAccessoryIndex(index);

    // Immediate log after state setting to verify
    console.log("State After Edit Setup:", {
      accessoryType: accessoryToEdit.type,
      dimension: accessoryToEdit.dimension,
      finish: accessoryToEdit.finish,
      quantity: accessoryToEdit.quantity,
      editingIndex: index,
    });
  };
  // Handle accessory submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!accessoryType || !dimension || !finish) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      let response;
      if (editingAccessoryIndex !== null) {
        // Update existing accessory
        response = await api.patch(
          `/quotations/${quotationId}/rooms/${roomIndex}/${componentType}/${componentIndex}/accessories/${editingAccessoryIndex}`,
          {
            dimension,
            finish,
            quantity,
          }
        );
      } else {
        // Add new accessory
        response = await api.put(
          `/quotations/${quotationId}/rooms/${roomIndex}/${componentType}/${componentIndex}/accessories`,
          {
            accessoryType,
            dimension,
            finish,
            quantity,
          }
        );
      }

      // Success handling
      toast.success(
        editingAccessoryIndex !== null
          ? "Accessory updated successfully"
          : "Accessory added successfully"
      );

      // Refresh accessories list
      const updatedAccessories = response.data.data.allAccessories || [];
      setAccessories(updatedAccessories);

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error adding/updating accessory:", error);
      toast.error(
        error.response?.data?.error || "Failed to add/update accessory"
      );
    }
  };

  // Handle delete of an accessory
  const handleDeleteAccessory = async (index) => {
    try {
      const response = await api.delete(
        `/quotations/${quotationId}/rooms/${roomIndex}/${componentType}/${componentIndex}/accessories/${index}`
      );

      // Success handling
      toast.success("Accessory deleted successfully");

      // Update accessories list
      const updatedAccessories = response.data.data.remainingAccessories || [];
      setAccessories(updatedAccessories);
    } catch (error) {
      console.error("Error deleting accessory:", error);
      toast.error(error.response?.data?.error || "Failed to delete accessory");
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedAccessory || !dimension || !finish) return 0;

    // Handle bed accessories (which have a different structure)
    if (componentType === "beds") {
      return (selectedAccessory.price || 0) * quantity;
    }

    // Handle other accessories
    if (!selectedAccessory.pricing) return 0;

    const dimensionPrice =
      selectedAccessory.pricing.dimensionPrices[dimension] || 0;
    const finishPrice =
      selectedAccessory.pricing.finishAdditionalPrices[finish] || 0;

    return (dimensionPrice + finishPrice) * quantity;
  };

  // Dynamically generate options for dropdowns
  const generateOptions = (options = []) =>
    options.length > 0 ? (
      options.map((option) => (
        <option key={option} value={option}>
          {option.replace(/_/g, " ")}
        </option>
      ))
    ) : (
      <option value="">No options available</option>
    );

  // Render conditionally if modal is not open
  if (!open) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingAccessoryIndex !== null ? "Edit" : "Add"} Accessories
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Accessory Type Dropdown (only for new accessories) */}
          {editingAccessoryIndex === null && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Accessory Type
              </label>
              <select
                value={accessoryType}
                onChange={(e) => {
                  const type = e.target.value;
                  const accessory = accessoryOptions.find(
                    (acc) => acc.type === type
                  );
                  setAccessoryType(type);
                  setSelectedAccessory(accessory);
                  // Reset dependent fields
                  setDimension("");
                  setFinish("");
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Accessory Type</option>
                {accessoryOptions && accessoryOptions.length > 0 ? (
                  accessoryOptions.map((accessory) => (
                    <option key={accessory.type} value={accessory.type}>
                      {accessory.type.replace(/_/g, " ")}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No accessories available
                  </option>
                )}
              </select>
            </div>
          )}

          {/* Dimension Dropdown */}
          {(editingAccessoryIndex !== null || selectedAccessory) && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Dimension
              </label>
              <select
                value={dimension}
                onChange={(e) => {
                  setDimension(e.target.value);
                  // Reset finish when dimension changes
                  setFinish("");
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Dimension</option>
                {editingAccessoryIndex !== null
                  ? selectedAccessory?.availableDimensions?.map((dim) => (
                      <option key={dim} value={dim}>
                        {dim}
                      </option>
                    ))
                  : (selectedAccessory?.availableDimensions || []).map(
                      (dim) => (
                        <option key={dim} value={dim}>
                          {dim}
                        </option>
                      )
                    )}
              </select>
            </div>
          )}

          {/* Finish Dropdown */}
          {dimension && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Finish</label>
              <select
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Finish</option>
                {selectedAccessory?.availableFinishes?.map((fin) => (
                  <option key={fin} value={fin}>
                    {fin}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              min="1"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Price Preview */}
          {finish && (
            <div className="mb-4 text-sm">
              <p>Total Price: ₹{calculateTotalPrice()}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editingAccessoryIndex !== null ? "Update" : "Add"} Accessory
            </button>
          </div>
        </form>

        {/* Accessories Table */}
        {accessories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Added Accessories</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-left">Type</th>
                  <th className="p-2 border text-left">Dimension</th>
                  <th className="p-2 border text-left">Finish</th>
                  <th className="p-2 border text-left">Quantity</th>
                  <th className="p-2 border text-left">Total Price</th>
                  <th className="p-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessories.map((accessory, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      {accessory.type.replace(/_/g, " ")}
                    </td>
                    <td className="p-2 border">{accessory.dimension}</td>
                    <td className="p-2 border">{accessory.finish}</td>
                    <td className="p-2 border">{accessory.quantity}</td>
                    <td className="p-2 border">₹{accessory.totalPrice}</td>
                    <td className="p-2 border text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditAccessory(index)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label="Edit Accessory"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccessory(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Delete Accessory"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessoriesModal;
