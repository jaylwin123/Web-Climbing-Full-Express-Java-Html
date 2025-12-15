const lista = document.getElementById('lista-lugares');
const input_busqueda = document.getElementById('id-Buscador');
const btnVerMas = document.getElementById('btn-ver-mas');
let lugaresEscalada = [];//Variable para guardar los datos del servidor
let mostrarTodos = false;
const CANTIDAD_INICIAL = 3;

// Función para cargar los datos desde el servidor
async function cargarLugares() {
    if (!lista) return; // Si no hay lista (estamos en otra página), no hacemos nada

    try {
        const respuesta = await fetch('/api/lugares'); // Pedimos los datos al servidor
        lugaresEscalada = await respuesta.json(); // Convertimos la respuesta a JSON
        LugaresEscalada(lugaresEscalada); //Dibujamos la lista inicial
    } catch (error) {
        console.error("Error cargando lugares:", error);
    }
}

function LugaresEscalada(lugaresParaMostrar){
    if (!lista) return;
    
    lista.innerHTML = '';

    const hayBusqueda = input_busqueda && input_busqueda.value.trim().length > 0;
    let lugaresAVisualizar = lugaresParaMostrar;

    if (!hayBusqueda) {
        if (!mostrarTodos) {
            lugaresAVisualizar = lugaresParaMostrar.slice(0, CANTIDAD_INICIAL);
        }
        
        if (lugaresParaMostrar.length > CANTIDAD_INICIAL && btnVerMas) {
            btnVerMas.style.display = 'inline-block';
            btnVerMas.textContent = mostrarTodos ? 'VER MENOS' : 'VER MÁS';
        } else if (btnVerMas) {
            btnVerMas.style.display = 'none';
        }
    } else if (btnVerMas) {
        btnVerMas.style.display = 'none';
    }

    lugaresAVisualizar.forEach(lugar => {
        // Crear columna
        const col = document.createElement('div');
        col.className = 'col';

        // Crear card
        const card = document.createElement('div');
        card.className = 'card';

        // Imagen
        const imagen = document.createElement('img');
        imagen.src = lugar.imagen || 'https://via.placeholder.com/300x400?text=No+Image'; // Fallback si no hay imagen
        imagen.className = 'card-img-top';
        imagen.alt = lugar.nombre;
        // El estilo de la imagen se maneja en CSS ahora

        // Cuerpo de la card
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        // Título
        const titulo = document.createElement('h5');
        titulo.className = 'card-title';
        titulo.textContent = lugar.nombre;

        // Ubicación (opcional, si quieres mostrarla)
        const ubicacion = document.createElement('p');
        ubicacion.className = 'card-text text-muted small';
        ubicacion.textContent = lugar.ubicacion;

        // Descripción
        const descripcion = document.createElement('p');
        descripcion.className = 'card-text';
        descripcion.textContent = lugar.descripcion || '';

        // Botón/Link
        const link = document.createElement('a');
        link.href = lugar.url;
        link.className = 'btn btn-primary mt-auto';
        link.textContent = 'VER DETALLES';

        // Ensamblar
        cardBody.appendChild(titulo);
        cardBody.appendChild(ubicacion);
        cardBody.appendChild(descripcion);
        cardBody.appendChild(link);

        card.appendChild(imagen);
        card.appendChild(cardBody);

        col.appendChild(card);
        lista.appendChild(col);
    });
}

if (btnVerMas) {
    btnVerMas.addEventListener('click', () => {
        mostrarTodos = !mostrarTodos;
        LugaresEscalada(lugaresEscalada);
    });
}

// Función para quitar tildes y pasar a minúsculas
function normalizarTexto(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    //tolowercase() Todo a minuzcula
    //normalize("NFD") separar las letras de los acentos
    //replace eliminamos los acentos sueltos
}

if (input_busqueda) {
    input_busqueda.addEventListener('keyup', (evento) => {
        //keyup, cada vex que el usuario suelte una tecla ejecuta el codigo que sigue abajo
        const texto_busqueda = normalizarTexto(evento.target.value);
        
        const lugaresFiltrados = lugaresEscalada.filter(lugar => {
            return normalizarTexto(lugar.nombre).includes(texto_busqueda);
        });

        LugaresEscalada(lugaresFiltrados);
    });
}

// Lógica para agregar nuevo lugar
const formAgregar = document.getElementById('form-agregar');

if (formAgregar) {
    formAgregar.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // Evita que la página se recargue

        // 1. Primero subimos la imagen (si hay una seleccionada)
        const inputImagen = document.getElementById('nuevo-imagen');
        let rutaImagen = ''; // Por defecto vacía

        if (inputImagen.files.length > 0) {
            const formData = new FormData();
            formData.append('imagen', inputImagen.files[0]);

            try {
                const respuestaImagen = await fetch('/api/subir-imagen', {
                    method: 'POST',
                    body: formData
                });
                const datosImagen = await respuestaImagen.json();
                rutaImagen = datosImagen.ruta; // Guardamos la ruta que nos devolvió el servidor
            } catch (error) {
                console.error("Error subiendo imagen:", error);
                alert("Error al subir la imagen");
                return; // Detenemos todo si falla la imagen
            }
        }

        // 2. Luego guardamos el lugar con la ruta de la imagen ya lista
        const nuevoLugar = {
            nombre: document.getElementById('nuevo-nombre').value,
            ubicacion: document.getElementById('nuevo-ubicacion').value,
            descripcion: document.getElementById('nuevo-descripcion').value,
            imagen: rutaImagen, // Usamos la ruta del servidor
            url: document.getElementById('nuevo-url').value,
            rutas: [] 
        };

        try {
            const respuesta = await fetch('/api/lugares', {
                method: 'POST',//Aquí especificamos que es un POST!
                headers: {
                    'Content-Type': 'application/json'//Avisamos que enviamos JSON
                },
                body: JSON.stringify(nuevoLugar)
                //Convertimos el objeto a texto JSON
            });

            if (respuesta.ok) {
                alert("¡Lugar agregado con éxito!");
                formAgregar.reset(); // Limpiamos el formulario
                if (typeof cargarLugares === 'function') {
                    cargarLugares(); // Recargamos la lista para ver el nuevo lugar
                }
            } else {
                alert("Error al agregar el lugar");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
}

// Iniciamos la carga de datos
cargarLugares();