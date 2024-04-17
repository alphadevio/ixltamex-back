const { PrismaClient } = require("@prisma/client");
const { Periods } = require("../models/Periods");
const prisma = new PrismaClient();


const save = async (req, res) => {
    try {

        const payload = req.body
        const period = new Periods(payload);

        console.log(payload)

        new_period = await prisma.periods.create({
            data: period
        })

        return res.status(201).send({ new_period, message: "Period Created" })


    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
}

const fetch = async (req, res) => {
    try {

        const result = await prisma.periods.findMany()

        return res.status(200).send({ result })


    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: error.message })
    }
}

module.exports.PeriodsController = { save, fetch }
