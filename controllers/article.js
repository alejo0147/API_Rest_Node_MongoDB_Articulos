const fs = require("fs");
const validator = require("validator");
const Article = require("../models/Article");
const path = require('path');

const prueba = (req, res) => {
    return res.status(200).json({
        mensaje: "Soy una acción de prueba en mi controlador de artículos"
    });
}

const curso = (req, res) => {
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
};


const save = async (req, res) => {
    //  RECOGER PARÁMETROS POR POST A GUARDAR
    let parametros = req.body;

    //  VALIDAR DATOS
    try {
        //  UTILIZA trim PARA ELIMINAR LOS ESPACIOS EN BLANCO DE LOS EXTREMOS Y LUEGO VALIDA SI ESTÁ VACÍO
        let validar_title = !validator.isEmpty(parametros.title.trim()) &&
            validator.isLength(parametros.title, {
                min: 7,
                max: undefined
            });
        let validar_content = !validator.isEmpty(parametros.content.trim());

        //  VERIFICA SI ALGUNA SOLO TRAE CAMPOS EN BLANCO O SI ES NULO
        if (!validar_title || !validar_content) {
            throw new Error("No se ha validado la información");
        }

        //  VALIDAR SI EL CONTENIDO ES MAYOR A 20 CARACTERES
        if (!validator.isLength(parametros.content.trim(), { min: 20 })) {
            throw new Error("El contenido debe tener al menos 20 caracteres.");
        }

        //  VERIFICAR SI EL TÍTULO YA EXISTE (IGNORANDO MAYÚSCULAS Y MINÚSCULAS)
        const articuloExistente = await Article.findOne({ title: new RegExp(`^${parametros.title.trim()}$`, 'i')});
        if (articuloExistente) { return res.status(400).json({
                status: "error",
                mensaje: "El título ya existe en la base de datos"
            });
        }

        //  CREAR EL OBJETO A GUARDAR
        const article = new Article(parametros);

        //  GUARDAR EL ARTÍCULO EN LA BASE DE DATOS
        const articuloGuardado = await article.save();

        //  DEVOLVER RESULTADO
        return res.status(200).json({
            status: "success",
            article: articuloGuardado,
            mensaje: "Artículo creado con éxito!"
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            mensaje: error.message || "No se ha guardado el artículo"
        });
    }
}

const listar = async (req, res) => {
    try {
        // VERIFICAR SI SE DEBEN TRAER LOS ÚLTIMOS 5 ARTÍCULOS
        const {
            ultimosCinco,
            fechaExacta
        } = req.query; // Usa parámetros de consulta (query parameters)

        // BUSCAR POR ID
        /*
        if (id) {
            const articulo = await Article.findById(id);
            if (!articulo) {
                return res.status(404).json({
                    status: "error",
                    mensaje: "Artículo no encontrado"
                });
            }
            return res.status(200).send({
                status: "success",
                articulo
            });
        */

        // ORDENAR POR FECHA DESCENDENTE
        let query = Article.find({}).sort({
            date: -1
        });

        // FILTAR POR FECHA EXACTA SI SE PROPORCIONA
        if (fechaExacta) {
            // CONVERTIR LA FECHA DE CADENA A UN OBJETO DATE
            const fecha = new Date(fechaExacta);
            // Verificar si la fecha es válida
            if (isNaN(fecha.getTime())) {
                return res.status(400).json({
                    status: "error",
                    mensaje: "Fecha proporcionada no es válida"
                });
            }
            // FILTRAR ARTÍCULOS POR LA FECHA EXACTA
            query = query.where('date').equals(fecha);
        }

        if (ultimosCinco === 'true') {
            // SI EL PARÁMETRO ultimosCinco ES TRUE, SOLO TRAER LOS ÚLTIMOS 5 ARTÍCULOS
            query = query.limit(2);
        }

        const articulos = await query.exec();

        if (articulos.length === 0) {
            return res.status(400).json({
                status: "error",
                mensaje: "No se han encontrado artículos"
            });
        }

        return res.status(200).send({
            status: "success",
            articulos
        });
    } catch (error) {
        return res.status(400).json({
            status: "error",
            mensaje: error.message || "Error al obtener los artículos"
        });
    }
}

const findId = async (req, res) => {
    let { id } = req.query;

    if (id) {
        const articulo = await Article.findById(id);
        if (!articulo) {
            return res.status(404).json({
                status: "error",
                mensaje: "Artículo no encontrado"
            });
        }
        return res.status(200).send({
            status: "success",
            articulo
        });

    }
};

const deleteFindId = async (req, res) => {
    let { id } = req.query;

    if (!id) {
        return res.status(400).json({
            status: "error",
            mensaje: "ID no proporcionado"
        });
    }

    try {
        const articulo = await Article.findOneAndDelete({ _id: id });
        // Verificar si el artículo no fue encontrado
        if (!articulo) {
            return res.status(404).json({
                status: "error",
                mensaje: "Artículo a eliminar no encontrado"
            });
        }

        // Responder con éxito
        return res.status(200).send({
            status: "success",
            mensaje: "Artículo eliminado exitosamente!"
        });
    } catch (error) {
        // Manejar cualquier error que ocurra durante la eliminación
        return res.status(500).json({
            status: "error",
            mensaje: error.message || "Error al eliminar el artículo"
        });
    }
    
};

const edit = async (req, res) => {
    const { id } = req.query;
    //  RECOGER PARÁMETROS POR POST A GUARDAR
    const { title, content } = req.body;

    if(!id){ return res.status(400).send({
            status: "error",
            mensaje: "El ID no puede ser nulo"
        });
    }

    if (!title || !content) {
        return res.status(400).send({
            status: "error",
            mensaje: "Los parámetros title y content son obligatorios"
        });
    }

    try {
        //  UTILIZA trim PARA ELIMINAR LOS ESPACIOS EN BLANCO DE LOS EXTREMOS Y LUEGO VALIDA SI ESTÁ VACÍO
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        //  VERIFICA SI TÍTULO TRAE SOLO CAMPOS EN BLANCO O ES NULO O SI TIENE MENOS DE 7 CARACTERES
        if (validator.isEmpty(trimmedTitle) || !validator.isLength(trimmedTitle, {min: 7})) {
            throw new Error("El título no es válido. Debe tener al menos 7 caracteres.");
        }

        //  VERIFICA SI CONTENIDO TRAE SOLO CAMPOS EN BLANCO O ES NULO O SI TIENE MENOS DE 20 CARACTERES
        if (validator.isEmpty(trimmedContent) || !validator.isLength(trimmedContent, { min: 20 })) {
            throw new Error("El contenido no es valido. Debe tener al menos 20 caracteres.");
        }

        //  VERIFICAR SI ESTE TÍTULO YA EXISTE EN OTRO ARTÍCULO
        const articuloExistente = await Article.findOne({ title: trimmedTitle });

        if (articuloExistente && articuloExistente._id.toString() !== id) {
            return res.status(400).send({
                status: "error",
                mensaje: "El título ya existe en otro artículo"
            });
        }

        //  ACTUALIZAR EL OBJETO PARÁMETROS CON LOS VALORES RECORTADOS
        const parametrosRet = { title: trimmedTitle, content: trimmedContent, date: new Date() };

        //  ACTUALIZAR ARTÍCULO
        const articulo = await Article.findOneAndUpdate(
            { _id : id },
            //{$set: {title: trimmedTitle, content: trimmedContent}},
            { $set: parametrosRet },
            { new: true, runValidators: true }
        );

        if (!articulo) {
            return res.status(404).send({
                status: "error",
                mensaje: "Artículo no encontrado"
            });
        }
        
        return res.status(200).send({
            status: "success",
            mensaje: "El artículo se ha actualizado con exito!",
            articulo: articulo
        });
    }  catch (error) {
        return res.status(400).send({
            status: "error",
            mensaje: error.message || "Error al actualizar el artículo"
        });
    }
}

const subirImg = async (req, res) => {
    // RECOGER EL FICHERO DE IMAGEN SUBIDO
    if (!req.file) {
        return res.status(404).json({
            status: "error",
            mensaje: "Petición inválida"
        });
    }

    const { id } = req.params;

    try {
        // ACTUALIZAR ARTÍCULO CON LA RUTA DE LA IMAGEN
        const articuloActualizado = await Article.findOneAndUpdate(
            { _id: id },
            { imagen: req.file.filename }, 
            { new: true, runValidators: true }
        );

        if (!articuloActualizado) {
            return res.status(404).send({
                status: "error",
                mensaje: "Artículo no encontrado"
            });
        }

        return res.status(200).send({
            status: "success",
            mensaje: "El artículo se ha actualizado con éxito!",
            articulo: articuloActualizado,
            fichero: req.file
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            mensaje: error.message || "Error al actualizar el artículo"
        });
    }
}

const imagen = async (req, res) => {
    let fichero = req.params.fichero;
    let ruta_fisica = path.join(__dirname, '..', 'imagenes', 'articulos', fichero); // Ajustar la ruta con separadores adecuados

    fs.stat(ruta_fisica, (error, stats) => {
        if (error || !stats.isFile()) {
            return res.status(404).send({
                status: "error",
                mensaje: "La imagen no fue encontrada para mostrarla"
            });
        } else {
            return res.sendFile(path.resolve(ruta_fisica));
        }
    });
}

const buscar = async (req, res) => {
    // SACAR EL STRING DE BUSQUEDA
    let busqueda = req.params.busqueda;

    try {
        // FIND OR
        const articulosEncontrados = await Article.find({
            "$or": [
                {"title": { "$regex": busqueda, "$options": "i" }},
                {"content": { "$regex": busqueda, "$options": "i" }}
            ]
        })
        .sort({ date: -1 });

        if (articulosEncontrados.length === 0) {
            return res.status(404).send({
                status: "error",
                mensaje: "No fueron encontrados artículos para mostrar"
            });
        }

        return res.status(200).send({
            status: "success",
            articulos: articulosEncontrados
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            mensaje: error.message || "Error en la búsqueda de artículos"
        });
    }
}


module.exports = {
    prueba,
    curso,
    save,
    listar,
    findId,
    deleteFindId,
    edit,
    subirImg,
    imagen,
    buscar
}