const argv = require('./lib/argv');
const run = require('./lib/run');

const args = argv();

if (typeof args === 'number') {
  process.exit(args);
} else {
  run(args, exitCode => process.exit(exitCode));
}
