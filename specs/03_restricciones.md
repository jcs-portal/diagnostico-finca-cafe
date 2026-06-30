# Restricciones y Recursos: Diagnóstico de Finca Café

## Presupuesto

Proyecto social (Ubuntu Café / Codespa). Coste operativo: ~0 adicional.
- Frontend: GitHub Pages (gratuito), repo `jcs-portal.github.io/diagnostico-finca-cafe` (por confirmar nombre exacto del repo/URL de Pages).
- Backend: Railway (`doc-comite-finanzas-production.up.railway.app/api`), ya pagado para `finanzas-cafeteros`, compartido sin coste adicional.
- Librerías: todas por CDN público (cloudflare, unpkg). Sin npm, sin licencias de pago.

## Timeline

App ya en producción y en uso por caficultores reales SA-XX. No hay una fecha límite activa; el desarrollo se realiza por oleadas de mejora según necesidades del programa.

## Supervisión

- Responsable: Juan Carlos (jcsiria@basecamp.world), que opera y mantiene el resto del ecosistema.
- Nivel técnico: alto — entiende el código del `index.html` y el backend Railway.
- Disponibilidad: la suficiente para revisar cambios entre oleadas antes de desplegar.

## Preferencias Tecnológicas Confirmadas

- **Sin build step**: el proyecto es un único `index.html` con React y Babel por CDN. No se introduce npm, webpack, Vite ni ningún empaquetador.
- **Sin backend propio**: la app usa el mismo backend Express de `finanzas-cafeteros` (Railway). No se crea ni opera un servidor propio para este proyecto.
- **CDNs permitidos**: React 18, ReactDOM 18, Babel standalone, docx (unpkg). No se añaden más dependencias externas sin justificación.
- **Estilos inline**: CSS inline en el JSX y bloque `<style>` global en el head. Sin preprocesadores CSS ni frameworks de estilos.

## Conectividad Limitada (restricción crítica)

San Adolfo es un municipio rural de montaña. La conectividad de campo varía de 2G a 4G según la zona de la finca. La app está diseñada para:
- Carga rápida en 3G: un solo archivo HTML, CDNs con caché de navegador.
- Guardado offline-tolerante: `localStorage` como copia de seguridad inmediata al editar; reintento automático de `PUT` al recuperar la red.
- Sin dependencia de WebSocket ni long-polling: solo fetch estándar (petición → respuesta).

## Dispositivos Gama Media-Baja

Los caficultores usan principalmente móviles Android de gama baja-media con pantallas de 5-6". Restricciones aplicadas en el código:
- `max-width: 480px` en todos los contenedores principales.
- `min-height: 44px` en botones (área táctil mínima).
- `font-size: 16px !important` en inputs y selects (evita zoom automático en iOS).
- `overscroll-behavior: none` para evitar scroll-bounce que desorienta al usuario.
- `-webkit-overflow-scrolling: touch` para scroll suave en iOS.
- `user-select: none` y `touch-action: manipulation` en los botones de opción táctiles.

## Sin Backend Propio — Dependencia del Backend de `finanzas-cafeteros`

Esta app no tiene servidor propio. Todo el almacenamiento de datos de diagnóstico depende del backend Express que sirve también a `finanzas-cafeteros` y `plan-mejora-calidad-cafe`.

**Implicaciones**:
- Cualquier cambio al backend de Railway puede afectar esta app. Antes de modificar el backend (en `finanzas-cafeteros/app.js`), revisar que no se rompen los endpoints que usa `diagnostico-finca-cafe`.
- Los endpoints que esta app consume (`/api/whoami`, `/api/diagnostico`, `/api/diagnostico/:id`, `/api/finca`, `/api/benchmark`, `/api/password`) deben mantenerse estables en forma y semántica.
- Si el backend cae (Railway restart, deploy, etc.), la app queda sin posibilidad de guardar en servidor. El respaldo de `localStorage` mitiga la pérdida de datos durante interrupciones breves.

## Normativa

| Regulación | Aplica | Implicaciones |
|------------|--------|----------------|
| Protección de datos personales (pequeños productores) | Sí, informalmente | Acceso solo por código SA-XX + contraseña opcional. No se recolectan datos sensibles más allá de los del diagnóstico de finca (proceso productivo, no datos personales identificativos salvo el nombre de la finca y la vereda). |
| Normativas técnicas Cenicafé/FNC/SCA | No como obligación legal | Se usan como referencias técnicas de los rangos ideales, no como norma coercitiva. Los rangos deben actualizarse si Cenicafé publica revisiones. |
| Accuerdo Café, Bosque y Clima / UE Deforestación | No directamente | Se refleja en la sección de certificaciones/verificación como criterio a cumplir, con explicación del riesgo para acceso a mercados de exportación. |

## Punto de Atención Especial: App en Producción con Usuarios Reales

La app está desplegada y en uso. Cualquier cambio al `index.html` que se suba a GitHub Pages llega inmediatamente a los caficultores. Por eso:
- Probar todo cambio localmente (abrir en Chrome contra el backend de Railway o local) antes de hacer `git push`.
- No romper la forma del objeto `ESTADO` ni los nombres de campos que el backend ya almacena; hacerlo invalidaría datos de diagnósticos ya guardados.
- Si se cambian los rangos del objeto `REF`, documentar el cambio y comunicarlo al formador, porque puede alterar el color del semáforo en diagnósticos anteriores al abrirlos.
