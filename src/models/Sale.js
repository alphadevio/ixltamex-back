class Sale{
    constructor(payload){
        this.id = payload.id
        this.id_client = payload.id_client
        this.id_lot = payload.id_lot
        this.price = payload.price
        this.paid = payload.paid || 0
        this.deleted = payload.deleted || 0
    }
}

module.exports.Sale = Sale