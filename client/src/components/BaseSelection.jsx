import React, { Suspense, useState } from "react";
import { useAuth } from "../context/Authcontext";

import RoomTypes from "./RoomTypes";
import KitchenShape from "./KitchenShape";
import { Button } from "@mui/material";
import AddRoomModal from "./AddRoom";
import OnsiteWork from "./OnsiteWork";

const BaseSelection = () => {
  const { quotationId, selectedKitchen, selectedRooms } = useAuth();
  const [open, setOpen] = useState(false);

  const createPayload = () => {
    const rooms = selectedRooms.map((room) => {
      if (room === "KITCHEN") {
        return { type: room, kitchen: selectedKitchen }; // Add kitchen shape only for "KITCHEN"
      }
      return { type: room }; // Other rooms without kitchen
    });

    return { rooms };
  };
  // Function to submit data

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Select Kitchen Shape</h2>
      <KitchenShape />
      <h2 className="text-xl font-bold mt-6 mb-4">Select Rooms</h2>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Custom Room
      </Button>

      <AddRoomModal
        open={open}
        onClose={() => setOpen(false)}
        quotationId={quotationId}
      />
      <RoomTypes refresh={open} />
    </div>
  );
};

export default BaseSelection;
