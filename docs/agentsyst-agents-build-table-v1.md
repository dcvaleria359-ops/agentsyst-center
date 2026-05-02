# AGENTSYST — Tabla exacta de agentes v1 lista para construir

## Objetivo
Definir uno por uno los agentes obreros del motor interno AGENTSYST para que puedan construirse, conectarse al panel y encadenarse entre sí con acciones claras.

---

## Tabla maestra

| Orden | Agente | Fase donde opera | Se activa con | Input principal | Trabajo que realiza | Output exacto | Entrega a | Botón siguiente |
|---|---|---|---|---|---|---|---|---|
| 1 | Agente analista de negocio | Nuevo caso / Análisis del negocio | Lanzar análisis | Ficha del caso, web, sector, petición, notas | Analiza el negocio a fondo, detecta fallos, oportunidades, mejoras y soluciones potenciales | Informe de análisis del negocio | Agente orquestador de soluciones | Generar soluciones propuestas |
| 2 | Agente orquestador de soluciones | Soluciones propuestas | Generar soluciones propuestas | Informe de análisis del negocio | Convierte el análisis en opciones de solución, escenarios, ahorro estimado y valor comercial | Briefing de soluciones | Agente diseñador de propuestas | Crear propuesta visual |
| 3 | Agente diseñador de propuestas | Propuesta visual | Crear propuesta visual | Briefing de soluciones | Genera un documento claro, elegante y visual para cliente con problemas, soluciones, beneficios y comparativas | Propuesta visual descargable | Agente creador de demo / landing | Preparar demo |
| 4 | Agente creador de demo / landing | Demo preparada | Preparar demo | Propuesta visual, solución seleccionada, canales demo | Construye una demo visible: landing, formulario, flujo demo, assets demo | Demo funcional presentable | Agente de cierre de solución | Pasar a cierre |
| 5 | Agente de cierre de solución | Cierre | Pasar a cierre | Demo presentada, feedback, opción elegida | Cierra alcance, consolida lo aprobado y prepara el briefing definitivo | Briefing final aprobado | Agente de producción técnica | Lanzar implementación |
| 6 | Agente de producción técnica | Implementación | Lanzar implementación | Briefing final, alcance, entregables | Ejecuta la solución real: sistema final, integraciones, automatizaciones, despliegue | Sistema implementado | Operación / entrega final | Cerrar implementación |

---

## Detalle agente por agente

## 1. Agente analista de negocio
### Misión
Entender el negocio bajo todos sus ángulos y detectar oportunidades reales de mejora.

### Qué debe revisar
- web actual
- fallos de la web
- claridad comercial
- redes sociales
- oportunidades no solicitadas explícitamente
- fricciones de captación
- fricciones de atención
- fricciones de seguimiento

### Input
- empresa
- web
- sector
- petición
- notas
- origen del caso

### Output exacto
**Informe de análisis del negocio** con:
- problemas detectados
- oportunidades detectadas
- mejoras sugeridas
- áreas donde AGENTSYST puede aportar valor

### Condición de terminado
El informe debe ser descargable y suficientemente claro para pasar a soluciones.

### Pasa a
Agente orquestador de soluciones

---

## 2. Agente orquestador de soluciones
### Misión
Traducir el análisis en propuestas concretas que AGENTSYST pueda ofrecer.

### Qué debe hacer
- convertir hallazgos en soluciones
- pensar varias opciones
- combinar soluciones
- estimar impacto
- estimar ahorro de tiempo
- estimar ahorro de dinero
- ordenar por prioridad

### Input
- informe de análisis del negocio

### Output exacto
**Briefing de soluciones** con:
- opción 1
- opción 2
- opción 3
- qué resuelve cada una
- valor estimado
- ahorro estimado
- recomendación final

### Condición de terminado
Val debe poder revisar opciones y elegir qué línea pasa a propuesta visual.

### Pasa a
Agente diseñador de propuestas

---

## 3. Agente diseñador de propuestas
### Misión
Crear el documento visual y comercial que el cliente verá.

### Reglas de lenguaje
No centrar el mensaje en IA.
Hablar de:
- automatización
- eficiencia
- ahorro
- mejora de experiencia
- mejora de atención
- mejora de captación

### Input
- briefing de soluciones

### Output exacto
**Propuesta visual descargable** con:
- dolores del negocio
- solución propuesta
- beneficios
- tablas
- gráficos
- comparativas
- explicación clara

### Condición de terminado
Debe ser suficientemente elegante y comprensible para mandarla o usarla en reunión.

### Pasa a
Agente creador de demo / landing

---

## 4. Agente creador de demo / landing
### Misión
Construir una demo visible que haga tangible la propuesta.

### Input
- propuesta visual
- solución elegida
- canales demo

### Canales demo activos
- WhatsApp demo: +1 289 652 0531
- Email demo: agentsystdemo@gmail.com

### Output exacto
**Demo funcional presentable** que puede incluir:
- landing demo
- formulario demo
- flujo demo
- contacto a canales demo

### Condición de terminado
Val debe poder enseñar algo real y atractivo al cliente.

### Pasa a
Agente de cierre de solución

---

## 5. Agente de cierre de solución
### Misión
Cerrar lo que el cliente acepta y transformarlo en alcance definitivo.

### Input
- demo
- feedback cliente
- opción seleccionada

### Output exacto
**Briefing final aprobado** con:
- solución elegida
- alcance
- prioridades
- entregables
- puntos de implementación

### Condición de terminado
Debe quedar claro qué se va a construir y qué no.

### Pasa a
Agente de producción técnica

---

## 6. Agente de producción técnica
### Misión
Implementar la solución real aprobada.

### Input
- briefing final
- alcance
- entregables

### Output exacto
**Sistema implementado** que puede incluir:
- automatizaciones
- agentes finales del cliente
- integraciones
- frontend real
- backend real
- despliegue

### Condición de terminado
La solución debe pasar de propuesta a sistema funcional real.

### Pasa a
Entrega / operación final del cliente

---

## Conexión exacta entre agentes
1. Crear caso
2. Lanzar análisis → Agente analista de negocio
3. Generar soluciones propuestas → Agente orquestador de soluciones
4. Crear propuesta visual → Agente diseñador de propuestas
5. Preparar demo → Agente creador de demo / landing
6. Pasar a cierre → Agente de cierre de solución
7. Lanzar implementación → Agente de producción técnica

---

## Qué debe existir en el panel para soportarlos
Para cada caso:
- fase actual
- agente actual
- botón principal de acción
- output generado
- historial
- bloqueo
- siguiente acción

Para cada agente:
- misión
- input
- output
- estado
- casos que tiene asignados
- botón de lanzamiento desde la fase correcta

---

## Orden recomendado de construcción
1. Agente analista de negocio
2. Agente orquestador de soluciones
3. Agente diseñador de propuestas
4. Agente creador de demo / landing
5. Agente de cierre de solución
6. Agente de producción técnica

Este orden permite testear el motor de punta a punta lo antes posible.
