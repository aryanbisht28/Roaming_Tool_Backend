const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PpModelSchema = new Schema({
  roamPartner: String,
  service: [String],
  direction: String,
  // unilateral: String,
  TccInbound: String,
  TccOutbound: String,
  testedService: [String],
  TccInboundDate: { type: Date },
  TccOutboundDate: { type: Date },
  Sim: [
    {
      id: String,
      TADIG: String,
      MCC: String,
      IMSI: String,
      ICCID: String,
      MSISDN: String,
      CardFormat: String,
      ValidUntil: String,
      CreationDate: String,
      Status: String,
    },
  ],
  // roamSim: [
  //   {
  //     id: String,
  //     TADIG: String,
  //     MCC: String,
  //     IMSI: String,
  //     ICCID: String,
  //     MSISDN: String,
  //     CardFormat: String,
  //     ValidUntil: String,
  //     CreationDate: String,
  //     Status: String,
  //   },
  // ],
  country: String,
  createdAt: { type: Date, default: Date.now },
});

const PpModel = mongoose.model("ppModel", PpModelSchema);
module.exports = PpModel;
