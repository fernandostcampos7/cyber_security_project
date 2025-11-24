SHELL := /bin/bash

.PHONY: all backend frontend clean

all: backend frontend

backend:
	@echo "Starting backend from project root..."
	test -d backend/.venv || python3 -m venv backend/.venv
	source backend/.venv/bin/activate && \
	pip install -r backend/requirements.txt && \
	python3 -m backend.app

frontend:
	@echo "Starting frontend from project root..."
	test -d backend/.venv || python3 -m venv backend/.venv
	source backend/.venv/bin/activate && \
	cd frontend && \
	npm install && \
	npm run dev

clean:
	@echo "Stopping processes on ports 5000 and 5173..."
	-lsof -ti:5000 | xargs -r kill -9
	-lsof -ti:5173 | xargs -r kill -9
	@echo "Clean complete."
