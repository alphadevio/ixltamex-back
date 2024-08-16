const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetch = async (req,res) =>{
  const { skip, message, id_user, date_ini, date_end} = req.query

  let where = {}

  if(message) {
    where.content = {contains:message,}
  }

  if(id_user) {
    where.sent_to = parseInt(id_user)
  }

  if (date_ini || date_end) {
    where.sent_at = {};
    if (date_ini) {
      where.sent_at.gte = new Date(date_ini);
    }
    if (date_end) {
      where.sent_at.lte = new Date(date_end);
    }
  }

  const result = await prisma.sms_log.findMany({
    where,
    include:{user:true},
    skip: parseInt(skip) || 0,
    take:10
  })

  if (result.length === 0) {
      return res.status(200).send({result:[], message:"Empty", count:0})
  }

  const count = await prisma.sms_log.count({where})

  for(log in result) {
    delete result[log].user.password
  }

  return res.status(200).send({result, count})
}

module.exports.SmsLogsController = { fetch }