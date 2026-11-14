const env = require('../config/env');
const { HttpError } = require('../utils/httpError');

const notFound = (req, res) => res.status(404).json({ message: 'Not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...err.extra });
  }

  // Unique key broken (two people saved the same code at the same time)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({ message: 'Duplicate value', errors: { __all__: 'This value already exists' } });
  }

  // Bad JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  console.error(err);
  res.status(500).json({ message: env.nodeEnv === 'production' ? 'Server error' : err.message });
};

module.exports = { notFound, errorHandler };
