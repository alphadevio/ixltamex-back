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

    const id = req.body.id
    let where = {
        deleted:{
            not:1
        }
    }

    if (id) {
        where.id = id
    }

    const result = await prisma.apples.findMany({where,include:{lots:true}})

    if (result.length === 0) {
        return res.status(404).send({message:"Empty"})
    }

    return res.status(200).send({result})
}

const update = async (req,res) =>{

    let payload = req.body;
    const apple = new Apple(payload);
    let data = {};
  
    if (apple.name !== undefined && apple.name !== null) {
      data.name = apple.name;
    }

    if (apple.id_development !== undefined && apple.id_development !== null) {
        data.id_development = apple.id_development;
    }

    const updated_apple = await prisma.apples.update({
        where: {
          id: apple.id,
        },
        data: data,
      });
    
    return res.status(200).send({ message: "Apple updated succesfully", result:updated_apple});

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