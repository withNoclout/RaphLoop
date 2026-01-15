/**
 * Specialist Agent Base Class
 * Foundation for specialized problem-solving agents
 */

import { IterationResult, FixSuggestion, ErrorCategory, CodeChange } from './types';

/**
 * Supported agent types/specializations
 */
export enum AgentSpecialty {
  GENERAL = 'general',
  DATA_ANALYSIS = 'data_analysis',
  ARCHITECTURE = 'architecture',
  TESTING = 'testing',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  WEB_DEVELOPMENT = 'web_development',
  UI_REFACTORING = 'ui_refactoring'
}

/**
 * Agent capability metadata
 */
export interface AgentCapability {
  specialty: AgentSpecialty;
  supportedLanguages: string[];
  supportedErrorCategories: ErrorCategory[];
  confidence: number; // 0-1
  description: string;
  maxIterations: number;
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  request: string;
  codebaseContext: string;
  errorOutput?: string;
  previousAttempts?: IterationResult[];
  metadata?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  agent: AgentSpecialty;
  iterations: number;
  changes: string[];
  modifiedFiles: string[];
  recommendations: string[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Base Specialist Agent class
 */
export abstract class SpecialistAgent {
  protected capability: AgentCapability;
  protected maxIterations: number = 5;
  protected iterationHistory: IterationResult[] = [];

  constructor(capability: AgentCapability, maxIterations?: number) {
    this.capability = capability;
    if (maxIterations) {
      this.maxIterations = maxIterations;
    } else {
      this.maxIterations = capability.maxIterations;
    }
  }

  /**
   * Get agent capability metadata
   */
  getCapability(): AgentCapability {
    return this.capability;
  }

  /**
   * Check if agent can handle the problem
   */
  canHandle(errorCategory: ErrorCategory, language: string): boolean {
    const supportsCategory = this.capability.supportedErrorCategories.includes(errorCategory);
    const supportsLanguage = this.capability.supportedLanguages.includes(language) || 
                            this.capability.supportedLanguages.includes('*');
    return supportsCategory && supportsLanguage;
  }

  /**
   * Analyze the problem context
   */
  abstract analyzeContext(context: AgentExecutionContext): Promise<FixSuggestion[]>;

  /**
   * Generate specialized fix suggestions
   */
  abstract generateFixSuggestions(context: AgentExecutionContext): Promise<FixSuggestion[]>;

  /**
   * Apply a fix suggestion
   */
  abstract applyFix(fix: FixSuggestion): Promise<boolean>;

  /**
   * Execute agent on problem
   */
  async execute(context: AgentExecutionContext): Promise<AgentExecutionResult> {
    console.log(`\n🤖 AGENT: ${this.capability.specialty.toUpperCase()}`);
    console.log(`📊 Confidence: ${(this.capability.confidence * 100).toFixed(0)}%`);
    console.log(`🔄 Max Iterations: ${this.maxIterations}`);
    console.log('-'.repeat(60));

    this.iterationHistory = [];
    let succeeded = false;
    let iteration = 0;

    try {
      // Analyze context
      console.log('📡 Analyzing context...');
      const suggestions = await this.analyzeContext(context);

      if (suggestions.length === 0) {
        console.log('⚠️  No actionable suggestions found');
        return this.buildResult(false, context, 0);
      }

      // Iterate with fixes
      for (iteration = 1; iteration <= this.maxIterations; iteration++) {
        console.log(`\n--- Agent Iteration ${iteration}/${this.maxIterations} ---`);

        // Get best suggestion for this iteration
        const suggestion = await this.selectBestSuggestion(suggestions, iteration);
        
        if (!suggestion) {
          break;
        }

        // Apply fix
        const applied = await this.applyFix(suggestion);
        
        if (!applied) {
          console.log('⚠️  Failed to apply fix');
          continue;
        }

        // Check if successful (in real implementation, would verify against tests)
        if (suggestion.confidence > 0.8) {
          succeeded = true;
          console.log('✅ Fix applied successfully');
          break;
        }
      }

    } catch (error: any) {
      console.error('❌ Agent execution failed:', error.message);
      return this.buildResult(false, context, iteration, error.message);
    }

    return this.buildResult(succeeded, context, iteration);
  }

  /**
   * Select best suggestion for current iteration
   */
  protected async selectBestSuggestion(
    suggestions: FixSuggestion[],
    iteration: number
  ): Promise<FixSuggestion | null> {
    if (suggestions.length === 0) return null;

    // Sort by confidence and iteration suitability
    const sorted = suggestions.sort((a, b) => {
      // Adjust confidence based on iteration number
      const aScore = a.confidence * (1 - (iteration - 1) * 0.1);
      const bScore = b.confidence * (1 - (iteration - 1) * 0.1);
      return bScore - aScore;
    });

    return sorted[0];
  }

  /**
   * Build execution result
   */
  protected buildResult(
    success: boolean,
    context: AgentExecutionContext,
    iterations: number,
    error?: string
  ): AgentExecutionResult {
    return {
      success,
      agent: this.capability.specialty,
      iterations,
      changes: this.iterationHistory.flatMap(r => r.changes),
      modifiedFiles: [...new Set(this.iterationHistory.flatMap(r => r.modifiedFiles))],
      recommendations: this.generateRecommendations(success, context),
      error,
      metadata: {
        capability: this.capability,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate recommendations for next steps
   */
  protected generateRecommendations(success: boolean, context: AgentExecutionContext): string[] {
    const recommendations: string[] = [];

    if (!success) {
      recommendations.push(`Failed to solve with ${this.capability.specialty} agent`);
      recommendations.push(`Consider routing to different specialist agent`);
      recommendations.push(`Request may require manual intervention`);
    } else {
      recommendations.push(`Solution applied successfully`);
      recommendations.push(`Review changes before committing`);
      recommendations.push(`Run verification tests to confirm`);
    }

    return recommendations;
  }

  /**
   * Record iteration result
   */
  protected recordIteration(result: IterationResult): void {
    this.iterationHistory.push(result);
  }

  /**
   * Get iteration history
   */
  getIterationHistory(): IterationResult[] {
    return this.iterationHistory;
  }
}

/**
 * General purpose specialist agent
 */
export class GeneralSpecialistAgent extends SpecialistAgent {
  constructor() {
    super({
      specialty: AgentSpecialty.GENERAL,
      supportedLanguages: ['*'],
      supportedErrorCategories: Object.values(ErrorCategory),
      confidence: 0.5,
      description: 'General purpose agent for various problem types',
      maxIterations: 5
    });
  }

  async analyzeContext(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    // General analysis
    return [];
  }

  async generateFixSuggestions(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    return [];
  }

  async applyFix(fix: FixSuggestion): Promise<boolean> {
    return false;
  }
}
