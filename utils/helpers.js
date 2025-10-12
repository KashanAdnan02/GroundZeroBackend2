const generateBookingId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const calculateVerificationExpiry = (minutes = 15) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const formatErrorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return response;
};

const formatSuccessResponse = (message, data = null) => {
  const response = {
    success: true,
    message
  };
  if (data) {
    response.data = data;
  }
  return response;
};

const getPaginationData = (page, limit, total) => {
  return {
    current: parseInt(page),
    pages: Math.ceil(total / limit),
    total
  };
};

module.exports = {
  generateBookingId,
  generateVerificationCode,
  calculateVerificationExpiry,
  isValidObjectId,
  formatErrorResponse,
  formatSuccessResponse,
  getPaginationData
};