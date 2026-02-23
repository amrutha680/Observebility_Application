const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({

    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,

});


pool.connect((err) => {
    if(err){
        console.log("Database connection failed", err);
    }else{
        console.log("Connected to PostgreSQL database!");

    }

});

module.exports = pool;