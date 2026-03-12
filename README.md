# QA Automation Challenge

Framework de automatización de pruebas UI (Playwright) + API (Axios), implementado con TypeScript siguiendo buenas prácticas de diseño.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 5 |
| UI (web) | Playwright 1.44 |
| API | Axios |
| Test runner | Playwright Test |
| CI/CD | GitHub Actions |

---

## Estructura del proyecto

```
qa-automation-challenge/
├── playwright.config.ts       # Configuración central (multi-browser, retries, reporters)
├── src/
│   ├── pages/                 # Page Object Model
│   │   ├── BasePage.ts        # Métodos Playwright compartidos
│   │   ├── HomePage.ts        # Auth + navegación de productos
│   │   ├── CartPage.ts        # Carrito de compras
│   │   └── CheckoutPage.ts    # Formulario y confirmación de compra
│   ├── api/
│   │   └── PetStoreClient.ts  # Cliente HTTP Petstore (Axios)
│   ├── data/
│   │   ├── users.json         # Datos de prueba de usuarios
│   │   ├── products.json      # Productos por categoría
│   │   └── orders.json        # Payloads de órdenes API
│   ├── helpers/
│   │   └── RandomHelper.ts    # Generación dinámica de datos
│   └── types/
│       └── index.ts           # Interfaces TypeScript
├── tests/
│   ├── ui/
│   │   ├── auth.spec.ts       # Registro + login (9 escenarios)
│   │   └── cart.spec.ts       # Carrito + checkout (7 escenarios)
│   └── api/
│       └── orders.spec.ts     # Órdenes Petstore (8 escenarios)
└── .github/
    └── workflows/
        └── ci.yml             # CI multi-browser + nightly
```

---

## Instalación

```bash
# 1 – Clonar repositorio
git clone <repo-url>
cd qa-automation-challenge

# 2 – Instalar dependencias
npm install

# 3 – Instalar navegadores Playwright
npx playwright install --with-deps
```

---

## Ejecución

```bash
# Todos los tests
npm test

# Solo UI
npm run test:ui

# Solo API
npm run test:api

# Modo headed (ver navegador)
npm run test:headed

# Browser específico
npx playwright test --project=firefox

# Ver reporte HTML
npm run test:report
```

---

## Decisiones técnicas

### Page Object Model (POM)
Cada pantalla de la aplicación tiene su propia clase. Las pruebas nunca llaman a Playwright directamente; interactúan a través del POM. Esto facilita el mantenimiento cuando la UI cambia.

### BasePage
Centraliza helpers reutilizables (`clickAndWaitForAlert`, `fillField`, `waitForVisible`) para evitar duplicación entre Page Objects.

### Datos externos
Los datos de prueba viven en archivos JSON (`src/data/`). Ningún valor está hardcodeado en los tests.

### RandomHelper
Los datos dinámicos (usuarios únicos por corrida, IDs de órdenes) se generan en `RandomHelper` para garantizar aislamiento entre ejecuciones paralelas.

### PetStoreClient (API)
Axios con `validateStatus: () => true` para que los tests puedan hacer aserciones sobre códigos de error sin que la librería lance excepciones.

### CI/CD
- Los tests de API corren en un job separado (más rápido, sin browser).
- Los tests de UI corren en paralelo para los tres browsers (`chromium`, `firefox`, `webkit`) mediante una matrix strategy.
- Ejecución nocturna programada a las 03:00 UTC.

---

## Cobertura de escenarios

### UI – demoblaze.com
| Test | Tipo |
|---|---|
| Registro exitoso | Positivo |
| Registro usuario existente | Negativo |
| Validación campo username vacío | Negativo |
| Validación campo password vacío | Negativo |
| Verificar usuario creado (búsqueda) | Verificación |
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
| Completar compra (checkout) | E2E |

### API – Petstore
| Test | Tipo |
|---|---|
| GET inventory – HTTP 200 | Positivo |
| GET inventory – valores numéricos ≥ 0 | Schema |
| POST order – HTTP 200 | Positivo |
| GET order by id – HTTP 200 | Positivo |
| GET order inexistente – HTTP 404 | Negativo |
| DELETE order + verificar inexistencia | Positivo + verificación |
| DELETE order inexistente – HTTP 404 | Negativo |
| Schema de respuesta de orden | Schema |
| Status enum válido | Schema |
