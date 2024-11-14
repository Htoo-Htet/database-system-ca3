const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { EMPTY_RESULT_ERROR } = require('../errors');

module.exports.retrieveAll = async function retrieveAll(memberId, filters) {
    const saleOrders = await prisma.saleOrderItem.findMany({
        where: {
            saleOrder: {
                ...(memberId ? { memberId } : {}),
                member: {
                    username: filters.username
                    ? { contains: filters.username, mode: 'insensitive' }
                    : undefined,
                    dob: {
                        gte: filters.minDob || undefined,
                        lte: filters.maxDob || undefined,
                    },
                },
                status: filters.status && filters.status.length ? { in: filters.status.split(',') } : undefined,
                orderDatetime: {
                    gte: filters.minOrderDatetime || undefined,
                    lte: filters.maxOrderDatetime || undefined,
                },
            },
            product: {
                description: filters.searchProductDescription
                    ? { contains: filters.searchProductDescription, mode: 'insensitive' }
                    : undefined,
                unitPrice: {
                    gte: filters.minUnitPrice || undefined,
                    lte: filters.maxUnitPrice || undefined,
                },
            },
            quantity: {
                gte: filters.minQuantity || undefined,
                lte: filters.maxQuantity || undefined,
            },
        },
        orderBy: {
            saleOrder: {
                orderDatetime: filters.sortOrder || undefined,
            },
        },
        include: {
            saleOrder: {
                include: {
                    member: true,
                },
            },
            product: true,
        },
    });

    if (saleOrders.length === 0) {
        throw new EMPTY_RESULT_ERROR(`Sale Orders not found!`);
    }

    return saleOrders;
};