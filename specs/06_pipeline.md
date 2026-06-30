# Pipeline por Oleadas: Diagnóstico de Finca Café

## Estado Actual

La app está **en producción** y en uso por caficultores reales de San Adolfo con código SA-XX. El flujo actual es:

```
GitHub Pages (index.html)
        │
        │  fetch + X-Code + X-Password
        ▼
Railway Backend (finanzas-cafeteros)
  /api/diagnostico  /api/finca  /api/benchmark  /api/password
```

No hay pipeline automatizado. El despliegue es manual: `git push` a la rama que sirve GitHub Pages.

## Despliegue Actual

| Componente | Cómo se despliega | Quién lo hace |
|------------|-------------------|---------------|
| Frontend (`index.html`) | `git push` a la rama de GitHub Pages | Juan Carlos |
| Backend | `git push` en el repo de `finanzas-cafeteros` | Juan Carlos (con checkpoint antes de Railway) |

**Proceso obligatorio antes de cualquier cambio en producción**:
1. Probar el `index.html` modificado localmente en Chrome contra el backend de Railway.
2. Si hay cambios de endpoints, probar también con el backend local.
3. Revisión humana explícita del diff.
4. `git push` y verificar que el Pages se actualiza correctamente.
5. Probar en el móvil real (no solo DevTools) con un código SA-XX real.

## Mejoras Futuras Identificadas

Las siguientes mejoras han sido identificadas pero no están construidas. Se ordenan de mayor a menor impacto esperado según el contexto del programa Ubuntu.

### Alta prioridad

**Comparación antes/después entre cosechas**
- Descripción: al abrir la lista de diagnósticos, mostrar variación de indicadores clave (merma trilla, % pasilla, puntaje SCA, % frutos rojos) entre el diagnóstico más reciente y el anterior para la misma finca. Esto cierra el ciclo de mejora que hoy solo puede inferirse comparando dos diagnósticos a mano.
- Dependencia: los diagnósticos ya se almacenan históricamente en el servidor. El frontend solo necesita leer el array y calcular la variación.
- Integración natural con: `plan-mejora-calidad-cafe` (que muestra el "antes/después" vinculado a las acciones del plan).

**Panel del formador con vista agregada de todos sus caficultores**
- Descripción: si el usuario es un formador (rol `formador` según `/api/whoami`), mostrar un panel con el estado de todos los caficultores de su comunidad: quién tiene diagnóstico reciente, qué indicadores están más fuera de rango en el grupo, qué plagas son más prevalentes.
- Dependencia: requiere un endpoint nuevo en el backend (`GET /api/admin/diagnostico`) similar al que ya existe para `plan-mejora-calidad-cafe`. Coordinar con `finanzas-cafeteros`.
- Integración natural con: `plan-mejora-calidad-cafe` (que ya tiene vista de formador).

### Media prioridad

**Integración directa con `plan-mejora-calidad-cafe`**
- Descripción: desde la sección de Diagnóstico (paso 12), un botón "Crear plan de acción" que lleve al caficultor directamente a `plan-mejora-calidad-cafe` con las recomendaciones ya generadas. Actualmente el caficultor tiene que abrir la otra app por separado.
- Implementación posible: solo un enlace con `?code=SA-XX` que la otra app ya admite (por confirmar).

**Modo sin conexión real (Service Worker)**
- Descripción: cachear el `index.html` y los CDNs con un Service Worker para que la app funcione completamente sin internet (no solo guardado offline-tolerante, sino carga offline).
- Restricción actual: la app no tiene Service Worker. El `manifest.json` está configurado para standalone (instalable como PWA) pero sin caché offline.
- Complejidad: media — añadir un SW requiere un archivo `sw.js` y registro desde el `index.html`.

**Foto del lote o la plaga como evidencia**
- Descripción: permitir al caficultor adjuntar una foto de la plaga observada o del lote, para que el formador pueda verificar el diagnóstico remotamente.
- Restricción: el backend actual no almacena archivos binarios (solo JSON en volumen Railway). Requeriría integración con un servicio de almacenamiento externo (Google Drive, Cloudinary, etc.) o ampliar el backend con multer/volumen de Railway con disco.
- Prioridad: baja para el MVP; alta si el formador la pide como herramienta de seguimiento remoto.

**Exportación del diagnóstico en PDF (no solo Word)**
- Descripción: algunos caficultores y formadores prefieren PDF para compartir por WhatsApp. El Word generado en el navegador puede exportarse como PDF desde el diálogo de impresión, pero no es evidente para todos los usuarios.
- Implementación posible: añadir una vista de impresión CSS (`@media print`) similar a la de `plan-mejora-calidad-cafe`, o usar una librería como jsPDF por CDN.

### Baja prioridad / Diferidas

- Notificaciones push cuando el formador envía un mensaje (requeriría Service Worker + backend de push).
- Múltiples variedades o lotes dentro del mismo diagnóstico (actualmente es un diagnóstico por finca/cosecha).
- Integración con `finanzas-cafeteros` para cruzar indicadores de proceso con datos económicos (ej. coste del control de broca vs. pérdida económica estimada por infestación).
- Análisis de suelos desde el laboratorio: importar el PDF del análisis y prellenar pH y composición.

## Historial de Oleadas

| Oleada | Estado | Descripción |
|--------|--------|-------------|
| Construcción inicial | Completada | App completa con wizard 13 pasos, catálogos de plagas/defectos, recomendaciones, Word, autoguardado, ficha de productor. Desplegada en producción. |
| Specs | Completada (julio 2026) | Documentación de los 7 archivos de specs a partir del código en producción. |

## Criterios de Completitud para Oleadas Futuras

| Criterio | Descripción |
|----------|-------------|
| No regresiones | El wizard completo funciona igual que antes del cambio |
| Autoguardado intacto | El ciclo localStorage → PUT → borrar draft sigue funcionando |
| Word válido | La descarga genera un .docx que Word/LibreOffice puede abrir |
| Compatibilidad de datos | Los diagnósticos guardados antes del cambio siguen renderizando correctamente |
| Revisión humana | El responsable prueba en móvil real antes de dar el `git push` final |
