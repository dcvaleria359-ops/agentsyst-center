# PRODUCT_FLOW.md — Flujo real AgentSyst v1

## Propósito del panel

AgentSyst v1 **no es todavía una plataforma autónoma multiagente**.

Es un **centro de control operativo** para gestionar leads reales, convertirlos en casos, preparar diagnóstico, diseñar una solución, crear una demo funcional, preparar propuesta y contactar al cliente por WhatsApp.

El objetivo final **no es solo analizar**.

El objetivo final es llegar a:

> **Demo funcional + propuesta + contacto comercial.**

---

## Flujo principal AgentSyst v1

1. Lead nuevo
2. Caso abierto
3. Diagnóstico realizado
4. Solución propuesta
5. Demo preparada
6. Propuesta lista
7. WhatsApp enviado
8. Seguimiento
9. Ganado / Perdido / Dormido

---

## 1. Entrada del lead

El cliente puede entrar desde:

- formulario web
- WhatsApp
- email
- contacto manual

El panel debe guardar:

- nombre del negocio
- contacto
- WhatsApp/email
- web/redes
- tipo de negocio
- problema principal
- estado: **Lead nuevo**

### Objetivo de esta fase

No perder ningún posible cliente.

---

## 2. Convertir lead en caso

Cuando el lead parece interesante, se convierte en caso.

El panel debe crear una ficha con:

- datos del lead
- necesidad detectada
- fase actual
- notas internas
- historial
- próximos pasos

Estado: **Caso abierto**

### Objetivo de esta fase

Pasar de contacto suelto a oportunidad organizada.

---

## 3. Diagnóstico del negocio

Aquí se analiza el caso.

No hace falta que sea automático al principio. Puede ser asistido por IA.

Se revisa:

- web actual
- redes
- oferta
- puntos débiles
- problemas de captación
- tareas repetitivas
- oportunidades de automatización
- qué solución AgentSyst puede proponer

El panel debe permitir:

- copiar briefing para IA
- guardar diagnóstico
- guardar oportunidades
- guardar recomendaciones
- guardar fuentes/enlaces

Estado: **Diagnóstico realizado**

### Objetivo de esta fase

Entender qué necesita realmente el cliente antes de venderle nada.

---

## 4. Diseño de solución

Aquí se define qué sistema se va a proponer al cliente.

Ejemplo para peluquería:

- asistente WhatsApp
- recuperación de citas perdidas
- recordatorios automáticos
- formulario de captación
- mini landing
- seguimiento de clientes
- resumen diario de agenda/leads

El panel debe guardar:

- solución propuesta
- módulos incluidos
- precio estimado
- dificultad
- herramientas necesarias
- próximos pasos

Estado: **Solución propuesta**

### Objetivo de esta fase

Pasar de diagnóstico a oferta concreta.

---

## 5. Crear demo funcional

Esta fase es clave.

No basta con decir: “podemos automatizarte esto”.

Hay que mostrar algo.

La demo puede ser:

- mini web nueva
- landing simple
- formulario conectado
- botones de WhatsApp
- ejemplo de asistente
- flujo visual
- simulación de chatbot
- pantalla de agenda
- ejemplo de mensaje automático
- ejemplo de informe diario

El panel debe tener una sección:

> **Demo del caso**

Con:

- enlace a la demo
- estado de la demo: pendiente / en creación / lista
- descripción de qué muestra
- capturas o notas
- prompt usado
- herramienta usada: Claude, GPT, v0, Figma, Lovable, Replit, etc.

Estado: **Demo preparada**

### Objetivo de esta fase

Que el cliente vea algo concreto y no solo una promesa.

---

## 6. Preparar propuesta comercial

Cuando la demo está lista, se prepara la propuesta.

Debe incluir:

- problema detectado
- solución recomendada
- qué incluye
- qué verá el cliente en la demo
- precio o rango
- plazo estimado
- próximos pasos
- llamada a acción

El panel debe guardar:

- propuesta escrita
- versión corta para WhatsApp
- versión email/PDF si hace falta
- enlace demo
- estado: pendiente / enviada / aceptada / rechazada

Estado: **Propuesta lista**

### Objetivo de esta fase

Tener una oferta presentable, no improvisada.

---

## 7. Contactar por WhatsApp

Esta es la entrega comercial inicial.

El contacto debe ser muy simple:

- recordar quién soy
- decir que revisé su caso
- mencionar el problema detectado
- enviar enlace/demo
- proponer una llamada o respuesta rápida

El panel debe tener botón/campo para:

- mensaje WhatsApp
- copiar mensaje
- fecha de contacto
- estado de seguimiento

Estado: **Contactado**

### Objetivo de esta fase

Abrir conversación comercial con algo tangible.

---

## 8. Seguimiento

Si no responde:

- seguimiento 24/48h
- segundo mensaje más breve
- nota interna
- marcar interés
- cerrar si no responde

El panel debe guardar:

- fecha último contacto
- siguiente acción
- respuesta cliente
- estado comercial

Estados posibles:

- Contactado
- Interesado
- Reunión agendada
- Propuesta enviada
- Ganado
- Perdido
- Dormido

### Objetivo de esta fase

No dejar oportunidades abandonadas.

---

## Regla estratégica

AgentSyst v1 debe permitir trabajar aunque los agentes automáticos no estén conectados.

Los agentes automáticos son fase futura.

La v1 debe funcionar como **mesa de trabajo asistida por IA**:

- copiar briefing
- usar GPT / Claude / DeepSeek / Gemini / Qwen según convenga
- pegar resultados
- guardar historial
- avanzar fases
- preparar demo
- contactar cliente

---

## Regla sobre modelos de IA

No todo debe pasar por Claude.

El panel debe permitir trabajar con distintas IAs según la tarea:

- GPT para estrategia, síntesis, análisis comercial y propuestas
- Claude para código, documentos largos, estructura y revisión técnica
- DeepSeek para razonamiento barato o análisis preliminar
- Qwen/modelos coder para tareas técnicas/código
- Gemini para análisis multimodal, documentos y Drive si conviene

AgentSyst no debe depender de un único modelo.

---

## Regla de producto

No construir funciones que no ayuden a llegar a:

> **Demo funcional + propuesta + WhatsApp.**

Ese es el criterio de utilidad de la v1.

---

## Regla para Claude / Dev

Antes de modificar el panel, leer siempre este documento.

El panel debe respetar el flujo real AgentSyst v1:

> Lead → Caso → Diagnóstico → Solución → Demo → Propuesta → WhatsApp → Seguimiento

No priorizar agentes automáticos si bloquean este flujo.

La v1 debe permitir trabajo manual/asistido por IA y entrega comercial real.
