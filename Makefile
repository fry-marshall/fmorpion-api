dev:
	@echo "Starting app in development environment..."
	NODE_ENV=dev docker compose --env-file .env.dev up

prod:
	@echo "Starting app in production environment..."
	docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

test-e2e:
	@echo "Running tests..."
	docker compose -f docker-compose.test.yml --env-file .env.test up

push-image:
	docker build --target=prod -t fmorpion_api -f Dockerfile . && docker tag fmorpion_api frymarshall/fmorpion_api:latest && docker push frymarshall/fmorpion_api