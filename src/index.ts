// src/app.ts
import express from "express";
import routes from './routes/routes';
import { connectToRabbitMQ } from "./rabbitmq";

const app = express();

// Middleware
app.use(express.json());

// Rest Endpoint
app.get("/", (req: any, res: any) => {
  return res.send("Hello, world!");
});

// Ensure RabbitMQ connection is established before handling requests
connectToRabbitMQ().then(() => {

  // Your routes after RabbitMQ connection is initialized
  app.use('/api', routes);

  // Server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error("Failed to start server:", error);
});


