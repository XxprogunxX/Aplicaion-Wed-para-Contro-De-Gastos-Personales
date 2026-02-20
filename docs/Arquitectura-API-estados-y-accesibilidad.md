# Arquitectura de la API, Estados y Accesibilidad

## 1. Flujo general de consumo de la API

El frontend consume la API REST del backend a través de un cliente centralizado (`frontend/src/lib/api.ts`) que usa Axios. Todas las llamadas pasan por el mismo flujo.

**Inicio.** El usuario o la página dispara una acción que requiere datos del servidor (por ejemplo: listar gastos, crear gasto, login).

**Request.** El cliente API construye la petición con la URL base (`NEXT_PUBLIC_API_URL`), headers `Content-Type: application/json` y, si existe token en `localStorage`, el header `Authorization: Bearer <token>`. No se hacen llamadas directas a `fetch` o Axios desde componentes; siempre se usa el cliente `api` o un hook que lo encapsule.

**Llamada asíncrona.** La capa de UI no llama a `api` directamente en la mayoría de los casos. Se usa el hook `useApi<T>()` (`frontend/src/hooks/useApi.ts`), que expone `execute(apiCall)`. El componente pasa una función que devuelve la promesa de la llamada (por ejemplo `() => api.getGastos()`). El hook pone el estado en loading, ejecuta la promesa y actualiza data o error según el resultado.

**Respuesta correcta.** Si el servidor responde con 2xx, el interceptor de Axios devuelve la respuesta tal cual. El hook guarda los datos en `state.data`, pone `loading: false` y `error: null`. El componente puede leer `data` y mostrarla (estado success implícito).

**Respuesta de error.** Si el servidor responde con 4xx o 5xx, el interceptor de respuesta convierte el error en un objeto con forma `ApiError`: `{ error: true, message: string, status: number }`. El mensaje se toma de `response.data.message` si existe; si no, se usa un texto por defecto. Si no hay respuesta (error de red), se lanza un ApiError con mensaje de conexión y status 0. El hook guarda ese objeto en `state.error`, pone `loading: false` y `data: null`, y opcionalmente re-lanza el error para que el componente pueda reaccionar.

**UI.** El componente que usa `useApi` debe comprobar `loading`, `error` y `data` para decidir qué mostrar: un loader mientras carga, un mensaje o componente de error si `error` no es null, o el contenido con `data` en caso de éxito. Así se cubren los tres estados globales (loading, error, success) de forma consistente.

## 2. Estados globales: loading, error, success

Los estados que debe manejar la UI al consumir la API son tres. Se modelan en el hook `useApi` y se reflejan en la interfaz.

**Loading.** Indica que hay una petición en curso. En `useApi` se activa al llamar a `execute` y se desactiva cuando la promesa se resuelve o se rechaza. El componente debe mostrar un indicador de carga accesible (por ejemplo el componente `Loading`) y, si aplica, deshabilitar botones o formularios para evitar envíos duplicados. No se considera un estado "global" de aplicación tipo Redux: cada uso de `useApi` tiene su propio loading; si se necesita un loading global (por ejemplo barra superior), se puede centralizar más adelante con contexto o estado global.

**Error.** Indica que la última petición falló. En `useApi` se guarda en `state.error` con tipo `ApiError` (`error: true`, `message`, `status`). El componente debe mostrar el mensaje al usuario (por ejemplo con el componente `Alert` type="error") y ofrecer una acción de recuperación cuando tenga sentido (reintentar, volver, cerrar). El hook expone `reset()` para limpiar error (y data) sin hacer una nueva petición.

**Success.** No hay un booleano explícito "success". Se considera éxito cuando `loading === false` y `error === null` y, en muchos casos, `data !== null`. El componente muestra entonces el contenido basado en `data`. Para acciones que no devuelven datos (por ejemplo eliminar), success se interpreta como "no loading y no error" y la UI puede mostrar un mensaje breve de confirmación o actualizar la lista.

Criterio de uso: en cualquier pantalla que llame a la API, comprobar siempre los tres casos (loading, error, data/success) y asegurar que en cada momento solo se muestre uno de ellos de forma clara (evitar mostrar datos y error a la vez, o loader y error a la vez).

## 3. Criterios de accesibilidad en carga y errores

**Carga (loaders).** El indicador de carga debe ser anunciado por lectores de pantalla. En este proyecto el componente `Loading` usa un elemento con `role="status"` y `aria-label` con el texto de carga (por defecto "Cargando..."). El texto visible y el aria-label deben coincidir y ser descriptivos (por ejemplo "Cargando gastos..."). Evitar que el loader sea solo decorativo: debe tener `role="status"` o `aria-live="polite"` y un nombre accesible. No cubrir toda la pantalla con un overlay sin anunciar el estado; si se usa overlay, incluir en él el mismo `role="status"` y aria-label. Durante la carga, el foco no debe perderse: si se deshabilita un botón, el foco puede moverse al loader o mantenerse en un elemento que siga siendo focusable.

**Errores.** Los mensajes de error deben presentarse como alertas. Usar `role="alert"` para que se anuncien de inmediato (o el componente `Alert` que ya lo usa). El mensaje debe ser claro y accionable para el usuario, no técnico. Si el error está asociado a un campo de formulario, usar `aria-describedby` apuntando al id del mensaje de error y `aria-invalid="true"` en el campo. En páginas de error completas (404, 500), el proyecto ya incluye un bloque con `aria-live="assertive"` y texto para lectores de pantalla: en `not-found.tsx` ("Error 404. Página no encontrada.") y en `error-500.tsx` ("Error 500. Error interno del servidor"). Cualquier botón de "Reintentar" o "Volver" debe ser focusable y accionable por teclado; en la página 500 se mantiene un manejo de foco para facilitar la navegación.

**Resumen.** Loaders: `role="status"` y aria-label descriptivo, texto visible coherente. Errores: `role="alert"`, mensaje claro, relación con campos cuando aplique. Páginas de error: anuncio con aria-live y navegación por teclado clara.

## 4. Revisión de arquitectura entre frontend y backend

**Backend.** Servidor Express en `backend/`. En el estado actual del proyecto expone el endpoint de salud `GET /health` y las rutas de gastos bajo `GET/POST/PUT/DELETE /api/gastos` (y subrutas `/:id`), protegidas por `authMiddleware`. Otras rutas (auth, categorías, presupuestos, reportes) están previstas en el cliente del frontend pero aún no están montadas en el backend. Usa middlewares de body (`express.json()`), autenticación (`authMiddleware` en rutas protegidas), manejo de rutas no encontradas (`notFoundHandler`) y manejo global de errores (`errorHandler`). Los controladores devuelven JSON; en error siempre con la forma `{ error: true, message, status }`. Algunos controladores en éxito envían `{ error: false, message, data }`; otros envían directamente el recurso. Para una arquitectura clara, se recomienda unificar: respuestas de error siempre `{ error, message, status }`; respuestas de éxito o bien solo el payload (y el cliente asume 2xx) o bien un formato único como `{ data }` o `{ success, data, message }`.

**Frontend.** Aplicación Next.js en `frontend/` con App Router. La capa de datos se compone de: (1) cliente API (`lib/api.ts`), instancia única de Axios con baseURL, interceptor de token e interceptor de errores que normaliza a `ApiError`; (2) hook `useApi` que gestiona loading, error y data por llamada; (3) tipos en `types/index.ts` alineados con la API (Gasto, Categoria, ApiError, etc.). Las páginas y componentes no deben crear nuevas instancias de Axios ni llamar a `fetch` directamente; deben usar `api` y, preferiblemente, `useApi` para tener loading/error/success de forma uniforme.

**Contrato.** La API es REST; el cliente espera JSON. Los códigos HTTP indican el resultado (2xx éxito, 4xx error de cliente, 5xx error de servidor). El frontend espera que en error el cuerpo tenga al menos `message` (string) y opcionalmente `status`. El backend ya envía ese formato en los middlewares y en los controladores que devuelven error; conviene que todos los controladores que lancen error usen `next(err)` o respondan con el mismo esquema para que el interceptor del frontend siempre reciba un mensaje consistente.

**Despliegue.** Backend y frontend son independientes: el frontend usa `NEXT_PUBLIC_API_URL` para saber la base URL del backend. En el código actual el backend usa por defecto el puerto 3001 (`backend/src/index.js`) y el frontend en desarrollo corre en el puerto 3001 (`frontend/package.json`: `next dev -p 3001`); el fallback de la URL de la API en `frontend/src/lib/api.ts` es `http://localhost:3000`. Para desarrollo local sin conflicto de puertos, ejecutar el backend en 3000 (por ejemplo `PORT=3000 node backend/src/index.js` o configurar en `.env`) y el frontend en 3001, o ejecutar el backend en 3001 y el frontend en otro puerto y definir `NEXT_PUBLIC_API_URL=http://localhost:3001`. En producción se configura la URL del API en el frontend. No hay proxy obligatorio; CORS debe estar permitido en el backend para el origen del frontend.

## 5. Mensajes de error consistentes

**Backend.** Todos los errores que llegan al usuario deben tener el mismo formato JSON: `{ error: true, message: string, status: number }`. El `message` debe ser breve, en español y orientado al usuario (no stack traces ni detalles internos). Ejemplos ya usados en el proyecto: "Ruta no encontrada" (404), "Gasto no encontrado" (404), "Datos incompletos" (400), "Error interno del servidor" (500). Los controladores que devuelven error deben usar ese mismo esquema; los que delegan en el middleware con `next(err)` dependen de que el error tenga `status` y `message` para que el `errorHandler` los use. Se recomienda definir constantes o un pequeño módulo de mensajes (por código HTTP o por tipo de error) para reutilizar los mismos textos en todos los controladores.

**Frontend.** El interceptor de Axios ya normaliza a `ApiError`: `message` viene de `response.data.message` o de mensajes por defecto ("Error desconocido", "Error de conexión. Verifica tu conexión a internet.", "Error interno de la aplicación."). Los componentes que muestran error deben usar siempre `error.message` para el texto en pantalla, de modo que el usuario vea el mismo mensaje que envió el backend o uno de estos fallbacks. No mostrar `error.status` al usuario salvo en contextos de depuración; para accesibilidad basta con el mensaje en `role="alert"`. Si en el futuro el backend envía códigos de error (por ejemplo `code: "VALIDATION_ERROR"`), el frontend puede mapear códigos a mensajes locales para mantener consistencia y permitir traducción.

**Resumen.** Backend: un solo formato de error, mensajes en español y no técnicos. Frontend: mostrar solo `error.message`, mismo criterio para todos los componentes (Alert, páginas de error, formularios).

## 6. Entregables del Tech Lead

### 6.1 Diagrama de flujo de la comunicación asíncrona

Incluido en la sección 2 de este documento. El diagrama en ASCII describe el flujo desde el componente hasta el backend y de vuelta, pasando por el hook `useApi`, el cliente API, los interceptores, el middleware y controladores del backend, y la actualización de estados (loading, data, error) en el frontend. Puede trasladarse a Mermaid o a otra herramienta si se prefiere un diagrama gráfico; la secuencia descrita se mantiene.

### 6.2 Documentación de arquitectura

La sección 5 de este documento constituye la documentación de arquitectura entre frontend y backend: responsabilidades del backend (Express, rutas, middlewares, formato de error), del frontend (Next.js, cliente API, hook useApi, tipos), contrato de la API (REST, JSON, formato de error) y consideraciones de despliegue (variables de entorno, CORS). Para más detalle por módulo, se puede ampliar con descripción de cada ruta en `backend/src/routes` y de cada método del cliente en `frontend/src/lib/api.ts`.

### 6.3 Normas para loaders y errores accesibles

A continuación se resumen las normas que debe cumplir el proyecto para loaders y errores accesibles.

**Loaders (indicadores de carga).**

- Todo indicador de carga debe tener `role="status"` para que los lectores de pantalla lo anuncien.
- Proporcionar un `aria-label` descriptivo (por ejemplo "Cargando gastos", "Enviando formulario"). El texto visible del loader y el aria-label deben ser el mismo o equivalentes.
- No usar solo un spinner visual sin nombre accesible; si el loader es un ícono, envolverlo o asociarlo a un elemento con `role="status"` y aria-label.
- En formularios o botones que disparan la petición, mientras `loading` sea true deshabilitar el botón de envío y, si se desea, mostrar el loader junto al botón o en la zona de contenido que se está cargando.
- Evitar overlays de carga que bloqueen toda la pantalla sin anunciar el estado; si se usan, incluir en el overlay el mismo `role="status"` y aria-label.

**Errores (mensajes y pantallas).**

- Todo mensaje de error mostrado al usuario debe estar en un contenedor con `role="alert"` para que se anuncien de inmediato (el componente `Alert` del proyecto ya lo cumple).
- El texto del error debe ser el `message` devuelto por la API o el fallback del cliente; ha de ser claro y accionable, no técnico.
- En formularios, si el error es por campo: asociar el mensaje al input con `aria-describedby` y marcar el campo con `aria-invalid="true"` cuando haya error de validación.
- En páginas de error completas (404, 500): incluir un elemento con `aria-live="assertive"` (o "polite") y `aria-atomic="true"` que resuma el error para lectores de pantalla (por ejemplo "Error 404. Página no encontrada").
- Los botones de recuperación (Reintentar, Volver al inicio) deben ser focusable y activables por teclado; en páginas de error críticas se recomienda mantener el foco en un elemento lógico (título o primer enlace) al montar la página.

**Consistencia.**

- Usar el componente `Loading` para indicadores de carga y el componente `Alert` (type="error" o el que corresponda) para errores in-page, de modo que todos cumplan las normas anteriores por defecto.
- Revisar que en ninguna pantalla se muestren a la vez loader y mensaje de error; la transición debe ser loading → success (datos) o loading → error (mensaje).

Con estas normas se asegura que la carga y los errores sean accesibles y coherentes en todo el proyecto.

## 7. Adaptación al proyecto actual

Este documento está alineado con el código del repositorio: cliente en `frontend/src/lib/api.ts`, hook en `frontend/src/hooks/useApi.ts`, tipos en `frontend/src/types/index.ts`, componente `Loading` en `frontend/src/components/ui/Loading.tsx`, componente `Alert` en `frontend/src/components/ui/Alert.tsx`, backend en `backend/src/index.js`, controlador de gastos en `backend/src/controllers/gastosController.js`, middlewares de error en `backend/src/middleware/errorHandler.js` y `notFoundHandler.js`, y páginas de error en `frontend/src/app/not-found.tsx` y `frontend/src/app/pantalla-de-errores/error-500.tsx`. En el estado actual, el backend solo monta las rutas `/api/gastos` y `/health`; el cliente API ya define métodos para auth, categorías, presupuestos y reportes para cuando esas rutas existan. Las respuestas de éxito del controlador de gastos tienen la forma `{ error: false, message, data }`; si el cliente devuelve `response.data` sin extraer `data`, los componentes deben usar `data.data` para obtener el array de gastos (o se puede normalizar en el cliente). Por defecto el backend usa el puerto 3001 y el frontend en desarrollo también (Next.js en 3001); la URL base de la API en el frontend es `NEXT_PUBLIC_API_URL` con fallback `http://localhost:3000`. Para evitar conflicto de puertos, conviene ejecutar el backend en 3000 (`PORT=3000`) y el frontend en 3001, o asignar otro puerto al frontend y configurar `NEXT_PUBLIC_API_URL` al puerto donde corre el backend.</content>
<parameter name="filePath">c:\Users\oscar\Desktop\Aplicaion-Wed-para-Contro-De-Gastos-Personales\docs\Arquitectura-API-estados-y-accesibilidad.md