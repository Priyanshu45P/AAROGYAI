FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY training ./training
COPY models ./models
COPY data ./data
COPY results ./results

EXPOSE 8000

# The service can start without a model, but /predict will return a clear
# service error until a research or development model has been trained.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
