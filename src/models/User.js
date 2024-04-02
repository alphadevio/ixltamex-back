class User {
    constructor(payload){
        this.id = payload.id
        this.name = payload.name
        this.email = payload.email
        this.phone_number = payload.phone_number
        this.password = payload.password
        this.deleted = payload.deleted || 0
        this.profile_id = payload.profile_id
    }
}

module.exports.User = User