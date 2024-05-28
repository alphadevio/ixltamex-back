const { PrismaClient } = require("@prisma/client");
const db = require("../database/knex");
const prisma = new PrismaClient();

const fetch = async (req, res) => {
    const id_lot = req.query.id_lot;
    const id_client = req.query.id_cliente;
    const offset = parseInt(req.query.offset)

    let query = db('transactions')
        .select(
            'transactions.id',
            'transactions.amount',
            'transactions.created_at',
            'transactions.refunded',
            'transactions.id_payment',
            'lots.id as lot_id',
            'lots.id_apple',
            'lots.lot_number',
            'lots.area',
            'lots.top_width',
            'lots.bottom_width',
            'lots.right_length',
            'lots.left_length',
            'lots.deleted',
            'lots.sold',
            'developments.name'

        )
        .leftJoin('payments', 'transactions.id_payment', 'payments.id')
        .leftJoin('sales', 'payments.id_sale', 'sales.id')
        .leftJoin('lots', 'sales.id_lot', 'lots.id')
        .leftJoin('apples', 'lots.id_apple', 'apples.id')
        .leftJoin('developments', 'apples.id_development', 'developments.id');

    if (id_lot) {
        query = query.where('lots.id', parseInt(id_lot));
    }

    if (id_client) {
        query = query.where('sales.id_client', parseInt(id_client));
    }

    if (offset) {
        query = query.offset(offset)
    }

    query = query.limit(10)

    try {
        const result = await query;
        const count = query.length + 1
        res.status(200).send({ result, count });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while fetching transactions' });
    }
};


const refund = async (req, res) => {
    const ID = req.params.id;
    try {
        const refunded_transaction = await prisma.transactions.findUnique({
            where: {
                id: parseInt(ID)
            }
        });

        const modified_payment = await prisma.payments.findUnique({
            where: {
                id: parseInt(refunded_transaction.id_payment)
            }
        });

        const modified_sale = await prisma.sales.findUnique({
            where: {
                id: parseInt(modified_payment.id_sale)
            }
        });

        // Subtract the refunded amount from the payment and sale amounts
        const updated_payment_amount = parseFloat(modified_payment.paid_amount) - parseFloat(refunded_transaction.amount);
        const updated_sale_paid = parseFloat(modified_sale.paid) - parseFloat(refunded_transaction.amount);

        // Update payment and sale with modified amounts
        await prisma.payments.update({
            where: {
                id: parseInt(refunded_transaction.id_payment)
            },
            data: {
                paid_amount: updated_payment_amount,
                paid: updated_payment_amount < parseFloat(modified_payment.amount) ? 0 : modified_payment.paid
            }
        });

        await prisma.sales.update({
            where: {
                id: parseInt(modified_payment.id_sale)
            },
            data: {
                paid: updated_sale_paid
            }
        });

        // Mark the transaction as refunded
       const updated_transaction = await prisma.transactions.update({
            where: {
                id: parseInt(ID)
            },
            data: {
                refunded: 1
            }
        });

        return res.status(200).send({ message: "Transaction has been refunded", updated_transaction });
    } catch (error) {
        return res.status(500).send({ error });
    }
};

module.exports.TransactionController = {fetch,refund}