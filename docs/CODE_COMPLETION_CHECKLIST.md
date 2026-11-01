# AAROGYAI Code Completion Checklist

## Architecture
- [x] React + TypeScript + Vite
- [x] Node.js + Express + TypeScript
- [x] Prisma + PostgreSQL
- [x] Separate FastAPI AI service

## Core system
- [x] Patient, Clinician and Admin roles
- [x] JWT authentication and RBAC
- [x] Patient isolation
- [x] Clinical readings and trend views
- [x] Medical history
- [x] Appointments
- [x] Multi-step COM-B assessment
- [x] COM-B history and rule-based support
- [x] AI prediction API
- [x] SHAP explanations
- [x] Clinical Decision Support summary
- [x] Care plans and goals
- [x] Clinical notes
- [x] Notifications
- [x] Admin user controls
- [x] Audit logging

## Final AI evaluation code
- [x] Research-dataset preprocessing pipeline
- [x] Multi-model comparison
- [x] Model metadata/version output
- [x] Accuracy, Precision, Recall, F1 and ROC-AUC
- [x] Confusion matrix generation
- [x] ROC curve generation
- [x] SHAP summary evidence generation
- [x] Synthetic data clearly separated from research evaluation
- [ ] Insert and document the final approved research dataset
- [ ] Run final research evaluation and keep generated evidence

## Testing code
- [x] Backend route-security tests
- [x] COM-B scoring tests
- [x] AI readiness tests
- [x] AI schema validation tests
- [x] AI preprocessing tests
- [x] Frontend component/accessibility-oriented tests
- [ ] Run the complete test suites locally after dependency installation
- [ ] Add regression tests for any bugs found during end-to-end testing

## Final polish
- [x] Reusable loading state
- [x] Reusable error state
- [x] Reusable empty state
- [x] AI readiness feedback
- [x] Text risk labels for accessibility
- [x] Keyboard focus styling
- [x] Clear AI/COM-B decision-support separation
- [ ] Complete manual WCAG review
- [ ] Complete mobile/tablet/manual browser review
- [ ] Fix any issues found during end-to-end testing
