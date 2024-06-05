const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require('dotenv').config();
const puppeteer = require('puppeteer');

const fetch = async (req,res) =>{
  let id_client = parseInt(req.query.id_client)
  let id_lot = parseInt(req.query.id_lot)
  let offset = parseInt(req.query.offset)

  if(!offset){
    offset = 0
  }

  if(!id_lot){
    id_lot = 0
  }

  if(!id_client){
    id_client = 0
  }

  if(id_client === 0){
    const result = await prisma.lots.findMany({
      where:{
        id: id_lot,
        deleted:{
          not:1
        },
        sales:{
          deleted:{
            not:1
          }
        }
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions:true
              }
            }, clients:true
          }, where: {
            deleted:{
              not:1
            }
          }
        }, apples: {
          include:{
            developments:true
          }
        }
      }
    })
    if (result.length === 0) {
      return res.status(200).send({result:[], message:"Empty"})
    }
    return res.status(200).send({result})
  } else if( id_lot === 0 ) {
    const result = await prisma.lots.findMany({
      where:{
        deleted:{
          not:1
        },
        sales:{
          deleted:{
            not:1
          }, id_client:id_client
        }
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions: true
              },
            }, clients: true
          }, where: {
            deleted: {
              not: 1
            },
            id_client: id_client
          }
        }, apples: {
          include:{
            developments:true
          }
        }
      }
    })

    if (result.length === 0) {
      return res.status(200).send({result:[], message:"Empty"})
    }

    return res.status(200).send({result})
  } else {
    return res.status(403).send({message:'Specify either id_lot or id_client'})
  }
}

const pdfmake = async (req, res) => {
  let id_client = parseInt(req.query.id_client)
  let id_lot = parseInt(req.query.id_lot)

  if(!id_lot){
    id_lot = 0
  }

  if(!id_client){
    id_client = 0
  }

  let result = []

  try{
    if(id_client === 0){
      result = await prisma.lots.findMany({
        where:{
          id: id_lot,
          deleted:{
            not:1
          },
          sales:{
            deleted:{
              not:1
            }
          }
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions:true
                }
              }, clients:true
            }, where: {
              deleted:{
                not:1
              }
            }
          }, apples: {
            include:{
              developments:true
            }
          }
        }
      })
    } else if( id_lot === 0 ) {
      result = await prisma.lots.findMany({
        where:{
          deleted:{
            not:1
          },
          sales:{
            deleted:{
              not:1
            }, id_client:id_client
          }
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions: true
                },
              }, clients: true
            }, where: {
              deleted: {
                not: 1
              },
              id_client: id_client
            }
          },apples: {
            include:{
              developments:true
            }
          }
        }
      })
    } else {
      return res.status(403).send({message:'Specify either id_lot or id_user'})
    }

    const user = result[0].sales.clients

    var hoy = new Date();
    var dia = hoy.getDate();
    var mes = hoy.getMonth() + 1; 
    var año = hoy.getFullYear();

    if (dia < 10) {
        dia = '0' + dia;
    }
    if (mes < 10) {
        mes = '0' + mes;
    }

    var fechaFormateada = dia + '/' + mes + '/' + año;

    // let content = `
    // <div style="width: 95%; background-color: white; display: flex; justify-content:center; align-items: center; padding: 10px; margin: 10px; flex-direction: column; gap: 20px;">
    //   <div style="display: flex; flex-direction: row; margin-bottom: 10px; width: 100%;">
    //     <span style="flex: 1; font-family:sans-serif;">${user.name}</span>
    //     <span style="flex: 1; text-align: end; font-family:sans-serif;">${fechaFormateada}</span>
    //   </div>

    let content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
        body {
          background-color: white;
          font-family: Arial, sans-serif;
          position: relative;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 50px;
          height: 100vh;
        }
        .triangle {
          position: absolute;
          width: 0px;
          height: 0px;
          background-color: transparent;

          border-width: 150px;
          border-style: solid;
          border-color: transparent;

          border-top-color: #ffbc0b;
          border-top-width: 150px;
          border-top-style: solid;

          top: 0;
          right: -150px;
          z-index: 2;
        }
        .triangle-footer {
          position: absolute;
          width: 0px;
          height: 0px;
          background-color: transparent;

          border-width: 150px;
          border-style: solid;
          border-color: transparent;

          border-bottom-color: #ffbc0b;
          border-bottom-width: 150px;
          border-bottom-style: solid;

          bottom: 0;
          left: -150px;
          z-index: 2;
        }
        .header {
          width: 100%;
          height: 80px;
          background-color: #ffdb79;
        }
        .footer {
          width: 100%;
          height: 80px;
          background-color: #ffdb79;
        }
        .titles {
          width: 80%;
          display: flex;
          flex-direction: row;
        }
        .fecha {
          flex: 1;
          text-align: left;
        }
        .ixtla {
          flex:1;
          text-align: right;
          font-weight: 800;
          color: #ffbc0b;
          font-size: 50px;
        }
        .text-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .table-head {
          background-color: #ffbc0b;
          color: white;
          font-weight: 800;
          height: 35px;
        }
        .table-body {
          border-bottom-width: 2px;
          border-bottom-style: solid;
          border-bottom-color: rgb(30, 30, 30);
          height: 35px;
        }
        .total{
          display: flex;
          flex-direction: row;
          padding: 20px;
          background-color: lightgray;
          width: 40%;
          align-items: center;
          justify-content: center;
        }
        .total-text{
          flex: 1;
          text-align: center;
          font-weight: 400;
        }
        .absolute-footer {
          width: 100%;
        }
        .absolute-header {
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="titles">
        <span class="fecha">FECHA: ${fechaFormateada}</span>
        <span class="ixtla">IXTLAMEX</span>
      </div>
      <div class="titles">
        <div class="text-container">
          <span style="font-weight:700; font-size: 16px;">ESTADO DE CUENTA</span>
          <span>${user.name}</span>
          <span style="font-size: 14px;">ID ${user.id}</span>
        </div>
    `;

    let paid = 0
    let total = 0
    for(i in result){
      if(id_client === 0) {
        content += `
        <div class="text-container">
          <span style="font-weight:700; font-size: 16px; text-align: right;">LOTE #${result[i].lot_number} ID: ${result[i].id}</span>
          <span style="text-align: right;">Desarrollo ${result[i].apples.developments.name}</span>
        </div>
        `
      } 
      content += `</div>`
      if(id_lot === 0) {
        content += `
        <div class="titles">
          <div class="text-container">
            <span style="font-weight:700; font-size: 16px;">LOTE #${result[i].lot_number} - <span>Desarrollo ${result[i].apples.developments.name}</span></span>
          </div>
        </div>
        `
      }
      // content += 
      // ` <div style="display: flex; flex-direction: row; width: 100%; margin-bottom: -10px;">
      //   <span style=" font-family:sans-serif; font-weight:600;">Lote número ${result[i].lot_number}</span>
      // </div>
      // <table style="width: 100%;">
      //   <tr>
      //     <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">ID</th>
      //     <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">Nombre</th>
      //     <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">Pagado</th>
      //   </tr>
      // `

      content += `
      <table style="width: 80%; border-collapse: collapse;">
        <tr>
          <th class="table-head">Fecha</th>
          <th class="table-head">ID</th>
          <th class="table-head">Descripción</th>
          <th class="table-head">Importe</th>
        </tr>
      `

      paid += parseFloat(result[i].sales.paid)
      total += parseFloat(result[i].sales.price)
      for(j in result[i].sales.payments){
        // content += `
        // <tr>
        //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;"></td>
        //   ${result[i].sales.payments[j].number === 0 ? `
        //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;">Pago de enganche</td>
        //   ` : `
        //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;">Pago de número ${result[i].sales.payments[j].number}</td>
        //   `}
        //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;"></td>
        // </tr>
        // `

        
        

        for(k in result[i].sales.payments[j].transactions){
          // content += `
          // <tr>
          //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">${result[i].sales.payments[j].transactions[k].id} ${result[i].sales.payments[j].transactions[k].refunded === 1 ? '(reembolsado)' : ''}</td>
          //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">Pago en ${result[i].sales.payments[j].transactions[k].payment_type}</td>
          //   <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">$${(result[i].sales.payments[j].transactions[k].amount).toLocaleString()}</td>
          // </tr>
          // `

          content += `
          <tr>
            <td class="table-body">${new Date(result[i].sales.payments[j].transactions[k].created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
            <td class="table-body">${result[i].sales.payments[j].transactions[k].id}</td>
            ${result[i].sales.payments[j].number === 0 ? `
            <td class="table-body">Importe ${result[i].sales.payments[j].transactions[k].id} ${result[i].sales.payments[j].transactions[k].refunded === 1 ? '(reembolsado) ' : ''}del enganche.</td>
            ` : `
              <td class="table-body">Importe ${result[i].sales.payments[j].transactions[k].id} ${result[i].sales.payments[j].transactions[k].refunded === 1 ? '(reembolsado) ' : ''}del pago número ${result[i].sales.payments[j].number}.</td>
            `}
            <td class="table-body">$${(result[i].sales.payments[j].transactions[k].amount).toLocaleString()}</td>
          </tr>
          `;
        }
      }
      content += `</table>`
    }

    // content += `
    // <div style="display: flex; flex-direction: row; width: 100%; margin-bottom: -10px; border-bottom-color: #0f0f0f; border-bottom-style: solid; border-bottom-width: 1px; padding-bottom: 5px;">
    //     <span style="font-family:sans-serif; font-weight:600;">Pagado: $${paid.toLocaleString()} de $${total.toLocaleString()}</span>
    // </div>
    // </div>
    // `

    content += `
    <div class="titles" style="justify-content: end;">
      <div class="total">
        <span class="total-text">TOTAL</span>
        <span class="total-text">$${total.toLocaleString()}</span>
      </div>
    </div>
    <div class="titles" style="justify-content: center; font-weight: 700;">GRACIAS POR SU PREFERENCIA</div>
  </body>
  </html>
    `
    const dateName = Date.now()
    const data = `${process.env.API_URL}/pdf/${dateName}.pdf`

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ 
      path: `./public/pdf/${dateName.toString()}.pdf`, 
      format: 'A4', 
      printBackground: true,
      displayHeaderFooter:true,
      margin: {
        top: '140px',
        bottom: '140px',
        right: '0px',
        left: '0px'
      },
      headerTemplate: `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
          .triangle {
            position: absolute;
            width: 0px;
            height: 0px;
            background-color: transparent;

            border-width: 150px;
            border-style: solid;
            border-color: transparent;

            border-top-color: #ffbc0b;
            border-top-width: 150px;
            border-top-style: solid;

            top: 0;
            right: -150px;
            z-index: 2;
          }
          .header {
            width: 100%;
            height: 80px;
            background-color: #ffdb79;
            -webkit-print-color-adjust: exact;
            top: 0;
            position: absolute;
          }
          .absolute-header {
            width: 100%;
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
          }
        </style>
      </head>
      <div class="absolute-header">
        <div class="triangle"></div>
        <div class="header"></div>
      </div>
      `,
      footerTemplate: `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
          .triangle-footer {
            position: absolute;
            width: 0px;
            height: 0px;
            background-color: transparent;

            border-width: 150px;
            border-style: solid;
            border-color: transparent;

            border-bottom-color: #ffbc0b;
            border-bottom-width: 150px;
            border-bottom-style: solid;

            bottom: 0;
            left: -150px;
            z-index: 2;
          }
          .footer {
            width: 100%;
            height: 80px;
            background-color: #ffdb79;
            -webkit-print-color-adjust: exact;
            bottom: 0;
            position: absolute;
          }
          .absolute-footer {
            width: 100%;
            background-color: #f8fafc;
          }
        </style>
      </head>
      <div class="absolute-footer">
        <div class="triangle-footer"></div>
        <div class="footer"></div>
      </div>
      `, });
    await browser.close();

    return res.status(200).send({message:'Account state fetched successfully',PDFUrl:data})
  } catch (error) {
    return res.status(500).send({message:'Internal server error', error:error.message})
  }
  
}

module.exports.AccountState = {fetch, pdfmake}