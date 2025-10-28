// Zod validator middleware
export const validate = (zodSchema) => (req, _res, next) => {
  try {
    req.validated = zodSchema.parse(req.body);
    next();
  } catch (err) {
    err.status = 400;
    next(err);
  }
};
