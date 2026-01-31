require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    })
);
app.use(cookieParser());

// =============================================
// LOGGING DE CONFIGURACIÓN
// =============================================
console.log('\n' + '='.repeat(50));
console.log('🔧 CONFIGURACIÓN DE LA BASE DE DATOS');
console.log('='.repeat(50));
console.log('DB_HOST:', process.env.DB_HOST || 'localhost (default)');
console.log('DB_USER:', process.env.DB_USER || 'root (default)');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***configurado***' : '⚠️  VACÍO');
console.log('DB_NAME:', process.env.DB_NAME || 'vinylvibe_db (default)');
console.log('='.repeat(50) + '\n');

// Configuración de MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinylvibe_db'
});

db.connect((err) => {
    if (err) {
        console.error('\n' + '❌'.repeat(20));
        console.error('❌ ERROR CRÍTICO: No se pudo conectar a MySQL');
        console.error('❌'.repeat(20));
        console.error('Detalles del error:');
        console.error('  - Código:', err.code);
        console.error('  - Mensaje:', err.message);
        console.error('  - SQL State:', err.sqlState);
        console.error('\n💡 Posibles soluciones:');
        console.error('  1. Verifica que MySQL esté corriendo');
        console.error('  2. Revisa usuario/contraseña en el archivo .env');
        console.error('  3. Confirma que la base de datos "vinylvibe_db" existe');
        console.error('❌'.repeat(20) + '\n');
    } else {
        console.log('✅ Conectado exitosamente a MySQL');
        console.log('✅ Base de datos:', process.env.DB_NAME || 'vinylvibe_db');
        console.log('');
    }
});

// Configuración Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware de Autenticación
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// =============================================
// RUTAS DE AUTENTICACIÓN
// =============================================
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    console.log('\n📝 Registro de nuevo usuario:');
    console.log('  firstName:', firstName || '❌ FALTANTE');
    console.log('  lastName:', lastName || '❌ FALTANTE');
    console.log('  email:', email || '❌ FALTANTE');
    console.log('  password:', password ? '✅ Presente' : '❌ FALTANTE');

    // Verificar si el usuario ya existe
    db.query('SELECT email FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('  ❌ Error DB:', err);
            return res.status(500).json({ success: false, error: 'Error en la base de datos' });
        }
        if (results.length > 0) {
            console.log('  ❌ Email ya registrado');
            return res.status(400).json({ success: false, error: 'El correo ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('  🔐 Contraseña hasheada');

        // Insertar nuevo usuario (rol por defecto: client)
        const sql = 'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)';
        db.query(sql, [firstName, lastName, email, hashedPassword, 'client'], (err, result) => {
            if (err) {
                console.error('  ❌ Error al insertar:', err);
                return res.status(500).json({ success: false, error: 'Error al registrar usuario' });
            }
            console.log('  ✅ Usuario registrado exitosamente - ID:', result.insertId);
            res.json({ success: true, message: 'Usuario registrado exitosamente' });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    console.log('\n🔐 Intento de login:');
    console.log('  Email:', email);

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('❌ Error DB en login:', err);
            console.error('  Código:', err.code);
            console.error('  Mensaje:', err.message);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        console.log('  Usuarios encontrados:', results.length);

        if (results.length === 0) {
            console.log('  ❌ Email no encontrado en la DB');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = results[0];
        console.log('  Usuario encontrado:', user.first_name, user.last_name);
        console.log('  Campo password existe:', !!user.password);

        // Verificar que el password exista
        if (!user.password) {
            console.error('❌ Campo password no existe para usuario:', user.email);
            return res.status(500).json({ error: 'Error de configuración del usuario' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        console.log('  Contraseña coincide:', isMatch);

        if (!isMatch) {
            console.log('  ❌ Contraseña incorrecta');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar Token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Guardar token en cookie httpOnly
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true en producción con HTTPS
            sameSite: 'strict',
            maxAge: 3600000 // 1 hora
        });

        console.log('  ✅ Login exitoso - Role:', user.role);

        res.json({
            success: true,
            message: 'Login exitoso',
            token: token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout exitoso' });
});

// =============================================
// RECUPERACIÓN DE CONTRASEÑA
// =============================================
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    console.log('\n🔑 Solicitud de recuperación de contraseña:', email);

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('  ❌ Error DB:', err);
            return res.status(500).json({ success: false, error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            // Por seguridad, no revelamos si el email existe o no
            console.log('  ⚠️  Email no encontrado, pero respondemos éxito por seguridad');
            return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
        }

        const user = results[0];
        console.log('  ✅ Usuario encontrado:', user.first_name);

        // Generar un token temporal (válido por 1 hora)
        const resetToken = jwt.sign(
            { email: user.email, purpose: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // URL para resetear contraseña (frontend)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // Configurar email
        const mailOptions = {
            from: `"VinylVibe 🎵" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔑 Recuperación de Contraseña - VinylVibe',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Georgia', 'Times New Roman', serif; 
                            background-color: #F5F5DC;
                            padding: 40px 20px;
                        }
                        .container { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            background-color: #FFFFFF;
                            border: 1px solid #E5E5D5;
                        }
                        .header { 
                            text-align: center; 
                            padding: 40px 30px 30px;
                            border-bottom: 2px solid #EA580C;
                        }
                        .logo { 
                            font-size: 28px; 
                            font-weight: 300;
                            color: #1A1A1A;
                            letter-spacing: 1px;
                            margin-bottom: 10px;
                        }
                        .logo-accent { 
                            color: #EA580C; 
                            font-weight: 600;
                            font-style: italic;
                        }
                        .subtitle {
                            font-size: 13px;
                            color: #666;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                        }
                        .content { 
                            padding: 40px 40px;
                            color: #2A2A2A;
                            line-height: 1.7;
                        }
                        .greeting {
                            font-size: 18px;
                            color: #1A1A1A;
                            margin-bottom: 20px;
                        }
                        .text {
                            font-size: 15px;
                            color: #3A3A3A;
                            margin-bottom: 15px;
                        }
                        .button-container {
                            text-align: center;
                            margin: 35px 0;
                        }
                        .button { 
                            display: inline-block;
                            background-color: #EA580C;
                            color: #FFFFFF;
                            padding: 16px 40px;
                            text-decoration: none;
                            font-size: 15px;
                            font-weight: 500;
                            letter-spacing: 1px;
                            border-radius: 2px;
                            transition: background-color 0.3s;
                        }
                        .button:hover {
                            background-color: #DC2626;
                        }
                        .expiry {
                            background-color: #FFF8F0;
                            border-left: 3px solid #EA580C;
                            padding: 15px 20px;
                            margin: 25px 0;
                            font-size: 14px;
                            color: #2A2A2A;
                        }
                        .divider {
                            height: 1px;
                            background-color: #E5E5D5;
                            margin: 30px 0;
                        }
                        .link-section {
                            background-color: #FAFAF5;
                            padding: 20px;
                            font-size: 12px;
                            color: #666;
                            border-radius: 2px;
                        }
                        .link-section a {
                            color: #EA580C;
                            word-break: break-all;
                            text-decoration: none;
                        }
                        .footer { 
                            text-align: center;
                            padding: 30px;
                            font-size: 12px;
                            color: #999;
                            background-color: #FAFAF5;
                            border-top: 1px solid #E5E5D5;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">
                                Vinyl<span class="logo-accent">V</span>ibe
                            </div>
                            <div class="subtitle">Curated Analog Experience</div>
                        </div>
                        
                        <div class="content">
                            <div class="greeting">Hola ${user.first_name},</div>
                            
                            <p class="text">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta en VinylVibe.
                            </p>
                            
                            <p class="text">
                                Haz clic en el siguiente botón para crear una nueva contraseña:
                            </p>
                            
                            <div class="button-container">
                                <a href="${resetUrl}" class="button">RESTABLECER CONTRASEÑA</a>
                            </div>
                            
                            <div class="expiry">
                                <strong>⏱ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
                            </div>
                            
                            <p class="text">
                                Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña permanecerá sin cambios.
                            </p>
                            
                            <div class="divider"></div>
                            
                            <div class="link-section">
                                <p style="margin-bottom: 8px; color: #666;">
                                    <strong>¿El botón no funciona?</strong>
                                </p>
                                <p>Copia y pega este enlace en tu navegador:</p>
                                <p style="margin-top: 8px;">
                                    <a href="${resetUrl}">${resetUrl}</a>
                                </p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            &copy; 2024 VinylVibe &mdash; Tu tienda de vinilos de confianza
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Enviar email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('  ❌ Error al enviar email:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error al enviar el email de recuperación'
                });
            }
            console.log('  ✅ Email enviado exitosamente:', info.response);
            res.json({
                success: true,
                message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña'
            });
        });
    });
});

app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    console.log('\n🔐 Restablecimiento de contraseña:', email);

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('  ❌ Error DB:', err);
            return res.status(500).json({ success: false, error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            console.log('  ❌ Usuario no encontrado');
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('  🔐 Contraseña hasheada');

        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, result) => {
            if (err) {
                console.error('  ❌ Error al actualizar:', err);
                return res.status(500).json({ success: false, error: 'Error al actualizar contraseña' });
            }
            console.log('  ✅ Contraseña actualizada exitosamente');
            res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
        });
    });
});

app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ isAuthenticated: true, user: req.user });
});

// =============================================
// RUTAS DE VINILOS (Catálogo)
// =============================================
app.get('/api/albums', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    // Usamos el SP `sp_get_albums` (asegúrate de haberlo creado con setup_catalog.sql)
    // O si prefieres una query directa por simplicidad:
    const sql = 'SELECT * FROM vinyls ORDER BY created_at DESC LIMIT ?';

    db.query(sql, [limit], (err, results) => {
        if (err) {
            console.error('Error fetching albums:', err);
            return res.status(500).json({ error: 'Error al obtener el catálogo' });
        }
        res.json({ success: true, data: results });
    });
});

// Búsqueda de vinilos
app.get('/api/vinyls/search', (req, res) => {
    const query = req.query.q || '';
    db.query('CALL sp_search_vinyls(?)', [query], (err, results) => {
        if (err) {
            console.error('Error buscando vinilos:', err);
            return res.status(500).json({ error: 'Error en la búsqueda' });
        }
        // Los resultados de un SP vienen en un array, el primer elemento son las filas
        res.json({ success: true, data: results[0] });
    });
});

// =============================================
// ENDPOINT COLECCIÓN DE USUARIO
// =============================================
app.get('/api/collection', authenticateToken, (req, res) => {
    console.log(`🎵 Obteniendo colección - Usuario: ${req.user.id}`);

    db.query('CALL sp_get_user_collection(?)', [req.user.id], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_user_collection:', err);
            return res.status(500).json({ error: 'Error al obtener colección' });
        }
        console.log(`  ✅ ${results[0].length} vinilos en colección`);
        res.json({ success: true, data: results[0] });
    });
});

// =============================================
// ENDPOINT VER CARRITO
// =============================================
app.get('/api/cart', authenticateToken, (req, res) => {
    db.query('CALL sp_get_cart(?)', [req.user.id], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_cart:', err);
            return res.status(500).json({ error: 'Error al obtener el carrito' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// =============================================
// ENDPOINTS CARRITO (UPDATE & DELETE)
// =============================================
app.put('/api/cart/:itemId', authenticateToken, (req, res) => {
    console.log(`📝 [PUT] Actualizando carrito - Usuario: ${req.user.id}, Item: ${req.params.itemId}`);
    const { itemId } = req.params;
    const { quantity } = req.body;

    console.log(`🔢 Nueva cantidad solicitada: ${quantity}`);

    db.query('CALL sp_update_cart_item(?, ?, ?)', [req.user.id, itemId, quantity], (err, result) => {
        if (err) {
            console.error('❌ Error en sp_update_cart_item:', err);
            return res.status(500).json({ error: 'Error al actualizar cantidad' });
        }
        console.log('✅ Cantidad actualizada correctamente');
        res.json({ success: true });
    });
});

app.delete('/api/cart/:itemId', authenticateToken, (req, res) => {
    console.log(`🗑️ [DELETE] Eliminando item - Usuario: ${req.user.id}, Item: ${req.params.itemId}`);
    const { itemId } = req.params;

    db.query('CALL sp_remove_from_cart(?, ?)', [req.user.id, itemId], (err, result) => {
        if (err) {
            console.error('❌ Error en sp_remove_from_cart:', err);
            return res.status(500).json({ error: 'Error al eliminar item' });
        }
        console.log('✅ Item eliminado correctamente');
        res.json({ success: true });
    });
});

app.delete('/api/cart', authenticateToken, (req, res) => {
    console.log(`💥 [DELETE] Vaciando carrito completo - Usuario: ${req.user.id}`);

    db.query('CALL sp_empty_cart(?)', [req.user.id], (err, result) => {
        if (err) {
            console.error('❌ Error en sp_empty_cart:', err);
            return res.status(500).json({ error: 'Error al vaciar carrito' });
        }
        console.log('✅ Carrito vaciado correctamente');
        res.json({ success: true });
    });
});

// =============================================
// ENDPOINT AGREGAR AL CARRITO
// =============================================
app.post('/api/cart', authenticateToken, (req, res) => {
    const { vinylId, quantity } = req.body;

    // CALL sp_add_to_cart(p_user_id, p_vinyl_id, p_quantity)
    db.query('CALL sp_add_to_cart(?, ?, ?)', [req.user.id, vinylId, quantity], (err, results) => {
        if (err) {
            console.error('Error adding to cart:', err);
            return res.status(500).json({ error: 'Error al agregar al carrito' });
        }
        res.json({ success: true, message: 'Producto agregado al carrito' });
    });
});

// =============================================
// CHECKOUT & PAGO
// =============================================
app.post('/api/checkout', authenticateToken, (req, res) => {
    const { country, state, city, address1, address2, zip } = req.body;

    const query = `CALL sp_process_checkout(?, ?, ?, ?, ?, ?, ?)`;
    const params = [req.user.id, country, state, city, address1, address2, zip];

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Checkout error:', err);
            return res.status(500).json({ error: 'Error processing checkout' });
        }

        const newOrderId = results[0][0].new_order_id;
        res.json({ success: true, orderId: newOrderId });
    });
});

// =============================================
// ENDPOINT CONFIRMAR PAGO & EMAIL
// =============================================
app.post('/api/orders/pay', authenticateToken, (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('💳 PROCESANDO PAGO - Orden ID:', req.body.orderId);
    console.log('👤 Usuario ID:', req.user.id);

    const { orderId } = req.body;
    if (!orderId) {
        console.error('❌ Error: Falta orderId');
        return res.status(400).json({ error: 'Order ID required' });
    }

    // 1. Marcar orden como completada
    const updateQuery = `UPDATE orders SET status = 'completed', terms_accepted = TRUE WHERE id = ? AND user_id = ?`;

    db.query(updateQuery, [orderId, req.user.id], (err, result) => {
        if (err) {
            console.error('❌ Error DB al actualizar orden:', err);
            return res.status(500).json({ error: 'Error DB' });
        }

        if (result.affectedRows === 0) {
            console.error('❌ Orden no encontrada o no pertenece al usuario');
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        console.log('✅ Orden marcada como completada en DB');

        // 2. Obtener detalles para el email
        console.log('📫 Obteniendo detalles para envío de correo...');
        db.query('CALL sp_get_order_details(?)', [orderId], (err, results) => {
            if (err) {
                console.error('❌ Error ejecutando sp_get_order_details:', err);
                return res.json({ success: true, message: 'Pago exitoso, pero error al preparar email' });
            }

            const header = results[0][0]; // Datos generales y usuario
            const items = results[1];     // Lista de productos

            if (!header) {
                console.error('❌ No se encontraron datos de cabecera para la orden');
                return res.json({ success: true });
            }

            console.log('📧 Destinatario:', header.email);
            console.log('📦 Productos a enviar:', items.length);

            // 3. Construir HTML del Email
            const itemsHtml = items.map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title} - ${item.artist}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${Number(item.unit_price).toFixed(2)}</td>
                </tr>
            `).join('');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: header.email,
                subject: `¡Gracias por tu compra en VinylVibe! Orden #${orderId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h1 style="color: #EA580C; text-align: center;">VinylVibe</h1>
                        <h2 style="text-align: center;">¡Gracias por tu compra, ${header.first_name}!</h2>
                        <p>Tu orden <strong>#${orderId}</strong> ha sido confirmada.</p>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3>Detalles de Envío</h3>
                            <p>${header.address_1}, ${header.city}, ${header.country}</p>
                            <p>CP: ${header.zip_code}</p>
                        </div>

                        <h3>Resumen de Compra</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #333; color: white;">
                                    <th style="padding: 8px; text-align: left;">Producto</th>
                                    <th style="padding: 8px; text-align: center;">Cant.</th>
                                    <th style="padding: 8px; text-align: right;">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">TOTAL:</td>
                                    <td style="padding: 10px; text-align: right; font-weight: bold; color: #EA580C;">$${Number(header.total_price).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
                            Si tienes dudas, contáctanos. ¡Sigue girando! 🎧
                        </p>
                    </div>
                `
            };

            // 4. Enviar Email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('❌ ERROR al enviar email:', error);
                } else {
                    console.log('✅ Email enviado exitosamente:', info.response);
                }
                console.log('='.repeat(50));
            });

            res.json({ success: true, message: 'Pago exitoso y comprobante enviado' });
        });
    });
});
// =============================================
// ENDPOINT COLECCIÓN (NUEVO)
// =============================================
app.get('/api/collection', authenticateToken, (req, res) => {
    console.log(`🎵 Obteniendo colección - Usuario: ${req.user.id}`);

    db.query('CALL sp_get_user_collection(?)', [req.user.id], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_user_collection:', err);
            return res.status(500).json({ error: 'Error al obtener colección' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// =============================================
// RUTAS PROTEGIDAS
// =============================================
app.get('/api/client/home', authenticateToken, (req, res) => {
    if (req.user.role !== 'client') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json({
        message: 'Hello Client!',
        user: req.user
    });
});

app.get('/api/admin/home', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json({
        message: 'Hello Admin!',
        user: req.user
    });
});

// =============================================
// ENDPOINTS DE ADMINISTRACIÓN - VENTAS
// =============================================

// 1. Obtener reporte completo de ventas (solo admin)
app.get('/api/admin/sales-report', authenticateToken, (req, res) => {
    console.log('\n📊 Solicitando reporte de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_sales_report()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_sales_report:', err);
            return res.status(500).json({ error: 'Error al obtener reporte de ventas' });
        }

        console.log(`✅ Reporte generado - ${results[0].length} registros de ventas`);
        res.json({ success: true, data: results[0] });
    });
});

// 2. Obtener totales de ventas (solo admin)
app.get('/api/admin/sales-total', authenticateToken, (req, res) => {
    console.log('\n💰 Solicitando totales de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_total_sales()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_total_sales:', err);
            return res.status(500).json({ error: 'Error al obtener total de ventas' });
        }

        const totals = results[0][0];
        console.log(`✅ Total de ventas: $${totals.total_sales}`);
        console.log(`   - Órdenes completadas: ${totals.total_orders}`);
        console.log(`   - Clientes únicos: ${totals.total_customers}`);

        res.json({ success: true, data: totals });
    });
});

// 3. Obtener vinilos más vendidos (opcional - solo admin)
app.get('/api/admin/top-selling', authenticateToken, (req, res) => {
    console.log('\n🏆 Solicitando top de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    db.query('CALL sp_get_top_selling_vinyls(?)', [limit], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_top_selling_vinyls:', err);
            return res.status(500).json({ error: 'Error al obtener top de ventas' });
        }

        console.log(`✅ Top ${limit} vinilos más vendidos obtenido`);
        res.json({ success: true, data: results[0] });
    });
});

// 4. Ventas por rango de fechas (opcional - solo admin)
app.get('/api/admin/sales-by-date', authenticateToken, (req, res) => {
    console.log('\n📅 Solicitando ventas por fecha - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: 'Se requieren parámetros startDate y endDate (formato: YYYY-MM-DD)'
        });
    }

    db.query('CALL sp_get_sales_by_date(?, ?)', [startDate, endDate], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_sales_by_date:', err);
            return res.status(500).json({ error: 'Error al obtener ventas por fecha' });
        }

        const sales = results[0];
        const totals = results[1][0];

        console.log(`✅ Ventas del ${startDate} al ${endDate}:`);
        console.log(`   - Registros: ${sales.length}`);
        console.log(`   - Total: $${totals.total_sales}`);

        res.json({
            success: true,
            sales: sales,
            totals: totals
        });
    });
});

// =============================================
// ENDPOINTS DE ADMINISTRACIÓN - VENTAS
// =============================================

// 1. Obtener reporte completo de ventas (solo admin)
app.get('/api/admin/sales-report', authenticateToken, (req, res) => {
    console.log('\n📊 Solicitando reporte de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_sales_report()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_sales_report:', err);
            return res.status(500).json({ error: 'Error al obtener reporte de ventas' });
        }

        console.log(`✅ Reporte generado - ${results[0].length} registros de ventas`);
        res.json({ success: true, data: results[0] });
    });
});

// 2. Obtener totales de ventas (solo admin)
app.get('/api/admin/sales-total', authenticateToken, (req, res) => {
    console.log('\n💰 Solicitando totales de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_total_sales()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_total_sales:', err);
            return res.status(500).json({ error: 'Error al obtener total de ventas' });
        }

        const totals = results[0][0];
        console.log(`✅ Total de ventas: $${totals.total_sales}`);
        console.log(`   - Órdenes completadas: ${totals.total_orders}`);
        console.log(`   - Clientes únicos: ${totals.total_customers}`);

        res.json({ success: true, data: totals });
    });
});

// 3. Obtener vinilos más vendidos (opcional - solo admin)
app.get('/api/admin/top-selling', authenticateToken, (req, res) => {
    console.log('\n🏆 Solicitando top de ventas - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    db.query('CALL sp_get_top_selling_vinyls(?)', [limit], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_top_selling_vinyls:', err);
            return res.status(500).json({ error: 'Error al obtener top de ventas' });
        }

        console.log(`✅ Top ${limit} vinilos más vendidos obtenido`);
        res.json({ success: true, data: results[0] });
    });
});

// 4. Ventas por rango de fechas (opcional - solo admin)
app.get('/api/admin/sales-by-date', authenticateToken, (req, res) => {
    console.log('\n📅 Solicitando ventas por fecha - Admin ID:', req.user.id);

    // Verificar que sea admin
    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: 'Se requieren parámetros startDate y endDate (formato: YYYY-MM-DD)'
        });
    }

    db.query('CALL sp_get_sales_by_date(?, ?)', [startDate, endDate], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_sales_by_date:', err);
            return res.status(500).json({ error: 'Error al obtener ventas por fecha' });
        }

        const sales = results[0];
        const totals = results[1][0];

        console.log(`✅ Ventas del ${startDate} al ${endDate}:`);
        console.log(`   - Registros: ${sales.length}`);
        console.log(`   - Total: $${totals.total_sales}`);

        res.json({
            success: true,
            sales: sales,
            totals: totals
        });
    });
});




// =============================================
// ENDPOINTS DE RE-STOCK DE INVENTARIO
// =============================================
// Agregar estos endpoints en tu archivo server.js ANTES del app.listen()

// 1. Obtener inventario completo (solo admin)
app.get('/api/admin/inventory', authenticateToken, (req, res) => {
    console.log('\n📦 Solicitando inventario completo - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_inventory()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_inventory:', err);
            return res.status(500).json({ error: 'Error al obtener inventario' });
        }

        console.log(`✅ Inventario obtenido - ${results[0].length} productos`);
        res.json({ success: true, data: results[0] });
    });
});

// 2. Obtener items con stock bajo (solo admin)
app.get('/api/admin/low-stock', authenticateToken, (req, res) => {
    console.log('\n⚠️  Solicitando items con stock bajo - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;

    db.query('CALL sp_get_low_stock_items(?)', [threshold], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_low_stock_items:', err);
            return res.status(500).json({ error: 'Error al obtener items con stock bajo' });
        }

        console.log(`✅ Items con stock bajo (< ${threshold}): ${results[0].length} productos`);
        res.json({ success: true, data: results[0], threshold: threshold });
    });
});

// 3. Actualizar stock de un vinilo individual (solo admin)
app.put('/api/admin/inventory/:vinylId/stock', authenticateToken, (req, res) => {
    console.log('\n🔄 Actualizando stock - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { vinylId } = req.params;
    const { quantity, operation } = req.body;

    console.log(`  Vinilo ID: ${vinylId}`);
    console.log(`  Cantidad: ${quantity}`);
    console.log(`  Operación: ${operation}`);

    // Validar operación
    if (!['add', 'subtract', 'set'].includes(operation)) {
        console.log('❌ Operación inválida');
        return res.status(400).json({
            error: 'Operación inválida. Use: add, subtract o set'
        });
    }

    // Validar cantidad
    if (!quantity || quantity < 0) {
        console.log('❌ Cantidad inválida');
        return res.status(400).json({ error: 'Cantidad debe ser mayor o igual a 0' });
    }

    db.query('CALL sp_update_stock(?, ?, ?)', [vinylId, quantity, operation], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_update_stock:', err);
            return res.status(500).json({ error: 'Error al actualizar stock' });
        }

        const updated = results[0][0];
        console.log(`✅ Stock actualizado - ${updated.title}`);
        console.log(`   Stock anterior: ${updated.old_stock}`);
        console.log(`   Stock nuevo: ${updated.new_stock}`);

        // Opcional: Registrar en historial
        db.query(
            'CALL sp_log_stock_change(?, ?, ?, ?, ?, ?)',
            [
                vinylId,
                updated.old_stock,
                updated.new_stock,
                operation,
                req.user.id,
                `Re-stock manual por ${operation}`
            ],
            (logErr) => {
                if (logErr) {
                    console.warn('⚠️  No se pudo registrar en historial:', logErr.message);
                } else {
                    console.log('📝 Cambio registrado en historial');
                }
            }
        );

        res.json({ success: true, data: updated });
    });
});

// 4. Actualización masiva de stock (confirmar re-stock completo) (solo admin)
app.post('/api/admin/inventory/batch-update', authenticateToken, (req, res) => {
    console.log('\n📦 Actualizando stock masivo - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { updates } = req.body;
    // updates es un array de objetos: [{vinylId: 1, quantity: 10}, {vinylId: 2, quantity: 5}, ...]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        console.log('❌ Datos de actualización inválidos');
        return res.status(400).json({ error: 'Se requiere un array de actualizaciones' });
    }

    console.log(`  Actualizando ${updates.length} productos`);

    // Construir strings separados por comas para el SP
    const vinylIds = updates.map(u => u.vinylId).join(',');
    const quantities = updates.map(u => u.quantity).join(',');

    db.query('CALL sp_batch_update_stock(?, ?)', [vinylIds, quantities], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_batch_update_stock:', err);
            return res.status(500).json({ error: 'Error al actualizar stock masivamente' });
        }

        const updatedItems = results[0];
        console.log(`✅ ${updatedItems.length} productos actualizados exitosamente`);

        // Registrar cada cambio en el historial
        updatedItems.forEach(item => {
            db.query(
                'CALL sp_log_stock_change(?, ?, ?, ?, ?, ?)',
                [
                    item.id,
                    item.new_stock - item.added_quantity,
                    item.new_stock,
                    'batch_restock',
                    req.user.id,
                    'Re-stock masivo'
                ],
                (logErr) => {
                    if (logErr) {
                        console.warn(`⚠️  No se pudo registrar cambio para ${item.title}:`, logErr.message);
                    }
                }
            );
        });

        res.json({
            success: true,
            message: `${updatedItems.length} productos actualizados`,
            data: updatedItems
        });
    });
});

// 5. Ver historial de cambios de stock (solo admin)
app.get('/api/admin/stock-history', authenticateToken, (req, res) => {
    console.log('\n📜 Solicitando historial de stock - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const vinylId = req.query.vinylId ? parseInt(req.query.vinylId) : null;

    if (vinylId) {
        console.log(`  Historial para vinilo ID: ${vinylId}`);
    } else {
        console.log('  Historial completo (últimos 100 registros)');
    }

    db.query('CALL sp_get_stock_history(?)', [vinylId], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_stock_history:', err);
            return res.status(500).json({ error: 'Error al obtener historial' });
        }

        console.log(`✅ Historial obtenido - ${results[0].length} registros`);
        res.json({ success: true, data: results[0] });
    });
});

// 6. Resetear stock a cero (útil para inventario físico) (solo admin)
app.post('/api/admin/inventory/:vinylId/reset', authenticateToken, (req, res) => {
    console.log('\n🔄 Reseteando stock a 0 - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { vinylId } = req.params;
    console.log(`  Vinilo ID: ${vinylId}`);

    db.query('CALL sp_update_stock(?, ?, ?)', [vinylId, 0, 'set'], (err, results) => {
        if (err) {
            console.error('❌ Error al resetear stock:', err);
            return res.status(500).json({ error: 'Error al resetear stock' });
        }

        const updated = results[0][0];
        console.log(`✅ Stock reseteado - ${updated.title}`);

        // Registrar en historial
        db.query(
            'CALL sp_log_stock_change(?, ?, ?, ?, ?, ?)',
            [
                vinylId,
                updated.old_stock,
                0,
                'reset',
                req.user.id,
                'Reset de inventario'
            ],
            (logErr) => {
                if (logErr) {
                    console.warn('⚠️  No se pudo registrar reset en historial');
                }
            }
        );

        res.json({ success: true, data: updated });
    });
});



// =============================================
// ENDPOINTS DE GESTIÓN DE PERSONAL ADMINISTRATIVO
// =============================================

// =============================================
// 1. OBTENER TODOS LOS ADMINISTRADORES
// =============================================
app.get('/api/admin/staff', authenticateToken, (req, res) => {
    console.log('\n👥 Solicitando lista de administradores - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_all_admins()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_all_admins:', err);
            return res.status(500).json({ error: 'Error al obtener administradores' });
        }

        console.log(`✅ Lista de administradores obtenida - ${results[0].length} admins`);
        res.json({ success: true, data: results[0] });
    });
});


// =============================================
// 2. CREAR NUEVO ADMINISTRADOR
// =============================================
app.post('/api/admin/staff/create', authenticateToken, async (req, res) => {
    console.log('\n➕ Creando nuevo administrador - Por Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { firstName, lastName, email, password } = req.body;

    console.log(`  Nombre: ${firstName} ${lastName}`);
    console.log(`  Email: ${email}`);

    // Validaciones básicas
    if (!firstName || !lastName || !email || !password) {
        console.log('❌ Datos incompletos');
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Email inválido');
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validar contraseña fuerte
    if (password.length < 8) {
        console.log('❌ Contraseña muy corta');
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 8 caracteres'
        });
    }

    try {
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('  🔐 Contraseña hasheada');

        db.query(
            'CALL sp_create_admin(?, ?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword, req.user.id],
            (err, results) => {
                if (err) {
                    console.error('❌ Error en sp_create_admin:', err);

                    if (err.message.includes('ya está registrado')) {
                        return res.status(400).json({
                            error: 'El correo electrónico ya está registrado'
                        });
                    }

                    return res.status(500).json({ error: 'Error al crear administrador' });
                }

                const newAdmin = results[0][0];
                console.log(`✅ Administrador creado exitosamente - ID: ${newAdmin.id}`);
                console.log(`   ${newAdmin.first_name} ${newAdmin.last_name} (${newAdmin.email})`);

                res.json({
                    success: true,
                    message: 'Administrador creado exitosamente',
                    data: newAdmin
                });
            }
        );
    } catch (error) {
        console.error('❌ Error al hashear contraseña:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});


// =============================================
// 3. ELIMINAR ADMINISTRADOR
// =============================================
app.delete('/api/admin/staff/:adminId', authenticateToken, (req, res) => {
    console.log('\n🗑️  Eliminando administrador - Por Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { adminId } = req.params;
    const { reason } = req.body;

    console.log(`  Admin a eliminar: ${adminId}`);
    console.log(`  Razón: ${reason || 'No especificada'}`);

    db.query(
        'CALL sp_delete_admin(?, ?, ?)',
        [adminId, req.user.id, reason],
        (err, results) => {
            if (err) {
                console.error('❌ Error en sp_delete_admin:', err);

                // Manejar errores específicos
                if (err.message.includes('único administrador')) {
                    return res.status(400).json({
                        error: 'No se puede eliminar el único administrador del sistema'
                    });
                }

                if (err.message.includes('tu propia cuenta')) {
                    return res.status(400).json({
                        error: 'No puedes eliminar tu propia cuenta de administrador'
                    });
                }

                if (err.message.includes('no existe')) {
                    return res.status(404).json({ error: 'Administrador no encontrado' });
                }

                if (err.message.includes('no es administrador')) {
                    return res.status(400).json({ error: 'El usuario no es administrador' });
                }

                return res.status(500).json({ error: 'Error al eliminar administrador' });
            }

            const result = results[0][0];
            console.log(`✅ Administrador eliminado exitosamente`);
            console.log(`   ${result.deleted_name} (${result.deleted_email})`);

            res.json({
                success: true,
                message: 'Administrador eliminado exitosamente',
                data: result
            });
        }
    );
});


// =============================================
// 4. DEGRADAR ADMIN A CLIENTE (Alternativa suave)
// =============================================
app.post('/api/admin/staff/:adminId/demote', authenticateToken, (req, res) => {
    console.log('\n⬇️  Degradando administrador - Por Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { adminId } = req.params;
    const { reason } = req.body;

    console.log(`  Admin a degradar: ${adminId}`);
    console.log(`  Razón: ${reason || 'No especificada'}`);

    db.query(
        'CALL sp_demote_admin(?, ?, ?)',
        [adminId, req.user.id, reason],
        (err, results) => {
            if (err) {
                console.error('❌ Error en sp_demote_admin:', err);

                if (err.message.includes('único administrador')) {
                    return res.status(400).json({
                        error: 'No se puede degradar el único administrador del sistema'
                    });
                }

                if (err.message.includes('tu propia cuenta')) {
                    return res.status(400).json({
                        error: 'No puedes degradar tu propia cuenta'
                    });
                }

                return res.status(500).json({ error: 'Error al degradar administrador' });
            }

            const result = results[0][0];
            console.log(`✅ Administrador degradado a cliente exitosamente`);
            console.log(`   ${result.user_name}`);

            res.json({
                success: true,
                message: 'Permisos de administrador removidos exitosamente',
                data: result
            });
        }
    );
});


// =============================================
// 5. ACTUALIZAR INFORMACIÓN DE ADMINISTRADOR
// =============================================
app.put('/api/admin/staff/:adminId', authenticateToken, (req, res) => {
    console.log('\n✏️  Actualizando administrador - Por Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { adminId } = req.params;
    const { firstName, lastName, email } = req.body;

    console.log(`  Admin a actualizar: ${adminId}`);
    console.log(`  Nuevos datos: ${firstName} ${lastName} - ${email}`);

    // Validaciones
    if (!firstName || !lastName || !email) {
        console.log('❌ Datos incompletos');
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Email inválido');
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    db.query(
        'CALL sp_update_admin(?, ?, ?, ?, ?)',
        [adminId, firstName, lastName, email, req.user.id],
        (err, results) => {
            if (err) {
                console.error('❌ Error en sp_update_admin:', err);

                if (err.message.includes('ya está en uso')) {
                    return res.status(400).json({
                        error: 'El correo electrónico ya está en uso'
                    });
                }

                return res.status(500).json({ error: 'Error al actualizar administrador' });
            }

            const updatedAdmin = results[0][0];
            console.log(`✅ Administrador actualizado exitosamente`);
            console.log(`   ${updatedAdmin.first_name} ${updatedAdmin.last_name}`);

            res.json({
                success: true,
                message: 'Administrador actualizado exitosamente',
                data: updatedAdmin
            });
        }
    );
});


// =============================================
// 6. OBTENER AUDITORÍA DE ADMINISTRADORES
// =============================================
app.get('/api/admin/staff/audit-log', authenticateToken, (req, res) => {
    console.log('\n📜 Solicitando auditoría de administradores - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const adminId = req.query.adminId ? parseInt(req.query.adminId) : null;
    const action = req.query.action || null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    console.log(`  Admin ID: ${adminId || 'Todos'}`);
    console.log(`  Acción: ${action || 'Todas'}`);
    console.log(`  Límite: ${limit}`);

    db.query(
        'CALL sp_get_admin_audit_log(?, ?, ?)',
        [adminId, action, limit],
        (err, results) => {
            if (err) {
                console.error('❌ Error en sp_get_admin_audit_log:', err);
                return res.status(500).json({ error: 'Error al obtener auditoría' });
            }

            console.log(`✅ Auditoría obtenida - ${results[0].length} registros`);
            res.json({ success: true, data: results[0] });
        }
    );
});


// =============================================
// 7. OBTENER ESTADÍSTICAS DE ADMINISTRADORES
// =============================================
app.get('/api/admin/staff/statistics', authenticateToken, (req, res) => {
    console.log('\n📊 Solicitando estadísticas de administradores - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    db.query('CALL sp_get_admin_statistics()', (err, results) => {
        if (err) {
            console.error('❌ Error en sp_get_admin_statistics:', err);
            return res.status(500).json({ error: 'Error al obtener estadísticas' });
        }

        const stats = results[0][0];
        console.log(`✅ Estadísticas obtenidas:`);
        console.log(`   Total admins: ${stats.total_admins}`);
        console.log(`   Activos (7 días): ${stats.active_last_7_days}`);
        console.log(`   Activos (30 días): ${stats.active_last_30_days}`);

        res.json({ success: true, data: stats });
    });
});


// =============================================
// 8. VALIDAR EMAIL CORPORATIVO
// =============================================
app.post('/api/admin/staff/validate-email', authenticateToken, (req, res) => {
    console.log('\n✉️  Validando email corporativo - Admin ID:', req.user.id);

    if (req.user.role !== 'admin') {
        console.log('❌ Acceso denegado - Usuario no es admin');
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
    }

    db.query('CALL sp_validate_corporate_email(?)', [email], (err, results) => {
        if (err) {
            console.error('❌ Error en sp_validate_corporate_email:', err);
            return res.status(500).json({ error: 'Error al validar email' });
        }

        const validation = results[0][0];
        console.log(`  ${email}: ${validation.is_valid ? '✅ Válido' : '❌ Inválido'}`);

        res.json({
            success: true,
            data: validation
        });
    });
});


// Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('Endpoints disponibles:');
    console.log('  POST /api/login');
    console.log('  POST /api/register');
    console.log('  POST /api/forgot-password');
    console.log('  POST /api/reset-password');
    console.log('  GET  /api/client/home (protegida)');
    console.log('  GET  /api/admin/home (protegida)');
    console.log('  GET  /api/collection (protegida)');

    console.log('\n  🔒 ADMIN - VENTAS:');
    console.log('  GET  /api/admin/sales-report');
    console.log('  GET  /api/admin/sales-total');
    console.log('  GET  /api/admin/top-selling?limit=10');
    console.log('  GET  /api/admin/sales-by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD');

    console.log('\n  📦 ADMIN - RE-STOCK:');
    console.log('  GET  /api/admin/inventory');
    console.log('  GET  /api/admin/low-stock?threshold=10');
    console.log('  PUT  /api/admin/inventory/:vinylId/stock');
    console.log('  POST /api/admin/inventory/batch-update');
    console.log('  GET  /api/admin/stock-history?vinylId=1');
    console.log('  POST /api/admin/inventory/:vinylId/reset');

    console.log('\n  👥 ADMIN - GESTIÓN DE PERSONAL:');
    console.log('  GET  /api/admin/staff');
    console.log('  POST /api/admin/staff/create');
    console.log('  PUT  /api/admin/staff/:adminId');
    console.log('  DELETE /api/admin/staff/:adminId');
    console.log('  POST /api/admin/staff/:adminId/demote');
    console.log('  GET  /api/admin/staff/audit-log?adminId=1&action=created&limit=50');
    console.log('  GET  /api/admin/staff/statistics');
    console.log('  POST /api/admin/staff/validate-email');

    console.log('='.repeat(50) + '\n');
});