# Final local run order

## 1. Configure Docker
Copy:

`.env.docker.example` → `.env`

Set a strong PostgreSQL password and JWT secret.

## 2. Start PostgreSQL, backend and AI service
```bash
docker compose up --build
```

## 3. Seed development accounts
In another terminal:
```bash
docker compose exec backend npm run seed
```

## 4. Start the frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## 5. Final AI research evaluation
After adding the approved dataset:
```bash
cd ai-service
python training/preprocess.py
python training/train.py
python training/evaluate.py
python training/explain.py
```

## 6. Run tests
Backend:
```bash
cd backend
npm install
npm test
```

Frontend:
```bash
cd frontend
npm test
```

AI:
```bash
cd ai-service
pytest
```

Database-backed integration tests should use a dedicated test database and `RUN_DB_TESTS=1`.
