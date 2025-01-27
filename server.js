const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configuración de archivos estáticos - IMPORTANTE: Al principio
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas para las carpetas
const sourceDir = path.join(__dirname, "source");
const rollupsDir = path.join(__dirname, "uploads", "rollups");

// Aseguramos que las carpetas existan
if (!fs.existsSync(rollupsDir)) {
  fs.mkdirSync(rollupsDir, { recursive: true });
  console.log(`Directorio creado: ${rollupsDir}`);
}

// Función para mover y combinar archivos
function processRollupFile() {
  const rollupPath = path.join(sourceDir, "rollup.html");
  const combinedRollupPath = path.join(rollupsDir, "combined_rollup.html");

  if (!fs.existsSync(rollupPath)) {
    console.log("No se encontró un archivo rollup.html en la carpeta source.");
    return;
  }

  try {
    const newRollupContent = fs.readFileSync(rollupPath, "utf8");

    if (fs.existsSync(combinedRollupPath)) {
      const existingContent = fs.readFileSync(combinedRollupPath, "utf8");
      const combinedContent = `${existingContent}\n\n${newRollupContent}`;
      fs.writeFileSync(combinedRollupPath, combinedContent, "utf8");
      console.log("Contenido combinado con éxito.");
    } else {
      fs.writeFileSync(combinedRollupPath, newRollupContent, "utf8");
      console.log("Nuevo archivo combinado creado.");
    }

    const timestamp = Date.now();
    const movedFileName = `rollup_${timestamp}.html`;
    const movedFilePath = path.join(rollupsDir, movedFileName);
    fs.renameSync(rollupPath, movedFilePath);
    console.log(`Archivo movido a: ${movedFilePath}`);
  } catch (error) {
    console.error("Error al procesar el archivo rollup:", error);
  }
}

// Endpoint para procesar el archivo rollup
app.post("/processRollup", (req, res) => {
  try {
    processRollupFile();
    res.status(200).send("Archivo rollup procesado y combinado con éxito.");
  } catch (error) {
    res.status(500).send("Error al procesar el archivo rollup.");
  }
});

// Endpoint para obtener los archivos rollup
app.get("/rollup-files", (req, res) => {
  try {
    const files = fs.readdirSync(rollupsDir);
    const filesContent = files
      .filter((file) => file.endsWith(".html"))
      .map((file) => {
        const filePath = path.join(rollupsDir, file);
        return fs.readFileSync(filePath, "utf8");
      });
    res.json(filesContent);
  } catch (error) {
    console.error("Error al leer los archivos rollup:", error);
    res.status(500).send("Error al leer los archivos rollup");
  }
});

// Ruta para manejar errores 404 de archivos estáticos
app.use((req, res, next) => {
  if (req.path.match(/\.(css|js|png|jpg|ico)$/)) {
    res.status(404).send("Archivo no encontrado");
  } else {
    next();
  }
});

// Ruta catch-all para el SPA - IMPORTANTE: Al final de todas las rutas
app.get("*", (req, res) => {
  if (!req.path.match(/\.(js|css|png|jpg|jpeg|ico)$/)) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

module.exports = app;
