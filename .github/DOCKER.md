# 🐳 Docker Configuration Guide

Guía completa para trabajar con Docker en el proyecto Gastos Personales.

## 📋 Tabla de Contenidos

- [Requisitos previos](#requisitos-previos)
- [Quick Start](#quick-start)
- [Estructura Docker](#estructura-docker)
- [Configuración](#configuración)
- [Comandos comunes](#comandos-comunes)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## ⚙️ Requisitos previos

- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Port availability**: 3001 (frontend), 3002 (backend)

```bash
# Verificar instalación
docker --version
docker compose --version
```

---

## 🚀 Quick Start

### 1. Clonar y preparar

```bash
git clone <repo>
cd Aplicaion-Web-para-Contro-De-Gastos-Personales

# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar .env con tus variables
nano .env  # o usar tu editor preferido
```

### 2. Construir y ejecutar

```bash
# Construir imágenes
docker compose build

# Iniciar servicios
docker compose up -d

# Verificar status
docker compose ps
```

### 3. Verificar que funciona

```bash
# Backend health
curl http://localhost:3002/health

# Frontend
curl http://localhost:3001/

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 4. Detener

```bash
docker compose down
```

---

## 📦 Estructura Docker

### `docker-compose.yml`

Orquestra dos servicios:

```yaml
services:
  backend:
    # Node.js/Express server
    # Puerto: 3002 (mapeado a 3000 interno)
    # Volumen: ./backend:/app
    
  frontend:
    # Next.js server
    # Puerto: 3001 (mapeado a 3000 interno)
    # Volumen: ./frontend:/app
```

### `backend/Dockerfile`

Multi-stage build:

```dockerfile
# Stage 1: Builder
- Node 20 Alpine
- npm ci --only=production
- Instala dependencias

# Stage 2: Production
- Node 20 Alpine (imagen pequeña)
- Copia node_modules del builder
- Usuario no-root (nodejs)
- Healthcheck configurado
```

**Beneficios:**
- ✅ Imagen final más pequeña (~300MB vs ~600MB)
- ✅ Seguridad: usuario no-root
- ✅ Salud monitoreable: healthcheck integrado
- ✅ Optimizado para producción

### `frontend/Dockerfile`

Multi-stage build con Next.js:

```dockerfile
# Stage 1: Builder
- Node 20 Alpine
- npm ci (instala dev dependencies)
- npm run build (compila Next.js)

# Stage 2: Production
- Node 20 Alpine
- Copia .next (build precompilado)
- Copia node_modules (solo production)
- Usuario no-root
- Healthcheck configurado
```

**Beneficios:**
- ✅ Imagen optimizada (sin source code)
- ✅ Build en Docker (no requiere build local)
- ✅ Startup más rápido (código precompilado)
- ✅ Mejor seguridad

---

## 🔧 Configuración

### Variables de Entorno

Editar `.env`:

```bash
# Puertos
BACKEND_PORT=3002          # Puerto externo backend
FRONTEND_PORT=3001         # Puerto externo frontend
NODE_ENV=development       # development | production

# Backend
DATABASE_URL=              # Tu BD (MongoDB, PostgreSQL, etc)
SUPABASE_URL=              # Supabase URL
SUPABASE_KEY=              # Supabase API key
JWT_SECRET=                # Min 32 caracteres para JWT

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002  # Backend URL
```

> **Nota:** `NEXT_PUBLIC_*` es disponible en el navegador (frontend). Nunca guardes secrets aquí.

### Volúmenes

```yaml
volumes:
  - ./backend:/app              # Sincroniza código local con contenedor
  - /app/node_modules           # Node_modules en volumen (evita conflictos)
```

**Beneficio:** Cambios en el código local se reflejan al instante en el contenedor.

### Networking

```yaml
networks:
  gastos-network:
    driver: bridge
```

Permite comunicación entre contenedores:
- Backend → Frontend: `http://gastos-frontend:3000`
- Frontend → Backend: `http://gastos-backend:3000`

### Healthcheck

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Docker automáticamente:
- ✅ Verifica salud cada 30 segundos
- ✅ Marca contenedor como "unhealthy" si falla
- ✅ Puede restart automáticamente (restart: unless-stopped)

---

## 📟 Comandos comunes

### Build & Startup

```bash
# Build imágenes
docker compose build

# Build sin cache
docker compose build --no-cache

# Build servicio específico
docker compose build backend

# Iniciar en background
docker compose up -d

# Iniciar con logs en foreground
docker compose up

# Ver status
docker compose ps
```

### Logs

```bash
# Ver logs de todos
docker compose logs

# Logs en tiempo real (backend)
docker compose logs -f backend

# Últimas 50 líneas
docker compose logs --tail=50

# Logs con timestamps
docker compose logs --timestamps

# Seguir logs de múltiples servicios
docker compose logs -f backend frontend
```

### Ejecutar comandos en contenedor

```bash
# Bash en backend
docker compose exec backend sh

# Bash en frontend
docker compose exec frontend sh

# Ejecutar npm test en backend
docker compose exec backend npm test

# Ejecutar comando sin enter en shell
docker compose exec -T backend npm test
```

### Limpieza

```bash
# Parar servicios (mantiene volúmenes)
docker compose down

# Parar + eliminar volúmenes
docker compose down -v

# Eliminar imágenes
docker compose down --rmi all

# Limpiar sistema (ojo: elimina contenedores no usados)
docker system prune -a
```

### Rebuild después de cambios

```bash
# Cambio en Dockerfile o dependencias
docker compose up -d --build

# Force rebuild sin cache
docker compose up -d --build --no-cache
```

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Encontrar qué usa el puerto
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# O cambiar en .env
FRONTEND_PORT=3011  # usa 3011 en lugar de 3001
BACKEND_PORT=3012
```

### "Cannot connect to backend"

```bash
# Verificar que backend está corriendo
docker compose ps

# Ver logs del backend
docker compose logs backend

# Verificar healthcheck
docker compose ps  # mira columna STATUS

# Hacer curl desde frontend
docker compose exec frontend curl http://gastos-backend:3000/health
```

### "node_modules not found" o conflictos

```bash
# Eliminar volumen de node_modules
docker volume ls | grep node_modules
docker volume rm <volume_id>

# Rebuild
docker compose up -d --build
```

### "Permission denied" en volúmenes

**Windows:** Usually no es problema

**Linux/Mac:** 
```bash
# Cambiar permisos
sudo chown -R $(id -u):$(id -g) ./backend ./frontend

# O ejecutar Docker con usuario actual
# (configurar en /etc/docker/daemon.json)
```

### Contenedor crashea al iniciar

```bash
# Ver últimos logs (contenedor ya parado)
docker compose logs backend

# Reintentar con logs
docker compose up backend

# Revisar Dockerfile y verificar CMD
# Ejemplo: CMD ["npm", "start"] debe coincidir con package.json
```

### Build falla por dependencias

```bash
# Eliminar todo y reconstruir desde cero
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Ver logs de build
docker compose build --no-cache 2>&1 | less
```

### .env variables no se cargan

```bash
# Verificar que .env está en raíz del proyecto
ls -la .env

# Reiniciar servicios
docker compose down
docker compose up -d

# Verificar variable dentro del contenedor
docker compose exec backend printenv NODE_ENV
```

---

## 🚀 Production Deployment

### Pre-deployment checklist

- [ ] ✅ Todas las tests pasan (local)
- [ ] ✅ CI/CD pipeline verde (GitHub Actions)
- [ ] ✅ `.env` configurado con valores de producción
- [ ] ✅ Database URL apunta a production DB
- [ ] ✅ JWT_SECRET es seguro y único
- [ ] ✅ CORS y security headers configurados

### Build para producción

```bash
# 1. Construir imágenes (con versión tag)
docker compose build --build-arg NODE_ENV=production

# 2. Tag images para registry
docker tag gastos-backend:latest myregistry/gastos-backend:1.0.0
docker tag gastos-frontend:latest myregistry/gastos-frontend:1.0.0

# 3. Push a registry
docker push myregistry/gastos-backend:1.0.0
docker push myregistry/gastos-frontend:1.0.0
```

### Deployment stack (ejemplo con Docker Swarm)

```yaml
# docker-stack.yml
version: '3.9'

services:
  backend:
    image: myregistry/gastos-backend:1.0.0
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: myregistry/gastos-frontend:1.0.0
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.example.com
    deploy:
      replicas: 2
```

```bash
# Deploy stack
docker stack deploy -c docker-stack.yml gastos
```

### Monitoring en producción

```bash
# Ver estado de servicios
docker service ls

# Logs de un servicio
docker service logs gastos_backend

# Stats en tiempo real
docker stats
```

---

## 📊 Performance Tips

### Reduce image size

```dockerfile
# ✅ BIEN: Multi-stage
FROM node:20-alpine AS builder
...copied to smaller image

# ❌ MAL: 1GB+ imagen
FROM node:20
```

**Resultado:**
- Backend: ~300MB
- Frontend: ~350MB

### Faster builds

```bash
# Cache layers:
# 1. Copia package*.json
# 2. npm ci
# 3. COPY source

# Esto evita reinstalar si solo cambias código
```

### Hotreload en desarrollo

```bash
# Gracias a volúmenes, cambios se reflejan al instante
# Solo reinicia app si necesario (nodemon detecta cambios)

docker compose up -d
# Editar backend/src/index.js
# → Automáticamente se recompila
```

---

## 🔐 Security Best Practices

### ✅ Ya implementado

1. **Non-root user** - Contenedor corre como `nodejs:nodejs` (uid 1001)
2. **Alpine base** - Imagen más pequeña = menos vulnerabilidades
3. **Multi-state build** - No incluye dev dependencies en producción
4. **Healthcheck** - Detecta contenedores unhealthy
5. **.dockerignore** - Excluye archivos innecesarios

### ⚠️ Adicional recommendations

```bash
# 1. Escanear vulnerabilidades
docker image scan gastos-backend:latest

# 2. Usar registry privado
# NO: docker.io (público)
# SÍ: AWS ECR, Azure ACR, GitHub Container Registry

# 3. Firmar imágenes
docker image sign gastos-backend:latest

# 4. Limitar recursos
docker run --memory="512m" --cpus="1" gastos-backend:latest
```

---

## 📚 References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node Alpine Images](https://hub.docker.com/_/node)
- [Best Practices for Node.js](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Next.js Docker](https://nextjs.org/docs/deployment/docker)

---

## 💡 Tips & Tricks

### Alias útiles

```bash
# Agregar a .bashrc o .zshrc
alias dc='docker compose'
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'
alias dcps='docker compose ps'
```

### VSCode Integration

```json
// .vscode/launch.json - Debug containers
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "restart": true,
      "preLaunchTask": "docker compose up -d"
    }
  ]
}
```

### GitHub Actions - Build & Push

```yaml
# Build y push automático en merge a main
- name: Build and push images
  run: |
    docker compose build --build-arg NODE_ENV=production
    docker tag gastos-backend:latest ghcr.io/${{ github.repository }}/backend:latest
    docker push ghcr.io/${{ github.repository }}/backend:latest
```

---

## 🆘 Getting Help

1. Revisar [Troubleshooting](#troubleshooting)
2. Ver logs: `docker compose logs -f`
3. Buscar issue en GitHub
4. Abrir issue con:
   - `docker compose config` output
   - Error logs completo
   - Steps para reproducir
