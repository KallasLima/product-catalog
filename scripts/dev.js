import { spawn } from 'node:child_process';
const api = spawn(process.execPath, ['server/start.js'], { stdio: 'inherit' });
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' });
let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  api.kill();
  web.kill();
  process.exitCode = code;
}
api.on('exit', (code) => close(code ?? 1));
web.on('exit', (code) => close(code ?? 1));
process.on('SIGINT', () => close());
process.on('SIGTERM', () => close());
