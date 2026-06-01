import express from "express";
import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT is not set");
}

const app = express();

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to Reckoning API",
    description: "The server is up and running.",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
