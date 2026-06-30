# Estándares: Diagnóstico de Finca Café

## Convenciones de Código

Todo el código vive en un único `index.html`. No hay módulos, no hay imports/exports. Las convenciones son:

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Variables y campos de dominio | camelCase, nombres en español | `pctRojos`, `mermaTrilla`, `hrAlmacen`, `defectosObservados` |
| Funciones de dominio | camelCase, en español | `generarRecomendaciones()`, `descargarWordDiagnostico()`, `semaforo()` |
| Funciones de utilidad | camelCase, nombre descriptivo | `apiGet()`, `apiPut()`, `apiPost()`, `apiDelete()` |
| Componentes React | PascalCase | `DiagnosticoWizard`, `CatalogoPlagas`, `TarjetaPlaga`, `IndicadorBar`, `Campo` |
| Constantes de catálogo | SCREAMING_SNAKE_CASE | `PLAGAS`, `DEFECTOS_GRANO`, `CERTIFICACIONES_CAFE`, `REF`, `ESTADO`, `SECCIONES` |
| Colores | Siempre desde el objeto `C` | `C.earth`, `C.roast`, `C.alert` — nunca `"#2C1810"` inline |
| URL del backend | Una sola constante `API_BASE` | No repetir la URL en ningún otro lugar del archivo |
| Claves de localStorage | Prefijo `dfc_` | `dfc_code`, `dfc_password`, `dfc_draft_${id}` |
| Emojis | Como iconos de UI en labels, cabeceras y botones | ☕ en el header, 🔴/🟡/🟢 en semáforos, 📄 en descarga Word |

## Estructura del Archivo `index.html`

El archivo sigue este orden de arriba a abajo (no reordenar sin motivo):

```
1. <head>: meta viewport + manifest + CDNs (React, ReactDOM, Babel, docx) + <style> global
2. <script type="text/babel">:
   2.1  Constante API_BASE
   2.2  Gestión de contraseña (currentPassword, setCurrentPassword)
   2.3  Funciones de API (apiGet, apiPut, apiPost, apiDelete)
   2.4  Paleta de colores (C)
   2.5  Rangos de referencia (REF)
   2.6  Función semaforo() y helpers de display (colorSem, labelSem, iconSem)
   2.7  Catálogo PLAGAS (15 entradas)
   2.8  Catálogo DEFECTOS_GRANO (7 entradas)
   2.9  Constante ESTANDAR_ESPECIAL
   2.10 Catálogos de certificación (CERTIFICACIONES_CAFE, CRITERIOS_VERIFICACION, PRACTICAS_SOSTENIBLES)
   2.11 Función generarRecomendaciones(d)
   2.12 Componentes de UI básicos (IndicadorBar, Campo, SelectorBotones, SeccionHeader, TipBox)
   2.13 Componentes de catálogos (TarjetaPlaga, CatalogoPlagas, TarjetaDefecto, CatalogoDefectos)
   2.14 Componente ItemChecklist (genérico para certificaciones, criterios y prácticas)
   2.15 Función descargarWordDiagnostico(d, code) + INDICADORES_WORD
   2.16 Componente ListaDiagnosticos
   2.17 Componente Login + función cambiarPassword
   2.18 Constantes SECCIONES y ESTADO
   2.19 Componente DiagnosticoWizard (el corazón: 13 pasos del wizard)
   2.20 Componente Contenedor (gestión de lista + navegación entre lista y wizard)
   2.21 Componente App (raíz: gestiona código de sesión)
   2.22 ReactDOM.createRoot(...).render(<App />)
```

## Patrones a Mantener

### Guardado offline-first (ADR-005)

Todo cambio de datos sigue este orden:
1. `setDatos(d => ({...d, [name]: val}))` — actualiza React state inmediatamente.
2. En el `useEffect` del autoguardado: `localStorage.setItem(...)` sincrónicamente.
3. Luego, con debounce 700ms: `apiPut(...)`.
4. Si el PUT falla: `setErrorGuardado(true)` + listener `window.addEventListener("online", reintentar)`.
5. Si el PUT tiene éxito: `localStorage.removeItem(dfc_draft_${id})` + `setErrorGuardado(false)`.

Nunca saltarse el paso de `localStorage`. Nunca suprimir el error de red de forma silenciosa.

### Try/catch en todas las llamadas async

Todas las funciones async que hacen `fetch` usan `apiGet`/`apiPut`/`apiPost`/`apiDelete`, que lanzan un `Error` si el status no es ok. Los llamadores deben envolver en `try/catch` o en `.catch()`:

```javascript
// Correcto
apiGet("/finca", code).then(f => { ... }).catch(() => {}); // silencio OK aquí porque es un precargado opcional
apiGet("/diagnostico", code).then(...).catch(e => setError(e.message)); // error visible al usuario

// Incorrecto — nunca hacer fetch directo sin pasar por las funciones de API
fetch(API_BASE + "/ruta").then(r => r.json()).then(...); // ❌ no maneja errores, no pasa X-Code
```

El único `.catch(() => {})` silencioso aceptable es el de la ficha de finca (precargado opcional: si falla, el campo queda vacío y el usuario lo llena a mano). Todos los demás errores deben llegar al usuario de alguna forma.

### Sin acceso a propiedades de null sin guard

Antes de acceder a cualquier objeto que venga del servidor:

```javascript
// Correcto
const bm = bm?.precioFNCPorKilogramo || 23768; // fallback si benchmark falla

// Incorrecto
const precio = bm.precioFNCPorKilogramo; // ❌ si bm es null, explota
```

### Componentes pequeños y sin estado externo

Ningún componente tiene acceso directo al estado de otro. La comunicación es siempre hacia abajo (props) y hacia arriba (callbacks):
- `DiagnosticoWizard` tiene el estado `datos` y lo pasa como props a cada sección.
- Las secciones del wizard no tienen estado propio para los datos del diagnóstico; solo llaman al callback `set` o `toggle*`.
- La excepción son los componentes de UI (como `TarjetaPlaga`) que tienen estado de `abierta` (expandido/colapsado) local, lo cual es correcto.

## Verificación Antes de Cualquier Cambio

Esta app no tiene compilador, tipos ni tests automáticos. La verificación es manual y obligatoria:

| Paso | Acción | Criterio |
|------|--------|----------|
| 1 | Abrir `index.html` en Chrome (GitHub Pages o `npx serve .` local) | La app carga sin errores en la consola |
| 2 | Login con un código SA-XX real o de prueba | El wizard de diagnóstico abre correctamente |
| 3 | Completar los 13 pasos del wizard | No hay errores de render en ningún paso; los semáforos calculan correctamente |
| 4 | Verificar autoguardado | Editar un campo, esperar 1 segundo, ver "✓ Guardado" en el header |
| 5 | Probar offline | Desconectar la red, editar un campo → aparece "⚠ Sin conexión"; reconectar → "✓ Guardado" |
| 6 | Descargar Word | El botón genera un `.docx` descargable que se abre en Word/LibreOffice correctamente |
| 7 | Verificar en móvil | DevTools → toggle device toolbar → iPhone SE (375px) → no hay elementos cortados ni solapados |
| 8 | Crear un diagnóstico nuevo | "Nuevo diagnóstico" crea una entrada y la abre en el wizard |
| 9 | Borrar un diagnóstico | El botón "Borrar" pide confirmación y elimina el diagnóstico de la lista |

Si alguno de estos pasos falla, no se hace `git push`.

## Cómo Actualizar los Catálogos Técnicos

Los catálogos `PLAGAS`, `DEFECTOS_GRANO`, `CERTIFICACIONES_CAFE`, `CRITERIOS_VERIFICACION`, `PRACTICAS_SOSTENIBLES` y el objeto `REF` son las piezas de conocimiento técnico de la app. Para actualizarlos:

1. Actualizar el objeto/array en `index.html`.
2. Verificar que los IDs no se reutilicen (para no invalidar selecciones guardadas en el servidor).
3. Si se cambia un campo del objeto `REF`, revisar que la función `semaforo()` sigue siendo correcta.
4. Si se cambian los umbrales de `generarRecomendaciones()`, hacer la misma actualización en `plan-mejora-calidad-cafe/index.html` (que tiene una copia de esa función — ver ADR-003 de ese proyecto).
5. Documentar la fuente del cambio (Cenicafé, FNC, SCA) en el comentario del código.

## Formato de Commits

```
tipo(alcance): descripción breve

Tipos: feat, fix, docs, style, refactor, chore
Ejemplos:
  feat(wizard): añadir comparación antes/después entre cosechas
  fix(autoguardado): corregir reintento al recuperar conexión
  chore(catalogo): actualizar umbral de broca según Cenicafé 2025
```

## Reglas de Estilo Visual

La app tiene un sistema de diseño visual coherente con las otras apps del ecosistema Ubuntu. Para mantenerlo:

- Fondo de página: `C.cream` (#F5EDD8).
- Header superior: `C.earth` (#2C1810) con texto `C.cream`.
- Tarjetas: `C.white` (#FDFAF4) con `boxShadow: "0 2px 6px rgba(0,0,0,0.07)"` y `borderRadius: 12`.
- Botón principal (acción): `background: C.roast`, `color: C.cream`, `borderRadius: 12`.
- Botón secundario (outline): `border: 2px solid C.clay`, `background: transparent`.
- Semáforo rojo (fuera de rango): `C.alert` (#C0392B).
- Semáforo amarillo (cerca del límite): `C.warn` (#D4851A).
- Semáforo verde (en rango): `C.ok` (#3A5C2A).
- Bloques de tip/info: fondo `#E8F0E0`, borde izquierdo `C.leaf`.
- Alertas de umbral (en catálogos): fondo `#FFF8E8`, borde `C.warn`.

No añadir nuevos colores sin añadirlos primero al objeto `C`.
