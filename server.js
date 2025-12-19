const express = require('express');
const path = require('path'); 
const cors = require('cors');
const dotenv = require("dotenv");
const fs = require('fs'); //Librería para leer archivos
const multer = require('multer'); // Librería para subir imágenes
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

dotenv.config();
const app = express();
const puerto = process.env.PUERTO || 3001;

app.use(cors()); 
app.use(express.json()); 

// --- CONFIGURACIÓN CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'web_escalada_juan', // Nombre de la carpeta en tu nube
            resource_type: 'auto', // Permite subir imágenes y videos automáticamente
            public_id: Date.now() + '-' + file.originalname.split('.')[0] // Nombre único
        };
    },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'cliente')));
// Ya no necesitamos servir /uploads localmente, pero lo dejamos por si hay fotos viejas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const rutaArchivo = path.join(__dirname, 'Servidor', 'lugares.json');

//Ruta POST: Subir imagen (Simple)
app.post('/api/subir-imagen', upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
    }
    // Cloudinary nos devuelve la URL directa en req.file.path
    res.json({ ruta: req.file.path });
});

// Ruta POST: Subir múltiples archivos (Fotos y Videos para rutas)
app.post('/api/subir-multiples', upload.array('media', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No se subieron archivos" });
    }
    // Mapeamos para obtener las URLs de Cloudinary
    const rutas = req.files.map(file => file.path);
    res.json({ rutas: rutas });
});

// Ruta POST: Agregar una ruta a un lugar específico
app.post('/api/lugares/:id/rutas', (req, res) => {
    const idLugar = parseInt(req.params.id);
    const nuevaRuta = req.body;

    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Error leyendo datos" });
        
        let lugares = JSON.parse(data);
        
        if (!lugares[idLugar]) {
            return res.status(404).json({ error: "Lugar no encontrado" });
        }

        // Aseguramos que el array de rutas exista
        if (!lugares[idLugar].rutas) {
            lugares[idLugar].rutas = [];
        }

        lugares[idLugar].rutas.push(nuevaRuta);

        fs.writeFile(rutaArchivo, JSON.stringify(lugares, null, 4), (err) => {
            if (err) return res.status(500).json({ error: "Error guardando ruta" });
            res.json({ message: "Ruta agregada con éxito", ruta: nuevaRuta });
        });
    });
});

// Ruta PUT: Editar una ruta específica
app.put('/api/lugares/:id/rutas/:rutaIndex', (req, res) => {
    const idLugar = parseInt(req.params.id);
    const rutaIndex = parseInt(req.params.rutaIndex);
    const rutaActualizada = req.body;

    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Error leyendo datos" });
        
        let lugares = JSON.parse(data);
        
        if (!lugares[idLugar] || !lugares[idLugar].rutas || !lugares[idLugar].rutas[rutaIndex]) {
            return res.status(404).json({ error: "Ruta no encontrada" });
        }

        // Actualizamos la ruta
        lugares[idLugar].rutas[rutaIndex] = rutaActualizada;

        fs.writeFile(rutaArchivo, JSON.stringify(lugares, null, 4), (err) => {
            if (err) return res.status(500).json({ error: "Error guardando cambios" });
            res.json({ message: "Ruta actualizada con éxito", ruta: rutaActualizada });
        });
    });
});

// Ruta DELETE: Eliminar una ruta específica
app.delete('/api/lugares/:id/rutas/:rutaIndex', async (req, res) => {
    const idLugar = parseInt(req.params.id);
    const rutaIndex = parseInt(req.params.rutaIndex);

    fs.readFile(rutaArchivo, 'utf8', async (err, data) => {
        if (err) return res.status(500).json({ error: "Error leyendo datos" });
        
        let lugares = JSON.parse(data);
        
        if (!lugares[idLugar] || !lugares[idLugar].rutas || !lugares[idLugar].rutas[rutaIndex]) {
            return res.status(404).json({ error: "Ruta no encontrada" });
        }

        const rutaAEliminar = lugares[idLugar].rutas[rutaIndex];

        // 1. Eliminar imágenes/videos de Cloudinary
        if (rutaAEliminar.media && rutaAEliminar.media.length > 0) {
            const promesasEliminacion = rutaAEliminar.media.map(url => {
                // Extraer el Public ID de la URL de Cloudinary
                // Ejemplo URL: https://res.cloudinary.com/.../web_escalada_juan/12345-foto.jpg
                try {
                    // Buscamos la parte que dice 'web_escalada_juan/...' y quitamos la extensión
                    const regex = /web_escalada_juan\/[^.]+/;
                    const match = url.match(regex);
                    
                    if (match) {
                        const publicId = match[0];
                        // Determinamos si es video o imagen por la extensión
                        const resourceType = (url.endsWith('.mp4') || url.endsWith('.webm')) ? 'video' : 'image';
                        
                        return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                    }
                } catch (e) {
                    console.error("Error parseando URL para eliminar:", url);
                }
                return Promise.resolve(); // Si falla, seguimos
            });

            // Esperamos a que Cloudinary intente borrar todo (no detenemos si falla uno)
            await Promise.all(promesasEliminacion);
        }

        // 2. Eliminamos la ruta del array local
        lugares[idLugar].rutas.splice(rutaIndex, 1);

        fs.writeFile(rutaArchivo, JSON.stringify(lugares, null, 4), (err) => {
            if (err) return res.status(500).json({ error: "Error guardando cambios" });
            res.json({ message: "Ruta y archivos eliminados con éxito" });
        });
    });
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

app.post('/api/lugares', (req, res) => {
    const nuevoLugar = req.body;

    //Leemos el archivo actual
    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer los datos" });
        }
        
        const lugares = JSON.parse(data);
        lugares.push(nuevoLugar); //Agregamos el nuevo lugar a la lista

        //Guardamos la lista actualizada en el archivo
        fs.writeFile(rutaArchivo, JSON.stringify(lugares, null, 4), (err) => {
            if (err) {
                return res.status(500).json({ error: "Error al guardar los datos" });
            }
            res.json({ message: "Lugar guardado con éxito" });
        });
    });
});

app.listen(puerto, () => {
    console.log(`Servidor corriendo en http://localhost:${puerto}`);
});
