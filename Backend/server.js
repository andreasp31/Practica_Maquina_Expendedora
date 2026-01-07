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
    cambioDevuelto: Number
});

const CajaEsquema = new mongoose.Schema({
    saldoMaquina: { type: Number, default: 100 },
    saldoCambio: { type: Number, default: 50 }
});

const Producto = mongoose.model('Producto', ProductoEsquema);
const Venta = mongoose.model('Venta', VentaEsquema);
const Caja = mongoose.model('Caja', CajaEsquema);

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

//Realizar una compra
app.post('/api/comprar',async(req,res)=>{
    try{
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
                error: `Dinero insuficiente`
            });
        }
        let caja = await Caja.findOne();
        if(!caja){
            caja = await Caja.create({});
        }
        //Calculamos el cambio
        const cambio = pagoRecibido - producto.precio;
        if(cambio > 0 && cambio > caja.saldoCambio){
            console.log("No hay cambio disponible");
            return res.status(400).json({
                success: false,
                error: "No hay cambio disponible en la máquina"
            });
        }

        //Reducir stock
        producto.stock -=1;
        await producto.save();

        //Actualizar caja
        caja.saldoMaquina += producto.precio;
        if(cambio > 0){
            caja.saldoCambio -= cambio;
        }
        await caja.save();

        //Guardar venta
        const venta = await Venta.create({
            codigoProducto: producto.codigo,
            precio: producto.precio,
            pagoRecibido: pagoRecibido,
            cambioDevuelto: cambio
        })
        console.log("Compra exitosa",venta);

        //Mensajes detallados para el front 
        return res.json({
            success: true,
            message: "Compra realizada con éxito",
            producto: producto.codigo,
            precio: producto.precio,
            cambio: cambio,
            nuevoStock: producto.stock,
            ventaId: venta._id
        });

    }
    catch(error){
        console.log("Error en la compra");
    }
})

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