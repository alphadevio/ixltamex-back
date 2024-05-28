const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetch = async (req,res) =>{
  let id_client = parseInt(req.query.id_client)
  let id_lot = parseInt(req.query.id_lot)
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }

  if(!id_lot){
    id_lot = 0
  }

  if(!id_client){
    id_client = 0
  }

  if(id_client === 0){
    const result = await prisma.transactions.findMany({
      skip:offset,
      take:10,
      include: {
        payments:{
          include:{
            sales:{
              include:{
                clients:true,
                lots:{
                  include:{
                    apples:true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        payments: {
          is: {
            sales: {
              is: {
                lots: {
                  is: {
                    id: id_lot 
                  }
                }
              }
            }
          }
        }
      }
    })

    if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
    }

    const count = await prisma.transactions.count()
    return res.status(200).send({result, count})
  } else if( id_lot === 0 ) {
    const result = await prisma.transactions.findMany({
      skip:offset,
      take:10,
      include: {
        payments:{
          include:{
            sales:{
              include:{
                clients:true,
                lots:{
                  include:{
                    apples:true
                  }
                }
              }
            }
          }
        }
      },
      where: {
        payments: {
          sales:{
            id_client:id_client
          }
        }
      }
    })

    if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
    }

    const count = await prisma.transactions.count()
    return res.status(200).send({result, count})
  } else {
    return res.status(403).send({message:'Specify either id_lot or id_user'})
  }

  
}

module.exports.AccountState = {fetch}