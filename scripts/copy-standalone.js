/**
 * Post-build script: copies static assets and public files into the
 * Next.js standalone output so the packaged Electron app is self-contained.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standaloneRenderer = path.join(root, 'renderer', '.next', 'standalone', 'renderer');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy renderer/public → standalone/renderer/public
const publicSrc = path.join(root, 'renderer', 'public');
const publicDest = path.join(standaloneRenderer, 'public');
console.log('Copying public/ into standalone...');
copyDirSync(publicSrc, publicDest);

// Copy renderer/.next/static → standalone/renderer/.next/static
const staticSrc = path.join(root, 'renderer', '.next', 'static');
const staticDest = path.join(standaloneRenderer, '.next', 'static');
console.log('Copying .next/static/ into standalone...');
copyDirSync(staticSrc, staticDest);

console.log('Standalone assets copied successfully.');
