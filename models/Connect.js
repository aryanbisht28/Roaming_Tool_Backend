const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Connections = new Schema({
  "Country": String,
  "Operator": String,
  "TADIG code": String,
  "MCC/MNC": String,
  "GSM Status Inbound": String,
  "GSM Status Outbound": String,
  "GPRS Status Inbound": String,
  "GPRS Status Outbound": String,
  "UMTS/3G Status Inbound": String,
  "UMTS/3G Status Outbound": String,
  "VoLTE Status Inbound": String,
  "VoLTE Status Outbound": String,
  "5G Status Inbound": String,
  "5G Status Outbound": String,
  "CAMEL Status Inbound": String,
  "CAMEL Status Outbound": String,
  "LTE Status Inbound": String,
  "LTE Status Outbound": String,
});

const Connect1 = mongoose.model("Connection", Connections)
module.exports = Connect1;

