const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pay = async (req, res) => {
    try {
        const { id_payment } = req.body;

        const new_payment = await prisma.payments.update({
            data: {
                paid: 1
            },
            where: {
                id: id_payment
            }
        });

        const amount_paid = new_payment.amount;
        const id_sale = new_payment.id_sale;

        const sale = await prisma.sales.findUnique({
            where: {
                id: id_sale
            }
        });

        const new_amount = parseFloat(sale.paid + amount_paid);

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




