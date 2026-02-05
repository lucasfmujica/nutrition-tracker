# 🚀 SEO Roadmap para LukenFit

## Estado Actual (2026-02-05)

### ✅ COMPLETADO HOY
- [x] Open Graph meta tags agregados
- [x] Twitter Card meta tags agregados
- [x] Canonical URL configurado
- [x] robots.txt creado
- [x] llms.txt creado
- [x] sitemap.xml básico creado

### ⚠️ PENDIENTE INMEDIATO
- [ ] **Crear imagen OG** (`og-image.jpg`) - Ver `OG_IMAGE_INSTRUCTIONS.md`
- [ ] **Bloquear registros públicos** - Ver `BLOCK_REGISTRATIONS.md`
- [ ] Verificar deployment de archivos en Vercel

---

## 🎯 MEJORAS SEO PRIORITARIAS

### Prioridad ALTA (Hacer esta semana)

#### 1. Imagen OpenGraph ⚠️ URGENTE
**Por qué**: Sin esta imagen, shares en redes sociales se ven genéricos
**Esfuerzo**: 30 minutos
**Impacto**: 🔥🔥🔥 Alto

**Acción**:
- Crear `og-image.jpg` (1200x630 px)
- Subir a `/public/og-image.jpg`
- Testear en: https://www.opengraph.xyz/

#### 2. Verificar Deployment en Vercel
**Por qué**: Los archivos estáticos deben estar accesibles públicamente
**Esfuerzo**: 10 minutos
**Impacto**: 🔥🔥🔥 Alto

**Verificación**:
```bash
# Después del deploy, verificar que estos URLs funcionan:
curl https://www.lukenfit.com/robots.txt
curl https://www.lukenfit.com/llms.txt
curl https://www.lukenfit.com/sitemap.xml
curl https://www.lukenfit.com/og-image.jpg
```

**Si fallan**:
- Verificar que Vite copia `/public/` al build
- Check `vite.config.ts` → publicDir debería ser `'public'`
- Rebuild y redeploy

#### 3. Google Search Console
**Por qué**: Para monitorear indexación y errores
**Esfuerzo**: 20 minutos
**Impacto**: 🔥🔥 Medio-Alto

**Pasos**:
1. Ir a: https://search.google.com/search-console
2. Agregar propiedad: `https://www.lukenfit.com`
3. Verificar dominio (DNS TXT record o HTML file)
4. Enviar sitemap: `https://www.lukenfit.com/sitemap.xml`
5. Solicitar indexación de homepage

#### 4. Structured Data (JSON-LD)
**Por qué**: Rich snippets en Google (estrellas, ratings, etc.)
**Esfuerzo**: 1 hora
**Impacto**: 🔥🔥 Medio

**Implementación**:
Agregar en `index.html` dentro de `<head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "LukenFit",
  "url": "https://www.lukenfit.com",
  "description": "Tu tracker personal de nutrición, entrenos y bienestar",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "Lucas F. Mujica"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "13"
  }
}
</script>
```

Validar en: https://validator.schema.org/

---

### Prioridad MEDIA (Hacer este mes)

#### 5. Meta Tags Dinámicos
**Por qué**: Cada tab debería tener su propio title/description
**Esfuerzo**: 3-4 horas
**Impacto**: 🔥🔥 Medio

**Problema actual**: Es SPA, todos los tabs comparten el mismo `<title>`

**Solución 1: react-helmet (Fácil pero limitado para SEO)**
```bash
npm install react-helmet-async
```

**Solución 2: Migrar a Next.js (Mejor para SEO pero mucho trabajo)**
- Next.js tiene SSR/SSG nativo
- Cada ruta tiene su propio meta
- Mejor para SEO en general

**Implementación con react-helmet**:

```tsx
// En cada Tab component:
import { Helmet } from 'react-helmet-async';

export function DashboardTab() {
  return (
    <>
      <Helmet>
        <title>Dashboard - LukenFit</title>
        <meta name="description" content="Panel principal con resumen de macros, entrenos y progreso" />
        <meta property="og:title" content="Dashboard - LukenFit" />
        <meta property="og:description" content="Panel principal con resumen de macros, entrenos y progreso" />
      </Helmet>
      {/* Tu componente... */}
    </>
  );
}
```

#### 6. Analytics y Tracking
**Por qué**: Entender tráfico y comportamiento de usuarios
**Esfuerzo**: 30 minutos
**Impacto**: 🔥🔥 Medio

**Opciones**:

**Google Analytics 4**:
1. Crear cuenta en: https://analytics.google.com
2. Crear propiedad "LukenFit"
3. Obtener Measurement ID (G-XXXXXXXXXX)
4. Agregar en `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Alternativa: Plausible Analytics (Privacy-first)**
- Más respetuoso con privacidad
- No requiere cookie consent
- https://plausible.io

#### 7. Performance Optimization
**Por qué**: PageSpeed afecta ranking en Google
**Esfuerzo**: 2-3 horas
**Impacto**: 🔥 Medio

**Acciones**:
1. Testear en: https://pagespeed.web.dev/
2. Comprimir imágenes (WebP, lazy loading)
3. Code splitting en Vite
4. Preconnect a Supabase:

```html
<link rel="preconnect" href="https://mroqjenlvgncutnfrjnr.supabase.co" />
<link rel="dns-prefetch" href="https://mroqjenlvgncutnfrjnr.supabase.co" />
```

5. Service Worker optimizations

---

### Prioridad BAJA (Nice to have)

#### 8. Blog/Content Marketing
**Por qué**: Contenido ayuda a ranking orgánico
**Esfuerzo**: Alto (continuo)
**Impacto**: 🔥 Bajo a largo plazo

**Ideas de contenido**:
- "Cómo calcular macros para ganar músculo"
- "Guía de tracking de calorías para principiantes"
- "Integración de Oura Ring con LukenFit"
- "Interpretación de datos de sueño y HRV"

#### 9. Landing Page Pública
**Por qué**: Actualmente la app está 100% detrás de auth
**Esfuerzo**: 4-6 horas
**Impacto**: 🔥 Bajo (si no buscas usuarios nuevos)

**Crear**:
- `/landing` → Página pública con features
- Screenshots de la app
- Call-to-action "Registrarse" (si abres registro)

#### 10. Social Media Integration
**Por qué**: Presencia en redes ayuda a awareness
**Esfuerzo**: Bajo (setup) + Alto (contenido)
**Impacto**: 🔥 Bajo a medio plazo

**Plataformas**:
- Instagram: Screenshots de progreso, tips de nutrición
- Twitter/X: Updates, tips rápidos
- YouTube: Tutoriales de uso

---

## 🚨 LIMITACIONES ACTUALES (SPA vs SSR)

### Problema Fundamental: React SPA

Tu app es una **Single Page Application** (SPA), lo que significa:

❌ **Mal para SEO**:
- Google ve HTML vacío inicialmente
- Content se carga con JavaScript
- Crawlers tienen dificultad para indexar
- No hay diferentes URLs para cada sección

✅ **Bien para PWA/UX**:
- Offline-first funciona perfecto
- Transiciones smooth entre tabs
- Performance excelente
- Service Worker funciona bien

### Solución a Largo Plazo: Migrar a Next.js

**Pros**:
- ✅ SSR/SSG para SEO perfecto
- ✅ Cada ruta tiene su propio meta
- ✅ Image optimization automático
- ✅ API routes built-in
- ✅ File-based routing

**Contras**:
- ❌ Trabajo considerable (2-3 semanas)
- ❌ Requiere refactor completo
- ❌ Service Worker requiere ajustes
- ❌ Hosting puede ser más caro

**Cuándo migrar**:
- Si planeas abrir la app al público
- Si necesitas SEO agresivo
- Si quieres blog/content integrado
- Si el proyecto va a escalar

**Cuándo NO migrar**:
- Si es solo para uso personal/amigos
- Si no te importa SEO
- Si priorizas offline-first
- Si no tienes tiempo/recursos

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs a Monitorear

1. **Google Search Console**:
   - Impresiones: cuántas veces aparece en búsquedas
   - Clicks: cuántos clicks desde Google
   - CTR (Click-Through Rate): % de clicks
   - Posición promedio en resultados

2. **PageSpeed Insights**:
   - Performance Score: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: 100

3. **Social Shares**:
   - Preview correcto en Facebook/Twitter/LinkedIn
   - Imagen OG visible
   - Descripción correcta

---

## 🔧 HERRAMIENTAS ÚTILES

### Testing SEO
- **OpenGraph**: https://www.opengraph.xyz/
- **Twitter Card**: https://cards-dev.twitter.com/validator
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
- **Schema Validator**: https://validator.schema.org/
- **PageSpeed**: https://pagespeed.web.dev/

### Monitoring
- **Google Search Console**: https://search.google.com/search-console
- **Google Analytics**: https://analytics.google.com
- **Plausible**: https://plausible.io
- **Uptime Robot**: https://uptimerobot.com (monitoreo de uptime)

---

## ✅ CHECKLIST DE DEPLOYMENT

Antes de cada deploy, verificar:

- [ ] `robots.txt` accesible
- [ ] `llms.txt` accesible
- [ ] `sitemap.xml` accesible
- [ ] `og-image.jpg` accesible
- [ ] Meta tags presentes en HTML
- [ ] Canonical URL correcto
- [ ] No hay errores en consola
- [ ] Performance Score > 80
- [ ] PWA manifest válido
- [ ] Service Worker registrado

---

## 🎓 RECURSOS DE APRENDIZAJE

### SEO Fundamentals
- Google SEO Starter Guide: https://developers.google.com/search/docs/beginner/seo-starter-guide
- Moz Beginner's Guide: https://moz.com/beginners-guide-to-seo

### React SEO
- Next.js SEO Best Practices: https://nextjs.org/learn/seo/introduction-to-seo
- React Helmet Async: https://github.com/staylor/react-helmet-async

### Technical SEO
- Web.dev (Google): https://web.dev/learn/
- Core Web Vitals: https://web.dev/vitals/

---

**Última actualización**: 2026-02-05
**Próxima revisión**: 2026-03-05
**Autor**: Claude Code
