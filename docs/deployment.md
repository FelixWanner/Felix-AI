# Life OS - Deployment Guide

Vollständige Anleitung für das Deployment auf Hetzner Cloud.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Hetzner Cloud Server Setup](#hetzner-cloud-server-setup)
3. [Domain & DNS Konfiguration](#domain--dns-konfiguration)
4. [Server Grundkonfiguration](#server-grundkonfiguration)
5. [Docker Installation](#docker-installation)
6. [Firewall Regeln](#firewall-regeln)
7. [SSL Zertifikate](#ssl-zertifikate)
8. [Deployment](#deployment)
9. [Wartung & Monitoring](#wartung--monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Voraussetzungen

- Hetzner Cloud Account
- Domain mit DNS-Zugriff
- SSH Key Pair
- Lokale Entwicklungsumgebung mit Git

### Empfohlene Server-Spezifikationen

| Typ | vCPUs | RAM | Disk | Preis/Monat | Empfehlung |
|-----|-------|-----|------|-------------|------------|
| CX21 | 2 | 4 GB | 40 GB | ~€5 | Minimum/Test |
| CX31 | 2 | 8 GB | 80 GB | ~€9 | Empfohlen |
| CX41 | 4 | 16 GB | 160 GB | ~€16 | Production |

> **Empfehlung**: CX31 für die meisten Anwendungsfälle. CX41 wenn viele Embeddings/AI-Operationen.

---

## Hetzner Cloud Server Setup

### 1. Server erstellen

1. Login unter [console.hetzner.cloud](https://console.hetzner.cloud)
2. Projekt erstellen oder auswählen
3. **Server hinzufügen**:
   - **Location**: Nürnberg (nbg1) oder Falkenstein (fsn1)
   - **Image**: Ubuntu 22.04
   - **Typ**: CX31 (empfohlen)
   - **Networking**: IPv4 & IPv6 aktiviert
   - **SSH Key**: Eigenen Public Key hinzufügen
   - **Name**: `lifeos-prod`

4. Server erstellen und IP-Adresse notieren

### 2. SSH Key hinzufügen (falls nicht vorhanden)

```bash
# Lokalen SSH Key erstellen
ssh-keygen -t ed25519 -C "lifeos@example.com"

# Public Key anzeigen
cat ~/.ssh/id_ed25519.pub

# In Hetzner Console unter "SSH Keys" hinzufügen
```

### 3. Erste Verbindung

```bash
# SSH Verbindung testen
ssh root@<SERVER_IP>

# Fingerprint bestätigen beim ersten Mal
```

---

## Domain & DNS Konfiguration

### 1. DNS Records erstellen

Bei deinem Domain-Provider folgende Records anlegen:

```
# A Records (IPv4)
@       A       <SERVER_IP>
www     A       <SERVER_IP>
api     A       <SERVER_IP>
n8n     A       <SERVER_IP>
studio  A       <SERVER_IP>

# AAAA Records (IPv6) - optional
@       AAAA    <SERVER_IPV6>
www     AAAA    <SERVER_IPV6>
api     AAAA    <SERVER_IPV6>
n8n     AAAA    <SERVER_IPV6>
studio  AAAA    <SERVER_IPV6>
```

### 2. DNS Propagation prüfen

```bash
# DNS Auflösung testen
dig +short lifeos.example.com
dig +short api.lifeos.example.com
dig +short n8n.lifeos.example.com

# Oder online: https://dnschecker.org
```

> **Hinweis**: DNS-Änderungen können bis zu 48 Stunden dauern.

---

## Server Grundkonfiguration

### 1. System aktualisieren

```bash
ssh root@<SERVER_IP>

# System Update
apt update && apt upgrade -y

# Essenzielle Tools installieren
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ncdu \
    unzip \
    fail2ban \
    ufw
```

### 2. Neuen Admin-Benutzer erstellen

```bash
# Benutzer erstellen
adduser lifeos

# Sudo-Rechte geben
usermod -aG sudo lifeos

# SSH Key für neuen Benutzer kopieren
mkdir -p /home/lifeos/.ssh
cp ~/.ssh/authorized_keys /home/lifeos/.ssh/
chown -R lifeos:lifeos /home/lifeos/.ssh
chmod 700 /home/lifeos/.ssh
chmod 600 /home/lifeos/.ssh/authorized_keys
```

### 3. SSH härten

```bash
# SSH Konfiguration bearbeiten
vim /etc/ssh/sshd_config
```

Folgende Einstellungen ändern:

```
# Root Login deaktivieren
PermitRootLogin no

# Passwort-Authentifizierung deaktivieren
PasswordAuthentication no

# Nur SSH Key erlauben
PubkeyAuthentication yes

# Leere Passwörter verbieten
PermitEmptyPasswords no
```

```bash
# SSH neustarten
systemctl restart sshd

# WICHTIG: Neue Session testen bevor alte geschlossen wird!
ssh lifeos@<SERVER_IP>
```

### 4. Hostname setzen

```bash
# Hostname setzen
hostnamectl set-hostname lifeos-prod

# /etc/hosts aktualisieren
echo "<SERVER_IP> lifeos-prod" >> /etc/hosts
```

### 5. Timezone konfigurieren

```bash
timedatectl set-timezone Europe/Berlin
timedatectl
```

---

## Docker Installation

### 1. Docker Engine installieren

```bash
# Als lifeos Benutzer
sudo -i

# Docker GPG Key hinzufügen
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker Repository hinzufügen
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker Version prüfen
docker --version
docker compose version
```

### 2. Docker für Benutzer konfigurieren

```bash
# lifeos zur docker Gruppe hinzufügen
usermod -aG docker lifeos

# Logout und Login für Gruppenänderung
# Oder: newgrp docker
```

### 3. Docker konfigurieren

```bash
# Docker Daemon Konfiguration
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
EOF

# Docker neustarten
systemctl restart docker
systemctl enable docker
```

---

## Firewall Regeln

### 1. UFW konfigurieren

```bash
# Firewall-Regeln setzen
ufw default deny incoming
ufw default allow outgoing

# SSH erlauben (WICHTIG: Zuerst!)
ufw allow ssh
ufw allow 22/tcp

# HTTP & HTTPS erlauben
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall aktivieren
ufw enable

# Status prüfen
ufw status verbose
```

### 2. Erweiterte Regeln (optional)

```bash
# Rate Limiting für SSH (Brute-Force Schutz)
ufw limit ssh/tcp

# Spezifische IP erlauben (z.B. für Admin-Zugriff)
# ufw allow from <DEINE_IP> to any port 22
```

### 3. Fail2Ban konfigurieren

```bash
# Fail2Ban Konfiguration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 24h
EOF

# Fail2Ban starten
systemctl enable fail2ban
systemctl restart fail2ban

# Status prüfen
fail2ban-client status sshd
```

---

## SSL Zertifikate

### Automatisch via Caddy

Caddy generiert automatisch SSL-Zertifikate via Let's Encrypt. Keine manuelle Konfiguration nötig!

### Voraussetzungen

1. Domain zeigt auf Server (DNS A-Record)
2. Port 80 und 443 offen
3. Caddy läuft mit korrekter Domain-Konfiguration

### Caddyfile Beispiel

```caddyfile
# /home/lifeos/lifeos/caddy/Caddyfile

{
    email admin@example.com
    acme_ca https://acme-v02.api.letsencrypt.org/directory
}

# Hauptdomain
lifeos.example.com {
    reverse_proxy frontend:3000
    encode gzip
}

# API
api.lifeos.example.com {
    reverse_proxy supabase-kong:8000
    encode gzip
}

# n8n
n8n.lifeos.example.com {
    reverse_proxy n8n:5678
    encode gzip
}

# Studio
studio.lifeos.example.com {
    reverse_proxy supabase-studio:3000
    encode gzip
    basicauth {
        admin $2a$14$... # bcrypt hash
    }
}
```

### Zertifikat-Status prüfen

```bash
# Caddy Logs für Zertifikat-Ausgabe
docker logs lifeos-caddy | grep -i cert

# Zertifikat testen
curl -vI https://lifeos.example.com 2>&1 | grep -A5 "Server certificate"

# SSL Labs Test
# https://www.ssllabs.com/ssltest/analyze.html?d=lifeos.example.com
```

---

## Deployment

### 1. Repository klonen

```bash
# Als lifeos Benutzer
cd /home/lifeos

# Repository klonen
git clone https://github.com/FelixWanner/Felix-AI.git lifeos
cd lifeos
```

### 2. Environment Variables

```bash
# .env Datei erstellen
cp .env.example .env

# Sichere Passwörter generieren
openssl rand -base64 32  # Für POSTGRES_PASSWORD
openssl rand -base64 64  # Für JWT_SECRET
openssl rand -base64 32  # Für N8N_PASSWORD

# .env bearbeiten
vim .env
```

**.env Beispiel:**

```env
# Domain
DOMAIN=lifeos.example.com

# PostgreSQL
POSTGRES_PASSWORD=<SICHERES_PASSWORT>

# JWT
JWT_SECRET=<LANGES_GEHEIMES_TOKEN>

# Supabase Keys (generieren mit jwt.io)
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_KEY=<SERVICE_KEY>

# n8n
N8N_HOST=n8n.lifeos.example.com
N8N_USER=admin
N8N_PASSWORD=<SICHERES_PASSWORT>
N8N_DB_PASSWORD=<SICHERES_PASSWORT>

# Dashboard Auth
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<SICHERES_PASSWORT>

# SMTP (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=<SMTP_PASSWORT>
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_SENDER_NAME=Life OS

# URLs
SITE_URL=https://lifeos.example.com
API_EXTERNAL_URL=https://api.lifeos.example.com
SUPABASE_PUBLIC_URL=https://api.lifeos.example.com
```

### 3. Supabase Keys generieren

```bash
# JWT Secret generieren
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET: $JWT_SECRET"

# Anon Key generieren (mit jwt.io oder Node.js)
node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || '$JWT_SECRET';
const anon = jwt.sign({
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
}, secret);
console.log('SUPABASE_ANON_KEY:', anon);
"

# Service Key generieren
node -e "
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || '$JWT_SECRET';
const service = jwt.sign({
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
}, secret);
console.log('SUPABASE_SERVICE_KEY:', service);
"
```

### 4. Production Deployment

```bash
# Mit Production Overrides starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Logs überwachen
docker compose logs -f

# Health Check
./scripts/deploy.sh health
```

### 5. Migrations ausführen

```bash
# Datenbank-Migrations werden automatisch ausgeführt
# Falls manuelle Migration nötig:
docker exec -it lifeos-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/00001_initial_schema.sql
```

---

## Wartung & Monitoring

### Logs

```bash
# Alle Logs
docker compose logs -f

# Spezifischer Service
docker compose logs -f supabase-db
docker compose logs -f n8n
docker compose logs -f caddy
```

### Resource-Nutzung

```bash
# Docker Stats
docker stats

# System Resources
htop
df -h
free -m
```

### Updates

```bash
# Images aktualisieren
docker compose pull

# Neustart mit neuen Images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Alte Images aufräumen
docker image prune -a
```

### Backups

```bash
# Manuelles Backup
./scripts/backup.sh

# Automatisches Backup (cron)
crontab -e
# Hinzufügen:
# 0 3 * * * /home/lifeos/lifeos/scripts/backup.sh >> /var/log/lifeos-backup.log 2>&1
```

---

## Troubleshooting

### Container startet nicht

```bash
# Container Status
docker compose ps

# Logs des fehlerhaften Containers
docker compose logs <service_name>

# Container neustarten
docker compose restart <service_name>
```

### Datenbank-Verbindungsprobleme

```bash
# DB Container prüfen
docker exec -it lifeos-db pg_isready

# DB Logs
docker compose logs supabase-db

# Manuell verbinden
docker exec -it lifeos-db psql -U postgres
```

### SSL-Zertifikat Probleme

```bash
# Caddy Logs
docker compose logs caddy

# Zertifikate löschen und neu erstellen
docker compose stop caddy
docker volume rm lifeos_caddy_data
docker compose up -d caddy
```

### Disk Space

```bash
# Speicherverbrauch
df -h

# Docker Disk Usage
docker system df

# Aufräumen
docker system prune -a --volumes
```

### Performance Probleme

```bash
# Resource Limits prüfen
docker stats

# Slow Queries loggen (in PostgreSQL)
docker exec -it lifeos-db psql -U postgres -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
docker compose restart supabase-db
```

---

## Nützliche Befehle

```bash
# Alle Container neustarten
docker compose restart

# Komplett neu bauen
docker compose down
docker compose build --no-cache
docker compose up -d

# In Container Shell
docker exec -it lifeos-db bash

# Netzwerk-Debug
docker network inspect lifeos_lifeos-net

# Volumes auflisten
docker volume ls
```

---

## Checkliste vor Go-Live

- [ ] Server erstellt und SSH Zugang funktioniert
- [ ] DNS Records konfiguriert und propagiert
- [ ] Firewall aktiv mit korrekten Regeln
- [ ] Docker & Docker Compose installiert
- [ ] .env Datei mit sicheren Passwörtern
- [ ] SSL-Zertifikate aktiv (HTTPS funktioniert)
- [ ] Alle Services laufen (`docker compose ps`)
- [ ] Backup-Script konfiguriert und getestet
- [ ] Monitoring eingerichtet
- [ ] Erster Admin-Benutzer in Supabase erstellt
