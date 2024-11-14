const { RAISE_EXCEPTION, EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR, DATATYPE_MISMATCH, INVALID_TEXT_REPRESENTATION } = require('../errors');
const reviewsModel = require('../models/reviews');


module.exports.createReview = function (req, res) {
    const memberId = res.locals.member_id;
    const saleOrderId = req.body.saleOrderId;
    const productId = req.body.productId;
    const rating = req.body.rating;
    const reviewText = req.body.reviewText;
    
    return reviewsModel.createReview(memberId, saleOrderId, productId, rating, reviewText)
        .then(function(result) {
            return res.sendStatus(200);
        })
        .catch(function(error){
            console.log(error);
            if (error instanceof INVALID_TEXT_REPRESENTATION || error instanceof DATATYPE_MISMATCH || error instanceof RAISE_EXCEPTION) {
                return res.status(400).json({ error: error.message });
            } 
            console.error(error);
            return res.status(500).send('unknown error');
        });
}

module.exports.retrieveAllReviews = function (req, res) {
    return reviewsModel
        .retrieveAllReviews(res.locals.member_id)
        .then(function (allReviews) {
            return res.json({ reviews: allReviews });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: "Unknown Error" });
        });
}

module.exports.retrieveAllReviewsByProductId = function (req, res) {
    const productId = req.params.productId;
    const order = req.query.order;
    const rating = req.query.rating || '';

    return reviewsModel
        .retrieveAllReviewsByProductId(productId, rating, order)
        .then(function (allReviews) {
            return res.json({ reviews: allReviews });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: error.message});
        });
}

module.exports.updateReview = function (req, res) {
    const memberId = res.locals.member_id;
    const reviewId = req.params.reviewId;
    const rating = req.body.rating;
    const reviewText = req.body.reviewText;
    
    return reviewsModel.updateReview(memberId, reviewId, rating, reviewText)
        .then(function(result) {
            return res.sendStatus(200);
        })
        .catch(function(error){
            console.log(error);
            if (error instanceof INVALID_TEXT_REPRESENTATION || error instanceof DATATYPE_MISMATCH || error instanceof RAISE_EXCEPTION) {
                return res.status(400).json({ error: error.message });
            } 
            console.error(error);
            return res.status(500).send('unknown error');
        });
}

module.exports.deleteReview = function (req, res) {
    const memberId = res.locals.member_id;
    const reviewId = req.params.reviewId;
    
    return reviewsModel.deleteReview(memberId, reviewId)
        .then(function(result) {
            return res.sendStatus(200);
        })
        .catch(function(error){
            console.log(error);
            if (error instanceof INVALID_TEXT_REPRESENTATION || error instanceof DATATYPE_MISMATCH || error instanceof RAISE_EXCEPTION) {
                return res.status(400).json({ error: error.message });
            } 
            console.error(error);
            return res.status(500).send('unknown error');
        });
}