BLOQUE 1 – Fundamentos del Proyecto
1. Diferencias clave
Página web:
Una página web es un documento estático o conjunto de documentos accesibles mediante un navegador. Principalmente presenta información que los usuarios consumen de forma pasiva. Ejemplos incluyen blogs personales, sitios corporativos informativos, o portafolios. La interacción es mínima: leer, hacer clic en enlaces, ver imágenes o videos.
Aplicación web:
Una aplicación web es un software interactivo que funciona en el navegador y permite a los usuarios realizar tareas específicas, procesar datos y obtener resultados personalizados. Requiere autenticación, maneja estados de usuario, procesa información en tiempo real y ofrece funcionalidades complejas. Ejemplos: Gmail, Netflix, Spotify, Google Docs, sistemas bancarios en línea.
Diferencia principal: Las páginas web son informativas y estáticas; las aplicaciones web son funcionales e interactivas, permitiendo a los usuarios ejecutar acciones y transformar datos.

2. Ejemplos reales de aplicaciones web profesionales

Google Workspace (Docs, Sheets, Drive): Suite de productividad colaborativa en tiempo real
Trello/Asana: Gestión de proyectos y tareas
Figma: Diseño colaborativo de interfaces
Notion: Espacio de trabajo todo-en-uno para documentación y organización
Salesforce: CRM (gestión de relaciones con clientes) empresarial
Canva: Plataforma de diseño gráfico simplificado
Slack: Comunicación y colaboración en equipos
Shopify: Plataforma de comercio electrónico


3. Tipos de problemas que se resuelven con software
El software web resuelve problemas relacionados con:
Automatización: Eliminar tareas repetitivas manuales (facturación automática, generación de reportes, envío de correos programados).
Colaboración: Permitir que equipos distribuidos trabajen juntos en tiempo real (edición colaborativa de documentos, chat empresarial, gestión de proyectos).
Acceso a información: Centralizar y hacer accesible información desde cualquier lugar (bases de datos, sistemas de gestión documental, intranets).
Procesamiento de datos: Analizar grandes volúmenes de información y presentar insights (dashboards analíticos, herramientas de business intelligence).
Comunicación: Facilitar intercambios entre personas u organizaciones (redes sociales, plataformas educativas, sistemas de soporte al cliente).
Comercio: Vender productos o servicios en línea (tiendas virtuales, marketplaces, plataformas de reservas).
Gestión de procesos: Organizar flujos de trabajo complejos (sistemas ERP, CRM, gestión de recursos humanos).

4. Arquitectura general de aplicaciones web
Frontend (Cliente):
Es la capa visible con la que interactúan los usuarios. Incluye todo lo que sucede en el navegador: interfaz visual, interacciones, animaciones y lógica del lado del cliente. Tecnologías comunes: HTML, CSS, JavaScript, y frameworks como React, Vue o Angular. El frontend se comunica con el backend mediante APIs para solicitar o enviar datos.
Backend (Servidor):
Es la capa invisible que procesa la lógica de negocio, maneja datos y responde a las peticiones del frontend. Incluye: servidor web, lógica de aplicación, autenticación, autorización, procesamiento de datos y comunicación con bases de datos. Tecnologías comunes: Node.js, Python (Django/Flask), Java (Spring), PHP (Laravel), Ruby on Rails. Expone APIs (generalmente REST o GraphQL) que el frontend consume.
Infraestructura / Entornos:

Base de datos: Almacena información persistente (usuarios, productos, transacciones). Puede ser relacional (PostgreSQL, MySQL) o NoSQL (MongoDB, Redis).
Servidor web: Maneja peticiones HTTP (Nginx, Apache).
Entornos de desarrollo: Ambiente local donde programadores trabajan y prueban.
Entornos de staging: Réplica de producción para pruebas finales antes del lanzamiento.
Entornos de producción: Servidor real donde usuarios acceden a la aplicación.
Servicios en la nube: AWS, Google Cloud, Azure, Vercel, Netlify proporcionan hosting, almacenamiento, CDN, seguridad.
DevOps: Herramientas de integración continua/despliegue continuo (CI/CD), contenedores (Docker), orquestación (Kubernetes).


5. Análisis de plataformas reales
Para completar este punto necesitaría conocer la idea específica de tu equipo. Sin embargo, te doy un ejemplo de cómo analizar dos plataformas similares:
Ejemplo: Si tu proyecto es una plataforma educativa
Plataforma 1: Coursera

Propósito: Ofrecer cursos universitarios y certificaciones en línea
Funcionalidades clave: Catálogo de cursos, video streaming, evaluaciones automatizadas, foros de discusión, certificados digitales
Modelo de negocio: Freemium (cursos gratuitos con certificados pagos) y suscripciones
Tecnología visible: Videos adaptativos, sistema de progreso, gamificación
Fortalezas: Prestigio académico, contenido de calidad, certificaciones reconocidas
Debilidades: Puede ser costoso, interfaz a veces compleja

Plataforma 2: Duolingo

Propósito: Aprendizaje de idiomas gamificado
Funcionalidades clave: Lecciones interactivas, sistema de rachas, ranking social, ejercicios adaptativos
Modelo de negocio: Freemium con versión premium sin anuncios
Tecnología visible: Algoritmos adaptativos, notificaciones push, gamificación intensa
Fortalezas: Altamente adictivo, interfaz amigable, efectivo para principiantes
Debilidades: Limitado para niveles avanzados, puede ser repetitivo


BLOQUE 2 – Arquitectura de Información y Accesibilidad
1. Arquitectura de información
La arquitectura de información es la disciplina de organizar, estructurar y etiquetar contenido de manera efectiva y sostenible. Su objetivo es ayudar a los usuarios a encontrar información y completar tareas fácilmente.
Componentes principales:

Sistemas de organización: Cómo se agrupa el contenido (por categorías, alfabéticamente, cronológicamente, por temas)
Sistemas de etiquetado: Cómo se nombran las secciones y elementos (menús, botones, enlaces)
Sistemas de navegación: Cómo los usuarios se mueven por el sitio
Sistemas de búsqueda: Cómo los usuarios encuentran contenido específico

Metodologías: Card sorting (usuarios agrupan contenidos), inventarios de contenido, mapas de sitio, wireframes, flujos de usuario.

2. Jerarquías de contenido
Las jerarquías organizan la información de lo más importante a lo menos importante, creando niveles de prioridad visual y estructural.
Jerarquía visual:

Tamaño (elementos grandes = mayor importancia)
Color y contraste (colores vibrantes atraen atención)
Posición (arriba y centro = más visible)
Espaciado (más espacio alrededor = más énfasis)
Tipografía (negrita, cursiva, peso)

Jerarquía estructural:

Nivel 1: Página principal/home
Nivel 2: Categorías principales
Nivel 3: Subcategorías
Nivel 4: Páginas de contenido específico

Principio: Los usuarios deben entender en 3-5 segundos qué ofrece tu aplicación y cómo navegar.

3. Patrones de navegación web
Navegación principal (navbar):
Barra horizontal o vertical con enlaces a secciones principales. Debe ser consistente en todas las páginas.
Navegación breadcrumb (migas de pan):
Muestra la ruta de navegación: Inicio > Categoría > Subcategoría > Página actual. Ayuda a usuarios a saber dónde están.
Navegación por pestañas:
Organiza contenido relacionado en tabs/pestañas dentro de una misma página.
Navegación hamburger:
Menú oculto (tres líneas horizontales) común en móviles para ahorrar espacio.
Navegación contextual:
Enlaces relacionados dentro del contenido ("Ver también", "Productos relacionados").
Footer:
Navegación secundaria al pie de página (políticas, contacto, redes sociales, enlaces adicionales).
Búsqueda:
Campo de búsqueda siempre visible para acceso rápido.

4. Orden de tabulación
El orden de tabulación es la secuencia en que los elementos interactivos reciben foco cuando el usuario presiona la tecla Tab.
Buenas prácticas:

Debe seguir un orden lógico y predecible: de izquierda a derecha, de arriba hacia abajo
El atributo HTML tabindex permite controlar el orden:

tabindex="0" → elemento alcanzable en orden natural
tabindex="-1" → elemento no alcanzable con Tab (solo programáticamente)
tabindex="1, 2, 3..." → orden personalizado (evitar si es posible)


Elementos naturalmente enfocables: enlaces, botones, inputs, textareas, selects
Elementos no interactivos (div, span) no deberían estar en el orden de tabulación

Importancia: Usuarios con discapacidades motoras o que prefieren teclado dependen completamente de esto.

5. Navegación por teclado
La navegación por teclado permite usar una aplicación web completamente sin mouse.
Teclas estándar:

Tab: Avanzar al siguiente elemento enfocable
Shift + Tab: Retroceder al elemento anterior
Enter/Space: Activar botones o enlaces
Flechas: Navegar entre opciones (menús, radios, sliders)
Escape: Cerrar modales o menús
Home/End: Ir al inicio/final de listas o campos de texto

Indicadores visuales:

Elementos enfocados deben mostrar un outline visible (anillo de foco)
Nunca eliminar outline sin proporcionar alternativa visual clara
El contraste del foco debe cumplir WCAG (mínimo 3:1)

Estados interactivos:
:focus, :hover, :active deben estar claramente diferenciados.

6. Accesibilidad sin mouse
Hacer tu aplicación accesible sin mouse beneficia a personas con discapacidades motoras, usuarios de lectores de pantalla, y quienes prefieren eficiencia del teclado.
Principios WCAG (Web Content Accessibility Guidelines):
Perceptible: La información debe presentarse de manera que los usuarios puedan percibirla. Incluir texto alternativo para imágenes, subtítulos para videos, suficiente contraste de color.
Operable: Los usuarios deben poder navegar e interactuar. Todo debe ser accesible por teclado, dar tiempo suficiente para leer/interactuar, evitar contenido que cause convulsiones (parpadeos rápidos).
Comprensible: La información y operación de la interfaz debe ser comprensible. Usar lenguaje claro, comportamiento predecible, ayudar a evitar y corregir errores.
Robusto: El contenido debe ser interpretable por diversas tecnologías. Usar HTML semántico válido, compatible con lectores de pantalla.
Herramientas prácticas:

Atributos ARIA (Accessible Rich Internet Applications): aria-label, aria-describedby, aria-expanded
Elementos semánticos HTML5: <nav>, <main>, <article>, <aside>, <button>
Skip links: Enlaces invisibles que permiten saltar navegación repetitiva
Landmarks: Regiones identificables por lectores de pantalla
Formularios accesibles: <label> asociados correctamente, mensajes de error claros

Testing:

Navegar tu sitio solo con teclado
Usar lectores de pantalla (NVDA, JAWS, VoiceOver)
