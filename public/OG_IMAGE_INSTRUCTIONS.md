# Instrucciones para Imagen OpenGraph

## ⚠️ ACCIÓN REQUERIDA

Necesitas crear una imagen `og-image.jpg` para las redes sociales.

### Especificaciones Técnicas
- **Dimensiones**: 1200x630 píxeles (aspect ratio 1.91:1)
- **Formato**: JPG (mejor compresión) o PNG
- **Peso**: < 1MB (ideal: 200-300KB)
- **Ubicación**: `/public/og-image.jpg`

### Contenido Recomendado
La imagen debe incluir:
1. **Logo de LukenFit** (si tienes)
2. **Texto principal**: "LukenFit"
3. **Subtítulo**: "Tu Tracker Personal de Nutrición y Entrenos"
4. **Background**: Colores de tu marca (azul #3B82F6, slate #0F172A)
5. **Iconos**: Comida, pesas, corazón (opcional)

### Herramientas para Crear la Imagen

**Opción 1: Canva (Fácil)**
1. Ir a https://www.canva.com
2. Crear diseño personalizado: 1200x630 px
3. Usar template "Facebook Post" o "Social Media"
4. Agregar texto + logo + colores de marca
5. Descargar como JPG

**Opción 2: Figma (Profesional)**
1. Frame de 1200x630 px
2. Diseñar con tipografía consistente
3. Export > JPG > Quality 85%

**Opción 3: IA Generativa (Rápido)**
Prompt para DALL-E / Midjourney:
```
"Modern fitness and nutrition tracking app social media banner,
1200x630 pixels, blue gradient background (#3B82F6 to #0F172A),
clean sans-serif typography showing 'LukenFit',
minimalist icons for food and exercise, professional tech aesthetic"
```

### Después de Crear la Imagen

1. Guardar como `og-image.jpg`
2. Colocar en `/public/og-image.jpg`
3. Verificar tamaño: debe ser < 1MB
4. Testear en: https://www.opengraph.xyz/
   - URL: https://www.lukenfit.com
5. Verificar preview en:
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### Ejemplo de Texto en Imagen

```
┌──────────────────────────────────────────┐
│                                          │
│          [Logo/Icon]                     │
│                                          │
│           LukenFit                       │
│                                          │
│  Tu Tracker Personal de Nutrición       │
│         y Entrenos                       │
│                                          │
│   📊 Macros  💪 Workouts  📈 Progress   │
│                                          │
└──────────────────────────────────────────┘
```

### Colores de Marca LukenFit
- Primary: #3B82F6 (Blue)
- Dark: #0F172A (Slate)
- Light: #F9FAFB (Background)

---

**Estado**: ⚠️ PENDIENTE - Crear y subir imagen
**Prioridad**: ALTA
**Impacto**: Sin esta imagen, los shares en redes sociales se verán genéricos
