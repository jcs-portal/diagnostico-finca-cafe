# Equipo de Teammates: Diagnóstico de Finca Café

## Teammates Seleccionados

| Teammate | Incluido | Scope Exclusivo | Justificación |
|----------|----------|-----------------|----------------|
| Frontend | Sí | `index.html` (toda la app: login, lista de diagnósticos, wizard, catálogos, recomendaciones, Word, autoguardado) | El único archivo de código de este proyecto. Un solo propietario para evitar conflictos. |
| Backend | No (para cambios en este proyecto) | — | El backend vive en el repo de `finanzas-cafeteros`. Los cambios al backend los hace quien gestiona ese repo, no este proyecto. Si se necesita un endpoint nuevo, se coordina externamente. |
| Testing | No | — | Proyecto de un solo archivo con usuarios reales. La verificación es manual (ver `07_estandares.md`). |
| DevOps | No | — | Despliegue manual a GitHub Pages. Sin pipeline que justifique un teammate dedicado. |

**Nota**: a diferencia de `plan-mejora-calidad-cafe`, este proyecto no tiene un teammate Arquitecto separado porque no toca el backend. El único entregable es `index.html`.

## Archivos Compartidos

| Archivo | Regla de coordinación |
|---------|-----------------------|
| `index.html` | Un solo propietario (Frontend). No hay solapamiento porque no hay otros archivos de código. |
| `manifest.json` | No requiere coordinación frecuente; solo se edita si cambia el nombre de la app o las rutas de Pages. |
| `specs/` | Solo lectura durante oleadas de desarrollo. Los actualiza el lead entre oleadas. |

## Spawn Prompt para Oleadas Futuras

### Teammate: Frontend

```
Eres el teammate Frontend del proyecto "Diagnóstico de Finca Café".
Tu scope exclusivo: diagnostico-finca-cafe/index.html (y manifest.json si hay cambios de metadatos).
No hay backend propio — la app consume el backend compartido de finanzas-cafeteros en
https://doc-comite-finanzas-production.up.railway.app/api

Contexto técnico:
- Un único index.html con React 18 + Babel standalone + docx, todos por CDN.
- Sin build step, sin npm, sin empaquetador.
- Autenticación: headers X-Code + X-Password en cada petición.
- Autoguardado: localStorage inmediato + PUT con debounce 700ms + reintento al evento 'online'.
- Ficha de Productor compartida: GET/PUT /api/finca con debounce 900ms.
- Paleta de colores: objeto C (earth, roast, bark, clay, cream, fog, leaf, mist, alert, warn, ok, white).
- Rangos de referencia: objeto REF (Cenicafé/FNC/SCA).
- Estado del wizard: objeto ESTADO (no añadir campos sin revisar si el backend los persiste ya).

Antes de añadir cualquier campo nuevo al objeto ESTADO, verificar:
1. El backend ya lo acepta y persiste, o coordinar con quien gestiona finanzas-cafeteros/app.js.
2. No rompe diagnósticos ya guardados (los campos ausentes en el servidor deben tener un valor
   por defecto en el ESTADO para no causar errores de render).

Endpoints disponibles en el backend (no crear ni asumir endpoints nuevos sin coordinar):
- GET  /api/whoami         → {code, rol}
- GET  /api/diagnostico    → {diagnosticos: [...]}
- POST /api/diagnostico    → nuevo objeto de diagnóstico
- PUT  /api/diagnostico/:id → guarda el estado del wizard
- DELETE /api/diagnostico/:id → borra un diagnóstico
- DELETE /api/diagnostico  → borra todos los diagnósticos del código
- GET  /api/finca          → {nombreFinca, vereda, altitud, variedad, hectareasCafe}
- PUT  /api/finca          → actualiza ficha de productor
- GET  /api/benchmark      → {precioFNCPorKilogramo, ...}
- PUT  /api/password       → cambia contraseña

Convenciones del archivo:
- Variables y campos de dominio: camelCase, en español (pctRojos, mermaTrilla, etc.).
- Componentes React: PascalCase (DiagnosticoWizard, CatalogoPlagas, etc.).
- Emojis como iconos de UI (☕, 🌱, 🔴, ⚠️, etc.) — el diseño actual los usa extensamente.
- Colores siempre desde el objeto C, nunca valores hexadecimales hardcodeados inline.
- API_BASE como única constante con la URL del backend (no repetir la URL en ningún otro lugar).

Criterios de aceptación de cualquier oleada:
1. Abrir index.html en Chrome (servido localmente o directo desde GitHub Pages) y recorrer
   el wizard completo con un código SA-XX real.
2. Verificar que el autoguardado funciona: hacer cambios, poner el dispositivo en modo avión,
   hacer más cambios, volver a conectar — los cambios deben sincronizarse.
3. Verificar que la descarga del Word genera un archivo válido con todos los datos.
4. Verificar en DevTools responsive que la app se ve correcta en pantalla de 375px de ancho.
5. Verificar que no hay catch vacíos: cualquier fallo de red debe mostrar algo visible.

NO hacer:
- git push ni desplegar a GitHub Pages sin revisión humana explícita.
- Cambiar la forma de los campos del objeto ESTADO sin verificar compatibilidad con datos existentes.
- Añadir dependencias CDN nuevas sin justificación en el spec correspondiente.
```

## Puntos de Intervención Humana

| Momento | Qué revisar | Criterio de avance |
|---------|-------------|-------------------|
| Tras cada oleada de Frontend | index.html funciona contra el backend de Railway | Flujo completo probado a mano (login, wizard, Word, autoguardado) |
| Antes de `git push` a Pages | No hay regresiones visibles | Revisión visual en móvil o DevTools responsive |
| Si se añaden endpoints nuevos al backend | Coordinar con quien gestiona `finanzas-cafeteros` | El endpoint existe en el servidor antes de que el frontend lo llame |
