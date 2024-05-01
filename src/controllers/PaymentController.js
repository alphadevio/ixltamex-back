const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pay = async (req, res) => {
    try {
        const id_payment = req.body.id_payment;
        const paid_amount = parseFloat(req.body.paid_amount);

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

module.exports.PaymentController = { pay }




