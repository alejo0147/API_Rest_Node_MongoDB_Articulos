const { connection } = require("./database/connection");
const express = require('express');
const cors = require("cors")

console.log("App de Node arrancada");

//  CONECTAR A LA BASE DE DATOS
connection();

//  CREAR SERVIDOR NODE E INICIAR EL PUERTO
const app = express();
const port = 3900;

//  CONFIGURAR CORS
app.use(cors());

//  CONVERTIR EL BODY A OBJETC JS
//app.use(express.json());    //  RECIBIR DATOS CON CONTENT-TYPE app/json
//  CONVERTIR CADA PROPIEDAD Y CONVERTIRLA EN LLAVE Y EL CONTENT EN VALOR DECODIFICADO Y QUE SEA UN OBJ JSON
app.use(express.urlencoded({extended:true}))

//  RUTAS
//  VARIABLE QUE HARÁ EL LLAMADO A LA RUTA -> ARCHIVO DE RUTAS
const routes_article = require("./routes/article");
//  CARGO LAS RUTAS
app.use("/api", routes_article)

//  RUTAS PRUEBAS HARDCODEADAS
app.get("/probando", (req, res) => {
    console.log("Se ha ejecutado el endpoint probando");

    return res.status(200).json([{
            curso: "Node",
            anio: 2024
        },
        {
            curso: "Java",
            anio: 2023
        }
    ]);
});
app.get("/", (req, res) => {
    console.log("Se ha ejecutado el endpoint probando");

    return res.status(200).send(`
        <h1>Empezando a crear una API Rest</h1>
        `);
})

//  CREAR EL SERVIDOR Y ESCUCHAR PETICIONES HTTP
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`)
})