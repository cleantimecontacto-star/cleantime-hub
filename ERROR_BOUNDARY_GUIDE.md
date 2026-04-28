# Guía de Error Boundaries en CleanTime Hub

## ¿Qué es un Error Boundary?

Un **Error Boundary** es un componente de React que **captura errores de JavaScript** que ocurren en cualquier parte del árbol de componentes. Es como un "try-catch" para React.

### Diferencia importante:
- **Sin Error Boundary**: Si un componente falla, toda la aplicación se queda en blanco
- **Con Error Boundary**: Solo la sección problemática muestra un mensaje de error, el resto funciona normalmente

## Cómo funciona

```jsx
<ErrorBoundary name="Mi Sección">
  <ComponenteQuePuedeFallar />
</ErrorBoundary>
```

Si `ComponenteQuePuedeFallar` lanza un error, el Error Boundary lo captura y muestra:
- ✅ Un mensaje claro del error
- ✅ La ubicación exacta del fallo (stack trace)
- ✅ Botones para refrescar o reintentar

## Errores que captura

✅ **Captura:**
- Errores en render
- Errores en ciclo de vida (useEffect, etc.)
- Errores en constructores
- Errores en métodos de componentes

❌ **NO captura:**
- Errores en event handlers (usa try-catch normal)
- Errores asincronos (promesas rechazadas)
- Errores en setTimeout/setInterval
- Errores en el servidor

## Estructura actual en CleanTime Hub

### 1. Error Boundary Global (main.tsx)
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```
Captura cualquier error no manejado en toda la aplicación.

### 2. Error Boundaries por Ruta (App.tsx)
Cada ruta protegida está envuelta en su propio Error Boundary:

```tsx
<Route path="/clientes" element={
  <ProtectedRoute name="Gestión de Clientes">
    <ClientsPage />
  </ProtectedRoute>
} />
```

Esto significa que si la página de clientes falla, solo esa página muestra el error, no toda la app.

## Cómo agregar Error Boundaries a nuevas secciones

### Opción 1: En una ruta (App.tsx)
```tsx
<Route path="/nueva-seccion" element={
  <ProtectedRoute name="Mi Nueva Sección">
    <MiComponente />
  </ProtectedRoute>
} />
```

### Opción 2: En un componente específico
```tsx
import { ErrorBoundary } from "@/ErrorBoundary.tsx";

export default function MiPagina() {
  return (
    <div>
      <h1>Mi Página</h1>
      <ErrorBoundary name="Tabla de Datos">
        <TablaCompleja />
      </ErrorBoundary>
      <ErrorBoundary name="Gráfico">
        <GraficoComplejo />
      </ErrorBoundary>
    </div>
  );
}
```

## Qué ves cuando hay un error

```
┌─────────────────────────────────────┐
│ ⚠️ Fallo en Gestión de Clientes     │
│                                     │
│ Se ha detectado un error inesperado │
│                                     │
│ Mensaje de Error:                   │
│ Cannot read property 'map' of null  │
│                                     │
│ Ubicación del fallo:                │
│ at ClientsPage (ClientsPage.tsx:45) │
│ at ProtectedRoute (App.tsx:32)      │
│                                     │
│ [Refrescar Aplicación] [Reintentar]│
└─────────────────────────────────────┘
```

## Mejores prácticas

### ✅ DO (Haz esto)
```tsx
// Envuelve secciones críticas
<ErrorBoundary name="Formulario de Cotización">
  <QuoteForm />
</ErrorBoundary>

// Usa nombres descriptivos
<ErrorBoundary name="Cálculo de Liquidación">
  <LiquidacionPage />
</ErrorBoundary>
```

### ❌ DON'T (No hagas esto)
```tsx
// No envuelvas todo en un solo Error Boundary
<ErrorBoundary name="App">
  <ClientsPage />
  <QuotesPage />
  <WorkersPage />
</ErrorBoundary>

// No uses nombres genéricos
<ErrorBoundary name="Error">
  <MiComponente />
</ErrorBoundary>
```

## Para errores en Event Handlers

Los Error Boundaries NO capturan errores en event handlers. Usa try-catch normal:

```tsx
const handleClick = async () => {
  try {
    await deleteClient(id);
    toast.success("Cliente eliminado");
  } catch (error) {
    toast.error("No se pudo eliminar el cliente");
    console.error(error);
  }
};
```

## Debugging

Cuando veas un Error Boundary:

1. **Lee el mensaje de error** - Te dice exactamente qué falló
2. **Mira el stack trace** - Te muestra en qué componente y línea ocurrió
3. **Abre la consola del navegador** (F12) - Verás más detalles
4. **Revisa los logs de servidor** - Si es un error de API

## Ejemplo real en tu app

### Antes (sin Error Boundary)
```
Usuario abre /clientes
→ Error en la query de Convex
→ Pantalla completamente en blanco
→ Usuario no sabe qué pasó
```

### Después (con Error Boundary)
```
Usuario abre /clientes
→ Error en la query de Convex
→ Muestra: "Fallo en Gestión de Clientes"
→ Muestra el error exacto
→ Usuario puede refrescar o reintentar
```

## Monitoreo futuro

Para aplicaciones en producción, puedes enviar errores a un servicio:

```tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Enviar a Sentry, LogRocket, etc.
  reportErrorToService({
    error: error.toString(),
    componentStack: errorInfo.componentStack,
    timestamp: new Date(),
  });
}
```

## Resumen

| Aspecto | Detalles |
|--------|----------|
| **Ubicación** | `src/ErrorBoundary.tsx` |
| **Uso Global** | `src/main.tsx` |
| **Uso por Ruta** | `src/App.tsx` |
| **Captura** | Errores de render y ciclo de vida |
| **No Captura** | Event handlers, promesas, async |
| **Beneficio** | La app no se queda en blanco, ves qué falló |

---

**Última actualización:** Abril 2026
**Versión:** 1.0
