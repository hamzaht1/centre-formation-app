/**
 * Post-build script: copies static assets, public files, and Prisma client
 * into the Next.js standalone output so the packaged Electron app is self-contained.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standaloneDir = path.join(root, 'renderer', '.next', 'standalone');

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

// Copy renderer/public → standalone/public
const publicSrc = path.join(root, 'renderer', 'public');
const publicDest = path.join(standaloneDir, 'public');
console.log('Copying public/ into standalone...');
copyDirSync(publicSrc, publicDest);

// Copy renderer/.next/static → standalone/.next/static
const staticSrc = path.join(root, 'renderer', '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
console.log('Copying .next/static/ into standalone...');
copyDirSync(staticSrc, staticDest);

// Copy Prisma client from root node_modules into standalone
const prismaClientSrc = path.join(root, 'node_modules', '.prisma');
const prismaClientDest = path.join(standaloneDir, 'node_modules', '.prisma');
console.log('Copying .prisma/ client into standalone...');
copyDirSync(prismaClientSrc, prismaClientDest);

const prismaCoreSrc = path.join(root, 'node_modules', '@prisma');
const prismaCoreDest = path.join(standaloneDir, 'node_modules', '@prisma');
console.log('Copying @prisma/ into standalone...');
copyDirSync(prismaCoreSrc, prismaCoreDest);

console.log('Standalone assets copied successfully.');
