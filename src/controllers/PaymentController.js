const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pay = async (req, res) => {
    try {
        const id_payment = req.body.id_payment;
        const paid_amount = parseFloat(req.body.paid_amount);
        const payment_type = req.body.payment_type;

        if(payment_type !== 'efectivo' && payment_type !== 'transferencia' && payment_type !== 'cheque' && payment_type !== 'otro')
            return res.status(402).json({ error: "payment_type_error.", message: `El método de pago no es válido. Método especificado: ${payment_type}` });

        const payment = await prisma.payments.findUnique({
            where:{
                id:id_payment
            }
        });

        let new_paid_amount
        if (!paid_amount) { //case where the user doesn't specify the amount
            new_paid_amount = parseFloat(payment.amount)
        }
        else if (parseFloat(payment.paid_amount) > 0){ //case where the user specifies the amount and there's an already existing amount
            new_paid_amount = parseFloat(payment.paid_amount) + paid_amount;
        }
        else{ //case where the user specifies the amount but no existing amount and it's less that the amount to be paid
            new_paid_amount = paid_amount
        }

        const original_amount = paid_amount || parseFloat(payment.amount);


        const new_payment = await prisma.payments.update({
            data: {
                paid_amount: new_paid_amount
            },
            where: {
                id: id_payment
            }
        });

        await prisma.transactions.create({
            data:{
                amount: parseFloat(paid_amount) || parseFloat(new_paid_amount),
                id_payment: new_payment.id,
                payment_type: payment_type
            }
        })

        if (parseFloat(new_payment.paid_amount) >= parseFloat(new_payment.amount)){
            await prisma.payments.update({
                data: {
                    paid: 1
                },
                where: {
                    id: new_payment.id
                }  
            });
        }

        const id_sale = new_payment.id_sale;

        const sale = await prisma.sales.findUnique({
            where: {
                id: id_sale
            }
        });

        let new_sale_amount;
        if (parseFloat(sale.paid) === 0) {
            new_sale_amount = original_amount;
        } else {
            new_sale_amount = parseFloat(sale.paid) + original_amount;
        }

        await prisma.sales.update({
            where: {
                id: id_sale
            },
            data: {
                paid: new_sale_amount
            }
        });

        res.status(200).json({ message: "Payment successfully processed." });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const payBulk = async(req, res) => {
    try {
        const { id_payments, paid_amount, payment_type } = req.body;

        if(payment_type !== 'efectivo' && payment_type !== 'transferencia' && payment_type !== 'cheque' && payment_type !== 'otro') {
            return res.status(402).json({ error: "payment_type_error.", message: `El método de pago no es válido. Método especificado: ${payment_type}` });
        }

        let total_payed_amount = paid_amount;

        let id_sale = -1;

        for(let id of id_payments) {
            if(total_payed_amount <= 0) break;

            const old_payment = await prisma.payments.findFirst({
                where: {
                    id: id
                }
            });

            if (!old_payment) {
                continue;
            }

            id_sale = old_payment.id_sale;

            if(old_payment.paid_amount > 0) {
                const difference = old_payment.amount - old_payment.paid_amount;
                if(total_payed_amount >= difference) {
                    await prisma.payments.update({
                        where: {
                            id: old_payment.id
                        }, data: {
                            paid_amount: old_payment.amount,
                            paid: 1
                        }
                    });

                    total_payed_amount -= difference;

                    await prisma.transactions.create({
                        data: {
                            amount: parseFloat(difference),
                            id_payment: old_payment.id,
                            payment_type: payment_type
                        }
                    });
                } else {
                    await prisma.payments.update({
                        where: {
                            id: old_payment.id
                        }, data: {
                            paid_amount: old_payment.paid_amount + total_payed_amount,
                            paid: 0
                        }
                    });

                    await prisma.transactions.create({
                        data: {
                            amount: parseFloat(total_payed_amount),
                            id_payment: old_payment.id,
                            payment_type: payment_type
                        }
                    });

                    total_payed_amount = 0;
                }
            } else {
                if(total_payed_amount >= old_payment.amount) {
                    await prisma.payments.update({
                        where: {
                            id: old_payment.id
                        }, data: {
                            paid_amount: old_payment.amount,
                            paid: 1
                        }
                    });

                    total_payed_amount -= old_payment.amount;

                    await prisma.transactions.create({
                        data: {
                            amount: parseFloat(old_payment.amount),
                            id_payment: old_payment.id,
                            payment_type: payment_type
                        }
                    });
                } else {
                    await prisma.payments.update({
                        where: {
                            id: old_payment.id
                        }, data: {
                            paid_amount: total_payed_amount,
                            paid: 0
                        }
                    });

                    await prisma.transactions.create({
                        data: {
                            amount: parseFloat(total_payed_amount),
                            id_payment: old_payment.id,
                            payment_type: payment_type
                        }
                    });

                    total_payed_amount = 0;
                }
            }
        }

        if(id_sale === -1) {
            return res.status(500).send({message: 'Error finding id_sale'});
        }

        const effected_sale = await prisma.sales.findFirst({
            where: {
                id: id_sale
            }
        });

        if (effected_sale) {
            await prisma.sales.update({
                where: {
                    id: id_sale
                }, data: { 
                    paid: effected_sale.paid + paid_amount, 
                }
            });
        }

        if(total_payed_amount > 0) {
            return res.status(200).send({message: 'Success. Warning, the payment was overpaid. Be wary not to lose money.'});
        } else {
            return res.status(200).send({message: 'Success.'});
        }

    } catch (error) {
        return res.status(500).send({message: 'Internal server error', error: error.message});
    }
};


module.exports.PaymentController = { pay, payBulk }




