const { PrismaClient } = require("@prisma/client");
const { Client } = require("../models/Client");
const prisma = new PrismaClient();

const save = async (req,res) =>{
    const payload = req.body
    const client = new Client(payload);
    const ID_file = req.file.filename

    try {
        const new_client = await prisma.clients.create({
          data:{
            ...client,
            id_file_name:ID_file
          }}
        )

        return res.status(201).send({message:"Client created succesfully",result:new_client})
    } catch (error) {
        return res.status(500).send({message:"Internal server error",error:error.message})
    }

}

const fetch = async (req,res) =>{
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }

    let where = {deleted:{not:1}}
    const result = await prisma.clients.findMany({
      where,
      skip:offset,
      take:10
    })

    if (result.length === 0) {
        return res.status(404).send({message:"Empty"})
    }

    result.forEach(client => {
      client.url = "https://api.ixtlamex.alphadev.io/public/" + client.id_file_name
    });

    return res.status(200).send({result})
}

const update = async (req,res) =>{
    let payload = req.body;
    const client = new Client(payload);
    let ID_file
    if (req.file) {
      ID_file = req.file.filename
    }


    let data = {};
  
    if (client.name !== undefined && client.name !== null) {
      data.name = client.name;
    }

    if (client.phone_number !== undefined && client.phone_number !== null) {
        data.development_id = client.development_id;
    }

    if (ID_file) {
        data.id_file_name = ID_file;
    }

    const updated_client = await prisma.clients.update({
        where: {
          id: parseInt(client.id),
        },
        data: data,
      });
    
    return res.status(200).send({ message: "Client succesfully modified", result:updated_client});

}

const destroy = async (req,res) =>{
    let client_id = req.body.id;
  
    await prisma.clients.updateMany({
      where: {
        id: client_id,
      },
      data: {
        deleted: 1,
      },
    });
  
    return res.status(200).send({ message: "Client deleted succesfully" });
};

module.exports.ClientController = {save,fetch,update,destroy}