// ================================
// DATA BASE para Admin
// - Productos de ejemplo
// - Usuarios de ejemplo
// - Regiones y comunas
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

// Regiones y comunas de Chile (usado por formularios)

window.regiones = {
  "Arica y Parinacota": ["Arica","Camarones","Putre","General Lagos"],
  "Tarapacá":           ["Iquique","Alto Hospicio","Pozo Almonte","Pica","Huara","Camiña","Colchane"],
  "Antofagasta":        ["Antofagasta","Calama","Mejillones","Tocopilla","Taltal","Sierra Gorda","San Pedro de Atacama","María Elena","Ollagüe"],
  "Atacama":            ["Copiapó","Caldera","Tierra Amarilla","Chañaral","Diego de Almagro","Vallenar","Huasco","Freirina","Alto del Carmen"],
  "Coquimbo":           ["La Serena","Coquimbo","Ovalle","Vicuña","Illapel","Los Vilos","Salamanca","Andacollo","Monte Patria","Combarbalá","Punitaqui","Río Hurtado","Paiguano","Canela"],
  "Valparaíso":         ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Concón","San Antonio","San Felipe","Los Andes","Quillota","La Calera","La Ligua","Papudo","Puchuncaví","Limache","Olmué","Quintero","Casablanca","Santa María","Panquehue","Rinconada","Calle Larga","Juan Fernández","Isla de Pascua","Zapallar","Cartagena","El Quisco","El Tabo","Algarrobo","Petorca","Nogales","Cabildo","Putaendo","Llay Llay"],
  "Metropolitana":      ["Santiago","Puente Alto","Maipú","Las Condes","Providencia","Ñuñoa","La Florida","Peñalolén","Recoleta","Independencia","La Reina","Macul","Vitacura","Lo Barnechea","Pudahuel","Cerro Navia","Quinta Normal","Renca","Huechuraba","Quilicura","Estación Central","San Miguel","San Joaquín","La Granja","La Cisterna","San Ramón","El Bosque","Pedro Aguirre Cerda","Lo Espejo","Conchalí","Lo Prado","San Bernardo","Melipilla","Talagante","Peñaflor","Padre Hurtado","Buin","Paine","Colina","Lampa","Tiltil","Isla de Maipo","Curacaví","María Pinto","El Monte","Alhué","San José de Maipo","Pirque"],
  "O'Higgins":          ["Rancagua","Machalí","San Fernando","Rengo","Requínoa","Graneros","Mostazal","San Vicente","Chimbarongo","Nancagua","Santa Cruz","Palmilla","Peralillo","Pichidegua","Peumo","Codegua","Coinco","Doñihue","Malloa","Olivar","Quinta de Tilcoco","Las Cabras","Pichilemu","Marchigüe","Navidad","La Estrella","Litueche","Paredones","Pumanque","Chépica","Placilla"],
  "Maule":              ["Talca","Curicó","Linares","Cauquenes","San Clemente","Maule","San Javier","Constitución","Parral","Rauco","Romeral","Hualañé","Molina","Teno","Sagrada Familia","Pelarco","Pencahue","Empedrado","Río Claro","Colbún","Longaví","Villa Alegre","Yerbas Buenas","Retiro","Chanco","Pelluhue","Vichuquén","Licantén"],
  "Ñuble":              ["Chillán","Chillán Viejo","San Carlos","Bulnes","Quirihue","Yungay","Quillón","Pemuco","El Carmen","Coihueco","San Nicolás","Pinto","San Fabián","Ninhue","Ránquil","Cobquecura","Coelemu","Treguaco","Portezuelo"],
  "Biobío":             ["Concepción","Talcahuano","Hualpén","San Pedro de la Paz","Coronel","Chiguayante","Florida","Penco","Tomé","Lota","Hualqui","Los Ángeles","Cabrero","Nacimiento","Mulchén","Yumbel","Laja","San Rosendo","Santa Bárbara","Quilleco","Quilaco","Alto Biobío","Arauco","Lebu","Curanilahue","Los Álamos","Contulmo"],
  "La Araucanía":       ["Temuco","Padre Las Casas","Angol","Victoria","Villarrica","Pucón","Lautaro","Nueva Imperial","Carahue","Gorbea","Loncoche","Pitrufquén","Freire","Saavedra","Toltén","Teodoro Schmidt","Cunco","Curacautín","Lonquimay","Melipeuco","Perquenco","Galvarino","Ercilla","Traiguén","Renaico","Collipulli","Purén","Los Sauces","Lumaco","Cholchol"],
  "Los Ríos":           ["Valdivia","La Unión","Río Bueno","Panguipulli","Paillaco","Lanco","Futrono","Lago Ranco","Mariquina","Corral","Máfil","Los Lagos"],
  "Los Lagos":          ["Puerto Montt","Puerto Varas","Osorno","Castro","Ancud","Quellón","Frutillar","Llanquihue","Calbuco","Fresia","Los Muermos","Maullín","Puerto Octay","Puyehue","Río Negro","San Juan de la Costa","San Pablo","Chonchi","Dalcahue","Queilén","Quemchi","Quinchao","Curaco de Vélez","Cochamó","Hualaihué","Futaleufú","Chaitén","Palena"],
  "Aysén":              ["Coyhaique","Aysén","Cisnes","Chile Chico","Río Ibáñez","Guaitecas","Lago Verde","O’Higgins","Cochrane","Tortel"],
  "Magallanes":         ["Punta Arenas","Puerto Natales","Porvenir","Cabo de Hornos","Primavera","San Gregorio","Laguna Blanca","Río Verde","Timaukel","Torres del Paine","Antártica"]
};
