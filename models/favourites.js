const { query } = require('../database');
const { RAISE_EXCEPTION, EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.retrieveFavouriteById = function retrieveFavouriteById(memberId, productId) {
    const sql = `SELECT * FROM get_favourite_by_id($1, $2)`;
    return query(sql, [memberId, productId])
    .then(function (result) {
        return result.rows;
    });
};

module.exports.retrieveAllFavourites = function retrieveAllFavourites(memberId) {
    const sql = `SELECT * FROM get_all_favourites($1)`;
    return query(sql, [memberId])
    .then(function (result) {
        return result.rows;
    });
};

module.exports.addProductToFavourites = function addProductToFavourites(memberId, productId) {
    const sql = 'CALL add_product_to_favourites($1, $2)';
    return query(sql, [memberId, productId])
        .then(function (result) {
            console.log('Favourite added');
        })
        .catch(function (error) {
            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            throw error;
        });
};

module.exports.removeProductFromFavourites = function removeProductFromFavourites(memberId, productId) {
    const sql = 'CALL remove_product_from_favourites($1, $2)';
    return query(sql, [memberId, productId])
        .then(function (result) {
            console.log('Favourite added');
        })
        .catch(function (error) {
            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            throw error;
        });
};

module.exports.calculateFavouritedPercentageOfProducts = function calculateFavouritedPercentageOfProducts() {
    const sql = `SELECT * FROM calculate_favourited_percentage_of_products();`;
    return query(sql)
    .then(function (result) {
        return result.rows;
    });
};