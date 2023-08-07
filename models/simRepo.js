const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SimRepoSchema = new Schema({
      id: String,
      country:String,
      CardRecipient:String,
      TADIG: String,
      MCC: String,
      IMSI: String,
      ICCID: String,
      MSISDN: String,
      CardFormat: String,
      ValidUntil: String,
      CreationDate: String,
      Status: String,
  createdAt: { type: Date, default: Date.now },
});

const SimRepoModel = mongoose.model("SimRepoModel", SimRepoSchema);
module.exports = SimRepoModel;
