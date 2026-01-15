/**
 * Sample Verification Script
 * This is an example of what RAPH-LOOP generates for testing
 */

const { execSync } = require('child_process');

console.log('Running verification tests...');

try {
  // Run tests with multiple fallback strategies
  const testCommands = [
    'npm test',
    'npm run test',
    'npx jest',
    'npx mocha'
  ];

  let lastError = null;
  for (const cmd of testCommands) {
    try {
      console.log(`Attempting: ${cmd}`);
      execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✓ Tests passed');
      process.exit(0);
    } catch (e) {
      lastError = e;
      console.log(`  → Failed, trying next command...`);
      continue;
    }
  }
  
  // All commands failed
  throw lastError;

} catch (error) {
  console.error('✗ Tests failed');
  console.error('Error:', error.message);
  process.exit(1);
}
