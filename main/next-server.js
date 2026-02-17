const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

let serverProcess = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function setupDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'centre-formation.db');

  if (!fs.existsSync(dbPath)) {
    // In packaged app, extraResources are in process.resourcesPath
    const sourceDb = path.join(process.resourcesPath, 'dev.db');
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath);
      console.log('Database copied to:', dbPath);
    } else {
      console.log('No seed database found, Prisma will create one.');
    }
  }

  return dbPath;
}

async function startNextServer(userDataPath) {
  const dbPath = setupDatabase(userDataPath);
  const port = await getFreePort();

  // The standalone server.js is at renderer/.next/standalone/renderer/server.js
  // relative to the app root (which is app.getAppPath() in packaged mode)
  const appRoot = path.join(__dirname, '..');
  const serverJs = path.join(appRoot, 'renderer', '.next', 'standalone', 'renderer', 'server.js');

  if (!fs.existsSync(serverJs)) {
    throw new Error(`Next.js standalone server not found at: ${serverJs}`);
  }

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      DATABASE_URL: `file:${dbPath}`,
    };

    serverProcess = spawn(process.execPath, [serverJs], {
      env,
      cwd: path.dirname(serverJs),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;

    const onData = (data) => {
      const output = data.toString();
      console.log('[Next.js]', output);
      if (!started && (output.includes('Ready') || output.includes('started') || output.includes(`${port}`))) {
        started = true;
        resolve(port);
      }
    };

    serverProcess.stdout.on('data', onData);
    serverProcess.stderr.on('data', onData);

    serverProcess.on('error', (err) => {
      if (!started) reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}`));
      serverProcess = null;
    });

    // Fallback: if no "Ready" message detected, just wait and check
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(port);
      }
    }, 5000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

module.exports = { startNextServer, stopServer };
