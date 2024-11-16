"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const queryRoutes_1 = __importDefault(require("./routes/queryRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Rest Endpoint
app.get("/", (req, res) => {
    return res.send("Hello, world!");
});
// Routes
app.use("/api", queryRoutes_1.default);
// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
