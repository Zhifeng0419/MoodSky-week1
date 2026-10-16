const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'miniprogram/shared');
const target = path.join(root, 'cloudfunctions/moodsky/shared');
// Replace only this generated directory, never hand-written domain modules.
fs.mkdirSync(target, { recursive: true });
for (const name of fs.readdirSync(target)) {
  if (name.endsWith('.js') || name.endsWith('.d.ts')) {
    fs.unlinkSync(path.join(target, name));
  }
}
for (const name of fs.readdirSync(source)) {
  if (name.endsWith('.js') || name.endsWith('.d.ts')) {
    fs.copyFileSync(path.join(source, name), path.join(target, name));
  }
}
console.log('Prepared cloud shared contracts from miniprogram/shared.');
