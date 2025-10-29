import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json({ limit: "256kb" }));
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
