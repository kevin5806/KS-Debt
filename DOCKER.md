# Docker Setup - KS-Debt

Questa guida spiega come utilizzare Docker con l'applicazione KS-Debt.

## Prerequisiti

- Docker installato e in esecuzione
- Docker Compose installato

## Struttura dei file Docker

- `Dockerfile` - Per la produzione (multi-stage build ottimizzato)
- `Dockerfile.dev` - Per lo sviluppo con nodemon
- `docker-compose.yml` - Configurazione produzione
- `docker-compose.dev.yml` - Configurazione sviluppo
- `.dockerignore` - File da escludere dall'immagine

## Configurazione dell'ambiente

1. Copia il file `.env.example` a `.env` (se non esiste):
   ```bash
   cp .env.example .env
   ```

2. Modifica `.env` con i tuoi valori:
   ```env
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/database
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   SESSION_KEY=your-session-key
   COOKIE_KEY=your-cookie-key
   URL=https://yourapp.example.com
   ```

## Uso in Produzione

### Build dell'immagine

```bash
docker build -t ks-debt:latest .
```

### Esecuzione con docker-compose

```bash
docker-compose up -d
```

### Visualizzare i log

```bash
docker-compose logs -f app
```

### Fermare i container

```bash
docker-compose down
```

## Uso in Sviluppo

### Build dell'immagine di sviluppo

```bash
docker build -f Dockerfile.dev -t ks-debt:dev .
```

### Esecuzione con docker-compose in modalità sviluppo

```bash
docker-compose -f docker-compose.dev.yml up
```

Questo avvierà l'app con hot-reload abilitato.

### Visualizzare i log

```bash
docker-compose -f docker-compose.dev.yml logs -f app
```

### Fermare i container

```bash
docker-compose -f docker-compose.dev.yml down
```

## Comandi Utili

### Eseguire un comando nel container

```bash
docker-compose exec app npm install
```

### Accedere al container in interattivo

```bash
docker-compose exec app sh
```

### Visualizzare le immagini

```bash
docker images | grep ks-debt
```

### Visualizzare i container in esecuzione

```bash
docker ps
```

### Eliminare un container

```bash
docker-compose down -v
```

## Troubleshooting

### Errori di connessione al database

Assicurati che:
- MongoDB sia accessibile dall'indirizzo nella variabile `DB_URL`
- I firewall non blocchino la connessione
- Le credenziali siano corrette

### Port già in uso

Se la porta 3000 è già in uso, modifica il file `docker-compose.yml`:
```yaml
ports:
  - "8000:3000"  # Accedi a localhost:8000
```

### Problemi con variabili d'ambiente

Verifica che il file `.env` sia nella radice del progetto e contenga tutte le variabili necessarie.

## Note Importanti

1. **Sicurezza**: L'immagine di produzione esegue l'app con un utente non-root
2. **Health Check**: Include un health check che verifica se l'app è raggiungibile
3. **Multi-stage build**: L'immagine di produzione è ottimizzata e leggera
4. **Hot reload**: La modalità sviluppo supporta il ricaricamento automatico dei file

## Aggiornamento del package.json

Aggiungi questi script nel tuo `package.json` se non presenti:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

## Verifica della salute dell'app

```bash
curl http://localhost:3000
```

L'app dovrebbe essere raggiungibile e rispondere correttamente.
