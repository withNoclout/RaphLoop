/**
 * Multi-Agent Orchestrator
 * Routes problems to appropriate specialist agents and coordinates solutions
 */

import {
  SpecialistAgent,
  AgentSpecialty,
  AgentExecutionContext,
  AgentExecutionResult
} from './specialist_agent';
import { DataAnalysisSpecialistAgent } from './data_analysis_agent';
import { ErrorCategory, IterationResult } from './types';

/**
 * Problem classification for routing
 */
export interface ProblemClassification {
  primaryCategory: ErrorCategory;
  secondaryCategories: ErrorCategory[];
  suggestedAgents: AgentSpecialty[];
  confidence: number;
  description: string;
}

/**
 * Multi-agent execution result
 */
export interface MultiAgentResult {
  succeeded: boolean;
  primaryAgent: AgentSpecialty;
  agentsUsed: AgentSpecialty[];
  totalIterations: number;
  changes: string[];
  modifiedFiles: string[];
  executionPath: string[];
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    problemClassification: ProblemClassification;
  };
}

/**
 * Multi-Agent Orchestrator
 */
export class MultiAgentOrchestrator {
  private agents: Map<AgentSpecialty, SpecialistAgent>;
  private classificationPatterns: Map<string, ProblemClassification>;
  private executionPath: string[] = [];

  constructor() {
    this.agents = new Map();
    this.classificationPatterns = new Map();
    this.initializeAgents();
  }

  /**
   * Initialize all specialist agents
   */
  private initializeAgents(): void {
    // Data Analysis Agent
    this.agents.set(AgentSpecialty.DATA_ANALYSIS, new DataAnalysisSpecialistAgent(7));

    // TODO: Add other specialist agents as they are created
    // this.agents.set(AgentSpecialty.ARCHITECTURE, new ArchitectureSpecialistAgent());
    // this.agents.set(AgentSpecialty.TESTING, new TestingSpecialistAgent());
    // this.agents.set(AgentSpecialty.PERFORMANCE, new PerformanceSpecialistAgent());
    // this.agents.set(AgentSpecialty.SECURITY, new SecuritySpecialistAgent());
  }

  /**
   * Classify the problem to route to appropriate agents
   */
  classifyProblem(context: AgentExecutionContext): ProblemClassification {
    const errorOutput = context.errorOutput || '';
    const codeContext = context.codebaseContext || '';
    const request = context.request || '';

    // Detect primary category
    const primaryCategory = this.detectPrimaryCategory(errorOutput, request);
    const secondaryCategories = this.detectSecondaryCategories(errorOutput);

    // Determine suitable agents
    const suggestedAgents = this.selectSuitableAgents(
      primaryCategory,
      secondaryCategories,
      context
    );

    // Calculate confidence
    const confidence = this.calculateClassificationConfidence(
      errorOutput,
      suggestedAgents
    );

    return {
      primaryCategory,
      secondaryCategories,
      suggestedAgents,
      confidence,
      description: `${primaryCategory} issue, likely solvable by ${suggestedAgents.join(', ')} agent(s)`
    };
  }

  /**
   * Detect primary error category
   */
  private detectPrimaryCategory(errorOutput: string, request: string): ErrorCategory {
    const combined = (errorOutput + request).toLowerCase();

    if (combined.includes('data') || combined.includes('query') || combined.includes('sql')) {
      return ErrorCategory.LOGIC;
    }
    if (combined.includes('test') || combined.includes('expect')) {
      return ErrorCategory.TEST;
    }
    if (combined.includes('type') || combined.includes('typescript')) {
      return ErrorCategory.TYPE;
    }
    if (combined.includes('syntax') || combined.includes('token')) {
      return ErrorCategory.SYNTAX;
    }
    if (combined.includes('import') || combined.includes('module')) {
      return ErrorCategory.DEPENDENCY;
    }
    if (combined.includes('build') || combined.includes('compile')) {
      return ErrorCategory.BUILD;
    }
    if (combined.includes('lint') || combined.includes('eslint')) {
      return ErrorCategory.LINT;
    }
    if (combined.includes('performance') || combined.includes('slow')) {
      return ErrorCategory.OTHER;
    }

    return ErrorCategory.LOGIC;
  }

  /**
   * Detect secondary error categories
   */
  private detectSecondaryCategories(errorOutput: string): ErrorCategory[] {
    const categories: ErrorCategory[] = [];
    const lower = errorOutput.toLowerCase();

    if (lower.includes('type')) categories.push(ErrorCategory.TYPE);
    if (lower.includes('null') || lower.includes('undefined')) categories.push(ErrorCategory.RUNTIME);
    if (lower.includes('null')) categories.push(ErrorCategory.RUNTIME);

    return categories;
  }

  /**
   * Select suitable agents for the problem
   */
  private selectSuitableAgents(
    primaryCategory: ErrorCategory,
    secondaryCategories: ErrorCategory[],
    context: AgentExecutionContext
  ): AgentSpecialty[] {
    const suggested: AgentSpecialty[] = [];
    const request = (context.request || '').toLowerCase();
    const codebase = (context.codebaseContext || '').toLowerCase();

    // Check for web development needs (HIGHEST PRIORITY IN v3.0)
    const webDevKeywords = [
      'session', 'login', 'auth', 'cookie', 'bearer', 'token',
      'nextauth', 'express', 'nestjs', 'fastapi', 'django',
      'middleware', 'redirect', 'csrf', 'cors', 'credential',
      'hydration', 'useeffect', 'usestate', 'context', 'redux', 'zustand'
    ];
    const hasWebDevKeyword = webDevKeywords.some(kw => request.includes(kw) || codebase.includes(kw));
    if (hasWebDevKeyword) {
      suggested.push(AgentSpecialty.WEB_DEVELOPMENT);
    }

    // Check for UI refactoring needs
    const uiKeywords = [
      'component', 'render', 'blank', 'display', 'hook', 'state',
      'react', 'vue', 'jsx', 'tsx', 'useeffect', 'usestate'
    ];
    const hasUIKeyword = uiKeywords.some(kw => request.includes(kw) || codebase.includes(kw));
    if (hasUIKeyword && !suggested.includes(AgentSpecialty.WEB_DEVELOPMENT)) {
      suggested.push(AgentSpecialty.UI_REFACTORING);
    }

    // Check for data analysis needs
    if (request.includes('data') || request.includes('query') || request.includes('sql') ||
        request.includes('parse') || request.includes('transform') || request.includes('analysis')) {
      suggested.push(AgentSpecialty.DATA_ANALYSIS);
    }

    // Check for testing needs
    if (request.includes('test') || primaryCategory === ErrorCategory.TEST) {
      suggested.push(AgentSpecialty.TESTING);
    }

    // Check for architecture needs
    if (request.includes('architecture') || request.includes('structure') || 
        request.includes('refactor') || request.includes('design')) {
      suggested.push(AgentSpecialty.ARCHITECTURE);
    }

    // Check for performance needs
    if (request.includes('performance') || request.includes('optimize') || 
        request.includes('fast') || request.includes('slow')) {
      suggested.push(AgentSpecialty.PERFORMANCE);
    }

    // Check for security needs
    if (request.includes('security') || request.includes('vulnerable') || 
        request.includes('encrypt')) {
      suggested.push(AgentSpecialty.SECURITY);
    }

    // Default to general if no specific match
    if (suggested.length === 0) {
      suggested.push(AgentSpecialty.GENERAL);
    }

    return suggested;
  }

  /**
   * Calculate classification confidence
   */
  private calculateClassificationConfidence(
    errorOutput: string,
    suggestedAgents: AgentSpecialty[]
  ): number {
    // More detailed error messages = higher confidence
    const errorLength = errorOutput.length;
    let confidence = Math.min(0.9, errorLength / 1000);

    // Multiple agents = lower confidence (more complex)
    confidence *= (1 - (suggestedAgents.length - 1) * 0.1);

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Execute with multi-agent routing
   */
  async execute(context: AgentExecutionContext): Promise<MultiAgentResult> {
    const startTime = Date.now();
    this.executionPath = [];

    console.log('\n' + '='.repeat(60));
    console.log('🤖 MULTI-AGENT ORCHESTRATOR ACTIVATED');
    console.log('='.repeat(60));

    // Classify problem
    console.log('\n🔍 CLASSIFICATION PHASE');
    console.log('-'.repeat(60));
    const classification = this.classifyProblem(context);

    console.log(`Primary Category: ${classification.primaryCategory}`);
    console.log(`Suggested Agents: ${classification.suggestedAgents.join(', ')}`);
    console.log(`Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
    console.log(`Description: ${classification.description}`);

    // Execute with primary agent
    let result: AgentExecutionResult | null = null;
    const agentsUsed: AgentSpecialty[] = [];
    let totalIterations = 0;

    for (const agentSpecialty of classification.suggestedAgents) {
      const agent = this.agents.get(agentSpecialty);
      
      if (!agent) {
        console.log(`\n⚠️  Agent not available: ${agentSpecialty}`);
        continue;
      }

      console.log(`\n📋 AGENT EXECUTION: ${agentSpecialty}`);
      console.log('-'.repeat(60));

      this.executionPath.push(`${agentSpecialty}(start)`);

      try {
        result = await agent.execute(context);
        agentsUsed.push(agentSpecialty);
        totalIterations += result.iterations;

        console.log(`\n✅ ${agentSpecialty} execution completed`);
        console.log(`Iterations: ${result.iterations}`);
        console.log(`Success: ${result.success}`);

        this.executionPath.push(`${agentSpecialty}(end)`);

        // If successful, no need to try other agents
        if (result.success) {
          console.log(`\n✨ PROBLEM SOLVED by ${agentSpecialty}`);
          break;
        }

        // If failed, try next agent
        console.log(`\n⚠️  ${agentSpecialty} unsuccessful, trying next agent...`);
        
      } catch (error: any) {
        console.error(`\n❌ ${agentSpecialty} execution failed: ${error.message}`);
        this.executionPath.push(`${agentSpecialty}(error)`);
      }
    }

    const endTime = Date.now();

    // Build result
    const succeeded = result?.success || false;
    const primaryAgent = agentsUsed[0] || AgentSpecialty.GENERAL;

    return {
      succeeded,
      primaryAgent,
      agentsUsed,
      totalIterations,
      changes: result?.changes || [],
      modifiedFiles: result?.modifiedFiles || [],
      executionPath: this.executionPath,
      metadata: {
        startTime,
        endTime,
        duration: endTime - startTime,
        problemClassification: classification
      }
    };
  }

  /**
   * Register a custom specialist agent
   */
  registerAgent(agent: SpecialistAgent, specialty: AgentSpecialty): void {
    this.agents.set(specialty, agent);
    console.log(`✓ Registered agent: ${specialty}`);
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): AgentSpecialty[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get specific agent
   */
  getAgent(specialty: AgentSpecialty): SpecialistAgent | undefined {
    return this.agents.get(specialty);
  }
}
