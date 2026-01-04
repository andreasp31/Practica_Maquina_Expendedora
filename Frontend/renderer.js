console.log("INICIANDO");

let saldoTotal = 0;
let productoSeleccionado = ""; 
let productos = [];

document.addEventListener('DOMContentLoaded', function(){    
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
        botonConfirmarProducto.addEventListener('click',function(){
            buscarProductoMostrar()
            confirmarCompra();
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

function mostrarModal2() {
    let modal2 = document.getElementById('ventana_admin');
    let ventana2 = document.getElementById('ventana_interior2');
    
    if (modal2 && ventana2) {
        modal2.style.display = 'flex';
        ventana2.style.display = 'flex';
    }
}

function ocultarModal2() {
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

function buscarProducto(codigo){
    let codigoNum = parseInt(codigo);
    for(let i=0; i<productos.length; i++){
        if(productos[i].id === codigoNum){
            return productos[i];
        }
    }
    return null;
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

function confirmarCompra(){
    if(!productoActual){
        console.log("Primero selecciona un porducto por teclado");
        return;
    }
    if(saldoTotal >= productoActual.precio){
        saldoTotal -= productoActual.precio;
        console.log("Compra realizada");
        actualizarContador();
        let devolverCambio = document.getElementById('cambio');
        if(devolverCambio){
            devolverCambio.textContent = "Cambio: " + saldoTotal.toFixed(2) + "€";
        }
        let compra = document.getElementById('compra_realizada');
        if(compra){
            compra.textContent = "Producto " + productoActual.id + " comprado, recógelo..."
        }
        let recoger = document.getElementById('seccion_recoger');
        recoger.addEventListener('click',function(){
            if(recoger){
                compra.textContent = "Muchas gracias"
                resetearTodo();
            }
        })
        

    }
    else{
        console.log("No tienes suficiente saldo");
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