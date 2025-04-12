import mysql from 'mysql2/promise';

const pool = mysql.createPool( {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306, // Added port configuration
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trip_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
} );

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log( 'MySQL database connected successfully' );
        connection.release();
        return pool;
    } catch ( error ) {
        console.error( 'Error connecting to MySQL database:', error.message );
        process.exit( 1 );
    }
};

export { connectDB, pool };