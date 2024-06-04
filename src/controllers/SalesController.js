const { PrismaClient } = require("@prisma/client");
const { Sale } = require("../models/Sale");
const prisma = new PrismaClient();
const moment = require('moment-timezone');

const save = async (req, res) => {
  try {
    const payload = req.body;

    const sale = new Sale(payload);

    const new_sale = await prisma.sales.create({
      data: sale,
    });

    await prisma.lots.update({
      data:{
        sold:1
      },
      where:{
        id:sale.id_lot
      }
    })
    
    let payment_occurrences;
    
    if(sale.frequency_type !== 'unique'){
      if (sale.frequency_type === "monthly") {
        payment_occurrences = monthlyPayments(sale.payment_day, sale.frequency_amount);
      } else {
        payment_occurrences = weeklyPayments(sale.frequency_type, sale.payment_weekday, sale.frequency_amount);
      }
    }
    
    const amount_to_pay_after_first_payment = parseFloat(sale.price) - parseFloat(sale.first_payment)
    console.log('AMOUNT TO PAY AFTER FIRST PAYMENT',amount_to_pay_after_first_payment)
    const payment_amount_per_occurrence = parseFloat(amount_to_pay_after_first_payment) / parseInt(sale.frequency_amount);

    if(sale.first_payment > 0) {
      const first_ever_payment = await prisma.payments.create({
        data: {
          id_sale: new_sale.id,
          amount: sale.first_payment,
          payment_date: Date.now(),
          paid: 1,
          paid_amount: sale.first_payment,
          number: 0
        }
      })

      await prisma.sales.update({
        data: {
          paid: sale.first_payment
        }, where: {
          id: new_sale.id
        }
      })
  
      await prisma.transactions.create({
        data:{
          amount: parseFloat(sale.first_payment),
          id_payment: first_ever_payment.id,
          payment_type: 'otro'
        }
      })
    }
    
    if(amount_to_pay_after_first_payment > 0) {
      const payment_data = payment_occurrences.map((payment_occurrence, index) => ({
        id_sale: new_sale.id,
        amount: payment_amount_per_occurrence,
        payment_date: payment_occurrence,
        paid: 0,
        paid_amount: 0,
        number: index + 1
      }));
      
  
      await prisma.payments.createMany({
        data:payment_data
      })
    }

    return res.status(201).send({ new_sale, message: "Sale created" });
  } catch (error) {
    console.log(error);
    if (error.code === "P2002" && error.meta.target === "id_lot") {
      return res
        .status(400)
        .json({ error: "Duplicate entry for lot ID detected" });
    }

    return res.status(500).send({ error: error.message });
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
    console.log(offset)

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

    let result = await prisma.sales.findMany({
      include: {
        lots:true,
        clients:true,
        payments:true
      },
      where: whereCondition,
      skip:offset,
      take:take
    })
  
    result.forEach(sale => {
      let totalAmount = 0;
      sale.payments.forEach(payment => {
        totalAmount += parseFloat(payment.amount);
      });
      sale.total_amount = totalAmount;
  
      sale.remaining = sale.total_amount - parseFloat(sale.paid);
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
        id: id_sale
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
        let nextOccurrence = moment.tz([currentYear, currentMonth, setDay], timeZone);

        if (nextOccurrence.month() !== currentMonth) {
            // If set day doesn't exist in the current month, set to the last day of the month
            nextOccurrence = moment.tz([currentYear, currentMonth + 1, 0], timeZone);
        }

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


module.exports.SalesController = { save, fetch, update, destroy }
