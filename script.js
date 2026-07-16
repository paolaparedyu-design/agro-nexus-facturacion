// ============================================
// AGRO NEXUS SAC - SISTEMA DE FACTURACIÓN
// Script Mejorado y Corregido
// ============================================

// ===== DATOS INICIALES =====
let productos = [
    { codigo: 'P001', nombre: 'Fertilizante NPK 20-20-20', categoria: 'Fertilizantes', stock: 50, precioCompra: 45.00, precioVenta: 65.00, stockMinimo: 10 },
    { codigo: 'P002', nombre: 'Semilla de Maíz Híbrido', categoria: 'Semillas', stock: 30, precioCompra: 80.00, precioVenta: 120.00, stockMinimo: 5 },
    { codigo: 'P003', nombre: 'Herbicida Glifosato 4L', categoria: 'Herbicidas', stock: 20, precioCompra: 55.00, precioVenta: 85.00, stockMinimo: 8 },
    { codigo: 'P004', nombre: 'Abono Orgánico 25kg', categoria: 'Abonos', stock: 100, precioCompra: 30.00, precioVenta: 45.00, stockMinimo: 20 },
    { codigo: 'P005', nombre: 'Pesticida Natural 1L', categoria: 'Pesticidas', stock: 15, precioCompra: 70.00, precioVenta: 110.00, stockMinimo: 5 }
];

let ventas = [];
let productosVendidos = [];
let numeroFactura = 1;

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
// CARGA DE DATOS (localStorage)
// ============================================

function guardarDatos() {
    try {
        const datos = { productos, ventas, productosVendidos, configEmpresa, usuarios };
        localStorage.setItem('agroNexusData', JSON.stringify(datos));
    } catch (e) {
        console.log('Error al guardar:', e);
    }
}

function cargarDatos() {
    try {
        const saved = localStorage.getItem('agroNexusData');
        if (saved) {
            const datos = JSON.parse(saved);
            productos = datos.productos || productos;
            ventas = datos.ventas || [];
            productosVendidos = datos.productosVendidos || [];
            configEmpresa = datos.configEmpresa || configEmpresa;
        }
    } catch (e) {
        console.log('Error al cargar:', e);
    }
}

cargarDatos();

// ============================================
// FUNCIONES DE LOGIN
// ============================================

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const usuario = document.getElementById('usuarioLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();
    const rol = document.getElementById('rolUsuario').value;

    if (!usuario || !password || !rol) {
        mostrarAlerta('⚠️ Por favor, complete todos los campos', 'error');
        return;
    }

    // Verificar usuario
    if (usuarios[usuario] && usuarios[usuario].password === password) {
        if (usuarios[usuario].rol !== rol) {
            mostrarAlerta(`❌ Error: Este usuario es ${usuarios[usuario].rol}, no ${rol}`, 'error');
            return;
        }
        usuarioActual = { nombre: usuario, rol: usuarios[usuario].rol };
        iniciarSistema();
    } else {
        mostrarAlerta('❌ Usuario o contraseña incorrectos', 'error');
    }
});

function iniciarSistema() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    document.getElementById('usuarioActual').textContent = usuarioActual.nombre;
    document.getElementById('rolActual').textContent = usuarioActual.rol.toUpperCase();
    
    // Restringir según rol
    if (usuarioActual.rol === 'vendedor') {
        document.getElementById('tabConfig').style.display = 'none';
    } else {
        document.getElementById('tabConfig').style.display = 'inline-block';
    }
    
    // Fecha actual
    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    actualizarInventario();
    actualizarAlertasStock();
    actualizarVentasRecientes();
    actualizarNumeroFactura();
    calcularTotales();
    mostrarAlerta('✅ Bienvenido al sistema, ' + usuarioActual.nombre, 'success');
}

function cerrarSesion() {
    usuarioActual = null;
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// ===== ALERTAS =====
function mostrarAlerta(mensaje, tipo) {
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease;
        max-width: 400px;
        background: ${tipo === 'error' ? '#e53935' : '#43a047'};
        color: white;
    `;
    alerta.textContent = mensaje;
    document.body.appendChild(alerta);
    setTimeout(() => {
        alerta.style.opacity = '0';
        alerta.style.transition = 'opacity 0.5s';
        setTimeout(() => alerta.remove(), 500);
    }, 4000);
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
        <td><input type="text" class="codigo-producto" placeholder="Código" list="productosList"></td>
        <td><input type="text" class="nombre-producto" placeholder="Producto"></td>
        <td><input type="number" class="cantidad-producto" value="1" min="1"></td>
        <td><input type="number" class="precio-producto" step="0.01" placeholder="0.00"></td>
        <td class="subtotal-producto">S/ 0.00</td>
        <td><button onclick="eliminarFila(this)" class="btn-eliminar">✖</button></td>
    `;
    tbody.appendChild(newRow);
    
    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calcularTotales);
        input.addEventListener('change', calcularTotales);
    });
    
    calcularTotales();
}

function eliminarFila(btn) {
    const tbody = document.getElementById('detalleFactura');
    if (tbody.children.length > 1) {
        btn.closest('tr').remove();
        calcularTotales();
    } else {
        mostrarAlerta('⚠️ Debe haber al menos un producto', 'error');
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
        document.getElementById('vuelto').value = vuelto >= 0 ? `S/ ${vuelto.toFixed(2)}` : '❌ Monto insuficiente';
    } else {
        document.getElementById('vuelto').value = 'S/ 0.00';
    }
}

// Event listeners
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
    const especiales = ['', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
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
            letras += convertirCentenas(miles, unidades, especiales, decenas, centenas) + ' MIL ';
        }
    }
    
    if (resto > 0) {
        letras += convertirCentenas(resto, unidades, especiales, decenas, centenas);
    }
    
    return `${letras.trim()} CON ${decimal}/100 SOLES`;
}

function convertirCentenas(num, unidades, especiales, decenas, centenas) {
    let letras = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;
    
    if (c > 0) {
        if (c === 1 && d === 0 && u === 0) {
            letras += 'CIEN ';
        } else {
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
        mostrarAlerta('⚠️ Agregue al menos un producto válido', 'error');
        return;
    }
    
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const totalLetras = numeroALetras(total);
    const logo = configEmpresa.logo || 'https://via.placeholder.com/150x80/2e7d32/ffffff?text=AGRO+NEXUS';
    
    const pdfContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2e7d32; padding-bottom: 15px; margin-bottom: 20px;">
                <div>
                    <img src="${logo}" alt="Logo" style="max-height: 70px; margin-bottom: 5px;">
                    <h2 style="color: #1b5e20; margin: 5px 0;">${configEmpresa.nombre}</h2>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">RUC: ${configEmpresa.ruc}</p>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">${configEmpresa.direccion}</p>
                    <p style="font-size: 12px; color: #666; margin: 2px 0;">Tel: ${configEmpresa.telefono} | ${configEmpresa.email}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="color: #1b5e20; font-size: 22px; text-transform: uppercase;">${tipoDoc}</h1>
                    <p style="font-size: 18px; font-weight: bold; color: #1b5e20;">N° ${numeroDoc}</p>
                    <p style="font-size: 12px; color: #666;">${new Date().toLocaleDateString('es-PE')}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; background: #f5f9f5; padding: 15px; border-radius: 8px;">
                <table style="width:100%; font-size:13px;">
                    <tr><td style="padding:3px;"><strong>Cliente:</strong></td><td>${nombreCliente}</td></tr>
                    <tr><td style="padding:3px;"><strong>RUC/DNI:</strong></td><td>${docCliente}</td></tr>
                    <tr><td style="padding:3px;"><strong>Dirección:</strong></td><td>${direccionCliente}</td></tr>
                    <tr><td style="padding:3px;"><strong>Teléfono:</strong></td><td>${telefonoCliente}</td></tr>
                    <tr><td style="padding:3px;"><strong>Método de Pago:</strong></td><td>${metodoPago.toUpperCase()}</td></tr>
                </table>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <thead>
                    <tr style="background: #2e7d32; color: white;">
                        <th style="padding: 10px; text-align: left; width: 70px;">Código</th>
                        <th style="padding: 10px; text-align: left;">Producto</th>
                        <th style="padding: 10px; text-align: center; width: 70px;">Cant.</th>
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
                <p style="font-size: 22px; font-weight: bold; color: #1b5e20;"><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
                <p style="font-size: 13px; color: #666;"><strong>Total en Letras:</strong> ${totalLetras}</p>
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; font-size: 11px; color: #666;">
                <p>¡Gracias por su compra! - ${configEmpresa.nombre}</p>
                <p>Documento generado el ${new Date().toLocaleString('es-PE')}</p>
            </div>
        </div>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    document.body.appendChild(element);
    
    html2pdf()
        .set({
            margin: 8,
            filename: `${tipoDoc}_${numeroDoc}.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save()
        .then(() => {
            document.body.removeChild(element);
            mostrarAlerta('✅ PDF generado exitosamente', 'success');
        })
        .catch(() => {
            document.body.removeChild(element);
            mostrarAlerta('❌ Error al generar PDF', 'error');
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
            
            const productoInventario = productos.find(p => p.codigo === codigo);
            if (productoInventario) {
                productoInventario.stock -= cantidad;
                if (productoInventario.stock < 0) productoInventario.stock = 0;
            }
        }
    });
    
    if (productosFactura.length === 0) {
        mostrarAlerta('⚠️ Agregue al menos un producto válido', 'error');
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
    
    guardarDatos();
    actualizarInventario();
    actualizarAlertasStock();
    actualizarVentasRecientes();
    actualizarNumeroFactura();
    limpiarFactura();
    
    mostrarAlerta('✅ Venta guardada exitosamente', 'success');
}

// ============================================
// FUNCIONES DE INVENTARIO
// ============================================

function actualizarInventario() {
    const tbody = document.getElementById('listaInventario');
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#999;">📭 No hay productos registrados</td></tr>`;
        return;
    }
    
    productos.forEach(p => {
        const tr = document.createElement('tr');
        const stockClass = p.stock <= p.stockMinimo ? 'stock-bajo' : '';
        const margin = p.precioCompra > 0 ? ((p.precioVenta - p.precioCompra) / p.precioCompra * 100).toFixed(1) : '0';
        
        tr.innerHTML = `
            <td><strong>${p.codigo}</strong></td>
            <td>${p.nombre}</td>
            <td>${p.categoria || '---'}</td>
            <td class="${stockClass}">${p.stock}</td>
            <td>S/ ${p.precioCompra.toFixed(2)}</td>
            <td>S/ ${p.precioVenta.toFixed(2)}</td>
            <td>${margin}%</td>
            <td>
                <button onclick="editarProducto('${p.codigo}')" class="btn-editar" title="Editar">✏️</button>
                <button onclick="eliminarProducto('${p.codigo}')" class="btn-eliminar-producto" title="Eliminar">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarAlertasStock() {
    const container = document.getElementById('alertasStock');
    const alertas = productos.filter(p => p.stock <= p.stockMinimo);
    
    if (alertas.length === 0) {
        container.innerHTML = '<p style="color: #28a745; font-weight:600;">✅ Todos los productos tienen stock suficiente</p>';
    } else {
        container.innerHTML = alertas.map(p => `
            <div class="alerta-item">
                <span>⚠️ <strong>${p.nombre}</strong> (${p.codigo})</span>
                <span>Stock: ${p.stock} / Mín: ${p.stockMinimo}</span>
            </div>
        `).join('');
    }
}

function mostrarModalProducto() {
    if (usuarioActual && usuarioActual.rol === 'vendedor') {
        mostrarAlerta('❌ Solo el propietario puede agregar productos', 'error');
        return;
    }
    document.getElementById('modalProducto').style.display = 'flex';
    document.getElementById('formProducto').reset();
}

function cerrarModalProducto() {
    document.getElementById('modalProducto').style.display = 'none';
}

document.getElementById('formProducto').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('prodCodigo').value.trim().toUpperCase();
    if (productos.find(p => p.codigo === codigo)) {
        mostrarAlerta('⚠️ Ya existe un producto con ese código', 'error');
        return;
    }
    
    const producto = {
        codigo: codigo,
        nombre: document.getElementById('prodNombre').value.trim(),
        categoria: document.getElementById('prodCategoria').value.trim() || 'General',
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        precioCompra: parseFloat(document.getElementById('prodPrecioCompra').value) || 0,
        precioVenta: parseFloat(document.getElementById('prodPrecioVenta').value) || 0,
        stockMinimo: parseInt(document.getElementById('prodStockMinimo').value) || 5
    };
    
    productos.push(producto);
    guardarDatos();
    actualizarInventario();
    actualizarAlertasStock();
    cerrarModalProducto();
    mostrarAlerta('✅ Producto agregado exitosamente', 'success');
});

function editarProducto(codigo) {
    if (usuarioActual && usuarioActual.rol === 'vendedor') {
        mostrarAlerta('❌ Solo el propietario puede editar productos', 'error');
        return;
    }
    
    const producto = productos.find(p => p.codigo === codigo);
    if (!producto) return;
    
    const nuevoNombre = prompt('✏️ Nombre del producto:', producto.nombre);
    if (nuevoNombre && nuevoNombre.trim()) producto.nombre = nuevoNombre.trim();
    
    const nuevoPrecio = prompt('💰 Nuevo precio de venta (S/):', producto.precioVenta);
    if (nuevoPrecio && !isNaN(parseFloat(nuevoPrecio))) producto.precioVenta = parseFloat(nuevoPrecio);
    
    const nuevoStock = prompt('📦 Nuevo stock:', producto.stock);
    if (nuevoStock && !isNaN(parseInt(nuevoStock))) producto.stock = parseInt(nuevoStock);
    
    guardarDatos();
    actualizarInventario();
    actualizarAlertasStock();
    mostrarAlerta('✅ Producto actualizado', 'success');
}

function eliminarProducto(codigo) {
    if (usuarioActual && usuarioActual.rol === 'vendedor') {
        mostrarAlerta('❌ Solo el propietario puede eliminar productos', 'error');
        return;
    }
    
    if (confirm('⚠️ ¿Está seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.codigo !== codigo);
        guardarDatos();
        actualizarInventario();
        actualizarAlertasStock();
        mostrarAlerta('✅ Producto eliminado', 'success');
    }
}

// ============================================
// VENTAS RECIENTES
// ============================================

function actualizarVentasRecientes() {
    const container = document.getElementById('listaVentas');
    const totalHoy = document.getElementById('totalVentasHoy');
    
    if (ventas.length === 0) {
        container.innerHTML = '<p class="sin-ventas">📭 No hay ventas registradas</p>';
        totalHoy.textContent = 'S/ 0.00';
        return;
    }
    
    const hoy = new Date().toDateString();
    let totalDia = 0;
    
    const ultimas = ventas.slice(-10).reverse();
    container.innerHTML = ultimas.map(v => {
        const fechaVenta = new Date(v.fecha);
        if (fechaVenta.toDateString() === hoy) {
            totalDia += v.total;
        }
        return `
            <div class="venta-item">
                <div class="venta-header">
                    <span>${v.tipo.toUpperCase()} N° ${v.numero}</span>
                    <span>S/ ${v.total.toFixed(2)}</span>
                </div>
                <div class="venta-detalle">
                    <span>👤 ${v.cliente}</span>
                    <span>💳 ${v.metodoPago.toUpperCase()}</span>
                    <span>📅 ${fechaVenta.toLocaleDateString('es-PE')}</span>
                </div>
            </div>
        `;
    }).join('');
    
    totalHoy.textContent = `S/ ${totalDia.toFixed(2)}`;
}

function actualizarNumeroFactura() {
    const tipo = document.getElementById('tipoDocumento').value;
    const prefix = tipo === 'boleta' ? 'B' : 'F';
    const numero = ventas.length + 1;
    document.getElementById('numeroDoc').value = `${prefix}001-${String(numero).padStart(4, '0')}`;
}

// ============================================
// REPORTES Y GRÁFICOS
// ============================================

function actualizarReportes() {
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    document.getElementById('totalVentasReporte').textContent = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('numVentasReporte').textContent = ventas.length;
    
    const totalProductos = productosVendidos.reduce((sum, p) => sum + p.cantidad, 0);
    document.getElementById('productosVendidosReporte').textContent = totalProductos;
    
    graficarVentas();
    graficarProductos();
    graficarPagos();
}

function graficarVentas() {
    const ctx = document.getElementById('graficoVentas').getContext('2d');
    const ultimasVentas = ventas.slice(-7);
    const labels = ultimasVentas.map(v => new Date(v.fecha).toLocaleDateString('es-PE'));
    const data = ultimasVentas.map(v => v.total);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                label: 'Ventas (S/)',
                data: data.length ? data : [0],
                backgroundColor: ['#2e7d32', '#43a047', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9'],
                borderColor: '#1b5e20',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
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
    
    const sorted = Object.entries(topProductos).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#1b5e20', '#2e7d32', '#43a047', '#66bb6a', '#81c784'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 } } }
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
    
    const colores = {
        efectivo: '#2e7d32',
        yape: '#ffc107',
        plin: '#2196f3',
        transferencia: '#9c27b0',
        tarjeta: '#ff5722'
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels.map(l => l.toUpperCase()) : ['Sin datos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: labels.map(l => colores[l] || '#666'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 } } }
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
    mostrarAlerta('✅ Configuración guardada exitosamente', 'success');
}

function cargarLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').src = e.target.result;
            configEmpresa.logo = e.target.result;
            guardarDatos();
            mostrarAlerta('✅ Logo actualizado', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function mostrarModalUsuario() {
    if (usuarioActual && usuarioActual.rol === 'vendedor') {
        mostrarAlerta('❌ Solo el propietario puede gestionar usuarios', 'error');
        return;
    }
    document.getElementById('modalUsuario').style.display = 'flex';
    document.getElementById('formUsuario').reset();
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
}

document.getElementById('formUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    const usuario = document.getElementById('nuevoUsuario').value.trim();
    const password = document.getElementById('nuevaPassword').value.trim();
    const rol = document.getElementById('nuevoRol').value;
    
    if (!usuario || !password) {
        mostrarAlerta('⚠️ Complete todos los campos', 'error');
        return;
    }
    
    if (usuarios[usuario]) {
        mostrarAlerta('⚠️ Este usuario ya existe', 'error');
        return;
    }
    
    usuarios[usuario] = { password, rol };
    guardarDatos();
    cerrarModalUsuario();
    actualizarListaUsuarios();
    mostrarAlerta('✅ Usuario agregado exitosamente', 'success');
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
        input.addEventListener('change', calcularTotales);
    });
    
    calcularTotales();
    actualizarNumeroFactura();
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.getElementById('tipoDocumento').addEventListener('change', actualizarNumeroFactura);

// Cargar configuración
document.getElementById('empNombre').value = configEmpresa.nombre;
document.getElementById('empRuc').value = configEmpresa.ruc;
document.getElementById('empDireccion').value = configEmpresa.direccion;
document.getElementById('empTelefono').value = configEmpresa.telefono;
document.getElementById('empEmail').value = configEmpresa.email;
document.getElementById('logoPreview').src = configEmpresa.logo;

actualizarListaUsuarios();
limpiarFactura();

console.log('🌱 Agro Nexus SAC - Sistema de Facturación');
console.log('📦 Productos:', productos.length);
console.log('🧾 Ventas:', ventas.length);
console.log('👤 Usuarios:', Object.keys(usuarios));
