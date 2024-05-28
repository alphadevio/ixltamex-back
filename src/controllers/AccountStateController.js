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
    const result = await prisma.lots.findMany({
      where:{
        id: id_lot
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions:true
              }
            }, clients:true
          }
        }, apples: true
      }
    })

    if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
    }

    const count = await prisma.transactions.count()
    return res.status(200).send({result, count})
  } else if( id_lot === 0 ) {
    const result = await prisma.lots.findMany({
      where:{
        sales:{
          clients:{
            id:id_client
          }
        }
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions:true
              }
            }, clients:true
          }
        }, apples: true
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

const pdfmake = async (req, res) => {
  let id_client = parseInt(req.query.id_client)
  let id_lot = parseInt(req.query.id_lot)

  if(!id_lot){
    id_lot = 0
  }

  if(!id_client){
    id_client = 0
  }

  let result = []

  try{
    if(id_client === 0){
      result = await prisma.lots.findMany({
        where:{
          id: id_lot
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions:true
                }
              }, clients:true
            }
          }, apples: true
        }
      })
    } else if( id_lot === 0 ) {
      result = await prisma.lots.findMany({
        where:{
          sales:{
            clients:{
              id:id_client
            }
          }
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions:true
                }
              }, clients:true
            }
          }, apples: true
        }
      })
    } else {
      return res.status(403).send({message:'Specify either id_lot or id_user'})
    }

    return res.status(200).send({message:'Account state fetched successfully',result})
  } catch (error) {
    return res.status(500).send({message:'Internal server error', error:error.message})
  }
  
}

module.exports.AccountState = {fetch, pdfmake}