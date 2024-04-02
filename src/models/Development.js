class Development {
    constructor(payload){
        this.id = payload.id
        this.name = payload.name
        this.location = payload.location
        this.apples = payload.apples
        this.lots = payload.lots
        this.deleted = payload.deleted || 0
    }
}

module.exports = Development