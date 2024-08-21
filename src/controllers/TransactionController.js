const { PrismaClient } = require("@prisma/client");
const db = require("../database/knex");
const prisma = new PrismaClient();

const fetch = async (req, res) => {
    const id_lot = req.query.id_lot;
    const id_client = req.query.id_cliente;
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit)
    const searchTerm = req.query.where;
    const date = req.query.date;

    let take = 999999
    if(limit) {
        take = limit
    }

    let baseQuery = db('transactions')
        .select(
            'transactions.id',
            'transactions.amount',
            'transactions.created_at',
            'transactions.refunded',
            'transactions.id_payment',
            'transactions.payment_type',
            'payments.id as id_payment',
            'payments.amount as amount_payment',
            'payments.payment_date',
            'payments.paid as paid_payments',
            'payments.paid_amount as paid_amount_payments',
            'payments.number as paid_number',
            'sales.price as price_sales',
            'sales.paid as paid_sales',
            'sales.payment_day as payment_day_sales',
            'sales.payment_weekday as payment_weekday_sales',
            'sales.frequency_type as frequency_type_sales',
            'sales.frequency_amount as frequency_amount_sales',
            'sales.first_payment as first_payment_sales',
            'clients.name as name_clients',
            'clients.phone_number as phone_number_clients',
            'clients.id_file_name as id_file_name_clients',
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
            'apples.name as name_apples',
            'apples.id_development as id_development_apples',
            'apples.id as id_apples',
            'developments.name as name_developments',
            'developments.location as location_developments',
            'developments.lots as lots_developments',
            'developments.id as id_developments',
        )
        .leftJoin('payments', 'transactions.id_payment', 'payments.id')
        .leftJoin('sales', 'payments.id_sale', 'sales.id')
        .leftJoin('clients', 'sales.id_client', 'clients.id')
        .leftJoin('lots', 'sales.id_lot', 'lots.id')
        .leftJoin('apples', 'lots.id_apple', 'apples.id')
        .leftJoin('developments', 'apples.id_development', 'developments.id')
        .orderBy('transactions.created_at','desc')

    if (id_lot) {
        baseQuery = baseQuery.where('lots.id', parseInt(id_lot));
    }

    if (id_client) {
        baseQuery = baseQuery.where('sales.id_client', parseInt(id_client));
    }

    if (date) {
        const fecha = new Date(date)
        fecha.setDate(fecha.getDate() + 1)
        baseQuery = baseQuery.where('transactions.created_at', '>=', new Date(date));
        baseQuery = baseQuery.where('transactions.created_at', '<=', fecha);
    }

    baseQuery = baseQuery.where('transactions.deleted', 0);

    if (searchTerm) {
        baseQuery = baseQuery.andWhere(builder => {
            builder
                .orWhere('transactions.id', 'like', `%${searchTerm}%`)
                .orWhere('transactions.amount', 'like', `%${searchTerm}%`)
                .orWhere('lots.lot_number', 'like', `%${searchTerm}%`)
                .orWhere('apples.name', 'like', `%${searchTerm}%`)
                .orWhere('developments.name', 'like', `%${searchTerm}%`)
                .orWhere('clients.name', 'like', `%${searchTerm}%`);
        });
    }

    // Clonar la consulta base para el conteo total
    let countQuery = baseQuery.clone().count('* as count');

    if (offset) {
        baseQuery = baseQuery.offset(offset);
    }

    baseQuery = baseQuery.limit(take);

    try {
        const [result, countResult] = await Promise.all([
            baseQuery,
            countQuery
        ]);

        const count = countResult[0].count;

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

        if(refunded_transaction.id_payment !== null) {
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
        } else {
            const modified_payments = await prisma.payments.findMany({
                where:{
                    id_transaction: refunded_transaction.id
                }
            })

            const modified_sale = await prisma.sales.findUnique({
                where: {
                    id: parseInt(modified_payments[0].id_sale)
                }
            });

            const updated_sale_paid = parseFloat(modified_sale.paid) - parseFloat(refunded_transaction.amount);

            await prisma.payments.updateMany({
                where:{
                    id:{
                        in: modified_payments.map(payment => payment.id)
                    }
                }, data:{
                    paid_amount:0,
                    paid:0
                }
            })

            await prisma.sales.update({
                where:{
                    id:modified_sale.id
                }, data:{
                    paid: updated_sale_paid
                }
            })
        }

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

const fetchById = async(req, res) => {
    try{
        const { id_transaction } = req.params
        const transaction = await prisma.transactions.findFirst({
            where:{
                id:parseInt(id_transaction)
            }
        })

        if(!transaction){
            return res.status(404).send({message:'Transaction does not exist'})
        }

        return res.status(200).send({message:'Transaction fetched successfully', transaction})
    } catch (error) {
        return res.status(500).send({ error });
    }
}
module.exports.TransactionController = {fetch, refund, fetchById}