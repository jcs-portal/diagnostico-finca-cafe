# Especificación de Producto: Diagnóstico de Finca Café

## Alcance Funcional (estado actual — en producción)

### Funcionalidades Implementadas

| ID | Funcionalidad | Descripción |
|----|---------------|-------------|
| F1 | Login con código | Pantalla de entrada con código SA-XX (campo de texto, mayúsculas automáticas) y contraseña opcional. Llama a `GET /api/whoami`. El código se persiste en `localStorage` con clave `dfc_code`; la contraseña con `dfc_password`. Admite `?code=SA-XX` en la URL para prellenar el campo. |
| F2 | Gestión de múltiples diagnósticos | Pantalla de lista (`ListaDiagnosticos`) ordenada de mayor a menor número. Cada tarjeta muestra número, nombre de finca, fecha de actualización, y valores clave (% rojos, SCA). Botones: Ver/Editar, Word, Borrar. Botón "Nuevo diagnóstico" llama a `POST /api/diagnostico` y abre el wizard. |
| F3 | Wizard de diagnóstico (13 pasos) | Guía paso a paso con barra de progreso y pestañas clickables para volver a pasos ya visitados. El orden de las secciones es: Finca → Clima → Suelo → Cosecha → Plagas → Beneficio → Secado → Defectos café → Rendimiento → Calibre → Certificación → Sostenibilidad → Diagnóstico. |
| F4 | Semáforos comparativos | Cada indicador numérico se compara contra su rango ideal (objeto `REF`, fuentes Cenicafé/FNC/SCA). El semáforo devuelve `ok`, `warn` (±25% del rango), o `alert` (fuera del margen). Se visualiza como barra horizontal con zona verde de referencia y marcador del valor actual. |
| F5 | Catálogo de plagas (15 entradas) | Tarjetas expandibles con checkbox de "observado", organizadas en categorías filtrables (Todas / Insectos / Enfermedades / Nematodos / Ácaros). Cada tarjeta muestra: nombre científico, descripción, síntomas, umbral de acción, control biológico/cultural (máx. 4 ítems), y fuentes Cenicafé/FNC. |
| F6 | Catálogo de defectos del grano (7 entradas) | Tarjetas expandibles con checkbox. Defectos Grado 1 (descalifican para especial): grano negro, agrio/vinagre, cardenillo. Defectos Grado 2 (penalizan): partido/cortado, inmaduro/verde, brocado, averanado. Cada tarjeta muestra descripción visual, causa probable y consecuencia con el estándar SCA. |
| F7 | Calculadora de factor de rendimiento | Modo "muestra": el caficultor introduce peso de la muestra de pergamino seco, cascarilla, pasilla y excelso; la app calcula automáticamente `mermaTrilla` y `pctPasilla` (actualizados en tiempo real al cambiar cualquier campo). Modo "directo": introduce los porcentajes que le da el trillador. |
| F8 | Certificaciones y verificación | Checklist de 7 esquemas de certificación (Rainforest Alliance, Fairtrade, Orgánico, 4C, Denominación de Origen FNC, Acuerdo Café/Bosque/Clima, C.A.F.E. Practices) y 5 criterios básicos de verificación (no deforestación, no trabajo infantil, registro de agroquímicos, protección de trabajadores, respeto zonas de protección). |
| F9 | Prácticas sostenibles | Checklist de 10 prácticas (agroforestería, no deforestación, protección de fuentes de agua, compostaje, no quemas, MIP, envases agroquímicos, energía renovable, conservación de suelos, asociatividad). |
| F10 | Generación de recomendaciones priorizadas | Función `generarRecomendaciones(d)` que evalúa todos los indicadores y genera hasta ~20 recomendaciones con prioridad 1 (alta, rojo), 2 (media, amarillo) o 3 (mantener, verde), área y texto explicativo con el impacto esperado. Se ordenan de mayor a menor prioridad. |
| F11 | Simulación económica de mermas | En la sección final del diagnóstico: calcula ingreso ideal (todo a precio FNC de referencia, obtenido de `GET /api/benchmark`) vs. ingreso real considerando % de pasilla y el precio menor que esta recibe. Muestra merma en COP y porcentaje. |
| F12 | Descarga de informe Word | Función `descargarWordDiagnostico(d, code)` que genera un `.docx` en el navegador usando la librería `docx` por CDN (unpkg, v9.7.1). Incluye: encabezado con código/vereda/altitud, indicadores con rango ideal, defectos y calibre, suelo y clima, plagas observadas, certificaciones, prácticas sostenibles, recomendaciones priorizadas, y simulación económica. Nombre del archivo: `diagnostico-{code}-{numero}.docx`. |
| F13 | Autoguardado con offline-tolerancia | Cada cambio de dato escribe inmediatamente en `localStorage` (clave `dfc_draft_${entrada.id}`) y lanza un `PUT /api/diagnostico/${id}` con debounce de 700ms. Si el PUT falla, `errorGuardado` se pone a `true` y se muestra el aviso "⚠ Sin conexión — guardado solo en este dispositivo". Al recuperar la red (`window online`), se reintenta el PUT automáticamente. Al completarse con éxito, se borra el draft de `localStorage`. |
| F14 | Sincronización Ficha de Productor | Al abrir un diagnóstico nuevo (sin nombre/vereda/altitud/variedad/hectareas), se precarga desde `GET /api/finca`. Los cambios en esos campos sincronizan de vuelta a `/api/finca` con debounce de 900ms, para que el dato esté disponible en `finanzas-cafeteros` y `plan-mejora-calidad-cafe`. |
| F15 | Cambio de contraseña | Función `cambiarPassword(code)`: llama a `PUT /api/password` con la contraseña actual y la nueva. Accesible desde el header con el enlace "🔑 Contraseña". |

## Wizard: Detalle de Secciones

### Paso 0 — Finca
Campos: nombre de la finca (texto), vereda (texto), altitud en msnm (numérico, 800-2500, ayuda con rango de San Adolfo), variedad principal (texto), hectáreas en café (decimal). Semáforo de altitud visible si el campo está relleno.

### Paso 1 — Clima
Temperatura promedio anual (°C, ideal 18-22), precipitación anual (mm, ideal 1500-3000, ayuda con estimado de San Adolfo: 1.800-2.200 mm/año), régimen de lluvias (botones: Bimodal / Monomodal / No estoy seguro), meses secos consecutivos (numérico, ideal 0-4), humedad relativa ambiental (%, ideal 60-70). Bloque de semáforos de los 4 indicadores numéricos.

### Paso 2 — Suelo
Tipo de suelo (botones: Arcilloso / Franco / Franco-arcilloso / Franco-arenoso / Arenoso / No sé), pH del suelo (decimal, ideal 5,0-5,5, solo si tiene análisis), humedad del suelo habitual (botones: ☀️ Seco / 💧 Húmedo / 🌊 Encharcado). Subsección sombra: % de sombra (botones: sin sombra / rala 10-20% / media 20-40% / densa +40%), especies de sombra (texto libre opcional). Semáforo de pH si se introdujo.

### Paso 3 — Cosecha
Tip contextual sobre cómo medir el % de frutos rojos. % de frutos rojos (botones: ~70% / ~80% / ~85% / ~90% / ~95% / +99%, ideal ≥95%). Puntaje SCA (decimal, 60-100, opcional si no se ha catado). Semáforos de ambos indicadores.

### Paso 4 — Plagas y enfermedades
`CatalogoPlagas`: filtro por tipo + 15 tarjetas expandibles. Campo de notas adicionales (textarea).

### Paso 5 — Beneficio húmedo
Tiempo de fermentación (botones: 8h / 10h / 12h / 16h / 20h / 24h / 30h / +36h, ideal 12-24h). Relación conversión cereza→pergamino (decimal, ideal 4,5-5,5:1, con ayuda de cómo calcularlo). Semáforos de ambos indicadores.

### Paso 6 — Secado y almacenamiento
Tip sobre cómo estimar la humedad sin medidor. Humedad del pergamino seco (botones: 8% a +18%, ideal 10-12%). Humedad relativa de la bodega (numérico %, ideal 60-70%). Semáforos de ambos indicadores.

### Paso 7 — Defectos café
Contexto: el catador profesional distingue ~20 categorías; aquí se agrupan 8 de las más frecuentes. Banner con el estándar SCA (≥80 pts, Grado 1: CERO, Grado 2: máx. 5 por 300 g). `CatalogoDefectos`: filtro por grado + 7 tarjetas expandibles.

### Paso 8 — Rendimiento
Selector de método: "Mido una muestra yo mismo" (calculadora con 4 campos de peso) o "Ya tengo el % del trillador" (entradas directas de merma y pasilla). Semáforos de factor de rendimiento, merma en trilla y % pasilla.

### Paso 9 — Calibre
Selector de tamaño de grano por malla (botones: No pasa malla 14 / Malla 15-16 Excelso / Malla 17-18 Supremo / No tengo zarandas / no sé).

### Paso 10 — Certificación y verificación
Checklist de 7 certificaciones + 5 criterios de verificación + textarea de notas.

### Paso 11 — Producción sostenible
Checklist de 10 prácticas sostenibles + textarea de notas.

### Paso 12 — Diagnóstico (pantalla final)
- Encabezado con nombre de finca, vereda y altitud.
- Botón "Descargar informe" (Word).
- Bloque "Resumen de indicadores" con todos los semáforos.
- Bloque "Defectos del grano y calibre" (si hay datos).
- Bloque "Suelo y clima" (si hay datos).
- Bloque "Fitosanitario observado" (si hay plagas marcadas).
- Bloque "Certificación y verificación" (si hay datos).
- Bloque "Producción sostenible" (si hay datos).
- Listado de recomendaciones priorizadas ordenadas por prioridad.
- Simulación económica de mermas (con campos editables de kg totales y % precio pasilla).
- Botón "Descargar este diagnóstico en Word" (segundo acceso al mismo).

## Lógica de Recomendaciones

La función `generarRecomendaciones(d)` analiza los indicadores y genera recomendaciones con esta lógica:

| Campo analizado | Trigger | Prioridad |
|-----------------|---------|-----------|
| % frutos rojos | <95% en alert | 1 |
| % frutos rojos | warn | 2 |
| Fermentación | <12h en alert | 1 |
| Fermentación | >24h en alert | 1 |
| Humedad pergamino | >12% en alert | 1 |
| Humedad pergamino | <10% en alert | 2 |
| Relación cereza | >5,5:1 en alert | 2 |
| Merma trilla | >20% en alert | 2 |
| % pasilla | en alert | 2 |
| Defectos Grado 1 presentes | cualquiera | 1 |
| Defectos Grado 2 presentes | cualquiera | 2 |
| Calibre grano | menor14 | 2 |
| No deforestación sin marcar | ausencia | 1 |
| Sin certificaciones | lista vacía | 2 |
| HR bodega | >70% en alert | 2 |
| Puntaje SCA | <80 | 1 |
| Puntaje SCA | 80-84 | 2 |
| pH suelo | <5,0 o >5,5 en alert | 2 |
| Temperatura | fuera de 18-22 en alert | 2 |
| Precipitación | <1.500 en alert | 1 |
| Precipitación | >3.000 en alert | 2 |
| Meses secos | >4 en alert | 1 |
| HR ambiental | >70% en alert | 2 |
| % sombra | sin sombra | 3 |
| Plagas con severidad ≥4 | presentes | 1 |
| Sin indicadores fuera de rango | — | mensaje positivo (p=0) |

## Rangos de Referencia (objeto `REF`)

| Campo | Rango ideal | Unidad | Fuente |
|-------|-------------|--------|--------|
| altitud | 1350-1800 | msnm | Cenicafé |
| puntajeSCA | 80-100 | pts | SCA |
| pctRojos | 95-100 | % | Cenicafé |
| fermentacion | 12-24 | h | Cenicafé |
| humedadPergamino | 10-12 | % | Cenicafé/FNC |
| relacionCereza | 4,5-5,5 | :1 | Cenicafé |
| mermaTrilla | 17-20 | % | FNC |
| pctPasilla | 0-8 | % | Cenicafé |
| factorRendimiento | 80-83 | % | FNC/Cenicafé |
| hrAlmacen | 60-70 | %HR | Cenicafé |
| ph | 5,0-5,5 | pH | Cenicafé |
| temperaturaPromedio | 18-22 | °C | Cenicafé |
| precipitacionAnual | 1500-3000 | mm/año | Cenicafé |
| mesesSecos | 0-4 | meses | Cenicafé |
| hrAmbiente | 60-70 | %HR | Cenicafé |

## Plataformas

Web móvil, un solo `index.html` servido estáticamente desde GitHub Pages. Sin apps nativas. El `manifest.json` declara `display: standalone` para permitir instalación como PWA, aunque no tiene service worker ni icono configurados actualmente.

## Requisitos No Funcionales

- **Rendimiento**: carga en 3G/4G rural. CDNs usados: React 18.2.0 (cloudflare), Babel standalone 7.23.2 (cloudflare), docx 9.7.1 (unpkg). Sin bundler.
- **Offline-tolerancia**: `localStorage` como respaldo inmediato; `PUT` con debounce 700ms; reintento automático al evento `online`.
- **Accesibilidad táctil**: `min-height: 44px` en todos los botones; `font-size: 16px` en inputs para evitar zoom automático en iOS; `touch-action: manipulation`.
- **Safe areas**: `env(safe-area-inset-top/bottom)` en header y navegación inferior para soporte de iPhone con notch.
- **Escalabilidad**: grupo pequeño (decenas de caficultores de San Adolfo); no se diseña para volumen.
