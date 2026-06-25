# Eleven2Eleven - Restaurant Management System (RMS)

This is a React + Vite project that provides a minimal setup to get React working in Vite with HMR and ESLint rules.

## 🚀 Getting Started

### 1. **Install Dependencies**
First, install all required libraries:

```bash
npm install
```

### 2. **Run Development Server**
To run the project in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

The project will run at `http://localhost:5173` (Vite's default port). You can change the port if needed.

### 3. **Build for Production**
To build the project for production:

```bash
npm run build
```

The output will be saved in the `dist/` folder.

### 4. **Preview Production Build**
To preview the production build locally:

```bash
npm run preview
```

## 📋 Tech Stack

- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool & development server
- **TailwindCSS 4.1.17** - CSS utility framework
- **React Router DOM 7.10.0** - Client-side routing
- **Firebase 12.6.0** - Backend services
- **Radix UI** - Accessible component library
- **Lucide React** - Icon library

## 🔧 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 📁 Project Structure

- `src/` - Source code
  - `components/` - React components (auth, custom UI, UI elements)
  - `pages/` - Page components
  - `contexts/` - React Contexts (Auth, Order, Table)
  - `data_access/` - API calls (Firebase)
  - `lib/` - Utility functions
  - `assets/` - Static assets
- `public/` - Public files
- `dist/` - Production build output (generated after running `npm run build`)

## ⚙️ Plugins & Features

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
