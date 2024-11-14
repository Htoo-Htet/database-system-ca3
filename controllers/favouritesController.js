const { RAISE_EXCEPTION, EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const favouritesModel = require('../models/favourites');

module.exports.retrieveFavouriteById = function (req, res) {
    const memberId = req.locals.member_id;
    const productId = req.params.productId;

    return favouritesModel
        .retrieveFavouriteById(memberId, productId)
        .then(function (product) {
            return res.json({ product: product });
        })
        .catch(function (error) {
            console.error(error);
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        });
}

module.exports.retrieveAllFavourites = function (req, res) {
    const memberId = res.locals.member_id;

    return favouritesModel
        .retrieveAllFavourites(memberId)
        .then(function (products) {
            return res.json({ products: products });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        });
}

module.exports.addProductToFavourites = function (req, res) {
    const memberId = res.locals.member_id;
    const productId = req.params.productId;
    
    return favouritesModel.addProductToFavourites(memberId, productId)
        .then(function(result) {
            return res.sendStatus(200);
        })
        .catch(function(error){
            console.log(error);
            if (error instanceof RAISE_EXCEPTION) {
                return res.status(400).json({ error: error.message });
            } 
            console.error(error);
            return res.status(500).send('unknown error');
        });
}

module.exports.removeProductFromFavourites = function (req, res) {
    const memberId = res.locals.member_id;
    const productId = req.params.productId;
    
    return favouritesModel.removeProductFromFavourites(memberId, productId)
        .then(function(result) {
            return res.sendStatus(200);
        })
        .catch(function(error){
            console.log(error);
            if (error instanceof RAISE_EXCEPTION) {
                return res.status(400).json({ error: error.message });
            } 
            console.error(error);
            return res.status(500).send('unknown error');
        });
}

module.exports.calculateFavouritedPercentageOfProducts = function (req, res) {

    return favouritesModel
        .calculateFavouritedPercentageOfProducts()
        .then(function (products) {
            return res.json({ products: products });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        });
}