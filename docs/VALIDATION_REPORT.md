# Validation report for the generated archive

Validation performed while packaging:

- Python source syntax compilation: passed.
- Relative TypeScript/TSX import resolution check: passed.
- TypeScript/TSX parser syntax check: passed.
- AI automated tests executed:
  - schema validation
  - risk category
  - preprocessing
  - FastAPI health/input contract
  - explainable prediction response contract
- AI test result: **15 passed**.

Backend and frontend package dependencies are intentionally not bundled.
Run `npm install` locally, then execute `npm test` and the normal build commands.

Docker could not be executed in the packaging environment, so the supplied
Docker configuration must be verified on the target machine with Docker Desktop.
