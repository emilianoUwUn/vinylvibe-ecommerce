require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares para una API de alta fidelidad
app.use(cors());
app.use(express.json());

// Configuración de la conexión utilizando las variables de entorno del .env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 // Por si acaso no lo toma del env
});

// Intentar conectar a la Bóveda de Vinilos
db.connect((err) => {
    if (err) {
        console.error('❌ Error melómano en la bóveda:', err.message);
        return;
    }
    console.log('✅ Conexión establecida con la bóveda de vinilos (MySQL)');
});

// Ruta raíz - El Manifiesto
app.get('/', (req, res) => {
    res.send('🎧 VinylVibe API: El Santuario Analógico está en línea.');
});

// --- RUTA PARA TU CATÁLOGO DE LUJO ---
// Esta ruta servirá los 16 vinilos que tienes en tu base de datos
app.get('/api/catalogo', (req, res) => {
    const query = "SELECT * FROM vinilos";
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error al consultar El Archivo" });
        }
        res.json(results);
    });
});

// Servidor escuchando en el puerto definido o el 3001 por defecto
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Categoría corriendo en http://localhost:${PORT}`);
});