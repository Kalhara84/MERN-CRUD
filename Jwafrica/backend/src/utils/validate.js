const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Real calendar date in the format YYYY-MM-DD
function isValidDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Required text with a maximum length
function requiredText(value, label, max) {
  if (isBlank(value)) return `${label} is required`;
  if (String(value).trim().length > max) return `${label} must be ${max} characters or less`;
  return null;
}

// Optional text with a maximum length
function optionalText(value, label, max) {
  if (isBlank(value)) return null;
  if (String(value).trim().length > max) return `${label} must be ${max} characters or less`;
  return null;
}

// Whole number (required)
function requiredInt(value, label) {
  if (isBlank(value)) return `${label} is required`;
  if (!/^-?\d+$/.test(String(value).trim())) return `Enter a whole number for ${label}`;
  return null;
}

function requiredDate(value, label) {
  if (isBlank(value)) return `${label} is required`;
  if (!isValidDate(String(value).trim())) return `Enter a valid ${label}`;
  return null;
}

// Combo box value: must be a number that exists in the allowed id list
function requiredChoice(value, label, allowedIds) {
  if (isBlank(value)) return `${label} is required`;
  const id = Number(value);
  if (!Number.isInteger(id) || !allowedIds.has(id)) return `Select a valid ${label}`;
  return null;
}

// Collects errors: errs.add('field', message) ignores null messages
function errorBag() {
  const errors = {};
  return {
    errors,
    add(field, message) {
      if (message && !errors[field]) errors[field] = message;
    },
    hasErrors: () => Object.keys(errors).length > 0,
  };
}

module.exports = { isBlank, isValidDate, requiredText, optionalText, requiredInt, requiredDate, requiredChoice, errorBag };
