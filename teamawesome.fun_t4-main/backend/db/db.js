require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env"),
});

const { Pool } = require('pg');

const isProd = process.env.NODE_ENV === 'production';

const dbConfig = {
  dbUser: isProd ? process.env.DB_USER : process.env.POSTGRES_USER,
  dbHost: isProd ? process.env.DB_HOST : process.env.POSTGRES_HOST,
  dbName: isProd ? process.env.DB_NAME : process.env.POSTGRES_DB,
  dbPassword: isProd ? process.env.DB_PASSWORD : process.env.POSTGRES_PASSWORD
};

const { dbUser, dbHost, dbName, dbPassword } = dbConfig;

const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: process.env.DB_PORT,
  ssl: isProd ? {rejectUnauthorized: false } : false,
//   ssl: {rejectUnauthorized: false }
});


// Export a query function that returns a promise
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool
};