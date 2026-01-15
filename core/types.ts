/**
 * RAPH-LOOP Type Definitions
 * Core types for the autonomous iteration protocol
 */

/**
 * Verification script information
 */
export interface VerificationScript {
  /** File path of the verification script */
  path: string;
  /** Source code of the verification script */
  code: string;
  /** Exit code from last execution */
  exitCode?: number;
  /** Output from last execution */
  output?: string;
  /** Error output from last execution */
  errorOutput?: string;
}

/**
 * Result of a single iteration
 */
export interface IterationResult {
  /** Whether the iteration was successful */
  success: boolean;
  /** Current iteration number */
  iteration: number;
  /** List of changes made in this iteration */
  changes: string[];
  /** Error message if failed */
  error?: string;
  /** Files modified in this iteration */
  modifiedFiles: string[];
}

/**
 * Configuration for the RaphLoop protocol
 */
export interface RaphLoopConfig {
  /** Maximum number of iterations */
  maxIterations: number;
  /** Timeout for verification script execution (ms) */
  verificationTimeout: number;
  /** Whether to cleanup verification scripts on completion */
  cleanupOnCompletion: boolean;
  /** Trigger commands that activate the module */
  triggerCommands: string[];
  /** Working directory for operations */
  workingDirectory: string;
}

/**
 * Error pattern for analysis
 */
export interface ErrorPattern {
  /** Regex pattern to match error */
  pattern: RegExp;
  /** Error category (syntax, type, dependency, logic, test) */
  category: ErrorCategory;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the error type */
  description: string;
}

/**
 * Error categories
 */
export enum ErrorCategory {
  SYNTAX = 'syntax',
  TYPE = 'type',
  DEPENDENCY = 'dependency',
  LOGIC = 'logic',
  TEST = 'test',
  BUILD = 'build',
  LINT = 'lint',
  RUNTIME = 'runtime',
  OTHER = 'other'
}

/**
 * Suggested fix for an error
 */
export interface FixSuggestion {
  /** Type of fix to apply */
  fixType: FixType;
  /** Description of the fix */
  description: string;
  /** Files to modify */
  files: string[];
  /** Code changes to apply */
  codeChanges: CodeChange[];
  /** Estimated confidence in this fix (0-1) */
  confidence: number;
}

/**
 * Types of fixes that can be applied
 */
export enum FixType {
  ADD_IMPORT = 'add_import',
  REMOVE_IMPORT = 'remove_import',
  UPDATE_TYPE = 'update_type',
  FIX_SYNTAX = 'fix_syntax',
  ADD_DEPENDENCY = 'add_dependency',
  MODIFY_LOGIC = 'modify_logic',
  UPDATE_TEST = 'update_test',
  ADD_FUNCTION = 'add_function',
  REMOVE_FUNCTION = 'remove_function',
  REFACTOR = 'refactor'
}

/**
 * Individual code change
 */
export interface CodeChange {
  /** File path */
  filePath: string;
  /** Line number to change */
  lineNumber?: number;
  /** Original code to replace */
  originalCode: string;
  /** New code to insert */
  newCode: string;
  /** Description of the change */
  description: string;
}

/**
 * Protocol phase
 */
export enum ProtocolPhase {
  PROBE = 'probe',
  LOOP = 'loop',
  COMPLETION = 'completion'
}

/**
 * Protocol state
 */
export interface ProtocolState {
  /** Current phase */
  phase: ProtocolPhase;
  /** Current iteration number */
  currentIteration: number;
  /** Verification script */
  verificationScript?: VerificationScript;
  /** List of all iteration results */
  iterationHistory: IterationResult[];
  /** Whether the protocol has completed */
  completed: boolean;
  /** Whether the protocol succeeded */
  succeeded: boolean;
  /** Total time elapsed (ms) */
  elapsedTime: number;
  /** Error that caused failure (if any) */
  failureError?: string;
}

/**
 * User request context
 */
export interface RequestContext {
  /** Original user request */
  request: string;
  /** Trigger command used */
  triggerCommand: string;
  /** Codebase context */
  codebase: string;
  /** Additional context from conversation */
  context?: Record<string, any>;
}

/**
 * Execution memory for tracking attempts and solutions
 */
export interface ExecutionMemory {
  /** Unique execution ID */
  executionId: string;
  /** Request that triggered execution */
  originalRequest: string;
  /** All attempted solutions */
  attemptedSolutions: {
    agentSpecialty: string;
    approach: string;
    result: 'success' | 'failure' | 'partial';
    iteration: number;
    errorMessage?: string;
  }[];
  /** Successfully applied changes */
  appliedChanges: {
    filePath: string;
    changeDescription: string;
    timestamp: number;
  }[];
  /** Overall success status */
  succeeded: boolean;
  /** Total iterations used */
  totalIterations: number;
  /** Timestamp of execution */
  timestamp: number;
  /** Metadata from execution */
  metadata?: Record<string, any>;
}

/**
 * Configuration for enhanced iteration limits
 */
export interface IterationConfiguration {
  /** Max iterations for simple problems */
  simple: number;
  /** Max iterations for moderate problems */
  moderate: number;
  /** Max iterations for complex problems */
  complex: number;
  /** Max iterations for multi-agent coordination */
  multiAgent: number;
  /** Base timeout per iteration (ms) */
  iterationTimeout: number;
  /** Enable memory system */
  enableMemory: boolean;
  /** Enable AST analysis */
  enableASTAnalysis: boolean;
}
