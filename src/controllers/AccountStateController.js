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
        sales:{
          deleted:{
            not:1
          }
        },
        deleted:{
          not:1
        }
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions:true
              }
            }, clients:true
          }
        }, apples: true
      }
    })

    if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
    }
    return res.status(200).send({result, count})
  } else if( id_lot === 0 ) {
    const result = await prisma.lots.findMany({
      where:{
        sales:{
          clients:{
            id:id_client
          },
          deleted:{
            not:1
          }
        },
        deleted:{
          not:1
        }
      }, include: {
        sales:{
          include:{
            payments:{
              include:{
                transactions:true
              }
            }, clients:true
          }
        }, apples: true
      }
    })

    if (result.length === 0) {
      return res.status(404).send({message:"Empty"})
    }

    const count = await prisma.transactions.count()
    return res.status(200).send({result, count})
  } else {
    return res.status(403).send({message:'Specify either id_lot or id_user'})
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
          sales:{
            deleted:{
              not:1
            }
          },
          deleted:{
            not:1
          }
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions:true
                }
              }, clients:true
            }
          }, apples: true
        }
      })
    } else if( id_lot === 0 ) {
      result = await prisma.lots.findMany({
        where:{
          sales:{
            clients:{
              id:id_client
            },
            deleted:{
              not:1
            }
          },
          deleted:{
            not:1
          }
        }, include: {
          sales:{
            include:{
              payments:{
                include:{
                  transactions:true
                }
              }, clients:true
            }
          }, apples: true
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

    let content = `
    <div style="width: 95%; background-color: white; display: flex; justify-content:center; align-items: center; padding: 10px; margin: 10px; flex-direction: column; gap: 20px;">
      <div style="display: flex; flex-direction: row; margin-bottom: 10px; width: 100%;">
        <span style="flex: 1; font-family:sans-serif;">${user.name}</span>
        <span style="flex: 1; text-align: end; font-family:sans-serif;">${fechaFormateada}</span>
      </div>
    `;

    let paid = 0
    let total = 0
    for(i in result){
      content += ` <div style="display: flex; flex-direction: row; width: 100%; margin-bottom: -10px;">
        <span style=" font-family:sans-serif; font-weight:600;">Lote número ${result[i].lot_number}</span>
      </div>
      <table style="width: 100%;">
        <tr>
          <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">ID</th>
          <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">Nombre</th>
          <th style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #ffda44;">Pagado</th>
        </tr>
      `

      paid += parseFloat(result[i].sales.paid)
      total += parseFloat(result[i].sales.price)
      for(j in result[i].sales.payments){
        content += `
        <tr>
          <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;"></td>
          <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;">Pago con id ${result[i].sales.payments[j].id}</td>
          <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif; background-color: #FDE68A;"></td>
        </tr>
        `
        

        for(k in result[i].sales.payments[j].transactions){
          content += `
          <tr>
            <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">${result[i].sales.payments[j].transactions[k].id} ${result[i].sales.payments[j].transactions[k].refunded === 1 ? '(reembolsado)' : ''}</td>
            <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">Pago en ${result[i].sales.payments[j].transactions[k].payment_type}</td>
            <td style="border-color: #0f0f0f; border-style: solid; border-width: 1px; font-family:sans-serif;">$${(result[i].sales.payments[j].transactions[k].amount).toLocaleString()}</td>
          </tr>
          `
        }
      }
      content += `</table>`
    }

    content += `
    <div style="display: flex; flex-direction: row; width: 100%; margin-bottom: -10px; border-bottom-color: #0f0f0f; border-bottom-style: solid; border-bottom-width: 1px; padding-bottom: 5px;">
        <span style="font-family:sans-serif; font-weight:600;">Pagado: $${paid.toLocaleString()} de $${total.toLocaleString()}</span>
    </div>
    </div>
    `
    const dateName = Date.now()
    const data = `${process.env.API_URL}/pdf/${dateName}.pdf`

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ path: `./public/pdf/${dateName.toString()}.pdf`, format: 'A4', printBackground: true });
    await browser.close();

    return res.status(200).send({message:'Account state fetched successfully',PDFUrl:data})
  } catch (error) {
    return res.status(500).send({message:'Internal server error', error:error.message})
  }
  
}

module.exports.AccountState = {fetch, pdfmake}