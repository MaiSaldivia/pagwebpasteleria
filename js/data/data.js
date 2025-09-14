// Productos (id, nombre, precio, categoria, atributos, imagen ficticia)
window.PRODUCTS = [
  {id:"TC001", nombre:"Torta Cuadrada de Chocolate", precio:45000, categoria:"Tortas Cuadradas", attr:"20 porciones", img:"img/Torta Cuadrada de Chocolate.png"},
  {id:"TC002", nombre:"Torta Cuadrada de Frutas", precio:50000, categoria:"Tortas Cuadradas", attr:"Frutas frescas", img:"img/Torta Cuadrada de Frutas.png"},
  {id:"TT001", nombre:"Torta Circular de Vainilla", precio:40000, categoria:"Tortas Circulares", attr:"12 porciones", img:"img/Torta Circular de Vainilla.png"},
  {id:"TT002", nombre:"Torta Circular de Manjar", precio:42000, categoria:"Tortas Circulares", attr:"Con nueces", img:"img/Torta Circular de Manjar.png"},
  {id:"PI001", nombre:"Mousse de Chocolate", precio:5000,  categoria:"Postres Individuales", attr:"Individual", img:"img/Mousse de Chocolate.png"},
  {id:"PI002", nombre:"Tiramisú Clásico", precio:5500, categoria:"Postres Individuales", attr:"Individual", img:"img/Tiramisú Clásico.png"},
  {id:"PSA001", nombre:"Torta Sin Azúcar de Naranja", precio:48000, categoria:"Productos Sin Azúcar", attr:"Endulzada naturalmente", img:"img/Torta Sin Azúcar de Naranja.png"},
  {id:"PSA002", nombre:"Cheesecake Sin Azúcar", precio:47000, categoria:"Productos Sin Azúcar", attr:"Sin azúcar", img:"img/Cheesecake.png"},
  {id:"PG001", nombre:"Brownie Sin Gluten", precio:4000, categoria:"Productos Sin Gluten", attr:"Cacao 70%", img:"img/Brownie.png"},
  {id:"PG002", nombre:"Pan Sin Gluten", precio:3500, categoria:"Productos Sin Gluten", attr:"Pan de molde", img:"img/Pan integral.png"},
  {id:"PV001", nombre:"Torta Vegana de Chocolate", precio:50000, categoria:"Productos Vegana", attr:"Vegano", img:"img/Torta Vegana de Chocolate.png"},
  {id:"PV002", nombre:"Galletas Veganas de Avena", precio:4500, categoria:"Productos Vegana", attr:"Pack x 10", img:"img/Galletas Veganas de Avena.png"},
  {id:"TE001", nombre:"Torta Especial de Cumpleaños", precio:55000, categoria:"Tortas Especiales", attr:"Personalizable", img:"img/Torta Especial de Cumpleaños.png"},
  {id:"TE002", nombre:"Torta Especial de Boda", precio:60000, categoria:"Tortas Especiales", attr:"Diseño elegante", img:"img/Torta Especial de Boda.png"},
];

window.CATEGORIES = [
  "Tortas Cuadradas","Tortas Circulares","Postres Individuales",
  "Productos Sin Azúcar","Pastelería Tradicional","Productos Sin Gluten",
  "Productos Vegana","Tortas Especiales"
];

// Regiones y comunas
window.REGIONES = {
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
