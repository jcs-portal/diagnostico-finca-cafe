# Arquitectura Técnica: Diagnóstico de Finca Café

## Visión General

```
┌─────────────────────────────────────────────┐
│  Frontend (este proyecto)                   │
│  diagnostico-finca-cafe/index.html          │
│  React 18 vía CDN · Babel vía CDN           │
│  GitHub Pages                               │
└──────────────┬──────────────────────────────┘
               │ fetch + X-Code + X-Password
               ▼
┌─────────────────────────────────────────────┐
│  Backend compartido (finanzas-cafeteros)    │
│  Express · Railway                          │
│  doc-comite-finanzas-production.up.railway.app/api │
│                                             │
│  Endpoints usados:                          │
│  GET  /api/whoami                           │
│  GET  /api/diagnostico                      │
│  POST /api/diagnostico                      │
│  PUT  /api/diagnostico/:id                  │
│  DELETE /api/diagnostico/:id                │
│  DELETE /api/diagnostico                    │
│  GET  /api/finca                            │
│  PUT  /api/finca                            │
│  GET  /api/benchmark                        │
│  PUT  /api/password                         │
└─────────────────────────────────────────────┘

Apps hermanas que comparten el mismo backend:
  finanzas-cafeteros
  plan-mejora-calidad-cafe
```

## Stack Tecnológico

### Frontend

| Capa | Tecnología | Versión CDN | Justificación |
|------|------------|-------------|----------------|
| UI | React | 18.2.0 (cloudflare) | Componentes reutilizables dentro del archivo; gestión de estado con hooks sin gestor externo. |
| JSX | Babel standalone | 7.23.2 (cloudflare) | Permite escribir JSX directamente en el HTML sin paso de compilación. El navegador transpila en tiempo de carga. |
| Generación Word | docx | 9.7.1 (unpkg, UMD) | Crea `.docx` en el navegador sin servidor. Se accede como `window.docx`. |
| Estilos | CSS inline + `<style>` global | — | Sin frameworks CSS. Paleta de colores definida en el objeto `C`. |
| Estado | React hooks (`useState`, `useEffect`, `useCallback`, `useRef`) | — | Sin Redux ni Context; el árbol de componentes es lo suficientemente plano para no necesitarlos. |
| Persistencia cliente | `localStorage` | — | Solo para: código de sesión (`dfc_code`), contraseña (`dfc_password`), y borradores offline (`dfc_draft_${id}`). |

### Backend (no es de este proyecto — se reutiliza)

| Capa | Tecnología | Notas |
|------|------------|-------|
| Servidor | Express (Node.js) | En `finanzas-cafeteros/app.js`. Este proyecto solo consume su API. |
| Autenticación | Headers `X-Code` + `X-Password` | El middleware `auth` valida el código contra la lista de códigos conocidos. Si el código tiene contraseña asignada, valida también `X-Password`. |
| Almacenamiento | Archivos JSON en volumen Railway | `data/diagnostico/<codigo>.json` guarda el array de diagnósticos de ese código. |
| Datos finca compartidos | `/api/finca` | Almacena `nombreFinca`, `vereda`, `altitud`, `variedad`, `hectareasCafe`; compartido con `finanzas-cafeteros` y `plan-mejora-calidad-cafe`. |
| Precio de referencia | `/api/benchmark` | Devuelve `precioFNCPorKilogramo` (precio de referencia FNC actualizado). |

### Infraestructura

| Componente | Servicio | Notas |
|------------|----------|-------|
| Hosting frontend | GitHub Pages | Un solo archivo estático. Despliegue: `git push` a la rama de Pages. |
| Hosting backend | Railway | Compartido con `finanzas-cafeteros`. No se gestiona desde este repo. |
| CI/CD | Ninguno | Despliegue manual. Proyecto demasiado pequeño para justificar pipeline. |

## Modelo de Datos

### Datos persistidos en el servidor (`PUT /api/diagnostico/:id`)

El objeto `ESTADO` (estado inicial del wizard) define la forma de cada diagnóstico. Sus campos son:

```javascript
const ESTADO = {
  // Datos de finca (sincronizados también con /api/finca)
  nombre: "",          // Nombre de la finca
  vereda: "",          // Vereda
  altitud: "",         // msnm
  variedad: "",        // Variedad de café principal
  hectareas: "",       // Hectáreas en café

  // Cosecha
  pctRojos: "",        // % frutos rojos (valores discretos: "70","80","85","90","95","99")
  puntajeSCA: "",      // Puntaje SCA en taza (opcional)
  fermentacion: "",    // Tiempo de fermentación en horas
  relacionCereza: "",  // Relación cereza:pergamino (:1)

  // Secado y almacenamiento
  humedadPergamino: "", // % humedad pergamino seco
  hrAlmacen: "",       // % HR bodega

  // Trilla
  mermaTrilla: "",     // % merma total en trilla
  pctPasilla: "",      // % pasilla
  metodoTrilla: "muestra", // "muestra" | "directo"
  pesoMuestraPergamino: "250",
  pesoCascarilla: "",
  pesoPasillaMuestra: "",
  pesoExcelsoMuestra: "",

  // Defectos y calibre
  calibreGrano: "",    // "menor14" | "15-16" | "17-18" | "nose"
  defectosObservados: [], // Array de IDs de DEFECTOS_GRANO

  // Suelo
  tipoSuelo: "",       // "Arcilloso" | "Franco" | ... | "No sé"
  ph: "",              // pH del suelo
  humedadSuelo: "",    // "Seco" | "Húmedo" | "Encharcado"
  pctSombra: "",       // "0" | "20" | "30" | "50"
  especiesSombra: "",  // Texto libre

  // Clima
  regimenLluvias: "",  // "Bimodal" | "Monomodal" | "No estoy seguro"
  temperaturaPromedio: "",
  precipitacionAnual: "",
  mesesSecos: "",
  hrAmbiente: "",

  // Fitosanitario
  plagasObservadas: [], // Array de IDs de PLAGAS
  notasFitosanitarias: "",

  // Certificación
  certificaciones: [], // Array de IDs de CERTIFICACIONES_CAFE
  notasCertificacion: "",
  criteriosVerificacion: [], // Array de IDs de CRITERIOS_VERIFICACION

  // Sostenibilidad
  practicasSostenibles: [], // Array de IDs de PRACTICAS_SOSTENIBLES
  notasSostenibilidad: "",

  // Simulación económica
  kgPergaminoCosecha: "",
  pctPrecioPasilla: "30",
}
```

El servidor añade al objeto persistido campos de metadatos: `id` (identificador único del diagnóstico), `numero` (entero secuencial del caficultor), `actualizadoEn` (fecha/hora ISO).

### Datos persistidos solo en `localStorage` del dispositivo

| Clave | Contenido | Cuándo se borra |
|-------|-----------|-----------------|
| `dfc_code` | Código SA-XX del usuario activo | Al hacer logout |
| `dfc_password` | Contraseña del usuario activo (si tiene) | Al hacer logout |
| `dfc_draft_${id}` | Snapshot completo del estado del wizard para ese diagnóstico | Al confirmarse el PUT al servidor con éxito |

### Datos persistidos en `/api/finca` (compartidos entre apps)

| Campo | Fuente que escribe | Apps que leen |
|-------|-------------------|---------------|
| `nombreFinca` | diagnostico-finca-cafe | finanzas-cafeteros, plan-mejora-calidad-cafe |
| `vereda` | diagnostico-finca-cafe | finanzas-cafeteros, plan-mejora-calidad-cafe |
| `altitud` | diagnostico-finca-cafe | finanzas-cafeteros, plan-mejora-calidad-cafe |
| `variedad` | diagnostico-finca-cafe | finanzas-cafeteros, plan-mejora-calidad-cafe |
| `hectareasCafe` | diagnostico-finca-cafe | finanzas-cafeteros, plan-mejora-calidad-cafe |

## ADRs (Decisiones de Arquitectura)

### ADR-001: Un único archivo HTML sin build step

- **Estado**: Aceptada
- **Contexto**: Los caficultores y el formador necesitan actualizaciones simples de desplegar. El equipo es pequeño y no hay pipeline de CI/CD. El proyecto debe poder modificarse sin conocimiento de bundlers.
- **Decisión**: Toda la app vive en un único `index.html` con React y Babel por CDN. Sin npm, sin webpack, sin Vite.
- **Consecuencias**: (+) Despliegue trivial (`git push` a GitHub Pages), sin paso de build. (+) El archivo puede editarse directamente con cualquier editor. (−) El archivo crece en longitud (~1.700 líneas); sin code splitting. (−) Babel transpila JSX en el navegador en cada carga (coste de inicio, mitigado por caché del CDN). (−) Sin TypeScript ni linting automático.

### ADR-002: Reutilizar el backend de `finanzas-cafeteros` en lugar de crear uno nuevo

- **Estado**: Aceptada
- **Contexto**: `finanzas-cafeteros` ya tiene un backend Express con auth por código, almacenamiento de JSON en volumen Railway y patrones de rutas establecidos. Crear un backend independiente duplicaría operaciones, auth y costes.
- **Decisión**: Esta app consume el mismo backend. Los endpoints de diagnóstico (`/api/diagnostico*`) viven en `finanzas-cafeteros/app.js`.
- **Consecuencias**: (+) Cero infraestructura nueva. (+) Autenticación y datos de finca compartidos sin doble captura. (−) Dependencia de un repo externo en producción; un deploy erróneo de `finanzas-cafeteros` puede afectar a `diagnostico-finca-cafe`. Mitigación: checkpoint humano antes de cualquier deploy del backend.

### ADR-003: Catálogos técnicos embebidos en el cliente (no en el servidor)

- **Estado**: Aceptada
- **Contexto**: Los catálogos de plagas (15 entradas), defectos de grano (7 entradas), certificaciones (7), criterios de verificación (5) y prácticas sostenibles (10) son datos semi-estáticos (se actualizan poco). Podrían vivir en el servidor, pero eso añadiría rutas de API y latencia.
- **Decisión**: Los catálogos son constantes JavaScript en el propio `index.html` (`PLAGAS`, `DEFECTOS_GRANO`, `CERTIFICACIONES_CAFE`, `CRITERIOS_VERIFICACION`, `PRACTICAS_SOSTENIBLES`). La función `generarRecomendaciones` también vive en el cliente.
- **Consecuencias**: (+) Sin latencia de red para mostrar catálogos; funciona aunque el servidor esté caído. (+) Cero endpoints adicionales. (−) Actualizar un catálogo requiere editar el `index.html` y redeplegar. (−) Si `plan-mejora-calidad-cafe` necesita la función `generarRecomendaciones`, debe copiarla (ver ADR-003 en specs de ese proyecto).

### ADR-004: Generación del informe Word en el navegador (no en el servidor)

- **Estado**: Aceptada
- **Contexto**: El informe `.docx` contiene todos los indicadores, recomendaciones y simulación económica. Generarlo en el servidor requeriría una ruta nueva, transmitir todos los datos al servidor y gestionar la descarga de binario. La librería `docx` permite generarlo completamente en el cliente.
- **Decisión**: `descargarWordDiagnostico(d, code)` usa `window.docx` (unpkg CDN) para crear el `.docx` y descargarlo directamente desde el navegador con un `<a>` de objeto URL.
- **Consecuencias**: (+) Sin ruta de servidor nueva. (+) Funciona sin conexión si la página ya está cargada (excepto el `GET /api/benchmark` para el precio FNC, que falla silenciosamente y usa un valor por defecto). (−) Si la librería CDN falla o cambia, la descarga deja de funcionar. (−) El tamaño del bundle implícito del `docx` se carga solo cuando el usuario lo pide (no en la carga inicial de la app, porque la librería se carga en el `<head>` siempre — pendiente de optimizar como mejora futura).

### ADR-005: Autoguardado con `localStorage` como primera línea de defensa

- **Estado**: Aceptada
- **Contexto**: La conectividad es intermitente. Un `PUT` fallido en campo puede suponer perder datos del diagnóstico si el usuario cierra la pestaña.
- **Decisión**: Cada cambio de estado escribe primero en `localStorage` (inmediato, síncrono) y luego lanza un `PUT` con debounce de 700ms. Si el `PUT` falla, se activa el listener `online` para reintentar cuando vuelva la red. Solo al confirmar el `PUT` se borra el draft de `localStorage`.
- **Consecuencias**: (+) Cero pérdida de datos en desconexiones momentáneas. (+) El caficultor puede cerrar y reabrir la app y recuperar exactamente donde estaba. (−) Si usa varios dispositivos con el mismo código, el draft de `localStorage` no se sincroniza entre dispositivos (el servidor sí lo está). (−) `localStorage` puede llenarse si se acumulan muchos borradores de diagnósticos que nunca se confirmaron — riesgo muy bajo en la práctica.

### ADR-006: Ficha de Productor compartida vía `/api/finca`

- **Estado**: Aceptada
- **Contexto**: Los datos básicos de la finca (nombre, vereda, altitud, variedad, hectáreas) se piden también en `finanzas-cafeteros` y `plan-mejora-calidad-cafe`. Sin coordinación, el caficultor tendría que introducirlos en cada app.
- **Decisión**: Al abrir un diagnóstico nuevo sin esos campos, se hace `GET /api/finca` para precargarlos. Al modificarlos en el diagnóstico, se sincronizan de vuelta a `/api/finca` con debounce de 900ms.
- **Consecuencias**: (+) El caficultor introduce los datos de finca una sola vez. (+) Las demás apps leen los datos actualizados automáticamente. (−) Si dos apps modifican `/api/finca` simultáneamente (el caficultor abre dos pestañas), la última escritura gana. Riesgo aceptable a esta escala.
