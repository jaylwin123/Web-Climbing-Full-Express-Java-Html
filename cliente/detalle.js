const container = document.getElementById('detalle-container');
let currentLugarId = null;
let currentLugarData = null;

//Grados hardcodeados
const GRADOS = {
    ruta: ["5.8", "5.9", "5.10", "5.10a", "5.10b", "5.10c", "5.10d", "5.11", "5.11a", "5.11b", "5.11c", "5.11d", "5.12", "5.12a", "5.12b", "5.12c", "5.12d", "5.13", "5.13a", "5.13b", "5.13c", "5.13d", "5.14", "5.14a", "5.14b", "5.14c", "5.14d", "5.15", "5.15a", "5.15b", "5.15c", "5.15d"],
    boulder: ["V0", "V0+", "V1", "V2", "V2+", "V3", "V4", "V4+", "V5", "V6", "V6+", "V7", "V8", "V8+", "V9", "V10", "V10+", "V11", "V12", "V12+", "V13", "V14", "V14+", "V15", "V16", "V16+", "V17"]
};

//Init
(async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = '<h2>Error: Falta ID</h2>';
        return;
    }
    
    currentLugarId = id;
    await loadData(id);
    setupForm();
})();

async function loadData(id) {
    try {
        const res = await fetch('/api/lugares');
        const data = await res.json();
        const lugar = data[id];

        if (!lugar) {
            container.innerHTML = '<h2>Lugar no encontrado</h2>';
            return;
        }
        currentLugarData = lugar;
        render(lugar);
    } catch (err) {
        console.error(err);
        container.innerHTML = '<h2>Error cargando datos</h2>';
    }
}

function render(lugar) {
    const rutasHTML = (lugar.rutas && lugar.rutas.length) 
        ? `<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            ${lugar.rutas.map((r, i) => renderRutaCard(r, i)).join('')}
           </div>`
        : `<div class="alert alert-secondary mt-5 text-center">
            <h4>Sin rutas aún</h4>
            <p>Sé el primero en agregar una!</p>
           </div>`;

    container.innerHTML = `
        <div class="row mb-5">
            <div class="col-md-6">
                <img src="${lugar.imagen || 'https://via.placeholder.com/600x400'}" class="img-fluid rounded shadow">
            </div>
            <div class="col-md-6 d-flex flex-column justify-content-center">
                <h1 class="display-4 fw-bold">${lugar.nombre}</h1>
                <p class="lead text-muted"><i class="bi bi-geo-alt-fill"></i> ${lugar.ubicacion}</p>
                <hr>
                <p class="fs-5">${lugar.descripcion || '...'}</p>
                <a href="Index.html" class="btn btn-outline-dark mt-3 align-self-start">← Volver</a>
            </div>
        </div>
        <h3 class="mt-5 mb-4">Rutas y Boulders</h3>
        ${rutasHTML}
    `;
}

function renderRutaCard(ruta, index) {
    const badge = ruta.flashed ? '<span class="badge bg-dark position-absolute top-0 end-0 m-2" style="z-index:10">⚡ FLASHED</span>' : '';
    const mapBtn = ruta.ubicacion ? `<a href="${ruta.ubicacion}" target="_blank" class="btn btn-sm btn-outline-dark mt-2">📍 Mapa</a>` : '';
    
    return `
    <div class="col">
        <div class="card h-100 shadow-sm position-relative">
            <div class="position-absolute top-0 start-0 m-2" style="z-index:20">
                <button onclick="event.stopPropagation(); editRuta(${index})" class="btn btn-light btn-sm rounded-circle shadow me-1" style="width:32px; height:32px" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteRuta(${index})" class="btn btn-danger btn-sm rounded-circle shadow" style="width:32px; height:32px" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
            <div class="position-relative" style="cursor: pointer;" onclick="openRouteModal(${index})">
                ${getCarousel(ruta.media, index, true)}
                ${badge}
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h5 class="card-title mb-0">${ruta.nombre}</h5>
                    <span class="badge bg-secondary">${ruta.tipo === 'boulder' ? 'Boulder' : 'Ruta'}</span>
                </div>
                ${getProgress(ruta.grado, ruta.tipo)}
                ${mapBtn}
            </div>
        </div>
    </div>`;
}

function getProgress(grado, tipo) {
    const list = tipo === 'boulder' ? GRADOS.boulder : GRADOS.ruta;
    const idx = list.indexOf(grado);
    if (idx === -1) return '';

    const pct = ((idx + 1) / list.length) * 100;
    let color = 'bg-success';
    if (pct > 33) color = 'bg-warning';
    if (pct > 66) color = 'bg-danger';

    return `
        <div class="mt-2">
            <small class="text-muted">Dificultad: ${grado}</small>
            <div class="progress" style="height: 8px;">
                <div class="progress-bar ${color}" style="width: ${pct}%"></div>
            </div>
        </div>`;
}

function getCarousel(media, id, isPreview = false) {
    if (!media || !media.length) return `<img src="https://via.placeholder.com/300x200" class="card-img-top" style="height:250px; object-fit:cover">`;
    
    // Si es preview, solo mostramos la primera imagen/video estático
    if (isPreview) {
        const src = media[0];
        const isVid = src.match(/\.(mp4|webm)$/i);
        return isVid 
            ? `<video src="${src}" class="card-img-top" style="height:250px; object-fit:cover"></video>`
            : `<img src="${src}" class="card-img-top" style="height:250px; object-fit:cover">`;
    }

    if (media.length === 1) {
        const src = media[0];
        const isVid = src.match(/\.(mp4|webm)$/i);
        return isVid 
            ? `<video src="${src}" controls class="d-block w-100" style="max-height:600px; object-fit:contain"></video>`
            : `<img src="${src}" class="d-block w-100" style="max-height:600px; object-fit:contain">`;
    }

    const items = media.map((src, i) => {
        const isVid = src.match(/\.(mp4|webm)$/i);
        const content = isVid 
            ? `<video src="${src}" controls class="d-block w-100" style="max-height:600px; object-fit:contain"></video>`
            : `<img src="${src}" class="d-block w-100" style="max-height:600px; object-fit:contain">`;
        return `<div class="carousel-item ${i === 0 ? 'active' : ''}">${content}</div>`;
    }).join('');

    return `
        <div id="c-${id}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">${items}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#c-${id}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#c-${id}" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
            </button>
        </div>`;
}

// Form Logic
function setupForm() {
    const form = document.getElementById('form-agregar-ruta');
    const typeRadios = document.querySelectorAll('input[name="tipoRuta"]');
    const select = document.getElementById('ruta-grado');

    const updateSelect = () => {
        const isBoulder = document.getElementById('tipo-boulder').checked;
        const list = isBoulder ? GRADOS.boulder : GRADOS.ruta;
        select.innerHTML = list.map(g => `<option value="${g}">${g}</option>`).join('');
    };

    typeRadios.forEach(r => r.addEventListener('change', updateSelect));
    updateSelect();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentLugarId) return;

        const mediaInput = document.getElementById('ruta-media');
        const indexInput = document.getElementById('ruta-index');
        const isEdit = indexInput.value !== '';
        
        let mediaUrls = [];

        // Si estamos editando, partimos con las URLs existentes
        if (isEdit) {
            const oldRuta = currentLugarData.rutas[parseInt(indexInput.value)];
            if (oldRuta && oldRuta.media) {
                mediaUrls = [...oldRuta.media];
            }
        }

        // Si hay nuevos archivos, los subimos
        if (mediaInput.files.length) {
            const fd = new FormData();
            [...mediaInput.files].forEach(f => fd.append('media', f));
            
            try {
                const res = await fetch('/api/subir-multiples', { method: 'POST', body: fd });
                const data = await res.json();
                // Agregamos las nuevas URLs a la lista
                mediaUrls = [...mediaUrls, ...data.rutas];
            } catch (err) {
                console.error(err);
                alert("Error subiendo archivos");
                return;
            }
        }

        const newRuta = {
            nombre: document.getElementById('ruta-nombre').value,
            descripcion: document.getElementById('ruta-descripcion').value,
            tipo: document.getElementById('tipo-boulder').checked ? 'boulder' : 'ruta',
            grado: select.value,
            ubicacion: document.getElementById('ruta-ubicacion').value,
            flashed: document.getElementById('ruta-flashed').checked,
            media: mediaUrls
        };

        try {
            let url = `/api/lugares/${currentLugarId}/rutas`;
            let method = 'POST';

            if (isEdit) {
                url += `/${indexInput.value}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRuta)
            });

            if (res.ok) {
                alert(isEdit ? "Ruta actualizada!" : "Ruta guardada!");
                bootstrap.Modal.getInstance(document.getElementById('modalAgregarRuta')).hide();
                resetForm();
                loadData(currentLugarId);
            }
        } catch (err) {
            console.error(err);
        }
    });
}

window.resetForm = () => {
    const form = document.getElementById('form-agregar-ruta');
    form.reset();
    document.getElementById('ruta-index').value = '';
    document.querySelector('#modalAgregarRuta .modal-title').textContent = 'Agregar Nueva Ruta';
    document.querySelector('#modalAgregarRuta button[type="submit"]').textContent = 'GUARDAR RUTA';
    
    // Reset select options
    const isBoulder = document.getElementById('tipo-boulder').checked; // Default is false (ruta checked) but reset() might change it
    // Actually reset() restores form to initial state.
    // We need to ensure the select matches the checked radio.
    setTimeout(() => {
        const isBoulder = document.getElementById('tipo-boulder').checked;
        const list = isBoulder ? GRADOS.boulder : GRADOS.ruta;
        const select = document.getElementById('ruta-grado');
        select.innerHTML = list.map(g => `<option value="${g}">${g}</option>`).join('');
    }, 0);
};

window.editRuta = (index) => {
    if (!currentLugarData || !currentLugarData.rutas[index]) return;
    const ruta = currentLugarData.rutas[index];

    // Llenar formulario
    document.getElementById('ruta-index').value = index;
    document.getElementById('ruta-nombre').value = ruta.nombre;
    document.getElementById('ruta-descripcion').value = ruta.descripcion || '';
    document.getElementById('ruta-ubicacion').value = ruta.ubicacion || '';
    document.getElementById('ruta-flashed').checked = ruta.flashed;

    if (ruta.tipo === 'boulder') {
        document.getElementById('tipo-boulder').checked = true;
    } else {
        document.getElementById('tipo-ruta').checked = true;
    }

    // Actualizar select de grados
    const list = ruta.tipo === 'boulder' ? GRADOS.boulder : GRADOS.ruta;
    const select = document.getElementById('ruta-grado');
    select.innerHTML = list.map(g => `<option value="${g}">${g}</option>`).join('');
    select.value = ruta.grado;

    // UI Updates
    document.querySelector('#modalAgregarRuta .modal-title').textContent = 'Editar Ruta';
    document.querySelector('#modalAgregarRuta button[type="submit"]').textContent = 'GUARDAR CAMBIOS';

    new bootstrap.Modal(document.getElementById('modalAgregarRuta')).show();
};

// Global delete function
window.deleteRuta = async (idx) => {
    if (!confirm("¿Seguro que borras esto? No hay vuelta atrás.")) return;
    
    try {
        const res = await fetch(`/api/lugares/${currentLugarId}/rutas/${idx}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Borrado!");
            loadData(currentLugarId);
        }
    } catch (err) {
        console.error(err);
    }
};

// Open Route Modal
window.openRouteModal = (index) => {
    if (!currentLugarData || !currentLugarData.rutas[index]) return;
    const ruta = currentLugarData.rutas[index];

    // 1. Media (Carousel)
    const mediaContainer = document.getElementById('ver-ruta-media');
    mediaContainer.innerHTML = getCarousel(ruta.media, 'modal-' + index, false);

    // 2. Info
    document.getElementById('ver-ruta-nombre').textContent = ruta.nombre;
    
    // Grado
    document.getElementById('ver-ruta-grado-container').innerHTML = getProgress(ruta.grado, ruta.tipo);

    // Ubicación
    const ubiContainer = document.getElementById('ver-ruta-ubicacion');
    if (ruta.ubicacion) {
        const isUrl = ruta.ubicacion.trim().match(/^https?:\/\//i);
        let content = '';

        if (isUrl) {
            // Es un link, solo mostramos botón porque el iframe falla con links directos
             content = `
                <div class="alert alert-secondary p-2 mb-2 text-center small">
                    <i class="bi bi-info-circle"></i> Para ver el mapa aquí, edita la ruta e ingresa el nombre del lugar o coordenadas, no un link.
                </div>
                <a href="${ruta.ubicacion}" target="_blank" class="btn btn-sm btn-outline-dark w-100">
                    <i class="bi bi-box-arrow-up-right"></i> Abrir en Google Maps
                </a>`;
        } else {
            // Es texto/coordenadas, mostramos iframe satelital (t=k)
            const mapQuery = encodeURIComponent(ruta.ubicacion);
            content = `
                <div class="ratio ratio-16x9 mb-2 shadow-sm border">
                    <iframe 
                        src="https://maps.google.com/maps?q=${mapQuery}&t=k&z=15&ie=UTF8&iwloc=&output=embed" 
                        frameborder="0" 
                        scrolling="no" 
                        marginheight="0" 
                        marginwidth="0">
                    </iframe>
                </div>
                <a href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" class="btn btn-sm btn-outline-dark w-100">
                    <i class="bi bi-box-arrow-up-right"></i> Abrir en Google Maps
                </a>`;
        }
        ubiContainer.innerHTML = content;
    } else {
        ubiContainer.innerHTML = '<span class="text-muted fst-italic">No especificada</span>';
    }

    // Descripción
    const descEl = document.getElementById('ver-ruta-descripcion');
    descEl.textContent = ruta.descripcion || "Sin descripción disponible.";

    // Show Modal
    new bootstrap.Modal(document.getElementById('modalVerRuta')).show();
};