# Execute Code Review

**Purpose**: Systematically conduct comprehensive code reviews using CLAUDE.md standards, CLAUDE_code_review.md framework, and industry best practices for quality, security, and maintainability assessment.

## Code Review Target: $ARGUMENTS

**Supported Formats**:

- GitHub PR URL: `https://github.com/owner/repo/pull/123`
- Local Branch: `feature/branch-name`
- Commit Range: `main..feature-branch`
- Review Document: `path/to/REVIEW_*.md`

---

## 🔍 **PHASE 1: CONTEXT ANALYSIS & PREPARATION**

### 1.1 Review Scope Analysis (CRITICAL - NEVER SKIP)

```
✅ MANDATORY CHECKLIST:
□ Identify review target (PR, branch, commits, or review document)
□ Extract GitHub PR information if URL provided (title, description, files changed)
□ Determine code changes scope (frontend, backend, database, CI/CD)
□ Understand business context and feature purpose
□ Identify risk level (critical, high, medium, low) based on changes
□ Note any breaking changes or architectural modifications
□ Document review timeline and priority level
```

### 1.2 CLAUDE.md Standards Research

```
✅ CLAUDE ALIGNMENT CHECKLIST:
□ Read CLAUDE.md for current project standards and priorities
□ Review CLAUDE_code_review.md for established review framework
□ Check CLAUDE_coding_standards.md for applicable style/pattern requirements
□ Review CLAUDE_architecture.md for system integration compliance
□ Check CLAUDE_security.md for security review requirements
□ Review CLAUDE_testing.md for test coverage and quality standards
□ Note any domain-specific guidelines from CLAUDE_business.md
```

### 1.3 Codebase Context Loading

```
✅ CONTEXT ANALYSIS CHECKLIST:
□ Review recent commits for related changes or conflicts
□ Check current branch status and working directory state
□ Identify existing patterns in similar code areas
□ Review package.json for new dependencies or version changes
□ Check for existing test coverage in affected areas
□ Document any technical debt or known issues in modified areas
□ Identify integration points and potential regression risks
```

### 1.4 Review Preparation Strategy

```
✅ PREPARATION CHECKLIST:
□ Use TodoWrite tool to create comprehensive review task breakdown
□ Determine review focus areas (security, performance, maintainability, etc.)
□ Plan validation approach (automated tests, manual testing, code analysis)
□ Identify specific CLAUDE.md compliance areas to validate
□ Prepare environment for testing changes if needed
□ Document expected review timeline and deliverables
□ Set success criteria for review completion
```

---

## 🧠 **PHASE 2: CODE ANALYSIS & QUALITY ASSESSMENT**

### 2.1 Structural Analysis (MANDATORY TodoWrite Usage)

```
SYSTEMATIC APPROACH:
1. Use TodoWrite tool to track analysis progress
2. Analyze file-by-file for large changes
3. Focus on high-risk/critical path changes first
4. Document patterns and anti-patterns discovered
5. Note any architectural or design violations
6. Track security, performance, and maintainability issues
```

### 2.2 CLAUDE.md Compliance Validation

```
✅ COMPLIANCE VERIFICATION CHECKLIST:
□ File size limits: No files over 500 lines (refactor if needed)
□ Test coverage: 99% for new code, maintain existing for changes
□ Error handling: Comprehensive error scenarios implemented
□ Tenant isolation: All database operations include tenant_id filtering (if applicable)
□ Security patterns: Input validation and sanitization implemented
□ Performance targets: Database queries optimized, UI responsive
□ Component patterns: Follow feature-based organization
□ Naming conventions: Follow established patterns consistently
```

### 2.3 Code Quality Deep Dive

```
✅ QUALITY ASSESSMENT AREAS:

📊 STRUCTURAL QUALITY:
□ Code organization and file structure
□ Component/service architecture alignment
□ Separation of concerns and single responsibility
□ DRY principle adherence and code reusability
□ Consistency with existing codebase patterns

🔒 SECURITY ANALYSIS:
□ Input validation and sanitization
□ Authentication and authorization checks
□ Sensitive data handling (no secrets in code)
□ SQL injection prevention
□ XSS protection mechanisms

⚡ PERFORMANCE EVALUATION:
□ Database query optimization
□ Frontend rendering performance
□ Memory usage and potential leaks
□ Network request efficiency
□ Bundle size impact (if frontend changes)

🧪 TESTING ADEQUACY:
□ Unit test coverage for new/modified code
□ Integration test coverage for API changes
□ Edge case and error condition testing
□ Mock usage appropriateness
□ Test maintainability and clarity
```

### 2.4 Business Logic Validation

```
✅ BUSINESS VALIDATION CHECKLIST:
□ Feature requirements completely implemented
□ Edge cases and error scenarios handled
□ Data validation and business rule enforcement
□ User experience and workflow logic
□ Integration with existing business processes
□ Backwards compatibility maintenance
```

---

## ⚡ **PHASE 3: AUTOMATED VALIDATION & TESTING**

### 3.1 Automated Code Analysis

```bash
# Code quality and style validation
npm run lint                          # ESLint validation
npm run typecheck                     # TypeScript checking (if applicable)
npm run audit                         # Security vulnerability scan

# Testing validation
npm test                              # Run all tests
npm test -- --coverage               # Generate coverage report
npm run test:ci                       # CI environment simulation
```

### 3.2 Security & Performance Scanning

```bash
# Security analysis
npm audit --audit-level high         # High-severity vulnerability check
grep -r "console\." src/              # Production console statement check
grep -r "debugger" src/               # Debug statement check
git diff --check                      # Whitespace and formatting check

# Performance analysis (if applicable)
npm run build                         # Production build test
npm run analyze                       # Bundle size analysis (if available)
```

### 3.3 Integration Testing

```
✅ INTEGRATION VALIDATION:
□ API endpoint testing (if backend changes)
□ Database migration testing (if schema changes)
□ Frontend component integration testing
□ Cross-browser compatibility (if UI changes)
□ Mobile responsiveness validation (if UI changes)
□ Error boundary and fallback testing
```

---

## 📋 **PHASE 4: COMPREHENSIVE REVIEW REPORT**

### 4.1 Executive Summary Generation

```
REPORT STRUCTURE:
1. Overall assessment (APPROVED/APPROVED WITH CONDITIONS/REJECTED)
2. Risk level assessment (CRITICAL/HIGH/MEDIUM/LOW)
3. Key findings summary (strengths and concerns)
4. Business impact assessment
5. Deployment readiness status
```

### 4.2 Detailed Technical Analysis

```
✅ TECHNICAL REPORT SECTIONS:

📊 CODE QUALITY ASSESSMENT:
- Structural quality rating (1-10)
- CLAUDE.md compliance score
- Maintainability assessment
- Code complexity analysis

🔒 SECURITY REVIEW:
- Security vulnerability assessment
- Attack vector analysis
- Data protection compliance
- Authentication/authorization validation

⚡ PERFORMANCE ANALYSIS:
- Performance impact assessment
- Database query optimization review
- Frontend performance considerations
- Resource usage analysis

🧪 TEST COVERAGE EVALUATION:
- Test coverage metrics
- Test quality assessment
- Missing test scenarios identification
- Test maintainability rating
```

### 4.3 Actionable Recommendations

```
✅ RECOMMENDATION FRAMEWORK:

🚨 CRITICAL ISSUES (Must Fix Before Merge):
- Security vulnerabilities
- Breaking changes without proper migration
- CLAUDE.md standard violations
- Test coverage below 99% for new code

⚠️ HIGH PRIORITY (Should Fix Before Merge):
- Performance concerns
- Maintainability issues
- Code quality violations
- Missing error handling

📝 MEDIUM PRIORITY (Consider for Follow-up):
- Code optimization opportunities
- Documentation improvements
- Refactoring suggestions
- Additional test scenarios

💡 LOW PRIORITY (Nice to Have):
- Code style preferences
- Architecture improvements
- Future enhancement suggestions
```

---

## 🚦 **PHASE 5: REVIEW DECISION & NEXT STEPS**

### 5.1 Review Decision Matrix

```
✅ APPROVAL CRITERIA:

APPROVED FOR MERGE:
□ No critical or high-security issues
□ CLAUDE.md compliance standards met
□ Test coverage requirements satisfied
□ No breaking changes without proper documentation
□ Performance impact acceptable
□ Business requirements fully implemented

APPROVED WITH CONDITIONS:
□ Minor issues that can be addressed post-merge
□ Documentation updates needed
□ Follow-up tasks identified and tracked
□ Risk is low and well-documented

REJECTED - REQUIRES CHANGES:
□ Critical security vulnerabilities found
□ CLAUDE.md standard violations present
□ Insufficient test coverage for new code
□ Breaking changes without proper migration plan
□ Performance issues that affect user experience
```

### 5.2 Follow-up Actions

```
✅ POST-REVIEW CHECKLIST:
□ Create detailed review report document
□ Update TodoWrite with any follow-up tasks identified
□ Document lessons learned for future reviews
□ Update CLAUDE_code_review.md if new patterns discovered
□ Notify team of review completion and decision
□ Schedule follow-up reviews if conditions applied
□ Track implementation of recommended improvements
```

---

## 🎯 **SPECIALIZED REVIEW PROTOCOLS**

### GitHub PR Review Protocol

```bash
# When $ARGUMENTS is a GitHub PR URL:
1. Extract PR information using gh CLI:
   gh pr view $PR_NUMBER --json title,body,files

2. Analyze changed files:
   gh pr diff $PR_NUMBER

3. Check PR status and CI results:
   gh pr checks $PR_NUMBER

4. Review PR comments and discussions:
   gh pr view $PR_NUMBER --comments
```

### Local Branch Review Protocol

```bash
# When $ARGUMENTS is a local branch:
1. Compare against main branch:
   git diff main...$BRANCH_NAME

2. Review commit history:
   git log main..$BRANCH_NAME --oneline

3. Check for conflicts:
   git merge-tree main $BRANCH_NAME

4. Analyze file changes:
   git diff --name-only main...$BRANCH_NAME
```

### Review Document Protocol

```
# When $ARGUMENTS is a review document path:
1. Read existing review document completely
2. Validate against CLAUDE_code_review.md framework
3. Cross-reference with actual code changes
4. Update review status and recommendations
5. Ensure all review sections are complete
```

---

## 🔄 **CONTINUOUS IMPROVEMENT**

### Review Quality Metrics

```
TRACK AND IMPROVE:
1. Review completion time vs complexity
2. Number of issues found per review type
3. Post-merge bug discovery rate
4. Team satisfaction with review process
5. CLAUDE.md compliance improvement over time
```

### Process Enhancement

```
✅ ENHANCEMENT OPPORTUNITIES:
□ Update review templates based on common findings
□ Refine automated validation scripts
□ Improve integration with development workflow
□ Enhance review documentation and reporting
□ Optimize review tools and processes
```

---

## 🚨 **CRITICAL REMINDERS**

### Non-Negotiable Standards

- **Always** validate CLAUDE.md compliance
- **Never** approve code with security vulnerabilities
- **Always** require 99% test coverage for new code
- **Never** skip Docker CI/CD validation for critical changes
- **Always** document breaking changes and migration plans

### Review Philosophy

- **Quality over Speed**: Thorough review prevents production issues
- **Security First**: Security vulnerabilities are always critical
- **Business Impact**: Consider user and business impact of changes
- **Learning Opportunity**: Use reviews to improve team knowledge
- **Constructive Feedback**: Focus on code improvement, not criticism

---

**Version**: 2025-08-24 | **Based on**: CLAUDE.md, CLAUDE_code_review.md | **Usage**: `/execute-code-review [PR_URL|BRANCH_NAME|REVIEW_DOC.md]`
