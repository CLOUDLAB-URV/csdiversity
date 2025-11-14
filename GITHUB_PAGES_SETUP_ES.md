# 🚀 Guía de Configuración para GitHub Pages

## 📋 Resumen

GitHub Pages sirve archivos **estáticos**. Las variables de entorno en Next.js se "inyectan" durante el **build time** (momento de construcción), no en runtime. Esto significa que necesitas configurarlas en GitHub Actions.

---

## ✅ Pasos para Configurar

### 1️⃣ Configurar GitHub Secrets

Las variables `NEXT_PUBLIC_*` se deben configurar como **GitHub Secrets** para que estén disponibles durante el build en GitHub Actions.

**Pasos:**

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral izquierdo, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega las siguientes secrets:

#### Secret 1: Google Analytics (opcional)
```
Nombre: NEXT_PUBLIC_GA_MEASUREMENT_ID
Valor: G-XXXXXXXXXX
```
(Pon tu ID real de Google Analytics. Si no lo tienes, omite esta secret)

#### Secret 2: URL de Producción (opcional)
```
Nombre: PRODUCTION_URL
Valor: https://tu-usuario.github.io/nombre-del-repo
```
(Reemplaza con tu URL real. El workflow puede auto-detectarla, pero es mejor especificarla)

---

### 2️⃣ Activar GitHub Pages

1. Ve a **Settings** → **Pages**
2. En **Source**, selecciona: **GitHub Actions**
3. Guarda los cambios

---

### 3️⃣ Verificar el Workflow

Ya he creado el archivo `.github/workflows/deploy.yml` en tu proyecto con esta configuración:

```yaml
# Las variables se configuran en el paso de build:
env:
  NEXT_PUBLIC_BASE_URL: ${{ secrets.PRODUCTION_URL || ... }}
  NEXT_PUBLIC_GA_MEASUREMENT_ID: ${{ secrets.NEXT_PUBLIC_GA_MEASUREMENT_ID }}
  GITHUB_PAGES: true
  GITHUB_REPOSITORY: ${{ github.repository }}
```

**Cómo funciona:**
- `NEXT_PUBLIC_BASE_URL`: Se toma de la secret `PRODUCTION_URL`, o se auto-genera
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Se toma de la secret (si existe)
- `GITHUB_PAGES`: Siempre `true` para builds de GitHub Pages
- `GITHUB_REPOSITORY`: Se obtiene automáticamente del contexto de GitHub

---

### 4️⃣ Hacer Deploy

**Opción A: Automático**

Simplemente haz push a tu rama `main`:

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

El workflow se ejecutará automáticamente.

**Opción B: Manual**

1. Ve a tu repositorio en GitHub
2. Click en **Actions**
3. Selecciona el workflow "Deploy to GitHub Pages"
4. Click en **Run workflow**

---

### 5️⃣ Verificar el Deploy

1. Ve a **Actions** en tu repositorio
2. Verás el workflow ejecutándose
3. Cuando termine (checkmark verde ✓), tu sitio estará disponible en:
   ```
   https://tu-usuario.github.io/nombre-del-repo
   ```

---

## 🔍 Entendiendo las Variables de Entorno

### Variables `NEXT_PUBLIC_*`

**Importante:** Solo las variables que empiezan con `NEXT_PUBLIC_` están disponibles en el navegador (client-side).

- ✅ `NEXT_PUBLIC_BASE_URL` → Accesible en el cliente
- ✅ `NEXT_PUBLIC_GA_MEASUREMENT_ID` → Accesible en el cliente
- ❌ `GITHUB_PAGES` → Solo disponible durante el build
- ❌ `GITHUB_REPOSITORY` → Solo disponible durante el build

### ¿Por qué no usar archivo `.env`?

El archivo `.env` es para desarrollo local. En GitHub Pages:
- El código se construye en los servidores de GitHub
- No tienes acceso al sistema de archivos del servidor
- Por eso usamos **GitHub Secrets** + **GitHub Actions**

---

## 🛠️ Troubleshooting

### Problema: El sitio no se ve correctamente

**Solución:** Verifica que tu URL base sea correcta:

```bash
# En tu repositorio de GitHub, verifica:
Settings → Pages → Tu URL será algo como:
https://tu-usuario.github.io/nombre-del-repo
```

Asegúrate de que `PRODUCTION_URL` en Secrets coincida con esta URL.

### Problema: Google Analytics no funciona

**Verificar:**

1. ¿Agregaste el secret `NEXT_PUBLIC_GA_MEASUREMENT_ID`?
2. ¿El valor empieza con `G-` o `UA-`?
3. ¿Está correctamente escrito (sin espacios extra)?

### Problema: El workflow falla

**Revisar:**

1. Ve a **Actions** → Click en el workflow fallido
2. Revisa los logs para ver el error específico
3. Errores comunes:
   - Faltan dependencias: Ejecuta `npm ci` localmente
   - Error de build: Ejecuta `npm run build` localmente para reproducir

### Problema: 404 en rutas

**Causa:** GitHub Pages necesita trailing slashes para rutas estáticas.

**Verificación:** El `next.config.js` ya tiene `trailingSlash: true`.

---

## 📝 Resumen de Configuración

### Secrets requeridos:
- ✅ `NEXT_PUBLIC_GA_MEASUREMENT_ID` (opcional, solo si usas Analytics)
- ✅ `PRODUCTION_URL` (opcional pero recomendado)

### Secrets NO necesarios:
- ❌ `GITHUB_PAGES` (se establece en el workflow)
- ❌ `GITHUB_REPOSITORY` (se obtiene automáticamente)
- ❌ `GITHUB_TOKEN` (se proporciona automáticamente por GitHub)

### Archivos importantes:
- `.github/workflows/deploy.yml` - Workflow de deployment
- `next.config.js` - Configuración de Next.js
- `.env` (local solo) - Para desarrollo local

---

## 🎉 ¡Listo!

Ahora cada vez que hagas push a `main`, tu sitio se desplegará automáticamente en GitHub Pages con todas las variables de entorno configuradas correctamente.

**URL final:** `https://tu-usuario.github.io/nombre-del-repo`

---

## 🔗 Enlaces Útiles

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

