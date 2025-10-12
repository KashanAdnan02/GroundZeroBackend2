const { connectDB, disconnectDB, getConnectionState } = require('./database');

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionState
};