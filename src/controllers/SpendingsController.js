const { PrismaClient } = require("@prisma/client");
const { Spendings } = require("../models/Spendings");
const prisma = new PrismaClient();
require('dotenv').config();
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const LabsMobileClient = require("labsmobile-sms/src/LabsMobileClient");
const LabsMobileModelTextMessage = require("labsmobile-sms/src/LabsMobileModelTextMessage");
const ParametersException = require("labsmobile-sms/src/Exception/ParametersException");
const RestException = require("labsmobile-sms/src/Exception/RestException");

const save = async (req,res) =>{
  const payload = req.body
  const spending = new Spendings(payload);

  try {
    const new_spending = await prisma.spendings.create({data:spending})

    return res.status(201).send({message:"Spending registered succesfully",result:new_spending})
  } catch (error) {
    console.log(error);
    return res.status(500).send({error:error.message})
  }
}

const fetch = async (req,res) =>{
  const { id_user } = req.query
  const search = req.query.where
  let offset = parseInt(req.query.offset)

  let where = {
    deleted:{
      not:true
    }
  }

  if(search){
    where.OR = [
      { description: {
        contains: search
      }},
      { user:{
        name:{
          contains:search
        }
      }},
      { development : {
        name: {
          contains: search
        }
      }}
    ]
  }

  if(!offset){
    offset = 0
  }
  if(id_user) {
    where.id_user = parseInt(id_user)
  }

  const result = await prisma.spendings.findMany({
    where,
    include:{
      user:true,
      development:true
    },
    skip:offset,
    take:10
  })

  if (result.length === 0) {
      return res.status(200).send({result:[], message:"Empty", count:0})
  }

  const count = await prisma.spendings.count({where})
  return res.status(200).send({result, count})
}

const update = async (req,res) =>{
  const id = parseInt(req.params.id)
  const payload = req.body
  const spending = new Spendings(payload);

  let data = {}

  if (spending.id_user !== undefined && spending.id_user !== null) {
    data.id_user = spending.id_user;
  }
  if (spending.id_development !== undefined && spending.id_development !== null) {
    data.id_development = spending.id_development;
  }
  if (spending.ammount !== undefined && spending.ammount !== null) {
    data.ammount = spending.ammount;
  }
  if (spending.date !== undefined && spending.date !== null) {
    data.date = spending.date;
  }
  if (spending.description !== undefined && spending.description !== null) {
    data.description = spending.description
  }
  if (spending.authorized_by !== undefined && spending.authorized_by !== null) {
    data.authorized_by = spending.authorized_by
  }

  const updated_spending = await prisma.spendings.update({
    where: {
      id: id,
    },
    data: data,
  });
  return res.status(200).send({ message: "Spending updated succesfully", result:updated_spending});
}

const destroy = async (req,res) =>{
    const id = parseInt(req.params.id)
  
    await prisma.spendings.update({
      where: {
        id: id,
      },
      data: {
        deleted: 1,
      },
    });
  
    return res.status(200).send({ message: "Spending deleted succesfully" });
};

const sms = async (req, res) => {
  try {
    const { userId } = req.params

    const allUsers = await prisma.users.findMany({
      where:{
        deleted: 0,
        profile_id: 1,
        id:{
          not: parseInt(userId)
        }
      }
    })

    let codigo = ''

    while (true) {
      codigo = (Math.floor(100000 + Math.random() * 900000)).toString();
      const usedCode = await prisma.verification_codes.findFirst({
        where:{
          code: codigo, 
        }
      })
      console.log(usedCode)
      if(usedCode === null) {
        break
      }
    }

    const username = process.env.LABSMOBILE_USERNAME;
    const token = process.env.LABSMOBILE_TOKEN;

    const names = []

    await prisma.verification_codes.create({
      data:{
        code: codigo,
        used: 0,
        date: Date.now()
      }
    })

    for(user in allUsers){
      const message = `Se quiere realizar una operacion en ixtlamex. El codigo es: ${codigo}`;
      const phone = [allUsers[user].phone_number];

      const clientLabsMobile = new LabsMobileClient(username, token);
      const bodySms = new LabsMobileModelTextMessage(phone, message);

      //bodySms.scheduled = "2024-07-12 13:58:00";
      bodySms.long = 1;

      await clientLabsMobile.sendSms(bodySms);

      names.push(allUsers[user].name)
    }
    
    return res.status(200).send({message:'Success', names})
  } catch (error) {
    if (error instanceof ParametersException) {
      console.log(error.message);
      return res.status(500).send({message:'Fail', error: error.message})
    } else if (error instanceof RestException) {
      console.log(`Error: ${error.status} - ${error.message}`);
      return res.status(500).send({message:'Fail', error: error.message})
    } else {
      return res.status(500).send({message:'Fail', error: error.message})
    }
  }
}

const verifySMS = async (req, res) => {
  try{
    const { code } = req.params

    const verifier = await prisma.verification_codes.findFirst({
      where:{
        used:0,
        code:code
      }
    })
    
    if(!verifier) return res.status(401).send({message:'The code does not exist, or has already been used'})

    const now = Date.now()

    if(now < verifier.date + 600000) {
      await prisma.verification_codes.update({
        where:{
          id: verifier.id
        }, data: {
          used: 1
        }
      })
      return res.status(200).send({message:'Success'})
    } else {
      return res.status(400).send({message:'Fail, code was sent more than 10 minutes ago'})
    }
  } catch (error) {
    return res.status(500).send({message:'Internal server error', error: error.message})
  }
}

const generatePDF = async (req, res) => {
  try{
    const {spendingId} = req.params
    const spending = await prisma.spendings.findFirst({
      where:{
        id: parseInt(spendingId), 
        deleted: false
      }, include:{
        user: true,
        development: true
      }
    })

    const timestamp = spending.date;
    const date = new Date(parseInt(timestamp));

    console.log(date, timestamp)
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getUTCFullYear();

    const formattedDate = `${day} de ${months[month-1]} de ${year}`;

    const dateName = Date.now()
    const data = `${process.env.API_URL}/pdf/${dateName}.pdf`
    const qrDirection = `${process.env.API_URL}/qr/${dateName}.png`

    QRCode.toFile(`./public/qr/${dateName.toString()}.png`, data, (err) => {
      if (err) {
        console.error('Error al generar el código QR:', err);
      } else {
        console.log('Código QR generado y guardado como qrcode.png');
      }
    });

    const content = `
    <div style="width: 95%; background-color: white; border-style: solid; border-color: #0f0f0f; border-width: 1px; display: flex; justify-content: center;padding: 10px; margin: 10px; flex-direction: column; align-items: end;">
      <div>
        <span style="font-family: sans-serif; color: #FDE68A; font-weight: 600; font-size: xx-large;">Nº RECIBO</span>
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: xx-large; padding: 5px;">${spending.id}</span>
      </div>
      <div>
        <span style="font-family: sans-serif; font-style: italic;">${formattedDate}</span>
      </div>
    </div>

    <div style="width: 95%; background-color: white; border-style: solid; border-color: #0f0f0f; border-width: 1px; display: flex; justify-content:center; align-items: center; padding: 10px; margin: 10px; flex-direction: column; gap: 20px;">
      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-weight: 600; font-size: x-large; flex: 2;">Recibió </span>
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: x-large; padding: 5px; flex: 6;">${spending.user.name}</span>
      </div>
      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-weight: 600; font-size: x-large; flex: 2;">La suma de </span>
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: x-large; padding: 5px; flex: 4;">$${parseFloat(spending.ammount).toLocaleString()}</span>
        <span style="font-family: sans-serif; font-size: large; flex: 1;">Moneda</span>
        <span style="font-family: sans-serif; font-size: large; flex: 1; font-style: italic; color: red;">Pesos</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; background-color: #fff2bd; font-weight: 600; font-size: x-large; padding: 5px; flex: 4; text-align: center;">${NumeroALetras(parseFloat(spending.ammount))}</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-size: large; flex: 1; text-align: center;">Por concepto de:</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px; height: 140px; background-color: #fff2bd; border-top-style: solid; border-top-width: 1px; border-color: #0f0f0f; border-bottom-style: solid; border-bottom-width: 1px;">
        <div style="flex: 1; border-bottom-width: 1px; border-bottom-style: solid; border-color: #0f0f0f; width: 100%; display:flex; align-items:end">
          <span style="font-size: x-large;">${spending.description}, autorizado por ${spending.authorized_by}, relacionado al desarrollo ${spending.development.name}.</span>
        </div>
        <div style="flex: 1;"></div>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <img src="${qrDirection}" alt="Qr-image" style="width:120px; height:120px; margin-top:20px;"/>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <div style="flex: 3; display: flex; flex-direction: column;">
          <span style="font-family: sans-serif; font-size: large; padding: 5px; width: 100%; border-bottom-width: 1px; border-bottom-style: solid; border-color: #0f0f0f;">x</span>
          <span style="font-family: sans-serif; font-size: large; padding: 5px; text-align: center; width: 100%;">Firma de recibido</span>
        </div>
        <div style="flex: 2; display: flex; flex-direction: column;"></div>
        <div style="flex: 3; display: flex; flex-direction: column;">
          <span style="font-family: sans-serif; font-size: large; padding: 5px; width: 100%; border-bottom-width: 1px; border-bottom-style: solid; border-color: #0f0f0f;">x</span>
          <span style="font-family: sans-serif; font-size: large; padding: 5px; text-align: center; width: 100%;">Firma de entregado</span>
        </div>
      </div>


    </div>

    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ path: `./public/pdf/${dateName.toString()}.pdf`, format: 'A4', printBackground: true });
    await browser.close();

    return res.status(200).send({ message: 'Exito', result: { pdfUrl: data } });

  } catch (error) {
    throw error
  } 
}

function Unidades(num) {
  switch (num) {
    case 1:
      return "un";
    case 2:
      return "dos";
    case 3:
      return "tres";
    case 4:
      return "cuatro";
    case 5:
      return "cinco";
    case 6:
      return "seis";
    case 7:
      return "siete";
    case 8:
      return "ocho";
    case 9:
      return "nueve";
  }

  return "";
}

function Decenas(num) {
  decena = Math.floor(num / 10);
  unidad = num - decena * 10;

  switch (decena) {
    case 1:
      switch (unidad) {
        case 0:
          return "diez";
        case 1:
          return "once";
        case 2:
          return "doce";
        case 3:
          return "trece";
        case 4:
          return "catorce";
        case 5:
          return "quince";
        default:
          return "dieci" + Unidades(unidad);
      }
    case 2:
      switch (unidad) {
        case 0:
          return "veinte";
        default:
          return "veinti" + Unidades(unidad);
      }
    case 3:
      return DecenasY("treinta", unidad);
    case 4:
      return DecenasY("cuarenta", unidad);
    case 5:
      return DecenasY("cincuenta", unidad);
    case 6:
      return DecenasY("sesenta", unidad);
    case 7:
      return DecenasY("setenta", unidad);
    case 8:
      return DecenasY("ochenta", unidad);
    case 9:
      return DecenasY("noventa", unidad);
    case 0:
      return Unidades(unidad);
  }
} //Unidades()

function DecenasY(strSin, numUnidades) {
  if (numUnidades > 0) return strSin + " y " + Unidades(numUnidades);

  return strSin;
} //DecenasY()

function Centenas(num) {
  centenas = Math.floor(num / 100);
  decenas = num - centenas * 100;

  switch (centenas) {
    case 1:
      if (decenas > 0) return "ciento " + Decenas(decenas);
      return "cien";
    case 2:
      return "doscientos " + Decenas(decenas);
    case 3:
      return "trescientos " + Decenas(decenas);
    case 4:
      return "cuatroscientos " + Decenas(decenas);
    case 5:
      return "quinientos " + Decenas(decenas);
    case 6:
      return "seiscientos " + Decenas(decenas);
    case 7:
      return "setescientos " + Decenas(decenas);
    case 8:
      return "ochoscientos " + Decenas(decenas);
    case 9:
      return "novescientos " + Decenas(decenas);
  }

  return Decenas(decenas);
} //Centenas()

function Seccion(num, divisor, strSingular, strPlural) {
  cientos = Math.floor(num / divisor);
  resto = num - cientos * divisor;

  letras = "";

  if (cientos > 0)
    if (cientos > 1) letras = Centenas(cientos) + " " + strPlural;
    else letras = strSingular;

  if (resto > 0) letras += "";

  return letras;
} //Seccion()

function Miles(num) {
  divisor = 1000;
  cientos = Math.floor(num / divisor);
  resto = num - cientos * divisor;

  strMiles = Seccion(num, divisor, "un mil", "mil");
  strCentenas = Centenas(resto);

  if (strMiles == "") return strCentenas;

  return strMiles + " " + strCentenas;

  //return Seccion(num, divisor, "UN MIL", "MIL") + " " + Centenas(resto);
} //Miles()

function Millones(num) {
  divisor = 1000000;
  cientos = Math.floor(num / divisor);
  resto = num - cientos * divisor;

  strMillones = Seccion(num, divisor, "un millon", "millones");
  strMiles = Miles(resto);

  if (strMillones == "") return strMiles;

  return strMillones + " " + strMiles;

  //return Seccion(num, divisor, "UN MILLON", "MILLONES") + " " + Miles(resto);
} //Millones()

function NumeroALetras(num) {
  var data = {
    numero: num,
    enteros: Math.floor(num),
    centavos: Math.round(num * 100) - Math.floor(num) * 100,
    letrasCentavos: "",
    letrasMonedaPlural: "pesos",
    letrasMonedaSingular: "peso"
  };
  console.log('DATA',data)

  if (data.centavos > 0)
    data.letrasCentavos = "con " + data.centavos + " centavos";

  if (data.enteros == 0)
    return "cero " + data.letrasMonedaPlural + " " + data.letrasCentavos;
  if (data.enteros == 1)
    return (
      Millones(data.enteros) +
      " " +
      data.letrasMonedaSingular +
      " " +
      data.letrasCentavos
    );
  else
    return (
      Millones(data.enteros) +
      " " +
      data.letrasMonedaPlural +
      " " +
      data.letrasCentavos
    );
} //NumeroALetras()

module.exports.SpendingsController = {save,fetch,update,destroy, sms, generatePDF, verifySMS}