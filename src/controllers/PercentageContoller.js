const { PrismaClient } = require("@prisma/client");
const Percentage = require("../models/Percentage");
const prisma = new PrismaClient();


const save = async (req,res) =>{
    const payload = req.body
    const percentage = new Percentage(payload);

    try {
        const new_percentage = await prisma.percentages.create({data:percentage})

        return res.status(201).send({message:"Percentage created succesfully",result:new_percentage})
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
    const result = await prisma.percentages.findMany()

    if (result.length === 0) {
        return res.status(404).send({message:"Empty"})
    }

    return res.status(200).send({result})
}

const update = async (req,res) =>{
    let payload = req.body;
    const percentage = new Percentage(payload);
    let data = {};
  
    if (percentage.user_id !== undefined && percentage.user_id !== null) {
      data.user_id = percentage.user_id;
    }

    if (percentage.development_id !== undefined && percentage.development_id !== null) {
        data.development_id = percentage.development_id;
    }

    if (percentage.percentage !== undefined && percentage.percentage !== null) {
        data.percentage = percentage.percentage;
    }

    const updated_percentage = await prisma.percentages.update({
        where: {
          id: percentage.id,
        },
        data: data,
      });
    
    return res.status(200).send({ message: "Porcentaje modificado exitosamente", result:updated_percentage});

}

const destroy = async (req,res) =>{
    let percentage_id = req.body.id;
  
    await prisma.percentages.updateMany({
      where: {
        id: percentage_id,
      },
      data: {
        deleted: 1,
      },
    });
  
    return res.status(200).send({ message: "Porcentaje exitosamente borrado" });
};

const remaining = async (req,res) =>{
    const development_id = req.query.development_id;
    const development = await prisma.percentages.findMany({
        where:{
            development_id:{
                equals:parseInt(development_id)
            },
            deleted:{
                not:1
            }
        },
        select:{
            id:true,
            percentage:true
        }
    })

    let remaining = 100;
    development.forEach(element => {
        remaining -= parseFloat(element.percentage)
    });

    return res.status(200).send({ message: "Porcentaje restante", result:remaining}); 
}
module.exports.PercentageController = {save,fetch,update,destroy,remaining}