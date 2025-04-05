import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";
import TwoD from "./TwoD";
import RoomMeasurements from "./Roommeasurements";
import OnsiteWork from "./OnsiteWork";

export default function KitchenMeasurements() {
  const {
    expanded,
    setExpanded,
    kitchenData,
    kitchenType,
    kitchenPricing,
    handleChange,
    setKitchenData,
    quotation,
    handleKitchenTypeChange,
    handleSubmit,
  } = useAuth();

  const [selectedSection, setSelectedSection] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [openTwoD, setTwoD] = React.useState(false);

  const allRooms = [
    ...(quotation?.rooms || []),
    ...(quotation?.customRooms || []),
  ];

  const selectedRooms = allRooms.filter((room) => room.selected);

  // Function to check if existing values are present
  const hasExistingValues = (section, category) => {
    const categoryData = section[category];
    if (!categoryData?.measurements) return false;

    const hasMeasurements =
      categoryData.measurements.width &&
      categoryData.measurements.depth &&
      categoryData.measurements.height;

    const hasShutterMaterial = categoryData.shutterType?.material;

    const needsShutterFinish =
      categoryData.shutterType?.material === "HDHMR_WHITE";
    const hasShutterFinish =
      !needsShutterFinish || categoryData.shutterType?.finish;

    const needsCarcassType =
      kitchenType === "MODULAR" && category !== "loft" && category !== "base";
    const hasCarcassType = !needsCarcassType || categoryData.carcassType;

    return (
      hasMeasurements &&
      hasShutterMaterial &&
      hasShutterFinish &&
      hasCarcassType
    );
  };

  // Function to determine if Define button should be enabled
  const shouldEnableDefine = (sectionKey, category, section) => {
    return hasExistingValues(section, category);
  };

  const handleView = (Section, Category) => {
    setSelectedSection(Section);
    setSelectedCategory(Category);
    setTwoD(true);
  };

  return (
    <div>
      {selectedRooms.map((room, index) => (
        <Accordion
          key={room._id || index}
          expanded={expanded === `panel${index}`}
          onChange={() =>
            setExpanded(expanded === `panel${index}` ? false : `panel${index}`)
          }
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <h2 className="font-bold text-xl me-4">
              {room.type} {room.label ? `- ${room.label}` : ""}
            </h2>
          </AccordionSummary>
          <AccordionDetails>
            {room.type === "Kitchen" && openTwoD ? (
              <TwoD
                setTwoD={setTwoD}
                sectionKey={selectedSection}
                quotationID={quotation._id}
                category={selectedCategory}
              />
            ) : (
              <>
                {!openTwoD && room.type === "Kitchen" && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={kitchenType === "MODULAR"}
                        onChange={handleKitchenTypeChange}
                        color="primary"
                      />
                    }
                    label={
                      kitchenType === "SEMI_MODULAR"
                        ? "Semi-Modular"
                        : "Modular"
                    }
                    className="mb-4"
                  />
                )}

                {room.type === "Kitchen" &&
                  !openTwoD &&
                  Object.entries(room.kitchen.sections)
                    .filter(([_, section]) =>
                      ["base", "wall", "loft"].some(
                        (category) => section[category]?.measurements
                      )
                    )
                    .map(([sectionKey, section]) => (
                      <div key={sectionKey} className="mb-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Section {sectionKey}
                        </h3>
                        {["base", "wall", "loft"]
                          .filter((category) => section[category]?.measurements)
                          .map((category) => (
                            <div
                              key={category}
                              className="flex items-center gap-4 mt-2"
                            >
                              <h4 className="font-bold">
                                {category.toUpperCase()}
                              </h4>

                              {/* Measurement Inputs */}
                              {["width", "depth", "height"].map((dim) => (
                                <TextField
                                  key={dim}
                                  className="w-[150px]"
                                  label={
                                    dim.charAt(0).toUpperCase() + dim.slice(1)
                                  }
                                  type="number"
                                  size="small"
                                  variant="outlined"
                                  value={
                                    kitchenData.sections?.[sectionKey]?.[
                                      category
                                    ]?.measurements?.[dim] ||
                                    section[category]?.measurements?.[dim] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleChange(
                                      sectionKey,
                                      category,
                                      `measurements.${dim}`,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              ))}

                              {kitchenType === "MODULAR" &&
                                category !== "loft" &&
                                category !== "base" && (
                                  <TextField
                                    select
                                    label="Carcass Type"
                                    variant="outlined"
                                    className="w-[150px]"
                                    size="small"
                                    value={
                                      kitchenData.sections?.[sectionKey]?.[
                                        category
                                      ]?.carcassType ||
                                      section[category]?.carcassType ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleChange(
                                        sectionKey,
                                        category,
                                        "carcassType",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <MenuItem value="">Select Carcass</MenuItem>
                                    {kitchenPricing.carcass.map((type) => (
                                      <MenuItem key={type} value={type}>
                                        {type}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}

                              {/* Shutter Material Dropdown */}
                              <TextField
                                select
                                label="Shutter Material"
                                variant="outlined"
                                size="small"
                                className="w-[180px]"
                                value={
                                  kitchenData.sections?.[sectionKey]?.[category]
                                    ?.shutterType?.material ||
                                  section[category]?.shutterType?.material ||
                                  ""
                                }
                                onChange={(e) =>
                                  handleChange(
                                    sectionKey,
                                    category,
                                    "shutterType.material",
                                    e.target.value
                                  )
                                }
                              >
                                <MenuItem value="">
                                  Select Shutter Material
                                </MenuItem>
                                {Object.keys(kitchenPricing.shutters).map(
                                  (shutter) => (
                                    <MenuItem key={shutter} value={shutter}>
                                      {shutter}
                                    </MenuItem>
                                  )
                                )}
                              </TextField>

                              {kitchenData.sections?.[sectionKey]?.[category]
                                ?.shutterType?.material === "HDHMR_WHITE" && (
                                <TextField
                                  select
                                  label="Shutter Finish"
                                  className="w-[150px]"
                                  variant="outlined"
                                  size="small"
                                  value={
                                    kitchenData.sections?.[sectionKey]?.[
                                      category
                                    ]?.shutterType?.finish ||
                                    section[category]?.shutterType?.finish ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleChange(
                                      sectionKey,
                                      category,
                                      "shutterType.finish",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="">Select Finish</MenuItem>
                                  {kitchenPricing.shutters["HDHMR_WHITE"].map(
                                    (finish) => (
                                      <MenuItem key={finish} value={finish}>
                                        {finish}
                                      </MenuItem>
                                    )
                                  )}
                                </TextField>
                              )}

                              <Button
                                variant="contained"
                                disabled={
                                  !shouldEnableDefine(
                                    sectionKey,
                                    category,
                                    section
                                  )
                                }
                                onClick={() => {
                                  handleView(sectionKey, category);
                                }}
                                color="primary"
                              >
                                Define
                              </Button>

                              {section[category]?.measurements?.width !== 0 && (
                                <span className="ml-2 text-sm text-gray-600">
                                  Remaining:{" "}
                                  {section[category]?.remainingWidth ==
                                  undefined
                                    ? section[category]?.measurements?.width
                                    : section[category]?.remainingWidth}
                                  mm
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    ))}

                {room.type === "Kitchen" && !openTwoD && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      handleSubmit();
                      setKitchenData({ ...kitchenData });
                    }}
                  >
                    Submit Measurements
                  </Button>
                )}

                {room.type !== "Kitchen" && (
                  <RoomMeasurements roomIndex={index} name={room.type} />
                )}
              </>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
      <OnsiteWork />
    </div>
  );
}
