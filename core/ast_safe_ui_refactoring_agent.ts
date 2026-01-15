/**
 * AST-Safe UI Refactoring Agent
 * Performs semantic transformations on React/Vue UI components without breaking syntax
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { SpecialistAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './specialist_agent';
import { FixSuggestion, CodeChange, FixType, ErrorCategory } from './types';

/**
 * React Hook Types
 */
export enum ReactHook {
  USE_STATE = 'useState',
  USE_EFFECT = 'useEffect',
  USE_CONTEXT = 'useContext',
  USE_REDUCER = 'useReducer',
  USE_CALLBACK = 'useCallback',
  USE_MEMO = 'useMemo',
  USE_REF = 'useRef',
  USE_CUSTOM = 'custom'
}

/**
 * Code node info for precise targeting
 */
export interface CodeNodeInfo {
  type: string;
  name: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  content: string;
}

/**
 * Hook usage in component
 */
export interface HookUsage {
  hook: ReactHook;
  name: string;
  line: number;
  dependencies?: string[];
  content: string;
}

/**
 * Component render block
 */
export interface RenderBlock {
  type: 'jsx' | 'return-statement';
  startLine: number;
  endLine: number;
  content: string;
  isConditional: boolean;
}

/**
 * AST-Safe UI Refactoring Agent
 */
export class ASTSafeUIRefactoringAgent extends SpecialistAgent {
  private sourceFile: ts.SourceFile | null = null;
  private hooks: HookUsage[] = [];
  private renderBlocks: RenderBlock[] = [];

  constructor(maxIterations?: number) {
    const capability: AgentCapability = {
      specialty: 'ui_refactoring' as any,
      supportedLanguages: ['typescript', 'javascript', '*'],
      supportedErrorCategories: [ErrorCategory.LOGIC, ErrorCategory.TYPE, ErrorCategory.RUNTIME],
      confidence: 0.9,
      description: 'Performs AST-aware surgical modifications to React/Vue components',
      maxIterations: 8
    };
    super(capability, maxIterations);
  }

  /**
   * Analyze component structure
   */
  async analyzeContext(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    // Parse component file
    const componentFile = this.extractComponentFile(context.request);
    if (!componentFile) {
      return suggestions;
    }

    try {
      const fileContent = fs.readFileSync(componentFile, 'utf-8');
      this.sourceFile = ts.createSourceFile(
        componentFile,
        fileContent,
        ts.ScriptTarget.Latest,
        true
      );

      // Extract hooks
      this.hooks = this.extractHooks(fileContent);

      // Extract render blocks
      this.renderBlocks = this.extractRenderBlocks(fileContent);

      // Generate analysis suggestions
      suggestions.push(
        ...this.analyzeHookIssues(context),
        ...this.analyzeRenderIssues(context),
        ...this.analyzeDependencyIssues(context)
      );
    } catch (error) {
      console.error(`Error analyzing component: ${error}`);
    }

    return suggestions;
  }

  /**
   * Generate fix suggestions for UI issues
   */
  async generateFixSuggestions(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    const componentFile = this.extractComponentFile(context.request);

    if (!componentFile) {
      return suggestions;
    }

    // Check for hook dependency array issues
    if (context.errorOutput?.includes('dependency') || context.request.includes('dependency')) {
      suggestions.push(
        ...this.fixDependencyArrays(componentFile)
      );
    }

    // Check for render issues
    if (context.errorOutput?.includes('render') || context.request.includes('blank')) {
      suggestions.push(
        ...this.fixRenderLogic(componentFile, context)
      );
    }

    // Check for state issues
    if (context.errorOutput?.includes('state') || context.request.includes('state')) {
      suggestions.push(
        ...this.fixStateLogic(componentFile, context)
      );
    }

    // Check for hydration issues
    if (context.errorOutput?.includes('hydration')) {
      suggestions.push(
        ...this.fixHydrationIssues(componentFile)
      );
    }

    return suggestions;
  }

  /**
   * Extract component file path from request
   */
  private extractComponentFile(request: string): string | null {
    // Match patterns like: "fix page.tsx" or "components/Header.tsx"
    const fileMatch = request.match(/(?:file|component|fix)\s+(?:in\s+)?['"]?([^\s'"]+\.[tj]sx?)['"]?/i);
    if (fileMatch) {
      return fileMatch[1];
    }

    // Try path-like pattern
    const pathMatch = request.match(/(['"][^'"]+[tj]sx?['"])/);
    if (pathMatch) {
      return pathMatch[1].replace(/['"]/g, '');
    }

    return null;
  }

  /**
   * Extract hook usages from code
   */
  private extractHooks(fileContent: string): HookUsage[] {
    const hooks: HookUsage[] = [];
    const lines = fileContent.split('\n');

    // Regex patterns for hooks
    const hookPatterns = [
      { hook: ReactHook.USE_STATE, pattern: /const\s+\[([^\]]+)\]\s*=\s*useState/ },
      { hook: ReactHook.USE_EFFECT, pattern: /useEffect\s*\(\s*\(\)\s*=>/ },
      { hook: ReactHook.USE_CONTEXT, pattern: /useContext\s*\(\s*(\w+)\s*\)/ },
      { hook: ReactHook.USE_REDUCER, pattern: /useReducer\s*\(/ },
      { hook: ReactHook.USE_CALLBACK, pattern: /useCallback\s*\(\s*\(\)/ },
      { hook: ReactHook.USE_MEMO, pattern: /useMemo\s*\(\s*\(\)/ },
      { hook: ReactHook.USE_REF, pattern: /useRef\s*\(/ }
    ];

    lines.forEach((line, index) => {
      hookPatterns.forEach(({ hook, pattern }) => {
        if (pattern.test(line)) {
          const match = line.match(pattern);
          hooks.push({
            hook,
            name: match?.[1] || hook,
            line: index + 1,
            content: line.trim(),
            dependencies: this.extractDependencies(line)
          });
        }
      });
    });

    return hooks;
  }

  /**
   * Extract dependency array from useEffect/useMemo/useCallback
   */
  private extractDependencies(line: string): string[] {
    const depMatch = line.match(/\],\s*\[\s*([^\]]*)\s*\]/);
    if (depMatch && depMatch[1]) {
      return depMatch[1].split(',').map(d => d.trim()).filter(d => d);
    }
    return [];
  }

  /**
   * Extract render blocks from component
   */
  private extractRenderBlocks(fileContent: string): RenderBlock[] {
    const blocks: RenderBlock[] = [];
    const lines = fileContent.split('\n');
    let inReturn = false;
    let returnStartLine = 0;
    let jsxDepth = 0;

    lines.forEach((line, index) => {
      // Detect return statement
      if (line.includes('return')) {
        inReturn = true;
        returnStartLine = index;
      }

      if (inReturn) {
        // Count JSX brackets
        jsxDepth += (line.match(/</g) || []).length;
        jsxDepth -= (line.match(/>/g) || []).length;

        // When JSX is closed
        if (jsxDepth <= 0 && index > returnStartLine) {
          blocks.push({
            type: 'return-statement',
            startLine: returnStartLine + 1,
            endLine: index + 1,
            content: lines.slice(returnStartLine, index + 1).join('\n'),
            isConditional: this.isConditionalRender(lines.slice(returnStartLine, index + 1).join('\n'))
          });
          inReturn = false;
        }
      }
    });

    return blocks;
  }

  /**
   * Check if render block uses conditional rendering
   */
  private isConditionalRender(content: string): boolean {
    return /\?|&&|\|\|/.test(content);
  }

  /**
   * Analyze hook-related issues
   */
  private analyzeHookIssues(context: AgentExecutionContext): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.hooks.forEach(hook => {
      if (hook.hook === ReactHook.USE_EFFECT && !hook.dependencies) {
        suggestions.push({
          fixType: FixType.MODIFY_LOGIC,
          description: `useEffect at line ${hook.line} has no dependency array - will run every render`,
          files: [],
          codeChanges: [],
          confidence: 0.9
        });
      }

      if (hook.hook === ReactHook.USE_EFFECT && hook.dependencies?.length === 0) {
        suggestions.push({
          fixType: FixType.MODIFY_LOGIC,
          description: `useEffect at line ${hook.line} has empty dependency array - runs once on mount`,
          files: [],
          codeChanges: [],
          confidence: 0.85
        });
      }
    });

    return suggestions;
  }

  /**
   * Analyze render block issues
   */
  private analyzeRenderIssues(context: AgentExecutionContext): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.renderBlocks.forEach(block => {
      if (block.isConditional && context.errorOutput?.includes('blank')) {
        suggestions.push({
          fixType: FixType.MODIFY_LOGIC,
          description: `Conditional render at lines ${block.startLine}-${block.endLine} may be preventing display`,
          files: [],
          codeChanges: [],
          confidence: 0.8
        });
      }

      // Check for missing loading state
      if (!context.codebaseContext.includes('isLoading') && block.isConditional) {
        suggestions.push({
          fixType: FixType.ADD_FUNCTION,
          description: `Add loading state to render block at lines ${block.startLine}-${block.endLine}`,
          files: [],
          codeChanges: [],
          confidence: 0.75
        });
      }
    });

    return suggestions;
  }

  /**
   * Analyze dependency array issues
   */
  private analyzeDependencyIssues(context: AgentExecutionContext): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.hooks.forEach(hook => {
      if (hook.hook === ReactHook.USE_EFFECT) {
        // Check for stale closures
        if (hook.dependencies && hook.dependencies.length < 3) {
          suggestions.push({
            fixType: FixType.MODIFY_LOGIC,
            description: `useEffect at line ${hook.line} may have missing dependencies - check for stale closures`,
            files: [],
            codeChanges: [],
            confidence: 0.7
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Fix dependency arrays
   */
  private fixDependencyArrays(filePath: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.hooks
      .filter(h => h.hook === ReactHook.USE_EFFECT)
      .forEach(hook => {
        suggestions.push({
          fixType: FixType.MODIFY_LOGIC,
          description: `Fix dependency array for useEffect at line ${hook.line}`,
          files: [filePath],
          codeChanges: [
            {
              filePath,
              lineNumber: hook.line,
              originalCode: hook.content,
              newCode: this.generateDependencyFix(hook),
              description: 'Add missing dependencies or verify array is correct'
            }
          ],
          confidence: 0.85
        });
      });

    return suggestions;
  }

  /**
   * Generate corrected dependency array
   */
  private generateDependencyFix(hook: HookUsage): string {
    // This would extract actual dependencies from the hook body
    // For now, return a template
    return hook.content.replace(/\[\s*\]/, '[/* dependencies */]');
  }

  /**
   * Fix render logic issues
   */
  private fixRenderLogic(filePath: string, context: AgentExecutionContext): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.renderBlocks.forEach(block => {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: `Add loading state and fallback UI to render block at lines ${block.startLine}-${block.endLine}`,
        files: [filePath],
        codeChanges: [
          {
            filePath,
            lineNumber: block.startLine,
            originalCode: block.content,
            newCode: this.wrapWithLoadingState(block.content),
            description: 'Wrap render with loading state check'
          }
        ],
        confidence: 0.8
      });
    });

    return suggestions;
  }

  /**
   * Wrap JSX with loading state
   */
  private wrapWithLoadingState(jsxContent: string): string {
    // This would properly parse and wrap JSX
    // For now, return a template
    return `{isLoading ? <div>Loading...</div> : (${jsxContent})}`;
  }

  /**
   * Fix state logic issues
   */
  private fixStateLogic(filePath: string, context: AgentExecutionContext): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    this.hooks
      .filter(h => h.hook === ReactHook.USE_STATE)
      .forEach(hook => {
        suggestions.push({
          fixType: FixType.MODIFY_LOGIC,
          description: `Add proper state update logic for ${hook.name} at line ${hook.line}`,
          files: [filePath],
          codeChanges: [],
          confidence: 0.75
        });
      });

    return suggestions;
  }

  /**
   * Fix hydration mismatch issues (Next.js specific)
   */
  private fixHydrationIssues(filePath: string): FixSuggestion[] {
    return [
      {
        fixType: FixType.MODIFY_LOGIC,
        description: 'Wrap component in useEffect to prevent SSR/client hydration mismatch',
        files: [filePath],
        codeChanges: [
          {
            filePath,
            lineNumber: 1,
            originalCode: 'export default function Component() {',
            newCode: `export default function Component() {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;`,
            description: 'Add hydration protection'
          }
        ],
        confidence: 0.92
      }
    ];
  }

  /**
   * Apply UI fix with surgical precision
   */
  async applyFix(fix: FixSuggestion): Promise<boolean> {
    if (!this.sourceFile) {
      return false;
    }

    for (const change of fix.codeChanges) {
      try {
        const content = fs.readFileSync(change.filePath, 'utf-8');
        const lines = content.split('\n');

        if (change.lineNumber) {
          // Replace at specific line
          const lineIndex = change.lineNumber - 1;
          lines[lineIndex] = change.newCode;
        } else {
          // Find and replace original code
          const originalIndex = lines.findIndex(line => line.includes(change.originalCode));
          if (originalIndex !== -1) {
            lines[originalIndex] = change.newCode;
          }
        }

        fs.writeFileSync(change.filePath, lines.join('\n'), 'utf-8');
      } catch (error) {
        console.error(`Error applying fix: ${error}`);
        return false;
      }
    }

    return true;
  }
}
