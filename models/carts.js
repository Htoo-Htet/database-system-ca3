const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR, RAISE_EXCEPTION } = require('../errors');

const { PrismaClient, Prisma } = require('@prisma/client');
const { json } = require('express');
const prisma = new PrismaClient();

module.exports.createSingleCartItem = async function createSingleCartItem(member, product, number) {
    try {
        const cartItem = await prisma.cartItem.create({ 
            data: { 
                memberId: member, 
                productId: product,
                quantity: number
            }
        });
        return cartItem; 
    } catch (error) { 
        if (error instanceof Prisma.PrismaClientKnownRequestError) { 
            if (error.code === 'P2002') { 
                throw new Error(`The cart item for product ${product} already exists.`); 
            } 
        } 
        throw error; 
    } 
};

module.exports.createMultipleCartItems = async function createMultipleCartItems(member, notInCartProducts) {
    return Promise.all(
        notInCartProducts.map(async (product) => {
            try {
                return await prisma.cartItem.create({
                    data: {
                        memberId: member,
                        productId: product,
                        quantity: 1
                    }
                })
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) { 
                    if (error.code === 'P2002') { 
                        throw new Error(`The cart item for product ${product} already exists.`); 
                    } 
                } 
                throw error; 
            }
        })
    ).then(function (createdCartItems) {
        return createdCartItems;
    }).catch(function (error) {
        throw error;
    });
};

module.exports.retrieveAllCartItems = async function retrieveAllCartItems(member) {
    const cartItems = await prisma.cartItem.findMany({
        where: {
            memberId: member
        },
        include: {
            product: true
        },
        orderBy: {
            id: 'asc'
        }
    });
    return cartItems;
};

module.exports.retrieveSingleCartItem = async function retrieveSingleCartItem(member, product) {
    const cartItem = await prisma.cartItem.findFirst({
        where: {
            memberId: member,
            productId: product
        },
        include: {
            product: true
        }
    });
    return cartItem;
}

module.exports.updateSingleCartItem = async function updateSingleCartItem(cartItemId, number) {
    try {
        const cartItem = await prisma.cartItem.update({
            where: {
                id: cartItemId
            },
            data: {
                quantity: number
            }
        });
        return cartItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new Error(`The cart item for product ${product} is not found.`);
            }
        } throw error;
    } 
};

module.exports.updateMultipleCartItems = async function updateMultipleCartItems(cartItems) {
    return Promise.all(
        cartItems.map(async ({ cartItemId, quantity }) => {
            try {
                return await prisma.cartItem.update({
                    where: {
                        id: cartItemId
                    },
                    data: {
                        quantity: quantity
                    }
                });
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') {
                        throw new Error(`The cart item with ID ${cartItemId} is not found.`);
                    }
                }
                throw error;
            }
        })
    ).then(function (updatedCartItems) {
        return updatedCartItems;
    }).catch(function (error) {
        throw error; 
    });
};

module.exports.addQuantityForSingleCartItem = async function addQuantityOfCartItem(cartItemId, oldNumber, newNumber,) {
    try {
        const cartItem = await prisma.cartItem.update({
            where: {
                id: cartItemId
            },
            data: {
                quantity: oldNumber + newNumber
            }
        });
        return cartItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new Error(`The cart item for product ${product} is not found.`);
            }
        } 
        throw error;
    } 
};

module.exports.deleteSingleCartItem = async function deleteSingleCartItem(cartItemId) {
    try {
        const deletedCartItem = await prisma.cartItem.delete({
            where: {
                id: cartItemId
            }
        });
        return deletedCartItem;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                throw new Error(`The cart item id ${cartItemId} is not found!`);
            }
        }
        throw error;
    }
};

module.exports.deleteMultipleCartItems = async function deleteMultipleCartItems(cartItems) {
    return Promise.all(
        cartItems.map(async ({ cartItemId }) => {
            try {
                return await prisma.cartItem.delete({
                    where: {
                        id: cartItemId
                    }
                });
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') {
                        throw new Error(`The cart item with ID ${cartItemId} is not found.`);
                    }
                }
                throw error;
            }
        })
    ).then(function (deletedCartItems) {
        return deletedCartItems;
    }).catch(function (error) {
        throw error; 
    });
};

module.exports.checkOutCartItems = async function checkOutCartItems(memberId) {
    const sql = 'CALL place_orders($1, $2);';

    try {
        let failedItems = [];
        const result = await query(sql, [memberId, failedItems]);
        failedItems = result.rows[0].failedItems;
        console.log(failedItems);
        return failedItems;
    } catch (error) {
        if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION ) {
            throw new RAISE_EXCEPTION(error.message);
        }
        throw error;
    }
};