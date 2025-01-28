window.location.href = window.location.href;
// Función para cargar los registros de los jugadores desde los archivos
async function loadDataFromFile(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Error al cargar ${filePath}`);
    return await response.text();
  } catch (error) {
    console.error(error);
    return "";
  }
}

// Función para cargar los datos de los jugadores desde QDKP.html
async function loadDKPData() {
  const data = await loadDataFromFile("/uploads/QDKP.html");
  if (data) {
    const rows = parseHTML(data);
    rows.forEach((row) => {
      const { name, netDKP, totalDKP, spentDKP } = extractRowData(row);
      if (parseInt(totalDKP) > 0) {
        addRowToTable(name, netDKP, totalDKP, spentDKP);
      }
    });
  }
}

// Parsear los datos HTML y obtener las filas
function parseHTML(data) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  return doc.querySelectorAll("table tr");
}

// Extraer la información de cada fila de datos
function extractRowData(row) {
  const cells = row.querySelectorAll("td");
  return {
    name: cells[0]?.textContent.trim() || "N/A",
    netDKP: cells[3]?.textContent.trim() || "0",
    totalDKP: cells[4]?.textContent.trim() || "0",
    spentDKP: cells[5]?.textContent.trim() || "0",
  };
}

// Función para agregar una fila a la tabla
function addRowToTable(name, netDKP, totalDKP, spentDKP) {
  const tableBody = document.querySelector("#dkpTable tbody");
  const row = document.createElement("tr");
  const mainName = name.split(" (")[0];

  row.innerHTML = `
    <td> <a href="https://armory.warmane.com/character/${encodeURIComponent(
      mainName
    )}/Icecrown/profile" class="player-link" target = "_blank">${name}</a></td>
    <td>${netDKP}</td>
    <td>${totalDKP}</td>
    <td>
      <a href="#" class="spent-dkp" data-player="${name}">${spentDKP}</a>
    </td>
  `;

  tableBody.appendChild(row);
  row.querySelector(".spent-dkp").addEventListener("click", (e) => {
    e.preventDefault();
    handleSpentDKPClick(name);
  });
}

// Función para manejar clic en Spent DKP y abrir una nueva ventana con los registros del jugador
async function handleSpentDKPClick(playerName) {
  // Extraer el nombre del personaje principal si existe entre paréntesis
  const mainPlayerName = extractMainPlayerName(playerName);

  const data = await loadDataFromFile("/uploads/rollups/combined_rollup.html");
  if (data) {
    const rows = parseHTML(data);

    // Usar el nombre principal para filtrar los registros
    const playerRecords = filterPlayerRecords(
      rows,
      mainPlayerName || playerName
    );
    const htmlContent = generatePlayerRecordsPage(
      mainPlayerName || playerName,
      playerRecords
    );

    openNewWindow(htmlContent);
  }
}

// Función para extraer el nombre del personaje principal
function extractMainPlayerName(playerName) {
  const match = playerName.match(/\(([^)]+)\)/); // Buscar contenido entre paréntesis
  return match ? match[1] : null;
}

// Filtrar registros de un jugador específico
function filterPlayerRecords(rows, playerName) {
  return Array.from(rows).filter((row) => {
    const cells = row.querySelectorAll("td");
    return cells.length > 0 && cells[2]?.textContent.includes(playerName);
  });
}

// Generar el contenido HTML para mostrar los registros de un jugador
function generatePlayerRecordsPage(playerName, playerRecords) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Registro de DKP - ${playerName}</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <div class="container">
        <h1>Registro de DKP - ${playerName}</h1>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>DKP Gastado</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${playerRecords
              .map((row) => {
                const { time, dkpChange, description } = extractRecordData(row);
                return `
                  <tr>
                    <td>${time}</td>
                    <td>${dkpChange}</td>
                    <td>${description}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

// Extraer la información de cada registro
function extractRecordData(row) {
  const cells = row.querySelectorAll("td");
  return {
    time: cells[0]?.textContent.trim() || "N/A",
    dkpChange: cells[1]?.textContent.trim() || "N/A",
    description: cells[2]?.innerHTML.trim() || "N/A",
  };
}

// Abrir una nueva ventana con el contenido HTML generado
function openNewWindow(htmlContent) {
  const newWindow = window.open();
  newWindow.document.write(htmlContent);
  newWindow.document.close();
}

// Filtro de la tabla en función del valor de búsqueda
function filterTable(searchValue) {
  const rows = document.querySelectorAll("#dkpTable tbody tr");
  rows.forEach((row) => {
    const name = row.querySelector("td").textContent.toLowerCase();
    row.style.display = name.includes(searchValue) ? "" : "none";
  });
}

function loadAllRollupRecords() {
  fetch("/rollup-files")
    .then((response) => response.json())
    .then((filesContent) => {
      const recordsContainer = document.querySelector("#log");

      filesContent.forEach((fileContent, index) => {
        const newWindow = window.open();
        newWindow.document.write(fileContent);
        newWindow.document.close();
      });
    })
    .catch((error) =>
      console.error("Error al cargar los archivos acumulados:", error)
    );
}

// Función para ordenar la tabla por columnas
let sortDirection = {}; // Objeto para recordar la dirección de ordenación por columna

function sortTable(columnIndex) {
  const rows = Array.from(document.querySelectorAll("#dkpTable tbody tr"));
  const isNumericColumn = [1, 2, 3].includes(columnIndex);
  const direction = (sortDirection[columnIndex] =
    sortDirection[columnIndex] === "asc" ? "desc" : "asc");

  const sortedRows = rows.sort((rowA, rowB) => {
    const cellA = rowA.querySelectorAll("td")[columnIndex].textContent.trim();
    const cellB = rowB.querySelectorAll("td")[columnIndex].textContent.trim();

    if (isNumericColumn) {
      const numA = parseFloat(cellA);
      const numB = parseFloat(cellB);
      return direction === "asc" ? numA - numB : numB - numA;
    } else {
      return direction === "asc"
        ? cellA.localeCompare(cellB)
        : cellB.localeCompare(cellA);
    }
  });

  const tableBody = document.querySelector("#dkpTable tbody");
  sortedRows.forEach((row) => {
    tableBody.appendChild(row);
  });
}

// Inicializar tabla y eventos
document.addEventListener("DOMContentLoaded", () => {
  loadDKPData();

  // Configurar barra de búsqueda
  const searchInput = document.querySelector("#searchInput");
  searchInput.addEventListener("input", (event) => {
    filterTable(event.target.value.toLowerCase());
  });

  // Configurar eventos de ordenación de columnas
  const headers = document.querySelectorAll("#dkpTable th");
  headers.forEach((header, index) => {
    header.addEventListener("click", () => sortTable(index));
  });
});
