# QA Automation Challenge — Castro Pérez

Framework de automatización de pruebas UI (Playwright) + API (Axios), implementado en TypeScript siguiendo buenas prácticas de diseño y automatización.

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Lenguaje | TypeScript 5 | Tipado estático, detección temprana de errores |
| UI (web) | Playwright 1.44 | Multi-browser nativo, auto-wait, mejor DX que Selenium |
| API | Axios | Cliente HTTP liviano, fácil manejo de responses con errores |
| Test runner | Playwright Test | Integración nativa con Playwright, reporters, retries |
| CI/CD | GitHub Actions | Matrix strategy para multi-browser en paralelo |

---

## Estructura del proyecto

```
qa-automation-challenge/
├── playwright.config.ts           # Configuración central (multi-browser, retries, reporters)
├── src/
│   ├── pages/                     # Page Object Model
│   │   ├── BasePage.ts            # Métodos Playwright compartidos
│   │   ├── HomePage.ts            # Auth + navegación de productos
│   │   ├── CartPage.ts            # Carrito de compras
│   │   └── CheckoutPage.ts        # Formulario y confirmación de compra
│   ├── api/
│   │   └── PetStoreClient.ts      # Cliente HTTP Petstore (Axios)
│   ├── data/
│   │   ├── users.json             # Datos de prueba de usuarios
│   │   ├── products.json          # Productos por categoría
│   │   └── orders.json            # Payloads de órdenes API
│   ├── helpers/
│   │   └── RandomHelper.ts        # Generación dinámica de datos únicos por corrida
│   └── types/
│       └── index.ts               # Interfaces TypeScript (contratos de dominio)
├── tests/
│   ├── ui/
│   │   ├── auth.spec.ts           # Registro + login (9 escenarios)
│   │   └── cart.spec.ts           # Carrito + checkout (8 escenarios)
│   └── api/
│       └── orders.spec.ts         # Órdenes Petstore (9 escenarios)
└── .github/
    └── workflows/
        └── ci.yml                 # CI multi-browser + nightly run
```

---

## Instalación

```bash
# 1 – Clonar repositorio
git clone https://github.com/Papit4/OKA_retotenico_CastroPerez.git
cd OKA_retotenico_CastroPerez

# 2 – Instalar dependencias
npm install --legacy-peer-deps

# 3 – Instalar navegadores Playwright
npx playwright install --with-deps
```

---

## Ejecución

```bash
# Todos los tests (UI + API)
npm test

# Solo UI
npm run test:ui

# Solo API
npm run test:api

# Browser específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Ver reporte HTML
npm run test:report
```

---

## Decisiones técnicas

### 1. Page Object Model (POM) con BasePage

Cada pantalla tiene su propia clase. Los tests nunca llaman a Playwright directamente — solo interactúan a través del POM. `BasePage` centraliza helpers compartidos para evitar duplicación:

```typescript
// Los tests hablan en términos de negocio, no de Playwright
await home.login(username, password);
await home.addProductToCart('Phones', 'Samsung galaxy s6');
```

Si mañana cambia un selector, solo se toca el Page Object — ningún test.

---

### 2. Por qué NO usamos `waitForLoadState('networkidle')`

Demoblaze mantiene conexiones abiertas permanentemente (WebSockets, analytics). `networkidle` espera que no haya requests por 500ms — con demoblaze eso nunca ocurre y el test explota a los 30s.

**Solución:** esperar elementos concretos del DOM:

```typescript
// ❌ Nunca usar en demoblaze
await this.page.waitForLoadState('networkidle');

// ✅ Esperar el elemento real que necesitamos
await this.page.locator('#tbodyid').waitFor({ state: 'visible' });
```

---

### 3. Manejo de alerts del browser (race condition)

El patrón `Promise.all([waitForEvent('dialog'), click()])` tiene un race condition — si el dialog llega antes que el listener, se pierde.

**Solución:** registrar el listener **antes** del click con `page.once`:

```typescript
// ✅ Listener registrado antes del click — imposible perder el evento
const dialogPromise = new Promise<string>(resolve => {
    this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
    });
});
await locator.click({ force: true });
return dialogPromise;
```

---

### 4. Modales Bootstrap — animación fade

Playwright considera un elemento "not stable" durante animaciones CSS. Los modales de Bootstrap usan `fade` que interfiere con los clicks.

**Solución:** `force: true` en clicks + esperar el input directamente como señal de que el modal está listo:

```typescript
async openSignupModal(): Promise<void> {
    await this.navSignup.click();
    await this.signupUsername.waitFor({ state: 'visible', timeout: 15_000 });
}
```

---

### 5. Aislamiento de tests — usuario único por test

El problema era que todos los tests compartían el mismo usuario y carrito en el servidor, pisándose entre sí.

**Solución:** crear un usuario nuevo por cada test en el `beforeEach`. Cada usuario tiene su propio carrito vacío, garantizando aislamiento total sin depender de limpiezas asíncronas:

```typescript
test.beforeEach(async ({ page }) => {
    const newUser = RandomHelper.newUser(); // usuario único por corrida
    await home.open();
    await home.openSignupModal();
    await home.signupAndGetAlert(newUser.username, newUser.password);
    await home.open(); // resetear estado antes del login
    await home.login(newUser.username, newUser.password);
});
```

En una app con backend propio se resolvería con una API de reset de estado o base de datos de test.

---

### 6. Comportamiento cross-browser — WebKit vs Chromium/Firefox

Durante la implementación se detectó comportamiento diferente entre browsers:

- **Chromium/Firefox:** después de un alert de signup, el modal queda abierto
- **WebKit:** después de un alert de signup, el modal se cierra automáticamente

**Solución:** hacer `home.open()` entre signup y login para resetear el estado de la página de forma consistente en los tres browsers.

---

### 7. `waitForURL` para navegación en WebKit

WebKit tarda más en procesar la navegación al hacer click en links. Sin esperar la URL, el test intentaba interactuar con la página anterior.

```typescript
async selectProduct(name: string): Promise<void> {
    await this.page.locator('.card-title a', { hasText: name }).click();
    await this.page.waitForURL('**/prod.html**', { timeout: 10_000 });
    await this.page.waitForLoadState('domcontentloaded');
}
```

---

### 8. Retries — flakiness de app externa

Demoblaze es una app de demo pública sin SLA. Se configuró retry automático para distinguir fallos reales de inestabilidad transitoria:

```typescript
retries: process.env.CI ? 2 : 1,
```

Si un test falla 3 veces seguidas en CI, es un fallo real — no flakiness de red.

---

### 9. PetStoreClient — `validateStatus: () => true`

Por defecto Axios lanza excepciones en respuestas 4xx/5xx, lo que impide asertar sobre errores HTTP.

```typescript
this.http = axios.create({
    validateStatus: () => true, // nunca lanzar excepción por status HTTP
});

// Ahora podemos asertar sobre cualquier status sin try/catch
const response = await client.getOrderById(999_999_999);
expect(response.status).toBe(404);
```

---

### 10. Datos externos y generación dinámica

Ningún valor está hardcodeado en los tests:

- **`src/data/*.json`** — datos estáticos reutilizables (productos, credenciales)
- **`RandomHelper`** — datos dinámicos únicos por corrida (usuarios, IDs de órdenes)

```typescript
// ID aleatorio → evita colisiones con otros usuarios de la API pública
buildOrder(): PetStoreOrder {
    return {
        id: Math.floor(Math.random() * 90_000) + 10_000,
        ...
    };
}
```

---

## CI/CD

### Cuándo se ejecuta

| Trigger | Descripción |
|---|---|
| `push` a `main` o `develop` | Validación automática de cada cambio |
| `pull_request` a `main` | Validación antes de mergear |
| `cron: '0 3 * * *'` | Nightly run — detecta cambios en la app sin push |

El nightly run es clave para apps externas — si demoblaze cambia algo que rompe los tests, se detecta al día siguiente sin esperar un commit.

### Estrategia multi-browser en paralelo

```yaml
strategy:
  fail-fast: false
  matrix:
    browser: [chromium, firefox, webkit]
```

- **3 jobs en paralelo** → tiempo total = browser más lento, no la suma de los tres
- **`fail-fast: false`** → si Firefox falla, WebKit igual corre. Se ven todos los browsers con problemas, no solo el primero

### Artifacts como evidencia

```yaml
- uses: actions/upload-artifact@v4
  if: always() # subir incluso cuando los tests fallan
```

`if: always()` es clave — cuando los tests fallan es cuando más necesitás el reporte. Screenshots, videos y HTML report disponibles 30 días en la pestaña Actions.

---

## Cobertura de escenarios

### UI – demoblaze.com (17 escenarios)

| Test | Tipo |
|---|---|
| Registro exitoso | Positivo |
| Registro usuario existente | Negativo |
| Validación campo username vacío | Negativo |
| Validación campo password vacío | Negativo |
| Verificar usuario creado (re-registro) | Verificación |
| Login exitoso | Positivo |
| Login usuario inexistente | Negativo |
| Login contraseña incorrecta | Negativo |
| Validación campos vacíos en login | Negativo |
| Logout exitoso | Positivo |
| Añadir Phone al carrito | Positivo |
| Añadir Laptop al carrito | Positivo |
| Añadir Monitor al carrito | Positivo |
| Añadir múltiples categorías | Positivo |
| Precio total actualizado al agregar | Verificación |
| Eliminar producto del carrito | Positivo |
| Completar compra (checkout E2E) | E2E |

### API – Petstore (9 escenarios)

| Test | Tipo |
|---|---|
| GET inventory – HTTP 200 | Positivo |
| GET inventory – valores numéricos ≥ 0 | Schema |
| POST order – HTTP 200 y response correcta | Positivo |
| GET order by id – HTTP 200 | Positivo |
| GET order inexistente – HTTP 404 | Negativo |
| DELETE order + verificar inexistencia (404) | Positivo + Verificación |
| DELETE order inexistente – HTTP 404 | Negativo |
| Schema de respuesta – campos requeridos | Schema |
| Status enum – valores válidos | Schema |
