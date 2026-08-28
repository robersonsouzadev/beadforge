#!/usr/bin/env bash
set -e

echo "=========================================="
echo "  BeadForge Studio - VPS Database Setup   "
echo "=========================================="

DB_USER="beadforge"
DB_PASS='Selva@!13894645'
DB_NAME="beadforge"

echo "[1/3] Configurando banco PostgreSQL..."
if command -v docker &> /dev/null && docker ps | grep -q "postgres"; then
    PG_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
    echo "Detectado container Docker Postgres: $PG_CONTAINER"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS'; END IF; END \$\$;"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec"
    docker exec -i "$PG_CONTAINER" psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    docker exec -i "$PG_CONTAINER" psql -U postgres -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
else
    echo "Configurando Postgres local..."
    sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS'; END IF; END \$\$;"
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
fi

echo "[2/3] Criando arquivo .env otimizado com codificação URL..."
cat << 'EOF' > .env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database (Senha 'Selva@!13894645' codificada em URL como 'Selva%40%2113894645')
DATABASE_URL="postgres://beadforge:Selva%40%2113894645@postgres:5432/beadforge"
POSTGRES_USER=beadforge
POSTGRES_PASSWORD=Selva@!13894645
POSTGRES_DB=beadforge

# Better Auth
BETTER_AUTH_SECRET="beadforge_super_secret_auth_key_2026_x"
BETTER_AUTH_URL="https://app.hamabeadsbrasil.com.br"
NEXT_PUBLIC_APP_URL="https://app.hamabeadsbrasil.com.br"

# Admin User
ADMIN_EMAIL="robersonsouza@outlook.com"
EOF

echo "[3/3] Reiniciando containers..."
docker compose down || true
docker compose up -d --build

echo "=========================================="
echo "  Sucesso! Sistema pronto em:             "
echo "  https://app.hamabeadsbrasil.com.br      "
echo "=========================================="
