import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Checkbox from "@mui/material/Checkbox";
import Avatar from "@mui/material/Avatar";
import ukitchenImg from "../assets/images/U.png";
import gkitchenImg from "../assets/images/G-shape.png";
import lkitchenImg from "../assets/images/L-shape.png";
import parallelkitchenImg from "../assets/images/Parallel.png";
import iplatformkitchen from "../assets/images/Single_Slab.png";
import { useAuth } from "../context/Authcontext";
import api from "../utils/api"; // Import your API utility

export default function KitchenShape() {
  const { quotation, kitchenShapes, selectedKitchen, setSelectedKitchen } =
    useAuth();

  const kitchenImages = {
    U_SHAPE: ukitchenImg,
    G_SHAPE: gkitchenImg,
    L_SHAPE: lkitchenImg,
    PARALLEL: parallelkitchenImg,
    SINGLE_SLAB: iplatformkitchen,
  };

  const handleToggle = async (key) => {
    try {
      // Send API request to update kitchen shape
      const { data } = await api.patch(
        `/quotations/${quotation._id}/rooms/0/kitchen-shape`,
        { shape: key }
      );

      // Update state only if API is successful
      setSelectedKitchen(key);
    } catch (error) {
      console.error("Error updating kitchen shape:", error);
    }
  };

  return (
    <List className="flex" sx={{ bgcolor: "background.paper" }}>
      {Object.entries(kitchenShapes).map(([key, value]) => (
        <ListItem className="border-2 border-gray-300 ms-0 m-2" key={key}>
          <Checkbox
            edge="start"
            checked={selectedKitchen === value}
            onChange={() => handleToggle(value)}
            inputProps={{
              "aria-labelledby": `switch-list-label-${key}`,
            }}
          />
          <ListItemAvatar>
            {key !== "NONE" && kitchenImages[key] ? (
              <Avatar variant="square" alt={value} src={kitchenImages[key]} />
            ) : (
              <Avatar variant="square">{value}</Avatar>
            )}
          </ListItemAvatar>
          <ListItemText id={`switch-list-label-${key}`} primary={value} />
        </ListItem>
      ))}
    </List>
  );
}
