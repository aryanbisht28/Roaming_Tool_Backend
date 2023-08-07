const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TestingScheme = new Schema({
  pname: String,
  tadig: String,
  direction: String,
  sno: String,
  service: String,
  document: String,
  InboundTapFile: String,
  OutboundTapFile: String,
  TCC: { type: String, default: null },
  date: String,
  country: String,
  createdAt: { type: Date, default: Date.now },
});

const TestDetails = mongoose.model("TestDetails", TestingScheme);
module.exports = TestDetails;
