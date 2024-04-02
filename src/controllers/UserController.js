const { PrismaClient } = require("@prisma/client");
const { User } = require("../models/User");
const prisma = new PrismaClient();
  
const save = async (req, res) => {
    try {
      let payload = req.body;
      const user = new User(payload);
  
      const new_user = await prisma.users.create({
        data: user
        ,
      });
  
      return res.status(200).send({ message: "Usuario agregado con éxito", result: new_user });
  
    } catch (error) {
        console.log(error);
      return res.status(500).send({ message: "Error interno del servidor", error: error.message });
    }
  }
  
  
  //(where, orderby, limit, offset)
  const fetch = async (req, res) => {
    let result;
    let where = {
        deleted: {
            not: 1
        }
    };

    try {
        result = await prisma.users.findMany({
            where
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }

    return res.status(200).send({ result });
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
    const user = new User(payload);
    let data = {};
  
    if (user.name !== undefined && user.name !== null) {
      data.name = user.name;
    }

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
        data.password = user.password;
    }

    if (user.profile_id !== undefined && user.profile_id !== null) {
        data.profile_id = user.profile_id;
    }


    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: data,
    });
  
    return res.status(200).send({ message: "Usuario modificado exitosamente" });
  };
  
  module.exports.UserController = {
    save,
    fetch,
    update,
    destroy
  };
  