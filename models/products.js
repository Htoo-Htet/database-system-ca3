const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.retrieveById = function retrieveById(productId) {
    const sql = `SELECT * FROM product WHERE id= $1`;
    return query(sql, [productId]).then(function (result) {
        const rows = result.rows;

        if (rows.length === 0) {
            throw new EMPTY_RESULT_ERROR(`Product ${productId} not found!`);
        }

        return rows[0];
    });
};

module.exports.retrieveAll = function retrieveAll() {
    const sql = `SELECT * FROM product ORDER BY id`;
    return query(sql).then(function (result) {
        return result.rows;
    });
};

