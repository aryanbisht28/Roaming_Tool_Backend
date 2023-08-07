const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const countryDetails = new Schema({
    tadig: String,
    opName: String,
    country: String,
    MCC: String,
    MNC:String
});

const Details = mongoose.model("countryDetail", countryDetails)
module.exports = Details;