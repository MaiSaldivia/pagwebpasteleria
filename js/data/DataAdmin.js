// ================================
// DATA BASE para Admin (semillas)
// - Productos de ejemplo
// - Usuarios de ejemplo
// - Regiones y comunas
// Todo expuesto en window.* porque otros scripts lo leen desde ahí
// ================================

// Productos de ejemplo (para Admin de productos y para la tienda como fallback)
window.productos = [
  { codigo: "P001", nombre: "Torta de Chocolate", precio: 15000, stock: 10, categoria: "Tortas" },
  { codigo: "P002", nombre: "Cheesecake Frutos Rojos", precio: 18500, stock: 5,  categoria: "Tortas" },
  { codigo: "P003", nombre: "Pastel de Zanahoria",    precio: 16200, stock: 8,  categoria: "Pasteles" },
  { codigo: "P004", nombre: "Cupcake Vainilla",       precio: 2500,  stock: 40, categoria: "Cupcakes" }
];

// Usuarios de ejemplo (para sembrar ADMIN_USERS_V1 la primera vez)
window.usuarios = [
  { run: "19011022K", nombre: "Juan", apellidos: "Pérez Soto",    correo: "admin@duoc.cl",    rol: "Administrador", region: "Región Metropolitana", comuna: "Santiago",      direccion: "Av. Siempre Viva 123" },
  { run: "18022033K", nombre: "Ana",  apellidos: "López Díaz",    correo: "vendedor@duoc.cl", rol: "Vendedor",      region: "Valparaíso",          comuna: "Viña del Mar", direccion: "Calle Mar 456" },
  { run: "20033044K", nombre: "Luis", apellidos: "Ramírez Fuentes",correo: "cliente@gmail.com",rol: "Cliente",        region: "Biobío",               comuna: "Concepción",    direccion: "Las Flores 789" }
];

// Regiones y comunas (usado por formularios)
window.regiones = {
  "Región Metropolitana": ["Santiago", "Puente Alto", "Maipú", "Las Condes", "Providencia"],
  "Valparaíso":           ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
  "Biobío":               ["Concepción", "Los Ángeles", "Chillán"]
};
