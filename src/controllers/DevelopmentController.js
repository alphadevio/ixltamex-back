const { PrismaClient } = require("@prisma/client");
const Development = require("../models/Development");
const prisma = new PrismaClient();


const save = async (req,res) =>{
    const payload = req.body
    const development = new Development(payload);
    const socios = req.body.socios;
    const apples = req.body.apples;

    try {
        const new_development = await prisma.developments.create({data:development})

        if (socios) {
            let percentage = 0 
            socios.forEach(socio => {
                percentage += parseFloat(socio.percentage)
            });
            
            if (percentage > 100) {
                return res.status(400).send({error:"La suma de los porcentajes son mas de 100"})
            }

            const sociosData = socios.map(socio => ({
                development_id: new_development.id,
                user_id: socio.user_id,
                percentage: socio.percentage
            }));

            // Assuming 'prisma' is your Prisma client instance
            await prisma.percentages.createMany({
                data: sociosData
            });
        }

        if (apples) {
          for (const apple of apples) {
              const new_apple = await prisma.apples.create({
                  data: {
                      name: apple.name,
                      id_development: new_development.id
                  }
              });
      
              if (apple.lots) {
                  const lots_data = await apple.lots.map(lot => ({
                      id_apple: new_apple.id,
                      lot_number: lot.lot_number, // Corrected property name
                      area: lot.area,
                      top_width: lot.top_width,
                      bottom_width: lot.bottom_width,
                      right_length: lot.right_length,
                      left_length: lot.left_length
                  }));
      
                  await prisma.lots.createMany({
                      data: lots_data
                  });
              }
          }
      }
  
        return res.status(201).send({message:"Development created succesfully",result:new_development})
    } catch (error) {
        console.log(error);
        return res.status(500).send({message:"Internal server error",error:error.message})
    }

}

const fetch = async (req,res) =>{

  const id = parseInt(req.query.id);
  const id_apple = parseInt(req.query.id_apple);
  const sold = parseInt(req.query.sold); 
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }

  if (sold > 1 || sold < 0){
    return res.status(404).send({message:"The sold parameter can't be greater than 1 or less than 0"})
  }


  let where = {
    deleted: {
      not: 1,
    },
  };

  const where_apples = {
    deleted: {
      not: 1,
    },
  };

  const where_lots = { 
      deleted: 0
  }

  if (id) {
    where.id = id;
  }

  if (id_apple) {
    where_apples.id = id_apple;
  }

  if (sold > -1){
    where_lots.sold = sold;
  }

    const result = await prisma.developments.findMany({
      where,
      select: {
        id: true,
        name: true,
        apples: true,
        lots: true,
        location: true,
        percentages: {
          select: {
            id: true,
            percentage: true,
            user_id: true,
            users: {
              select: { name: true },
            },
          },
        },
        apples: {
          where: where_apples,
          include: {
            lots: {
              where: where_lots,
            },
          },
        },
      },
      skip:offset,
      take:10
    });

    if (result.length === 0) {
        return res.status(404).send({message:"Empty"})
    }

    return res.status(200).send({result})
}

const update = async (req,res) =>{
    let payload = req.body;
    const development = new Development(payload);
    const percentages = req.body.socios
    let data = {};
  
    if (development.name !== undefined && development.name !== null) {
      data.name = development.name;
    }

    if (development.location !== undefined && development.location !== null) {
        data.location = development.location;
    }

    if (development.apples !== undefined && development.apples !== null) {
        data.apples = development.apples;
    }

    if (development.lots !== undefined && development.lots !== null) {
        data.lots = development.lots;
    }

    if (percentages) {
      await Promise.all(percentages.map(async (percentage) => {
        await prisma.percentages.updateMany({
          data: {
            percentage: percentage.percentage
          },
          where: {
            AND: [
              { development_id: development.id },
              { user_id: percentage.user_id }
            ]
          }
        });
      }));
    }

    const updated_development = await prisma.developments.update({
        where: {
          id: development.id,
        },
        data: data,
      });
    
    return res.status(200).send({ message: "Desarollo modificado exitosamente", result:updated_development});

}

const destroy = async (req,res) =>{
  let development_id = req.body.id;

  await prisma.developments.updateMany({
    where: {
      id: development_id,
    },
    data: {
      deleted: 1,
    },
  });
  
  const apples = await prisma.apples.findMany({
    select: {
      id: true,
    },
    where: {
      deleted: {
        not: 1,
      },
      id_development: development_id,
    },
  });
  
  const apple_ids = apples.map(apple => apple.id);
  
  await prisma.apples.updateMany({
    where: {
      id_development: development_id,
    },
    data: {
      deleted: 1,
    },
  });
  
  await prisma.lots.updateMany({
    where: {
      id_apple: {
        in: apple_ids,
      },
    },
    data: {
      deleted: 1,
    },
  });
    
  return res.status(200).send({ message: "Desarollo exitosamente borrado" });
};

module.exports.DevelopmentController = {save,fetch,update,destroy}