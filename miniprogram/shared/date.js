const { LIMITS } = require('./constants');
const DAY_MS = 24 * 60 * 60 * 1000;
const CHINA_OFFSET_MS = 8 * 60 * 60 * 1000;
function isBusinessDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const time = Date.parse(value + 'T00:00:00.000Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
function businessDate(now = new Date()) {
  return new Date(now.getTime() + CHINA_OFFSET_MS).toISOString().slice(0, 10);
}
function canCreateEntry(date, now = new Date()) {
  if (!isBusinessDate(date)) {
    return false;
  }
  const age = (Date.parse(businessDate(now)) - Date.parse(date)) / DAY_MS;
  return age >= 0 && age < LIMITS.newEntryWindowDays;
}
// Creation window only. An older EXISTING entry may still be edited by its owner.
module.exports = { isBusinessDate, businessDate, canCreateEntry };
