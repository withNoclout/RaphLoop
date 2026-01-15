/**
 * AST-Based Code Analyzer
 * Provides semantic understanding of code structure using AST analysis
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * AST Node types
 */
export interface ASTNode {
  type: string;
  name?: string;
  line?: number;
  column?: number;
  children?: ASTNode[];
  value?: any;
  metadata?: Record<string, any>;
}

/**
 * Code element information
 */
export interface CodeElement {
  type: 'function' | 'class' | 'variable' | 'import' | 'export';
  name: string;
  filePath: string;
  lineNumber: number;
  scope: string;
  dependencies: string[];
  usedBy: string[];
  metadata?: Record<string, any>;
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  nodes: CodeElement[];
  edges: Array<{ from: string; to: string; type: string }>;
  cycles: string[][];
  orphans: string[];
}

/**
 * Code structure analysis
 */
export interface CodeStructure {
  files: string[];
  functions: CodeElement[];
  classes: CodeElement[];
  variables: CodeElement[];
  imports: CodeElement[];
  exports: CodeElement[];
  dependencyGraph: DependencyGraph;
  metrics: {
    totalLines: number;
    complexityScore: number;
    modularity: number;
    maintainability: number;
  };
}

/**
 * AST-Based Code Analyzer
 */
export class ASTCodeAnalyzer {
  private codeStructure: CodeStructure | null = null;

  /**
   * Analyze a codebase and build AST representation
   */
  analyzeCodebase(rootPath: string): CodeStructure {
    console.log(`\n🔍 AST ANALYSIS: Analyzing ${rootPath}`);
    console.log('-'.repeat(60));

    const files = this.findSourceFiles(rootPath);
    console.log(`Found ${files.length} source files`);

    const structure: CodeStructure = {
      files,
      functions: [],
      classes: [],
      variables: [],
      imports: [],
      exports: [],
      dependencyGraph: {
        nodes: [],
        edges: [],
        cycles: [],
        orphans: []
      },
      metrics: {
        totalLines: 0,
        complexityScore: 0,
        modularity: 0,
        maintainability: 0
      }
    };

    // Parse each file
    for (const filePath of files) {
      try {
        const elements = this.parseFile(filePath);
        structure.functions.push(...elements.functions);
        structure.classes.push(...elements.classes);
        structure.variables.push(...elements.variables);
        structure.imports.push(...elements.imports);
        structure.exports.push(...elements.exports);
        structure.metrics.totalLines += this.countLines(filePath);
      } catch (error: any) {
        console.log(`⚠️  Could not parse ${filePath}: ${error.message}`);
      }
    }

    // Build dependency graph
    structure.dependencyGraph = this.buildDependencyGraph(structure);

    // Calculate metrics
    structure.metrics = this.calculateMetrics(structure);

    this.codeStructure = structure;
    console.log(`✓ Analysis complete: ${structure.functions.length} functions, ${structure.classes.length} classes`);

    return structure;
  }

  /**
   * Find all source files in directory
   */
  private findSourceFiles(rootPath: string): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];

    const traverse = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
            traverse(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    traverse(rootPath);
    return files;
  }

  /**
   * Count lines in a file
   */
  private countLines(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  /**
   * Parse a single file
   */
  private parseFile(filePath: string): {
    functions: CodeElement[];
    classes: CodeElement[];
    variables: CodeElement[];
    imports: CodeElement[];
    exports: CodeElement[];
  } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    return {
      functions: this.extractFunctions(filePath, lines),
      classes: this.extractClasses(filePath, lines),
      variables: this.extractVariables(filePath, lines),
      imports: this.extractImports(filePath, lines),
      exports: this.extractExports(filePath, lines)
    };
  }

  /**
   * Extract functions from code
   */
  private extractFunctions(filePath: string, lines: string[]): CodeElement[] {
    const functions: CodeElement[] = [];
    const functionPattern = /^\s*(async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s*)?\(/gm;

    lines.forEach((line, index) => {
      const match = functionPattern.exec(line);
      if (match) {
        const name = match[2] || match[3];
        functions.push({
          type: 'function',
          name,
          filePath,
          lineNumber: index + 1,
          scope: 'file',
          dependencies: this.extractDependencies(line),
          usedBy: []
        });
      }
    });

    return functions;
  }

  /**
   * Extract classes from code
   */
  private extractClasses(filePath: string, lines: string[]): CodeElement[] {
    const classes: CodeElement[] = [];
    const classPattern = /^\s*(?:export\s+)?class\s+(\w+)/gm;

    lines.forEach((line, index) => {
      const match = classPattern.exec(line);
      if (match) {
        classes.push({
          type: 'class',
          name: match[1],
          filePath,
          lineNumber: index + 1,
          scope: 'file',
          dependencies: this.extractDependencies(line),
          usedBy: []
        });
      }
    });

    return classes;
  }

  /**
   * Extract variables from code
   */
  private extractVariables(filePath: string, lines: string[]): CodeElement[] {
    const variables: CodeElement[] = [];
    const varPattern = /^\s*(?:const|let|var)\s+(\w+)/gm;

    lines.forEach((line, index) => {
      const match = varPattern.exec(line);
      if (match) {
        variables.push({
          type: 'variable',
          name: match[1],
          filePath,
          lineNumber: index + 1,
          scope: 'file',
          dependencies: this.extractDependencies(line),
          usedBy: []
        });
      }
    });

    return variables;
  }

  /**
   * Extract imports from code
   */
  private extractImports(filePath: string, lines: string[]): CodeElement[] {
    const imports: CodeElement[] = [];
    const importPattern = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/gm;

    lines.forEach((line, index) => {
      const match = importPattern.exec(line);
      if (match) {
        imports.push({
          type: 'import',
          name: match[1],
          filePath,
          lineNumber: index + 1,
          scope: 'file',
          dependencies: [match[1]],
          usedBy: []
        });
      }
    });

    return imports;
  }

  /**
   * Extract exports from code
   */
  private extractExports(filePath: string, lines: string[]): CodeElement[] {
    const exports: CodeElement[] = [];
    const exportPattern = /export\s+(?:function|class|const)\s+(\w+)/gm;

    lines.forEach((line, index) => {
      const match = exportPattern.exec(line);
      if (match) {
        exports.push({
          type: 'export',
          name: match[1],
          filePath,
          lineNumber: index + 1,
          scope: 'file',
          dependencies: [],
          usedBy: []
        });
      }
    });

    return exports;
  }

  /**
   * Extract dependencies from a line
   */
  private extractDependencies(line: string): string[] {
    const dependencies: string[] = [];
    const callPattern = /(\w+)\s*\(/g;
    let match;

    while ((match = callPattern.exec(line)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(structure: CodeStructure): DependencyGraph {
    const edges: Array<{ from: string; to: string; type: string }> = [];

    // Create edges based on dependencies
    const allElements = [
      ...structure.functions,
      ...structure.classes,
      ...structure.variables,
      ...structure.imports
    ];

    for (const element of allElements) {
      for (const dep of element.dependencies) {
        const target = allElements.find(e => e.name === dep);
        if (target) {
          edges.push({
            from: element.name,
            to: target.name,
            type: 'calls'
          });
          target.usedBy.push(element.name);
        }
      }
    }

    return {
      nodes: allElements,
      edges,
      cycles: this.detectCycles(edges),
      orphans: this.findOrphans(allElements, edges)
    };
  }

  /**
   * Detect circular dependencies
   */
  private detectCycles(edges: Array<{ from: string; to: string; type: string }>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const buildGraph = (edges: Array<{ from: string; to: string; type: string }>) => {
      const graph = new Map<string, string[]>();
      for (const edge of edges) {
        if (!graph.has(edge.from)) graph.set(edge.from, []);
        graph.get(edge.from)!.push(edge.to);
      }
      return graph;
    };

    const dfs = (node: string, graph: Map<string, string[]>, path: string[]) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, graph, [...path]);
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
        }
      }

      recursionStack.delete(node);
    };

    const graph = buildGraph(edges);
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, graph, []);
      }
    }

    return cycles;
  }

  /**
   * Find orphaned code elements
   */
  private findOrphans(elements: CodeElement[], edges: Array<{ from: string; to: string; type: string }>): string[] {
    const orphans: string[] = [];
    const hasIncomingEdge = new Set<string>();
    const hasOutgoingEdge = new Set<string>();

    for (const edge of edges) {
      hasOutgoingEdge.add(edge.from);
      hasIncomingEdge.add(edge.to);
    }

    for (const element of elements) {
      if (!hasIncomingEdge.has(element.name) && !hasOutgoingEdge.has(element.name)) {
        orphans.push(element.name);
      }
    }

    return orphans;
  }

  /**
   * Calculate code quality metrics
   */
  private calculateMetrics(structure: CodeStructure): {
    totalLines: number;
    complexityScore: number;
    modularity: number;
    maintainability: number;
  } {
    const totalLines = structure.metrics.totalLines;
    const functions = structure.functions.length;
    const classes = structure.classes.length;
    const cycleCount = structure.dependencyGraph.cycles.length;
    const orphanCount = structure.dependencyGraph.orphans.length;

    // Complexity: based on cycles and orphans
    const complexityScore = Math.min(10, cycleCount + orphanCount);

    // Modularity: ratio of classes/functions to files
    const modularity = (classes + functions) / structure.files.length;

    // Maintainability: based on complexity and line count
    const maintainability = Math.max(0, 10 - (complexityScore + Math.log10(totalLines + 1)));

    return {
      totalLines,
      complexityScore,
      modularity,
      maintainability
    };
  }

  /**
   * Get analysis summary
   */
  getSummary(): string {
    if (!this.codeStructure) {
      return 'No analysis available';
    }

    const s = this.codeStructure;
    return `
📊 CODE STRUCTURE ANALYSIS
──────────────────────────────────
Files: ${s.files.length}
Total Lines: ${s.metrics.totalLines}
Functions: ${s.functions.length}
Classes: ${s.classes.length}
Complexity Score: ${s.metrics.complexityScore.toFixed(1)}/10
Modularity: ${s.metrics.modularity.toFixed(2)}
Maintainability: ${s.metrics.maintainability.toFixed(2)}/10
Circular Dependencies: ${s.dependencyGraph.cycles.length}
Orphaned Elements: ${s.dependencyGraph.orphans.length}
    `.trim();
  }

  /**
   * Get current analysis
   */
  getAnalysis(): CodeStructure | null {
    return this.codeStructure;
  }
}
