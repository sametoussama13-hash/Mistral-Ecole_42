VENV= .venv
PYTHON= $(VENV)/bin/python
PIP= $(VENV)/bin/pip

install:
	test -f $(VENV) || python3 -m venv $(VENV)
	$(PIP) install -r requirements.txt

run:
	$(PYTHON) main.py