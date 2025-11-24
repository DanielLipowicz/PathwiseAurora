# Build Instructions

## For Static Use (No Server Required) ⭐ Recommended

The application can be used as a static page that works with `file://` protocol.

### Build the Bundle

```bash
npm run build
```

This creates `app.bundle.js` which contains all modules bundled together.

### Use the Static Version

1. Run `npm run build` to create the bundle
2. Open `index.html` directly in your browser (double-click or `file://` URL)
3. No server needed! Works offline and can be deployed anywhere.

### When to Rebuild

Rebuild whenever you modify any files in the `src/` directory:

```bash
npm run build
```

## For Development (With Server)

If you prefer to use ES modules during development (with hot-reload capabilities):

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

### Alternative Server Options

**Python:**
```bash
python -m http.server 3000
```

**PHP:**
```bash
php -S localhost:3000
```

**VS Code Live Server:**
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## File Structure

- `src/` - Source modules (ES6 modules)
- `app.bundle.js` - Bundled version (for static use) - **Generated file**
- `index.html` - Main HTML file (uses bundle for static use)
- `build.js` - Build script using esbuild
- `server.js` - Development server (optional)

## Notes

- The bundled version (`app.bundle.js`) is generated - don't edit it directly
- Edit files in `src/` directory, then rebuild
- The static bundle works with `file://` protocol (no CORS issues)

