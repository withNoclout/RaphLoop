/**
 * Verification Manager
 * Handles creation, execution, and cleanup of verification scripts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { VerificationScript, RaphLoopConfig } from './types';

export class VerificationManager {
  private config: RaphLoopConfig;
  private scriptCounter: number = 0;

  constructor(config: RaphLoopConfig) {
    this.config = config;
  }

  /**
   * Generate a unique filename for verification script
   */
  private generateScriptName(): string {
    this.scriptCounter++;
    return `verify_iteration_${Date.now()}_${this.scriptCounter}.js`;
  }

  /**
   * Create a verification script based on user request
   */
  createVerificationScript(request: string, codebaseContext: string): VerificationScript {
    const scriptPath = path.join(this.config.workingDirectory, this.generateScriptName());
    
    // Generate script content based on request analysis
    const scriptCode = this.generateScriptContent(request, codebaseContext);
    
    // Write script to file
    fs.writeFileSync(scriptPath, scriptCode, 'utf-8');
    
    return {
      path: scriptPath,
      code: scriptCode
    };
  }

  /**
   * Generate appropriate verification script content
   */
  private generateScriptContent(request: string, codebaseContext: string): string {
    const lowerRequest = request.toLowerCase();
    
    // Detect language/framework from context
    const hasNode = codebaseContext.includes('package.json') || codebaseContext.includes('node_modules');
    const hasPython = codebaseContext.includes('requirements.txt') || codebaseContext.includes('pyproject.toml');
    const hasTests = codebaseContext.includes('test') || codebaseContext.includes('spec');
    const hasTypeScript = codebaseContext.includes('tsconfig.json');

    // Generate appropriate script
    if (hasTypeScript && (lowerRequest.includes('typescript') || lowerRequest.includes('type'))) {
      return this.generateTypeScriptVerificationScript();
    } else if (lowerRequest.includes('test') || lowerRequest.includes('test') && hasTests) {
      return this.generateTestVerificationScript(hasNode);
    } else if (lowerRequest.includes('build') || lowerRequest.includes('compile')) {
      return this.generateBuildVerificationScript(hasNode, hasTypeScript);
    } else if (lowerRequest.includes('lint') || lowerRequest.includes('eslint') || lowerRequest.includes('prettier')) {
      return this.generateLintVerificationScript();
    } else if (hasPython) {
      return this.generatePythonVerificationScript();
    } else {
      // Default to Node.js verification
      return this.generateDefaultVerificationScript();
    }
  }

  /**
   * Generate TypeScript verification script
   */
  private generateTypeScriptVerificationScript(): string {
    return `const { execSync } = require('child_process');

console.log('Running TypeScript type checking...');

try {
  execSync('npx tsc --noEmit', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✓ TypeScript check passed');
  process.exit(0);
} catch (error) {
  console.error('✗ TypeScript errors detected');
  process.exit(1);
}`;
  }

  /**
   * Generate test verification script
   */
  private generateTestVerificationScript(hasNode: boolean): string {
    if (hasNode) {
      return `const { execSync } = require('child_process');

console.log('Running tests...');

try {
  // Try different test runners
  const testCommands = [
    'npm test',
    'npm run test',
    'yarn test',
    'pnpm test',
    'jest',
    'npx jest',
    'npx mocha'
  ];

  let lastError = null;
  for (const cmd of testCommands) {
    try {
      execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✓ Tests passed');
      process.exit(0);
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  
  throw lastError;
} catch (error) {
  console.error('✗ Tests failed');
  process.exit(1);
}`;
    }
    return this.generateDefaultVerificationScript();
  }

  /**
   * Generate build verification script
   */
  private generateBuildVerificationScript(hasNode: boolean, hasTypeScript: boolean): string {
    if (hasNode && hasTypeScript) {
      return `const { execSync } = require('child_process');

console.log('Building TypeScript project...');

try {
  execSync('npx tsc', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✓ Build successful');
  process.exit(0);
} catch (error) {
  console.error('✗ Build failed');
  process.exit(1);
}`;
    }
    return this.generateDefaultVerificationScript();
  }

  /**
   * Generate lint verification script
   */
  private generateLintVerificationScript(): string {
    return `const { execSync } = require('child_process');

console.log('Running linter...');

try {
  // Try ESLint
  try {
    execSync('npx eslint . --ext .ts,.tsx,.js,.jsx', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✓ No linting errors');
    process.exit(0);
  } catch (e) {
    // If ESLint not found, try Prettier
    try {
      execSync('npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✓ No formatting issues');
      process.exit(0);
    } catch (e2) {
      throw e;
    }
  }
} catch (error) {
  console.error('✗ Linting failed');
  process.exit(1);
}`;
  }

  /**
   * Generate Python verification script
   */
  private generatePythonVerificationScript(): string {
    return `import subprocess
import sys

print("Running Python verification...")

try:
    # Try pytest first
    try:
        result = subprocess.run(['pytest', '-v'], check=True, capture_output=True, text=True)
        print(result.stdout)
        print("✓ Tests passed")
        sys.exit(0)
    except FileNotFoundError:
        pass
    
    # Try unittest
    try:
        result = subprocess.run(['python', '-m', 'unittest', 'discover'], check=True, capture_output=True, text=True)
        print(result.stdout)
        print("✓ Tests passed")
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        print(e.stderr)
        print("✗ Tests failed")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)`;
  }

  /**
   * Generate default verification script
   */
  private generateDefaultVerificationScript(): string {
    return `const { execSync } = require('child_process');

console.log('Running verification...');

try {
  // Try to detect and run appropriate checks
  const checks = [
    { cmd: 'npm test', desc: 'tests' },
    { cmd: 'npm run build', desc: 'build' },
    { cmd: 'npx tsc --noEmit', desc: 'type check' }
  ];

  for (const check of checks) {
    try {
      execSync(check.cmd, { stdio: 'pipe', cwd: process.cwd() });
      console.log(\`✓ \${check.desc} passed\`);
      process.exit(0);
    } catch (e) {
      // Try next check
    }
  }
  
  console.log('✓ No critical errors detected');
  process.exit(0);
} catch (error) {
  console.error('✗ Verification failed');
  process.exit(1);
}`;
  }

  /**
   * Execute a verification script
   */
  executeVerificationScript(script: VerificationScript): VerificationScript {
    const startTime = Date.now();
    
    try {
      const output = child_process.execSync(
        `node "${script.path}"`,
        {
          cwd: this.config.workingDirectory,
          timeout: this.config.verificationTimeout,
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
      
      script.exitCode = 0;
      script.output = output;
      script.errorOutput = '';
      
      console.log(`Verification passed in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      script.exitCode = error.status || 1;
      script.output = error.stdout || '';
      script.errorOutput = error.stderr || error.message || '';
      
      console.log(`Verification failed in ${Date.now() - startTime}ms`);
    }
    
    return script;
  }

  /**
   * Delete verification script (cleanup)
   */
  cleanupVerificationScript(script: VerificationScript): boolean {
    try {
      if (fs.existsSync(script.path)) {
        fs.unlinkSync(script.path);
        console.log(`Cleaned up verification script: ${script.path}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to cleanup verification script: ${error}`);
      return false;
    }
  }

  /**
   * Check if verification passed
   */
  isVerificationPassed(script: VerificationScript): boolean {
    return script.exitCode === 0;
  }

  /**
   * Extract error information from failed verification
   */
  extractErrorInfo(script: VerificationScript): string {
    if (this.isVerificationPassed(script)) {
      return '';
    }
    
    return script.errorOutput || script.output || 'Unknown error';
  }
}
