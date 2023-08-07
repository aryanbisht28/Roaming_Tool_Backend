const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SubsProvisi = new Schema({
  pname: String,
  service: [String],
  direction: String,
  unilateral: String,
  date: String,
  IR21: String,
  CLL: String,
  country: String,
  createdAt: { type: Date, default: Date.now },
});

const SubsProvi = mongoose.model("SubsProvisi", SubsProvisi);
module.exports = SubsProvi;
