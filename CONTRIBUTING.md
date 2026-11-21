# Contributing to Tahseel

Thank you for your interest in contributing to Tahseel!

## Development Setup

1. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

## Code Quality Standards

Before submitting a pull request, ensure all linters and tests pass:

- **Backend:**
  ```bash
  cd backend
  ruff check app/ tests/
  pytest tests/ -v
  ```

- **Frontend:**
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Make your changes with clear, descriptive commit messages.
3. Verify that all 47 backend tests pass and frontend builds with 0 errors.
4. Submit your pull request with a summary of the changes and motivation.

