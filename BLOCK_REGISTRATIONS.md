# 🔒 Guía: Bloquear Registros Públicos en LukenFit

## OPCIÓN 1: Supabase Dashboard (RECOMENDADA) ⭐

### Paso 1: Ir a Supabase Dashboard
1. Abrir: https://supabase.com/dashboard/project/mroqjenlvgncutnfrjnr
2. Login con tu cuenta de Supabase

### Paso 2: Deshabilitar Sign-ups Públicos
1. En el sidebar izquierdo → Click en **Authentication**
2. Click en **Settings** (dentro de Authentication)
3. Scroll hasta encontrar **"Enable email confirmations"**
4. **DESHABILITAR**: "Allow new users to sign up"
   - Toggle a OFF (gris)
5. Click **Save**

### Paso 3: Verificar
1. Ir a tu app: https://www.lukenfit.com/register
2. Intentar crear cuenta nueva
3. Debería aparecer error: "Sign ups are disabled"

✅ **Listo!** Ahora nadie puede registrarse, excepto:
- Usuarios que invites manualmente desde Supabase Dashboard
- Tu cuenta de administrador

### Paso 4: Invitar Usuarios Manualmente (cuando quieras)
1. Dashboard → Authentication → Users
2. Click **"Invite User"**
3. Ingresar email de la persona
4. Enviar invitación
5. Recibirán email con link de confirmación

---

## OPCIÓN 2: Whitelist de Emails en Código (Más Control)

Si prefieres mantener el signup abierto pero restringir a emails específicos:

### Paso 1: Crear lista blanca de emails

**Archivo a crear**: `/src/config/allowedEmails.ts`

```typescript
/**
 * Lista blanca de emails permitidos para registro
 * Agregar aquí los emails de personas autorizadas
 */
export const ALLOWED_EMAILS = [
  'tu-email@gmail.com',
  'amigo1@gmail.com',
  'amigo2@gmail.com',
  // Agregar más emails aquí
];

/**
 * Dominios permitidos (opcional)
 * Ejemplo: '@tuempresa.com' permitiría cualquier email de ese dominio
 */
export const ALLOWED_DOMAINS = [
  // '@ejemplo.com',
];

/**
 * Verifica si un email está en la whitelist
 */
export function isEmailAllowed(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();

  // Check exact email match
  if (ALLOWED_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  // Check domain match
  for (const domain of ALLOWED_DOMAINS) {
    if (normalizedEmail.endsWith(domain)) {
      return true;
    }
  }

  return false;
}
```

### Paso 2: Modificar hook de registro

**Archivo**: `/src/hooks/supabase/useSupabaseAuth.ts`

**Línea a modificar**: ~260 (función `signUp`)

**BUSCAR:**
```typescript
const signUp = async (email, password) => {
  if (!supabase) {
    // offline mode
    return;
  }

  // Validaciones...
```

**REEMPLAZAR CON:**
```typescript
import { isEmailAllowed } from '@/config/allowedEmails';

const signUp = async (email, password) => {
  if (!supabase) {
    // offline mode
    return;
  }

  // ✅ VALIDACIÓN DE WHITELIST
  if (!isEmailAllowed(email)) {
    setError('Este email no está autorizado para registrarse. Contacta al administrador.');
    return;
  }

  // Validaciones existentes...
```

### Paso 3: Agregar mensaje en UI

**Archivo**: `/src/components/auth/AuthRegister.tsx`

**Agregar debajo del título:**
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-600">{error}</p>
  </div>
)}

{/* Mensaje informativo */}
<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-700">
    📧 Registro solo para usuarios invitados. Si necesitas acceso, contacta al administrador.
  </p>
</div>
```

---

## COMPARACIÓN DE OPCIONES

| Aspecto | Opción 1: Dashboard | Opción 2: Whitelist |
|---------|---------------------|---------------------|
| **Complejidad** | ⭐ Muy fácil (2 min) | ⭐⭐⭐ Requiere código |
| **Mantenimiento** | ✅ Cero | ❌ Editar código para agregar emails |
| **Seguridad** | ✅ Server-side (100%) | ⚠️ Client-side (bypasseable) |
| **Control** | ❌ Todo o nada | ✅ Granular (por email/dominio) |
| **Reversible** | ✅ Sí (1 click) | ✅ Sí (revertir código) |
| **Invitaciones** | ✅ Automático por email | ❌ Manual |

---

## RECOMENDACIÓN FINAL

**Para uso personal/privado**: Usa **Opción 1** (Dashboard)
- Más seguro (server-side)
- Más fácil de mantener
- Puedes invitar gente cuando quieras

**Para app semi-pública**: Usa **Opción 2** (Whitelist)
- Mejor UX (mensaje explicativo)
- Más control granular
- Puedes abrir/cerrar por dominios

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

### Test 1: Intentar registrarse con email NO autorizado
1. Ir a https://www.lukenfit.com/register
2. Usar email random: `test@example.com`
3. **Esperado**: Error "Sign ups disabled" o "Email no autorizado"

### Test 2: Verificar usuarios existentes
1. Dashboard → Authentication → Users
2. Verificar que solo aparecen usuarios autorizados

### Test 3: Invitar nuevo usuario (Opción 1)
1. Dashboard → Authentication → Users → Invite User
2. Ingresar email de prueba
3. Verificar que recibe email de invitación

---

## SEGURIDAD ADICIONAL

### Activar Email Confirmations (recomendado)
1. Dashboard → Authentication → Settings
2. Enable: **"Confirm email before login"**
3. Save

Esto previene registros con emails falsos.

### Activar CAPTCHA (anti-bots)
1. Dashboard → Authentication → Settings
2. Enable: **"Enable Captcha protection"**
3. Configurar Google reCAPTCHA v2
4. Save

---

**Autor**: Claude Code
**Fecha**: 2026-02-05
**Estado**: ⚠️ PENDIENTE DE IMPLEMENTACIÓN
