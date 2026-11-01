# AAROGYAI

**AAROGYAI: Design and Development of an Explainable AI-Based Patient Management System for Diabetes and Hypertension Monitoring with Clinical Decision Support**

AAROGYAI is an MSc-level research prototype built with the final agreed architecture:

- **Frontend:** React + TypeScript + Vite
- **Application API:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI/XAI service:** Python + FastAPI + scikit-learn + SHAP

## Implemented features

### Patient
- Secure registration/login
- Profile and date-of-birth management
- Clinical reading entry and history
- Separate glucose, blood-pressure, HbA1c and BMI/weight trend charts
- Medical history view
- Multi-step COM-B assessment
- Capability, Opportunity and Motivation scoring
- COM-B history chart
- Behaviour-support recommendations
- AI prediction request and SHAP factor display
- Appointment request and history
- Care-plan and goal view
- Goal progress updates
- Progress timeline
- In-app notification dropdown

### Clinician
- Secure clinician workspace
- Patient list and detail screen
- Combined Clinical Decision Support Summary
- Medical-history entry for conditions, medications and allergies
- COM-B history
- AI/XAI history
- Appointment status workflow
- Care-plan creation
- Clinical notes

### Admin
- User list
- Account activation/suspension
- Verified clinician-account creation
- Statistics
- Audit log

### Backend / security
- JWT authentication
- bcrypt password hashing
- Role-based API permissions
- Patient data isolation
- Zod validation
- Helmet, CORS and rate limiting
- PostgreSQL/Prisma persistence
- Audit logging
- In-app notifications
- No silent fallback clinical values for AI predictions

## Clinical vs behavioural architecture

Clinical data is sent to the machine-learning service:

`Clinical Data → ML Risk Prediction → SHAP Explanation`

COM-B remains separate:

`COM-B Questionnaire → Capability / Opportunity / Motivation → Behaviour Barriers → Behaviour Support`

Both are presented together only at clinician decision-support level.

## Run locally

### 1. PostgreSQL
```bash
docker compose up -d postgres
```

### 2. Backend
```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 3. AI service
```bash
cd ai-service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python training/generate_demo_data.py
python training/train.py
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Demo users
- Admin: `admin@aarogyai.test` / `Admin123!`
- Clinician: `doctor@aarogyai.test` / `Doctor123!`
- Patient: `patient@aarogyai.test` / `Patient123!`

## Requirements status
See `docs/REQUIREMENTS_CHECKLIST.md` for a transparent checklist of implemented features and the final external evaluation tasks.

## Testing
Backend:
```bash
cd backend
npm test
```

AI:
```bash
cd ai-service
pytest
```

## Critical dissertation note about the AI dataset
The included generator creates **synthetic development data only** so the complete software pipeline can run without distributing patient data. It is **not clinical evidence** and must not be used to claim real-world model accuracy or effectiveness.

For the final dissertation evaluation, replace `ai-service/data/demo_clinical_data.csv` with a properly sourced, permitted research dataset and document its provenance, variables, ethics/licence conditions, preprocessing, class balance and limitations. Retrain the model and report only metrics produced from that final dataset.

## Safety statement
AAROGYAI is a research and decision-support prototype. It does not diagnose disease, prescribe medication, alter medication dosage, provide emergency care, or replace a qualified healthcare professional.

## Final verification
Before submission, follow `docs/FINAL_TESTING_CHECKLIST.md`. Source code can be prepared here, but final dependency installation, database migration, browser testing and research-dataset evaluation must be run in your local environment.


## Final AI research evaluation

The project includes a complete evaluation pipeline, but it does not bundle a final clinical research dataset.

1. Add the approved dataset to `ai-service/data/raw/research_dataset.csv`.
2. Document its source and licence.
3. Run:

```bash
cd ai-service
python training/preprocess.py
python training/train.py
python training/evaluate.py
python training/explain.py
```

Generated dissertation evidence is stored in `ai-service/results/`.

For software-development testing only:

```bash
python training/generate_demo_data.py
python training/train.py --demo
```

Synthetic/demo metrics must not be presented as clinical or research evidence.


## Final security and privacy model

Clinicians do not automatically receive access to every patient. A clinician must have an active `ClinicianPatientAssignment`. Administrators can manage these relationships from **Admin → Care Access**. Confirming an appointment also creates or reactivates the relevant care relationship.

Behaviour-support recommendations are created as **pending review**. Patients only receive recommendations after an authorised clinician approves them.

## Docker

The root Docker Compose file now starts:
- PostgreSQL
- Node/Express backend
- FastAPI AI service

Copy `.env.docker.example` to `.env` and replace all development secrets before running:

```bash
docker compose up --build
```

## Research dataset

The final research dataset is intentionally not fabricated or bundled. See:

- `ai-service/data/raw/PUT_APPROVED_RESEARCH_DATASET_HERE.md`
- `docs/AI_EVALUATION_GUIDE.md`
- `docs/FINAL_REQUIREMENTS_STATUS.md`

The AI code is ready to generate final metrics and SHAP evidence once the approved dataset is supplied.
