# AAROGYAI requirements checklist

## Core architecture
- [x] React + TypeScript + Vite frontend
- [x] Node.js + Express + TypeScript application API
- [x] PostgreSQL + Prisma ORM
- [x] Separate Python + FastAPI AI/XAI service

## Users and security
- [x] Patient, clinician and admin roles
- [x] JWT authentication and bcrypt password hashing
- [x] Backend role-based access control
- [x] Patient record isolation
- [x] Helmet, CORS, rate limiting and Zod validation
- [x] Audit-log model and admin audit screen

## Patient management and monitoring
- [x] Patient profile
- [x] Clinical readings
- [x] Glucose, blood-pressure, HbA1c, BMI/weight charts
- [x] Medical history
- [x] Appointment request/history
- [x] Care-plan view and goal progress
- [x] Progress timeline
- [x] Notifications

## Behaviour support
- [x] Multi-step COM-B questionnaire
- [x] Capability, Opportunity and Motivation scores
- [x] Individual response persistence
- [x] COM-B history chart
- [x] Transparent rule-based support suggestions
- [x] COM-B kept separate from ML prediction

## AI and XAI
- [x] Separate prediction service
- [x] Model persistence
- [x] SHAP feature contributions
- [x] Prediction history and model version
- [x] No silent default values for required AI inputs
- [x] Prediction-readiness check
- [ ] Replace synthetic development data with a permitted research dataset for final dissertation evaluation
- [ ] Re-run final model comparison and capture evaluation artefacts from that research dataset

## Clinician workflow
- [x] Patient list and patient detail
- [x] Combined clinical / AI / COM-B decision-support summary
- [x] Medical-history entry
- [x] Clinical notes
- [x] Appointment status workflow
- [x] Care-plan creation and lifecycle status
- [x] Care-plan goal creation

## Admin
- [x] Statistics
- [x] User list
- [x] Activate/suspend accounts
- [x] Clinician creation API/UI
- [x] Audit log

## Testing and final evaluation
- [x] Basic backend route-security tests
- [x] COM-B unit tests
- [x] AI health and validation tests
- [x] Frontend component test setup
- [ ] Run all tests locally after dependency installation
- [ ] Conduct formal accessibility review
- [ ] Conduct end-to-end user testing
- [ ] Record final dissertation screenshots and results

Items intentionally left unchecked require external research evidence or execution in the student's local environment; they cannot be honestly pre-completed inside a source-code archive.
