// Walidacja danych wejściowych za pomocą schematów Zod.
// Niepoprawne dane nie dochodzą do bazy – od razu zwracamy 400.

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Niepoprawne dane',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.body = result.data; // tylko pola zdefiniowane w schemacie
    next();
  };
}

export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
