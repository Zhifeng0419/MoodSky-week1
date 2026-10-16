const { notImplemented } = require('../shared/result');
// Junhan Huang: F11-F16. All place/support data requires real verification.
async function handle(request) {
  if (request.action === 'campus.weatherPreview') {
    return {
      simulated: true,
      label: '固定虚构示意',
      description: '首版校园气象仅作界面示意，不读取私人天气记录，也不采集真实贡献。',
    };
  }
  return notImplemented();
}
module.exports = { handle };
