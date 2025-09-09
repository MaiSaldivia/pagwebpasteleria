// ================================
// DATA ADMIN (Productos, Usuarios, Regiones)
// ================================

// Productos de ejemplo
const productos = [
  { codigo: "P001", nombre: "Torta de Chocolate", precio: 15000, stock: 10, categoria: "Tortas" },
  { codigo: "P002", nombre: "Cheesecake Frutos Rojos", precio: 18500, stock: 5, categoria: "Tortas" },
  { codigo: "P003", nombre: "Pastel de Zanahoria", precio: 16200, stock: 8, categoria: "Pasteles" },
  { codigo: "P004", nombre: "Cupcake Vainilla", precio: 2500, stock: 40, categoria: "Cupcakes" }
];

// Usuarios de ejemplo (con roles claros para login)
const usuarios = [
  { run: "19011022K", nombre: "Juan", apellidos: "Pérez Soto", correo: "admin@duoc.cl", rol: "Administrador" },
  { run: "18022033K", nombre: "Ana", apellidos: "López Díaz", correo: "vendedor@duoc.cl", rol: "Vendedor" },
  // Puedes dejar otros usuarios si lo necesitas, pero ojo: solo Admin y Vendedor se redirigen a paneles
  { run: "20033044K", nombre: "Luis", apellidos: "Ramírez Fuentes", correo: "cliente@gmail.com", rol: "Cliente" }
];

// Regiones y comunas
const regiones = {
  "Región Metropolitana": ["Santiago", "Puente Alto", "Maipú"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué"],
  "Biobío": ["Concepción", "Los Ángeles", "Chillán"]
};

// ================================
// Cargar regiones y comunas dinámicamente
// ================================
window.addEventListener("DOMContentLoaded", () => {
  const regionSelect = document.getElementById("region");
  const comunaSelect = document.getElementById("comuna");

  if (regionSelect && comunaSelect) {
    Object.keys(regiones).forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });

    regionSelect.addEventListener("change", () => {
      comunaSelect.innerHTML = "<option value=''>-- Selecciona --</option>";
      if (regionSelect.value && regiones[regionSelect.value]) {
        regiones[regionSelect.value].forEach(comuna => {
          const opt = document.createElement("option");
          opt.value = comuna;
          opt.textContent = comuna;
          comunaSelect.appendChild(opt);
        });
      }
    });
  }
});
