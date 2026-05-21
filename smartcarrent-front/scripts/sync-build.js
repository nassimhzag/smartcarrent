const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, 'build');
const targetDir = path.resolve(projectRoot, '..', 'smartcarrent-back', 'public', 'frontend');

if (!fs.existsSync(buildDir)) {
  throw new Error(`Build directory not found: ${buildDir}`);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(buildDir, targetDir, { recursive: true });

console.log(`Synced ${buildDir} -> ${targetDir}`);
