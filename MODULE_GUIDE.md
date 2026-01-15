# RAPH-LOOP MODULE GUIDE

> Complete guide to using and extending the RAPH-LOOP Gravity Module in AntiGravity

## Table of Contents

1. [Getting Started](#getting-started)
2. [Protocol Phases](#protocol-phases)
3. [Integration Guide](#integration-guide)
4. [Advanced Usage](#advanced-usage)
5. [Extending the Module](#extending-the-module)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- AntiGravity environment set up
- Git access to clone the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/withNoclout/RaphLoop.git
cd RaphLoop

# Install dependencies
npm install

# Build the module
npm run build
```

### Basic Usage

In AntiGravity, simply type:

```
/raph fix the failing tests
```

or

```
/raph-loop make the build work
```

The module will:
1. Create a verification script
2. Run it and analyze errors
3. Apply fixes automatically
4. Re-run verification until it passes (or max iterations reached)

## Protocol Phases

### Phase 1: PROBE

The module analyzes your request and creates an appropriate verification script.

**What happens:**
- Analyzes the request keywords (test, build, lint, etc.)
- Examines the codebase context
- Generates a verification script that returns exit code 0 on success
- Writes the script to a temporary file

**Example Output:**
```
📡 PHASE 1: PROBE - Creating Verification Script
------------------------------------------------------------
✓ Created verification script: verify_iteration_1234567890_1.js

Verification script preview:
----------------------------------------
const { execSync } = require('child_process');

console.log('Running tests...');
// ... test logic ...
----------------------------------------
```

### Phase 2: THE LOOP

The autonomous iteration phase where fixes are applied repeatedly.

**What happens:**
1. **Run verification** - Execute the verification script
2. **Check result** - Did it pass (exit 0) or fail (exit ≠ 0)?
3. **If PASS** → Move to Phase 3
4. **If FAIL**:
   - Analyze error output
   - Generate fix suggestions
   - Apply the best fix
   - Recurse back to step 1

**Example Output:**
```
🔄 PHASE 2: THE LOOP - Autonomous Iteration
------------------------------------------------------------

--- Iteration 1 ---

❌ VERIFICATION FAILED
Error output:
----------------------------------------
Test failed: Expected 'foo' but got 'bar'
----------------------------------------

--- Iteration 1 ---
Applying fix: Fix logic error
Modified files: src/utils.ts

✓ Applied fix: Fix logic error
Modified files: src/utils.ts

Re-running verification...

✅ VERIFICATION PASSED!
```

### Phase 3: COMPLETION PROMISE

Final phase where cleanup happens and results are reported.

**What happens:**
- Delete verification script (if configured)
- Print execution summary
- Display completion message

**Example Output:**
```
🎯 PHASE 3: COMPLETION PROMISE
------------------------------------------------------------
Cleaned up verification script: verify_iteration_1234567890_1.js

📊 EXECUTION SUMMARY
------------------------------------------------------------
Status: ✅ SUCCESS
Iterations: 1/5
Total Time: 2.34s
Phase: completion

Changes Applied:
  1. Iteration 1:
     Changes: Fix logic error
     Files: src/utils.ts
------------------------------------------------------------

============================================================
> [RAPH-LOOP] MISSION ACCOMPLISHED: STABILITY RESTORED.
============================================================
```

## Integration Guide

### Integrating with AntiGravity

The module is designed to integrate seamlessly with AntiGravity:

1. **Place the module** in your AntiGravity modules directory
2. **Configure triggers** in `config/anti-gravity.json`
3. **Import and use** the protocol in your AntiGravity instance

### Configuration Options

Edit `config/anti-gravity.json`:

```json
{
  "triggerCommands": ["/raph", "/raph-loop"],
  "maxIterations": 5,
  "verificationTimeout": 30000,
  "cleanupOnCompletion": true,
  "workingDirectory": "."
}
```

**Options explained:**
- `triggerCommands`: Commands that activate the module
- `maxIterations`: Maximum attempts before giving up (default: 5)
- `verificationTimeout`: Time to wait for verification script (ms)
- `cleanupOnCompletion`: Auto-delete verification scripts
- `workingDirectory`: Base directory for operations

## Advanced Usage

### Custom Verification Scripts

You can provide custom verification logic:

```
/raph run ./custom-verify.sh
```

### Targeting Specific Files

```
/raph fix errors in src/auth/*.ts
```

### Combining with Other Modules

```
/raph fix tests then /ux-ui-promax improve the UI
```

## Extending the Module

### Adding New Error Patterns

Edit `core/iteration_engine.ts`:

```typescript
private initializeErrorPatterns(): ErrorPattern[] {
  return [
    // Existing patterns...
    
    // Add your custom pattern
    {
      pattern: /YourCustomError/i,
      category: ErrorCategory.OTHER,
      severity: 'high',
      description: 'Your custom error type'
    }
  ];
}
```

### Custom Fix Strategies

Add new fix generation methods:

```typescript
private generateCustomFixSuggestions(errorOutput: string): FixSuggestion[] {
  return [{
    fixType: FixType.CUSTOM_FIX,
    description: 'Apply custom fix',
    files: this.findAffectedFiles(errorOutput),
    codeChanges: [],
    confidence: 0.8
  }];
}
```

### Extending Error Categories

Add to `core/types.ts`:

```typescript
export enum ErrorCategory {
  // Existing categories...
  CUSTOM_CATEGORY = 'custom_category'
}
```

## Troubleshooting

### Module Doesn't Trigger

**Problem:** `/raph` command doesn't work

**Solutions:**
1. Verify trigger commands in `config/anti-gravity.json`
2. Check that the module is properly loaded in AntiGravity
3. Review AntiGravity logs for errors

### Verification Scripts Not Created

**Problem:** Phase 1 fails to create verification script

**Solutions:**
1. Check write permissions in working directory
2. Verify Node.js is installed and accessible
3. Ensure working directory path is correct

### Max Iterations Reached

**Problem:** Module stops after 5 iterations without fixing

**Solutions:**
1. Review error output to understand the issue
2. Increase `maxIterations` in config
3. The issue may be too complex for automatic fixing
4. Consider manual intervention or providing more specific request

### Fix Not Applied

**Problem:** Fix suggestions generated but not applied

**Solutions:**
1. Check file permissions
2. Verify file paths in error output
3. Review confidence scores of suggestions
4. The issue may require more context

## Best Practices

### 1. Be Specific in Requests

**Good:**
```
/raph fix the failing authentication tests
```

**Less effective:**
```
/raph fix everything
```

### 2. Ensure Tests Exist

The module needs testable code:
- Write tests before triggering
- Ensure tests can fail and pass meaningfully
- Use clear, descriptive test names

### 3. Review Changes

After completion:
- Review all changes made
- Run tests manually to verify
- Commit changes with descriptive messages

### 4. Use Appropriate Iterations

- `/raph` for simple fixes (1-3 iterations)
- `/raph-loop` for complex issues (up to 5 iterations)

### 5. Monitor Progress

Watch the output carefully:
- Understand which phase is running
- Track iteration progress
- Review fix descriptions

### 6. Handle Complex Issues

For complex problems:
- Break down into smaller tasks
- Use specific file targeting
- Consider multiple `/raph` calls

## Common Use Cases

### Fixing TypeScript Errors

```
/raph resolve all TypeScript errors
```

### Making Tests Pass

```
/raph fix the failing unit tests
```

### Build Issues

```
/raph make the build succeed
```

### Linting Problems

```
/raph resolve ESLint warnings
```

### Specific Feature

```
/raph make the authentication flow work end-to-end
```

## Performance Tips

1. **Limit file scope** when possible
2. **Use specific requests** to reduce iteration count
3. **Optimize test suite** for faster verification
4. **Cache dependencies** to speed up builds

## Security Considerations

1. Review all changes before committing
2. Don't use with untrusted code
3. Keep module updated
4. Monitor for unexpected behavior

## Support and Contributing

- **Issues**: [GitHub Issues](https://github.com/withNoclout/RaphLoop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/withNoclout/RaphLoop/discussions)
- **Contributing**: See repository guidelines

---

**RAPH-LOOP - Autonomous Code Fixes for AntiGravity** 🚀
