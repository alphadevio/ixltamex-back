class Lot {
    constructor(payload){
        this.id = payload.id;
        this.id_apple = payload.id_apple;
        this.lot_number = payload.lot_number;
        this.area = payload.area;
        this.top_width = payload.top_width;
        this.bottom_width = payload.bottom_width;
        this.right_length = payload.right_length;
        this.left_length = payload.left_length;
    }
}

module.exports.Lot = Lot;
