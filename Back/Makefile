VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

.PHONY: install-back run-back venv

venv:
	@test -d $(VENV) || python3 -m venv $(VENV)

install-back: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements_api.txt

run-back: venv
	$(PYTHON) -m uvicorn main:app --reload --port 8000