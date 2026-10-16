const api = require('../../services/api');
module.exports = {
  calendar: (month) => api.call(api.createRequest('review.calendar', { month })),
  distribution: (windowDays) => api.call(api.createRequest('review.distribution', { windowDays })),
  timeline: (windowDays) => api.call(api.createRequest('review.timeline', { windowDays })),
  monthArchive: (month) => api.call(api.createRequest('review.monthArchive', { month })),
  createDecorationRequest: (input) => api.createRequest('review.decorations', input),
  submit: (request) => api.call(request),
};
