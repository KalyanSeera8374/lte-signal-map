export const notFound = (_req, res, _next) => {
  res.status(404).json({ error: "Not Found" });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  // Optionally log full error in dev:
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("ERROR:", err);
  }
  res.status(status).json({ error: message });
};
