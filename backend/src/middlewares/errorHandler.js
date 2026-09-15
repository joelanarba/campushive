const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (
    error.type === "entity.parse.failed" ||
    error.type === "entity.too.large"
  ) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }
  if (error.status === 409) {
    return res
      .status(409)
      .json({ message: "An account with this email already exists" });
  }
  // Error objects can contain database inputs, so log only request metadata.
  console.error("Request failed", { method: req.method, path: req.path });
  return res.status(500).json({ message: "An unexpected error occurred" });
};
module.exports = { errorHandler };
