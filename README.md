# Retro Football Manager SV

![Version](https://img.shields.io/badge/version-1.7-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-green)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

**Retro Football Manager SV** es una plataforma interactiva de simulación y gestión deportiva enfocada en el fútbol profesional salvadoreño. Diseñada bajo una arquitectura web ligera y progresiva, permite administrar aspectos tácticos, estratégicos y competitivos en tiempo real dentro del contexto de la liga local.

▶️ **[Acceder a la Aplicación (Despliegue Oficial)](https://7320256-arch.github.io/Retro-Football-Manager-SV/)**

---

## 📋 Especificaciones Técnicas

* **Arquitectura:** Aplicación Web Progresiva (PWA) con soporte de ejecución offline mediante *Service Workers*.
* **Motor de Simulación:** Desarrollado de forma nativa en Javascript (Vanilla JS). Usa Firebase (ranking y presencia online) y `<model-viewer>` (avatar 3D) como únicas dependencias externas; el juego completo funciona sin conexión.
* **Interfaz de Usuario:** Renderizado mediante HTML5/CSS3 optimizado para navegadores de escritorio y dispositivos móviles.
* **Sistema de Audio:** Módulo de audio dinámico integrado para ambientación de menús y estados del partido.

---

## 🆕 Novedades v1.7

* **Nombres únicos** de jugadores (partidas viejas se corrigen solas).
* **Reserva del club recuperable**: el excedente de presupuesto ya no se pierde; se retira desde Finanzas.
* **Guardado ~35 % más liviano**, se guarda al minimizar/cerrar y avisa si falta espacio.
* **Feedback opcional**, pestaña **🆕 Novedades** dentro del juego, interfaz móvil más legible.
* Instalación offline más ligera (ya no se descargan ~15 MB de golpe).

---

## ⚙️ Modos de Ejecución e Instalación

### Acceso Web Directo
Se puede acceder a la versión ejecutable directamente mediante cualquier navegador moderno compatible con estándares HTML5 y ECMAScript 6+.

### Instalación Local (PWA)
La plataforma está configurada como una PWA. Para instalarla de manera local:
1. Navegar a la URL oficial desde Chrome, Edge o Safari.
2. Seleccionar la opción **"Instalar aplicación"** o **"Añadir a la pantalla de inicio"** en el menú del navegador.
3. Ejecutar la aplicación de forma independiente sin requerir conexión continua a Internet.

---

## 🔒 Licencia, Propiedad Intelectual y Términos de Uso

**© 2026 7320256-arch. Todos los derechos reservados.**

### 1. Titularidad del Código Fuente y Recursos
Todo el código fuente (`index.html`, `sw.js`, scripts lógicos), estructura de diseño, gráficos y archivos multimedia (`.mp3`, `.json`, `.png`) contenidos en este repositorio son propiedad exclusiva del autor (**7320256-arch**).

### 2. Restricción de Licencia (No Open Source)
La publicación de este repositorio en GitHub se realiza exclusivamente con fines de alojamiento, despliegue público mediante GitHub Pages y demostración técnica. **No se concede ninguna licencia de código abierto (Open Source).**

Queda estrictamente prohibido a terceros:
* Copiar, duplicar, clonar o bifurcar (*fork*) el código fuente con fines de redistribución.
* Modificar, descompilar, adaptar o crear obras derivadas basadas en este proyecto.
* Reutilizar cualquier recurso gráfico o pista de audio en proyectos externos.
* Cualquier uso comercial o de monetización sin la autorización expresa por escrito del titular.

### 3. Exención de Marcas Registradas
Cualquier referencia a nombres de equipos, escudos, ligas o instituciones deportivas se utiliza únicamente con fines descriptivos e ilustrativos dentro del contexto de la simulación deportiva.

---

## ✉️ Contacto y Soporte

Para consultas institucionales, reporte de fallos técnicos o solicitudes de autorización: cseuropa1890@gmail.com 
* **Repositorio Oficial:** [7320256-arch/Retro-Football-Manager-SV](https://github.com/7320256-arch/Retro-Football-Manager-SV)

## v1.9 — Modo Presidente, Fundar club, Cantera y probador 3D (4 oct 2026)
- **Presidente** sobre un club existente: contratas DT y cuerpo técnico (7 puestos), cuidas caja y apoyo de socios; el DT dirige solo.
- **Fundar club** en Liga Amateur (8 equipos, 14 fechas); el campeón asciende a Tercera.
- **Elecciones**: desde la carrera de DT te postulas a presidente (reputación ≥55, ≥3 campañas, confianza ≥45); promesas, campaña y asamblea. Si te destituyen vuelves a DT.
- **Cantera**: academia nivel 1–5, camada anual de juveniles.
- **Probador 3D** (Three.js, 34 objetos) en DT y Presidente; sin WebGL muestra tarjeta alterna. Tema visual *Palco* solo en modo Presidente.
- Archivos nuevos que deben subirse junto a index.html: `avatar3d.js`, `modo-presidente.js`, `palco.css`, `three-lite.js`, y `sw.js` (v8).
