# Raccourcis de développement SportMatch (backend). Sous Windows : utiliser WSL ou Git Bash.
COMPOSE = docker compose -f infra/local/docker-compose.yml

.PHONY: up up-obs down reset logs ps smoke test verify kind kind-down

up:        ## Construit et démarre tout l'environnement local
	$(COMPOSE) up -d --build --wait --wait-timeout 600

up-obs:    ## Idem + Prometheus et Grafana
	$(COMPOSE) --profile observability up -d --build --wait --wait-timeout 600

down:      ## Arrête les conteneurs (les données sont conservées)
	$(COMPOSE) --profile observability down

reset:     ## Arrête et efface les données (bases, Kafka)
	$(COMPOSE) --profile observability down -v

logs:      ## Suit les journaux des microservices
	$(COMPOSE) logs -f sportmatch-gateway sportmatch-app sportmatch-notifications

ps:
	$(COMPOSE) ps

smoke:     ## Test de bout en bout sur l'environnement démarré
	bash infra/local/smoke-test.sh

test:      ## Tests unitaires (Maven requis)
	cd backend && mvn -B test

verify:    ## Tests unitaires + intégration Testcontainers (Docker requis)
	cd backend && mvn -B verify

kind:      ## Répétition du déploiement Kubernetes sur kind (kind, kubectl, helm requis)
	bash deploy/kind/rehearsal.sh

kind-down: ## Supprime le cluster kind
	kind delete cluster --name sportmatch
