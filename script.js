// ============================================
// SISTEMA DE FACTURACIÓN - AGRO NEXUS SAC
// ============================================

// ===== DATOS DE PRUEBA =====
let productos = [
    { codigo: 'P001', nombre: 'Fertilizante NPK', categoria: 'Fertilizantes', stock: 50, precioCompra: 45.00, precioVenta: 65.00, stockMinimo: 10 },
    { codigo: 'P002', nombre: 'Semilla de Maíz', categoria: 'Semillas', stock: 30, precioCompra: 80.00, precioVenta: 120.00, stockMinimo: 5 },
    { codigo: 'P003', nombre: 'Herbicida Glifosato', categoria: 'Herbicidas', stock: 20, precioCompra: 55.00, precioVenta: 85.00, stockMinimo: 8 },
    { codigo: 'P004', nombre: 'Abono Orgánico', categoria: 'Abonos', stock: 100, precioCompra: 30.00, precioVenta: 45.00, stockMinimo: 20 },
    { codigo: 'P005', nombre: 'Pesticida Natural', categoria: 'Pesticidas', stock: 15, precioCompra: 70.00, precioVenta: 110.00, stockMinimo: 5 }
];

let ventas = [];
let numeroFactura = 1;
let productosVendidos = [];

// ===== USUARIOS =====
const usuarios = {
    'user': { password: '1234', rol: 'vendedor' },
    'admin': { password: '5678', rol: 'propietario' }
};

let usuarioActual = null;

// ===== CONFIGURACIÓN EMPRESA =====
let configEmpresa = {
    nombre: 'Agro Nexus SAC',
    ruc: '20541234567',
    direccion: 'Av. Principal 123, Lima',
    telefono: '987654321',
    email: 'info@agronexus.com',
    logo: 'https://via.placeholder.com/200x100/2e7d32/ffffff?text=AGRO+NEXUS'
};

// ============================================
// FUNCIONES DE LOGIN
// ============================================

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const usuario = document.getElementById('usuarioLogin').value;
    const password = document.getElementById('passwordLogin').value;
    const rol = document.getElementById('rolUsuario').value;

    if (!usuario || !password || !rol) {
        alert('Por favor, complete todos los campos');
        return;
    }

    if (usuarios[usuario] && usuarios[usuario].password === password) {
        if (usuarios[usuario].rol !== rol) {
            alert(`Error: Este usuario es ${usuarios[usuario].rol}, no ${rol}`);
            return;
        }
        usuarioActual = { nombre: usuario, rol: usuarios[usuario].rol };
        iniciarSistema();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

function iniciarSistema() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    document.getElementById('usuarioActual').textContent = usuarioActual.nombre;
    document.getElementById('rolActual').textContent = usuarioActual.rol.toUpperCase();
    
    // Restringir según rol
    if (usuarioActual.rol === 'vendedor') {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === 'configuracion') {
                btn.style.display = 'none';
            }
        });
    }
    
    actualizarInventario();
    actualizarAlertasStock();
    actualizarVentasRecientes();
    actualizarNumeroFactura();
}

function cerrarSesion() {
    usuarioActual = null;
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// ============================================
// TABS
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(this.dataset.tab).classList.add('active');
        
        if (this.dataset.tab === 'reportes') {
            actualizarReportes();
        }
    });
});

// ============================================
// FUNCIONES DE FACTURACIÓN
// ============================================

function agregarFila() {
    const tbody = document.getElementById('detalleFactura');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" class="codigo-producto" placeholder="Código"></td>
        <td><input type="text" class="nombre-producto" placeholder="Producto"></td>
        <td><input type="number" class="cantidad-producto" value="1" min="1"></td>
        <td><input type="number" class="precio-producto" step="0.01" placeholder="0.00"></td>
        <td class="subtotal-producto">S/ 0.00</td>
        <td><button onclick="eliminarFila(this)" class="btn-eliminar">✖</button></td>
    `;
    tbody.appendChild(newRow);
    
    // Agregar event listeners
    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calcularTotales);
    });
}

function eliminarFila(btn) {
    const tbody = document.getElementById('detalleFactura');
    if (tbody.children.length > 1) {
        btn.closest('tr').remove();
        calcularTotales();
    } else {
        alert('Debe haber al menos un producto');
    }
}

function calcularTotales() {
    const filas = document.querySelectorAll('#detalleFactura tr');
    let subtotal = 0;
    
    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('.cantidad-producto').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio-producto').value) || 0;
        const subtotalFila = cantidad * precio;
        fila.querySelector('.subtotal-producto').textContent = `S/ ${subtotalFila.toFixed(2)}`;
        subtotal += subtotalFila;
    });
    
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    document.getElementById('subtotalTotal').textContent = `S/ ${subtotal.toFixed(2)}`;
    document.getElementById('igvTotal').textContent = `S/ ${igv.toFixed(2)}`;
    document.getElementById('totalFinal').textContent = `S/ ${total.toFixed(2)}`;
    document.getElementById('totalLetras').textContent = numeroALetras(total);
    
    // Calcular vuelto
    const montoRecibido = parseFloat(document.getElementById('montoRecibido').value) || 0;
    if (montoRecibido > 0) {
        const vuelto = montoRecibido - total;
        document.getElementById('vuelto').value = vuelto >= 0 ? `S/ ${vuelto.toFixed(2)}` : 'Monto insuficiente';
    }
}

// Event listeners para cálculos automáticos
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('cantidad-producto') || 
        e.target.classList.contains('precio-producto')) {
        calcularTotales();
    }
    if (e.target.id === 'montoRecibido') {
        calcularTotales();
    }
});

// ============================================
// NÚMERO A LETRAS
// ============================================

function numeroALetras(num) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    
    const partes = num.toFixed(2).split('.');
    const entero = parseInt(partes[0]);
    const decimal = partes[1];
    
    if (entero === 0) return `CERO CON ${decimal}/100 SOLES`;
    
    let letras = '';
    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;
    
    if (miles > 0) {
        if (miles === 1) {
            letras += 'MIL ';
        } else {
            letras += convertirCentenas(miles) + ' MIL ';
        }
    }
    
    if (resto > 0) {
        letras += convertirCentenas(resto);
    }
    
    return `${letras.trim()} CON ${decimal}/100 SOLES`;
}

function convertirCentenas(num) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    
    let letras = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;
    
    if (c > 0) {
        if (c === 1 && d === 0 && u === 0) {
            letras += 'CIEN ';
        } else {
            const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
            letras += centenas[c] + ' ';
        }
    }
    
    if (d === 1 && u > 0) {
        letras += especiales[u] + ' ';
    } else {
        if (d > 0) {
            if (d === 2 && u > 0) {
                letras += 'VEINTI' + unidades[u] + ' ';
            } else {
                letras += decenas[d] + ' ';
                if (u > 0) {
                    letras += 'Y ' + unidades[u] + ' ';
                }
            }
        } else if (u > 0) {
            letras += unidades[u] + ' ';
        }
    }
    
    return letras.trim();
}

// ============================================
// GENERAR PDF
// ============================================

function generarPDF() {
    const tipoDoc = document.getElementById('tipoDocumento').value;
    const numeroDoc = document.getElementById('numeroDoc').value;
    const docCliente = document.getElementById('docCliente').value || '---';
    const nombreCliente = document.getElementById('nombreCliente').value || 'Cliente Genérico';
    const direccionCliente = document.getElementById('direccionCliente').value || '---';
    const telefonoCliente = document.getElementById('telefonoCliente').value || '---';
    const metodoPago = document.getElementById('metodoPago').value;
    
    // Obtener productos
    const filas = document.querySelectorAll('#detalleFactura tr');
    let productosFactura = [];
    let subtotal = 0;
    
    filas.forEach(fila => {
        const codigo = fila.querySelector('.codigo-producto').value || '---';
        const nombre = fila.querySelector('.nombre-producto').value || 'Producto';
        const cantidad = parseInt(fila.querySelector('.cantidad-producto').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio-producto').value) || 0;
        const total = cantidad * precio;
        if (cantidad > 0 && precio > 0) {
            productosFactura.push({ codigo, nombre, cantidad, precio, total });
            subtotal += total;
        }
    });
    
    if (productosFactura.length === 0) {
        alert('Agregue al menos un producto válido');
        return;
    }
    
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const totalLetras = numeroALetras(total);
    
    // Crear HTML para PDF
    const logo = configEmpresa.logo || 'https://via.placeholder.com/150x80/2e7d32/ffffff?text=AGRO+NEXUS';
    
    const pdfContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; border: 1px solid #ddd;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2e7d32; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <img src="${logo}" alt="Logo" style="max-height: 80px;">
                    <h2 style="color: #1b5e20; margin: 5px 0;">${configEmpresa.nombre}</h2>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">RUC: ${configEmpresa.ruc}</p>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">${configEmpresa.direccion}</p>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">Tel: ${configEmpresa.telefono} | Email: ${configEmpresa.email}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="color: #1b5e20; font-size: 24px;">${tipoDoc.toUpperCase()}</h1>
                    <p style="font-size: 18px; font-weight: bold;">N° ${numeroDoc}</p>
                    <p style="font-size: 12px; color: #666;">Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; background: #f5f9f5; padding: 15px; border-radius: 5px;">
                <p><strong>Cliente:</strong> ${nombreCliente}</p>
                <p><strong>RUC/DNI:</strong> ${docCliente}</p>
                <p><strong>Dirección:</strong> ${direccionCliente}</p>
                <p><strong>Teléfono:</strong> ${telefonoCliente}</p>
                <p><strong>Método de Pago:</strong> ${metodoPago.toUpperCase()}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #2e7d32; color: white;">
                        <th style="padding: 10px; text-align: left; width: 80px;">Código</th>
                        <th style="padding: 10px; text-align: left;">Producto</th>
                        <th style="padding: 10px; text-align: center; width: 80px;">Cant.</th>
                        <th style="padding: 10px; text-align: right; width: 100px;">Precio</th>
                        <th style="padding: 10px; text-align: right; width: 120px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosFactura.map(p => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.codigo}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.nombre}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${p.cantidad}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${p.precio.toFixed(2)}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${p.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="text-align: right; border-top: 2px solid #2e7d32; padding-top: 15px;">
                <p style="font-size: 14px;"><strong>Subtotal:</strong> S/ ${subtotal.toFixed(2)}</p>
                <p style="font-size: 14px;"><strong>IGV (18%):</strong> S/ ${igv.toFixed(2)}</p>
                <p style="font-size: 20px; font-weight: bold; color: #1b5e20;"><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
                <p style="font-size: 14px; color: #666;"><strong>Total en Letras:</strong> ${totalLetras}</p>
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>¡Gracias por su compra! - ${configEmpresa.nombre}</p>
                <p>Documento electrónico generado el ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
    
    // Usar html2pdf para generar el PDF
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    document.body.appendChild(element);
    
    html2pdf()
        .set({
            margin: 5,
            filename: `${tipoDoc}_${numeroDoc}.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save()
        .then(() => {
            document.body.removeChild(element);
        });
}

// ============================================
// GUARDAR VENTA
// ============================================

function guardarVenta() {
    const tipoDoc = document.getElementById('tipoDocumento').value;
    const docCliente = document.getElementById('docCliente').value || '---';
    const nombreCliente = document.getElementById('nombreCliente').value || 'Cliente Genérico';
    const metodoPago = document.getElementById('metodoPago').value;
    
    const filas = document.querySelectorAll('#detalleFactura tr');
    let productosFactura = [];
    let subtotal = 0;
    
    filas.forEach(fila => {
        const codigo = fila.querySelector('.codigo-producto').value || '---';
        const nombre = fila.querySelector('.nombre-producto').value || 'Producto';
        const cantidad = parseInt(fila.querySelector('.cantidad-producto').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio-producto').value) || 0;
        const total = cantidad * precio;
        if (cantidad > 0 && precio > 0) {
            productosFactura.push({ codigo, nombre, cantidad, precio, total });
            subtotal += total;
            
            // Actualizar inventario
            const productoInventario = productos.find(p => p.codigo === codigo);
            if (productoInventario) {
                productoInventario.stock -= cantidad;
                if (productoInventario.stock < 0) productoInventario.stock = 0;
            }
        }
    });
    
    if (productosFactura.length === 0) {
        alert('Agregue al menos un producto válido');
        return;
    }
    
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    const venta = {
        numero: document.getElementById('numeroDoc').value,
        tipo: tipoDoc,
        cliente: nombreCliente,
        documento: docCliente,
        metodoPago: metodoPago,
        productos: productosFactura,
        subtotal: subtotal,
        igv: igv,
        total: total,
        fecha: new Date().toISOString()
    };
    
    ventas.push(venta);
    productosVendidos.push(...productosFactura);
    
    // Guardar en localStorage
    guardarDatos();
    
    actualizarInventario();
    actualizarAlertasStock();
    actualizarVentasRecientes();
    actualizarNumeroFactura();
    limpiarFactura();
    
    alert('✅ Venta guardada exitosamente');
}

// ============================================
// FUNCIONES DE INVENTARIO
// ============================================

function actualizarInventario() {
    const tbody = document.getElementById('listaInventario');
    tbody.innerHTML = '';
    
    productos.forEach(p => {
        const tr = document.createElement('tr');
        const stockClass = p.stock <= p.stockMinimo ? 'stock-bajo' : '';
        const margin = ((p.precioVenta - p.precioCompra) / p.precioCompra * 100).toFixed(1);
        
        tr.innerHTML = `
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria || '---'}</td>
            <td class="${stockClass}">${p.stock}</td>
            <td>S/ ${p.precioCompra.toFixed(2)}</td>
            <td>S/ ${p.precioVenta.toFixed(2)}</td>
            <td>${margin}%</td>
            <td>
                <button onclick="editarProducto('${p.codigo}')" class="btn-editar">✏️</button>
                <button onclick="eliminarProducto('${p.codigo}')" class="btn-eliminar-producto">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarAlertasStock() {
    const container = document.getElementById('alertasStock');
    const alertas = productos.filter(p => p.stock <= p.stockMinimo);
    
    if (alertas.length === 0) {
        container.innerHTML = '<p style="color: #28a745;">✅ Todos los productos tienen stock suficiente</p>';
    } else {
        container.innerHTML = alertas.map(p => `
            <div class="alerta-item">
                <span>⚠️ <strong>${p.nombre}</strong> (Cód: ${p.codigo})</span>
                <span>Stock: ${p.stock} (Mínimo: ${p.stockMinimo})</span>
            </div>
        `).join('');
    }
}

function mostrarModalProducto() {
    document.getElementById('modalProducto').style.display = 'flex';
    document.getElementById('formProducto').reset();
}

function cerrarModalProducto() {
    document.getElementById('modalProducto').style.display = 'none';
}

document.getElementById('formProducto').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const producto = {
        codigo: document.getElementById('prodCodigo').value.trim().toUpperCase(),
        nombre: document.getElementById('prodNombre').value.trim(),
        categoria: document.getElementById('prodCategoria').value.trim(),
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        precioCompra: parseFloat(document.getElementById('prodPrecioCompra').value) || 0,
        precioVenta: parseFloat(document.getElementById('prodPrecioVenta').value) || 0,
        stockMinimo: parseInt(document.getElementById('prodStockMinimo').value) || 5
    };
    
    if (productos.find(p => p.codigo === producto.codigo)) {
        alert('⚠️ Ya existe un producto con ese código');
        return;
    }
    
    productos.push(producto);
    guardarDatos();
    actualizarInventario();
    actualizarAlertasStock();
    cerrarModalProducto();
    alert('✅ Producto agregado exitosamente');
});

function editarProducto(codigo) {
    const producto = productos.find(p => p.codigo === codigo);
    if (!producto) return;
    
    // Implementar edición (usar prompt o modal)
    const nuevoNombre = prompt('Nombre del producto:', producto.nombre);
    if (nuevoNombre) producto.nombre = nuevoNombre;
    
    const nuevoPrecio = prompt('Nuevo precio de venta:', producto.precioVenta);
    if (nuevoPrecio) producto.precioVenta = parseFloat(nuevoPrecio);
    
    const nuevoStock = prompt('Nuevo stock:', producto.stock);
    if (nuevoStock) producto.stock = parseInt(nuevoStock);
    
    guardarDatos();
    actualizarInventario();
    actualizarAlertasStock();
}

function eliminarProducto(codigo) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.codigo !== codigo);
        guardarDatos();
        actualizarInventario();
        actualizarAlertasStock();
    }
}

// ============================================
// VENTAS RECIENTES
// ============================================

function actualizarVentasRecientes() {
    const container = document.getElementById('listaVentas');
    if (ventas.length === 0) {
        container.innerHTML = '<p class="sin-ventas">No hay ventas registradas</p>';
        return;
    }
    
    const ultimas = ventas.slice(-5).reverse();
    container.innerHTML = ultimas.map(v => `
        <div class="venta-item">
            <div class="venta-header">
                <span>${v.tipo.toUpperCase()} N° ${v.numero}</span>
                <span>S/ ${v.total.toFixed(2)}</span>
            </div>
            <div class="venta-detalle">
                <span>${v.cliente} | ${v.metodoPago.toUpperCase()}</span>
                <span>${new Date(v.fecha).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function actualizarNumeroFactura() {
    const tipo = document.getElementById('tipoDocumento').value;
    const prefix = tipo === 'boleta' ? 'B' : 'F';
    numeroFactura = ventas.length + 1;
    document.getElementById('numeroDoc').value = `${prefix}001-${String(numeroFactura).padStart(4, '0')}`;
}

// ============================================
// REPORTES Y GRÁFICOS
// ============================================

function actualizarReportes() {
    // Resumen
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    document.getElementById('totalVentasReporte').textContent = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('numVentasReporte').textContent = ventas.length;
    
    const totalProductos = productosVendidos.reduce((sum, p) => sum + p.cantidad, 0);
    document.getElementById('productosVendidosReporte').textContent = totalProductos;
    
    // Gráficos (usando canvas)
    graficarVentas();
    graficarProductos();
    graficarPagos();
}

function graficarVentas() {
    const ctx = document.getElementById('graficoVentas').getContext('2d');
    const ultimasVentas = ventas.slice(-7);
    const labels = ultimasVentas.map(v => new Date(v.fecha).toLocaleDateString());
    const data = ultimasVentas.map(v => v.total);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                label: 'Ventas (S/)',
                data: data.length ? data : [0],
                backgroundColor: '#2e7d32',
                borderColor: '#1b5e20',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function graficarProductos() {
    const ctx = document.getElementById('graficoProductos').getContext('2d');
    const topProductos = productosVendidos.reduce((acc, p) => {
        acc[p.nombre] = (acc[p.nombre] || 0) + p.cantidad;
        return acc;
    }, {});
    
    const labels = Object.keys(topProductos).slice(0, 5);
    const data = Object.values(topProductos).slice(0, 5);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#2e7d32', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function graficarPagos() {
    const ctx = document.getElementById('graficoPagos').getContext('2d');
    const pagos = ventas.reduce((acc, v) => {
        acc[v.metodoPago] = (acc[v.metodoPago] || 0) + 1;
        return acc;
    }, {});
    
    const labels = Object.keys(pagos);
    const data = Object.values(pagos);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels.map(l => l.toUpperCase()) : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#2e7d32', '#ffc107', '#2196f3', '#ff5722']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// ============================================
// CONFIGURACIÓN
// ============================================

function guardarConfiguracion() {
    configEmpresa.nombre = document.getElementById('empNombre').value;
    configEmpresa.ruc = document.getElementById('empRuc').value;
    configEmpresa.direccion = document.getElementById('empDireccion').value;
    configEmpresa.telefono = document.getElementById('empTelefono').value;
    configEmpresa.email = document.getElementById('empEmail').value;
    
    guardarDatos();
    alert('✅ Configuración guardada exitosamente');
}

function cargarLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').src = e.target.result;
            configEmpresa.logo = e.target.result;
            guardarDatos();
        };
        reader.readAsDataURL(file);
    }
}

function mostrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'flex';
    document.getElementById('formUsuario').reset();
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
}

document.getElementById('formUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    const usuario = document.getElementById('nuevoUsuario').value;
    const password = document.getElementById('nuevaPassword').value;
    const rol = document.getElementById('nuevoRol').value;
    
    if (usuarios[usuario]) {
        alert('⚠️ Este usuario ya existe');
        return;
    }
    
    usuarios[usuario] = { password, rol };
    guardarDatos();
    cerrarModalUsuario();
    alert('✅ Usuario agregado exitosamente');
    actualizarListaUsuarios();
});

function actualizarListaUsuarios() {
    const container = document.getElementById('listaUsuarios');
    container.innerHTML = Object.keys(usuarios).map(u => `
        <div class="usuario-item">
            <span>👤 ${u}</span>
            <span class="rol-tag">${usuarios[u].rol}</span>
        </div>
    `).join('');
}

// ============================================
// LIMPIAR FACTURA
// ============================================

function limpiarFactura() {
    document.getElementById('docCliente').value = '';
    document.getElementById('nombreCliente').value = '';
    document.getElementById('direccionCliente').value = '';
    document.getElementById('telefonoCliente').value = '';
    document.getElementById('montoRecibido').value = '';
    document.getElementById('vuelto').value = '';
    
    const tbody = document.getElementById('detalleFactura');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" class="codigo-producto" placeholder="Código"></td>
            <td><input type="text" class="nombre-producto" placeholder="Producto"></td>
            <td><input type="number" class="cantidad-producto" value="1" min="1"></td>
            <td><input type="number" class="precio-producto" step="0.01" placeholder="0.00"></td>
            <td class="subtotal-producto">S/ 0.00</td>
            <td><button onclick="eliminarFila(this)" class="btn-eliminar">✖</button></td>
        </tr>
    `;
    
    const inputs = tbody.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calcularTotales);
    });
    
    calcularTotales();
    actualizarNumeroFactura();
}

// ============================================
// PERSISTENCIA (localStorage)
// ============================================

function guardarDatos() {
    const datos = {
        productos,
        ventas,
        productosVendidos,
        configEmpresa,
        usuarios
    };
    localStorage.setItem('agroNexusData', JSON.stringify(datos));
}

function cargarDatos() {
    const saved = localStorage.getItem('agroNexusData');
    if (saved) {
        try {
            const datos = JSON.parse(saved);
            productos = datos.productos || productos;
            ventas = datos.ventas || [];
            productosVendidos = datos.productosVendidos || [];
            configEmpresa = datos.configEmpresa || configEmpresa;
            // No sobrescribir usuarios por seguridad
        } catch (e) {
            console.log('Error al cargar datos');
        }
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

cargarDatos();
actualizarListaUsuarios();

// Cargar configuración en el formulario
document.getElementById('empNombre').value = configEmpresa.nombre;
document.getElementById('empRuc').value = configEmpresa.ruc;
document.getElementById('empDireccion').value = configEmpresa.direccion;
document.getElementById('empTelefono').value = configEmpresa.telefono;
document.getElementById('empEmail').value = configEmpresa.email;
document.getElementById('logoPreview').src = configEmpresa.logo;

// Evento para cambiar tipo documento
document.getElementById('tipoDocumento').addEventListener('change', actualizarNumeroFactura);

// Inicializar factura
limpiarFactura();

console.log('🌱 Agro Nexus SAC - Sistema de Facturación cargado exitosamente');
console.log('👤 Usuarios:', Object.keys(usuarios));
console.log('📦 Productos:', productos.length);
console.log('🧾 Ventas:', ventas.length);
