# AGENTSYST Center

Panel interno del motor operativo de AGENTSYST.

## Objetivo
Separar la captación externa del motor interno de trabajo.

La web y el backend de captación generan leads.
Este panel recibe los casos válidos y permite seguirlos por:
- fase
- agente interno
- output esperado
- bloqueos
- demo / entrega

## Stack
- React
- Vite
- TypeScript
- CSS propio

## Qué incluye esta V1
- Resumen ejecutivo del motor
- Pipeline visual por fases
- Casos activos del motor
- Diagnóstico
- Arquitectura
- Producción
- Validación
- Demo / Entrega
- Biblioteca
- Agentes internos AGENTSYST
- Fichas de caso, agente y entrega
- Navegación cruzada entre caso, agente y entrega
- Outputs obligatorios por fase

## Estructura
- `src/App.tsx` → shell principal y vistas
- `src/data.ts` → datos mock operativos del motor
- `src/types.ts` → tipados del sistema
- `src/App.css` → sistema visual

## Arranque
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Estado actual
V1 operativa como maqueta funcional del motor interno.
Aún no incluye:
- backend real
- persistencia real
- entrada automática desde captación
- edición viva de casos

## Siguiente evolución natural
1. persistencia y CRUD real
2. conexión con captación
3. automatización de handoffs
4. vistas de detalle más profundas
5. permisos y operación multiusuario
