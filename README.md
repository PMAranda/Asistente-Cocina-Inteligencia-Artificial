# 👨‍🍳 Asistente de Cocina IA

Un asistente inteligente en tiempo real que detecta objetos en tu cocina usando visión por computadora. ¡Recibe alertas útiles mientras cocinas!

---

## Características

- **Detección en tiempo real** de objetos de cocina usando el modelo COCO-SSD
- **Alertas inteligentes** que te ayudan a cocinar de forma segura
- **Seguimiento de tiempo** de objetos detectados (ej: cuánto tiempo llevas con el cuchillo)
- **Mini-log dinámico** con últimas detecciones
- **Interfaz moderna y responsive** que funciona en cualquier dispositivo
- **Control total** sobre el umbral de confianza para reducir falsos positivos

---

## 🎯 Alertas Disponibles

| Alerta | Descripción |
|--------|-------------|
| 🔪 **Cuchillo** | Te recuerda guardar el cuchillo después de 60 segundos de uso |
| 🥤 **Copa + Botella** | Sugiere si quieres tomar algo |
| 🍲 **Microondas** | Advierte sobre objetos metálicos |
| 🔥 **Horno** | Alerta sobre objetos de plástico |
| 📱 **Teléfono + Botella** | Cuidado con derrames sobre el móvil |
| 🍎 **Frutas** | Recordatorios de lavado antes de comer |

---

## Inicio Rápido

### Requisitos
- Navegador moderno con soporte para WebRTC (Chrome, Firefox, Safari, Edge)
- Cámara web conectada
- Conexión a internet (para cargar modelos)

### Instalación

```bash
# Clona el repositorio
git clone https://github.com/PMAranda/Asistente-Cocina-Inteligencia-Artificial
cd Asistente-Cocina-Inteligencia-Artificial

# Abre directamente en tu navegador
# No requiere instalación de dependencias adicionales
open index.html
```

O usa un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx http-server
```

Luego accede a `http://localhost:8000`

---

## Cómo Usar

1. **Habilitar cámara**: Haz clic en el botón "Habilitar cámara" una vez que el modelo se haya cargado
2. **Ajustar umbral**: Usa el slider de confianza para filtrar detecciones falsas (0.0 - 1.0)
3. **Activar/Desactivar detección**: Usa el botón de toggle para pausar las detecciones sin apagar la cámara
4. **Monitorear**: Observa el mini-log en el panel derecho y las alertas en la parte inferior

---

## Tecnologías

- **TensorFlow.js** - Framework de ML en el navegador
- **COCO-SSD** - Modelo preentrenado de detección de objetos
- **HTML5 Canvas API** - Renderización de video y detecciones
- **Vanilla JavaScript** - Sin frameworks innecesarios
- **CSS3** - Diseño moderno y responsive

---

---

## Configuración Avanzada

### Objetos Detectados

Puedes modificar la lista de objetos de cocina en `index.js`:

```javascript
const kitchenObjects = ["knife", "fork", "spoon", "bowl", "cup", 
                        "toaster", "oven", "refrigerator", ...];
```

### Parámetros de Tiempo

```javascript
const TIME_MAX = 60000;        // 60 segundos antes de alertar (cuchillo)
const RESET_THRESHOLD = 1000;  // 1 segundo sin detectar = reset de acumulado
```

### Alertas Personalizadas

Añade tus propias alertas en la función `predictWebcam()`:

```javascript
if (detectedSet.has('tu_objeto')) {
  showBottomMessage('clave', 'Tu mensaje aquí', { 
    autoHideSec: 5, 
    colorDot: '#ff0000' 
  });
}
```
---

## 🐛 Troubleshooting

**La cámara no se activa**
- Verifica permisos de cámara en el navegador
- Asegúrate que solo una aplicación usa la cámara
- Recarga la página

**Detecciones falsas**
- Aumenta el umbral de confianza (mueve el slider a la derecha)
- Mejora la iluminación del área

**Modelo tarda en cargar**
- Es normal en primera carga (~30MB)
- Se cachea automáticamente después
- Verifica tu conexión a internet

---

---

## Privacidad

- ✅ Todas las detecciones ocurren **localmente en tu dispositivo**
- ✅ No se envía video a servidores externos
- ✅ La cámara se desactiva cuando lo solicites
- ✅ Los datos se procesan únicamente en tu navegador

---

## 💡 Ideas Futuras

- [ ] Soporte para modelos personalizados entrenados
- [ ] Historial de detecciones exportable
- [ ] Modo oscuro
- [ ] Soporte multiidioma
- [ ] Configuración de alertas personalizables por usuario
- [ ] Estadísticas de uso en tiempo real
- [ ] Integración con dispositivos IoT

---
