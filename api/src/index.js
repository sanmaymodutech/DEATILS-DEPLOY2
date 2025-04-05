const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const { router: onsiteRoutes } = require("./routes/onsiteRoutes");
const cors = require("cors");

const app = express();

connectDB();

app.use(express.json());

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.FRONTEND_URL];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/quotation/onsite-work", onsiteRoutes);
app.use("/api/auth", require("./routes/authRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
