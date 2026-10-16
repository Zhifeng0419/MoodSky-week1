const api = require('../../services/api');
module.exports = {
  suggestions: (preferences = {}) => api.call(api.createRequest('tasks.suggestions', preferences)),
  history: () => api.call(api.createRequest('tasks.history')),
  quickChoice: (choice) => api.call(api.createRequest('tasks.quickChoice', { choice })),
  createTransitionRequest: (input) => api.createRequest('tasks.transition', input),
  submit: (request) => api.call(request),
};
