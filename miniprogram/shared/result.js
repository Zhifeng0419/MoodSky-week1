const { API_VERSION } = require('./constants');
const { ERROR_CODES } = require('./contracts');
class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}
function success(requestId, data) {
  return { apiVersion: API_VERSION, requestId, ok: true, data };
}
function failure(requestId, code, message) {
  return { apiVersion: API_VERSION, requestId, ok: false, error: { code, message } };
}
function notImplemented() {
  throw new AppError(ERROR_CODES.NOT_IMPLEMENTED, '此功能正在开发，尚未保存或修改任何数据。');
}
module.exports = { AppError, success, failure, notImplemented };
