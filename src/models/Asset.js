class Asset {
    constructor(payload){
        this.id = payload.id;
        this.description = payload.description;
        this.valor = payload.valor;
        this.status = payload.status;
        this.id_client = payload.id_client;
        this.id_lot = payload.id_lot;
    }
}

module.exports.Asset = Asset;