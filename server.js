const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

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
    // Leer el contenido del archivo `rollup.html` en `source/`
    const newRollupContent = fs.readFileSync(rollupPath, "utf8");

    // Si ya existe un archivo combinado, combinarlo con el nuevo contenido
    if (fs.existsSync(combinedRollupPath)) {
      const existingContent = fs.readFileSync(combinedRollupPath, "utf8");
      const combinedContent = `${existingContent}\n\n${newRollupContent}`;
      fs.writeFileSync(combinedRollupPath, combinedContent, "utf8");
      console.log("Contenido combinado con éxito.");
    } else {
      // Si no existe, simplemente guardar el nuevo contenido
      fs.writeFileSync(combinedRollupPath, newRollupContent, "utf8");
      console.log("Nuevo archivo combinado creado.");
    }

    // Mover el archivo original `rollup.html` a `uploads/rollups` con un nombre único
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

// Archivos estáticos
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ruta para cargar la página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
