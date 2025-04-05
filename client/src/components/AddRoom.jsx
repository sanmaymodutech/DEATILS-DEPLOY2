import React, { useState } from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";
import api from "../utils/api";

export default function AddRoomModal({ open, onClose, quotationId,  }) {
  const [roomType, setRoomType] = useState("");
  const [roomLabel, setRoomLabel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!roomType.trim() || !roomLabel.trim()) return;

    setLoading(true);
    try {
      console.log(roomType);
      const { data } = await api.post(
        `${import.meta.env.VITE_API_BASE_URL}/quotations/${quotationId}/custom-rooms`,
        { type: roomType, label: roomLabel }
      );

      onClose();
      setRoomType("");
      setRoomLabel("");
    } catch (error) {
      console.error("Error adding room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Add Custom Room
        </Typography>

        <TextField
          fullWidth
          label="Room Type"
          variant="outlined"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Room Label"
          variant="outlined"
          value={roomLabel}
          onChange={(e) => setRoomLabel(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Room"}
        </Button>
      </Box>
    </Modal>
  );
}
