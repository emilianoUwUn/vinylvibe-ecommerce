require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinylvibe_db',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to DB:', err);
        return;
    }
    console.log('Connected to DB');

    const sql = `
        DROP PROCEDURE IF EXISTS sp_get_user_collection;
        CREATE PROCEDURE sp_get_user_collection(IN p_user_id INT)
        BEGIN
            SELECT DISTINCT v.id, v.title, v.artist, v.image_url
            FROM vinyls v
            JOIN order_items oi ON v.id = oi.vinyl_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = p_user_id AND o.status = 'completed';
        END;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error updating SP:', err);
        } else {
            console.log('Successfully created sp_get_user_collection');
        }
        db.end();
    });
});
