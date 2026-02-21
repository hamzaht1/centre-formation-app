const { fork } = require('child_process');
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
    const sourceDb = path.join(process.resourcesPath, 'dev.db');
    if (fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, dbPath);
      console.log('Database copied to:', dbPath);
    } else {
      console.log('No seed database found.');
    }
  }

  return dbPath;
}

function findServerJs() {
  const appRoot = path.join(__dirname, '..');

  const candidates = [
    path.join(appRoot, 'renderer', '.next', 'standalone', 'server.js'),
    path.join(appRoot, 'renderer', '.next', 'standalone', 'renderer', 'server.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`server.js not found. Tried:\n${candidates.join('\n')}`);
}

async function startNextServer(userDataPath) {
  const dbPath = setupDatabase(userDataPath);
  const port = await getFreePort();
  const serverJs = findServerJs();

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: `file:${dbPath}`,
    };

    serverProcess = fork(serverJs, [], {
      cwd: path.dirname(serverJs),
      env,
      silent: true,
    });

    let started = false;
    let errorOutput = '';

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Next.js]', output);
      if (!started && (output.includes('Ready') || output.includes('started') || output.includes(`${port}`))) {
        started = true;
        resolve(port);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      errorOutput += msg;
      console.error('[Next.js Error]', msg);
    });

    serverProcess.on('error', (err) => {
      if (!started) reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}\nPath: ${serverJs}\nError: ${errorOutput}`));
      serverProcess = null;
    });

    // Fallback timeout
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(port);
      }
    }, 8000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

module.exports = { startNextServer, stopServer };
