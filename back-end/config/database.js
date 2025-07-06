const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

pool.on('connect', () => {
    console.log('Connected to PostgresSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});
  
module.exports = pool;
