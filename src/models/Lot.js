class Lot {
    constructor(payload){
        this.id = parseInt(payload.id);
        this.id_apple = parseInt(payload.id_apple);
        this.lot_number = payload.lot_number;
        this.area = parseFloat(payload.area);
        this.top_width = parseFloat(payload.top_width);
        this.bottom_width = parseFloat(payload.bottom_width);
        this.image = payload.image|| null;
        this.right_length = parseFloat(payload.right_length);
        this.left_length = parseFloat(payload.left_length);
    }
}

module.exports.Lot = Lot;
