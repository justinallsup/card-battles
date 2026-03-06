.PHONY: dev up down migrate seed studio typecheck test clean logs

dev:
	pnpm --filter @card-battles/web run dev & pnpm --filter @card-battles/api run dev

up:
	docker compose up --build

down:
	docker compose down

migrate:
	pnpm db:migrate

seed:
	pnpm db:seed

studio:
	pnpm db:studio

typecheck:
	pnpm -r run typecheck

test:
	pnpm -r run test

clean:
	docker compose down -v
	find . -name node_modules -type d -prune -exec rm -rf {} +

logs:
	docker compose logs -f api worker

setup:
	cp .env.example .env && pnpm install && make migrate && make seed
	@echo "✅ Setup complete! Run 'make up' to start."
