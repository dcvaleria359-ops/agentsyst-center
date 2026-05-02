# AGENTSYST — Blueprint detallado del Control Center v1

## 1. Objetivo real del panel
El panel de control interno de AGENTSYST no es:
- la web de captación
- el backend externo
- un CRM decorativo
- un dashboard genérico

El panel es el **motor interno de trabajo** donde un caso entra, se analiza, se convierte en propuesta, se demuestra, se cierra y, si el cliente aprueba, pasa a implementación real.

La misión del panel es permitir que AGENTSYST trabaje con orden, velocidad y criterio comercial-operativo.

Debe servir para:
- captar mejor
- analizar mejor
- proponer mejor
- demostrar mejor
- cerrar mejor
- implementar mejor

---

## 2. Principio rector del sistema
Todo empieza con un **caso**.

Ese caso puede entrar de dos formas:
1. por importación desde un lead captado
2. por creación manual desde el panel

Esto es obligatorio porque AGENTSYST no solo responde a lo que piden los leads. También detecta oportunidades y propone soluciones aunque el cliente no las haya solicitado explícitamente.

---

## 3. Lo que ya hemos implementado

## 3.1 Estructura base del panel
Ya existe una V1 del panel en el repo:
- `https://github.com/dcvaleria359-ops/agentsyst-center.git`

Se ha implementado una base navegable con:
- Resumen
- Casos
- Diagnóstico / fases intermedias del flujo anterior
- Producción / validación / entrega en distintas iteraciones
- Biblioteca
- Agentes

Después se corrigió el enfoque para que el panel deje de depender de ejemplos de relleno y pase a girar alrededor de **Nuevo caso**.

---

## 3.2 Nuevo caso como punto de entrada
Ya se implementó una lógica visual y de interfaz para que el panel empiece por:
- **Nuevo caso**

Y no por una tabla vieja con datos ficticios visibles.

Esto corrige un fallo importante del enfoque inicial.

---

## 3.3 Base funcional actual
A día de hoy existe:
- una V1 testeable
- un flujo base visible
- navegación interna
- fichas de caso
- estructura de agentes y fases como esqueleto
- repo remoto preparado
- despliegue conectado a Netlify por tu parte

Pero todavía **no existe el motor real funcionando con agentes obreros conectados**.

---

## 3.4 Documentación ya preparada
Ya se generaron documentos de trabajo previos en `reports/`, y este blueprint consolida el enfoque correcto tras la corrección de rumbo.

---

## 4. Qué NO está implementado todavía
Todavía falta la parte crítica del sistema:

### 4.1 Agentes reales
Aún no están creados de verdad:
- los agentes obreros
- sus funciones ejecutables
- sus inputs y outputs automáticos
- su conexión real al botón de pasar a la siguiente acción

### 4.2 Flujo automático real
Aún no existe:
- botón para lanzar agente
- ejecución real del agente
- entrega de output real al siguiente paso
- trazabilidad completa del encadenado

### 4.3 Persistencia real
Aún no existe:
- base de datos real
- guardado estable de casos
- estados persistentes
- historial persistente

### 4.4 Importación real desde captación
Aún no existe:
- importación real de ficha lead desde la web
- ingestión automática desde formularios
- asociación directa entre lead captado y nuevo caso del motor

### 4.5 Salidas descargables reales
Aún no existe todavía:
- informe de análisis generado de verdad
- briefing de soluciones generado de verdad
- propuesta visual descargable de verdad
- demo enlazada a un flujo real de trabajo

---

## 5. Flujo correcto del trabajo
Este es el flujo que debe regir el sistema.

## Fase 1 — Nuevo caso
### Qué es
Punto de entrada del motor.

### Cómo entra
- importando ficha de lead desde la web
- creando caso manualmente

### Datos mínimos
- empresa
- web
- sector
- origen
- petición o necesidad
- contacto
- prioridad
- notas

### Resultado esperado
- caso creado
- contexto mínimo listo
- preparado para activar análisis

### Acción clave
**Botón: Crear caso**

### Siguiente acción automática deseada
**Botón: Lanzar análisis**

---

## Fase 2 — Análisis del negocio
### Qué ocurre
Un agente analiza a fondo el negocio, no solo la petición del lead.

### Qué debe revisar
- web
- fallos UX/web
- posicionamiento
- redes sociales
- oportunidades de mejora
- posibles automatizaciones
- puntos de dolor
- huecos de captación
- huecos de atención
- huecos de seguimiento
- qué soluciones podría necesitar aunque no las haya pedido

### Resultado esperado
**Informe de análisis del negocio**

Debe incluir:
- dolores
- fallos
- oportunidades
- líneas de mejora
- áreas donde AGENTSYST puede aportar valor

### Acción clave
**Botón: Generar análisis**

### Siguiente acción automática deseada
**Botón: Generar soluciones propuestas**

---

## Fase 3 — Soluciones propuestas
### Qué ocurre
A partir del análisis, otro agente estructura qué soluciones se le deberían ofrecer al cliente.

### Qué debe hacer
- traducir análisis a soluciones
- pensar en amplio, no estrecho
- plantear opciones
- combinar soluciones
- estimar impacto
- estimar ahorro de tiempo
- estimar ahorro de dinero
- priorizar por valor

### Resultado esperado
**Briefing de soluciones**

Debe incluir:
- opción 1
- opción 2
- opción 3
- qué resuelve cada opción
- ahorro estimado
- valor comercial
- prioridad sugerida

### Acción clave
**Botón: Generar briefing de soluciones**

### Siguiente acción automática deseada
**Botón: Crear propuesta visual**

---

## Fase 4 — Propuesta visual
### Qué ocurre
Se convierte la solución en un material visual presentable al cliente.

### Qué debe contener
- explicación clara
- dolores detectados
- soluciones propuestas
- beneficios
- gráficos
- tablas
- before / after
- ahorro operativo
- mejora de captación
- mejora de atención
- mejora de eficiencia

### Regla comercial
No se habla de IA como centro del mensaje.
Se habla de:
- soluciones automatizadas
- eficiencia
- ahorro
- mejor atención
- mejor captación
- mejor experiencia de cliente

### Resultado esperado
**Documento visual descargable para cliente**

### Acción clave
**Botón: Generar propuesta visual**

### Siguiente acción automática deseada
**Botón: Preparar demo**

---

## Fase 5 — Demo preparada
### Qué ocurre
Se crea algo visible que el cliente pueda ver funcionando.

### Puede incluir
- landing demo
- flujo demo
- formulario demo
- WhatsApp demo
- email demo
- experiencia funcional básica

### Canales demo ya definidos
- WhatsApp demo: `+1 289 652 0531`
- Email demo: `agentsystdemo@gmail.com`

### Resultado esperado
**Demo funcional presentable**

### Acción clave
**Botón: Crear demo**

### Siguiente acción automática deseada
**Botón: Pasar a cierre**

---

## Fase 6 — Cierre
### Qué ocurre
Se consolida el interés, se aterriza el alcance y se prepara la implantación real.

### Qué debe pasar
- recoger feedback del cliente
- decidir qué opción compra
- cerrar alcance
- definir fases reales de implementación
- fijar entregables

### Resultado esperado
**Briefing final aprobado**

### Acción clave
**Botón: Cerrar solución**

### Siguiente acción automática deseada
**Botón: Pasar a implementación**

---

## Fase 7 — Implementación
### Qué ocurre
Se ejecuta la solución real ya aprobada.

### Puede incluir
- agentes finales del cliente
- integraciones
- automatizaciones
- frontend real
- backend real
- despliegue
- operación real

### Resultado esperado
**Sistema implementado para cliente**

### Acción clave
**Botón: Lanzar implementación**

---

## 6. Agentes que vamos a necesitar

## 6.1 Agente analista de negocio
### Fase
Nuevo caso / Análisis del negocio

### Función
Analizar el negocio en profundidad y detectar oportunidades reales.

### Input
- ficha del caso
- web
- sector
- petición
- contexto inicial

### Output
- informe de análisis del negocio

### Entrega a
Agente orquestador de soluciones

### Botón que lo activa
**Lanzar análisis**

---

## 6.2 Agente orquestador de soluciones
### Fase
Soluciones propuestas

### Función
Traducir el análisis en soluciones concretas, opciones y valor comercial.

### Input
- informe de análisis

### Output
- briefing de soluciones
- escenarios de propuesta
- ahorro estimado

### Entrega a
Agente diseñador de propuestas

### Botón que lo activa
**Generar soluciones propuestas**

---

## 6.3 Agente diseñador de propuestas
### Fase
Propuesta visual

### Función
Convertir el briefing en un material visual, elegante y entendible para cliente.

### Input
- briefing de soluciones

### Output
- propuesta visual descargable

### Entrega a
Agente creador de demo / landing

### Botón que lo activa
**Crear propuesta visual**

---

## 6.4 Agente creador de demo / landing
### Fase
Demo preparada

### Función
Construir una demo visible que capte atención y ayude al cierre.

### Input
- propuesta visual
- solución elegida
- canales demo

### Output
- landing demo
- flujo demo
- activos demo

### Entrega a
Agente de cierre de solución

### Botón que lo activa
**Preparar demo**

---

## 6.5 Agente de cierre de solución
### Fase
Cierre

### Función
Convertir la propuesta aprobada en alcance definitivo.

### Input
- feedback cliente
- demo presentada
- opción elegida

### Output
- briefing final aprobado
- alcance definitivo

### Entrega a
Agente de producción técnica

### Botón que lo activa
**Cerrar solución**

---

## 6.6 Agente de producción técnica
### Fase
Implementación

### Función
Ejecutar la solución real aprobada.

### Input
- briefing final
- alcance
- entregables

### Output
- sistema implementado

### Entrega a
producción/operación final del cliente

### Botón que lo activa
**Lanzar implementación**

---

## 7. Cómo deben ir conectados entre sí
La conexión correcta del motor debe ser lineal y accionable.

### Secuencia
1. Crear caso
2. Lanzar análisis
3. Generar soluciones propuestas
4. Crear propuesta visual
5. Preparar demo
6. Cerrar solución
7. Lanzar implementación

Cada fase debe tener:
- un agente owner
- un input claro
- un output claro
- un botón principal de acción
- una salida al siguiente agente

---

## 8. Automatización deseada con un click
La experiencia ideal del panel es esta:

### En cada caso
Val abre la ficha y ve:
- fase actual
- agente responsable
- output pendiente
- botón principal

### Al pulsar el botón
El sistema debe:
1. lanzar el agente correcto
2. generar el output
3. adjuntar el resultado al caso
4. actualizar el historial
5. marcar la fase como completada o en curso
6. habilitar la siguiente acción

Esto convierte el panel en una herramienta operativa real y no en un simple tablero visual.

---

## 9. Qué falta por implementar

## Parte producto / sistema
- validar el contenido exacto de cada output
- decidir qué campos son obligatorios por fase
- definir la estructura exacta de cada informe descargable
- definir si una fase puede volver atrás o no

## Parte agentes
- crear cada agente de verdad
- definir su prompt / misión / límites
- definir su output exacto
- definir el conector con el panel

## Parte técnica
- persistencia real
- importación real desde leads
- generación real de documentos
- guardado de outputs
- trazabilidad
- transición automática entre fases
- botones de acción reales

## Parte visual
- identidad visual AGENTSYST bien aplicada
- look premium
- menos dashboard genérico
- mejor claridad de lectura

---

## 10. Qué debe ser este panel cuando esté bien hecho
Debe ser:
- rápido
- claro
- accionable
- profesional
- escalable
- sin ruido
- sin pasos ambiguos
- con lenguaje de negocio
- con automatización progresiva real

Debe permitir que AGENTSYST funcione como una máquina:
- entra oportunidad
- se analiza
- se convierte en valor
- se presenta
- se cierra
- se implementa

---

## 11. Resumen ejecutivo final
### Ya implementado
- repo y base del panel
- V1 navegable
- entrada por Nuevo caso como enfoque
- esqueleto general del motor

### Falta implementar
- agentes reales
- outputs reales
- botones de acción reales
- persistencia
- importación real
- documentos reales
- automatización del paso al siguiente agente

### Prioridad inmediata
1. crear agentes obreros uno por uno
2. definir su función exacta
3. conectarlos a los botones por fase
4. hacer que el panel pase de maqueta navegable a motor ejecutable
