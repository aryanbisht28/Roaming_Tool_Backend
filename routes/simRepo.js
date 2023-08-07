const router = require("express").Router();
const multer = require("multer");
const SimRepo = require("../models/simRepo");

router.get("/", async (req, res) => {
  try {
    const Sims = await SimRepo.find();
    res.send(Sims);
  } catch (e) {
    res.send(e);
  }
});

router.post("/", async (req, res) => {
  try {
    //console.log("body", req.body[0]["Card recipient"]);
    const Sims = await SimRepo.find();
    if (Sims) {
      let index = Sims.length;
      //console.log("hi");
      for (let i = 0; i < req.body.length; i++) {
        const id = index + i;
        const country = req.body[i]["Country"] ? req.body[i]["Country"] : "";
        const CardRecipient = req.body[i]["Card recipient"]
          ? req.body[i]["Card recipient"]
          : "";
        const TADIG = req.body[i]["Recipient TADIG"]
          ? req.body[i]["Recipient TADIG"]
          : "";
        const MCC = req.body[i]["MCC/MNC"] ? req.body[i]["MCC/MNC"] : "";
        const IMSI = req.body[i]["IMSI"] ? req.body[i]["IMSI"] : "";
        const ICCID = req.body[i]["ICCID"] ? req.body[i]["ICCID"] : "";
        const MSISDN = req.body[i]["MSISDN"] ? req.body[i]["MSISDN"] : "";
        const CardFormat = req.body[i]["Card format"]
          ? req.body[i]["Card format"]
          : "";
        const ValidUntil = req.body[i]["Valid until"]
          ? req.body[i]["Valid until"]
          : "";
        const CreationDate = req.body[i]["Creation date"]
          ? req.body[i]["Creation date"]
          : "";
        const Status = req.body[i]["Status\r"] ? req.body[i]["Status\r"] : "";
        const newSim = new SimRepo({
          id,
          country,
          CardRecipient,
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        });
        //console.log("newTest", newSim);
        newSim.save();
      }
      res.send("posted");
    }
  } catch (e) {
    res.send(e);
  }
});

router.post("/post", async (req, res) => {
  try {
    //console.log("body", req.body);
    await SimRepo.deleteMany();
    //console.log("All Data successfully deleted");
    for (let i = 0; i < req.body.length; i++) {
      const id = 0 + i;
      const country = req.body[i]["Country"];
      const CardRecipient = req.body[i]["Card recipient"];
      const TADIG = req.body[i]["Recipient TADIG"];
      const MCC = req.body[i]["MCC/MNC"];
      const IMSI = req.body[i]["IMSI"];
      const ICCID = req.body[i]["ICCID"];
      const MSISDN = req.body[i]["MSISDN"];
      const CardFormat = req.body[i]["Card format"];
      const ValidUntil = req.body[i]["Valid until"];
      const CreationDate = req.body[i]["Creation date"];
      const Status = req.body[i]["Status\r"];
      const newSim = new SimRepo({
        id,
        country,
        CardRecipient,
        TADIG,
        MCC,
        IMSI,
        ICCID,
        MSISDN,
        CardFormat,
        ValidUntil,
        CreationDate,
        Status,
      });
      //console.log("newTest", newSim);
      newSim.save();
    }
    res.send("delted");
  } catch (e) {
    res.send(e);
  }
});

router.post("/delete", async (req, res) => {
  try {
    const _id = req.body["_id"];
    //console.log("data", req.body);
    const respone = await SimRepo.findByIdAndRemove(_id);
    //console.log("response", respone);
    if (respone) {
      res.send("deleted");
    }
  } catch (e) {
    res.send(e);
  }
});

router.post("/update", async (req, res) => {
  try {
    ////console.log("connected");
    const _id = req.body["_id"];
    //console.log("data", req.body);
    const respone = await SimRepo.findByIdAndUpdate(_id, {
      ...req.body,
    });
    //console.log("response", respone);
    if (respone) {
      res.send("updated");
    }
  } catch (e) {
    res.send(e);
  }
});

router.post("/addNew", async (req, res) => {
  try {
    //console.log("connected");
    const sims = await SimRepo.find();
    if (sims) {
      let id = sims.length + 1;
      // const _id=req.body['_id'
      //console.log("data", req.body);
      const newSim = new SimRepo({
        ...req.body,
        id: id,
      });
      //console.log("newSim", newSim);
      newSim.save();

      res.send("new row added");
    }
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
