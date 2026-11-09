# Especificación de Arquitectura de Datos y Seguridad (Ley N° 21.442)
**Última actualización confirmada en servidor Piave:** 2026-11-09 15:46:53

---

## 1. Topología del Sistema y Mapa de Red en Piave

```
[ Cliente / Navegador ]
        │
        ├──> http://100.126.211.117:3002 (Frontend SPA React / Nginx en contenedor)
        │
        └──> http://100.126.211.117:8200 (API Gateway Kong en Piave)
                    │
                    ├── /auth/v1/    ──> condo-sb-auth    (:9999)
                    ├── /rest/v1/    ──> condo-sb-rest    (:3000)
                    └── /storage/v1/ ──> condo-sb-storage (:5000)
                               │
                               ▼
                 [ PostgreSQL: condo-sb-db :5432 ]
```

---

## 2. Diccionario de Datos Relacional (PostgreSQL en Piave)



---

## 3. Relaciones y Llaves Foráneas Verificadas
| Tabla Origen | Columna | Tabla Destino | Columna Destino |
| :--- | :--- | :--- | :--- |


---

## 4. Triggers y Funciones de Negocio Activas en Piave
| Tabla | Nombre del Trigger | Momento | Evento |
| :--- | :--- | :--- | :--- |


---

## 5. Matriz de Políticas RLS (Row Level Security)
| Tabla | Política | Comando | Roles Autorizados |
| :--- | :--- | :--- | :--- |

