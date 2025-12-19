const listaLugares = document.getElementById('lista-lugares');
const searchInput = document.getElementById('id-Buscador');
const btnVerMas = document.getElementById('btn-ver-mas');
const formAgregar = document.getElementById('form-agregar');

let dbLugares = [];
let showAll = false;
const LIMIT = 3;

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchLugares();
    setupListeners();
});

async function fetchLugares() {
    if (!listaLugares) return;

    try {
        const res = await fetch('/api/lugares');
        dbLugares = await res.json();
        renderLugares(dbLugares);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

function renderLugares(data) {
    if (!listaLugares) return;
    listaLugares.innerHTML = '';

    const isSearching = searchInput && searchInput.value.trim().length > 0;
    let items = data;

    // Logic para el botón ver más
    if (!isSearching) {
        if (!showAll) items = data.slice(0, LIMIT);
        
        if (btnVerMas) {
            const shouldShowBtn = data.length > LIMIT;
            btnVerMas.style.display = shouldShowBtn ? 'inline-block' : 'none';
            if (shouldShowBtn) btnVerMas.textContent = showAll ? 'VER MENOS' : 'VER MÁS';
        }
    } else if (btnVerMas) {
        btnVerMas.style.display = 'none';
    }

    // Render cards
    items.forEach(lugar => {
        const realIndex = dbLugares.indexOf(lugar);
        
        const cardHTML = `
            <div class="col">
                <div class="card">
                    <img src="${lugar.imagen || 'https://via.placeholder.com/300x400?text=No+Image'}" class="card-img-top" alt="${lugar.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${lugar.nombre}</h5>
                        <p class="card-text text-muted small">${lugar.ubicacion}</p>
                        <p class="card-text">${lugar.descripcion || ''}</p>
                        <a href="detalle.html?id=${realIndex}" class="btn btn-dark mt-auto">VER DETALLES</a>
                    </div>
                </div>
            </div>
        `;
        listaLugares.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function setupListeners() {
    // Toggle ver más
    if (btnVerMas) {
        btnVerMas.addEventListener('click', () => {
            showAll = !showAll;
            renderLugares(dbLugares);
        });
    }

    // Search filter
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = normalize(e.target.value);
            const filtered = dbLugares.filter(l => normalize(l.nombre).includes(term));
            renderLugares(filtered);
        });
    }

    // Form submit
    if (formAgregar) {
        formAgregar.addEventListener('submit', handleAddLugar);
    }
}

async function handleAddLugar(e) {
    e.preventDefault();
    
    const inputImg = document.getElementById('nuevo-imagen');
    let imgPath = '';

    // Upload image first if exists
    if (inputImg.files.length > 0) {
        const formData = new FormData();
        formData.append('imagen', inputImg.files[0]);

        try {
            const res = await fetch('/api/subir-imagen', { method: 'POST', body: formData });
            const data = await res.json();
            imgPath = data.ruta;
        } catch (err) {
            console.error(err);
            alert("Falló la subida de imagen");
            return;
        }
    }

    const payload = {
        nombre: document.getElementById('nuevo-nombre').value,
        ubicacion: document.getElementById('nuevo-ubicacion').value,
        descripcion: document.getElementById('nuevo-descripcion').value,
        imagen: imgPath,
        url: document.getElementById('nuevo-url').value,
        rutas: [] 
    };

    try {
        const res = await fetch('/api/lugares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Lugar agregado!");
            formAgregar.reset();
            fetchLugares();
        } else {
            alert("Error guardando lugar");
        }
    } catch (err) {
        console.error(err);
    }
}

// Helper
const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");