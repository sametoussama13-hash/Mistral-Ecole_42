.PHONY: install install-back install-eval install-front \
        run run-back run-eval run-front \
        stop help

# ── Couleurs ────────────────────────────────────────────────────────────────
CYAN  := \033[1;36m
GREEN := \033[1;32m
RESET := \033[0m

# ── Chemins ─────────────────────────────────────────────────────────────────
BACK_DIR  := Back
EVAL_DIR  := evaluation_risques
FRONT_DIR := front

# ============================================================================
# INSTALL
# ============================================================================

## Installe les dépendances des trois projets
install: install-back install-eval install-front
	@echo "$(GREEN)✔  Tous les projets sont installés.$(RESET)"

## Backend (FastAPI) — pip
install-back:
	@echo "$(CYAN)▶  Installation du backend…$(RESET)"
	$(MAKE) -C $(BACK_DIR) install-back

## Évaluation des risques — uv
install-eval:
	@echo "$(CYAN)▶  Installation evaluation_risques…$(RESET)"
	$(MAKE) -C $(EVAL_DIR) install

## Frontend (Node / React) — npm
install-front:
	@echo "$(CYAN)▶  Installation du frontend…$(RESET)"
	$(MAKE) -C $(FRONT_DIR) install

# ============================================================================
# RUN  (lance les trois services en parallèle dans des terminaux séparés)
# ============================================================================

## Lance les trois services simultanément
run:
	@echo "$(CYAN)▶  Démarrage de tous les services…$(RESET)"
	@trap 'kill 0' INT; \
	$(MAKE) -C $(BACK_DIR)  run-back  & \
	$(MAKE) -C $(EVAL_DIR)  run       & \
	$(MAKE) -C $(FRONT_DIR) run       & \
	wait

## Backend uniquement
run-back:
	$(MAKE) -C $(BACK_DIR) run-back

## Évaluation des risques uniquement
run-eval:
	$(MAKE) -C $(EVAL_DIR) run

## Frontend uniquement
run-front:
	$(MAKE) -C $(FRONT_DIR) run

# ============================================================================
# AIDE
# ============================================================================

help:
	@echo ""
	@echo "$(CYAN)Commandes disponibles :$(RESET)"
	@echo "  make install        — installe les 3 projets"
	@echo "  make install-back   — installe le backend seul"
	@echo "  make install-eval   — installe evaluation_risques seul"
	@echo "  make install-front  — installe le frontend seul"
	@echo ""
	@echo "  make run            — lance les 3 services en parallèle"
	@echo "  make run-back       — lance le backend seul"
	@echo "  make run-eval       — lance evaluation_risques seul"
	@echo "  make run-front      — lance le frontend seul"
	@echo ""