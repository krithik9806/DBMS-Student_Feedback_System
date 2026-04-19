require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(
            "UPDATE users SET email = 'admin123@gmail.com', password_hash = '$2a$10$6pqSzck5.QVAEoJuvFSTuOV1ocQz.bdGJlPpJ4aqcTCeCcXwGVRwO' WHERE role = 'admin' RETURNING *"
        );
        console.log('Successfully updated admin credentials.');
        console.log(res.rows);
    } catch (err) {
        console.error('Error updating admin:', err);
    } finally {
        await client.end();
    }
}

run();
