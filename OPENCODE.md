# Contexto del proyecto: Gestión Condominio

Este repositorio es una aplicación web para la administración de comunidades y condominios en Chile, derivada del Starter Kit corporativo `stage-auth-app`.

ESTADO

- Staging / no producción. Última verificación: 2026-11-03.
- No usar datos reales hasta cerrar los P0 de `auditoria_profunda_condominio_2026-11-03.md`.
- El dominio de condominio (comunidades, unidades, gastos) no está implementado; el placeholder actual es `InventoryModule`.

DOCUMENTACIÓN

- Índice y estado: `docs/README.md`.
- Arquitectura: `docs/architecture.md`.
- Seguridad y RLS: `docs/security.md`.
- Operación y deploy: `docs/operations.md` y `docs/runbook.md`.
- Dominio y esquema real: `docs/domain.md`.
- Frontend y deuda técnica: `docs/frontend.md`.
- Roadmap: `docs/roadmap.md`.
- Reglas para agentes: `.opencode/rules.md`.

ENTORNO

- Frontend: React 18, Vite 5, JavaScript ESM.
- Backend: Supabase self-hosted en Piave (Kong, GoTrue, PostgREST, Storage, PostgreSQL).
- Contenedor: Podman rootless; servicio systemd de usuario `stage-stage-condominio-app.service`.
- No hardcodear IPs, puertos de administración ni secretos en código o documentación.
- El deploy real usa la tarea de VS Code + `stage-cli deploy`; `podman restart` no aplica una imagen nueva.

CÓMO INTERACTUAR

1. Lee `.opencode/rules.md` antes de proponer o generar código.
2. Consulta `docs/domain.md` para el estado real y el modelo propuesto.
3. No modifiques las zonas congeladas sin una orden explícita; las correcciones de seguridad requieren aprobación y orden.
4. Entrega SQL como migraciones idempotentes y revisadas, no como parches sueltos en el SQL Editor.
