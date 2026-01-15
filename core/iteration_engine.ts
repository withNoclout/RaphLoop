/**
 * Iteration Engine
 * Analyzes errors and applies fixes iteratively
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ErrorPattern,
  ErrorCategory,
  FixSuggestion,
  FixType,
  CodeChange,
  IterationResult
} from './types';

export class IterationEngine {
  private errorPatterns: ErrorPattern[];

  constructor() {
    this.errorPatterns = this.initializeErrorPatterns();
  }

  /**
   * Initialize error patterns for analysis
   */
  private initializeErrorPatterns(): ErrorPattern[] {
    return [
      // TypeScript/JavaScript Syntax Errors
      {
        pattern: /SyntaxError|Unexpected token|Unexpected identifier/i,
        category: ErrorCategory.SYNTAX,
        severity: 'critical',
        description: 'Syntax error in code'
      },
      {
        pattern: /Cannot find module|Module not found/i,
        category: ErrorCategory.DEPENDENCY,
        severity: 'high',
        description: 'Missing module or import'
      },
      {
        pattern: /Property '[^']+' does not exist on type|Object is possibly/i,
        category: ErrorCategory.TYPE,
        severity: 'medium',
        description: 'Type error'
      },
      {
        pattern: /is not defined|is not a function|has no method/i,
        category: ErrorCategory.LOGIC,
        severity: 'high',
        description: 'Undefined variable or function'
      },
      {
        pattern: /AssertionError|Test failed|Expected .* to/i,
        category: ErrorCategory.TEST,
        severity: 'medium',
        description: 'Test assertion failure'
      },
      {
        pattern: /Cannot read property|Cannot read/i,
        category: ErrorCategory.RUNTIME,
        severity: 'high',
        description: 'Runtime null/undefined access'
      },
      {
        pattern: /TypeError/i,
        category: ErrorCategory.TYPE,
        severity: 'high',
        description: 'Type error'
      },
      {
        pattern: /ReferenceError/i,
        category: ErrorCategory.DEPENDENCY,
        severity: 'high',
        description: 'Reference to undefined variable'
      }
    ];
  }

  /**
   * Analyze error output and categorize
   */
  analyzeError(errorOutput: string): ErrorPattern | null {
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(errorOutput)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Generate fix suggestions based on error
   */
  generateFixSuggestions(errorOutput: string, codebaseContext: string): FixSuggestion[] {
    const errorPattern = this.analyzeError(errorOutput);
    
    if (!errorPattern) {
      return [];
    }

    const suggestions: FixSuggestion[] = [];

    // Generate suggestions based on error category
    switch (errorPattern.category) {
      case ErrorCategory.SYNTAX:
        suggestions.push(...this.generateSyntaxFixSuggestions(errorOutput));
        break;
      case ErrorCategory.DEPENDENCY:
        suggestions.push(...this.generateDependencyFixSuggestions(errorOutput));
        break;
      case ErrorCategory.TYPE:
        suggestions.push(...this.generateTypeFixSuggestions(errorOutput));
        break;
      case ErrorCategory.LOGIC:
        suggestions.push(...this.generateLogicFixSuggestions(errorOutput));
        break;
      case ErrorCategory.TEST:
        suggestions.push(...this.generateTestFixSuggestions(errorOutput));
        break;
      case ErrorCategory.RUNTIME:
        suggestions.push(...this.generateRuntimeFixSuggestions(errorOutput));
        break;
    }

    return suggestions;
  }

  /**
   * Generate syntax fix suggestions
   */
  private generateSyntaxFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    // Try to extract line number from error
    const lineMatch = errorOutput.match(/line (\d+)/i);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : undefined;
    
    // Common syntax fixes
    suggestions.push({
      fixType: FixType.FIX_SYNTAX,
      description: 'Fix syntax error',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [
        {
          filePath: '',
          lineNumber,
          originalCode: '',
          newCode: '',
          description: 'Review and fix syntax at this location'
        }
      ],
      confidence: 0.6
    });

    return suggestions;
  }

  /**
   * Generate dependency fix suggestions
   */
  private generateDependencyFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    // Extract module name from error
    const moduleMatch = errorOutput.match(/Cannot find module ['"]([^'"]+)['"]/i);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      
      suggestions.push({
        fixType: FixType.ADD_IMPORT,
        description: `Add import for ${moduleName}`,
        files: this.findAffectedFiles(errorOutput),
        codeChanges: [],
        confidence: 0.8
      });

      // Suggest installing package
      suggestions.push({
        fixType: FixType.ADD_DEPENDENCY,
        description: `Install ${moduleName} package`,
        files: ['package.json'],
        codeChanges: [],
        confidence: 0.7
      });
    }

    return suggestions;
  }

  /**
   * Generate type fix suggestions
   */
  private generateTypeFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    suggestions.push({
      fixType: FixType.UPDATE_TYPE,
      description: 'Update type definitions',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [],
      confidence: 0.7
    });

    return suggestions;
  }

  /**
   * Generate logic fix suggestions
   */
  private generateLogicFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Fix logic error',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [],
      confidence: 0.5
    });

    return suggestions;
  }

  /**
   * Generate test fix suggestions
   */
  private generateTestFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    suggestions.push({
      fixType: FixType.UPDATE_TEST,
      description: 'Update test expectations',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [],
      confidence: 0.6
    });

    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Fix implementation to match test expectations',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [],
      confidence: 0.7
    });

    return suggestions;
  }

  /**
   * Generate runtime fix suggestions
   */
  private generateRuntimeFixSuggestions(errorOutput: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];
    
    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Fix runtime null/undefined access',
      files: this.findAffectedFiles(errorOutput),
      codeChanges: [],
      confidence: 0.6
    });

    return suggestions;
  }

  /**
   * Find files affected by error
   */
  private findAffectedFiles(errorOutput: string): string[] {
    const files: string[] = [];
    
    // Extract file paths from error output
    const fileMatches = errorOutput.match(/at\s+([^\s]+\.tsx?)/g) || [];
    for (const match of fileMatches) {
      const filePath = match.replace('at ', '').trim();
      if (filePath && !files.includes(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  }

  /**
   * Apply fix to codebase
   */
  async applyFix(fix: FixSuggestion): Promise<boolean> {
    try {
      console.log(`\nApplying fix: ${fix.description}`);
      
      for (const codeChange of fix.codeChanges) {
        if (codeChange.filePath) {
          await this.applyCodeChange(codeChange);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to apply fix:', error);
      return false;
    }
  }

  /**
   * Apply individual code change
   */
  private async applyCodeChange(change: CodeChange): Promise<void> {
    const filePath = change.filePath;
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (change.lineNumber && change.lineNumber <= lines.length) {
      // Replace specific line
      lines[change.lineNumber - 1] = change.newCode;
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      console.log(`Modified line ${change.lineNumber} in ${filePath}`);
    } else if (change.originalCode) {
      // Replace by content
      const newContent = content.replace(change.originalCode, change.newCode);
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Modified ${filePath}`);
      }
    }
  }

  /**
   * Execute a single iteration
   */
  async executeIteration(
    errorOutput: string,
    codebaseContext: string,
    iteration: number
  ): Promise<IterationResult> {
    console.log(`\n--- Iteration ${iteration} ---`);
    
    // Generate fix suggestions
    const suggestions = this.generateFixSuggestions(errorOutput, codebaseContext);
    
    if (suggestions.length === 0) {
      return {
        success: false,
        iteration,
        changes: [],
        modifiedFiles: [],
        error: 'No fix suggestions generated'
      };
    }

    // Apply the best suggestion (highest confidence)
    const bestSuggestion = suggestions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const success = await this.applyFix(bestSuggestion);
    
    return {
      success,
      iteration,
      changes: [bestSuggestion.description],
      modifiedFiles: bestSuggestion.files,
      error: success ? undefined : 'Failed to apply fix'
    };
  }
}
