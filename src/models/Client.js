class Client {
    constructor(payload){
        this.id = payload.id
        this.name = payload.name
        this.phone_number = payload.phone_number
        this.id_file_name = payload.image
    }
}

module.exports.Client = Client