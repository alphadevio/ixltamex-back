const { PrismaClient } = require("@prisma/client");
const puppeteer = require('puppeteer');
const prisma = new PrismaClient();
const QRCode = require('qrcode');
require('dotenv').config();

const generate = async (req,res) => {
  try{
    const idTransaccion = parseInt(req.params.id)

    const pago = await prisma.transactions.findUnique({
      where:{
        id: idTransaccion
      }, include: {
        payments:{
          include:{
            sales:{
              include:{
                clients:true,
                lots:{
                  include:{
                    apples:{
                      include:{
                        developments:true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if(pago === null )res.status(404).send({message:'El pago no existe'})

    if (pago.payment_type === null) pago.payment_type = 'hola'

    let otro = pago.payment_type === 'otro' ? 'checked' : ''
    let cheque = pago.payment_type === 'cheque' ? 'checked' : ''
    let efectivo = pago.payment_type === 'efectivo' ? 'checked' : ''
    let transferencia = pago.payment_type === 'transferencia' ? 'checked' : ''

    const timestamp = pago.created_at.toString();
    const date = new Date(timestamp);

    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getUTCFullYear();

    const formattedDate = `${day} de ${months[month-1]} de ${year}`;

    const abonado = pago.amount.toLocaleString('en-us')
    const letra = NumeroALetras(parseFloat(pago.amount))
    let result = letra.charAt(0).toUpperCase() + letra.slice(1);

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
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: xx-large; padding: 5px;">${pago.id}</span>
      </div>
      <div>
        <span style="font-family: sans-serif; font-style: italic;">${formattedDate}</span>
      </div>
    </div>

    <div style="width: 95%; background-color: white; border-style: solid; border-color: #0f0f0f; border-width: 1px; display: flex; justify-content:center; align-items: center; padding: 10px; margin: 10px; flex-direction: column; gap: 20px;">
      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-weight: 600; font-size: x-large; flex: 2;">Recibí de </span>
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: x-large; padding: 5px; flex: 6;">${pago.payments.sales.clients.name}</span>
      </div>
      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-weight: 600; font-size: x-large; flex: 2;">La suma de </span>
        <span style="font-family: sans-serif; background-color: #FDE68A; font-weight: 600; font-size: x-large; padding: 5px; flex: 4;">$${parseFloat(abonado).toLocaleString()}</span>
        <span style="font-family: sans-serif; font-size: large; flex: 1;">Moneda</span>
        <span style="font-family: sans-serif; font-size: large; flex: 1; font-style: italic; color: red;">Pesos</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; background-color: #fff2bd; font-weight: 600; font-size: x-large; padding: 5px; flex: 4; text-align: center;">${result}</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-size: large; flex: 1; text-align: center;">Por concepto de:</span>
      </div>

      <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px; height: 140px; background-color: #fff2bd; border-top-style: solid; border-top-width: 1px; border-color: #0f0f0f; border-bottom-style: solid; border-bottom-width: 1px;">
        <div style="flex: 1; border-bottom-width: 1px; border-bottom-style: solid; border-color: #0f0f0f; width: 100%; display:flex; align-items:end">
        ${pago.payment_type === 'bulk' ? 
          `<span style="font-size: x-large;">Abono al capital del lote ${pago.payments.sales.lots.lot_number}, perteneciente al desarrollo ${pago.payments.sales.lots.apples.developments.name}, liquidando los pagos ${pago.details}.</span>`
          :
          pago.payments.number === 0 ? `
            <span style="font-size: x-large;">Enganche del lote ${pago.payments.sales.lots.lot_number}, perteneciente al desarrollo ${pago.payments.sales.lots.apples.developments.name}.</span>
           ` : `
            <span style="font-size: x-large;">Pago #${pago.payments.number} del lote ${pago.payments.sales.lots.lot_number}, perteneciente al desarrollo ${pago.payments.sales.lots.apples.developments.name}.</span>
           `
        }
         
          
        </div>
        <div style="flex: 1;"></div>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <span style="font-family: sans-serif; font-weight: 600; font-size: x-large; flex: 2;">Forma de pago: </span>
        <div style="background-color: #FDE68A; font-size: x-large; padding: 5px; flex: 6;">
          <input type="checkbox" ${efectivo}/> <span>Efectivo</span>
          <input type="checkbox" ${transferencia}/> <span>Transferencia bancaria</span>
          <input type="checkbox" ${cheque}/> <span>Cheque</span>
          <input type="checkbox" ${otro}/> <span>Otro</span>
        </div>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px;">
        <img src="${qrDirection}" alt="Qr-image" style="width:120px; height:120px; margin-top:20px;"/>
      </div>

      <div style="width: 100%; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 2px; margin-top:250px;">
        <div style="flex: 3; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <span style="font-family: sans-serif; font-size: large; padding: 5px; width: 40%; border-bottom-width: 1px; border-bottom-style: solid; border-color: #0f0f0f;"></span>
          <span style="font-family: sans-serif; font-size: large; padding: 5px; text-align: center; width: 100%;">Sello de Ixtlamex</span>
        </div>
      </div>

    </div>

    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ path: `./public/pdf/${dateName.toString()}.pdf`, format: 'A4', printBackground: true });
    await browser.close();

    res.status(200).send({ message: 'Exito', result: { pdfUrl: data } });
  } catch (error) {
    res.status(500).send({message:'Error al generar el pdf', error:error.message || error})
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


module.exports.PdfController = {generate}

