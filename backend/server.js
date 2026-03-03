import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
connectDB();

app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads")); // serve static images
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Admin Panel (accessed at /admin)
app.use("/admin", express.static(path.join(__dirname, "../admin/dist")));
app.get("/admin/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../admin/dist/index.html"));
});

// Serve Frontend (accessed at /)
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
});

app.listen(port, () => console.log(`Server started on http://localhost:${port}`));
