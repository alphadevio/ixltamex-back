class Spendings {
    constructor(payload){
        this.id = payload.id;
        this.id_user = payload.id_user;
        this.id_development = payload.id_development;
        this.ammount = payload.ammount;
        this.date = payload.date || Date.now();
        this.deleted = payload.deleted || 0;
    }
}

module.exports.Spendings = Spendings;
