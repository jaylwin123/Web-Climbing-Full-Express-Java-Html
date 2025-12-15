const express = require('express');
const path = require('path'); 
const cors = require('cors');
const dotenv = require("dotenv");
const fs = require('fs'); //Librería para leer archivos
const multer = require('multer'); // Librería para subir imágenes

dotenv.config();
const app = express();
const puerto = process.env.PUERTO || 3001;

app.use(cors()); 
app.use(express.json()); 

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Carpeta donde se guardarán las fotos
    },
    filename: function (req, file, cb) {
        // Le ponemos un nombre único (fecha + nombre original) para no sobreescribir fotos
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unico + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'cliente')));
// Servir las imágenes subidas para que sean visibles en el navegador
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const rutaArchivo = path.join(__dirname, 'Servidor', 'lugares.json');

// Ruta POST: Subir imagen
app.post('/api/subir-imagen', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
    }
    // Devolvemos la ruta donde quedó guardada la imagen para que el frontend la use
    res.json({ ruta: `/uploads/${req.file.filename}` });
});

app.get('/api/lugares', (req, res) => {
    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) {
            console.error("Error leyendo el archivo:", err);
            return res.status(500).json({ error: "Error al leer los datos" });
        }
        res.json(JSON.parse(data));//Enviamos los datos como JSON
    });
});
//Ruta POST: Agregar un nuevo lugar y guardarlo en el JSON
app.post('/api/lugares', (req, res) => {
    const nuevoLugar = req.body;
    //Leemos el archivo actual
    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer la base de datos" });
        }

        const lugares = JSON.parse(data);
        lugares.push(nuevoLugar); //Agregamos el nuevo lugar

        //Guardamos el archivo actualizado
        fs.writeFile(rutaArchivo, JSON.stringify(lugares, null, 4), (err) => {
            if (err) {
                return res.status(500).json({ error: "Error al guardar el lugar" });
            }
            res.status(201).json({ mensaje: "Lugar agregado con éxito", lugar: nuevoLugar });
        });
    });
});

app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});
