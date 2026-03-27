# 🥁 Gesture Drums

Batería virtual controlada por gestos de las manos mediante seguimiento en tiempo real con la cámara web. Tus dedos índice se convierten en baquetas — haz movimientos de golpe hacia abajo para tocar los tambores.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![MediaPipe](https://img.shields.io/badge/MediaPipe-4285F4?style=flat&logo=google&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-FF6F00?style=flat)

## ✨ Características

- **Seguimiento de manos en tiempo real** — Detección de gestos mediante MediaPipe Hands con hasta 2 manos simultáneas
- **Síntesis de audio completa** — Todos los sonidos generados en tiempo real con Web Audio API (sin samples externos)
- **13 zonas de batería** — Hi-Hat (abierto/cerrado), Snare, Toms (High, Mid, Floor), Crash (x2), Ride, Ride Bell, Rim Shots (x2), Kick
- **🎶 Sistema de aprendizaje** — Patrones guíados con señales visuales de color por nivel:
  - 🟢 **Básico** — Hi-Hat, Kick+Snare, Rock Simple
  - 🟡 **Medio** — Rock 8th Notes, Funk, Disco
  - 🔴 **Avanzado** — Paradiddle, Blues Shuffle, Bossa Nova
  - ⭐ **Ritmos Famosos** — Billie Jean, We Will Rock You, Back in Black, Smells Like Teen Spirit, Stayin' Alive y más
- **Control de Hi-Hat por puño** — Puño cerrado = Hi-Hat cerrado, mano abierta = Hi-Hat abierto
- **Metrónomo integrado** — BPM ajustable (40–240), con acento en el primer tiempo
- **Dos estilos visuales** — Clásico (textura de madera) y Neón (brillos azul/rosa)
- **Respuesta a velocidad** — Golpes más fuertes = mayor volumen y pitch
- **Efectos visuales** — Ondas expansivas y brillos al golpear
- **HUD en tiempo real** — FPS, latencia, indicador de último golpe, barras de velocidad

## 🚀 Demo en Vivo

👉 **[Abrir Gesture Drums](https://csav20.github.io/gesture-drums/)** — Funciona directo desde el navegador, sin instalar nada.

1. Haz clic en **"Iniciar Cámara"**
2. Permite el acceso a la cámara
3. ¡Empieza a tocar moviendo tus dedos índice hacia abajo sobre los tambores!
4. Prueba el modo **🎶 Patrones** para aprender ritmos

## 📋 Requisitos

- Navegador moderno (Chrome, Edge, Firefox) con soporte para:
  - WebGL
  - Web Audio API
  - Canvas API
- Cámara web
- Conexión HTTPS o localhost (requerido por MediaPipe)

## 🛠️ Instalación y Uso

### Opción 1: Live Server (recomendado)

```bash
npx live-server --port=5500 --no-browser
```

Luego abre `http://localhost:5500` en tu navegador.

### Opción 2: Python HTTP Server

```bash
python3 -m http.server 8001
```

Luego abre `http://localhost:8001` en tu navegador.

### Opción 3: Abrir directamente

Abre `index.html` directamente en tu navegador (algunas funciones pueden requerir un servidor local).

## ⌨️ Controles de Teclado

| Tecla | Acción |
|-------|--------|
| `M` | Activar/desactivar metrónomo |
| `V` | Mostrar/ocultar feed de cámara |
| `S` | Cambiar estilo del kit (Clásico/Neón) |
| `↑` / `↓` | Ajustar BPM del metrónomo |

## 📁 Estructura del Proyecto

```
gesture-drums/
├── index.html              # Punto de entrada principal
├── css/
│   └── style.css           # Estilos (tema oscuro, opción neón)
├── js/
│   ├── app.js              # Lógica principal e integración
│   ├── audioEngine.js      # Sintetizador de sonidos de batería
│   ├── drumKit.js          # Renderizado visual del kit
│   ├── handTracker.js      # Wrapper de MediaPipe para detección de manos
│   └── hitDetector.js      # Detección de golpes basada en velocidad
└── README.md
```

## 🏗️ Arquitectura

```
Cámara (Input)
    ↓
HandTracker (MediaPipe) → Suavizado de landmarks → Visualización de manos
    ↓
HitDetector (Velocidad) → Detección de golpes + mapeo de zonas
    ↓
AudioEngine (Web Audio) → Síntesis de sonido en tiempo real
    ↓
DrumKit (Canvas) → Feedback visual (ondas, brillos)
    ↓
App.js (Orquestador) → Game loop, controles, HUD
```

## 🔧 Tecnologías

- **MediaPipe Hands** — Detección y seguimiento de poses de manos
- **Web Audio API** — Síntesis de audio en tiempo real
- **Canvas API** — Renderizado 2D del kit y visualizaciones
- **Vanilla JavaScript** — Sin frameworks, código puro

## ⚙️ Parámetros Ajustables

El panel de configuración (⚙️) permite ajustar:

- **Umbral de velocidad de golpe** — Sensibilidad de detección (0.003–0.025)
- **Cooldown entre golpes** — Tiempo mínimo entre golpes (30–200ms)
- **Velocidad máxima de mapeo** — Rango de respuesta dinámica (0.02–0.10)
- **Suavizado de manos** — Factor de filtro EMA (0.2–1.0)

## � Autores

Proyecto colaborado y desarrollado por:

- **Claudio** ([@Csav20](https://github.com/Csav20)) — Diseño, concepto y desarrollo
- **Claude AI** (Anthropic) — Asistencia en desarrollo y programación

## �📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
