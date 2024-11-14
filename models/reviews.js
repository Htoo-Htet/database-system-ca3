const { query } = require('../database');
const { RAISE_EXCEPTION, EMPTY_RESULT_ERROR, DATATYPE_MISMATCH, INVALID_TEXT_REPRESENTATION, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.createReview = function createReview(memberId, saleOrderId, productId, rating, reviewText) {
    const sql = 'CALL create_review($1, $2, $3, $4, $5)';
    return query(sql, [memberId, saleOrderId, productId, rating, reviewText])
        .then(function (result) {
            console.log('Review created');
        })
        .catch(function (error) {
            if (error.code === SQL_ERROR_CODE.INVALID_TEXT_REPRESENTATION) {
                throw new INVALID_TEXT_REPRESENTATION('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.DATATYPE_MISMATCH) {
                throw new DATATYPE_MISMATCH('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            throw error;
        });
};

module.exports.retrieveAllReviews = function retrieveAllReviews(memberId) {
    const sql = `SELECT * FROM get_all_reviews($1);`;
    return query(sql, [memberId]).then(function (result) {
        return result.rows;
    });
};

module.exports.retrieveAllReviewsByProductId = function retrieveAllReviews(productId, rating, order) {
    let sql = `SELECT * FROM get_all_reviews_by_product_id($1, $2, $3)`;
    
    return query(sql, [productId, rating, order])
    .then(function (result) {
        console.log(result.rows);
        return result.rows;
    })
    .catch(function (error) {
        throw error;
    })
};

module.exports.updateReview = function updateReview(memberId, reviewId, rating, reviewText) {
    const sql = 'CALL update_review($1, $2, $3, $4)';
    return query(sql, [memberId, reviewId, rating, reviewText])
        .then(function (result) {
            console.log(`Review ${reviewId} updated successfully`);
        })
        .catch(function (error) {
            if (error.code === SQL_ERROR_CODE.INVALID_TEXT_REPRESENTATION) {
                throw new INVALID_TEXT_REPRESENTATION('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.DATATYPE_MISMATCH) {
                throw new DATATYPE_MISMATCH('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            throw error;
        });
};

module.exports.deleteReview = function deleteReview(memberId, reviewId) {
    const sql = 'CALL delete_review($1, $2)';
    return query(sql, [memberId, reviewId])
        .then(function (result) {
            console.log(`Review ${reviewId} deleted successfully`);
        })
        .catch(function (error) {
            if (error.code === SQL_ERROR_CODE.INVALID_TEXT_REPRESENTATION) {
                throw new INVALID_TEXT_REPRESENTATION('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.DATATYPE_MISMATCH) {
                throw new DATATYPE_MISMATCH('Enter all the required information in correct format');
            }

            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            throw error;
        });
};