const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getCut = async (req,res) =>{
  const { id_development, month, year } = req.body

  if (!id_development) {
    return res.status(403).send({ message: 'Specify id_development' })
  }
  
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  prisma.transactions.findMany({
    where: {
      id_development: id_development,
      created_at: {
        gte: firstDay,
        lte: lastDay
      }
    }
  })

  // try{
  //   const payments = await prisma.sales.findMany({
  //     where:{
  //       deleted:{
  //         not:1
  //       },
  //       lots:{
  //         apples:{
  //           developments:{
  //             id:id_development
  //           }
  //         }
  //       }
  //     }
  //   })
  
  //   if (payments.length === 0) {
  //     return res.status(403).send({message:"Development has no earnings"})
  //   }

  //   let totalDevelopmentEarned = 0
  //   let totalDevelopment = 0

  //   for(i in payments) {
  //     totalDevelopment += parseFloat(payments[i].price)
  //     totalDevelopmentEarned += parseFloat(payments[i].paid)
  //   }

  //   const cuts = await prisma.cuts.findMany({
  //     where:{
  //       id_development: id_development,
  //       deleted:{
  //         not:1
  //       }
  //     }
  //   })

  //   if(cuts.length > 0) {
  //     for(j in cuts) {
  //       totalDevelopmentEarned -= cuts[j].amount
  //     }
  //   }

  //   if(totalDevelopmentEarned < 0) totalDevelopmentEarned = 0

  //   const today = Date.now()
  //   await prisma.cuts.create({
  //     data:{
  //       date_cut:today,
  //       id_development: id_development,
  //       amount: totalDevelopmentEarned
  //     }
  //   })

  //   const percentages = await prisma.percentages.findMany({
  //     where:{
  //       development_id: id_development,
  //       deleted:{
  //         not:1
  //       }
  //     }, include: {
  //       users:true
  //     }
  //   })

  //   const spendings = await prisma.spendings.findMany({
  //     where:{
  //       deleted:{
  //         not:1
  //       }, id_development:id_development
  //     }, include:{
  //       user:true
  //     }
  //   })
    
  //   return res.status(200).send({message:'Cut executed successfully', cutEarnings: totalDevelopmentEarned, totalDevelopment, percentages, spendings})
  // } catch (error){
  //   return res.status(500).send({message:'Internal server error', error:error.message})
  // }
}

module.exports.CutController = {getCut}