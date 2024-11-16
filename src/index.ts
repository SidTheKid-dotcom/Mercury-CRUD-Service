// src/app.ts
import express from "express";
import routes from './routes/routes';

const app = express();

// Middleware
app.use(express.json());

// Rest Endpoint
app.get("/", (req: any, res: any) => {
  return res.send("Hello, world!");
});

// Routes
app.use('/api', routes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
