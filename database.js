const mysql = require('mysql'),
config = {
    host: '127.0.0.1',
    user: 'root',
    password: 'simtoquamariadb',
    database: 'Restaurant',
    port: 3306
};

function query(query) {

    return new Promise((resolve, reject) => {
        let conn = mysql.createConnection(config);
        conn.connect();

        conn.query(query, (err, res) => {
            if (err) reject(err);

            resolve(res);
        });
        conn.end();
    });
}

module.exports = {
    query
};
