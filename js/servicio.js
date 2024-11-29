function cargarServicio() {
    fetch("http://localhost:3000/obtenerServicios")
        .then((res) => res.json())
        .then((data) => {
            const serviciosContainer =
                document.getElementById("serviciosContainer");

            data.forEach((servicio) => {
                // Crear contenedor para el checkbox y label
                const container = document.createElement("div");
                container.className = "servicioContainer";

                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.padding = "5px 10px";
                container.style.margin = "5px";

                const label = document.createElement("label");
                label.textContent = servicio.Nombre_servicio;
                label.style.marginLeft = "10px";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.name = "servicios";
                checkbox.value = servicio.Codigo_servicios;

                container.appendChild(checkbox);
                container.appendChild(label);

                serviciosContainer.appendChild(container);
            });
        });
}
 function crearManzana(event) {
    event.preventDefault()

    const form = document.getElementById('form-crear-manzana')
    const datosForm = new FormData(form)
    const nombreManzana = datosForm.get('nombre_manzana')
    const localidadManzana = datosForm.get('localidad_manzana')
    const direccionManzana = datosForm.get('direccion_manzana')
    const servicios = datosForm.getAll('servicios')

    fetch('http://localhost:3000/CrearManzana', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombreManzana: nombreManzana, localidadManzana: localidadManzana, direccionManzana: direccionManzana,servicios: servicios })
    })
    .then(res => res.json())
    .then(data => {
        if (data.operacion == 'Operación exitosa') {
            alert(data.operacion)
        } else {
            alert('Error al crear la manzana')
        }
    })
 }