// ================================
// VENDEDOR JS (Lógica de las tablas)
// ================================
document.addEventListener("DOMContentLoaded", () => {

    // Asumimos que los datos de productos y usuarios están disponibles
    // desde un archivo como DataAdmin.js
    const productos = [
      { codigo: "P001", nombre: "Torta de Chocolate", stock: 10, stockCritico: 5 },
      { codigo: "P002", nombre: "Cheesecake Frutos Rojos", stock: 2, stockCritico: 5 },
      { codigo: "P003", nombre: "Pastel de Zanahoria", stock: 8, stockCritico: 5 },
      { codigo: "P004", nombre: "Cupcake Vainilla", stock: 40, stockCritico: 10 }
    ];
  
    const usuarios = [
      { run: "19011022K", nombre: "Juan", apellidos: "Pérez Soto", correo: "juan@gmail.com" },
      { run: "18022033K", nombre: "Ana", apellidos: "López Díaz", correo: "ana@duoc.cl" },
      { run: "20033044-9", nombre: "Luis", apellidos: "Ramírez Fuentes", correo: "luis@profesor.duoc.cl" }
    ];
  
    const pedidos = [
      { id: "PED001", cliente: "Ana López", total: 25000, estado: "Pendiente" },
      { id: "PED002", cliente: "Juan Pérez", total: 18000, estado: "Enviado" },
      { id: "PED003", cliente: "Luis Ramírez", total: 32000, estado: "Pendiente" }
    ];
  
    // -------------------------------
    // Renderizar Pedidos
    // -------------------------------
    const tablaPedidos = document.getElementById("tablaPedidos");
    if (tablaPedidos) {
      const tbody = tablaPedidos.querySelector("tbody");
      pedidos.forEach(p => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${p.id}</td>
          <td>${p.cliente}</td>
          <td>$${p.total.toLocaleString()}</td>
          <td>${p.estado}</td>
          <td><button class="btn btn--principal">Ver Detalles</button></td>
        `;
        tbody.appendChild(fila);
      });
    }
  
    // -------------------------------
    // Renderizar Inventario
    // -------------------------------
    const tablaInventario = document.getElementById("tablaInventario");
    if (tablaInventario) {
      const tbody = tablaInventario.querySelector("tbody");
      productos.forEach(p => {
        const estadoStock = p.stock <= p.stockCritico ? `<span class="stock-bajo">Bajo (${p.stock})</span>` : p.stock;
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${p.codigo}</td>
          <td>${p.nombre}</td>
          <td>${estadoStock}</td>
          <td><button class="btn btn--principal">Actualizar Stock</button></td>
        `;
        tbody.appendChild(fila);
      });
    }
  
    // -------------------------------
    // Renderizar Clientes
    // -------------------------------
    const tablaClientes = document.getElementById("tablaClientes");
    if (tablaClientes) {
      const tbody = tablaClientes.querySelector("tbody");
      usuarios.forEach(u => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${u.nombre}</td>
          <td>${u.apellidos}</td>
          <td>${u.correo}</td>
          <td>${u.run}</td>
        `;
        tbody.appendChild(fila);
      });
    }
  
  });