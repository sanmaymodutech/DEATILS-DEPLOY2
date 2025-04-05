import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";
import api from "../utils/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [twoDdata, settwoDdata] = useState(null);
  const [kitchenShapes, setKitchenShapes] = useState([]);
  const [roomTypes, setRoomTypes] = useState({});
  const [quotation, setQuotation] = useState(null);
  const [costSummary, setCostSummary] = useState(null);
  const [user, setUser] = useState(null);
  const [openTwoD, setTwoD] = React.useState(false);
  const [expanded, setExpanded] = React.useState("panel0");
  const [kitchenData, setKitchenData] = React.useState({ sections: {} });
  const [kitchenType, setKitchenType] = React.useState("SEMI_MODULAR"); // Kitchen type state
  const [kitchenRemainingWidths, setKitchenRemainingWidths] = useState({});

  const kitchenPricing = {
    carcass: ["BWP", "BWR", "COM_PLY"],
    finishs: ["WHITE", "FAB"],
    shutters: {
      BWP_WHITE: [],
      BWP_FAB_KITCHEN: [],
      BWR_WHITE: [],
      COM_PLY_WHITE: [],
      HDHMR_WHITE: [
        "ACRYLIC_GLOSSY",
        "ACRYLIC_MATTE",
        "PU",
        "ROUTED_PU",
        "GLAX",
      ],
    },
  };

  const RoomPricing = {
    carcass: ["BWP", "BWR", "COM_PLY"],
    finishs: ["WHITE", "FAB"],
    shutters: {
      BWP: [],
      BWR: [],
      COM_PLY: [],
      GLASS_PROFILE: ["FROSTED_GLASS"],
      HDHMR: ["ACRYLIC_GLOSSY", "ACRYLIC_MATTE", "PU", "ROUTED_PU", "GLAX"],
    },
  };

  const TV_UNIT_TYPES = {
    CARCASS_WITH_SHUTTERS: "CARCASS_WITH_SHUTTERS",
    OPEN_UNIT: "OPEN_UNIT",
    DRAWER: "Drawer",
    CARCASS_WITH_PROFILE_SHUTTER: "CARCASS_WITH_PROFILE_SHUTTER",
  };

  const shareQuotation = async (email, id) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        email: email,
        quotationId: id,
        pageUrl: window.location.href,
      };

      const response = await api.post("/quotations/quotation/share", payload);

      if (response.status === 200) {
        return { success: true, message: "Quotation shared successfully!" };
      }
    } catch (err) {
      setError("Failed to share quotation");
      console.error("Error sharing quotation:", err);
      return { success: false, message: "Failed to share quotation" };
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (sectionKey, category, field, value) => {
    setKitchenData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections?.[sectionKey],
          [category]: {
            ...prev.sections?.[sectionKey]?.[category],
            measurements: {
              ...prev.sections?.[sectionKey]?.[category]?.measurements,
              ...(field.startsWith("measurements.") && {
                [field.split(".")[1]]: value,
              }),
            },
            carcassType:
              field === "carcassType"
                ? value
                : prev.sections?.[sectionKey]?.[category]?.carcassType,
            shutterType: {
              ...prev.sections?.[sectionKey]?.[category]?.shutterType,
              ...(field.startsWith("shutterType.") && {
                [field.split(".")[1]]: value,
              }),
            },
          },
        },
      },
    }));
  };

  const handleKitchenTypeChange = () => {
    setKitchenType((prev) => {
      const newType = prev === "SEMI_MODULAR" ? "MODULAR" : "SEMI_MODULAR";

      setExpanded(expanded);

      setKitchenData((prevData) => {
        const updatedSections = Object.fromEntries(
          Object.entries(prevData.sections).map(([sectionKey, section]) => [
            sectionKey,
            {
              ...section,
              base: section.base
                ? {
                    ...section.base,
                    carcassType:
                      newType === "MODULAR"
                        ? section.base.carcassType || ""
                        : undefined,
                  }
                : undefined,
              wall: section.wall
                ? {
                    ...section.wall,
                    carcassType: section.wall.carcassType || "", // ✅ Always keep carcassType for wall
                  }
                : undefined,
              loft: section.loft
                ? {
                    ...section.loft,
                    carcassType:
                      newType === "MODULAR"
                        ? undefined
                        : section.loft.carcassType,
                  }
                : undefined,
            },
          ])
        );

        return { ...prevData, sections: updatedSections };
      });

      return newType;
    });
  };

  const handleSubmit = async () => {
    const cleanSections = Object.fromEntries(
      Object.entries(kitchenData.sections).map(([sectionKey, section]) => [
        sectionKey,
        Object.fromEntries(
          Object.entries(section)
            .filter(([_, details]) => details) // Ensure details exist
            .map(([category, details]) => [
              category,
              {
                ...details,
                measurements: details.measurements
                  ? Object.fromEntries(
                      Object.entries(details.measurements).filter(
                        ([_, v]) => v !== "" && v !== null
                      )
                    )
                  : undefined,
                carcassType: details.carcassType || undefined,
                shutterType: details.shutterType?.material
                  ? {
                      material: details.shutterType.material,
                      finish: details.shutterType.finish || undefined,
                    }
                  : undefined,
              },
            ])
        ),
      ])
    );

    const requestBody = {
      type: kitchenType,
      finish: "WHITE",
      sections: cleanSections,
    };

    console.log("Cleaned Request Body:", requestBody);

    try {
      const response = await api.put(
        `/quotations/${quotation?._id}/rooms/0/kitchen/calculate`,
        requestBody
      );
      if (response.data.success) {
        fetchQuotationById(quotation._id);
        toast.success("submit successfully!", { theme: "dark" });
      } else alert("Error updating quotation");
    } catch (error) {
      console.error("API error:", error);
      alert("An error occurred while updating the quotation.");
    }
  };

  const [selectedKitchen, setSelectedKitchen] = React.useState(
    quotation?.rooms[0]?.kitchen?.shape
  );

  React.useEffect(() => {
    if (quotation?.rooms[0]?.kitchen?.shape) {
      setSelectedKitchen(quotation?.rooms[0]?.kitchen?.shape);
    }
  }, [quotation]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const { data } = await api.get(`/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data.data);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const register = async (name, email, password) => {
    try {
      const res = await api.post(`/auth/register`, { name, email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err.response?.data?.error);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post(`/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch (err) {
      console.error("Login failed:", err.response?.data?.error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const [quotationId, setQuotationId] = useState(() => {
    const savedQuotationId = localStorage.getItem("quotationId");
    return savedQuotationId ? savedQuotationId : null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [step, setStep] = useState(() => {
    // Initialize step from localStorage if available, otherwise default to 1
    const savedStep = localStorage.getItem("currentStep");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const [selectedRooms, setSelectedRooms] = useState();

  useEffect(() => {
    // Save the current step to localStorage whenever it changes
    localStorage.setItem("currentStep", step);
  }, [step]);
  // Save quotationId to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("quotationId", quotationId);
  }, [quotationId]);

  const toggleRoomType = (room) => {
    setSelectedRooms((prevSelected) =>
      prevSelected.includes(room)
        ? prevSelected.filter((item) => item !== room)
        : [...prevSelected, room]
    );
  };

  useEffect(() => {
    if (roomTypes && Object.keys(roomTypes).length > 0) {
      setSelectedRooms(Object.keys(roomTypes));
    }
  }, [roomTypes]);

  const fetchKitchenShapes = useCallback(async () => {
    try {
      const { data } = await api.get(`/quotations/kitchen-shapes`);
      setKitchenShapes(data.data);
    } catch (error) {
      console.error("Error fetching kitchen shapes", error);
    }
  }, []);

  const fetchRoomTypes = useCallback(async () => {
    try {
      const { data } = await api.get(`/quotations/room-types`);
      setRoomTypes(data.data);
    } catch (error) {
      console.error("Error fetching room types", error);
    }
  }, []);

  const fetchBHKRoomTypes = useCallback(async () => {
    if (!quotation?._id) return;
    try {
      const { data } = await api.get(`/quotations/bhk-rooms/${quotation.bhk}`);

      // Filter out "KITCHEN" and store its shape separately
      const filteredRooms = {};
      let kitchenShape = "SINGLE_SLAB"; // Default value

      if (Array.isArray(data.data)) {
        data.data.forEach((room) => {
          const [key, value] = Object.entries(room)[0];

          if (key === "KITCHEN" && value.defaultShape) {
            kitchenShape = value.defaultShape;
          } else {
            filteredRooms[key] = value;
          }
        });
      }

      setRoomTypes(filteredRooms); // Store only non-kitchen rooms
    } catch (error) {
      console.error("Error fetching BHK room types", error);
    }
  }, [quotation]);

  const fetchQuotationById = useCallback(async (id) => {
    try {
      if (!id) return;
      const { data } = await api.get(`/quotations/${id}`);
      setQuotation(data?.data);
    } catch (error) {
      console.error("Error fetching quotation", error);
    }
  }, []);

  const fetchQuotationCostSummary = useCallback(async (id) => {
    try {
      if (!id) return;
      const { data } = await api.get(`/quotations/${id}/cost-summary`);
      setCostSummary(data?.data);
    } catch (error) {
      console.error("Error fetching quotation", error);
    }
  }, []);

  useEffect(() => {
    fetchKitchenShapes();
    fetchRoomTypes();
  }, [fetchKitchenShapes, fetchRoomTypes]);

  useEffect(() => {
    fetchQuotationCostSummary(quotationId);
  }, [quotationId, twoDdata]);

  useEffect(() => {
    if (quotationId) {
      fetchQuotationById(quotationId);
    }
  }, [
    quotationId,
    step,
    selectedKitchen,
    kitchenRemainingWidths,
    fetchQuotationById,
  ]);

  useEffect(() => {
    if (quotation?._id) {
      fetchBHKRoomTypes();
    }
  }, [quotation, fetchBHKRoomTypes]);
  useEffect(() => {
    const fetchCustomers = async () => {
      if (fetched) return;
      try {
        const response = await api.get(`/quotations`);
        setCustomers(response?.data?.data);
        setFetched(true);
      } catch (err) {
        setError("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [fetched]);

  const addCustomer = (newCustomer) => {
    setCustomers((prevCustomers) => [newCustomer, ...prevCustomers]);
    if (step !== 2) {
      setStep(2);
    }
  };

  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

  const nextStep = (id) => {
    setStep((prev) => (prev < 4 ? prev + 1 : prev));
  };

  const viewQuote = (id) => {
    setStep((prev) => (prev < 4 ? prev + 1 : prev));
    setQuotationId(id);
  };

  const saveAndNext = () => {
    // handleSubmit();
    setStep((prev) => (prev < 4 ? prev + 1 : prev));
  };
  const clearStep = () => {
    localStorage.removeItem("currentStep");
    localStorage.removeItem("quotationId");
  };

  const value = {
    customers,
    loading,
    user,
    register,
    login,
    logout,
    shareQuotation,
    saveAndNext,
    addCustomer,
    twoDdata,
    settwoDdata,
    selectedKitchen,
    openTwoD,
    setTwoD,
    setQuotationId,
    expanded,
    setExpanded,
    kitchenData,
    setKitchenData,
    costSummary,
    setStep,
    kitchenType,
    kitchenPricing,
    kitchenRemainingWidths,
    setKitchenRemainingWidths,
    TV_UNIT_TYPES,
    handleChange,
    handleKitchenTypeChange,
    handleSubmit,
    setSelectedKitchen,
    quotationId,
    selectedRooms,
    setCustomers,
    toggleRoomType,
    kitchenShapes,
    RoomPricing,
    roomTypes,
    step,
    viewQuote,
    quotation,
    nextStep,
    prevStep,
    setQuotation,
    fetchQuotationById,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
