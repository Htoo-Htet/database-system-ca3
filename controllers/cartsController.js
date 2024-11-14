const cartsModel = require('../models/carts');
const productsModel = require('../models/products');

module.exports.addSingleProductToCart = function (req, res) {
    const memberId = res.locals.member_id;
    const productId = parseInt((req.body.productId), 10);
    const quantity = parseInt((req.body.quantity), 10);

    return productsModel.retrieveById(productId)
    .then(function (product) {
        if (!product) {
            return res.status(404).json({ error: `Product with ID ${productId} not found.` });
        }
        return cartsModel.retrieveSingleCartItem(memberId, productId);
    })
    .then(function (cartItem) {
        if (!cartItem) {
            cartsModel.createSingleCartItem(memberId, productId, quantity)
            .then(function () {
                return res.sendStatus(200);
            })
            .catch(function (error) {
                console.error(error);
                return res.status(500).json({ error: error.message });
            });
        } else {
            cartsModel.addQuantityForSingleCartItem(cartItem.id, cartItem.quantity, quantity)
            .then(function () {
                return res.sendStatus(200);
            })
            .catch(function (error) {
                console.error(error);
                return res.status(500).json({ error: error.message });
            });
        }
    })
    .catch(function (error) {
        console.error(error);
    });
}

module.exports.addMultipleProductsToCart = function (req, res) {
    const memberId = res.locals.member_id;
    const products = req.body.products;
    let inCartProducts = [];
    let notInCartProducts = [];

    return cartsModel.retrieveAllCartItems(memberId)
    .then(function (cartItems) {
        products.forEach(function (product) {
            const productId = product.productId;
            if(cartItems.some(cartItem => cartItem.productId === productId)) {
                inCartProducts.push(productId);
            } else {
                notInCartProducts.push(productId);
            }
        })
        return cartsModel.createMultipleCartItems(memberId, notInCartProducts);
    })
    .then(function () {
        return res.status(200).json({ 
            notAddedProducts: inCartProducts,
            addedProducts: notInCartProducts
         });
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
}

module.exports.retrieveAllCartItems = function (req, res) {
    const memberId = res.locals.member_id;

    return cartsModel.retrieveAllCartItems(memberId)
    .then(function (cartItems) {
        return res.json({ cartItems: cartItems });
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
}

module.exports.updateSingleCartItem = function (req, res) {
    const cartItemId = parseInt((req.params.cartItemId), 10);
    const quantity = parseInt((req.body.quantity), 10);
 
    return cartsModel.updateSingleCartItem(cartItemId, quantity)
    .then(function () {
        return res.sendStatus(200);
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
}

module.exports.bulkUpdateCartItems = function (req, res) {
    const cartItems = req.body.cartItems;

    return cartsModel.updateMultipleCartItems(cartItems)
    .then(function () {
        return res.sendStatus(200);
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
    
}

module.exports.deleteSingleCartItem = function (req, res) {
    const cartItemId = parseInt((req.params.cartItemId), 10);

    return cartsModel
        .deleteSingleCartItem(cartItemId)
        .then(function () {
            return res.sendStatus(204);
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        });
}

module.exports.bulkDeleteCartItems = function (req, res) {
    const cartItems = req.body.cartItems;
    
    return cartsModel.deleteMultipleCartItems(cartItems)
    .then(function () {
        return res.sendStatus(200);
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
}

module.exports.getCartSummary = function (req, res) {
    const memberId = res.locals.member_id;
    
    return cartsModel.retrieveAllCartItems(memberId)
    .then(function (cartItems) {
        let totalQuantity = 0;
        let totalPrice = 0;
        let totalProduct = 0;

        if (cartItems) {
            cartItems.forEach(function (cartItem) {
                const quantity = cartItem.quantity;
                const unitPrice = cartItem.product.unitPrice;
    
                totalQuantity += quantity;
                totalPrice += quantity * unitPrice;
                totalProduct += 1;
            })
        }

        summary = {
            totalQuantity: totalQuantity,
            totalPrice: totalPrice,
            totalProduct: totalProduct
        }
        
        return res.json({ cartSummary: summary });
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message});
    })
}

module.exports.checkOutCartItems = function (req, res) {
    const memberId = res.locals.member_id;
    
    return cartsModel.checkOutCartItems(memberId)
    .then(function (failedItems) {
        return res.status(200).json({ failedItems });
    })
    .catch(function (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    });
}