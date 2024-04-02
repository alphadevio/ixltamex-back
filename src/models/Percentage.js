class Percentage {
    constructor(payload){
        this.id = payload.id
        this.user_id = payload.user_id
        this.development_id = payload.development_id
        this.percentage = payload.percentage
    }
}

module.exports = Percentage