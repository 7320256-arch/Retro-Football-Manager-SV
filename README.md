# Retro Football Manager SV

![Version](https://img.shields.io/badge/version-2.3-blue)
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

## v2.3 — Temporada 1: temas, logros y filtros (8 oct 2026)
- Filtro/orden de plantilla (nombre, posición, edad, media, estado; orden por atributos).
- 12 patrocinadores (6 por oferta). 8 temas + letra + bordes (☰ → Temas y estilo).
- Pestaña 🏅 Logros con catálogo completo. Cantera también para el DT.
- 🎁 Programa Embajador (embajador.js): compartir/invitar desbloquea ventajas permanentes (sin dinero).
- Economía: taquilla/TV/premio de liga más bajos; Centroamericana y CONCACAF pagan ×2.7–3.3 y dan bono de campeón.
- Fix: Selección aparecía vacía hasta "reparar partida".
- Archivos cambiados/nuevos: index.html, embajador.js (nuevo), modo-presidente.js, seleccion.js, sw.js (v13), README.md.

## v2.2 — Liguilla, CONCACAF y Selección (7 oct 2026)
- Liguilla del Apertura: 1° y 2° directo a semifinales; 3°–6° juegan repechaje; semifinal y final.
- CONCACAF: 16 cupos reales (Centroamericana, Caribe, Leagues Cup, México, EE.UU., Canadá), sin invitados. Centroamericana con cupos por país.
- Selección también como presidente (la federación dirige): convocatoria automática, parones FIFA (fechas 8 y 16), noticias de cada partido, desgaste/lesiones de tus convocados.
- Fix: intro tapaba los modales (Fundar club) y error al jugar partido de liguilla.
- Archivos cambiados: index.html, seleccion.js, sw.js.

## v2.1 — Economía, balance y arreglos (6 oct 2026)
- CONCACAF: el campeón/subcampeón de la Centroamericana ahora clasifica de verdad (se reemplazaba mal la edición terminada).
- Sin tope de caja (antes reseteaba ~$5M). Nuevo `economia.js`: reserva con depósitos y préstamos (monto + plazo), campañas de marketing, centros de entrenamiento/médico, fundación, oficina comercial, patrocinador secundario y decisiones de la directiva.
- Estadio: gradas y palcos con precios separados, tienda oficial, accesos, aforo por obra, asistencia según precio/rival/fans/marketing.
- Cantera, staff y DT rebalanceados; contratos con piso salarial 85% del valor justo, castigo de moral proporcional y un recorte por campaña.
- Renunciar como DT o presidente; pausar un reto y volver a la carrera; 11 objetos 3D nuevos.
- Archivos nuevos/cambiados: index.html, economia.js, modo-presidente.js, avatar3d.js, retos.js, sw.js (v10).

## v2.0 — Selección de El Salvador y Retos cortos (5 oct 2026)
- **Selección** (modo DT, pestaña 🇸🇻): se ofrece con reputación ≥ 56. Convocatoria de 23 (jugadores salvadoreños de la liga + 8 legionarios generados por semilla), esquema y mentalidad, ventanas FIFA tras las jornadas 8 y 16 de cada campaña. Ciclo de 4 años: Liga de Naciones → Copa Oro → Eliminatorias → Mundial (48 selecciones). Los partidos no afectan al club; pagan al monedero del probador. Solo se guardan resultados y una semilla (≈7 KB), no plantillas.
- **Retos cortos** (🎯): 5 escenarios (descenso, ascenso, Tercera, cuentas en rojo, racha), estrellas, reto del día con racha y compartir. Partida aparte (`rfm_sv_reto`), sin ranking online.
- Archivos nuevos: `seleccion.js`, `retos.js`; `sw.js` v9. Subir junto a los de v1.9.
