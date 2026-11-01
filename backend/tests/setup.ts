process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.DATABASE_URL = "postgresql://aarogyai:aarogyai_password@localhost:5432/aarogyai_db?schema=public";
process.env.JWT_SECRET = "test_secret_that_is_long_enough_for_validation_12345";
process.env.JWT_EXPIRES_IN = "1d";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.AI_SERVICE_URL = "http://localhost:8000";
