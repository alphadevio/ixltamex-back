const { PrismaClient } = require("@prisma/client");
const { Apple } = require("../models/Apple");
const prisma = new PrismaClient();


const save = async (req,res) =>{
    const payload = req.body
    const apple = new Apple(payload);

    try {
        const new_apple = await prisma.apples.create({data:apple})

        return res.status(201).send({message:"Apple created succesfully",result:new_apple})
    } catch (error) {
        return res.status(500).send({message:"Internal server error",error:error.message})
    }

}

const fetch = async (req,res) =>{
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }

  const id = req.body.id
  let where = {
      deleted:{
          not:1
      }
  }

  if (id) {
      where.id = id
  }

  const result = await prisma.apples.findMany({
    where,
    include:{lots:true, developments:true},
    skip:offset,
    take:10
  })

  if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
  }

  return res.status(200).send({result})
}

const update = async (req, res) => {
  try {
      let payload = req.body;
      const apple = new Apple(payload);
      const lots = req.body.lots;
      let data = {};

      if (apple.name !== undefined && apple.name !== null) {
          data.name = apple.name;
      }

      if (apple.id_development !== undefined && apple.id_development !== null) {
          data.id_development = apple.id_development;
      }

      if (lots) {
        
        const existing_lot_numbers = await prisma.lots.findMany({
            select: {
                lot_number: true
            },
            where: {
                deleted: {
                    not: 1
                },
                id_apple: apple.id
            }
        });

          await Promise.all(lots.map(async (lot) => {

            const lot_number_exists = existing_lot_numbers.some(existingLot => existingLot.lot_number === lot.lot_number);
        
            if (lot_number_exists) {
                throw new Error("El numero de lote ingresado ya existe");
            }

            
            lot_data = {}

            if (lot.id_apple !== undefined && lot.id_apple !== null) {
              lot_data.id_apple = lot.id_apple;
            }

            if (lot.lot_number !== undefined && lot.lot_number !== null) {

                lot_data.lot_number = lot.lot_number;
            }

            if (lot.area !== undefined && lot.area !== null) {
              lot_data.area = lot.area;
            }

            if (lot.top_width !== undefined && lot.top_width !== null) {
              lot_data.top_width = lot.top_width;
            }

            if (lot.bottom_width !== undefined && lot.bottom_width !== null) {
              lot_data.bottom_width = lot.bottom_width;
            }

            if (lot.right_length !== undefined && lot.right_length !== null) {
              lot_data.right_length = lot.right_length;
            }

            if (lot.left_length !== undefined && lot.left_length !== null) {
                lot_data.left_length = lot.left_length;
            }

            await prisma.lots.update({
                where: {
                    id: lot.id,
                },
                data: lot_data,
            });

          }));
      }

      const updated_apple = await prisma.apples.update({
          where: {
              id: apple.id,
          },
          data: data,
      });

      return res.status(200).send({ message: "Apple updated successfully", result: updated_apple });
  } catch (error) {
      return res.status(500).send({ error: error.message });
  }
}



const destroy = async (req,res) =>{
    let id_apple = req.body.id;
  
    await prisma.apples.updateMany({
      where: {
        id: id_apple,
      },
      data: {
        deleted: 1,
      },
    });

    await prisma.lots.updateMany({
      where:{
        id_apple:id_apple
      },
      data:{
        deleted:1
      }
    })
  
    return res.status(200).send({ message: "Apple deleted succesfully" });
};


module.exports.AppleController = {save,fetch,update,destroy}