const { PrismaClient } = require("@prisma/client");
const { Lot } = require("../models/Lot");
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const save = async (req,res) =>{
    const payload = req.body
    const lot = new Lot(payload);

    if(req.files && req.files['image'] && req.files['image'][0]){
        lot.image = req.files['image'][0].filename;
    }

    try {
        const existing_lot_numbers = await prisma.lots.findMany({
            select:{
                lot_number:true
            },
            where:{
                deleted:{
                    not:1
                },
                id_apple:lot.id_apple
            }
        })

        const lot_number_exists = existing_lot_numbers.some(existingLot => existingLot.lot_number === lot.lot_number);

        if (lot_number_exists) {
            return res.status(405).send({message:'Lot number already registered'})
        }
        
        delete lot.id
        const new_lot = await prisma.lots.create({data:lot})

        return res.status(201).send({message:"Lot created succesfully",result:new_lot})
    } catch (error) {
        console.log(error);
        return res.status(500).send({error:error.message})
    }

}

const fetch = async (req, res) => {
    const limit = parseInt(req.query.limit);
    const id_client = req.query.id_client;
    const search = req.query.where;
    let offset = parseInt(req.query.offset);
    const id = req.body.id;
    let take = 999999;

    if (limit) {
        take = limit;
    }

    let where = {
        deleted: {
            not: 1
        }
    };

    if (!offset) {
        offset = 0;
    }

    if (id) {
        where.id = id;
    }

    if (id_client) {
        where.sales = {
            some: {
                id_client: parseInt(id_client),
                deleted: {
                    not: 1
                }
            }
        };
    }

    if (search) {
        where.lot_number = {
            contains: search,
        };
    }

    console.log(where);

    try {
        const result = await prisma.lots.findMany({
            include: {
                sales: {
                    include: {
                        clients: true,
                        payments: true
                    },
                    where: {
                        deleted: {
                            not: 1
                        }
                    }
                },
                apples: {
                    include: {
                        developments: true
                    }
                }
            },
            skip: offset,
            take: take,
            where: where
        });

        if (result.length === 0) {
            return res.status(200).send({ result: [], message: "Empty", count: 0 });
        }

        const count = await prisma.lots.count({
            where: {
                deleted: {
                    not: 1
                }
            }
        });

        result.forEach(lot => {
            lot.image = `${process.env.API_URL}/img/${lot.image}`;
        });

        return res.status(200).send({ result, count });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: error.message });
    }
};
//
const update = async (req,res) =>{
    let payload = req.body;
    const lot = new Lot(payload);
    let data = {};

    const existing_lot = await prisma.lots.findFirst({
        where:{
            id: lot.id
        }
    })

    const existing_lot_numbers = await prisma.lots.findMany({
        select:{
            lot_number:true,
        },
        where:{
            deleted:{
                not:1
            },
            id_apple:lot.id_apple
        }
    })
  
    if (lot.id_apple !== undefined && lot.id_apple !== null) {
      data.id_apple = lot.id_apple;
    }

    if (lot.lot_number !== undefined && lot.lot_number !== null) {

        const lot_number_exists = existing_lot_numbers.some(existingLot => existingLot.lot_number === lot.lot_number);

        if (lot_number_exists) {
            return res.status(400).send({error:"El numero de lote ingresado ya existe"})
        }

        data.lot_number = lot.lot_number;
    }

    if (lot.area !== undefined && lot.area !== null && !isNaN(lot.area)) {
        console.log(lot.area)
        data.area = lot.area;
    }

    if (lot.top_width !== undefined && lot.top_width !== null && !isNaN(lot.top_width)) {
        data.top_width = lot.top_width;
    }

    if (lot.bottom_width !== undefined && lot.bottom_width !== null && !isNaN(lot.bottom_width)) {
        data.bottom_width = lot.bottom_width;
    }

    if (lot.right_length !== undefined && lot.right_length !== null && !isNaN(lot.right_length)) {
        data.right_length = lot.right_length;
    }

    if (lot.left_length !== undefined && lot.left_length !== null && !isNaN(lot.left_length)) {
        data.left_length = lot.left_length;
    }

    let newImageFile = null

    if(req.files && req.files['image'] && req.files['image'][0]) {
        data.image = req.files['image'][0].filename;
        newImageFile = data.image
    }

    const updated_lot = await prisma.lots.update({
        where: {
          id: lot.id,
        },
        data: data,
    });

    if(newImageFile && existing_lot.image) {
        const oldImagePath = path.join(__dirname, '../../public/images/', existing_lot.image)
        fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error(`Failed to delete old image: ${err.message}`);
            }
        });
    }
    
    return res.status(200).send({ message: "Lot updated succesfully", result:updated_lot});

}

const destroy = async (req,res) =>{
    let lot_id = req.body.id;

    const deleted_lot = await prisma.lots.findFirst({
        where: {
            id: lot_id,
        }
    })

    await prisma.assets_users.updateMany({
        where:{
            id_lot: lot_id
        }, data:{
            id_lot: null
        }
    })
  
    await prisma.lots.updateMany({
      where: {
        id: lot_id,
      },
      data: {
        deleted: 1,
      },
    });
    
    if(deleted_lot.image){
        
        const oldImagePath = path.join(__dirname, '../../public/images/', deleted_lot.image)
        fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error(`Failed to delete old image: ${err.message}`);
            }
        });
    }
  
    return res.status(200).send({ message: "Lot deleted succesfully" });
};


module.exports.LotController = {save,fetch,update,destroy}