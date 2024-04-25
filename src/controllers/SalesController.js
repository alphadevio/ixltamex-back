const { PrismaClient } = require("@prisma/client");
const { Sale } = require("../models/Sale");
const prisma = new PrismaClient();

const save = async (req, res) => {
  try {
    const payload = req.body;
    const sale = new Sale(payload);

    const new_sale = await prisma.sales.create({
      data: sale,
    });

    const future_payment_dates = await calculateFuturePayments(sale.payment_day || null, sale.payment_weekday || null, sale.frequency_type, sale.frequency_amount, sale.price)

    const payments_data = future_payment_dates.map(payment => ({
      id_sale: new_sale.id,
      amount: payment.amount,
      payment_date: payment.date
  }));
  
  await prisma.payments.createMany({
      data: payments_data
  });

    return res.status(201).send({ new_sale, message: "Sale created" })

  } catch (error) {
    console.log(error);
    if (error.code === 'P2002' && error.meta.target === 'id_lot') {

      return res.status(400).json({ error: "Duplicate entry for lot ID detected" });
    }

    return res.status(500).send({ error: error.message })
  }
};

const fetch = async (req, res) => {
  try {
    const result = await prisma.sales.findMany({
      include: {
        lots: true,
        clients: true,
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


async function calculateFuturePayments(payment_day, payment_weekday, frequency_type, frequency_amount, total_amount) {
  // Get today's date
  let currentDate = new Date();

  // Initialize variables for storing future payment dates and amounts
  let futurePayments = [];
  let paymentAmount = total_amount / frequency_amount;

  // Determine the interval for adding days/weeks/months
  let interval = 1;
  if (frequency_type === "biweekly") {
      interval = 14; // 14 days in a biweekly interval
  } else if (frequency_type === "monthly") {
      interval = 30;
  }

  // Determine the starting day for the payment schedule
  if (payment_day) {
      // If payment_day is specified, set the date to that day
      currentDate.setDate(payment_day);
  } else if (payment_weekday) {
      // If payment_weekday is specified, set the date to the next occurrence of that weekday
      currentDate = getNextWeekday(currentDate, convertWeekdayToNumber(payment_weekday));
  }

  // Loop to calculate future payment dates and amounts
  for (let i = 0; i < frequency_amount; i++) {
      // Create a new Date object for the next payment date
      let nextPaymentDate = new Date(currentDate.getTime() + (interval * 24 * 60 * 60 * 1000 * i));

      // Push the payment date and amount to the futurePayments array
      futurePayments.push({ date: nextPaymentDate.getTime(), amount: paymentAmount });
  }

  return futurePayments;
}

// Function to get the next occurrence of a weekday
function getNextWeekday(date, dayOfWeek) {
  const daysToAdd = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

function convertWeekdayToNumber(weekdayString) {
  switch (weekdayString.toLowerCase()) {
      case 'sunday':
          return 0;
      case 'monday':
          return 1;
      case 'tuesday':
          return 2;
      case 'wednesday':
          return 3;
      case 'thursday':
          return 4;
      case 'friday':
          return 5;
      case 'saturday':
          return 6;
      default:
          return -1; // Return -1 for invalid input
  }
}


module.exports.SalesController = { save, fetch, update, destroy }
