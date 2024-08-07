const { PrismaClient } = require("@prisma/client");
const { User } = require("../models/User");
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
require('dotenv').config();
const jwt = require('jsonwebtoken')
  
const save = async (req, res) => {
  const salt_rounds = 10;
  try {
    let payload = req.body;
    let raw_password = req.body.password;

    const salt = await bcrypt.genSalt(salt_rounds);
    const hashed = await bcrypt.hash(raw_password, salt);
    payload.password = hashed;
    
    const user = new User(payload);

    const repeated_email = await prisma.users.findFirst({
      where:{
        email:user.email,
        deleted:0
      }
    });
    
    if (repeated_email) {
      throw new Error(`Existe una cuenta con ese usuario`);
    }
    const new_user = await prisma.users.create({
      data: user
    });

    return res.status(200).send({ message: "Usuario agregado con éxito", result: new_user });

  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Error", error: error.message });
  }
}
  
  //(where, orderby, limit, offset)
  const fetch = async (req, res) => {
    const limit = parseInt(req.query.limit)
    const search = req.query.where

    let take = 999999
    if(limit) {
      take = limit
    }
    let result;
    let where = {
        deleted: {
            not: 1
        }
    };
    let offset = parseInt(req.query.offset)

    if(!offset){
      offset = 0
    }

    if(search) {
      where.name = {
        contains:search,
        
      }
    }

    try {
        result = await prisma.users.findMany({
            where,
            select:{
              id:true,
              name:true,
              email:true,
              phone_number:true,
              profile_id:true
            },
            skip:offset,
            take:take

        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }

    const count = await prisma.users.count({where:{deleted:{not:1}}})

    return res.status(200).send({ result, count });
};

  
  const destroy = async (req, res) => {
    let user_id = req.body.id;
  
    await prisma.users.updateMany({
      where: {
        id: user_id,
      },
      data: {
        deleted: 1,
      },
    });
  
    return res.status(200).send({ message: "Usuario exitosamente borrado" });
  };
  
  const update = async (req, res) => {
    let payload = req.body;
    let { id } = req.params
    const user = new User(payload);
    let data = {};

    if (user.name !== undefined && user.name !== null) {
      data.name = user.name;
    }

    if (user.email !== undefined && user.email !== null) {
        data.email = user.email;
    }

    if (user.phone_number !== undefined && user.phone_number !== null) {
        data.phone_number = user.phone_number;
    }

    if (user.password !== undefined && user.password !== null) {
      const salt_rounds = 10;
      const salt = await bcrypt.genSalt(salt_rounds);
      const hashed = await bcrypt.hash(user.password, salt);

      data.password = hashed;
    }

    if (user.profile_id !== undefined && user.profile_id !== null) {
        data.profile_id = user.profile_id;
    }

    console.log(data)
    await prisma.users.update({
      where: {
        id: parseInt(id),
      },
      data: data,
    });
  
    return res.status(200).send({ message: "Usuario modificado exitosamente" });
  };

  const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      let user = await prisma.users.findFirst({
        select: {
          id: true,
          email: true,
          profile_id: true,
          profiles: true,
          password: true // Include the password field in the query
        },
        where: {
          AND: [
            {
              email: email
            },
            {
              deleted: 0
            }
          ]
        }
      });
  
      if (user) {
        // Compare the hashed password from the database with the provided password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          delete user.password;

          const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '24h' });

          return res.status(200).send({ message: "Login correcto", user, token });
        } else {
          return res.status(403).send({ message: "Login incorrecto" });
        }
      } else {
        return res.status(403).send({ message: "Login incorrecto" });
      }
    } catch (error) {
      return res.status(500).send({ error: error.message, message: "Internal server error" });
    }
  };
  
  const forgot_password = (req,res) =>{
    const { password } = req.body
  }
  
  module.exports.UserController = {
    save,
    fetch,
    update,
    destroy,
    login
  };
  