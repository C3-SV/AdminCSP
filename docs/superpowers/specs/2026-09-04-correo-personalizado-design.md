# Correo personalizado desde admin — diseño

## Objetivo

Agregar una página protegida al administrador para redactar y enviar correos personalizados por Brevo, usando el remitente no-reply ya configurado, el estilo visual de C3 y la infraestructura existente de autorización, bloqueo global, modo dry-run/live, idempotencia e historial.

Los borradores quedan explícitamente fuera de esta versión.

## Experiencia de usuario

La navegación lateral incluirá **Correo personalizado** en `/admin/correo-personalizado`. La página mostrará:

- remitente configurado, de solo lectura;
- campos multilínea Para, CC y CCO;
- asunto;
- editor ligero con párrafo, encabezados, negrita, cursiva, listas y enlaces;
- vista previa en vivo dentro del contenedor visual usado por los correos C3;
- conteos de direcciones válidas y errores concretos;
- botón de envío con confirmación previa y estado de carga.

Las direcciones podrán pegarse separadas por comas, punto y coma o saltos de línea. Se normalizarán a minúsculas y se deduplicarán con prioridad Para → CC → CCO. Para debe contener al menos un correo válido. No se permitirá enviar mientras haya direcciones inválidas.

## Editor y seguridad

Se usará un editor de texto enriquecido ligero, sin agregar dependencias. La barra insertará sintaxis controlada para encabezados, negrita, cursiva, listas y enlaces. Un parser centralizado convertirá esa sintaxis a HTML seguro y texto plano.

El parser escapará primero todo HTML ingresado por el usuario y únicamente generará las etiquetas permitidas por la barra. No se aceptará HTML arbitrario, scripts, estilos ni atributos peligrosos. Los enlaces sólo admitirán `http://`, `https://` y `mailto:`.

El asunto y el cuerpo tendrán límites de longitud validados tanto en cliente como en servidor. El servidor volverá a parsear y validar todo; nunca confiará en el HTML de la vista previa.

## Envío y persistencia

Se extenderá `sendBrevoEmail` de forma compatible para aceptar múltiples destinatarios Para y una lista CCO. Los flujos existentes que pasan un único destinatario seguirán funcionando sin cambios.

La ruta `POST /api/admin/emails/custom` exigirá un administrador autorizado. El servicio:

1. validará `operationId`, destinatarios, asunto y cuerpo;
2. comprobará que el interruptor global de correos esté habilitado;
3. reservará `custom_<operationId>` en `emailOutbox`;
4. generará HTML y texto plano;
5. enviará mediante Brevo usando el remitente fijo del entorno;
6. aplicará sandbox cuando `CSP_EMAIL_DELIVERY_MODE` no sea `live`;
7. registrará `sent`, `dry_run` o `failed` en `email_logs`.

Cada acción explícita del usuario generará un `operationId` nuevo. Repetir accidentalmente la misma operación no volverá a enviar. El historial guardará asunto, Para, CC, CCO, estado, `messageId`, error, administrador y timestamps. No guardará el cuerpo del mensaje ni creará borradores.

## Compatibilidad del historial

Se añadirá el tipo `custom` a `EmailLogType`, junto con `bcc`. Los campos de equipo pasarán a ser opcionales para este tipo. La tabla consolidada mostrará **Correo personalizado**, utilizará `—` cuando no haya equipo e incluirá CC/CCO en su búsqueda.

## Manejo de errores

- Una dirección inválida mostrará qué entrada debe corregirse.
- Para vacío, asunto vacío o cuerpo vacío bloquearán el envío.
- El interruptor global apagado devolverá el mismo error operativo de los demás correos.
- Un fallo de Brevo quedará registrado como `failed` sin exponer credenciales.
- Durante el envío se deshabilitará el botón para evitar doble clic.
- La confirmación mostrará el modo de entrega y los conteos de Para, CC y CCO.

## Verificación

Las pruebas cubrirán separación por coma/punto y coma/salto, normalización, inválidos, deduplicación entre campos, escape de HTML, formatos permitidos, enlaces inseguros, payload múltiple de Brevo con CCO, idempotencia, bloqueo global y registro de resultados. La verificación local usará mocks y modo seguro; no hará llamadas reales a Brevo.
