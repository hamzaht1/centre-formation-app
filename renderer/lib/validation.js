/**
 * Validation utilities for API routes
 */

/**
 * Validate that required fields exist in the request body
 * @param {string[]} fields - Array of required field names
 * @param {object} body - Request body
 * @returns {{ valid: boolean, missing?: string[] }}
 */
export function validateRequired(fields, body) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ''
  );
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
}

/**
 * Validate and parse an ID parameter
 * @param {string|number} id - The ID to validate
 * @returns {{ valid: boolean, id?: number, error?: string }}
 */
export function validateId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'ID invalide' };
  }
  return { valid: true, id: parsed };
}

/**
 * Validate that a value is a positive number
 * @param {*} value - The value to validate
 * @param {string} fieldName - Field name for error message
 * @param {{ allowZero?: boolean }} options
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validatePositiveNumber(value, fieldName, options = {}) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    return { valid: false, error: `${fieldName} doit être un nombre valide` };
  }
  if (options.allowZero ? parsed < 0 : parsed <= 0) {
    return {
      valid: false,
      error: `${fieldName} doit être ${options.allowZero ? 'positif ou zéro' : 'strictement positif'}`,
    };
  }
  return { valid: true, value: parsed };
}

/**
 * Validate that start date is before end date
 * @param {string|Date} start - Start date
 * @param {string|Date} end - End date
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Date de début invalide' };
  }
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Date de fin invalide' };
  }
  if (startDate >= endDate) {
    return {
      valid: false,
      error: 'La date de début doit être antérieure à la date de fin',
    };
  }
  return { valid: true };
}

/**
 * Validate that start time is before end time (string comparison "HH:MM")
 * @param {string} start - Start time "HH:MM"
 * @param {string} end - End time "HH:MM"
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTimeRange(start, end) {
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(start)) {
    return { valid: false, error: 'Heure de début invalide (format HH:MM)' };
  }
  if (!timeRegex.test(end)) {
    return { valid: false, error: 'Heure de fin invalide (format HH:MM)' };
  }
  // Normalize to "HH:MM" for correct comparison
  const normalize = (t) => {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  };
  if (normalize(start) >= normalize(end)) {
    return {
      valid: false,
      error: "L'heure de début doit être antérieure à l'heure de fin",
    };
  }
  return { valid: true };
}

/**
 * Validate that a value is within an allowed set
 * @param {*} value - The value to check
 * @param {string[]} allowed - Allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} doit être parmi: ${allowed.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Handle Prisma P2025 (record not found) errors
 * Returns true if the error was handled
 */
export function handlePrismaError(error, res) {
  if (error.code === 'P2025') {
    res.status(404).json({ error: 'Ressource non trouvée' });
    return true;
  }
  if (error.code === 'P2002') {
    res.status(400).json({ error: 'Conflit de données: enregistrement déjà existant' });
    return true;
  }
  return false;
}
