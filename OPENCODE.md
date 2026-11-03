CONTEXTO DEL PROYECTO: GESTIÓN CONDOMINIO

Este repositorio es una aplicación web SaaS para la administración y operación de comunidades y condominios en Chile.
Se derivó del Starter Kit corporativo stage-auth-app y utiliza una arquitectura modular desacoplada.

Ficha Técnica del Entorno

Frontend: React 18, Vite 5, JavaScript estándar (ESM).

Backend: Supabase autohospedado en servidor Piave (http://100.126.211.117:8100).

Base de datos: PostgreSQL 15 con PostgREST, GoTrue (Auth) y Storage.

Contenedor en Staging: Podman rootless en servidor piave (IP Tailscale: 100.126.211.117:3002).

Servicio Host: Systemd Quadlet stage-stage-condominio-app.service.

Cómo interactuar con este proyecto

Revisa siempre .opencode/rules.md antes de generar o proponer código nuevo.

Consulta DOMAIN.md para entender las relaciones de base de datos de condominios.

Si generas scripts SQL, entrégalos en bloques idempotentes (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING) listos para el SQL Editor de Supabase.
