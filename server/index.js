require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// =============================================
// LOGS DE CONFIGURACIÓN INICIAL
// =============================================
console.log('='.repeat(50));
console.log('🎧 VinylVibe API - Iniciando servidor...');
console.log('='.repeat(50));
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Configurado' : '❌ NO configurado');
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ NO configurado');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ NO configurado');
console.log('🗄️  DB_HOST:', process.env.DB_HOST || '❌ NO configurado');
console.log('🗄️  DB_NAME:', process.env.DB_NAME || '❌ NO configurado');
console.log('='.repeat(50));

// Configuración de la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('❌ Error en la conexión a MySQL:', err.message);
        console.error('Detalles del error:', err);
        return;
    }
    console.log('✅ Conexión establecida con MySQL');
});

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar configuración de email al inicio
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error en configuración de Nodemailer:', error);
        console.error('⚠️  IMPORTANTE: Verifica que EMAIL_USER y EMAIL_PASS estén correctos en .env');
        console.error('⚠️  Si usas Gmail, necesitas una "Contraseña de aplicación", no tu contraseña normal');
    } else {
        console.log('✅ Nodemailer configurado correctamente');
        console.log('📧 Listo para enviar emails desde:', process.env.EMAIL_USER);
    }
});

// Almacén temporal para tokens de reset
const resetTokens = new Map();

// Ruta raíz
app.get('/', (req, res) => {
    res.send('🎧 VinylVibe API: El Santuario Analógico está en línea.');
});

// =============================================
// ENDPOINT LOGIN
// =============================================
app.post('/api/login', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('🔐 LOGIN - Nueva solicitud');
    console.log('='.repeat(50));
    
    const { email, password } = req.body;
    
    console.log('📧 Email recibido:', email);
    console.log('🔑 Password recibido:', password ? '✅ Presente' : '❌ Vacío');
    
    try {
        db.query('CALL sp_login(?, ?)', [email, password], (err, results) => {
            if (err) {
                console.error('❌ Error en sp_login:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            console.log('📊 Resultados de sp_login:', results[0]);
            
            if (results[0].length === 0) {
                console.log('⚠️  Credenciales inválidas para:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            
            const user = results[0][0];
            console.log('✅ Usuario encontrado:', user);
            
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('✅ Token JWT generado para usuario:', user.id);
            console.log('='.repeat(50));
            
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('❌ Error catch en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// =============================================
// ENDPOINT REGISTER
// =============================================
app.post('/api/register', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('📝 REGISTER - Nueva solicitud');
    console.log('='.repeat(50));
    
    const { firstName, lastName, email, password } = req.body;
    
    console.log('📧 Email:', email);
    console.log('👤 Nombre:', firstName, lastName);
    console.log('🔑 Password:', password ? '✅ Presente' : '❌ Vacío');
    
    try {
        // Verificar si el email ya existe
        db.query('SELECT email FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('❌ Error al verificar email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            console.log('📊 Emails encontrados con ese correo:', results.length);
            
            if (results.length > 0) {
                console.log('⚠️  Email ya registrado:', email);
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            
            // Registrar nuevo usuario
            console.log('➡️  Llamando a sp_register_client...');
            db.query('CALL sp_register_client(?, ?, ?, ?)', 
                [firstName, lastName, email, password], 
                (err, results) => {
                    if (err) {
                        console.error('❌ Error en sp_register_client:', err);
                        return res.status(500).json({ error: 'Error al registrar usuario' });
                    }
                    
                    console.log('✅ Usuario registrado exitosamente:', email);
                    console.log('='.repeat(50));
                    
                    res.json({ 
                        success: true, 
                        message: 'Usuario registrado exitosamente' 
                    });
                }
            );
        });
    } catch (error) {
        console.error('❌ Error catch en register:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// =============================================
// ENDPOINT FORGOT PASSWORD
// =============================================
app.post('/api/forgot-password', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('📧 FORGOT PASSWORD - Nueva solicitud');
    console.log('='.repeat(50));
    
    const { email } = req.body;
    
    console.log('📧 Email recibido:', email);
    
    if (!email) {
        console.log('❌ Email vacío o no proporcionado');
        return res.status(400).json({ error: 'Email requerido' });
    }
    
    try {
        // Verificar si el email existe
        console.log('➡️  Buscando email en base de datos...');
        db.query('SELECT id, first_name FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('❌ Error en query de búsqueda:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            console.log('📊 Usuarios encontrados:', results.length);
            
            if (results.length === 0) {
                console.log('⚠️  Email no encontrado en BD:', email);
                return res.status(404).json({ error: 'Email no encontrado' });
            }
            
            const user = results[0];
            console.log('✅ Usuario encontrado:', user);
            
            const resetToken = crypto.randomBytes(32).toString('hex');
            console.log('🔑 Token generado:', resetToken.substring(0, 10) + '...');
            
            // Guardar token temporalmente (expira en 1 hora)
            resetTokens.set(resetToken, {
                email: email,
                userId: user.id,
                expires: Date.now() + 3600000 // 1 hora
            });
            
            console.log('💾 Token guardado en memoria. Total tokens:', resetTokens.size);
            
            // Enviar email
            const resetUrl = `http://localhost:5174/reset-password?token=${resetToken}`;
            console.log('🔗 URL de reset generada:', resetUrl);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: '🎧 VinylVibe - Restablecer Contraseña',
                html: `
                    <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; background: #FEF7ED; padding: 40px; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="font-size: 3rem; font-weight: 900; color: #1F2937; margin-bottom: 10px;">
                                Vinyl<span style="color: #EA580C; font-style: italic;">V</span>ibe
                            </h1>
                            <div style="width: 60px; height: 2px; background: #EA580C; margin: 0 auto;"></div>
                        </div>
                        
                        <h2 style="color: #1F2937; text-align: center; margin-bottom: 20px;">Hola ${user.first_name},</h2>
                        
                        <p style="color: #6B7280; text-align: center; margin-bottom: 30px; line-height: 1.6;">
                            Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.
                        </p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="${resetUrl}" style="background: #EA580C; color: #1F2937; padding: 15px 30px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-radius: 5px; display: inline-block;">
                                Restablecer Contraseña
                            </a>
                        </div>
                        
                        <p style="color: #9CA3AF; font-size: 0.875rem; text-align: center; margin-top: 30px;">
                            Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este email.
                        </p>
                    </div>
                `
            };
            
            console.log('📧 Preparando envío de email...');
            console.log('   From:', mailOptions.from);
            console.log('   To:', mailOptions.to);
            console.log('   Subject:', mailOptions.subject);
            
            try {
                console.log('⏳ Enviando email...');
                const info = await transporter.sendMail(mailOptions);
                
                console.log('✅ Email enviado exitosamente!');
                console.log('📬 Message ID:', info.messageId);
                console.log('📨 Response:', info.response);
                console.log('='.repeat(50));
                
                res.json({ 
                    success: true, 
                    message: 'Email de recuperación enviado' 
                });
            } catch (emailError) {
                console.error('❌ ERROR AL ENVIAR EMAIL:');
                console.error('Código de error:', emailError.code);
                console.error('Mensaje:', emailError.message);
                console.error('Detalles completos:', emailError);
                console.log('='.repeat(50));
                
                // Dar más información al usuario según el tipo de error
                let errorMessage = 'Error al enviar email';
                
                if (emailError.code === 'EAUTH') {
                    errorMessage = 'Error de autenticación con el servidor de email. Verifica EMAIL_USER y EMAIL_PASS en .env';
                    console.error('⚠️  SOLUCIÓN: Si usas Gmail, necesitas generar una "Contraseña de aplicación"');
                    console.error('⚠️  Ve a: https://myaccount.google.com/apppasswords');
                } else if (emailError.code === 'ECONNECTION') {
                    errorMessage = 'No se pudo conectar al servidor de email';
                } else if (emailError.code === 'ETIMEDOUT') {
                    errorMessage = 'Tiempo de espera agotado al conectar con el servidor de email';
                }
                
                return res.status(500).json({ 
                    error: errorMessage,
                    details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
                });
            }
        });
    } catch (error) {
        console.error('❌ Error catch en forgot-password:', error);
        console.log('='.repeat(50));
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// =============================================
// ENDPOINT RESET PASSWORD
// =============================================
app.post('/api/reset-password', async (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('🔄 RESET PASSWORD - Nueva solicitud');
    console.log('='.repeat(50));
    
    const { token, newPassword } = req.body;
    
    console.log('🔑 Token recibido:', token ? token.substring(0, 10) + '...' : '❌ Vacío');
    console.log('🔒 Nueva password:', newPassword ? '✅ Presente' : '❌ Vacía');
    
    try {
        const tokenData = resetTokens.get(token);
        
        console.log('💾 Tokens en memoria:', resetTokens.size);
        console.log('📊 Token encontrado:', tokenData ? '✅ Sí' : '❌ No');
        
        if (!tokenData) {
            console.log('⚠️  Token no encontrado en memoria');
            console.log('='.repeat(50));
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }
        
        console.log('⏰ Token expira en:', new Date(tokenData.expires).toLocaleString());
        console.log('⏰ Hora actual:', new Date().toLocaleString());
        
        if (Date.now() > tokenData.expires) {
            console.log('⚠️  Token expirado');
            resetTokens.delete(token);
            console.log('='.repeat(50));
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }
        
        console.log('✅ Token válido para email:', tokenData.email);
        
        // Actualizar contraseña
        console.log('➡️  Llamando a sp_reset_password...');
        db.query('CALL sp_reset_password(?, ?)', 
            [tokenData.email, newPassword], 
            (err, results) => {
                if (err) {
                    console.error('❌ Error en sp_reset_password:', err);
                    return res.status(500).json({ error: 'Error al actualizar contraseña' });
                }
                
                console.log('✅ Contraseña actualizada en BD');
                
                // Eliminar token usado
                resetTokens.delete(token);
                console.log('🗑️  Token eliminado. Tokens restantes:', resetTokens.size);
                console.log('='.repeat(50));
                
                res.json({ 
                    success: true, 
                    message: 'Contraseña actualizada exitosamente' 
                });
            }
        );
    } catch (error) {
        console.error('❌ Error catch en reset-password:', error);
        console.log('='.repeat(50));
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

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
    console.log('='.repeat(50) + '\n');
});