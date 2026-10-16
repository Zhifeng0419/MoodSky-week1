const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const example = path.join(root, 'miniprogram/config/environment.example.js');
const local = path.join(root, 'miniprogram/config/environment.local.js');
if (!fs.existsSync(local)) {
  fs.copyFileSync(example, local);
  console.log(
    'Created local config. Cloud remains disabled until you configure your test environment.',
  );
} else {
  console.log('Kept existing local config.');
}
require('./prepare-cloud');
