const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tapindataSchema = new Schema({
  ARRIVALDATE: Date,
  FIRSTCALLDATE: String,
  LASTCALLDATE: String,
  SENDERTADIG: String,
  SENDERNAME: String,
  RECEIPIENTTADIG: String,
  RECEIPIENTNAME: String,
  TAPINFILENAME: String,
  SEQUENCE: Number,
  COUNTOFCDR: Number,
  MOCCOUNT: Number,
  MOCACTUALDURATION: Number,
  MOCTOTALDURATION: Number,
  MOCTOTALSDR: Number,
  MTCCOUNT: Number,
  MTCACTUALDURATION: Number,
  MTCTOTALDURATION: Number,
  MTCTOTALSDR: Number,
  SMSMOCOUNT: Number,
  SMSMOTOTALSDR: Number,
  SMSMTCOUNT: Number,
  SMSMTTOTALSDR: Number,
  GPRSCOUNT: Number,
  GPRSACTUALVOLUME: Number,
  GPRSBILLEDVOLUME: Number,
  GPRSTOTALSDR: Number,
  TOTAL_TAX: Number,
  GROSSSDR: Number,
  TAX_LC: Number,
  GROSS_LC: Number,
  Country: String,
});

const tapin = mongoose.model("tapindata", tapindataSchema);
module.exports = tapin;
