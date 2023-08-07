const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AddcrSchema = new Schema({
    pname: String,
    tadig: String,
    AA12: String,
    AA13: String,
    AA14: String,
    IR21: String,
    MCC:String,
    country: String,
    spocDetail: [{
        name: String,
        contact: String,
        mail: String,
        address: String,
    }],
    createdAt: { type: Date, default: Date.now },
});

const Addcr = mongoose.model("Addcr", AddcrSchema)
module.exports = Addcr;