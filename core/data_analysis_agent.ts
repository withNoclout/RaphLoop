/**
 * Data Analysis Specialist Agent
 * Specialized for data analysis, SQL queries, data parsing, and reporting
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  SpecialistAgent,
  AgentSpecialty,
  AgentCapability,
  AgentExecutionContext,
  AgentExecutionResult
} from './specialist_agent';
import {
  FixSuggestion,
  FixType,
  ErrorCategory,
  CodeChange,
  IterationResult
} from './types';

/**
 * Data analysis patterns and problems
 */
enum DataAnalysisProblemType {
  SQL_QUERY = 'sql_query',
  DATA_PARSING = 'data_parsing',
  DATA_VALIDATION = 'data_validation',
  DATA_TRANSFORMATION = 'data_transformation',
  STATISTICAL_ANALYSIS = 'statistical_analysis',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  DATA_INTEGRITY = 'data_integrity'
}

/**
 * Data Analysis Specialist Agent
 */
export class DataAnalysisSpecialistAgent extends SpecialistAgent {
  private sqlPatterns: RegExp[] = [];
  private dataPatterns: RegExp[] = [];

  constructor(maxIterations: number = 7) {
    super({
      specialty: AgentSpecialty.DATA_ANALYSIS,
      supportedLanguages: ['javascript', 'typescript', 'python', 'sql', '*'],
      supportedErrorCategories: [
        ErrorCategory.LOGIC,
        ErrorCategory.RUNTIME,
        ErrorCategory.TYPE,
        ErrorCategory.SYNTAX,
        ErrorCategory.OTHER
      ],
      confidence: 0.75,
      description: 'Specialized agent for data analysis, SQL queries, and data processing',
      maxIterations: 7
    }, maxIterations);

    this.initializePatterns();
  }

  /**
   * Initialize pattern detection for data issues
   */
  private initializePatterns(): void {
    // SQL patterns
    this.sqlPatterns = [
      /SQL error|syntax error in query/i,
      /column.*not found|unknown column/i,
      /table.*not found|no such table/i,
      /constraint violation|foreign key/i,
      /database.*locked|query timeout/i,
      /invalid date|type mismatch/i
    ];

    // Data processing patterns
    this.dataPatterns = [
      /null.*reference|cannot read property/i,
      /array.*index|out of bounds/i,
      /invalid.*format|parsing failed/i,
      /duplicate.*key|unique constraint/i,
      /missing.*required.*field/i,
      /data type.*mismatch/i
    ];
  }

  /**
   * Analyze execution context for data problems
   */
  async analyzeContext(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    console.log('📊 Analyzing data analysis context...');

    const suggestions: FixSuggestion[] = [];
    
    // Detect problem type
    const problemType = this.detectProblemType(context);
    console.log(`🔍 Detected problem type: ${problemType}`);

    // Get file context
    const files = this.findRelevantDataFiles(context.codebaseContext);
    console.log(`📁 Found ${files.length} relevant files`);

    // Generate appropriate suggestions
    switch (problemType) {
      case DataAnalysisProblemType.SQL_QUERY:
        suggestions.push(...await this.generateSQLFixSuggestions(context, files));
        break;
      case DataAnalysisProblemType.DATA_PARSING:
        suggestions.push(...await this.generateDataParsingFixSuggestions(context, files));
        break;
      case DataAnalysisProblemType.DATA_VALIDATION:
        suggestions.push(...await this.generateValidationFixSuggestions(context, files));
        break;
      case DataAnalysisProblemType.DATA_TRANSFORMATION:
        suggestions.push(...await this.generateTransformationFixSuggestions(context, files));
        break;
      case DataAnalysisProblemType.STATISTICAL_ANALYSIS:
        suggestions.push(...await this.generateStatisticalFixSuggestions(context, files));
        break;
      default:
        suggestions.push(...await this.generateGenericDataFixSuggestions(context, files));
    }

    console.log(`💡 Generated ${suggestions.length} fix suggestions`);
    return suggestions;
  }

  /**
   * Generate fix suggestions (required override)
   */
  async generateFixSuggestions(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    return this.analyzeContext(context);
  }

  /**
   * Apply a fix
   */
  async applyFix(fix: FixSuggestion): Promise<boolean> {
    try {
      console.log(`\n🔧 Applying: ${fix.description}`);

      // Apply code changes
      for (const change of fix.codeChanges) {
        if (change.filePath && fs.existsSync(change.filePath)) {
          const content = fs.readFileSync(change.filePath, 'utf-8');
          const newContent = content.replace(change.originalCode, change.newCode);
          
          if (newContent !== content) {
            fs.writeFileSync(change.filePath, newContent, 'utf-8');
            console.log(`✓ Modified: ${change.filePath}`);
          }
        }
      }

      // Record iteration
      this.recordIteration({
        success: true,
        iteration: this.iterationHistory.length + 1,
        changes: [fix.description],
        modifiedFiles: fix.files,
        error: undefined
      });

      return true;
    } catch (error: any) {
      console.error(`❌ Failed to apply fix: ${error.message}`);
      return false;
    }
  }

  /**
   * Detect type of data problem
   */
  private detectProblemType(context: AgentExecutionContext): DataAnalysisProblemType {
    const error = (context.errorOutput || '').toLowerCase();
    
    if (error.includes('sql') || error.includes('query') || error.includes('select')) {
      return DataAnalysisProblemType.SQL_QUERY;
    }
    if (error.includes('parse') || error.includes('json') || error.includes('csv')) {
      return DataAnalysisProblemType.DATA_PARSING;
    }
    if (error.includes('null') || error.includes('undefined') || error.includes('required')) {
      return DataAnalysisProblemType.DATA_VALIDATION;
    }
    if (error.includes('transform') || error.includes('map') || error.includes('filter')) {
      return DataAnalysisProblemType.DATA_TRANSFORMATION;
    }
    if (error.includes('average') || error.includes('aggregate') || error.includes('group')) {
      return DataAnalysisProblemType.STATISTICAL_ANALYSIS;
    }
    if (error.includes('performance') || error.includes('optimize') || error.includes('slow')) {
      return DataAnalysisProblemType.PERFORMANCE_OPTIMIZATION;
    }

    return DataAnalysisProblemType.DATA_VALIDATION;
  }

  /**
   * Find relevant data files
   */
  private findRelevantDataFiles(codebaseContext: string): string[] {
    const files: string[] = [];
    const patterns = [
      /.*\.(sql|py|ts|js)$/,
      /.*data.*\.(json|csv|xml)$/,
      /.*query.*\.(sql|ts|js)$/,
      /.*service.*\.(ts|js)$/,
      /.*repository.*\.(ts|js)$/
    ];

    // This would normally search the actual codebase
    // For now, return empty as we parse the context
    return files;
  }

  /**
   * Generate SQL-specific fix suggestions
   */
  private async generateSQLFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Fix SQL query syntax and structure',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Validate and fix SQL query',
        lineNumber: undefined
      }],
      confidence: 0.8
    });

    suggestions.push({
      fixType: FixType.UPDATE_TYPE,
      description: 'Add query parameter validation',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Add parameter type checking',
        lineNumber: undefined
      }],
      confidence: 0.7
    });

    return suggestions;
  }

  /**
   * Generate data parsing fix suggestions
   */
  private async generateDataParsingFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Fix data parsing logic',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Implement robust parsing with error handling',
        lineNumber: undefined
      }],
      confidence: 0.75
    });

    suggestions.push({
      fixType: FixType.ADD_FUNCTION,
      description: 'Add data validation helper',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Create validation utility function',
        lineNumber: undefined
      }],
      confidence: 0.65
    });

    return suggestions;
  }

  /**
   * Generate validation fix suggestions
   */
  private async generateValidationFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.ADD_FUNCTION,
      description: 'Add null/undefined validation',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Add safety checks for nullable fields',
        lineNumber: undefined
      }],
      confidence: 0.85
    });

    suggestions.push({
      fixType: FixType.UPDATE_TYPE,
      description: 'Add TypeScript type guards',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Implement type guards for data validation',
        lineNumber: undefined
      }],
      confidence: 0.8
    });

    return suggestions;
  }

  /**
   * Generate transformation fix suggestions
   */
  private async generateTransformationFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.REFACTOR,
      description: 'Refactor data transformation pipeline',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Optimize transformation logic',
        lineNumber: undefined
      }],
      confidence: 0.7
    });

    return suggestions;
  }

  /**
   * Generate statistical analysis fix suggestions
   */
  private async generateStatisticalFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.ADD_FUNCTION,
      description: 'Implement statistical functions',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Add aggregation and statistical calculations',
        lineNumber: undefined
      }],
      confidence: 0.75
    });

    return suggestions;
  }

  /**
   * Generate generic data fix suggestions
   */
  private async generateGenericDataFixSuggestions(
    context: AgentExecutionContext,
    files: string[]
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Review and fix data handling logic',
      files,
      codeChanges: [{
        filePath: files[0] || '',
        originalCode: '',
        newCode: '',
        description: 'Fix data processing issue',
        lineNumber: undefined
      }],
      confidence: 0.6
    });

    return suggestions;
  }

  /**
   * Override recommendations for data analysis
   */
  protected generateRecommendations(success: boolean, context: AgentExecutionContext): string[] {
    const recommendations = super.generateRecommendations(success, context);

    if (success) {
      recommendations.push('Validate data integrity after changes');
      recommendations.push('Run integration tests for data flow');
      recommendations.push('Check performance impact of changes');
    } else {
      recommendations.push('Consider adding data logging for debugging');
      recommendations.push('Review sample data and edge cases');
      recommendations.push('May require manual data migration');
    }

    return recommendations;
  }
}
