const express = require('express');
const bodyparser = require('body-parser');
const mysql2 = require('mysql2/promise');
const moment = require(('moment'));
const path = require ('path');
const { error } = require('console');
const { send } = require('process');
const session = require(('express-session'));
const cors = require('cors')


const app = express();
app.use(cors())

// Middleware
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(express.static(__dirname)); //

//configurar la sesion
app.use(session({
    secret: 'Miapp',
    resave: false,
    saveUninitialized: true
}));


// Conexión a la base de datos
const db = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mujeres'
};

/* 
db.on("erro",(err) => {

    console.error("error: " + err);
});
 */

// Registrar usuario
app.post('/crear', async (req, res) => {
    const { nombre_usu, tipo_documento, documento, contrasena, fk_Codigo_manzanas } = req.body;

    // Convertir tipo_documento a minúsculas para garantizar compatibilidad con la base de datos
    const tipoDocumentoValido = tipo_documento.toLowerCase();

    let conect;
    try {
        conect = await mysql2.createConnection(db);

        // Verificar si el usuario ya existe
        const [verificar] = await conect.execute(
            'SELECT * FROM usuario WHERE documento = ? AND tipo_documento = ?',
            [documento, tipoDocumentoValido]
        );

        if (verificar.length > 0) {
            return res.status(409).send(`
                <script>
                window.onload = function() {
                    alert("Usuario ya existe");
                    window.location.href = './login.html';
                }
                </script>
            `);
        }

        // Insertar nuevo usuario (sin especificar Rol, se usará el valor predeterminado)
        await conect.execute(
            `INSERT INTO usuario (nombre_usu, tipo_documento, documento, contrasena, fk_Codigo_manzanas) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombre_usu, tipoDocumentoValido, documento, contrasena, fk_Codigo_manzanas]
        );

        return res.status(201).send(`
            <script>
            window.onload = function() {
                alert("Usuario registrado exitosamente");
                window.location.href = './login.html';
            }
            </script>
        `);
    } catch (err) {
        console.error('Error en el servidor:', err);
        return res.status(500).send('Error en el servidor');
    } finally {
        if (conect) {
            await conect.end(); // Cerrar conexión
        }
    }
});


// Ruta para ingresar usuario
app.post('/ingreso', async (req, res) => {
    const { documento, tipo_documento, contrasena } = req.body; // Obtener los datos del formulario
    console.log('Datos recibidos:', req.body); // Verificar los datos que se están recibiendo

    // Eliminar espacios en blanco de los valores que vienen en el formulario
    const documentoTrimmed = documento.trim();
    const tipo_documentoTrimmed = tipo_documento.trim();
    const contrasenaTrimmed = contrasena.trim();

    console.log(`Consultando con: documento = ${documentoTrimmed}, tipo_documento = ${tipo_documentoTrimmed}, contrasena = ${contrasenaTrimmed}`);

    let conect;

    try {
        conect = await mysql2.createConnection(db);
        
        // Realizar la consulta a la base de datos
        const [datos] = await conect.execute(
            'SELECT * FROM usuario WHERE documento = ? AND tipo_documento = ? AND contrasena = ?',
            [documentoTrimmed, tipo_documentoTrimmed, contrasenaTrimmed]
        );

        console.log('Resultado de la consulta:', datos); // Verificar lo que devuelve la consulta

        if (datos.length > 0) {
            const usuario = datos[0];
            console.log('Ingreso exitoso');
            console.log(`Nombre de usuario: ${usuario.nombre_usu}`);
            console.log(`Contraseña: ${usuario.contrasena}`);
            console.log(`Rol: ${usuario.Rol}`);

            // Guardar la sesión del usuario
            req.session.usuario = usuario.nombre_usu;
            req.session.documento = usuario.documento;

            // Redirigir dependiendo del rol
            if (usuario.Rol === 'Administrador') {
                return res.sendFile(path.join(__dirname, 'admin.html'));  // Redirigir a admin
            } else {
                return res.sendFile(path.join(__dirname, 'servicio.html'));  // Redirigir a servicio
            }
        } else {
            return res.status(401).send('Usuario o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error en el servidor:', err);
        return res.status(500).send('Error en el servidor');
    } finally {
        if (conect) {
            await conect.end(); // Cerrar conexión
        }
    }
});

app.post('/guardar-Servicios_Usu', async (req, res) => {
    const { servicios, fechaHora } = req.body;

    try {
        if (!servicios || servicios.length === 0 || !fechaHora) {
            return res.status(400).send("Datos faltantes: servicios o fecha y hora");
        }

        // Verificar sesión
        console.log("Sesión actual:", req.session);
        
        if (!req.session.documento) {
            return res.status(401).send("Sesión no válida");
        }

        const conect = await mysql2.createConnection(db);

        // Obtener Código_mujer
        const [usuarioData] = await conect.execute(
            'SELECT Codigo_mujer FROM usuario WHERE documento = ?',
            [req.session.documento]
        );
        if (usuarioData.length === 0) {
            return res.status(404).send("Usuario no encontrado");
        }
        const Codigo_mujer = usuarioData[0].Codigo_mujer;

        const formattedFechaHora = new Date(fechaHora).toISOString().slice(0, 19).replace("T", " ");

        for (let servicio of servicios) {
            // Obtener Código_servicios
            const [servicioData] = await conect.execute(
                'SELECT Codigo_servicios FROM servicios WHERE Nombre_servicio = ?',
                [servicio]
            );
            if (servicioData.length === 0) {
                return res.status(404).send(`Servicio ${servicio} no encontrado`);
            }
            const Codigo_servicios = servicioData[0].Codigo_servicios;

            // Validar que no haya valores undefined
            if (!formattedFechaHora || !Codigo_mujer || !Codigo_servicios) {
                console.error('Datos inválidos:', { formattedFechaHora, Codigo_mujer, Codigo_servicios });
                return res.status(400).send("Datos inválidos para la consulta");
            }

            // Insertar en solicitudes
            await conect.execute(
                'INSERT INTO solicitudes (Hora_asistencia, fk_Codigo_mujer2, fk_Codigo_servicios) VALUES (?, ?, ?)',
                [formattedFechaHora, Codigo_mujer, Codigo_servicios]
            );
        }

        res.status(200).send('Servicios guardados correctamente');
    } catch (error) {
        console.error('Error al guardar los servicios:', error.message);
        res.status(500).send('Error interno del servidor');
    }
});



// Ruta para obtener usuario desde la sesión
app.get('/obtener-usuario', (req, res) => {
    const usuario = req.session.usuario;
    if (usuario) {
        res.json({ nombre: usuario });
    } else {
        res.status(401).send('Usuario no autenticado');
    }
});

// Ruta para crear un servicio
app.post('/crear-servicio', async (req, res) => {
    const { nombre, descripcion } = req.body;
  
    if (!nombre || !descripcion) {
      return res.status(400).json({ error: "Faltan los campos 'nombre' o 'descripcion'" });
    }
  
    try {
      // Insertar el servicio en la base de datos
      const [result] = await pool.query(
        'INSERT INTO servicios (Nombre_servicio, Descripcion) VALUES (?, ?)', 
        [nombre, descripcion]
      );
  
      // Verificar si el servicio fue creado exitosamente
      if (result.affectedRows > 0) {
        // Retornar respuesta JSON con el servicio creado
        res.status(201).json({ 
          message: 'Servicio creado exitosamente', 
          servicio: { nombre, descripcion, id: result.insertId }
        });
      } else {
        res.status(500).json({ error: 'Error al crear el servicio' });
      }
  
    } catch (error) {
      console.error('Error al crear servicio:', error);
      res.status(500).json({ error: 'Hubo un error al crear el servicio' });
    }
  });
  
  

// Ruta para vizualizar los servicos disponibles desde el apartado del admin
app.get('/api/servicios', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT Codigo_servicios AS id, 
                   Nombre_servicio AS nombre, 
                   Descripcion AS descripcion 
            FROM servicios
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ message: 'Error al obtener servicios' });
    }
});




// Ruta para la actualizacion del servicio a la base de datos

app.put('/api/servicios/:id', async (req, res) => {
    const servicioId = req.params.id;
    const { nombre, descripcion } = req.body;

    try {
        const [result] = await pool.query(`
            UPDATE servicios
            SET Nombre_servicio = ?, Descripcion = ?
            WHERE Codigo_servicios = ?
        `, [nombre, descripcion, servicioId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado' });
        }

        res.status(200).json({ message: 'Servicio actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({ message: 'Error al actualizar el servicio' });
    }
});

//eliminar usuario
app.delete('/eliminarUsuario',async(req,res)=>{
    try{
        const {Codigo_usuario}=req.body;
        const query ='DELETE FROM usuario WHERE Codigo_usuario=?';
        const conect = await mysql2.createConnection(db);  
        const [borrarUsuarios] = await conect.execute(query,[Codigo_usuario]);
        res.status(200).json(borrarUsuarios)
    }catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
})

//Actualizar usuario
app.put('/putUsuario', async(req, res)=>{
    try{
        const {Codigo_usuario}=req.body;
        const query='UPDATE usuario SET tipo_documento=?, documento=?, Apellidos=?,Telefono=?,Email=?,Ciudad=?,Direccion=?,Ocupacion=?,Rol=? WHERE Codigo_mujer=?'
        const conect = await mysql2.createConnection(db); 
        const [actualizarUsuario] = await conect.execute(query,[Codigo_usuario]);
        res.status(200).json(actualizarUsuario)
    }catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }
})

//mostrar Manzanas
app.get('/mostrarManzanas', async(req,res)=>{
    try{
   
       const query='SELECT * FROM manzanas'
       const conect= await mysql2.createConnection(db)
       const [mostrarManzanas] = await conect.execute(query)
       res.status(200).json(mostrarManzanas)
    }catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
    }

})

//mostrar manzanas con servicios
//  http://localhost:3000/mostrarManzanasServicios?Codigo_manzanas=?

app.get('/mostrarManzanasServicios', async(req,res)=>{
    try{
        const {Codigo_manzanas}=req.query
        const query='SELECT * FROM manzanas WHERE Codigo_manzanas=?'
        const conect= await mysql2.createConnection(db)
        const [mostrarManzanas] = await conect.execute(query,[Codigo_manzanas])
        const query2=`SELECT s.Codigo_servicios,s.Nombre_servicio, 
        CASE WHEN ms.fk_codigo_manzanas1 IS NOT NULL THEN true ELSE false END
         AS checked FROM servicios s LEFT JOIN manzanas_servicios ms 
         ON s.Codigo_servicios = ms.fk_codigo_servicios1 
         AND ms.fk_codigo_manzanas1 = ?  ORDER BY s.Codigo_servicios` 
         const [EjecutarQuery] = await conect.execute(query2,[Codigo_manzanas])
         const servicios = EjecutarQuery.map(servicio =>
            ({...servicio,checked: servicio.checked == 1}))
        res.status(200).json({
            Codigo_manzanas:mostrarManzanas.Codigo_manzanas,
            manzanaNombre: mostrarManzanas.nombre_man,
            servicios
        })
     }catch (error) {
         console.error("Error en el servidor:", error);
         res.status(500).send("Error en el servidor");
     }
    
})

//Crear manzana

app.post('/CrearManzana', async(req,res)=>{
    try{
        const {nombre, localidad, direccion, servicio}=req.body
        const conect = await mysql2.createConnection(db)
        const query ='INSERT INTO manzanas (nombre_man, Localidad, Direccion) VALUES (?,?,?)'
        const {crearManzanas} = await conect.execute(query,[nombre, localidad, direccion])
        const insertarPromesa= servicio.map(Codigo_servicios=>{
            const queryServicio='INSERT INTO manzanas_servicios (fk_codigo_manzanas1,fk_codigo_servicios1) values (?,?)'
            return conect.execute(queryServicio, [crearManzanas,Codigo_servicios])
        })
        const resultado = await Promise.all(insertarPromesa)
        if (resultado.some(resultado=>resultado.affectedRows===0)){
            return res.status(500).json({message:'Error en el serv.'})
        }
        res.status(200).json({message:'Ok'})
    
    }catch(error) {
        console.error("Error en el servidor:", error);
        res.status(500).send("Error en el servidor");
        }
    })




// ruta para cerrar sesion
app.get('/cerrar-sesion', (req, res) => {
    // Eliminar la sesión del usuario
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al destruir la sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        
        // Redirigir al usuario a la página de login o inicio
        res.redirect('/login.html');  
    });
});

// Apertura del servidor
app.listen(3000, () => {
    console.log('Servidor Node.js escuchando en el puerto 3000');
});















