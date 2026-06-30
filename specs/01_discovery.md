# Visión del Proyecto: Diagnóstico de Finca Café

## Resumen Ejecutivo

El programa Ubuntu Café (Codespa, San Adolfo, Huila) trabaja con caficultores jóvenes para mejorar la calidad de su producción. Antes de esta app, no existía ninguna herramienta estructurada que permitiera a un caficultor de San Adolfo medir sus propios indicadores de proceso (cosecha, beneficio, secado, trilla) contra referencias técnicas reconocidas (Cenicafé/FNC/SCA) y recibir recomendaciones concretas sobre qué cambiar y por qué.

**Diagnóstico de Finca Café** es la primera app del ecosistema Ubuntu. Permite que el caficultor, o el formador junto con él, complete un diagnóstico estructurado de finca, visualice semáforos comparativos contra rangos ideales, identifique plagas y defectos del grano con ayuda de catálogos técnicos, y descargue un informe completo en Word. Comparte backend y sistema de autenticación con `finanzas-cafeteros`, la segunda app del mismo ecosistema.

## Problema

### Situación Anterior

El diagnóstico de la finca cafetera en San Adolfo ocurría de forma manual: visitas del formador, conversaciones en campo, a veces registros en papel o WhatsApp. No había ningún instrumento que guiara al caficultor a recoger los mismos datos en cada cosecha, compararlos contra estándares, ni ver de forma visual en qué rangos estaba cada indicador.

### Pain Points

- Sin datos estructurados no es posible saber si el proceso mejora entre una cosecha y la siguiente.
- El caficultor no conoce los rangos ideales de Cenicafé/FNC/SCA (p.ej. fermentación 12-24h, humedad pergamino 10-12%) ni en qué punto exacto está él.
- Las recomendaciones técnicas (control de broca, manejo de roya, tiempo de fermentación) se dan de forma oral durante visitas y no quedan registradas ni vinculadas a los datos del diagnóstico.
- Sin un catálogo de plagas y enfermedades accesible desde el móvil, el caficultor no puede autoidentificar lo que observa en campo.
- La conexión intermitente en San Adolfo impide depender de herramientas que requieran internet constante.

### Coste del Problema

Según el análisis técnico de referencia (Cenicafé/FNC/SCA) del programa: el manejo del proceso (no la variedad) es el principal factor que impide pasar de <80 a 82-86 puntos SCA, diferencia que puede valer entre 0,20 y 0,50 USD/lb adicionales. Las mermas evitables en beneficio húmedo y trilla (varios puntos porcentuales) tienen el mismo origen: falta de datos y de retroalimentación estructurada.

## Solución Implementada

Una app mobile-first de diagnóstico estructurado que:
1. Guía al caficultor a través de un wizard de 13 pasos (secciones: Finca, Clima, Suelo, Cosecha, Plagas, Beneficio, Secado, Defectos café, Rendimiento, Calibre, Certificación, Sostenibilidad, Diagnóstico).
2. Compara cada indicador contra rangos ideales de Cenicafé/FNC/SCA con semáforos visuales (verde/amarillo/rojo).
3. Proporciona un catálogo técnico de 15 plagas y enfermedades (con síntomas, umbral de acción, control biológico/cultural y químico) y 7 defectos físicos del grano (estándar SCA).
4. Genera recomendaciones priorizadas (prioridad 1/2/3) por área.
5. Incluye una simulación económica de mermas para cuantificar el impacto en COP.
6. Descarga un informe completo en Word (.docx) generado en el navegador.
7. Guarda automáticamente cada cambio en el servidor y con respaldo local en `localStorage`.
8. Permite múltiples diagnósticos históricos por código, para poder comparar cosechas.

## Usuarios Objetivo

### Perfil Principal

**Caficultor joven de San Adolfo**, participante del proyecto Ubuntu/Codespa. Código de usuario SA-XX (p.ej. SA-01, SA-12). Completa el diagnóstico desde su móvil, en el propio terreno o en casa. Alfabetización digital variable; la app lo guía paso a paso con ayudas contextuales en cada campo. Conectividad limitada o intermitente (zona rural de montaña).

### Perfil Secundario

**Formador/consultor** (código FORM-SA o similar): acompaña al caficultor durante el diagnóstico y puede operar la app con él. Tiene acceso a los datos para revisarlos y, junto con el panel del formador en `plan-mejora-calidad-cafe`, dar seguimiento a las recomendaciones generadas.

## Contexto Ubuntu / Codespa / San Adolfo

El programa Ubuntu Café (operado por la ONG Codespa en San Adolfo, Huila) acompaña a jóvenes caficultores en el mejoramiento de la calidad del café. San Adolfo está entre 1.350 y 1.700 msnm; el régimen de lluvias es bimodal (aprox. 1.800-2.200 mm/año según la zona). La app identifica explícitamente esta localización en cabeceras y textos de ayuda.

Este proyecto forma parte de un ecosistema de tres apps que comparten backend:
- `diagnostico-finca-cafe` (esta app): datos de proceso de finca.
- `finanzas-cafeteros`: situación económica de la finca.
- `plan-mejora-calidad-cafe`: convierte las recomendaciones de diagnóstico en un plan de acción con responsable, plazo y seguimiento.

## Restricciones Identificadas desde el Inicio

- Conectividad de campo limitada: la app debe funcionar offline-tolerante (guardado local inmediato, reintento automático al recuperar conexión).
- Dispositivos gama media-baja con pantallas pequeñas: diseño mobile-first, botones de 44px mínimo, sin zoom automático en iOS.
- Sin presupuesto de desarrollo: stack sin costes adicionales (GitHub Pages + backend Railway ya pagado).
- Sin build step: un solo `index.html`, sin npm ni empaquetadores, para facilitar el mantenimiento.

## Criterios de Éxito

- El caficultor puede completar un diagnóstico completo sin asistencia técnica, solo con las ayudas de la propia app.
- Las recomendaciones generadas son correctas y están referenciadas a fuentes técnicas (Cenicafé, FNC, SCA).
- Los datos se guardan de forma fiable incluso con conexión intermitente.
- El formador puede usar el informe Word descargado en reuniones de comité de producción.
- Los diagnósticos históricos permiten comparar indicadores entre cosechas.
