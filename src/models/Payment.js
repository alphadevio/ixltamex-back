class Payment {
    constructor(payload){
        this.id = payload.id
        this.id_sale = payload.id_sale
        this.amount = payload.amount
        this.payment_date = payload.payment_date
        this.paid = payload.paid || 0
    }
}