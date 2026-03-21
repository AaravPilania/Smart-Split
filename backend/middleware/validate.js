/**
 * Generic Zod validation middleware.
 * Usage: router.post('/route', auth, validate(schema), handler)
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const errors = issues.map((e) => ({
        field: e.path.join('.') || 'body',
        message: e.message,
      }));
      return res.status(400).json({
        message: errors[0]?.message || 'Validation failed',
        errors,
      });
    }
    // Replace body with coerced/defaulted Zod output
    req.body = result.data;
    next();
  };
}

module.exports = validate;
