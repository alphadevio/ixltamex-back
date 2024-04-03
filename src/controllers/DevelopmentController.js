const { PrismaClient } = require("@prisma/client");
const Development = require("../models/Development");
const prisma = new PrismaClient();


const save = async (req,res) =>{
    const payload = req.body
    const development = new Development(payload);
    const socios = req.body.socios;

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

        return res.status(201).send({message:"Development created succesfully",result:new_development})
    } catch (error) {
        return res.status(500).send({message:"Internal server error",error:error.message})
    }

}

const fetch = async (req,res) =>{

    let where = {
        deleted:{
            not:1
        }
    }
    const result = await prisma.developments.findMany({where})

    if (result.length === 0) {
        return res.status(404).send({message:"Empty"})
    }

    return res.status(200).send({result})
}

const update = async (req,res) =>{
    let payload = req.body;
    const development = new Development(payload);
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
  
    return res.status(200).send({ message: "Desarollo exitosamente borrado" });
};

module.exports.DevelopmentController = {save,fetch,update,destroy}