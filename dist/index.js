"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes/routes"));
const rabbitmq_1 = require("./services/rabbitmq");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Rest Endpoint
app.get("/", (req, res) => {
    return res.send("Hello, world!");
});
// Ensure RabbitMQ connection is established before handling requests
(0, rabbitmq_1.connectToRabbitMQ)().then(() => {
    // Your routes after RabbitMQ connection is initialized
    app.use('/api', routes_1.default);
    // Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error("Failed to start server:", error);
});
