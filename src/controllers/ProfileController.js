const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetch = async (req,res) =>{
    const result = await prisma.profiles.findMany({

    })
  
    if (result.length === 0) {
        return res.status(200).send({result:[], message:"Empty", count:0})
    }
    
    return res.status(200).send({result})
}

module.exports.ProfileController = { fetch }