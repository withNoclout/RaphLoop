# RAPH-LOOP GRAVITY MODULE

> An autonomous iteration protocol for AntiGravity - Fix code until verification passes or MAX_ITERATIONS is reached.

## 🎯 Overview

RAPH-LOOP is an intelligent, autonomous code-fixing module that runs within AntiGravity. When triggered, it creates verification scripts, iteratively fixes code based on error analysis, and continues until tests pass or the iteration limit is reached.

## 🚀 Quick Start

### Triggering the Module

In AntiGravity, simply type:
```
/raph <your request>
```
or
```
/raph-loop <your request>
```

### Example Usage

```
/raph fix the failing authentication tests
/raph-loop make the payment flow work
/raph resolve the TypeScript errors in the dashboard
```

## 📋 Protocol Workflow

The RAPH-LOOP protocol executes in three phases:

### Phase 1: PROBE (Create Verification)
- Analyzes the user's request
- Immediately creates a verification script
- Script returns exit code 0 ONLY on success

### Phase 2: THE LOOP (Autonomous Iteration)
**Action**: Run verification script

**Condition A (FAIL)**:
- Read error logs
- Reason about root cause
- Apply fix to codebase
- **RECURSE**: Go back to Action immediately

**Condition B (PASS)**:
- Proceed to Phase 3

### Phase 3: COMPLETION PROMISE
- Delete verification script (cleanup)
- Output: `> [RAPH-LOOP] MISSION ACCOMPLISHED: STABILITY RESTORED.`

## 🛡️ Safety Limits

- **MAX_ITERATIONS**: 5
- If not solved in 5 attempts, stops and asks for help (saves tokens)
- Always operates on the entire `@codebase` context

## 🏗️ Architecture

```
RaphLoop/
├── core/
│   ├── raph_loop_protocol.ts    # Main protocol orchestration
│   ├── verification_manager.ts  # Verification script handling
│   ├── iteration_engine.ts      # Loop and fix logic
│   └── types.ts                  # TypeScript type definitions
├── examples/
│   ├── sample_verification.js   # Example verification script
│   └── use_cases.md            # Common scenarios
├── config/
│   └── anti-gravity.json       # AntiGravity integration config
├── README.md                   # This file
├── MODULE_GUIDE.md            # Detailed usage guide
└── package.json               # Node.js dependencies
```

## 📦 Installation

For AntiGravity integration, clone this repository:

```bash
git clone https://github.com/withNoclout/RaphLoop.git
cd RaphLoop
npm install
```

## 🔧 Configuration

Edit `config/anti-gravity.json` to customize:

```json
{
  "triggerCommands": ["/raph", "/raph-loop"],
  "maxIterations": 5,
  "verificationTimeout": 30000,
  "cleanupOnCompletion": true
}
```

## 🎓 Example Verification Scripts

### JavaScript/Node.js Example
```javascript
const { execSync } = require('child_process');

try {
  // Run tests
  execSync('npm test', { stdio: 'inherit' });
  process.exit(0); // Success
} catch (error) {
  console.error('Tests failed:', error.message);
  process.exit(1); // Failure
}
```

### Python Example
```python
import subprocess
import sys

try:
    # Run tests
    subprocess.run(['pytest', 'tests/'], check=True)
    sys.exit(0)  # Success
except subprocess.CalledProcessError as e:
    print(f'Tests failed: {e}', file=sys.stderr)
    sys.exit(1)  # Failure
```

## 🔍 Use Cases

### 1. Fixing Failing Tests
```
/raph the unit tests in auth-module are failing
```

### 2. Resolving Build Errors
```
/raph fix the TypeScript compilation errors
```

### 3. Addressing Linting Issues
```
/raph-loop resolve all ESLint warnings
```

### 4. Making Feature Work
```
/raph make the payment processing work end-to-end
```

## 📖 Core Concepts

### Exit Code Contract
- **Exit 0**: Verification PASSED → Stop iteration
- **Exit ≠ 0**: Verification FAILED → Continue iteration

### Iteration Strategy
1. Parse error output
2. Identify failure pattern (syntax, logic, dependency, etc.)
3. Generate targeted fix
4. Apply to affected files
5. Re-run verification

### Smart Error Analysis
The module recognizes common error patterns:
- **Syntax Errors**: Fix syntax issues immediately
- **Type Errors**: Update type definitions
- **Missing Dependencies**: Add imports/requirements
- **Logic Errors**: Adjust implementation
- **Test Failures**: Fix implementation to match expectations

## 🚨 Limitations & Best Practices

### Limitations
- Max 5 iterations (token conservation)
- Cannot fix complex architectural issues
- May not resolve environment-specific problems
- Requires testable code to begin with

### Best Practices
- Be specific in your request
- Ensure tests exist before triggering
- Use `/raph` for simple fixes, `/raph-loop` for complex issues
- Review changes after completion

## 🤝 Contributing

This module is designed for AntiGravity integration. To extend functionality:

1. Add new error patterns to `iteration_engine.ts`
2. Update `types.ts` for new verification types
3. Add examples to `examples/use_cases.md`

## 📄 License

Proprietary - See LICENSE for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/withNoclout/RaphLoop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/withNoclout/RaphLoop/discussions)

---

**RAPH-LOOP - Autonomous Code Fixes for AntiGravity** 🚀
