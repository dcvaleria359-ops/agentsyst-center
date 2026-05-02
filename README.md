# AGENTSYST Internal Panel

Base frontend inicial del panel interno de AGENTSYST.

## Stack
- React
- Vite
- TypeScript
- CSS propio, sin backend

## Qué incluye esta V1
- shell de backoffice operativo
- sidebar con 7 módulos
- vistas de Resumen, Leads, Clientes, Agentes, Operaciones, Biblioteca y Configuración
- datos mock tipados en local
- diseño sobrio orientado a operación

## Estructura
- `src/App.tsx` → shell principal y vistas
- `src/data.ts` → datos mock del sistema
- `src/types.ts` → tipados base
- `src/App.css` → sistema visual del panel

## Arranque
```bash
npm install
npm run dev
```

## Validación
```bash
npm run build
```

## Siguientes pasos recomendados
1. conectar el diseño con los documentos maestros del Drive
2. fijar el esquema real de entidades y estados
3. separar vistas en componentes por módulo
4. añadir filtros, búsqueda real y fichas de detalle
5. conectar backend/persistencia cuando el modelo operativo esté cerrado
