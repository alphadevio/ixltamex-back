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

    return res.status(201).send({ new_sale, message: "Sale created" })

  } catch (error) {
    console.log(error);
    if (error.code === 'P2002' && error.meta.target === 'id_lot') {

      return res.status(400).json({ error: "Duplicate entry for lot ID detected" });
    }

    return res.status(500).send({ error: error.message })
  }
};

const fetch = async (req, res) => {
  try {
    const result = await prisma.sales.findMany({
      include: {
        lots: true,
        clients: true,
        periods: true,
      },
      where: {
        deleted: {
          not: 1
        }
      }
    })

    return res.status(200).send({ result })
  } catch (error) {
    console.log(error)
  }
}

const update = async (req, res) => {
  try {
    let payload = req.body
    const sale = new Sale(payload)
    let data = {}

    if (sale.price !== undefined || sale.price !== null) {
      data.price = sale.price
    }

    if (sale.id_client !== undefined || sale.id_client !== null) {
      data.id_client = sale.id_client
    }

    if (sale.id_lot !== undefined || sale.id_lot !== null) {
      data.id_lot = sale.id_lot
    }

    const updatedSale = await prisma.sales.update({
      data: data,
      where: {
        id: sale.id
      }
    })

    return res.status(200).send({ message: "Venta modificada exitosamente", updatedSale });

  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
}

const destroy = async (req, res) => {
  let id_sale = req.body.id;

  await prisma.sales.updateMany({
    where: {
      id: id_sale,
    },
    data: {
      deleted: 1,
    },
  });

  return res.status(200).send({ message: "Sale deleted succesfully" });
};



module.exports.SalesController = { save, fetch, update, destroy }
