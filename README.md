# Condominio App

Aplicación web para la administración de condominios en Chile. Frontend React/Vite con Supabase self-hosted.

> **Estado:** staging / no producción. **Última verificación:** 2026-11-04.
>
> **No usar con datos reales** hasta cerrar los P0 de la [auditoría profunda](auditoria_profunda_condominio_2026-11-03.md): autoascenso a `superadmin`, inyección de rol en signup, Inbucket sin autenticación y Studio expuesto.

---

## Inicio rápido

```bash
npm install
cp .env.example .env
# Editar .env con la URL y la anon key del entorno staging.
# El .env.example actual está desactualizado; no usar sus valores tal cual.
npm run dev
```

Scripts disponibles:

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar el build |

No hay tests, lint ni CI configurados.

---

## Despliegue

El despliegue real es: tarea de VS Code `Deploy to Piave Staging` -> `rsync` -> `stage-cli deploy` -> `podman build` -> `systemctl --user restart`.

`podman restart` **no** aplica una imagen nueva. Ver [docs/operations.md](docs/operations.md) y [docs/runbook.md](docs/runbook.md).

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/README.md](docs/README.md) | Índice, estado y convenciones |
| [docs/architecture.md](docs/architecture.md) | Componentes, auth, límites de confianza |
| [docs/security.md](docs/security.md) | RLS, amenazas, controles objetivo |
| [docs/operations.md](docs/operations.md) | Puertos, deploy, backups, secretos |
| [docs/runbook.md](docs/runbook.md) | 502, superadmin, restore, rollback |
| [docs/domain.md](docs/domain.md) | Esquema real y modelo propuesto |
| [docs/frontend.md](docs/frontend.md) | Componentes, roles, deuda técnica |
| [docs/roadmap.md](docs/roadmap.md) | Brechas P0–P3 y criterios de aceptación |
| [docs/audits/README.md](docs/audits/README.md) | Históricos obsoletos |

Reglas para agentes y desarrolladores: [.opencode/rules.md](.opencode/rules.md).

---

## Estructura

```text
src/
├── components/
│   ├── auth/          # Login, registro, OTP, recuperación
│   ├── business/      # Módulos de negocio
│   ├── dashboard/     # Perfil y administración
│   └── layout/        # Layout y navegación
├── config/            # Branding y registro de módulos
├── context/           # Auth, i18n, toasts
├── lib/               # Supabase, roles, RUT
├── locales/           # es / en
└── styles/            # Tokens y tema
```

El esquema actual solo contiene `profiles`, `regions` y `communes`; el dominio de condominio está propuesto en [docs/domain.md](docs/domain.md).
