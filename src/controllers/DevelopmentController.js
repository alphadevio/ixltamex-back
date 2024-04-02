const { PrismaClient } = require("@prisma/client");
const Development = require("../models/Development");
const prisma = new PrismaClient();


const save = async (req,res) =>{
    const payload = req.body
    const development = new Development(payload);

    try {
        const new_development = await prisma.developments.create({data:development})

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