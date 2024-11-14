const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const saleOrdersModel = require('../models/saleOrders');
const membersModel = require('../models/members');

module.exports.retrieveAll = function (req, res) {
    let memberId = res.locals.member_id;
    const filters = req.query;
    const errors = [];

    function startOfDay(dateStr) {
        return dateStr ? new Date(`${dateStr}T00:00:00Z`).toISOString() : undefined;
    }

    // Function to set the time to the end of the day (23:59:59)
    function endOfDay(dateStr) {
        return dateStr ? new Date(`${dateStr}T23:59:59Z`).toISOString() : undefined;
    }

    // Normalize filter dates to include time
    const normalizedFilters = {
        ...filters,
        minOrderDatetime: startOfDay(filters.minOrderDatetime),
        maxOrderDatetime: endOfDay(filters.maxOrderDatetime)
    };

    // Validate minimum is less than maximum for order datetime
    if (normalizedFilters.minOrderDatetime && normalizedFilters.maxOrderDatetime && 
        new Date(normalizedFilters.minOrderDatetime) > new Date(normalizedFilters.maxOrderDatetime)) {
        return res.status(400).json({ error: 'Minimum order datetime must be before maximum order datetime.' });
    }

    // Validate minimum is less than maximum for item quantity
    if (normalizedFilters.minQuantity && normalizedFilters.maxQuantity) {
        if (parseInt((normalizedFilters.minQuantity), 10) > parseInt((normalizedFilters.maxQuantity), 10)) {
            errors.push("Minimum item quantity must be less than maximum item quantity.");
        }
    }

    // Validate minimum is less than maximum for unit price
    if (normalizedFilters.minUnitPrice && normalizedFilters.maxUnitPrice) {
        if (parseFloat(normalizedFilters.minUnitPrice) > parseFloat(normalizedFilters.maxUnitPrice)) {
            errors.push("Minimum unit price must be less than maximum unit price.");
        }
    }

    // Validate minimum is less than maximum for member's date of birth
    if (normalizedFilters.minDob && normalizedFilters.maxDob) {
        if (new Date(normalizedFilters.minDob) > new Date(normalizedFilters.maxDob)) {
            errors.push("Minimum date of birth must be less than maximum date of birth.");
        }
    }

    // Return validation errors if any
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(".\n") });
    }

    membersModel
        .isAdmin(memberId)
        .then(function (isAdmin) {
            if (isAdmin) {
                memberId = null;
            }

            return saleOrdersModel.retrieveAll(memberId, normalizedFilters);
        })
        .then(function (saleOrderItems) {
            const adaptedSaleOrders = saleOrderItems.map(function (saleOrderItem) {
                return {
                    name: saleOrderItem.product.name,
                    description: saleOrderItem.product.description,
                    unitPrice: saleOrderItem.product.unitPrice,
                    quantity: saleOrderItem.quantity,
                    country: saleOrderItem.product.country,
                    imageUrl: saleOrderItem.product.imageUrl,
                    saleOrderId: saleOrderItem.saleOrder.id,
                    orderDatetime: saleOrderItem.saleOrder.orderDatetime,
                    status: saleOrderItem.saleOrder.status,
                    productType: saleOrderItem.product.productType,
                    username: saleOrderItem.saleOrder.member.username,
                    productId: saleOrderItem.productId
                };
            });

            return res.json({ saleOrders: adaptedSaleOrders });
        })
        .catch(function (error) {
            console.error(error);
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        });

}