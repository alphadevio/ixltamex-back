const { PrismaClient } = require("@prisma/client");
const { Sale } = require("../models/Sale");
const prisma = new PrismaClient();
const moment = require('moment-timezone');
const puppeteer = require('puppeteer');

const save = async (req, res) => {
  try {
    
    const payload = req.body;
    const sale = new Sale(payload);

    //CREATES SALE
    const new_sale = await prisma.sales.create({
      data: sale,
      include:{
        clients:true,
        lots:true
      }
    });

    //UPDATES LOT TO NOW BE SOLD
    await prisma.lots.update({
      data:{
        sold:1
      },
      where:{
        id:sale.id_lot
      }
    })

    const extra_payment_odd_number = parseFloat(payload.price) - (parseFloat(payload.amount_per_payment) * parseFloat(payload.frequency_amount)) - parseFloat(sale.first_payment)

    if(extra_payment_odd_number > 0) sale.frequency_amount ++
    
    let payment_occurrences;
    
    //GENERATES DATA FOR THE PAYMENTS
    if(sale.frequency_type !== 'unique'){
      if (sale.frequency_type === "monthly") {
        payment_occurrences = monthlyPayments(sale.payment_day, sale.frequency_amount);
      } else {
        payment_occurrences = weeklyPayments(sale.frequency_type, sale.payment_weekday, sale.frequency_amount);
      }
    }
    
    // const amount_to_pay_after_first_payment = parseFloat(sale.price) - parseFloat(sale.first_payment)
    // const payment_amount_per_occurrence = parseFloat(amount_to_pay_after_first_payment) / parseInt(sale.frequency_amount);

    let content = `
    <div style="display:flex; flex-direction:column; gap:10px; width: 100%; padding:40px;">
      <span style="text-align:center; width:100%; font-weight:600; margin-bottom:30px;">Ficha del cliente:</span>
      <span>Nombre completo: ${new_sale.clients.name}</span>
      <span>No. de celular: ${new_sale.clients.phone_number}</span>
      <span>Lote: ${new_sale.lots.lot_number}</span>
      <span>Costo en contrato: $${parseFloat(new_sale.price).toLocaleString()} (${NumeroALetras(parseFloat(new_sale.price))}<span style-"font-weight:600">mxn</span>)</span>
    `
    
    //CREATES FIRST PAYMENT
    if(sale.first_payment > 0) {
      let payDay = Date.now()
      if(sale.frequency_type !== 'unique'){
        payDay = payment_occurrences[0]
        payment_occurrences = adjustDates(payment_occurrences, sale.frequency_type)
      }


      const first_ever_payment = await prisma.payments.create({
        data: {
          id_sale: new_sale.id,
          amount: sale.first_payment,
          payment_date: payDay,
          paid: 1,
          paid_amount: sale.first_payment,
          number: 0
        }
      })

      content += `<span>Enganche: $${parseFloat(first_ever_payment.amount).toLocaleString()} (${NumeroALetras(parseFloat(first_ever_payment.amount))}<span style-"font-weight:600">mxn</span>)</span>`
      
      await prisma.sales.update({
        data: {
          paid: sale.first_payment
        }, where: {
          id: new_sale.id
        }
      })
      
      //PAYS FIRST PAYMENT
      const first_ever_transaction = await prisma.transactions.create({
        data:{
          amount: parseFloat(sale.first_payment),
          payment_type: 'otro'
        }
      })

      await prisma.payment_transactions.create({
        data:{
          id_transaction:first_ever_transaction.id,
          id_payment:first_ever_payment.id
        }
      })
    }
    
    //CREATES PAYMENTS
    if(parseFloat(payload.amount_per_payment) > 0) {
      const payment_data = payment_occurrences.map((payment_occurrence, index) => ({
        id_sale: new_sale.id,
        amount: parseFloat(payload.amount_per_payment),
        payment_date: payment_occurrence,
        paid: 0,
        paid_amount: 0,
        number: index + 1
      }));
      
      await prisma.payments.createMany({
        data:payment_data
      })

      content += `<span>No. de pagos ${sale.frequency_type === 'monthly' ? 'mensuales' : sale.frequency_type === 'biweekley' ? 'quincenales' : 'semanales'}: ${payment_occurrences.length} pagos de $${parseFloat(payload.amount_per_payment).toLocaleString()} (${NumeroALetras(parseFloat(payload.amount_per_payment))}<span style-"font-weight:600">mxn</span>)</span>`
    }

    //CREATES EXTRA PAYMENT FOR THE DECIMALS
    if(extra_payment_odd_number > 0) {
      const last_payment = await prisma.payments.findFirst({
        orderBy:{
          id:'desc'
        }
      })

      await prisma.payments.update({
        where:{
          id: last_payment.id
        }, data:{
          amount: extra_payment_odd_number
        }
      })
    }

    content += `
      <span>Observaciones:</span>
      <span>INE:</span>
      <img src="${process.env.API_URL}/public/${new_sale.clients.id_file_name}" style="max-height:500px; max-width:500px; height: auto; width: auto;"/>
    </div>
    `
    const dateName = new Date().getTime()

    //ADDS PDF TO SALE
    await prisma.sales.update({
      where:{
        id: new_sale.id
      }, data:{
        file: `${dateName.toString()}.pdf`
      }
    })

    //CREATES PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ path: `./public/pdf/${dateName.toString()}.pdf`, format: 'A4', printBackground: true });
    await browser.close();

    const pdfUrl = `${process.env.API_URL}/pdf/${dateName}.pdf`

    return res.status(201).send({ new_sale, message: "Sale created", salePDF: pdfUrl });
  } catch (error) {
    console.log(error);
    if (error.code === "P2002" && error.meta.target === "id_lot") {
      return res
        .status(400)
        .json({ error: "Duplicate entry for lot ID detected", errorDetail: error.message });
    }else {
      return res.status(500).send({ error: error.message});

    }
  }
};

const fetch = async (req, res) => {
  try {
    const { id_cliente } = req.query;
    let offset = parseInt(req.query.offset)
    const limit = parseInt(req.query.limit)
    const search = req.query.where
    const orderby = req.query.orderby

    let take = 999999
    if(limit) {
      take = limit
    }

    if(!offset){
      offset = 0
    }

    const whereCondition = {
      deleted: {
        not: 1
      }
    };

    if (id_cliente) {
      whereCondition.id_client = parseInt(id_cliente);
    }

    if(search) {
      whereCondition.OR = [
        { clients:{
          name:{
            contains:search
          }
        }},
        { lots:{
          lot_number:{
            contains:search
          }
        }},
        { lots: {
          apples: {
            name:{
              contains:search
            }
          }
        }},
        { lots: {
          apples: {
            developments: {
              name: {
                contains: search
              }
            }
          }
        }}
      ]
    }

    console.log(whereCondition)

    let result = await prisma.sales.findMany({
      include: {
        lots:true,
        clients:true,
        payments:{
          include:{
            paymentTransactions:{
              include:{
                transaction:true
              }, where:{
                transaction:{
                  refunded:0
                }
              }
            }
          }
        }
      },
      where: whereCondition,
      skip:offset,
      take:take
    })
  //
    result.forEach(sale => {
      let totalAmount = 0;
      sale.payments.forEach(payment => {
        totalAmount += parseFloat(payment.amount);
      });
      sale.total_amount = totalAmount;
  
      sale.remaining = sale.total_amount - parseFloat(sale.paid);

      sale.file = `${process.env.API_URL}/pdf/${sale.file}`
    });

    result.forEach((element, index) => {
      if(element.payments.length > 0) {
        let bandera = false
        element.payments.forEach(element2 => {
          if(element2.payment_date < Date.now() && element2.paid !== 1){
            bandera = true
          }
        })
        if(bandera) result[index].retarded = true
        else result[index].retarded = false
      }
    })
    
    if(orderby){
      if(orderby === 'retarded'){
        result = result.filter(item => item.retarded);
      }
    }

    const count = await prisma.sales.count({where:{deleted:{not:1}}})
  
    return res.status(200).send({ result, count })
  } catch (error) {
    console.log(error)
  }
}

const update = async (req, res) => {
  try {
    let payload = req.body
    const sale = new Sale(payload)
    let data = {}

    if (sale.price !== undefined || sale.price !== null) {
      data.price = sale.price
    }

    if (sale.id_client !== undefined || sale.id_client !== null) {
      data.id_client = sale.id_client
    }

    if (sale.id_lot !== undefined || sale.id_lot !== null) {
      data.id_lot = sale.id_lot
    }

    const updated_sale = await prisma.sales.update({
      data: data,
      where: {
        id: sale.id
      }
    })

    return res.status(200).send({ message: "Venta modificada exitosamente", updated_sale });

  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
}

const destroy = async (req, res) => {
  let id_sale = parseInt(req.params.id);

  await prisma.sales.updateMany({
    where: {
      id: id_sale,
    },
    data: {
      deleted: 1,
    },
  });

  await prisma.lots.updateMany({
    data:{
      sold:0
    }, where:{
      sales:{
        some:{
          id: id_sale
        }
      }
    }
  })

  return res.status(200).send({ message: "Sale deleted succesfully" });
};

function weeklyPayments(interval, dayOfWeek, occurrences, timeZone='America/Mexico_City') {
    const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
    };

    const today = moment().tz(timeZone); // Get the current date and time in the specified time zone
    const currentDay = today.day(); // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
    const targetDay = dayMap[dayOfWeek.toLowerCase()];

    // Calculate the number of days until the next occurrence of the target day
    let daysUntilTargetDay = (targetDay + 7 - currentDay) % 7;
    if (daysUntilTargetDay === 0 && interval === 'biweekly') {
        daysUntilTargetDay = 7; // If today is the payment day, and it's biweekly, set it to next week
    }

    // Calculate the time until the next payment
    let nextPaymentTime = today.add(daysUntilTargetDay, 'days').valueOf();

    // Calculate the interval between payments
    const intervalInMilliseconds = (interval === 'biweekly') ? 2 * 7 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    const paymentDates = [];
    for (let i = 0; i < occurrences; i++) {
        paymentDates.push(nextPaymentTime);
        nextPaymentTime += intervalInMilliseconds;
    }

    return paymentDates;
}

function monthlyPayments(setDay, occurrences, timeZone='America/Mexico_City') {
  const result = [];
  let currentDate = moment().tz(timeZone);
  let currentYear = currentDate.year();
  let currentMonth = currentDate.month();

  for (let i = 0; i < occurrences; i++) {
      let adjustedDay = setDay;
      
      // Adjust the day if it's 31 and the current month doesn't have 31 days
      if (setDay > 28) {
          const daysInMonth = moment.tz([currentYear, currentMonth], timeZone).daysInMonth();
          if (setDay > daysInMonth) {
              adjustedDay = daysInMonth;
          }
      }

      let nextOccurrence = moment.tz([currentYear, currentMonth, adjustedDay], timeZone);

      result.push(nextOccurrence.valueOf()); // Add the date in milliseconds to result array

      // Move to the next month
      if (currentMonth === 11) {
          // If it's December, move to January of the next year
          currentMonth = 0;
          currentYear++;
      } else {
          // Otherwise, just move to the next month
          currentMonth++;
      }
  }

  return result;
}

function adjustDates (dates, frequency_type) {
  return dates.map(date => {
    let momentDate = moment(date);

    switch (frequency_type) {
        case 'monthly':
            momentDate.add(1, 'months');
            break;
        case 'weekly':
            momentDate.add(1, 'weeks');
            break;
        case 'biweekly':
            momentDate.add(2, 'weeks');
            break;
        default:
            throw new Error('Invalid frequency type');
    }

    return momentDate.valueOf();
});
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

module.exports.SalesController = { save, fetch, update, destroy }
