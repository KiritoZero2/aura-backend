# Inicio de sesión con Google: web y Cordova/Android

El frontend comparte la misma identidad para **iniciar sesión o crear una cuenta**. Si es el primer acceso, el backend crea automáticamente el usuario y su espacio de datos; los accesos siguientes reutilizan esa cuenta.

## Configuración común

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto y configura la pantalla de consentimiento.
2. Crea un OAuth Client ID de tipo **Web application**.
3. Para navegador, agrega en **Authorized JavaScript origins** el origen HTTPS del frontend (sin ruta) y los orígenes locales de desarrollo que utilices.
4. Configura `GOOGLE_CLIENT_ID` en el backend con ese Client ID Web. El frontend consulta `/api/auth/google/config`; no hace falta pegar el ID en el HTML. No se requiere un Client Secret para este flujo.
5. Configura `FRONTEND_ORIGIN` con el origen del sitio web, conserva las variables existentes `MONGODB_URI` y `JWT_SECRET`, y despliega el backend actualizado.

## En navegador

El frontend carga el botón oficial de Google Identity Services y envía la credencial a `/api/auth/google`. El servidor verifica el ID token y luego devuelve el JWT propio de QuantumCash.

## En la APK de Cordova/Android

Google no debe abrirse dentro del WebView usando el flujo web. El frontend ahora detecta Cordova y, en lugar de GIS, usa el puente nativo `window.plugins.googleplus.login` **si el proyecto Cordova incluye `cordova-plugin-googleplus`**. El botón nativo envía el ID token resultante al mismo endpoint `/api/auth/google`; debe usar como `webClientId` el mismo Client ID Web configurado en `GOOGLE_CLIENT_ID` del backend.

Para que funcione en la APK, instala/configura el plugin en la **carpeta raíz real del proyecto Cordova**, no en esta carpeta con los tres archivos HTML/CSS/JS. Registra también una credencial OAuth de tipo Android con el **application ID/package name** y la huella SHA-1 del certificado de firma. Debes registrar las huellas de depuración y producción; si distribuyes por Google Play, revisa la huella del certificado de firma de Play. Después ejecuta la preparación/reconstrucción de Cordova y vuelve a compilar la APK.

**Importante:** la carpeta de trabajo entregada aquí no contiene `config.xml`, `platforms/`, `plugins/` ni `AndroidManifest.xml`; por eso el frontend quedó preparado para el plugin, pero no pude instalarlo ni probar el inicio de sesión nativo en tu APK. Si el plugin no está presente, el botón muestra un mensaje en vez de intentar abrir el login web dentro del WebView.

El plugin Cordova Google Plus disponible utiliza la integración anterior de Google Sign-In. Google recomienda actualmente Credential Manager para aplicaciones Android nativas; la documentación de One Tap/ID-token Android marca ese flujo legado como obsoleto. Para una APK nueva o de producción, lo ideal es usar un plugin Cordova mantenido que implemente Credential Manager o añadir un puente nativo propio. La integración en este frontend queda lista para el plugin legado mencionado y para web; hace falta el proyecto Cordova para decidir e instalar correctamente la capa nativa actual.

## Cuentas y datos existentes

Las identidades Google nuevas crean una cuenta QuantumCash y sus datos. Las cuentas tradicionales que ya existían no guardan correo; no se fusionan por username. Si quieres que Google use los datos de una cuenta anterior, primero hay que implementar una vinculación explícita mientras el usuario inicia sesión por el método original.

Los campos `email` y `googleId` permanecen privados y no se devuelven en las respuestas JSON.

## Referencias oficiales

- [Google Identity Services para web: botón de acceso](https://developers.google.com/identity/gsi/web/guides/display-button)
- [Google Identity Services: verificar el ID token en el servidor](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Google: crear Client ID y autorizar orígenes web](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [Google Android: Sign in with Google con Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg)
- [Plugin Cordova Google Plus: configuración y retorno de ID token](https://github.com/EddyVerbruggen/cordova-plugin-googleplus)
