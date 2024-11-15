// src/app.ts
import express from "express";
import queryRoutes from "./routes/queryRoutes";

const app = express();

// Middleware
app.use(express.json());

// Rest Endpoint
app.get("/", (req: any, res: any) => {
  return res.send("Hello, world!");
});

// Routes
app.use("/api", queryRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
