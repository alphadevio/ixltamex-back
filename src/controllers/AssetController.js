const { PrismaClient } = require("@prisma/client");
const { Asset } = require("../models/Asset");
const prisma = new PrismaClient();

const save = async (req,res) =>{
  const payload = req.body
  const asset = new Asset(payload);

  try {
    const new_asset = await prisma.assets_users.create({
      data: asset
    })

    return res.status(201).send({message:"Asset created succesfully",result:new_asset})
  } catch (error) {
    return res.status(500).send({message:"Internal server error", error:error.message})
  }

}

const fetch = async (req,res) =>{
  let offset = parseInt(req.query.offset)
  let id_client = parseInt(req.query.id_client)

  if(!offset){
    offset = 0
  }

  let where = {status:{not:2}}

  if(id_client){
    where.id_client = id_client
  }

  const result = await prisma.assets_users.findMany({
    where,
    skip:offset,
    take:10,
    include:{
      clients:true,
      lots:{
        include:{
          apples:{
            include:{
              developments:true
            }
          }
        }
      }
    }
  })

  if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
  }

  const count = await prisma.assets_users.count({where})
  return res.status(200).send({result, count})
}

const update = async (req,res) =>{
  let payload = req.body;

  const idsToUpdate = req.body.id_array
  const asset = new Asset(payload);

  let data = {};

  if (asset.description !== undefined && asset.description !== null) {
    data.description = asset.description;
  }

  if (asset.valor !== undefined && asset.valor !== null) {
    data.valor = asset.valor;
  }

  if (asset.status !== undefined && asset.status !== null) {
    data.status = asset.status;
  }

  if (asset.id_client !== undefined && asset.id_client !== null) {
    data.id_client = asset.id_client;
  }

  if (asset.id_lot !== undefined && asset.id_lot !== null) {
    data.id_lot = asset.id_lot;
  }

  let response = []

  for( id in idsToUpdate){
    const updated_asset = await prisma.assets_users.update({
      where: {
        id: parseInt(idsToUpdate[id]),
      },
      data: data,
    });

    response.push( updated_asset )
  }
  
  return res.status(200).send({ message: "Asset succesfully modified", result:response});

}

const destroy = async (req,res) =>{
    let asset_id = parseInt(req.params.id);
  
    await prisma.assets_users.updateMany({
      where: {
        id: asset_id,
      },
      data: {
        status: 2,
      },
    });
  
    return res.status(200).send({ message: "Asset deactivated succesfully" });
};

module.exports.AssetController = {save,fetch,update,destroy}