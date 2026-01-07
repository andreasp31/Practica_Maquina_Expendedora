let saldoTotal = 0;
let productoSeleccionado = ""; 
let productos = [];
let productoActual = null;

async function conectarServidor(accion,datos = {}){
    try{
        let respuesta;
        if(accion === "obtenerProductos"){
            respuesta = await fetch("http://localhost:3000/api/productos");
        }
        else if(accion === "comprar"){
            respuesta = await fetch("http://localhost:3000/api/comprar",{
                method: 'POST',
                headers:{
                    'Content-Type':'application/json',
                },
                body: JSON.stringify(datos)
            });
        }
        const resultados = await respuesta.json();
        return resultados;
    }
    catch(error){
        console.log("No se ha conectado con el servidor");
    }
}

//Al cargar la página 
document.addEventListener('DOMContentLoaded',async function(){ 
    //cargar productos del servidor
    const productosServidor = await conectarServidor("obtenerProductos");   
    console.log("Productos cargados", productosServidor);

    if(productosServidor){
        productos = productosServidor;
        console.log("Productos cargados del servidor");
    }

    let botonDinero = document.getElementById('ir_monedas');
    let botonCerrar = document.getElementById('volver_maquina');
    let botonConfirmarSaldo = document.getElementById('boton_saldo');
    let botonConfirmarProducto = document.getElementById('icono_teclado2');
    let botonAdmin = document.getElementById('seccion_admin');
    let botonCerrar2 = document.getElementById('volver_maquina2');
    
    if (botonDinero) {
        botonDinero.addEventListener('click', function(){
            console.log("Al dar el botón de las monedas, abre el modal");
            mostrarModal();
        });
    }
    
    if (botonCerrar) {
        botonCerrar.addEventListener('click', function(){
            console.log("Al dar el botón cerrar, cierra el modal");
            ocultarModal();
            resetearSaldo();
        });
    }

    if (botonAdmin) {
        botonAdmin.addEventListener('click', function(){
            console.log("Al dar el botón de la llave, abre el modal administrador");
            mostrarModal2();
        });
    }
    
    if (botonCerrar2) {
        botonCerrar2.addEventListener('click', function(){
            console.log("Al dar el botón cerrar 2, cierra el modal");
            ocultarModal2();
        });
    }

    if(botonConfirmarSaldo){
        botonConfirmarSaldo.addEventListener('click',function(){
            console.log("Guardamos saldo para elegir producto");
            ocultarModal();
            let pantallaInfo = document.getElementById('pantalla_info');
            pantallaInfo.textContent = "Saldo introducido: " + saldoTotal.toFixed(2) + "€";
        })
    }

    if(botonConfirmarProducto){
        botonConfirmarProducto.addEventListener('click', async function(){
            await confirmarCompra();
        });
    }
    
    // Ocultar modal al inicio
    let modal = document.getElementById('ventana_dinero');
    let ventana = document.getElementById('ventana_cartera');
    let modal2 =  document.getElementById('ventana_admin');
    let ventana2 = document.getElementById('ventana_interior2');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (ventana) {
        ventana.style.display = 'none';
    }
    if (modal2) {
        modal2.style.display = 'none';
    }
    if (ventana2) {
        ventana2.style.display = 'none';
    }
    configurarMonedas();
    configurarNumeros();
    borrarDigito();
});

function mostrarModal() {
    let modal = document.getElementById('ventana_dinero');
    let ventana = document.getElementById('ventana_cartera');
    
    if (modal && ventana) {
        modal.style.display = 'flex';
        ventana.style.display = 'flex';
    }
}

function ocultarModal() {
    let modal = document.getElementById('ventana_dinero');
    let ventana = document.getElementById('ventana_cartera');
    
    if (modal && ventana) {
        modal.style.display = 'none';
        ventana.style.display = 'none';
    }
}

async function mostrarModal2() {
    let modal2 = document.getElementById('ventana_admin');
    let ventana2 = document.getElementById('ventana_interior2');
    
    if (modal2 && ventana2) {
        modal2.style.display = 'flex';
        ventana2.style.display = 'flex';
    }

    const datosCaja = await verCaja();
    let cajaActual = document.getElementById('caja_total');
    cajaActual.textContent = datosCaja.data.saldoMaquina + "€";
    let cambiosActual = document.getElementById('cambios_total');
    cambiosActual.textContent = datosCaja.data.saldoCambio + " €";

    const datosProducto = await verProducto();

    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let elementoStock = document.getElementById(`stock_${producto.codigo}`);
        if(elementoStock){
            elementoStock.textContent = producto.stock;
        }
    }   
    
    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let elementoPrecio = document.getElementById(`precio_${producto.codigo}`);
        if(elementoPrecio){
            elementoPrecio.textContent = producto.precio;
        }
    }
    sumarStock();
    sumarPrecio();
    sacarDinero();
    ponerCambios();

    let botonGuardar = document.getElementById('boton_guardar_admin');
    botonGuardar.addEventListener('click', async function(){
        guardarStockServidor();
        guardarPreciosServidor();
        guardarCaja();
        let informacion_general = document.getElementById('mensaje_informativo_general');
        informacion_general.textContent = "Los datos fueron actualizados correctamente, reiniciar la máquina"
    })
}

async function verProducto(){
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const datos = await respuesta.json();
    return datos;
}

async function verCaja(){
    const respuesta = await fetch("http://localhost:3000/api/caja");
    const datos = await respuesta.json();
    return datos;
}

function sumarStock(){
    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let botonMas =  document.getElementById(`mas_${producto.codigo}`)
        let botonMenos =  document.getElementById(`menos_${producto.codigo}`)
        let contador = document.getElementById(`mas_stock_${producto.codigo}`);
        if(botonMas && contador){
            botonMas.addEventListener('click',function(){
                let valorActual = parseInt(contador.textContent);
                valorActual++;
                contador.textContent = valorActual;
            })
        }
        if(botonMenos && contador){
            botonMenos.addEventListener('click',function(){
                let valorActual = parseInt(contador.textContent);
                valorActual--;
                contador.textContent = valorActual;
                if(parseInt(contador.textContent) < 0){
                    contador.textContent = 0;
                }
            })
        }
    } 
}

function sumarPrecio(){
    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let botonMas =  document.getElementById(`masp_${producto.codigo}`)
        let botonMenos =  document.getElementById(`menosp_${producto.codigo}`)
        let contador = document.getElementById(`mas_precio_${producto.codigo}`);
        if(botonMas && contador){
            botonMas.addEventListener('click',function(){
                let valorActual = parseInt(contador.textContent);
                valorActual++;
                contador.textContent = valorActual;
            })
        }
        if(botonMenos && contador){
            botonMenos.addEventListener('click',function(){
                let valorActual = parseInt(contador.textContent);
                valorActual--;
                contador.textContent = valorActual;
                if(parseInt(contador.textContent) < 0){
                    contador.textContent = 0;
                }
            })
        }
    } 
}

async function sacarDinero(){
    const datosCaja = await verCaja();
    let retirarCaja = document.getElementById('mas_dinero_retirar');
    let botonMas =  document.getElementById('botonR_mas')
    let botonMenos =  document.getElementById('botonR_menos')
    if(botonMas && retirarCaja){
        botonMas.addEventListener('click',function(){
            let valorActual = parseInt(retirarCaja.textContent);
            valorActual++;
            retirarCaja.textContent = valorActual;
        })
    }
    if(botonMenos && retirarCaja){
        botonMenos.addEventListener('click',function(){
            let valorActual = parseInt(retirarCaja.textContent);
            valorActual--;
            retirarCaja.textContent = valorActual;
            if(parseInt(retirarCaja.textContent) < 0){
                retirarCaja.textContent = 0;
            }
        })
    }
}

async function ponerCambios(){
    const datosCaja = await verCaja();
    let ponerCambio = document.getElementById('mas_dinero_cambios');
    let botonMas =  document.getElementById('botonC_mas')
    let botonMenos =  document.getElementById('botonC_menos')
    if(botonMas && ponerCambio){
        botonMas.addEventListener('click',function(){
            let valorActual = parseInt(ponerCambio.textContent);
            valorActual++;
            ponerCambio.textContent = valorActual;
        })
    }
    if(botonMenos && ponerCambio){
        botonMenos.addEventListener('click',function(){
            let valorActual = parseInt(ponerCambio.textContent);
            valorActual--;
            ponerCambio.textContent = valorActual;
            if(parseInt(ponerCambio.textContent) < 0){
                ponerCambio.textContent = 0;
            }
        })
    }
}

async function guardarStockServidor(){
    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let contador = document.getElementById(`mas_stock_${producto.codigo}`);
        let stockAdicional = parseInt(contador.textContent);

        if(!contador) {
            console.log(`No se encontró contador para producto ${producto.codigo}`);
        }

        if(stockAdicional > 0){
            try{
                let nuevoStock = producto.stock + stockAdicional;
                const actualizar = await fetch(`http://localhost:3000/api/admin/producto/${producto.codigo}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        stock: nuevoStock 
                    })
            });
            if(actualizar.ok){
                productos[i].stock = nuevoStock;
                contador.textContent = "0";
            }
            console.log("Stock actualizado", nuevoStock);
            }
            catch(error){
                console.log("Ha habido un error al actualizar el stock " ,error);
            }
        }
        else{
            console.log("No hay ningún cambio de stock");
        }
    } 
}

async function guardarPreciosServidor(){
    for(let i=0; i<productos.length; i++){
        let producto = productos[i];
        let contador = document.getElementById(`mas_precio_${producto.codigo}`);
        let precioAdicional = parseInt(contador.textContent);

        if(!contador) {
            console.log(`No se encontró contador para producto ${producto.codigo}`);
        }

        if(precioAdicional > 0){
            try{
                let nuevoPrecio = producto.precio + precioAdicional;
                const actualizar = await fetch(`http://localhost:3000/api/admin/producto/${producto.codigo}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        precio: nuevoPrecio
                    })
            });
            if(actualizar.ok){
                productos[i].precio = nuevoPrecio;
                contador.textContent = "0";
            }
            console.log("Precio actualizado", nuevoPrecio);
            }
            catch(error){
                console.log("Ha habido un error al actualizar el precio " ,error);
            }
        }
        else{
            console.log("No hay ningún cambio de precio");
        }
    } 
}

async function guardarCaja(){
    try{
        const datosCaja = await verCaja();
        let saldoMaquinaActual = datosCaja.data.saldoMaquina;
        let saldoCambioActual = datosCaja.data.saldoCambio;

        let contador_retirar = document.getElementById('mas_dinero_retirar');
        let retirada = parseInt(contador_retirar.textContent); 

        let contador_cambios = document.getElementById('mas_dinero_cambios');
        let cambios = parseInt(contador_cambios.textContent); 

        if(retirada === 0 && cambios === 0) {
            console.log("No hay cambios en la caja para guardar");
            alert("No hay cambios en la caja para guardar");
            return;
        }

        if(retirada > 0){
            if(saldoMaquinaActual < retirada){
                console.log("No hay suficiente saldo para retirar");
                return;
            }
            const actualizar_retirada = await fetch(`http://localhost:3000/api/admin/retirar`,{
                method: 'POST',
                headers:{
                    'Content-Type':'application/json',
                },
                body: JSON.stringify({
                    cantidad: retirada
                })
            })
            if(actualizar_retirada.ok){
                const resultadoRetirar = await actualizar_retirada.json();
                contador_retirar.textContent = "0";
                let notificacion = document.getElementById('mensaje_informativo_retirar');
                notificacion.textContent =  "Se han retirado:" + retirada + " €";
            }
            
        }

        if(cambios > 0){
            const actualizar_cambios = await fetch(`http://localhost:3000/api/admin/agregar`,{
                method: 'POST',
                headers:{
                    'Content-Type':'application/json',
                },
                body: JSON.stringify({
                    cantidad: cambios
                })
            })
            const resultadoCambio = await actualizar_cambios.json();
            contador_cambios.textContent = "0";
            let notificacion = document.getElementById('mensaje_informativo_cambios');
            notificacion.textContent =  "Se han añadido:" + cambios + " €, para cambios"
        }

    }
    catch(error){

    }

}


function ocultarModal2(){
    let modal2 = document.getElementById('ventana_admin');
    let ventana2 = document.getElementById('ventana_interior2');
    
    if (modal2 && ventana2) {
        modal2.style.display = 'none';
        ventana2.style.display = 'none';
    }
}

function configurarMonedas(){
    let monedas = document.querySelectorAll('.botones_monedas');
    for(let i=0; i<monedas.length; i++){
        monedas[i].addEventListener('click',function(){
            let monedaId = this.id;
            console.log("Moneda seleccionada: ", monedaId);

            let valorMoneda =  obtenerValor(monedaId);

            if(valorMoneda>0){
                agregarMoneda(valorMoneda);
            }
        });
    }
}

function obtenerValor(monedaId){
    switch(monedaId){
        case '5c':{
            console.log("Añadido: 0,05€");
            return 0.05;
        }
        case '10c':{
            console.log("Añadido: 0,10€");
            return 0.10;
        }
        case '20c':{
            console.log("Añadido: 0,20€");
            return 0.20;
        }
        case '50c':{
            console.log("Añadido: 0,50€");
            return 0.50;
        }
        case '1e':{
            console.log("Añadido: 1€");
            return 1;
        }
        case '2e':{
            console.log("Añadido: 2€");
            return 2;
        }
        case '5e':{
            console.log("Añadido: 5€");
            return 5;
        }
        case '10e':{
            console.log("Añadido: 10€");
            return 10;
        }
        case '20e':{
            console.log("Añadido: 20€");
            return 20;
        }
        default:{
            console.log("Moneda no encontrada");
            return 0;
        }
    }
}

function agregarMoneda(valor){
    saldoTotal += valor;

    console.log("Total de saldo: " + saldoTotal.toFixed(2) + "€");
    actualizarContador();
}

function actualizarContador(){
    let contador = document.getElementById('saldoReal');
    if(contador){
        contador.textContent = saldoTotal.toFixed(2) + "€";
    }
    else{
        console.log("No hay el elemento buscado.")
    }
}

function resetearSaldo(){
    saldoTotal = 0;
    console.log("Resetear saldo");
    actualizarContador();
}

function configurarNumeros(){
    let numeros = document.querySelectorAll('.teclas');
    for(let i=0; i<numeros.length; i++){
        numeros[i].addEventListener('click',function(){
            let numeroId = this.id;
            console.log("Número seleccionado: ", numeroId);

            let valorNumero =  obtenerValorNumero(numeroId);

            if(valorNumero>=0){
                agregarNumero(valorNumero);
            }
        });
    }
}

function obtenerValorNumero(numeroId){
    switch(numeroId){
        case 'tecla0':{
            console.log("Tecla 0");
            return 0;
        }
        case 'tecla1':{
            console.log("Tecla 1");
            return 1;
        }
        case 'tecla2':{
            console.log("Tecla 2");
            return 2;
        }
        case 'tecla3':{
            console.log("Tecla 3");
            return 3;
        }
        case 'tecla4':{
            console.log("Tecla 4");
            return 4;
        }
        case 'tecla5':{
            console.log("Tecla 5");
            return 5;
        }
        case 'tecla6':{
            console.log("Tecla 6");
            return 6;
        }
        case 'tecla7':{
            console.log("Tecla 7");
            return 7;
        }
        case 'tecla8':{
            console.log("Tecla 8");
            return 8;
        }
        case 'tecla9':{
            console.log("Tecla 9");
            return 9;
        }
        default:{
            console.log("No hay teclas");
        }
    }
}

function agregarNumero(numero){
    if(productoSeleccionado.length < 2){
        productoSeleccionado += numero.toString();
        actualizarContadorNumeros();
        if(productoSeleccionado.length == 2){
            buscarProductoMostrar();
        }
    }
    else{
        console.log("Máximo 2 dígitos");
    }
}

function actualizarContadorNumeros(){
    let pantallaSelectora = document.getElementById('pantalla_selector');
    if(pantallaSelectora){
        pantallaSelectora.textContent  = "Selecciona el producto: " + productoSeleccionado;
    }
    else{
        console.log("No hay el elemento buscado.")
    }
}

function borrarDigito(){
    let teclaBorrar = document.getElementById('icono_teclado1');
    if(teclaBorrar){
        teclaBorrar.addEventListener('click',function(){
            if(productoSeleccionado.length>0){
                productoSeleccionado = productoSeleccionado.slice(0,-1);
                actualizarContadorNumeros();
            }
        })
    }
}

//Función que busca mediante el código que hemos seleccionado entre los productos que cargamos desde la base de datos
function buscarProducto(codigo){
    for(let i=0; i<productos.length; i++){
        if(productos[i].codigo === codigo){
            console.log("Producto encontrado", productos[i])
            return productos[i];
        }
    }
    return null;
}

function calcularCaja(){

}

function buscarProductoMostrar(){
    productoActual = buscarProducto(productoSeleccionado);
    if(productoActual){
        let mostrarPrecio = document.getElementById('precio_producto');
        if(mostrarPrecio){
            mostrarPrecio.textContent = "Precio: " + productoActual.precio + " €";
        }
    }
    else{
        console.log("Producto no encontrado");
    }
}

function mostrarMensajeEnPantalla(mensaje, color) {
    const pantalla = document.getElementById('pantalla_info');
    if (pantalla) {
        pantalla.textContent = mensaje;
        pantalla.style.color = color === "ok" ? "#58431B" : 
                              color === "mal" ? "#581B1B" : "#ffffff";
    }
}

async function confirmarCompra(){
    //Verificar que hay un producto seleccionado
    if(!productoSeleccionado || productoSeleccionado.length !== 2){
        mostrarMensajeEnPantalla("Selecciona producto e inserta dinero", "mal");
        return;
    }

    // Verificar saldo
    if(saldoTotal <= 0){
        mostrarMensaje("Inserta dinero primero", "mal");
        return;
    }

    productoActual = buscarProducto(productoSeleccionado);

    //Verificar stock del producto
    if(productoActual.stock <= 0){
        mostrarMensaje("Producto agotado", "mal");
        return;
    }

    //Verificar que haya saldo suficiente 
    if(saldoTotal < productoActual.precio){
        const dineroFalta = (productoActual.precio - saldoTotal).toFixed(2);
        mostrarMensaje(`Faltan ${dineroFalta}€`, "mal");
    }


    const resultado = await conectarServidor("comprar",{
        codigo: productoSeleccionado,
        pagoRecibido: saldoTotal
    })


    //Efectuar compra
    if(resultado){
        mostrarMensajeEnPantalla("Producto comprado", "ok");
        const cambio = saldoTotal - productoActual.precio;
        if(cambio > 0){
            const devolverCambio = document.getElementById('cambio');
            if(devolverCambio){
            devolverCambio.textContent = "Cambio: " + saldoTotal.toFixed(2) + "€";
            }
        }
        let recoger = document.getElementById('compra_realizada');
        recoger.addEventListener('click',function(){
            if(recoger){
                compra.textContent = "Muchas gracias"
                resetearTodo();
            }
        })
        //actualizar el stock localmente por si se quiere realizar otra compra
        productoActual.stock -= 1;
        setTimeout(()=>{
            resetearTodo();
        },3000);
    }
    else{
        console.log("Error en al compra");
    }

}

function resetearTodo(){
    resetearSaldo();
    productoSeleccionado = "";
    precioProducto = 0;
    let pantallaSelectora = document.getElementById('pantalla_selector');
    if(pantallaSelectora) pantallaSelectora.textContent = "";
    
    let precioReserear = document.getElementById('precio_producto');
    if(precioReserear){
        precioReserear.textContent = "";
    }
    
    let devolverCambioElem = document.getElementById('cambio');
    if(devolverCambioElem){
        devolverCambioElem.textContent = "";
    }
    
    let compra = document.getElementById('compra_realizada');
    if(compra){
        compra.textContent = "";
    } 
    let pantallaInfoReserear = document.getElementById('pantalla_info');
    if(pantallaInfoReserear){
        pantallaInfoReserear.textContent = "Introduce su saldo: ";
    }
}