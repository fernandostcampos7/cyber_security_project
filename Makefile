.PHONY: backend frontend seed

backend:
cd backend && flask run --port 5000

frontend:
cd frontend && npm run dev

seed:
cd backend && python -m app.seed
