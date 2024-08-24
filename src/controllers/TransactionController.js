const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetch = async (req, res) => {
    try {
        const { date, limit, offset, id_client, id_lot } = req.query
        const searchTerm = req.query.where

        const where = {deleted: 0}

        if(date){
            where.created_at = {
                gte: new Date(date),
                lt: (() => {
                    const fecha = new Date(date);
                    fecha.setDate(fecha.getDate() + 1);
                    return fecha;
                })()
            }
        }

        if(id_lot || id_client) {
            where.paymentTransactions = {
                some:{
                    payment:{
                        sales:{}
                    }
                }
            }
        }

        let skip = 0
        if(offset){
            skip = parseInt(offset)
        }

        if(id_lot) {
            where.paymentTransactions.some.payment.sales.id_lot = parseInt(id_lot)
        }

        if(id_client){
            where.paymentTransactions.some.payment.sales.id_client = parseInt(id_client)
        }

        if (searchTerm) {
            const orConditions = [];
        
            // Verificación para el campo `id`
            if (!isNaN(parseInt(searchTerm))) {
                orConditions.push({ id: { equals: parseInt(searchTerm) } });
            }
        
            // Verificación para el campo `amount`
            if (!isNaN(parseFloat(searchTerm))) {
                orConditions.push({ amount: { equals: parseFloat(searchTerm) } });
            }
        
            // Condiciones para los campos de texto
            orConditions.push(
                { paymentTransactions: { some: { payment: { sales: { lots: { lot_number: { contains: searchTerm } } } } } } },
                { paymentTransactions: { some: { payment: { sales: { lots: { apples: { name: { contains: searchTerm } } } } } } } },
                { paymentTransactions: { some: { payment: { sales: { lots: { apples: { developments: { name: { contains: searchTerm } } } } } } } } },
                { paymentTransactions: { some: { payment: { sales: { clients: { name: { contains: searchTerm } } } } } } }
            );
        
            where.OR = orConditions;
        }
        

        let take = 999999
        if(limit) {
            take = parseInt(limit)
        }

        const transactions = await prisma.transactions.findMany({
            include:{
                paymentTransactions:{
                    include:{
                        payment:{
                            include:{
                                sales:{
                                    include:{
                                        clients:true,
                                        lots:{
                                            include:{
                                                apples:{
                                                    include:{
                                                        developments:true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }, take: take,
            where, 
            orderBy:{
                created_at:'desc'
            }, skip
        })

        const count = await prisma.transactions.findMany({
            include:{
                paymentTransactions:{
                    include:{
                        payment:{
                            include:{
                                sales:{
                                    include:{
                                        clients:true,
                                        lots:{
                                            include:{
                                                apples:{
                                                    include:{
                                                        developments:true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }, 
            where, 
            orderBy:{
                created_at:'desc'
            }, skip
        })

        res.status(200).send({ message:'Successfully retrieved transactions', transactions, count:count.length });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while fetching transactions', error: error.message });
    }
};

const refund = async (req, res) => {
    const ID = req.params.id;
    try {
        const refunded_transaction = await prisma.transactions.findUnique({
            where: {
                id: parseInt(ID)
            }, include:{paymentTransactions:{include:{transaction:true}}}
        });

        const payments_ids = refunded_transaction.paymentTransactions.map(payTrac => payTrac.id_payment)

        const modified_payments = await prisma.payments.findMany({
            where:{
                id:{in:payments_ids}
            }
        })

        const modified_sale = await prisma.sales.findUnique({
            where: {
                id: parseInt(modified_payments[0].id_sale)
            }
        });

        let refunded_money = refunded_transaction.amount
        for(const modified_payment of modified_payments){
            let updated_payment_amount = parseFloat(modified_payment.paid_amount) - parseFloat(refunded_money);
            if( updated_payment_amount < 0 ) updated_payment_amount = 0
            refunded_money -= parseFloat(modified_payment.paid_amount)
            if( refunded_money < 0 ) refunded_money = 0
            
            // Update payment and sale with modified amounts
            await prisma.payments.update({
                where: {
                    id: parseInt(modified_payment.id)
                },
                data: {
                    paid_amount: updated_payment_amount,
                    paid: 0
                }
            });
        }

        const updated_sale_paid = parseFloat(modified_sale.paid) - parseFloat(refunded_transaction.amount);
        await prisma.sales.update({
            where: {
                id: parseInt(modified_payments[0].id_sale)
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
        return res.status(500).send({ message:'Internal server error', error:error.message });
    }
};

module.exports.TransactionController = {fetch, refund }