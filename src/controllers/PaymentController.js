const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pay = async (req, res) => {
    try {
        const id_payment = req.body.id_payment;
        let paid_amount = parseFloat(req.body.paid_amount);
        const original_amount = paid_amount

        const payment = await prisma.payments.findUnique({
            where:{
                id:id_payment
            }
        });

        if (parseFloat(payment.paid_amount) > 0){
            paid_amount = parseFloat(payment.paid_amount) + parseFloat(paid_amount);
        }

        const new_payment = await prisma.payments.update({
            data: {
                paid_amount: paid_amount
            },
            where: {
                id: id_payment
            }
        });

        if (parseFloat(new_payment.amount) == parseFloat(new_payment.paid)){
            await prisma.payments.update({
                data: {
                    paid: 1
                },
                where: {
                    id: id_payment
                }  
            });
        }

        const amount_paid = original_amount;
        const id_sale = new_payment.id_sale;

        const sale = await prisma.sales.findUnique({
            where: {
                id: id_sale
            }
        });

        let new_amount;
        console.log(sale);
        if (parseFloat(sale.paid) === 0) {
            new_amount = parseFloat(amount_paid);
        } else {
            new_amount = parseFloat(sale.paid) + parseFloat(amount_paid);
            console.log(new_amount);
        }

        await prisma.sales.update({
            where: {
                id: id_sale
            },
            data: {
                paid: new_amount
            }
        });

        res.status(200).json({ message: "Payment successfully processed." });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports.PaymentController = { pay }




