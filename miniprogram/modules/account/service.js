const api = require('../../services/api');
module.exports = {
  createPreferencesRequest: (input) => api.createRequest('account.preferences', input),
  createExportRequest: (format) => api.createRequest('account.requestExport', { format }),
  exportStatus: (jobId) => api.call(api.createRequest('account.exportStatus', { jobId })),
  downloadExport: (jobId) => api.call(api.createRequest('account.downloadExport', { jobId })),
  createClosureRequest: () => api.createRequest('account.close'),
  cleanupStatus: (receipt) => api.call(api.createRequest('account.cleanupStatus', { receipt })),
  submit: (request) => api.call(request),
};
