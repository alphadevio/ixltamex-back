const { PrismaClient } = require("@prisma/client");
const { Sale } = require("../models/Sale");
const prisma = new PrismaClient();

const save = async (req, res) => {
  try {
    const payload = req.body;
    const sale = new Sale(payload);

    new_sale = await prisma.sales.create({
      data: sale,
    });

    return res.status(201).send({new_sale,message:"Sale created"})
    
  } catch (error) {
    console.log(error);
    if (error.code === 'P2002' && error.meta.target === 'id_lot') {

        return res.status(400).json({ error: "Duplicate entry for lot ID detected" });
    }

    return res.status(500).send({error:error.message})
  }
};

module.exports.SalesController = {save}
