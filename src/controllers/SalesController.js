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
    
    if (sale.frequency_type === "monthly") {
      payment_occurrences = monthlyPayments(sale.payment_day, sale.frequency_amount);
    } else {
      payment_occurrences = weeklyPayments(sale.frequency_type, sale.payment_weekday, sale.frequency_amount);
    }
    
    const payment_amount_per_occurrence = parseFloat(sale.price) / parseInt(sale.frequency_amount);
    
    const payment_data = payment_occurrences.map(payment_occurrence => ({
      id_sale: new_sale.id,
      amount: payment_amount_per_occurrence,
      payment_date: payment_occurrence,
      paid: 0,
      paid_amount: 0
    }));
    

    await prisma.payments.createMany({
      data:payment_data
    })

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
    const result = await prisma.sales.findMany({
      include: {
        lots:true,
        clients:true,
        payments:true
      },
      where: {
        deleted: {
          not: 1
        }
      }
    })

    
    result.forEach(sale => {
      let totalAmount = 0;
      sale.payments.forEach(payment => {
        totalAmount += parseFloat(payment.amount);
      });
      sale.total_amount = totalAmount;
  
      sale.remaining = sale.total_amount - parseFloat(sale.paid);
    });
  
    return res.status(200).send({ result })
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
  let id_sale = req.body.id;

  await prisma.sales.updateMany({
    where: {
      id: id_sale,
    },
    data: {
      deleted: 1,
    },
  });

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
