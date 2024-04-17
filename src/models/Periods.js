class Periods {
    constructor(payload){
        this.id = payload.id;
        this.name = payload.name;
        this.days = payload.days;
        this.deleted = payload.deleted || 0;
    }
}

module.exports.Periods = Periods;
