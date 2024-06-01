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
  const limit = parseInt(req.query.limit)
  const search = req.query.where

  let take = 999999
  if(limit) {
    take = limit
  }

  if(!offset){
    offset = 0
  }

  let where = {deleted:{not:1}}

  if(search){
    where.name = {
      contains:search,
      
    }
  }

  const result = await prisma.clients.findMany({
    where,
    skip:offset,
    take:take
  })

  if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
  }

  const count = await prisma.clients.count({where:{deleted:{not:1}}})

  result.forEach(client => {
    client.url = "https://api.ixtlamex.alphadev.io/public/" + client.id_file_name
  });

  return res.status(200).send({result, count})
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
  try{
    let client_id = req.body.id;
  
    await prisma.clients.updateMany({
      where: {
        id: client_id,
      },
      data: {
        deleted: 1,
      },
    });

    const ventasDelCliente = await prisma.sales.findMany({
      where:{
        id_client: client_id,
        deleted:{not:1}
      }
    })

    console.log('VETNAS DEL CLIENTE',ventasDelCliente)

    for(i in ventasDelCliente){
      if(ventasDelCliente[i].paid !== ventasDelCliente[i].price){
        const response = await prisma.lots.updateMany({
          data:{
            sold:0
          }, where:{
            sales:{
              id_client: client_id
            }, deleted:{not:null}
          }
        })
        console.log('RESPONSE',response)
      }
    }

    await prisma.transactions.updateMany({
      data:{
        deleted:1
      },
      where:{
        payments:{
          sales:{
            id_client:client_id
          }
        }
      }
    })

    await prisma.payments.updateMany({
      data:{
        deleted:1
      }, where: {
        sales:{
          id_client: client_id
        }
      }
    })

    await prisma.sales.updateMany({
      data:{
        deleted:1
      }, where: {
        id_client: client_id
      }
    })
  
    return res.status(200).send({ message: "Client deleted succesfully" });
  } catch ( error ) {
    return res.status(200).send({ message: "Internal server error", error:error.message });
  }
};

module.exports.ClientController = {save,fetch,update,destroy}