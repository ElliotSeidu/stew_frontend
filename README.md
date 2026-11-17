# STEW Frontend (React + Vite PWA)

## Important: `VITE_API_URL` Must Be Set at Build Time

Vite bakes all `VITE_*` variables into the static JavaScript bundle during `npm run build` (`vite build`), **not** at container/web-server runtime.

If `VITE_API_URL` is missing or empty, `npm run build` now fails immediately instead of shipping a bundle that throws `503 Service configuration error: VITE_API_URL is not set`.

```bash
# Example production build
VITE_API_URL=https://api.stew.knust.edu.gh/api npm run build
```

On Windows PowerShell:

```powershell
$env:VITE_API_URL = 'https://api.stew.knust.edu.gh/api'
npm run build
```

Never put secret keys (`PAYSTACK_SECRET_KEY`, `SECRET_KEY`) in any `VITE_*` variable — they are embedded publicly in `dist/`.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
