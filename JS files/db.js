const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || "tramway.proxy.rlwy.net",
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "GxBORcmQGsZVCbcdXaaKLZoGBkeIJTEb",
    database: process.env.MYSQLDATABASE || "railway",
    port: process.env.MYSQLPORT || 36359,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
