// Importar herramientas
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv")
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


//conectar con mongodb
async function connectarBd(){
    try{
        console.log("Iniciando conexión a MongoDB...")
        await mongoose.connect(process.env.MONGODB_URI,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Conectado a MongoDB");
        await iniciarProductos();
        await iniciarMonedas();

        app.listen(PORT,'0.0.0.0', () =>{
            console.log(`Servidor ejecutándose en http://localhost:${3000}`);
        }); 
    }
    catch(error){
        console.log("Error en conexión a MongoDB: ", error);
    }
}

//Esquemas

const ProductoEsquema = new mongoose.Schema({
    codigo: String,
    precio: Number,
    stock: Number
});

const VentaEsquema= new mongoose.Schema({
    codigoProducto: String,
    precio: Number,
    pagoRecibido: Number,
    cambioDevuelto: Number,
    monedasCambio:[{
        tipo: String,
        valor: Number,
        cantidad: Number
    }]
});

const CajaEsquema = new mongoose.Schema({
    saldoMaquina: { type: Number, default: 100 },
    saldoCambio: { type: Number, default: 50 }
});

//Para saber que monedas hay en la caja y devolverla añado un nuevo esquema para las monedas
const MonedaEsquema = new mongoose.Schema({
    valor: Number,
    cantidad: {
        type: Number,
        default: 0
    },
    tipo: String
})

const Producto = mongoose.model('Producto', ProductoEsquema);
const Venta = mongoose.model('Venta', VentaEsquema);
const Caja = mongoose.model('Caja', CajaEsquema);
const Moneda = mongoose.model('Moneda',MonedaEsquema);

//Iniciar la base de datos con datos base
async function iniciarProductos(){
    const lista = await Producto.countDocuments();
    if(lista === 0){
        const productos = [
            {codigo:'10',precio:3.00,stock:10},
            {codigo:'11',precio:3.00,stock:10},
            {codigo:'12',precio:3.00,stock:10},
            {codigo:'13',precio:3.00,stock:10},
            {codigo:'14',precio:2.50,stock:10},
            {codigo:'15',precio:2.50,stock:10},
            {codigo:'16',precio:2.50,stock:10},
            {codigo:'17',precio:2.50,stock:10},
            {codigo:'18',precio:2.00,stock:10},
            {codigo:'19',precio:2.00,stock:10},
            {codigo:'20',precio:2.00,stock:10},
            {codigo:'21',precio:2.00,stock:10}
        ];
        await Producto.insertMany(productos);
    }
}

//Iniciar la base de datos con unas monedas
async function iniciarMonedas(){
    const lista = await Moneda.countDocuments();
    if(lista === 0){
        const monedas = [
            { valor: 0.05, tipo: "5c", cantidad: 20 },
            { valor: 0.10, tipo: "10c", cantidad: 20 },
            { valor: 0.20, tipo: "20c", cantidad: 20 },
            { valor: 0.50, tipo: "50c", cantidad: 20 },
            { valor: 1.00, tipo: "1e", cantidad: 20 },
            { valor: 2.00, tipo: "2e", cantidad: 15 },
            { valor: 5.00, tipo: "5e", cantidad: 5 },
            { valor: 10.00, tipo: "10e", cantidad: 2 },
            { valor: 20.00, tipo: "20e", cantidad: 2 }
        ]
        await Moneda.insertMany(monedas);
    }
}

//  -- Rutas --

//Obtener productos, se va a necesitar para saber datos de los productos como el precio
app.get('/api/productos',async(req,res)=>{
    try{
        const productos = await Producto.find();
        res.json(productos);
    }
    catch(error){
        console.log("Error al obtener productos",error);
    }
})

// Realizar una compra
app.post('/api/comprar',async(req,res)=>{
    try{
        console.log("=== INICIANDO COMPRA ===");
        console.log("Datos recibidos:", req.body);
        
        const {codigo,pagoRecibido} = req.body;
        // Validar datos recibidos, si no hay código o dinero no hay datos suficientes para la compra 
        if (!codigo || !pagoRecibido) {
            return res.status(400).json({ 
                success: false, 
                error: "Datos incompletos" 
            });
        }

        //Buscamos el producto por el código
        const producto = await Producto.findOne({codigo});
        if(!producto){
            console.log("Producto no encontrado");
            return res.status(404).json({
                success: false,
                error: `Producto ${codigo} no encontrado`
            });
        }
        //Si el producto está agotado
        if(producto.stock <=0){
            console.log("Producto agotado");
            return res.status(400).json({
                success: false,
                error: `Producto ${codigo} agotado`
            });
        }
        //Si el pago que ponemos es menor que el precio del producto
        if(pagoRecibido < producto.precio){
            console.log("Dinero insuficiente");
            return res.status(400).json({
                success: false,
                error: `Dinero insuficiente. Necesitas ${(producto.precio - pagoRecibido).toFixed(2)}€ más`
            });
        }
        let caja = await Caja.findOne();
        if(!caja){
            caja = await Caja.create({});
        }
        
        //Calculamos el cambio
        const cambio = parseFloat((pagoRecibido - producto.precio).toFixed(2));
        console.log(`Producto: ${producto.codigo}, Precio: ${producto.precio}€, Pago: ${pagoRecibido}€, Cambio: ${cambio}€`);
        
        if(cambio > 0){
            let monedasDisponibles = (await Moneda.find({cantidad:{$gt:0}}));
            //Ordenar de mayor a menor valor
            monedasDisponibles.sort((a,b)=>b.valor - a.valor);
            
            // Trabajar en centésimas para evitar errores de punto flotante
            let cambioRestanteCentimos = Math.round(cambio * 100);
            let monedasDevolver = [];
            let desgloseMonedas = "";

            console.log(`Cambio a devolver: ${cambio}€ (${cambioRestanteCentimos} centimos)`);

            for(let i=0; i<monedasDisponibles.length;i++){
                let moneda = monedasDisponibles[i];
                if(cambioRestanteCentimos <= 0){
                    break;
                }
                
                // Convertir valor de moneda a centimos
                let valorMonedaCentimos = Math.round(moneda.valor * 100);
                
                if(valorMonedaCentimos <= cambioRestanteCentimos){
                    let cantidadNecesaria = Math.floor(cambioRestanteCentimos / valorMonedaCentimos);
                    let cantidadUsar = Math.min(cantidadNecesaria, moneda.cantidad);

                    if(cantidadUsar > 0){
                        // Restar en centimos
                        cambioRestanteCentimos -= cantidadUsar * valorMonedaCentimos;

                        // Restar monedas usadas de la base de datos
                        moneda.cantidad -= cantidadUsar;
                        await moneda.save();

                        const totalMonedas = parseFloat((cantidadUsar * moneda.valor).toFixed(2));
                        monedasDevolver.push({
                            tipo: moneda.tipo,
                            cantidad: cantidadUsar,
                            valor: moneda.valor,
                            total: totalMonedas
                        });
                        
                        desgloseMonedas += `${cantidadUsar} x ${moneda.tipo} (${moneda.valor}€) = ${totalMonedas.toFixed(2)}€\n`;
                        
                        console.log(`Usando ${cantidadUsar} monedas de ${moneda.valor}€. Cambio restante: ${(cambioRestanteCentimos/100).toFixed(2)}€`);
                    }
                }
            }
            
            // Convertir de nuevo a euros
            let cambioRestanteEuro = cambioRestanteCentimos / 100;
            console.log("Cambio restante final:", cambioRestanteEuro.toFixed(2), "€");

            //Ver si se puede dar todo el cambio (usar tolerancia para errores de redondeo)
            if(cambioRestanteEuro > 0.01){
                console.log("No se puede dar todo el cambio. Faltante:", cambioRestanteEuro.toFixed(2), "€");
                
                for (let monedaUsada of monedasDevolver) {
                    await Moneda.findOneAndUpdate(
                        { tipo: monedaUsada.tipo },
                        { $inc: { cantidad: monedaUsada.cantidad } }
                    );
                }
                
                return res.status(400).json({
                    success: false,
                    error: "No hay cambio suficiente en la máquina",
                    cambioFaltante: cambioRestanteEuro,
                    cambioNecesario: cambio
                });
            }

            //Reducir stock
            producto.stock -= 1;
            await producto.save();

            //Actualizar caja
            caja.saldoMaquina += producto.precio;
            caja.saldoCambio -= cambio;
            await caja.save();

            //Guardar venta
            const venta = await Venta.create({
                codigoProducto: producto.codigo,
                precio: producto.precio,
                pagoRecibido: pagoRecibido,
                cambioDevuelto: cambio,
                monedasCambio: monedasDevolver
            });
            
            console.log("Compra exitosa con cambio. Monedas devueltas:", monedasDevolver);
            
            //Mensajes detallados para el front 
            return res.json({
                success: true,
                message: "Compra realizada con éxito",
                producto: producto.codigo,
                precio: producto.precio,
                pagoRecibido: pagoRecibido,
                cambio: cambio,
                monedasCambio: monedasDevolver,
                cambioDesglose: desgloseMonedas,
                nuevoStock: producto.stock,
                ventaId: venta._id
            });
        }
        else{
            //Caso sin cambio, si el pago es exacto
            console.log("Compra sin cambio (pago exacto)");
            
            //Reducir stock
            producto.stock -= 1;
            await producto.save();

            //Actualizar caja
            caja.saldoMaquina += producto.precio;
            await caja.save();

            //Guardar venta
            const venta = await Venta.create({
                codigoProducto: producto.codigo,
                precio: producto.precio,
                pagoRecibido: pagoRecibido,
                cambioDevuelto: 0,
                monedasCambio: []
            });
            
            console.log("Compra exitosa sin cambio");
            
            //Mensajes detallados para el front 
            return res.json({
                success: true,
                message: "Compra realizada con éxito",
                producto: producto.codigo,
                precio: producto.precio,
                pagoRecibido: pagoRecibido,
                cambio: 0,
                monedasCambio: [],
                cambioDesglose: "",
                nuevoStock: producto.stock,
                ventaId: venta._id
            });
        }

    }
    catch(error){
        console.log("Error en la compra:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor: " + error.message
        });
    }
});

//Obtener la caja
app.get('/api/caja',async(req,res)=>{
    try {
        const caja = await Caja.findOne();
        //Si no hay caja se crea
        if (!caja) {
            const nuevaCaja = await Caja.create({});
            console.log("Crear caja")
        }
        res.json({ success: true, data: caja });
    } 
    catch (error) {
        console.log("Hubo un error en la caja");
    }
})

//Actualizar producto stock y precio
app.put('/api/admin/producto/:codigo',async(req,res)=>{
    try{
        const {codigo} = req.params;
        const {stock,precio} = req.body;
        const stock_maximo = 10;

        const producto = await Producto.findOne({codigo});
        if(!producto){
            console.log("Producto no encontrado");
            return res.status(404).json({ 
                success: false, 
                error: `Producto ${codigo} no encontrado` 
            });
        }
        //Si el stock tiene un valor
        if (stock !== undefined) {
            //Si el stock es mayor que el máximo, se queda con el actual
            if(stock > stock_maximo){
                return res.status(400).json({ 
                    success: false, 
                    error: `El stock no puede superar ${stock_maximo} unidades`,
                    stockActual: producto.stock,
                    stockMaximo: stock_maximo,
                });
            }
            //Si el stock es negativo queda como estaba
            if(stock < 0){  
                console.log("No puede ser el stock negativo");
                return res.status(400).json({ 
                    success: false, 
                    error: "El stock no puede ser negativo",
                    stockActual: producto.stock,
                    stockSolicitado: stock
                });
            }
            //Actualizamos si es positivo
            console.log(`Actualizando stock de ${producto.stock} a ${stock}`);
            producto.stock = stock;
        }
        //Si el precio está definido
        if (precio !== undefined) {
            //Si el precio es negativo o cero, no es válido
            if (precio <= 0) {
                console.log(`Precio no válido: ${precio}`);
                return res.status(400).json({ 
                    success: false, 
                    error: "El precio debe ser mayor que 0",
                    precioActual: producto.precio,
                });
            }
            //Se actualiza por uno válido
            console.log(`Actualizando precio de ${producto.precio} a ${precio}`);
            producto.precio = precio;
        }
        await producto.save();
        console.log("Producto actualizado");
        return res.json({ 
            success: true, 
            message: "Producto actualizado correctamente",
            producto 
        });
    }
    catch(error){
        console.log("Error");
    }
})
//Actualizamos una retirada de la caja, que tenga que ser inferior a la caja 
app.post('/api/admin/retirar',async(req,res)=>{
    try{
        const{cantidad} = req.body;
        let caja = await Caja.findOne();
        if(!caja){
            caja = await Caja.create({});
        }
        if(caja.saldoMaquina < cantidad){
            console.log("Saldo insuficiente en la maquina");
        }
        caja.saldoMaquina = caja.saldoMaquina - cantidad;
        await caja.save();
        console.log("Se retiraron: ", cantidad);
    }
    catch(error){
        console.log("Error")
    }
})

//Por otro lado tenemos una caja extra que sirve para los cambios y vamos añadiendo a medida que se va usando
app.post('/api/admin/agregar',async(req,res)=>{
    try{
        const{cantidad} = req.body;
        let caja = await Caja.findOne();
        if(!caja){
            caja= await Caja.create({});
        }
        caja.saldoCambio = caja.saldoCambio + cantidad;
        await caja.save();
        console.log("Se añadieron:", cantidad, " para cambios");
    }
    catch(error){
        console.log("Error: ", error);
    }
})

//Obtenemos las monedas
app.get('/api/monedas',async(req,res)=>{
    try{
        //Buscamos la colección de monedas y ordena los cambos en orden ascendente(1)
        const monedas = (await Moneda.find()).sort({valor:1});
        res.json({ 
            success: true, 
            data: monedas 
        });
    }
    catch(error){
        console.error("Error obteniendo monedas:", error);
    }
})

//Actualizamos las monedas
app.put('/api/monedas/:tipo',async(req,res)=>{
    try{
        const{tipo} = req.params;
        const{cantidad} = req.body;

        const moneda = await Moneda.findOne({tipo});
        if(!moneda){
            return res.status(404).json({
                success: false, 
                error: "Moneda no encontrada"
            })
        }
        moneda.cantidad = cantidad;
        await moneda.save();
        res.json({
            success:true,
            message:"Moneda actualizada"
        })
    }
    catch(error){
        console.error("Error actualizando monedas:", error);
    }
})

//Algoritmo para calcular cambio con monedas disponibles (Aquí tuve que buscar también algo que estaba perdida)
app.post('/api/calcular-cambio',async(req,res)=>{
    try{
        //Cantidad a devolver la recogemos del frontend
        const {cantidad} = req.body;

        //aqui buscamos las monedas disponibles ($gt sirve como "mayor que" es un operador de consulta de mongodb) de mayor a menor valor
        const monedasDisponibles = (await Moneda.find({cantidad:{$gt:0}})).sort({valor:-1});

        //Voy a ponerlo con un ejemplo para entenderlo mejor
        //Ejemplo: 3.50 a devolver en el cambio
        let cambioRestante = cantidad;
        //Array para guardar las monedas a devolver
        let cambio = [];
        //Array para registrar que monedas usamos
        let monedasUsadas = [];

        //Copia para no modificar la original
        let monedasTemporales = [];
        for(let i=0; i<monedasDisponibles.length; i++){
            let moneda = monedasDisponibles[i];
            monedasTemporales.push({
                valor: moneda.valor,
                cantidad: moneda.cantidad,
                tipo: moneda.tipo
            })
        }

        //Algoritmo voraz
        for(let i=0; i<monedasTemporales.length;i++){
            let moneda = monedasTemporales[i];

            if(cambioRestante <=0){
                break;
            }
            //Primera vuelta, y sigue hasta que la cantidad sea = 0
            // aqui cogemos y divide 3.50 / moneda 2€ = 1
            let cantidadNecesaria = Math.floor(cambioRestante/moneda.valor);
            // (1, (15 monedas de 2€) = 1)
            let cantidadUsar = Math.min(cantidadNecesaria,moneda.cantidad);

            if(cantidadUsar>0){
                // 3.50 - (1 * 2) = 1.50
                cambioRestante -= cantidadUsar * moneda.valor;
                cambioRestante = Math.round(cambioRestante*100)/100;

                //Agregar el cambio
                for(let j=0;j<cantidadUsar;j++){
                    //Aqui pusheamos la moneda de 2€ que necesitamos
                    cambio.push(moneda.valor);
                }

                monedasUsadas.push({
                    tipo: moneda.tipo,
                    cantidad: cantidadUsar,
                    valor: moneda.valor
                })

            }
        }
        if(cambioRestante>0.01){
            return res.json({
                success: false,
                error: "No hay cambio suficiente en la máquina",
                cambioRestante: cambioRestante
            })
        }
        res.json({
            success: true,
            cambioTotal: cantidad, //3.50 de cambio
            monedas: cambio, // las monedas que en este caso necesitariamos [2,1,0.50]
            desglose: monedasUsadas, //detalles de las monedas
            mensaje: `Cambio: ${cantidad.toFixed(2)}€`
        });
    }
    catch(error){
        console.error("Error calculando cambio:", error);
    }
})

//Todas las rutas
app.get('/', (req, res) => {
    res.json({ 
        message: 'Máquina Expendedora funcionando',
        endpoints: [
            'GET  /api/productos',
            'POST /api/comprar',
            'GET  /api/caja',
            'PUT  /api/admin/producto/:codigo',
            'POST /api/admin/retirar',
            'POST /api/admin/agregar'
        ]
    });
});

connectarBd();