/**
 * Web Development Specialist Agent
 * Handles Full-Stack Web Development Issues (Session/Auth/UI/State Management)
 */

import { SpecialistAgent, AgentCapability, AgentExecutionContext, AgentExecutionResult } from './specialist_agent';
import { FixSuggestion, ErrorCategory, CodeChange, FixType } from './types';

/**
 * Web framework types
 */
export enum WebFramework {
  NEXTAUTH = 'nextauth',
  EXPRESS = 'express',
  NESTJS = 'nestjs',
  FASTAPI = 'fastapi',
  DJANGO = 'django',
  SPRING = 'spring',
  LARAVEL = 'laravel',
  UNKNOWN = 'unknown'
}

/**
 * Session storage types
 */
export enum SessionStorage {
  COOKIES = 'cookies',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  REDIS = 'redis',
  DATABASE = 'database',
  JWT = 'jwt',
  UNKNOWN = 'unknown'
}

/**
 * Web development problem type
 */
export enum WebProblemType {
  SESSION_NOT_UPDATING = 'session_not_updating',
  LOGIN_FAILURE = 'login_failure',
  AUTH_REDIRECT = 'auth_redirect',
  STATE_MISMATCH = 'state_mismatch',
  COMPONENT_BLANK = 'component_blank',
  HYDRATION_MISMATCH = 'hydration_mismatch',
  CSRF_ERROR = 'csrf_error',
  CORS_ERROR = 'cors_error',
  MIDDLEWARE_CHAIN = 'middleware_chain',
  UI_NOT_RENDERING = 'ui_not_rendering'
}

/**
 * Session trace step
 */
export interface SessionTraceStep {
  step: 'A' | 'B' | 'C';
  name: string;
  description: string;
  verified: boolean;
  findings: string[];
}

/**
 * Web Development Specialist Agent
 */
export class WebDevelopmentSpecialistAgent extends SpecialistAgent {
  private sessionTraceSteps: SessionTraceStep[] = [
    {
      step: 'A',
      name: 'Backend Verification',
      description: 'Is the API returning the user object with correct data?',
      verified: false,
      findings: []
    },
    {
      step: 'B',
      name: 'Network Verification',
      description: 'Are cookies/auth headers being sent in requests and responses?',
      verified: false,
      findings: []
    },
    {
      step: 'C',
      name: 'Frontend Verification',
      description: 'Is the Global Store (Context/Redux/Zustand) receiving the update?',
      verified: false,
      findings: []
    }
  ];

  constructor(maxIterations?: number) {
    const capability: AgentCapability = {
      specialty: 'web_development' as any,
      supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'c#', '*'],
      supportedErrorCategories: [
        ErrorCategory.LOGIC,
        ErrorCategory.RUNTIME,
        ErrorCategory.TEST,
        ErrorCategory.DEPENDENCY
      ],
      confidence: 0.85,
      description: 'Specializes in full-stack web development issues: sessions, auth, UI state, middleware chains',
      maxIterations: 12
    };
    super(capability, maxIterations);
  }

  /**
   * Analyze web development context
   */
  async analyzeContext(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    
    // Detect web framework
    const framework = this.detectFramework(context.codebaseContext);
    
    // Detect problem type
    const problemType = this.detectProblemType(context.request, context.errorOutput);
    
    // Detect session storage method
    const storage = this.detectSessionStorage(context.codebaseContext);

    // Route to specific analyzer
    if (this.isSessionRelated(problemType)) {
      return this.analyzeSessionIssue(context, framework, storage);
    } else if (this.isUIRelated(problemType)) {
      return this.analyzeUIIssue(context, framework);
    } else if (this.isMiddlewareRelated(problemType)) {
      return this.analyzeMiddlewareChain(context, framework);
    }

    return suggestions;
  }

  /**
   * Generate fix suggestions for web development issues
   */
  async generateFixSuggestions(context: AgentExecutionContext): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    const framework = this.detectFramework(context.codebaseContext);
    const problemType = this.detectProblemType(context.request, context.errorOutput);

    if (this.isSessionRelated(problemType)) {
      suggestions.push(
        ...this.suggestSessionFixes(context, framework),
        ...this.suggestSessionTraceTests(context, framework)
      );
    } else if (this.isUIRelated(problemType)) {
      suggestions.push(
        ...this.suggestUIFixes(context, framework)
      );
    }

    return suggestions;
  }

  /**
   * Detect web framework from codebase
   */
  private detectFramework(codebaseContext: string): WebFramework {
    if (codebaseContext.includes('NextAuth') || codebaseContext.includes('next-auth')) {
      return WebFramework.NEXTAUTH;
    }
    if (codebaseContext.includes('express') || codebaseContext.includes('Express')) {
      return WebFramework.EXPRESS;
    }
    if (codebaseContext.includes('@nestjs') || codebaseContext.includes('NestJS')) {
      return WebFramework.NESTJS;
    }
    if (codebaseContext.includes('FastAPI')) {
      return WebFramework.FASTAPI;
    }
    if (codebaseContext.includes('Django')) {
      return WebFramework.DJANGO;
    }
    if (codebaseContext.includes('Spring') || codebaseContext.includes('@SpringBoot')) {
      return WebFramework.SPRING;
    }
    if (codebaseContext.includes('Laravel')) {
      return WebFramework.LARAVEL;
    }
    return WebFramework.UNKNOWN;
  }

  /**
   * Detect problem type from request and errors
   */
  private detectProblemType(request: string, errorOutput?: string): WebProblemType {
    const combined = (request + (errorOutput || '')).toLowerCase();

    if (combined.includes('session') && combined.includes('not update')) {
      return WebProblemType.SESSION_NOT_UPDATING;
    }
    if (combined.includes('login') && (combined.includes('fail') || combined.includes('error'))) {
      return WebProblemType.LOGIN_FAILURE;
    }
    if (combined.includes('auth') && combined.includes('redirect')) {
      return WebProblemType.AUTH_REDIRECT;
    }
    if (combined.includes('state') && combined.includes('mismatch')) {
      return WebProblemType.STATE_MISMATCH;
    }
    if (combined.includes('blank') || combined.includes('empty component')) {
      return WebProblemType.COMPONENT_BLANK;
    }
    if (combined.includes('hydration')) {
      return WebProblemType.HYDRATION_MISMATCH;
    }
    if (combined.includes('csrf')) {
      return WebProblemType.CSRF_ERROR;
    }
    if (combined.includes('cors')) {
      return WebProblemType.CORS_ERROR;
    }
    if (combined.includes('middleware')) {
      return WebProblemType.MIDDLEWARE_CHAIN;
    }
    if (combined.includes('render') || combined.includes('ui')) {
      return WebProblemType.UI_NOT_RENDERING;
    }

    return WebProblemType.STATE_MISMATCH;
  }

  /**
   * Detect session storage mechanism
   */
  private detectSessionStorage(codebaseContext: string): SessionStorage {
    if (codebaseContext.includes('document.cookie') || codebaseContext.includes('Cookies')) {
      return SessionStorage.COOKIES;
    }
    if (codebaseContext.includes('localStorage')) {
      return SessionStorage.LOCAL_STORAGE;
    }
    if (codebaseContext.includes('sessionStorage')) {
      return SessionStorage.SESSION_STORAGE;
    }
    if (codebaseContext.includes('redis') || codebaseContext.includes('Redis')) {
      return SessionStorage.REDIS;
    }
    if (codebaseContext.includes('jwt') || codebaseContext.includes('JWT')) {
      return SessionStorage.JWT;
    }
    if (codebaseContext.includes('database') || codebaseContext.includes('db')) {
      return SessionStorage.DATABASE;
    }
    return SessionStorage.UNKNOWN;
  }

  /**
   * Check if problem is session-related
   */
  private isSessionRelated(problemType: WebProblemType): boolean {
    return [
      WebProblemType.SESSION_NOT_UPDATING,
      WebProblemType.STATE_MISMATCH
    ].includes(problemType);
  }

  /**
   * Check if problem is UI-related
   */
  private isUIRelated(problemType: WebProblemType): boolean {
    return [
      WebProblemType.COMPONENT_BLANK,
      WebProblemType.HYDRATION_MISMATCH,
      WebProblemType.UI_NOT_RENDERING
    ].includes(problemType);
  }

  /**
   * Check if problem is auth-related
   */
  private isAuthRelated(problemType: WebProblemType): boolean {
    return [
      WebProblemType.LOGIN_FAILURE,
      WebProblemType.AUTH_REDIRECT,
      WebProblemType.CSRF_ERROR,
      WebProblemType.CORS_ERROR
    ].includes(problemType);
  }

  /**
   * Check if problem is middleware-related
   */
  private isMiddlewareRelated(problemType: WebProblemType): boolean {
    return [
      WebProblemType.MIDDLEWARE_CHAIN
    ].includes(problemType);
  }

  /**
   * Analyze session issues using Session Trace Protocol
   */
  private async analyzeSessionIssue(
    context: AgentExecutionContext,
    framework: WebFramework,
    storage: SessionStorage
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    // Step A: Verify Backend
    const backendCheck = this.verifyBackendAPI(context, framework);
    if (!backendCheck.valid) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: `Backend API issue detected: ${backendCheck.issue}`,
        files: backendCheck.affectedFiles,
        codeChanges: [],
        confidence: 0.9
      });
    }

    // Step B: Verify Network
    const networkCheck = this.verifyNetworkHeaders(context, storage);
    if (!networkCheck.valid) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: `Network issue detected: ${networkCheck.issue}`,
        files: networkCheck.affectedFiles,
        codeChanges: [],
        confidence: 0.85
      });
    }

    // Step C: Verify Frontend Store
    const storeCheck = this.verifyFrontendStore(context, framework);
    if (!storeCheck.valid) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: `Frontend store issue detected: ${storeCheck.issue}`,
        files: storeCheck.affectedFiles,
        codeChanges: [],
        confidence: 0.8
      });
    }

    return suggestions;
  }

  /**
   * Analyze UI issues
   */
  private async analyzeUIIssue(
    context: AgentExecutionContext,
    framework: WebFramework
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    // Detect hook issues
    if (context.codebaseContext.includes('useEffect') || context.codebaseContext.includes('useState')) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: 'Detected React hooks - checking dependency arrays and state initialization',
        files: [],
        codeChanges: [],
        confidence: 0.8
      });
    }

    return suggestions;
  }

  /**
   * Analyze auth issues
   */
  private async analyzeAuthIssue(
    context: AgentExecutionContext,
    framework: WebFramework
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    if (framework === WebFramework.NEXTAUTH) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: 'NextAuth detected - checking callback configuration and provider setup',
        files: [],
        codeChanges: [],
        confidence: 0.85
      });
    }

    return suggestions;
  }

  /**
   * Analyze middleware chain issues
   */
  private async analyzeMiddlewareChain(
    context: AgentExecutionContext,
    framework: WebFramework
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    if (framework === WebFramework.EXPRESS || framework === WebFramework.NEXTAUTH) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: 'Middleware chain detected - verifying order of execution',
        files: [],
        codeChanges: [],
        confidence: 0.8
      });
    }

    return suggestions;
  }

  /**
   * Verify backend API returns user object
   */
  private verifyBackendAPI(context: AgentExecutionContext, framework: WebFramework): {
    valid: boolean;
    issue: string;
    affectedFiles: string[];
  } {
    const codebase = context.codebaseContext;
    
    // Check for API endpoint that returns user
    if (!codebase.includes('/api/auth') && !codebase.includes('/auth/me') && !codebase.includes('getSession')) {
      return {
        valid: false,
        issue: 'No user data endpoint found. API should return user object on authentication.',
        affectedFiles: []
      };
    }

    // Check if response includes user object
    if (!codebase.includes('user:') && !codebase.includes('user }') && !codebase.includes('userData')) {
      return {
        valid: false,
        issue: 'API response missing user object. Should return { user: {...} } structure.',
        affectedFiles: []
      };
    }

    return {
      valid: true,
      issue: '',
      affectedFiles: []
    };
  }

  /**
   * Verify network headers (cookies/auth)
   */
  private verifyNetworkHeaders(context: AgentExecutionContext, storage: SessionStorage): {
    valid: boolean;
    issue: string;
    affectedFiles: string[];
  } {
    const codebase = context.codebaseContext;

    if (storage === SessionStorage.COOKIES) {
      if (!codebase.includes('credentials') && !codebase.includes('httpOnly')) {
        return {
          valid: false,
          issue: 'Cookies not configured properly. Set credentials: include in fetch/axios.',
          affectedFiles: []
        };
      }
    }

    if (storage === SessionStorage.JWT) {
      if (!codebase.includes('Authorization') && !codebase.includes('Bearer')) {
        return {
          valid: false,
          issue: 'JWT tokens not being sent in Authorization header.',
          affectedFiles: []
        };
      }
    }

    return {
      valid: true,
      issue: '',
      affectedFiles: []
    };
  }

  /**
   * Verify frontend store receives updates
   */
  private verifyFrontendStore(context: AgentExecutionContext, framework: WebFramework): {
    valid: boolean;
    issue: string;
    affectedFiles: string[];
  } {
    const codebase = context.codebaseContext;

    // Check for state management
    const hasContext = codebase.includes('useContext') || codebase.includes('Context');
    const hasRedux = codebase.includes('redux') || codebase.includes('useSelector');
    const hasZustand = codebase.includes('zustand') || codebase.includes('useStore');

    if (!hasContext && !hasRedux && !hasZustand) {
      return {
        valid: false,
        issue: 'No state management detected. Need Context API, Redux, or Zustand to store session.',
        affectedFiles: []
      };
    }

    return {
      valid: true,
      issue: '',
      affectedFiles: []
    };
  }

  /**
   * Suggest session fixes
   */
  private suggestSessionFixes(context: AgentExecutionContext, framework: WebFramework): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    suggestions.push({
      fixType: FixType.ADD_FUNCTION,
      description: 'Add session refresh hook to sync state with backend periodically',
      files: [],
      codeChanges: [],
      confidence: 0.8
    });

    suggestions.push({
      fixType: FixType.MODIFY_LOGIC,
      description: 'Verify session storage is persisted on browser refresh',
      files: [],
      codeChanges: [],
      confidence: 0.75
    });

    return suggestions;
  }

  /**
   * Suggest session trace tests
   */
  private suggestSessionTraceTests(context: AgentExecutionContext, framework: WebFramework): FixSuggestion[] {
    return [
      {
        fixType: FixType.ADD_FUNCTION,
        description: 'Step A Test: Verify backend returns user object with all required fields',
        files: [],
        codeChanges: [],
        confidence: 0.85
      },
      {
        fixType: FixType.ADD_FUNCTION,
        description: 'Step B Test: Verify cookies/auth headers are sent in network requests',
        files: [],
        codeChanges: [],
        confidence: 0.8
      },
      {
        fixType: FixType.ADD_FUNCTION,
        description: 'Step C Test: Verify frontend store receives and persists user session',
        files: [],
        codeChanges: [],
        confidence: 0.8
      }
    ];
  }

  /**
   * Suggest UI fixes
   */
  private suggestUIFixes(context: AgentExecutionContext, framework: WebFramework): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    // Check for common UI issues
    if (context.errorOutput?.includes('hydration')) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: 'Hydration mismatch: Wrap component in useEffect to prevent SSR/client mismatch',
        files: [],
        codeChanges: [],
        confidence: 0.9
      });
    }

    if (context.errorOutput?.includes('blank') || context.codebaseContext.includes('isLoading')) {
      suggestions.push({
        fixType: FixType.MODIFY_LOGIC,
        description: 'Component rendering blank: Add loading state and conditional rendering',
        files: [],
        codeChanges: [],
        confidence: 0.85
      });
    }

    return suggestions;
  }

  /**
   * Apply fixes to the codebase (placeholder for actual implementation)
   */
  async applyFix(fix: FixSuggestion): Promise<boolean> {
    // This would be implemented to actually apply the fix
    // For now, return success to allow iteration
    return true;
  }
}
