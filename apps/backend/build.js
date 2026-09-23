const { spawnSync } = require('child_process');
const path = require('path');

const cliPath = path.join(path.dirname(require.resolve('@nestjs/cli/package.json')), 'bin', 'nest.js');
const result = spawnSync(process.execPath, [cliPath, 'build'], { stdio: 'inherit' });
process.exit(result.status ?? 1);