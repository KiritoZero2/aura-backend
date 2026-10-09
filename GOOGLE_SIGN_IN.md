# Activar el inicio de sesión con Google

La integración usa **Google Identity Services** en el navegador y verifica la credencial en el backend con `google-auth-library`. Después de verificarla, QuantumCash entrega su propio JWT; el token de Google no se usa para llamar a las API de QuantumCash.

## Configuración pendiente

1. En [Google Cloud Console](https://console.cloud.google.com/), configura la pantalla de consentimiento OAuth y crea un **OAuth Client ID de tipo Web application**.
2. En **Authorized JavaScript origins**, agrega el origen exacto de cada frontend: por ejemplo `http://localhost:5500` durante desarrollo y el dominio HTTPS real de producción. No agregues rutas, solo esquema, host y puerto si corresponde.
3. Mientras la aplicación OAuth esté en pruebas, agrega las cuentas que vayan a probarla como usuarios de prueba.
4. Configura `GOOGLE_CLIENT_ID` en las variables de entorno del backend. Usa el **Client ID web**, que es público; no se necesita un Client Secret para este flujo de Google Identity Services.
5. En el backend, define también `FRONTEND_ORIGIN` con el origen exacto del frontend (el valor actual por defecto es `http://localhost:5500`). Despliega/reinicia el backend y publica el frontend actualizado.

El frontend consulta `/api/auth/google/config` para obtener ese Client ID. El botón aparece solo cuando el servidor lo devuelve. El flujo usa el modo popup con callback JavaScript, así que no requiere un redirect URI. El backend requiere HTTPS en producción.

## Comportamiento de las cuentas

- Una identidad Google nueva crea una cuenta QuantumCash y su documento de datos; el username se deriva del correo y se hace único si ya está ocupado.
- Si un registro futuro ya tiene el mismo correo verificado por Gmail o Google Workspace, puede vincularse a esa identidad Google.
- Las cuentas que ya existían en esta base no tienen correo guardado. **No se fusionan con Google por username**; por tanto, un usuario antiguo puede acabar con una cuenta Google separada si no se implementa y completa antes un flujo explícito de vinculación.
- Las cuentas Google usan Google para autenticarse y no tienen contraseña local. El acceso por usuario/contraseña para cuentas tradicionales sigue funcionando.
- Los campos `email` y `googleId` se mantienen privados y no se incluyen en las respuestas JSON del modelo.

## Alcance

Esta integración cubre el frontend web. El inicio de sesión de una APK/WebView debe probarse aparte: Google puede bloquear OAuth dentro de WebViews. Para una app Android nativa se recomienda Google Sign-In nativo y configurar/verificar también el Client ID de Android en el backend.

## Referencias

- [Google Identity Services: mostrar el botón](https://developers.google.com/identity/gsi/web/guides/display-button)
- [Google Identity Services: verificar el ID token en el servidor](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
