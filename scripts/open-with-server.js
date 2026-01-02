const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const serverPath = path.join(projectRoot, 'server.js');

console.log('Starting server (detached)...');

// Start the server in a detached child process so it keeps running
const child = spawn(process.execPath, [serverPath], {
  cwd: projectRoot,
  detached: true,
  stdio: 'ignore',
  shell: false
});
child.unref();

const url = 'http://localhost:3000/health';
let attempts = 0;
const maxAttempts = 30;

function check() {
  attempts++;
  http.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log('Server is up — opening browser at http://localhost:3000');
      openBrowser('http://localhost:3000');
      process.exit(0);
    } else {
      retry();
    }
  }).on('error', retry);
}

function retry() {
  if (attempts >= maxAttempts) {
    console.error('Server did not respond within timeout. Start it manually with `npm start`.');
    process.exit(1);
  } else {
    setTimeout(check, 1000);
  }
}

function openBrowser(target) {
  const platform = process.platform;
  if (platform === 'win32') {
    exec(`start "" "${target}"`, { shell: true });
  } else if (platform === 'darwin') {
    exec(`open "${target}"`);
  } else {
    exec(`xdg-open "${target}"`);
  }
}

check();
