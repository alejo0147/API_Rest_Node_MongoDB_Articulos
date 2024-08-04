// OPCIÓN 1
const express = require("express");
const multer = require("multer");
const path = require('path');
//  VARIABLE QUE HARÁ EL LLAMADO AL CONTROLADOR
const findArticleController = require("../controllers/article");

const router = express.Router();
const almacenamiento = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './imagenes/articulos')
    },

    filename: function(req, file, cb) {
        cb(null, "articulo" + Date.now() + path.extname(file.originalname))
    }
})

// Filtro para validar la extensión del archivo
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb("Error: Solo se permiten imágenes (jpeg, jpg, png, gif)");
    }
};

//const subidas = multer({storage: almacenamiento});
// INICIALIZAR MULTER CON LA CONFIGURACIÓN DE ALMACENAMIENTO Y EL FILTRO DE ARCHIVOS
const subidas = multer({
    storage: almacenamiento,
    fileFilter: fileFilter
}).single('file0');

//  RUTA ÚTIL
router.post("/crear", findArticleController.save);
router.get("/articulos", findArticleController.listar);
router.get("/articulo", findArticleController.findId)
router.delete("/articulo", findArticleController.deleteFindId)
router.put("/articulo", findArticleController.edit)
//router.post("/subir-image/:id", [subidas.single("file0")], findArticleController.subirImg)
router.post('/subir-image/:id', (req, res, next) => {
    subidas(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                status: "error",
                mensaje: err
            });
        }
        next();
    });
}, findArticleController.subirImg)
router.get("/imagen/:fichero", findArticleController.imagen)
router.get("/buscar/:busqueda", findArticleController.buscar)


//  EXPORTAR LA RUTA
module.exports = router;