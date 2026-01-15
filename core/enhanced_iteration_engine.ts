/**
 * Enhanced Iteration Engine with Memory System
 * Tracks attempts and learns from previous iterations
 */

import * as fs from 'fs';
import {
  ErrorCategory,
  IterationResult,
  FixSuggestion,
  ExecutionMemory
} from './types';

/**
 * Enhanced Iteration Engine with Memory
 */
export class EnhancedIterationEngine {
  private executionMemory: Map<string, ExecutionMemory> = new Map();
  private memoryPersistencePath: string = './execution-memory.json';

  constructor(persistencePath?: string) {
    if (persistencePath) {
      this.memoryPersistencePath = persistencePath;
    }
    this.loadMemory();
  }

  /**
   * Create execution memory for tracking
   */
  createExecutionMemory(requestId: string, originalRequest: string): ExecutionMemory {
    const memory: ExecutionMemory = {
      executionId: requestId,
      originalRequest,
      attemptedSolutions: [],
      appliedChanges: [],
      succeeded: false,
      totalIterations: 0,
      timestamp: Date.now()
    };

    this.executionMemory.set(requestId, memory);
    return memory;
  }

  /**
   * Record an attempted solution
   */
  recordAttempt(
    executionId: string,
    agentSpecialty: string,
    approach: string,
    result: 'success' | 'failure' | 'partial',
    iteration: number,
    errorMessage?: string
  ): void {
    const memory = this.executionMemory.get(executionId);
    if (!memory) return;

    memory.attemptedSolutions.push({
      agentSpecialty,
      approach,
      result,
      iteration,
      errorMessage
    });
  }

  /**
   * Record successfully applied change
   */
  recordAppliedChange(
    executionId: string,
    filePath: string,
    changeDescription: string
  ): void {
    const memory = this.executionMemory.get(executionId);
    if (!memory) return;

    memory.appliedChanges.push({
      filePath,
      changeDescription,
      timestamp: Date.now()
    });
  }

  /**
   * Mark execution as succeeded
   */
  markSucceeded(executionId: string, totalIterations: number): void {
    const memory = this.executionMemory.get(executionId);
    if (!memory) return;

    memory.succeeded = true;
    memory.totalIterations = totalIterations;
    this.persistMemory();
  }

  /**
   * Get successful approaches for similar problems
   */
  getSimilarSuccesses(
    currentRequest: string,
    agentSpecialty?: string
  ): ExecutionMemory[] {
    const results: ExecutionMemory[] = [];
    const currentTokens = this.tokenize(currentRequest);

    for (const memory of this.executionMemory.values()) {
      if (!memory.succeeded) continue;

      const memoryTokens = this.tokenize(memory.originalRequest);
      const similarity = this.calculateSimilarity(currentTokens, memoryTokens);

      if (similarity > 0.5) {
        if (!agentSpecialty || memory.attemptedSolutions.some(s => s.agentSpecialty === agentSpecialty)) {
          results.push(memory);
        }
      }
    }

    return results.sort((a, b) => b.totalIterations - a.totalIterations);
  }

  /**
   * Suggest next approach based on history
   */
  suggestNextApproach(
    executionId: string,
    failedApproaches: string[],
    agentSpecialties: string[]
  ): string | null {
    const memory = this.executionMemory.get(executionId);
    if (!memory) return null;

    // Get similar successful executions
    const successes = this.getSimilarSuccesses(memory.originalRequest);

    for (const success of successes) {
      for (const solution of success.attemptedSolutions) {
        if (solution.result === 'success' &&
            !failedApproaches.includes(solution.approach) &&
            agentSpecialties.includes(solution.agentSpecialty)) {
          return solution.approach;
        }
      }
    }

    return null;
  }

  /**
   * Tokenize request for similarity calculation
   */
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate similarity between two token sets
   */
  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    let intersection = 0;
    for (const token of set1) {
      if (set2.has(token)) intersection++;
    }

    const union = set1.size + set2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Persist memory to disk
   */
  private persistMemory(): void {
    try {
      const memories = Array.from(this.executionMemory.values());
      fs.writeFileSync(
        this.memoryPersistencePath,
        JSON.stringify(memories, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('Failed to persist execution memory:', error);
    }
  }

  /**
   * Load memory from disk
   */
  private loadMemory(): void {
    try {
      if (fs.existsSync(this.memoryPersistencePath)) {
        const data = fs.readFileSync(this.memoryPersistencePath, 'utf-8');
        const memories: ExecutionMemory[] = JSON.parse(data);
        
        for (const memory of memories) {
          this.executionMemory.set(memory.executionId, memory);
        }
      }
    } catch (error) {
      console.warn('Failed to load execution memory:', error);
    }
  }

  /**
   * Get execution memory details
   */
  getMemory(executionId: string): ExecutionMemory | undefined {
    return this.executionMemory.get(executionId);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    averageIterations: number;
    mostCommonAgents: string[];
    successRate: number;
  } {
    const memories = Array.from(this.executionMemory.values());
    const successful = memories.filter(m => m.succeeded);
    
    const agentCounts = new Map<string, number>();
    for (const memory of memories) {
      for (const solution of memory.attemptedSolutions) {
        agentCounts.set(
          solution.agentSpecialty,
          (agentCounts.get(solution.agentSpecialty) || 0) + 1
        );
      }
    }

    const mostCommonAgents = Array.from(agentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([agent]) => agent);

    const totalIterations = successful.reduce((sum, m) => sum + m.totalIterations, 0);
    const averageIterations = successful.length > 0 ? totalIterations / successful.length : 0;

    return {
      totalExecutions: memories.length,
      successfulExecutions: successful.length,
      averageIterations,
      mostCommonAgents,
      successRate: memories.length > 0 ? successful.length / memories.length : 0
    };
  }

  /**
   * Clear old memory entries (keep last N)
   */
  pruneMemory(keepCount: number = 100): void {
    if (this.executionMemory.size <= keepCount) return;

    const entries = Array.from(this.executionMemory.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

    // Keep only the most recent entries
    const entriesToKeep = entries.slice(0, keepCount);
    this.executionMemory.clear();
    
    for (const [id, memory] of entriesToKeep) {
      this.executionMemory.set(id, memory);
    }

    this.persistMemory();
  }

  /**
   * Export memory for analysis
   */
  exportMemory(): ExecutionMemory[] {
    return Array.from(this.executionMemory.values());
  }

  /**
   * Print memory statistics
   */
  printStats(): void {
    const stats = this.getMemoryStats();
    console.log('\n📊 EXECUTION MEMORY STATISTICS');
    console.log('-'.repeat(60));
    console.log(`Total Executions: ${stats.totalExecutions}`);
    console.log(`Successful: ${stats.successfulExecutions}/${stats.totalExecutions}`);
    console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`Average Iterations: ${stats.averageIterations.toFixed(1)}`);
    console.log(`Most Used Agents: ${stats.mostCommonAgents.join(', ')}`);
    console.log('-'.repeat(60));
  }
}
