class User {
    constructor(payload){
        if (!payload.name || !payload.email || !payload.phone_number || !payload.password || !payload.profile_id) {
            throw new Error('Missing required parameters');
        }
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