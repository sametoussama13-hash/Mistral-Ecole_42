# =============================================================================
#  Makefile — Mistral-Ecole_42  (racine du projet)
#  Usage : make          → lance tout (back + workflows + front)
#          make back     → backend seul
#          make workflows→ worker Mistral seul
#          make front    → frontend seul
#          make stop     → arrête tous les processus lancés en arrière-plan
#          make install  → installe les dépendances des trois couches
# =============================================================================

.DEFAULT_GOAL := dev

# ---------------------------------------------------------------------------
# Chemins
# ---------------------------------------------------------------------------
BACK_DIR        := Back
WORKFLOWS_DIR   := evaluation_risques
FRONT_DIR       := front

# Fichiers de log (redirigés pour ne pas polluer le terminal principal)
LOG_BACK        := .logs/back.log
LOG_WORKFLOWS   := .logs/workflows.log
LOG_FRONT       := .logs/front.log

# ---------------------------------------------------------------------------
# Cibles principales
# ---------------------------------------------------------------------------

.PHONY: dev back workflows front stop install logs clean

## Lance les trois services en parallèle dans des sous-shells
dev: _mklogdir
	@echo "▶  Démarrage de tous les services…"
	@$(MAKE) -j3 back workflows front

## Backend FastAPI  (Back/)
back: _mklogdir
	@echo "▶  [back]      http://localhost:8000"
	cd $(BACK_DIR) && \
	  ( [ -f .venv/bin/activate ] && . .venv/bin/activate || true ) && \
	  uvicorn main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee ../$(LOG_BACK)

## Worker Mistral / workflows  (Back/evaluation_risques/)
workflows: _mklogdir
	@echo "▶  [workflows] worker Mistral en écoute"
	cd $(WORKFLOWS_DIR) && \
	  ( [ -f .venv/bin/activate ] && . .venv/bin/activate || true ) && \
	  PYTHONPATH=src .venv/bin/python -m src.entrypoints.worker 2>&1 | tee ../$(LOG_WORKFLOWS)

## Frontend React  (front/)
front: _mklogdir
	@echo "▶  [front]     http://localhost:3000"
	cd $(FRONT_DIR) && npm start 2>&1 | tee ../$(LOG_FRONT)

# ---------------------------------------------------------------------------
# Installation des dépendances
# ---------------------------------------------------------------------------

install: install-back install-workflows install-front

install-back:
	@echo "📦  Installation — Back"
	cd $(BACK_DIR) && \
	  ( command -v uv >/dev/null 2>&1 && uv sync || pip install -r requirements_api.txt )

install-workflows:
	@echo "📦  Installation — Workflows"
	cd $(WORKFLOWS_DIR) && \
	  ( command -v uv >/dev/null 2>&1 && uv sync || pip install -r requirements.txt )

install-front:
	@echo "📦  Installation — Front"
	cd $(FRONT_DIR) && npm install

# ---------------------------------------------------------------------------
# Utilitaires
# ---------------------------------------------------------------------------

## Affiche les logs des trois services en live (nécessite make dev en arrière-plan)
logs:
	tail -f $(LOG_BACK) $(LOG_WORKFLOWS) $(LOG_FRONT)

## Crée le dossier de logs si absent
_mklogdir:
	@mkdir -p .logs

## Arrête les processus uvicorn / python worker / vite lancés par ce Makefile
stop:
	@echo "■  Arrêt des services…"
	@pkill -f "uvicorn main:app"      2>/dev/null || true
	@pkill -f "src.entrypoints.worker" 2>/dev/null || true
	@pkill -f "react-scripts"         2>/dev/null || true
	@echo "   Done."

## Supprime les caches Python et les logs
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .logs
	@echo "🧹  Nettoyé."