const { PrismaClient } = require("@prisma/client");
const pdf = require('html-pdf'); 
const prisma = new PrismaClient();
const QRCode = require('qrcode');
require('dotenv').config();

const generate = async (req,res) => {
  try{
    const idPago = parseInt(req.params.id)

    const pago = await prisma.payments.findUnique({
      where:{
        id: idPago
      }, include:{
        sales:{
          include:{
            clients:true,
            lots:{
              include:{
                apples:true
              }
            }
          }
        }, transactions:true
      }
    })

    if(pago === null )res.status(404).send({message:'El pago no existe'})

    const timestamp = parseInt(pago.payment_date);
    const date = new Date(timestamp);

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getUTCFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    const abonado = pago.paid_amount.toLocaleString('en-us')
    const total = pago.amount.toLocaleString('en-us')
    const remanente = (pago.amount - pago.paid_amount).toLocaleString('en-us')

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
    <h4>COMPROBANTE DE PAGO</h4>
    <h5>Pago realizado el día ${formattedDate}</h5>
    <div style="margin-top:20px; padding:10px">
      <p style="font-size:15px; padding:0; margin:1px">Pago realizado por el lote no. ${pago.sales.lots.lot_number}</p>
      <p style="font-size:15px; padding:0; margin:1px">Abonado:         <strong>${abonado}</strong></p>
      <p style="font-size:15px; padding:0; margin:1px">Total del pago:  <strong>${total}</strong></p>
      <p style="font-size:15px; padding:0; margin:1px">Cantidad debida: <strong>${remanente}</strong></p>
      <p style="font-size:15px; padding:0; margin:1px; margin-top:20px">Usuario: <strong>${pago.sales.clients.name}</strong></p>
    </div>

    `;

    pdf.create(content).toFile(`./public/pdf/${dateName.toString()}.pdf`, function(err, result) {
      if (err){
        res.status(500).send({message:'Error al generar el pdf'})
      } else {
        res.status(200).send({message:'Exito', result: {qrURL: qrDirection}})
      }
    });
  } catch (error) {
    res.status(500).send({message:'Error al generar el pdf'})
  }
    
}

module.exports.PdfController = {generate}