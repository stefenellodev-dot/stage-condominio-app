# Auditorías e históricos

> **Estado:** índice verificado 2026-11-03. Los documentos históricos están **obsoletos** y no deben usarse para operar.

---

## 1. Documento canónico

La referencia vigente es:

- [auditoria_profunda_condominio_2026-11-03.md](../../auditoria_profunda_condominio_2026-11-03.md)

Contiene método, evidencia sanitizada, hallazgos P0–P3, plan de acción y criterios de aceptación. Es la fuente para priorizar y verificar cierres.

---

## 2. Históricos

| Documento | Fecha | Estado | Motivo |
|---|---|---|---|
| [manual-tecnico-2026-11-03.md](manual-tecnico-2026-11-03.md) | 2026-11-03 | **Obsoleto** | Describe `podman restart` como deploy, no cubre Studio/Inbucket/DB y contiene procedimientos incorrectos. JWT redactado. |
| [auditoria-2026-11-03-19-36-58.md](auditoria-2026-11-03-19-36-58.md) | 2026-11-03 | **Obsoleto** | Primera pasada; reemplazada por la auditoría canónica. |
| [auditoria-2026-11-03-19-39-41.md](auditoria-2026-11-03-19-39-41.md) | 2026-11-03 | **Obsoleto** | Segunda pasada; reemplazada por la auditoría canónica. |

Los históricos pueden conservar IPs internas como evidencia. No copiar esos valores a documentos nuevos ni a configuración. Cualquier token/credencial debe estar redactado.

---

## 3. Reglas

- No operar desde un documento marcado **Obsoleto**.
- No citar históricos como estado actual; usar la auditoría canónica y [../README.md](../README.md).
- Al agregar una auditoría nueva, actualizar este índice y la fecha de verificación.
- No incluir secretos, tokens, correos, UUID ni IPs completas en documentos nuevos.
