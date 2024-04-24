class Sale{
    constructor(payload){
        this.id = payload.id
        this.id_client = payload.id_client
        this.id_lot = payload.id_lot
        this.price = payload.price
        this.paid = payload.paid || 0
        this.deleted = payload.deleted || 0
        // this.id_period = payload.id_period
        this.payment_day = payload.payment_day || null
        this.payment_weekday = payload.payment_weekday || null
        this.frequency_type = payload.frequency_type
        this.frequency_amount = payload.frequency_amount
    }
}

module.exports.Sale = Sale