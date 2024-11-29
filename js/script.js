function cargarUsuarios() {
    fetch('http://localhost:3000/obtenerUsuarios')
        .then((res) => res.json())
        .then((datos) => {
            const tablaUsuarios = document.getElementById('tablaUsuarios')
            tablaUsuarios.innerHTML = ''
            datos.forEach(usuario => {
                const fila = document.createElement('tr')

                const celdaCodigo = document.createElement('td')
                celdaCodigo.textContent = usuario.Codigo_mujer
                fila.appendChild(celdaCodigo)

                const tipoDocumento = document.createElement('td')
                tipoDocumento.textContent = usuario.tipo_documento
                fila.appendChild(tipoDocumento)

                const documento = document.createElement('td')
                documento.textContent = usuario.documento
                fila.appendChild(documento)

                const nombreUsu = document.createElement('td')
                nombreUsu.textContent = usuario.nombre_usu
                fila.appendChild(nombreUsu)

                const apellido = document.createElement('td')
                apellido.textContent = usuario.Apellidos
                fila.appendChild(apellido)

                const telefono = document.createElement('td')
                telefono.textContent = usuario.Telefono
                fila.appendChild(telefono)

                const email = document.createElement('td')
                email.textContent = usuario.Email
                fila.appendChild(email)

                const accion = document.createElement('td')
                crearBotones(accion, fila, usuario)



                tablaUsuarios.appendChild(fila)

            });
        })
}

function eliminarUsuario(usuario) {
    fetch('http://localhost:3000/eliminarUsuario', {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuarioId: usuario.Codigo_mujer })
    })
        .then((res) => res.json())
        .then((datos) => {

        })

}

function crearBotones(accion, fila, usuario) {
    const botonEliminar = document.createElement('button')
    botonEliminar.textContent = 'Eliminar'
    botonEliminar.onclick = () => eliminarUsuario(usuario)
    accion.appendChild(botonEliminar)
    fila.appendChild(accion)


    const botonActualizar = document.createElement('button')
    botonActualizar.textContent = 'Actualizar'
    botonActualizar.onclick = () => cambiarCelda(usuario, fila, accion)
    accion.appendChild(botonActualizar)
    fila.appendChild(accion)

}

function cambiarCelda(usuario, fila, accion) {
    fila.cells[3].innerHTML =  `<input type="text" name="nombreUsu" value="${usuario.nombre_usu}">`
    fila.cells[4].innerHTML =  `<input type="text" name="apellidoUsu" value="${usuario.Apellidos}">`
    fila.cells[5].innerHTML =  `<input type="text" name="telefonoUsu" value="${usuario.Telefono}">`
    fila.cells[6].innerHTML =  `<input type="text" name="emailUsu" value="${usuario.Email}">`

    fila.cells[7].innerHTML = ``
    
    const botonGuardar = document.createElement('button')
    botonGuardar.textContent = 'guardar' 
    accion.appendChild(botonGuardar)
    const botonCancelar = document.createElement('button')
    botonCancelar.onclick = () => cancelar(usuario, fila)
    botonCancelar.textContent = 'cancelar' 

    accion.appendChild(botonCancelar)
}

function cancelar(usuario, fila) {
    fila.cells[3].textContent = usuario.nombre_usu
    fila.cells[4].textContent = usuario.Apellidos
    fila.cells[5].textContent = usuario.Telefono
    fila.cells[6].textContent = usuario.Email


    const filaAccion = fila.cells[7]
    filaAccion.innerHTML = ''
    crearBotones(filaAccion, fila, usuario)
}

function actualizar(fila, usuario) {
    //nombre, apellidos, telefono y email
    const nombre = fila.cells[3].querySelector('input').value || usuario.nombre_usu
    const apellidos = fila.cells[4].querySelector('input').value || usuario.Apellidos
    const telefono = fila.cells[5].querySelector('input').value || usuario.Telefono
    const email = fila.cells[6].querySelector('input').value || usuario.Email

    fetch('', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({idUsu: usuario.Codigo_mujer, nombreUsu: nombre, apellidoUsu: apellidos, telefonoUsu: telefono, emailUsu: email })
    })
    
}

