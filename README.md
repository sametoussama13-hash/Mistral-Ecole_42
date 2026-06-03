
## Start Backend:
uvicorn main:app --reload --port 8000

## AGENT:
make start-worker

## Start Front:
npm install
npm start

## Admin Intefrace

| Rôle          | Identifiant | Mot de passe | Accès
                
| Admin         | admin       | admin2024    | Tout + mode suppression
|Analyste Cyber | cyber1      | cyber2024    | Tickets + validation |
|Analyste Cyber | cyber2      | tpra2024     | Tickets + validation |