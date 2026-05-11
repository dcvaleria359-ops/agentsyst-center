# CLAUDE.md — Agentsyst Center

## Documento de producto obligatorio

Antes de modificar el panel, leer siempre `PRODUCT_FLOW.md` en la raíz del repo.

El panel debe respetar el flujo real AgentSyst v1:

> Lead → Caso → Diagnóstico → Solución → Demo → Propuesta → WhatsApp → Seguimiento

Reglas que derivan de ese documento:

- La v1 no depende de agentes automáticos. Los agentes automáticos son fase futura.
- La v1 debe funcionar como mesa de trabajo asistida por IA: copiar briefings, pegar resultados, guardar historial, avanzar fases, preparar demo, contactar al cliente.
- El criterio de utilidad de cualquier función nueva es: ¿ayuda a llegar a demo funcional + propuesta + WhatsApp? Si no, no es v1.
- La prioridad es que el panel permita trabajar casos reales, preparar una demo funcional, una propuesta y el contacto comercial.

## Qué es este repo

Panel interno de operaciones de AGENTSYST. **No es la web pública** — agentsyst.ai está en otro repo.
Gestiona leads reales, casos, fases, agentes y diagnósticos del motor Agentsyst.

## Stack

- React 19 + TypeScript ~6.0 + Vite 8
- CSS propio (`App.css`) — sin Tailwind, sin librerías de componentes UI
- Supabase JS `^2.105.1` — lectura directa de leads desde el frontend con la anon key
- Backend en VPS Hostinger (Node.js) — no está en este repo
- Hosting: Netlify (frontend) + VPS gestionado externamente (API)

## Arquitectura de datos

Los leads se leen directamente desde Supabase tabla `public.leads` usando la anon key del frontend.

Los casos y el estado de los agentes se obtienen del VPS a través de `/api`, que en producción Netlify redirige según `public/_redirects`, y en desarrollo Vite proxea a `localhost:3001`.

Operaciones activas contra el VPS:
- Convertir lead en caso → `POST /api/cases` con `{ lead_id }`
- Ejecutar Agente 1 (analista) → `POST /api/cases/:id/run-agent-1`
- Leer casos activos → `GET /api/cases`
- Leer estado de agentes → `GET /api/agents/status`

## Comandos

```bash
npm install
npm run dev      # servidor en :5173, /api proxeado a localhost:3001
npm run build    # tsc -b && vite build
npm run lint
npm run preview
```

## Archivos críticos

- `src/data.ts` — URL y anon key de Supabase hardcoded, más `API_BASE`. No modificar los valores sin preguntar.
- `public/_redirects` — proxy Netlify hacia el VPS real en producción. La IP del VPS solo aparece aquí; no replicarla en otros archivos.
- `vite.config.ts` — proxy de desarrollo `/api` → `localhost:3001`.
- `src/types.ts` — contrato de datos sincronizado con Supabase (`LeadItem`) y con el VPS (`CaseItem`, `AgentItem`). Cualquier cambio puede romper la integración.
- `src/App.tsx` — shell principal y todas las vistas en un solo archivo (~566 líneas).

## Variables de entorno

Actualmente no hay variables de entorno. Los valores están hardcoded en `src/data.ts`. Los nombres canónicos para cuando se migren son:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE`

No crear archivos `.env` ni mover estos valores sin confirmación explícita del usuario.

## Datos reales — regla crítica

Este proyecto opera con datos reales de clientes en producción.

**No crear, modificar ni borrar leads, casos ni registros de Supabase sin confirmación explícita del usuario**, aunque sea para pruebas o depuración.

Cualquier acción que afecte datos reales debe ser solicitada directamente y con intención clara.

## NO tocar sin preguntar

- `public/_redirects` — cualquier cambio corta todas las llamadas al backend en producción
- `src/data.ts` (las constantes de Supabase) — apuntan a la base de datos real con leads de clientes
- La tabla `public.leads` en Supabase — datos reales del formulario público, ya en producción
- `src/types.ts` — schema sincronizado con Supabase y el VPS; romperlo rompe la integración
- Las rutas del VPS (`/api/cases`, `/api/agents/status`, etc.) — el frontend las llama directamente
- El backend VPS Hostinger — fuera del alcance de este repo; no intentar modificarlo desde aquí
- Despliegues en Netlify — confirmar siempre antes de hacer push a main

## Convenciones

- CSS propio — no introducir Tailwind ni librerías de componentes sin acordarlo primero
- No añadir dependencias nuevas sin justificación explícita
- Lógica de UI en `App.tsx` hasta que se decida refactorizar en componentes separados
- Español en UI y mensajes de error visibles; inglés en código, tipos y nombres de variables

## Estado actual (mayo 2026)

Conectado y funcionando:
- Leads en tiempo real desde Supabase
- Conversión de lead a caso via VPS
- Agente 1 (analista de negocio) ejecutable desde el panel

Pendiente de conexión:
- Agente 2 (orquestador de soluciones) — botón visible pero deshabilitado
- Vistas de diagnóstico, propuesta visual y demo
- Migración de credenciales hardcoded a variables de entorno
