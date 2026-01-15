/**
 * RAPH-LOOP Protocol
 * Main orchestration for the autonomous iteration protocol
 */

import { VerificationManager } from './verification_manager';
import { IterationEngine } from './iteration_engine';
import {
  RaphLoopConfig,
  RequestContext,
  ProtocolPhase,
  ProtocolState,
  VerificationScript,
  IterationResult
} from './types';

export class RaphLoopProtocol {
  private config: RaphLoopConfig;
  private verificationManager: VerificationManager;
  private iterationEngine: IterationEngine;
  private state: ProtocolState;
  private startTime: number;

  constructor(config: RaphLoopConfig) {
    this.config = config;
    this.verificationManager = new VerificationManager(config);
    this.iterationEngine = new IterationEngine();
    this.startTime = Date.now();
    this.state = this.initializeState();
  }

  /**
   * Initialize protocol state
   */
  private initializeState(): ProtocolState {
    return {
      phase: ProtocolPhase.PROBE,
      currentIteration: 0,
      iterationHistory: [],
      completed: false,
      succeeded: false,
      elapsedTime: 0
    };
  }

  /**
   * Execute the RAPH-LOOP protocol
   */
  async execute(context: RequestContext): Promise<ProtocolState> {
    console.log('='.repeat(60));
    console.log('RAPH-LOOP GRAVITY MODULE INITIATED');
    console.log('='.repeat(60));
    console.log(`Request: ${context.request}`);
    console.log(`Trigger: ${context.triggerCommand}`);
    console.log(`Max Iterations: ${this.config.maxIterations}`);
    console.log('='.repeat(60));

    try {
      // PHASE 1: PROBE (Create Verification)
      await this.executeProbePhase(context);

      // PHASE 2: THE LOOP (Autonomous Iteration)
      await this.executeLoopPhase(context);

      // PHASE 3: COMPLETION PROMISE
      await this.executeCompletionPhase();

    } catch (error: any) {
      this.state.completed = true;
      this.state.succeeded = false;
      this.state.failureError = error.message;
      console.error('\n❌ Protocol failed:', error.message);
    }

    this.state.elapsedTime = Date.now() - this.startTime;
    return this.state;
  }

  /**
   * PHASE 1: Create verification script
   */
  private async executeProbePhase(context: RequestContext): Promise<void> {
    console.log('\n📡 PHASE 1: PROBE - Creating Verification Script');
    console.log('-'.repeat(60));

    this.state.phase = ProtocolPhase.PROBE;

    // Create verification script
    const verificationScript = this.verificationManager.createVerificationScript(
      context.request,
      context.codebase
    );

    this.state.verificationScript = verificationScript;

    console.log(`✓ Created verification script: ${verificationScript.path}`);
    console.log('\nVerification script preview:');
    console.log('-'.repeat(40));
    console.log(verificationScript.code.split('\n').slice(0, 10).join('\n'));
    if (verificationScript.code.split('\n').length > 10) {
      console.log('... (truncated)');
    }
    console.log('-'.repeat(40));
  }

  /**
   * PHASE 2: Autonomous iteration loop
   */
  private async executeLoopPhase(context: RequestContext): Promise<void> {
    console.log('\n🔄 PHASE 2: THE LOOP - Autonomous Iteration');
    console.log('-'.repeat(60));

    this.state.phase = ProtocolPhase.LOOP;

    let verificationPassed = false;

    while (this.state.currentIteration < this.config.maxIterations) {
      this.state.currentIteration++;

      // Run verification
      const script = this.state.verificationScript!;
      const executedScript = this.verificationManager.executeVerificationScript(script);

      // Check if verification passed
      if (this.verificationManager.isVerificationPassed(executedScript)) {
        verificationPassed = true;
        console.log('\n✅ VERIFICATION PASSED!');
        break;
      }

      // Verification failed - analyze and fix
      console.log('\n❌ VERIFICATION FAILED');
      console.log('Error output:');
      console.log('-'.repeat(40));
      console.log(this.verificationManager.extractErrorInfo(executedScript));
      console.log('-'.repeat(40));

      // Check if we've reached max iterations
      if (this.state.currentIteration >= this.config.maxIterations) {
        console.log(`\n⚠️  MAX ITERATIONS (${this.config.maxIterations}) REACHED`);
        break;
      }

      // Generate and apply fix
      const errorOutput = this.verificationManager.extractErrorInfo(executedScript);
      const iterationResult = await this.iterationEngine.executeIteration(
        errorOutput,
        context.codebase,
        this.state.currentIteration
      );

      this.state.iterationHistory.push(iterationResult);

      if (!iterationResult.success) {
        console.log('\n⚠️  Failed to apply fix');
        console.log(`Error: ${iterationResult.error}`);
        break;
      }

      console.log(`\n✓ Applied fix: ${iterationResult.changes.join(', ')}`);
      console.log(`Modified files: ${iterationResult.modifiedFiles.join(', ')}`);
      console.log('\nRe-running verification...');
    }

    this.state.succeeded = verificationPassed;
  }

  /**
   * PHASE 3: Completion and cleanup
   */
  private async executeCompletionPhase(): Promise<void> {
    console.log('\n🎯 PHASE 3: COMPLETION PROMISE');
    console.log('-'.repeat(60));

    this.state.phase = ProtocolPhase.COMPLETION;
    this.state.completed = true;

    // Cleanup verification script
    if (this.config.cleanupOnCompletion && this.state.verificationScript) {
      this.verificationManager.cleanupVerificationScript(this.state.verificationScript);
    }

    // Print summary
    this.printSummary();

    // Output completion message
    if (this.state.succeeded) {
      console.log('\n' + '='.repeat(60));
      console.log('> [RAPH-LOOP] MISSION ACCOMPLISHED: STABILITY RESTORED.');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('> [RAPH-LOOP] MISSION FAILED: MAX ITERATIONS REACHED.');
      console.log('> Please review the changes and provide additional guidance.');
      console.log('='.repeat(60));
    }
  }

  /**
   * Print execution summary
   */
  private printSummary(): void {
    console.log('\n📊 EXECUTION SUMMARY');
    console.log('-'.repeat(60));
    console.log(`Status: ${this.state.succeeded ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Iterations: ${this.state.currentIteration}/${this.config.maxIterations}`);
    console.log(`Total Time: ${(this.state.elapsedTime / 1000).toFixed(2)}s`);
    console.log(`Phase: ${this.state.phase}`);

    if (this.state.iterationHistory.length > 0) {
      console.log('\nChanges Applied:');
      for (let i = 0; i < this.state.iterationHistory.length; i++) {
        const result = this.state.iterationHistory[i];
        console.log(`  ${i + 1}. Iteration ${result.iteration}:`);
        console.log(`     Changes: ${result.changes.join(', ')}`);
        console.log(`     Files: ${result.modifiedFiles.join(', ')}`);
      }
    }

    if (this.state.failureError) {
      console.log(`\nFailure Error: ${this.state.failureError}`);
    }

    console.log('-'.repeat(60));
  }

  /**
   * Get current protocol state
   */
  getState(): ProtocolState {
    return { ...this.state };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RaphLoopConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Factory function to create and execute the protocol
 */
export async function executeRaphLoop(
  request: string,
  triggerCommand: string,
  codebaseContext: string,
  config?: Partial<RaphLoopConfig>
): Promise<ProtocolState> {
  const defaultConfig: RaphLoopConfig = {
    maxIterations: 5,
    verificationTimeout: 30000,
    cleanupOnCompletion: true,
    triggerCommands: ['/raph', '/raph-loop'],
    workingDirectory: process.cwd()
  };

  const finalConfig = { ...defaultConfig, ...config };
  const protocol = new RaphLoopProtocol(finalConfig);

  const context: RequestContext = {
    request,
    triggerCommand,
    codebase: codebaseContext
  };

  return await protocol.execute(context);
}
