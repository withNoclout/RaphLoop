/**
 * Session Trace Protocol
 * Sequential verification of session issues: Backend → Network → Frontend
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Session trace step definition
 */
export enum SessionTraceStep {
  A = 'A',
  B = 'B',
  C = 'C'
}

/**
 * Backend verification result
 */
export interface BackendVerificationResult {
  step: SessionTraceStep.A;
  stepName: string;
  verified: boolean;
  findings: string[];
  recommendations: string[];
  issues: {
    noAPIEndpoint?: boolean;
    missingUserObject?: boolean;
    incorrectDataStructure?: boolean;
    serverError?: boolean;
    errorDetails?: string;
  };
}

/**
 * Network verification result
 */
export interface NetworkVerificationResult {
  step: SessionTraceStep.B;
  stepName: string;
  verified: boolean;
  findings: string[];
  recommendations: string[];
  issues: {
    noCookies?: boolean;
    noAuthHeader?: boolean;
    corsBlocked?: boolean;
    missingCredentials?: boolean;
    errorDetails?: string;
  };
}

/**
 * Frontend verification result
 */
export interface FrontendVerificationResult {
  step: SessionTraceStep.C;
  stepName: string;
  verified: boolean;
  findings: string[];
  recommendations: string[];
  issues: {
    noStateManagement?: boolean;
    stateNotUpdating?: boolean;
    notPersistingOnRefresh?: boolean;
    errorDetails?: string;
  };
}

/**
 * Complete session trace result
 */
export interface SessionTraceResult {
  timestamp: string;
  success: boolean;
  steps: (BackendVerificationResult | NetworkVerificationResult | FrontendVerificationResult)[];
  overallFindings: string[];
  nextSteps: string[];
}

/**
 * Session Trace Protocol Implementation
 */
export class SessionTraceProtocol {
  private projectRoot: string;
  private testResults: SessionTraceResult = {
    timestamp: new Date().toISOString(),
    success: false,
    steps: [],
    overallFindings: [],
    nextSteps: []
  };

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Execute full session trace (A → B → C)
   */
  async executeTrace(): Promise<SessionTraceResult> {
    console.log('\n🔍 Starting Session Trace Protocol...\n');

    // Step A: Backend Verification
    console.log('📋 Step A: Backend Verification');
    const stepA = await this.verifyBackend();
    this.testResults.steps.push(stepA);
    console.log(`  Status: ${stepA.verified ? '✅ PASS' : '❌ FAIL'}`);

    if (stepA.findings.length > 0) {
      console.log(`  Findings: ${stepA.findings.join(', ')}`);
    }

    // Step B: Network Verification
    console.log('\n📋 Step B: Network Verification');
    const stepB = await this.verifyNetwork();
    this.testResults.steps.push(stepB);
    console.log(`  Status: ${stepB.verified ? '✅ PASS' : '❌ FAIL'}`);

    if (stepB.findings.length > 0) {
      console.log(`  Findings: ${stepB.findings.join(', ')}`);
    }

    // Step C: Frontend Verification
    console.log('\n📋 Step C: Frontend Verification');
    const stepC = await this.verifyFrontend();
    this.testResults.steps.push(stepC);
    console.log(`  Status: ${stepC.verified ? '✅ PASS' : '❌ FAIL'}`);

    if (stepC.findings.length > 0) {
      console.log(`  Findings: ${stepC.findings.join(', ')}`);
    }

    // Determine overall success
    this.testResults.success = stepA.verified && stepB.verified && stepC.verified;

    // Generate recommendations
    this.testResults.nextSteps = this.generateRecommendations();

    console.log(`\n🎯 Overall Result: ${this.testResults.success ? '✅ SESSION VERIFIED' : '❌ SESSION ISSUES DETECTED'}\n`);

    return this.testResults;
  }

  /**
   * Step A: Verify Backend API
   * Check if the API returns user object correctly
   */
  private async verifyBackend(): Promise<BackendVerificationResult> {
    const result: BackendVerificationResult = {
      step: SessionTraceStep.A,
      stepName: 'Backend Verification: Is the API returning the user object?',
      verified: false,
      findings: [],
      recommendations: [],
      issues: {}
    };

    try {
      // Check for auth API endpoints
      const apiFiles = this.findFiles(/\.(ts|js)$/i, ['api', 'backend', 'routes', 'controllers'])
        .filter(f => f.includes('auth') || f.includes('session') || f.includes('user'));

      if (apiFiles.length === 0) {
        result.issues.noAPIEndpoint = true;
        result.findings.push('No authentication API endpoints found');
        result.recommendations.push('Create API endpoint at /api/auth/me or /auth/session that returns user object');
        return result;
      }

      // Parse one API file to check structure
      const apiFile = apiFiles[0];
      const content = fs.readFileSync(apiFile, 'utf-8');

      // Check if returns user object
      const hasUserReturn = /user[:\s]|userData|currentUser|profile/.test(content);
      if (!hasUserReturn) {
        result.issues.missingUserObject = true;
        result.findings.push('API endpoint does not return user object');
        result.recommendations.push('Modify API to return { user: {...}, ...other fields }');
        return result;
      }

      // Check for proper response structure
      const hasProperStructure = /return\s*{|res\.json|res\.send/.test(content);
      if (!hasProperStructure) {
        result.issues.incorrectDataStructure = true;
        result.findings.push('API response structure unclear');
        result.recommendations.push('Ensure API returns JSON with user object');
        return result;
      }

      result.verified = true;
      result.findings.push('API endpoint found with user object');
      result.findings.push('Response structure is valid');
    } catch (error) {
      result.issues.serverError = true;
      result.issues.errorDetails = String(error);
      result.findings.push(`Error checking backend: ${error}`);
    }

    return result;
  }

  /**
   * Step B: Verify Network Headers
   * Check if cookies/auth headers are being sent
   */
  private async verifyNetwork(): Promise<NetworkVerificationResult> {
    const result: NetworkVerificationResult = {
      step: SessionTraceStep.B,
      stepName: 'Network Verification: Are cookies/headers being sent?',
      verified: false,
      findings: [],
      recommendations: [],
      issues: {}
    };

    try {
      // Find client-side fetch/axios files
      const clientFiles = this.findFiles(/\.(ts|tsx|js|jsx)$/i, ['src', 'client', 'components', 'pages'])
        .filter(f => !f.includes('node_modules'));

      let fetchConfigured = false;
      let cookiesConfigured = false;
      let authHeaderSet = false;

      for (const file of clientFiles.slice(0, 5)) {
        // Check first 5 files to avoid overwhelming
        try {
          const content = fs.readFileSync(file, 'utf-8');

          // Check for credentials in fetch
          if (/credentials\s*:\s*['"](include|same-origin)['"]/.test(content)) {
            fetchConfigured = true;
            cookiesConfigured = true;
          }

          // Check for Authorization header
          if (/Authorization|Bearer|jwt|token/.test(content)) {
            authHeaderSet = true;
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }

      if (!fetchConfigured && !cookiesConfigured && !authHeaderSet) {
        result.issues.missingCredentials = true;
        result.findings.push('No credentials configuration found in fetch/axios calls');
        result.recommendations.push('Add credentials: "include" to fetch options');
        result.recommendations.push('Or set Authorization header with Bearer token');
        return result;
      }

      if (!cookiesConfigured) {
        result.issues.noCookies = true;
        result.findings.push('Cookies not configured in requests');
        result.recommendations.push('Add { credentials: "include" } to fetch options');
      }

      if (!authHeaderSet && cookiesConfigured) {
        result.findings.push('Using cookie-based auth');
      } else if (authHeaderSet) {
        result.findings.push('Using token-based auth (Bearer token)');
      }

      result.verified = true;
    } catch (error) {
      result.issues.errorDetails = String(error);
      result.findings.push(`Error checking network config: ${error}`);
    }

    return result;
  }

  /**
   * Step C: Verify Frontend State Management
   * Check if Global Store is receiving session updates
   */
  private async verifyFrontend(): Promise<FrontendVerificationResult> {
    const result: FrontendVerificationResult = {
      step: SessionTraceStep.C,
      stepName: 'Frontend Verification: Is Global Store receiving updates?',
      verified: false,
      findings: [],
      recommendations: [],
      issues: {}
    };

    try {
      // Find state management files
      const stateFiles = this.findFiles(/\.(ts|tsx|js|jsx)$/i, ['src', 'app', 'context', 'store', 'redux']);

      let hasContextAPI = false;
      let hasRedux = false;
      let hasZustand = false;
      let hasStateManagement = false;

      for (const file of stateFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');

          if (/createContext|useContext|ContextProvider/.test(content)) {
            hasContextAPI = true;
            hasStateManagement = true;
          }

          if (/redux|useSelector|useDispatch|combineReducers/.test(content)) {
            hasRedux = true;
            hasStateManagement = true;
          }

          if (/zustand|create\(|useStore/.test(content)) {
            hasZustand = true;
            hasStateManagement = true;
          }

          // Check if updating with session data
          if (/setUser|setSession|updateUser|updateSession|dispatch.*SET/.test(content)) {
            result.findings.push('State update logic found');
          }
        } catch (e) {
          // Skip unreadable files
        }
      }

      if (!hasStateManagement) {
        result.issues.noStateManagement = true;
        result.findings.push('No state management detected');
        result.recommendations.push('Set up Context API, Redux, or Zustand for session state');
        result.recommendations.push('Create auth context/store to hold user session');
        return result;
      }

      if (hasContextAPI) {
        result.findings.push('Using React Context API for state');
      } else if (hasRedux) {
        result.findings.push('Using Redux for state management');
      } else if (hasZustand) {
        result.findings.push('Using Zustand for state management');
      }

      // Check if state persists on refresh
      const persistFiles = stateFiles.filter(f => f.includes('context') || f.includes('store'));
      let hasPersistence = false;
      for (const file of persistFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          if (/localStorage|sessionStorage|persist/.test(content)) {
            hasPersistence = true;
            result.findings.push('State persistence configured');
          }
        } catch (e) {
          // Skip
        }
      }

      if (!hasPersistence) {
        result.issues.notPersistingOnRefresh = true;
        result.findings.push('State may not persist on page refresh');
        result.recommendations.push('Add localStorage persistence to auth state');
        result.recommendations.push('Or fetch user session from backend on app load');
      }

      result.verified = true;
    } catch (error) {
      result.issues.errorDetails = String(error);
      result.findings.push(`Error checking frontend state: ${error}`);
    }

    return result;
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const stepA = this.testResults.steps.find(s => (s as any).step === SessionTraceStep.A);
    const stepB = this.testResults.steps.find(s => (s as any).step === SessionTraceStep.B);
    const stepC = this.testResults.steps.find(s => (s as any).step === SessionTraceStep.C);

    if (stepA && !stepA.verified) {
      recommendations.push('🔴 FIX BACKEND: Ensure API returns complete user object');
    }

    if (stepB && !stepB.verified) {
      recommendations.push('🔴 FIX NETWORK: Configure credentials in fetch/axios calls');
    }

    if (stepC && !stepC.verified) {
      recommendations.push('🔴 FIX FRONTEND: Ensure state management receives and stores session');
    }

    if (this.testResults.success) {
      recommendations.push('✅ SESSION VERIFIED: All three steps passed');
      recommendations.push('💡 Consider adding periodic session refresh to sync with backend');
    }

    return recommendations;
  }

  /**
   * Find files matching pattern in directories
   */
  private findFiles(pattern: RegExp, directories: string[]): string[] {
    const results: string[] = [];

    for (const dir of directories) {
      const fullPath = path.join(this.projectRoot, dir);
      try {
        if (!fs.existsSync(fullPath)) continue;

        const files = fs.readdirSync(fullPath, { recursive: true });
        files.forEach(file => {
          const filePath = typeof file === 'string' ? file : (file as any).toString();
          if (pattern.test(filePath)) {
            results.push(path.join(fullPath, filePath));
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    }

    return results;
  }

  /**
   * Generate test code for session verification
   */
  generateTestCode(): string {
    return `
/**
 * Session Trace Test Suite
 * Generated by Session Trace Protocol
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Session Trace Protocol - Session Management', () => {
  let mockUser: any;
  let mockFetch: any;

  beforeEach(() => {
    // Setup mock data
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };

    // Mock localStorage
    const localStorageMock = {
      getItem: (key: string) => JSON.stringify(mockUser),
      setItem: (key: string, value: string) => {},
      removeItem: (key: string) => {},
      clear: () => {}
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  describe('Step A: Backend Verification', () => {
    it('should return user object from API', async () => {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(mockUser.id);
    });

    it('should include all required user fields', async () => {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBeDefined();
      expect(data.user.name).toBeDefined();
    });
  });

  describe('Step B: Network Verification', () => {
    it('should send credentials with fetch requests', async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      expect(response.ok).toBe(true);
    });

    it('should receive auth cookies in response', async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
    });

    it('should send Authorization header with token', async () => {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      
      expect(response.ok).toBe(true);
    });
  });

  describe('Step C: Frontend Verification', () => {
    it('should update global state with user data', async () => {
      // Assuming you have a global state or context
      // This is a template - adjust based on your state management
      
      const { user } = useAuth(); // Or your auth hook/context
      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
    });

    it('should persist user in localStorage on login', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      
      expect(stored.id).toBe(mockUser.id);
    });

    it('should restore user from localStorage on page load', () => {
      const stored = localStorage.getItem('user');
      expect(stored).toBeDefined();
      
      const user = JSON.parse(stored || '{}');
      expect(user.id).toBe(mockUser.id);
    });

    it('should update UI with user data after session restored', () => {
      const userElement = document.querySelector('[data-testid="user-name"]');
      expect(userElement?.textContent).toBe(mockUser.name);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session expiration', async () => {
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      
      // Should redirect to login or show login UI
      expect(window.location.pathname).toBe('/login');
    });

    it('should refresh session if token expires', async () => {
      // Mock expired token
      const response = await fetch('/api/auth/refresh');
      expect(response.ok).toBe(true);
    });

    it('should sync session across tabs', () => {
      // Simulate storage event from another tab
      const event = new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(mockUser)
      });
      window.dispatchEvent(event);
      
      // Check that state updated
      // Implementation depends on your state management
    });
  });
});
`;
  }
}

/**
 * Export test generation helper
 */
export function generateSessionTraceTests(projectRoot: string = process.cwd()): void {
  const protocol = new SessionTraceProtocol(projectRoot);
  const testCode = protocol.generateTestCode();

  const testFilePath = path.join(projectRoot, 'src', '__tests__', 'session-trace.test.ts');
  const dir = path.dirname(testFilePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(testFilePath, testCode, 'utf-8');
  console.log(`✅ Test file generated: ${testFilePath}`);
}
