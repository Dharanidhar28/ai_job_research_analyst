# Stage 1: Install dependencies
FROM python:3.11-slim AS builder
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root --no-directory && \
    python -m spacy download en_core_web_sm

# Stage 2: Final Runtime
FROM python:3.11-slim
WORKDIR /app
# Copy only the installed packages from the builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
# Final cleanup of any local caches
RUN find . -type d -name "__pycache__" -exec rm -rf {} +
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
