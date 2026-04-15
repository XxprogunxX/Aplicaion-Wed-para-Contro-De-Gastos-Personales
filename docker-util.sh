#!/bin/bash

# Docker utility script para el proyecto Gastos Personales
# uso: ./docker-util.sh [command]

set -e

# Colores para output
RED='\033[0;31m'\nGREEN='\033[0;32m'\nYELLOW='\033[1;33m'\nBLUE='\033[0;34m'\nNC='\033[0m' # No Color

# Funciones de output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Mostrar menú
show_menu() {
    echo ""
    echo -e "${BLUE}🐳 Docker Utility Script${NC}"
    echo "=========================="
    echo ""
    echo "Usage: ./docker-util.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up              Inicia los servicios en background"
    echo "  down            Detiene los servicios"
    echo "  up-verbose      Inicia servicios con logs en foreground"
    echo "  rebuild         Reconstruye las imágenes"
    echo "  rebuild-nc      Reconstruye sin cache"
    echo "  logs            Muestra logs de todos los servicios"
    echo "  logs-backend    Muestra logs del backend"
    echo "  logs-frontend   Muestra logs del frontend"
    echo "  ps              Muestra estado de servicios"
    echo "  shell-backend   Abre shell en el backend"
    echo "  shell-frontend  Abre shell en el frontend"
    echo "  test-backend    Corre tests del backend"
    echo "  test-frontend   Corre tests del frontend"
    echo "  lint-backend    Corre linter del backend"
    echo "  lint-frontend   Corre linter del frontend"
    echo "  health          Verifica salud de los servicios"
    echo "  clean           Detiene y elimina volúmenes"
    echo "  clean-all       Detiene, elimina volúmenes e imágenes"
    echo "  setup           Setup inicial del proyecto"
    echo "  help            Muestra esta ayuda"
    echo ""
}

# Comando: up
cmd_up() {
    log_info "Iniciando servicios..."
    docker compose up -d
    
    sleep 2
    
    log_success "Servicios iniciados!"
    echo ""
    cmd_ps
    echo ""
    echo "🌐 Acceso:"
    echo "  Frontend: http://localhost:3001"
    echo "  Backend:  http://localhost:3002"
}

# Comando: down
cmd_down() {
    log_info "Deteniendo servicios..."
    docker compose down
    log_success "Servicios detenidos!"
}

# Comando: up-verbose
cmd_up_verbose() {
    log_info "Iniciando servicios (con logs)..."
    docker compose up
}

# Comando: rebuild
cmd_rebuild() {
    log_info "Reconstruyendo imágenes..."
    docker compose build
    log_success "Imágenes reconstruidas!"
    
    log_info "Iniciando servicios..."
    docker compose up -d
    log_success "¡Listo!"
}

# Comando: rebuild-nc
cmd_rebuild_nc() {
    log_info "Reconstruyendo imágenes (sin cache)..."
    docker compose build --no-cache
    log_success "Imágenes reconstruidas!"
    
    log_info "Iniciando servicios..."
    docker compose up -d
    log_success "¡Listo!"
}

# Comando: logs
cmd_logs() {
    docker compose logs -f
}

# Comando: logs-backend
cmd_logs_backend() {
    docker compose logs -f backend
}

# Comando: logs-frontend
cmd_logs_frontend() {
    docker compose logs -f frontend
}

# Comando: ps
cmd_ps() {
    docker compose ps
}

# Comando: shell-backend
cmd_shell_backend() {
    log_info "Abriendo shell en backend..."
    docker compose exec backend sh
}

# Comando: shell-frontend
cmd_shell_frontend() {
    log_info "Abriendo shell en frontend..."
    docker compose exec frontend sh
}

# Comando: test-backend
cmd_test_backend() {
    log_info "Corriendo tests del backend..."
    docker compose exec -T backend npm test
}

# Comando: test-frontend
cmd_test_frontend() {
    log_info "Corriendo tests del frontend..."
    docker compose exec -T frontend npm test -- --ci --passWithNoTests
}

# Comando: lint-backend
cmd_lint_backend() {
    log_info "Corriendo linter del backend..."
    docker compose exec -T backend npm run lint
}

# Comando: lint-frontend
cmd_lint_frontend() {
    log_info "Corriendo linter del frontend..."
    docker compose exec -T frontend npm run lint
}

# Comando: health
cmd_health() {
    log_info "Verificando salud de servicios..."
    echo ""
    
    # Check backend
    if docker compose ps backend | grep -q "healthy\|running"; then
        log_success "Backend: Healthy"
        BACKEND_PORT=$(docker compose port backend 3000 | cut -d: -f2)
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
            log_success "Backend health endpoint: OK"
        else
            log_warning "Backend health endpoint: No responde"
        fi
    else
        log_error "Backend: Not running"
    fi
    
    echo ""
    
    # Check frontend
    if docker compose ps frontend | grep -q "healthy\|running"; then
        log_success "Frontend: Healthy"
        FRONTEND_PORT=$(docker compose port frontend 3000 | cut -d: -f2)
        if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null; then
            log_success "Frontend: OK"
        else
            log_warning "Frontend: No responde"
        fi
    else
        log_error "Frontend: Not running"
    fi
    
    echo ""
}

# Comando: clean
cmd_clean() {
    log_warning "Esto detendrá los servicios y eliminará volúmenes..."
    read -p "¿Continuar? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deteniendo y limpiando..."
        docker compose down -v
        log_success "Limpieza completada!"
    else
        log_info "Abortado."
    fi
}

# Comando: clean-all
cmd_clean_all() {
    log_error "Esto detendrá los servicios, eliminará volúmenes E IMÁGENES..."
    read -p "¿Estás seguro? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deteniendo y limpiando todo..."
        docker compose down -v --rmi all
        log_success "Limpieza total completada!"
    else
        log_info "Abortado."
    fi
}

# Comando: setup
cmd_setup() {
    log_info "Setup inicial del proyecto..."
    echo ""
    
    # Crear .env si no existe
    if [ ! -f .env ]; then
        log_warning ".env no encontrado, creando desde .env.example..."
        cp .env.example .env
        log_success ".env creado!"
        echo "⚠️  Edita .env con tus variables de configuración"
    else
        log_success ".env ya existe"
    fi
    
    echo ""
    
    # Construir imágenes
    log_info "Construyendo imágenes Docker..."
    docker compose build
    
    echo ""
    
    # Iniciar servicios
    log_info "Iniciando servicios..."
    docker compose up -d
    
    sleep 3
    
    echo ""
    cmd_health
    
    echo ""
    log_success "Setup completado! 🎉"
    echo ""
    echo "🌐 Acceso:"
    echo "  Frontend: http://localhost:3001"
    echo "  Backend:  http://localhost:3002"
}

# Main
main() {
    Command=${1:-help}
    
    case $Command in
        up)
            cmd_up
            ;;
        down)
            cmd_down
            ;;
        up-verbose)
            cmd_up_verbose
            ;;
        rebuild)
            cmd_rebuild
            ;;
        rebuild-nc)
            cmd_rebuild_nc
            ;;
        logs)
            cmd_logs
            ;;
        logs-backend)
            cmd_logs_backend
            ;;
        logs-frontend)
            cmd_logs_frontend
            ;;
        ps)
            cmd_ps
            ;;
        shell-backend)
            cmd_shell_backend
            ;;
        shell-frontend)
            cmd_shell_frontend
            ;;
        test-backend)
            cmd_test_backend
            ;;
        test-frontend)
            cmd_test_frontend
            ;;
        lint-backend)
            cmd_lint_backend
            ;;
        lint-frontend)
            cmd_lint_frontend
            ;;
        health)
            cmd_health
            ;;
        clean)
            cmd_clean
            ;;
        clean-all)
            cmd_clean_all
            ;;
        setup)
            cmd_setup
            ;;
        help | *)
            show_menu
            ;;
    esac
}

# Ejecutar
main "$@"
