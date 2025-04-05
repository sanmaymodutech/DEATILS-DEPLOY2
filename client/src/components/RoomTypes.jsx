import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api";
import { FormControlLabel, Switch } from "@mui/material";

export default function RoomTypes({ refresh }) {
  const { quotation } = useAuth();
  const [rooms, setRooms] = React.useState([]); // Store rooms separately
  const [labels, setLabels] = React.useState({}); // Stores input values
  const [onsiteWorkEnabled, setOnsiteWorkEnabled] = React.useState(false);

  // Fetch quotation data on mount
  React.useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await api.get(
          `${import.meta.env.VITE_API_BASE_URL}/quotations/${quotation._id}`
        );

        const combinedRooms = [
          ...response.data.data.rooms,
          ...response.data.data.customRooms,
        ];

        setRooms(combinedRooms); // Use rooms from API response
        setOnsiteWorkEnabled(response.data.data.onsiteWorkEnabled || false);
      } catch (error) {
        console.error("Error fetching quotation:", error);
      }
    };

    if (quotation?._id) {
      fetchQuotation();
    }
  }, [quotation?._id, refresh]);

  const isCustomRoom = (index) => index >= quotation.rooms.length;

  // Toggle Room Selection
  const toggleRoomSelection = async (roomIndex) => {
    try {
      const updatedRooms = rooms.map((room, index) =>
        index === roomIndex ? { ...room, selected: !room.selected } : room
      );
      setRooms(updatedRooms);

      const isCustom = isCustomRoom(roomIndex);
      const endpoint = isCustom
        ? `/quotations/${quotation._id}/customRooms/${
            roomIndex - quotation.rooms.length
          }/selection`
        : `/quotations/${quotation._id}/rooms/${roomIndex}/selection`;

      await api.patch(endpoint, {
        selected: updatedRooms[roomIndex].selected,
      });
    } catch (error) {
      console.error("Error updating room selection:", error);
    }
  };

  // Handle Label Change
  const handleLabelChange = (roomIndex, value) => {
    setLabels((prev) => ({
      ...prev,
      [roomIndex]: value,
    }));
  };

  // Update Room Label
  const updateLabel = async (roomIndex) => {
    if (!labels[roomIndex]?.trim()) return;

    try {
      const updatedRooms = rooms.map((room, index) =>
        index === roomIndex ? { ...room, label: labels[roomIndex] } : room
      );
      setRooms(updatedRooms);

      const isCustom = isCustomRoom(roomIndex);
      const endpoint = isCustom
        ? `/quotations/${quotation._id}/customRooms/${
            roomIndex - quotation.rooms.length
          }/label`
        : `/quotations/${quotation._id}/rooms/${roomIndex}/label`;

      await api.patch(endpoint, {
        label: labels[roomIndex],
      });

      setLabels((prev) => ({
        ...prev,
        [roomIndex]: "",
      }));
    } catch (error) {
      console.error("Error updating room label:", error);
    }
  };

  const toggleOnsiteWork = async () => {
    try {
      const newValue = !onsiteWorkEnabled;
      setOnsiteWorkEnabled(newValue);

      await api.patch(
        `${import.meta.env.VITE_API_BASE_URL}/quotations/${
          quotation._id
        }/enable-onsite-work`,
        {
          enabled: newValue,
        }
      );
    } catch (error) {
      console.error("Error updating onsite work status:", error);
      // Revert UI state if API call fails
      setOnsiteWorkEnabled(!onsiteWorkEnabled);
    }
  };

  return (
    <>
      <List sx={{ width: "100%", maxWidth: 700, bgcolor: "background.paper" }}>
        {rooms.map((room, index) =>
          room.type?.toLowerCase() === "kitchen" ? null : ( // Hide Kitchen without filtering it out
            <ListItem
              key={room._id}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <Checkbox
                edge="start"
                checked={room.selected}
                onChange={() => toggleRoomSelection(index)}
                inputProps={{
                  "aria-labelledby": `switch-list-label-${room.type || "Room"}`,
                }}
              />
              <ListItemText
                id={`switch-list-label-${room.type}`}
                primary={`${room.type || "Room"} ${
                  room.label ? `- ${room.label}` : ""
                }`}
              />
              <TextField
                label="Label"
                variant="outlined"
                size="small"
                value={labels[index] || ""}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                sx={{ width: "120px" }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => updateLabel(index)}
              >
                Update
              </Button>
            </ListItem>
          )
        )}
      </List>
      <div className="mt-6 mb-4">
        <FormControlLabel
          control={
            <Switch
              checked={onsiteWorkEnabled}
              onChange={toggleOnsiteWork}
              color="primary"
            />
          }
          label="Enable Onsite Work"
        />
      </div>
    </>
  );
}
