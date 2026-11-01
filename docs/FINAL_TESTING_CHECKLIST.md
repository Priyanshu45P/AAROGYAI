# Final local testing checklist

1. `docker compose up -d postgres`
2. Backend: install dependencies, run Prisma migration, seed, then `npm test` and `npm run build`.
3. AI service: install requirements, train the development model, run `pytest`, then start FastAPI.
4. Frontend: install dependencies, run `npm test` and `npm run build`.
5. Test patient registration and login.
6. Confirm a patient cannot open another patient's API data.
7. Record glucose, BP, HbA1c and BMI and check all charts.
8. Complete all COM-B steps and confirm scores/history/recommendations.
9. Confirm AI prediction is blocked when required clinical fields are missing.
10. Generate a prediction after all required fields are available and verify SHAP factors.
11. Request an appointment as a patient and update it as a clinician.
12. Add medical history, notes, a care plan and goals as a clinician.
13. Update goal progress as the patient.
14. Verify notifications and audit events.
15. Test admin account activation/suspension.
16. Test desktop, tablet and mobile widths.
17. Complete keyboard-navigation and contrast checks.
18. Replace synthetic AI data before reporting final model metrics in the dissertation.
