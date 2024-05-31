const { PrismaClient } = require("@prisma/client");
const { Spendings } = require("../models/Spendings");
const prisma = new PrismaClient();

const save = async (req,res) =>{
  const payload = req.body
  const spending = new Spendings(payload);

  try {
    const new_spending = await prisma.spendings.create({data:spending})
    return res.status(201).send({message:"Spending registered succesfully",result:new_spending})
  } catch (error) {
    console.log(error);
    return res.status(500).send({error:error.message})
  }
}

const fetch = async (req,res) =>{
  const { id_user } = req.query

  let where = {
    deleted:{
        not:1
    }
  }
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }
  if(id_user) {
    where.id_user = parseInt(id_user)
  }

  const result = await prisma.spendings.findMany({
    where,
    include:{
      user:true,
      development:true
    },
    skip:offset,
    take:10
  })

  if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
  }

  const count = await prisma.spendings.count({where})
  return res.status(200).send({result, count})
}

const update = async (req,res) =>{
  const id = parseInt(req.params.id)
  const payload = req.body
  const spending = new Spendings(payload);

  let data = {}

  if (spending.id_user !== undefined && spending.id_user !== null) {
    data.id_user = spending.id_user;
  }
  if (spending.id_development !== undefined && spending.id_development !== null) {
    data.id_development = spending.id_development;
  }
  if (spending.ammount !== undefined && spending.ammount !== null) {
    data.ammount = spending.ammount;
  }
  if (spending.date !== undefined && spending.date !== null) {
    data.date = spending.date;
  }
  if (spending.description !== undefined && spending.description !== null) {
    data.description = spending.description
  }

  const updated_spending = await prisma.spendings.update({
    where: {
      id: id,
    },
    data: data,
  });
  return res.status(200).send({ message: "Spending updated succesfully", result:updated_spending});
}

const destroy = async (req,res) =>{
    const id = parseInt(req.params.id)
  
    await prisma.spendings.update({
      where: {
        id: id,
      },
      data: {
        deleted: 1,
      },
    });
  
    return res.status(200).send({ message: "Spending deleted succesfully" });
};


module.exports.SpendingsController = {save,fetch,update,destroy}