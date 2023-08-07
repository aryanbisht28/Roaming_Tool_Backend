const router = require("express").Router();
const Subs = require("../models/subsProvi");
const countryDetails = require("../models/detail");
const multer = require("multer");
const crsendEmail = require("../utils/crSendEmail");
const testSendEmail = require("../utils/testSendEmail");
const Addcr = require("../models/addCr");
const sendDetail = require("../utils/SendData");
const Details = require("../models/detail");
const connect = require("../models/Connect");
const tapin = require("../models/tapinData");
const tapout = require("../models/tapoutData");
const dot = require("dot-object");
const tapinData = require("./tapindata.json");
const tapoutData = require("./tapoutdata.json");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/docs");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

router.post(
  "/",
  upload.fields([
    { name: "IR21", maxCount: 1 },
    { name: "CLL", maxCount: 1 },
  ]),
  async (req, res) => {
    const pname = req.body.pname;
    const service = req.body.service.split(",");
    const direction = req.body.direction;
    const unilateral = req.body.unilateral;
    const date = req.body.date;
    const IR21 = req.files["IR21"]
      ? req.files["IR21"][0].filename
      : req.body.IR21;
    const CLL = req.files["CLL"] ? req.files["CLL"][0].filename : req.body.CLL;
    //console.log("service", service);
    const det = await Details.findOne({ tadig: req.body.pname });
    //console.log("details", det);
    const country = det.country;
    const subscriber = new Subs({
      pname,
      service,
      direction,
      unilateral,
      date,
      IR21,
      CLL,
      country,
    });
    subscriber.save();
    const tadig = req.body.pname;
    const name = req.body.name;
    const data = await Addcr.findOne({ tadig });
    let updateData = {};
    for (let i = 0; i < service.length; i++) {
      if (service[i] === "3G") {
        if (direction === "Bi-Lateral") {
          updateData[`UMTS/${service[i]} Status Inbound`] = "Live";
          updateData[`UMTS/${service[i]} Status Outbound`] = "Live";
        } else {
          if (unilateral == "Inbound") {
            updateData[`UMTS/${service[i]} Status Inbound`] = "Live";
          } else {
            updateData[`UMTS/${service[i]} Status Outbound`] = "Live";
          }
        }
      } else {
        if (direction === "Bi-Lateral") {
          updateData[`${service[i]} Status Inbound`] = "Live";
          updateData[`${service[i]} Status Outbound`] = "Live";
        } else {
          if (unilateral == "Inbound") {
            updateData[`${service[i]} Status Inbound`] = "Live";
          } else {
            updateData[`${service[i]} Status Outbound`] = "Live";
          }
        }
        // updateData[`${service[i]} Status Inbound`] = "Live";
      }
    }
     connect.updateOne(
      { "TADIG code": tadig },
      { $set: dot.dot(updateData) },
      async (err, results) => {
        if (err) res.json({ err: true });
        else {
          //console.log("updated connection details");
        }
      }
    );
    //console.log("data", data);
    if (data) {
      //console.log("inside", data);
      let subject = `[Commercial launch] ${direction} Roaming ${service} Service launch between STC Kuwait (KWTKT) and ${tadig} scheduled for ${date} (${tadig})`;
      let message = 
      "<p> Dear Colleagues,</p>" +
      `<p> Please be informed that ${direction} Roaming ${service} Service launch between STC Kuwait (KWTKT) and ${tadig} scheduled for ${date}. </p>` +
        '<table style="border: 1px solid #333;">' +
        "<thead>" +
        '<th style="border: 1px solid #333;"> TADIG </th>' +
        '<th style="border: 1px solid #333;"> Country </th>' +
        '<th style="border: 1px solid #333;"> Operator </th> ' +
        '<th style="border: 1px solid #333;"> IMSI </th> ' +
        '<th style="border: 1px solid #333;"> Direction </th> ' +
        '<th style="border: 1px solid #333;"> Service Type </th> ' +
        '<th style="border: 1px solid #333;"> Launch Date </th> ' +
        "</thead>" +
        '<tr style="border: 1px solid #333;">' +
        '<td style="border: 1px solid #333;">' +
         data.tadig +
         "</td>" +
        '<td style="border: 1px solid #333;">' +
        data.country +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        data.pname +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        data.MCC +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        `${direction}  ${unilateral}`+
        //   ? `+ ${unilateral}`
        //   : "" +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        service +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        date +
        "</td>" +
        '</tr style="border: 1px solid #333;">' +
            "</table>" +
            "<br>" +
            "<p>Should you have any further queries, please do not hesitate to contact me.</p>" +
            "<p>Thank you</p>" +
            `<p>${name} <br> STC Roaming Co-ordinator</p>`;
      let attachments = [];
      let obj = {};
      obj["filename"] = IR21;
      obj["path"] = `uploads/docs/${IR21}`;
      obj["contentType"] = "application/pdf";
      attachments.push(obj);
      let obj1 = {};
      obj1["filename"] = CLL;
      obj1["path"] = `uploads/docs/${CLL}`;
      obj1["contentType"] = "application/pdf";
      attachments.push(obj1);
      //console.log('attach',attachments)
      const email = data.spocDetail.map((m) => m.mail);
      await testSendEmail(email, subject, message, attachments);
    }
    res.send("posted");
  }
);

router.get("/", async (req, res) => {
  try {
    const viewSubsData = await Subs.find();
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewSubsData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/country", async (req, res) => {
  try {
    const viewSubsData = await Subs.aggregate([
      [{ $group: { _id: "$country", count: { $sum: 1 } } }],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewSubsData);
    //console.log(viewSubsData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/count", async (req, res) => {
  try {
    const viewSubsData = await Subs.aggregate([
      [
        {
          $count: "createdAt",
        },
      ],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewSubsData);
    //console.log(viewSubsData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/service", async (req, res) => {
  try {
    const viewSubsData = await Subs.aggregate([
      [
        { $unwind: "$service" },
        { $group: { _id: "$service", count: { $sum: 1 } } },
      ],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewSubsData);
    //console.log(viewSubsData);
  } catch (e) {
    res.send(e);
  }
});

router.post("/sendInfoMAil", async (req, res) => {
  const pname = req.body.pname;
  const country = req.body.country;
  const date = req.body.date;
  const direction = req.body.direction;
  const unilateral = req.body.unilateral;
  const service = req.body.service;
  const CLL = req.body.CLL;
  const IR21 = req.body.IR21;
  const to = req.body.to;
  const cc = req.body.cc;
  const name = req.body.name;
  let attachments = [];
  //CLL
  if (CLL) {
    let objCLL = {};
    objCLL["filename"] = CLL;
    objCLL["path"] = `uploads/docs/${CLL}`;
    objCLL["contentType"] = "application/pdf";
    attachments.push(objCLL);
  }
  //IR21
  if (IR21) {
    let objIR21 = {};
    objIR21["filename"] = IR21;
    objIR21["path"] = `uploads/docs/${IR21}`;
    objIR21["contentType"] = "application/pdf";
    attachments.push(objIR21);
  }
  //console.log("attach", attachments);
  let message =
    "<p> Dear Colleagues ,</p>" +
    "<p>I hope this email finds you well. Sending to the details for </p>" +
    "<p>Roaming Partner Name :- " +
    pname +
    "</p>" +
    "<p>Country:- " +
    country +
    "</p>" +
    "<p>Date :- " +
    date +
    "</p>" +
    "<p>Direction:- " +
    direction +
    "</p>" +
    "<p>Unilateral :- " +
    unilateral +
    "</p>" +
    "<p>Service:- " +
    service +
    "</p>";

  message +=
    // "<p>We are also attaching the documents for your reference.</p>" +
    "<p>Thank you for your patience and cooperation throughout this process.</p>" +
    "<p>Best regards,</p>" +
    "<p>" +
    name +
    "</p>" +
    "<p> STC Roaming Co-ordinator </p>";
  await sendDetail(
    to,
    cc,
    `Launch Data (${pname})`,
    message,
    attachments
  );
  res.send("posted");
});

router.get("/tapindataentry", async (req, res) => {
  try {
    let count = 0;
    //console.log(tapinData[0]);
    // for (let i = 0; i < tapinData.length; i++) {
    //   if (tapinData[i]["Country"] != "#N/A") {
    //     let ARRIVALDATE = tapinData[i]["ARRIVALDATE"];
    //     let FIRSTCALLDATE = tapinData[i]["FIRSTCALLDATE"];
    //     let LASTCALLDATE = tapinData[i]["LASTCALLDATE"];
    //     let SENDERTADIG = tapinData[i]["SENDERTADIG"];
    //     let SENDERNAME = tapinData[i]["SENDERNAME"];
    //     let RECEIPIENTTADIG = tapinData[i]["RECEIPIENTTADIG"];
    //     let RECEIPIENTNAME = tapinData[i]["RECEIPIENTNAME"];
    //     let TAPINFILENAME = tapinData[i]["TAPINFILENAME"];
    //     let SEQUENCE = tapinData[i]["SEQUENCE"];
    //     let COUNTOFCDR = tapinData[i]["COUNTOFCDR"];
    //     let MOCCOUNT = tapinData[i]["MOCCOUNT"];
    //     let MOCACTUALDURATION = tapinData[i]["MOCACTUALDURATION"];
    //     let MOCTOTALDURATION = tapinData[i]["MOCTOTALDURATION"];
    //     let MOCTOTALSDR = tapinData[i]["MOCTOTALSDR"];
    //     let MTCCOUNT = tapinData[i]["MTCCOUNT"];
    //     let MTCACTUALDURATION = tapinData[i]["MTCACTUALDURATION"];
    //     let MTCTOTALDURATION = tapinData[i]["MTCTOTALDURATION"];
    //     let MTCTOTALSDR = tapinData[i]["MTCTOTALSDR"];
    //     let SMSMOCOUNT = tapinData[i]["SMSMOCOUNT"];
    //     let SMSMOTOTALSDR = tapinData[i]["SMSMOTOTALSDR"];
    //     let SMSMTCOUNT = tapinData[i]["SMSMTCOUNT"];
    //     let SMSMTTOTALSDR = tapinData[i]["SMSMTTOTALSDR"];
    //     let GPRSCOUNT = tapinData[i]["GPRSCOUNT"];
    //     let GPRSACTUALVOLUME = tapinData[i]["GPRSACTUALVOLUME"];
    //     let GPRSBILLEDVOLUME = tapinData[i]["GPRSBILLEDVOLUME"];
    //     let GPRSTOTALSDR = tapinData[i]["GPRSTOTALSDR"];
    //     let TOTAL_TAX = tapinData[i]["TOTAL_TAX"];
    //     let GROSSSDR = tapinData[i]["GROSSSDR"];
    //     let TAX_LC = tapinData[i]["TAX_LC"];
    //     let GROSS_LC = tapinData[i]["GROSS_LC"];
    //     let Country = tapinData[i]["Country"];
    //     const tapdata = new tapin({
    //       ARRIVALDATE,
    //       FIRSTCALLDATE,
    //       LASTCALLDATE,
    //       SENDERTADIG,
    //       SENDERNAME,
    //       RECEIPIENTTADIG,
    //       RECEIPIENTNAME,
    //       TAPINFILENAME,
    //       SEQUENCE,
    //       COUNTOFCDR,
    //       MOCCOUNT,
    //       MOCACTUALDURATION,
    //       MOCTOTALDURATION,
    //       MOCTOTALSDR,
    //       MTCCOUNT,
    //       MTCACTUALDURATION,
    //       MTCTOTALDURATION,
    //       MTCTOTALSDR,
    //       SMSMOCOUNT,
    //       SMSMOTOTALSDR,
    //       SMSMTCOUNT,
    //       SMSMTTOTALSDR,
    //       GPRSCOUNT,
    //       GPRSACTUALVOLUME,
    //       GPRSBILLEDVOLUME,
    //       GPRSTOTALSDR,
    //       TOTAL_TAX,
    //       GROSSSDR,
    //       TAX_LC,
    //       GROSS_LC,
    //       Country,
    //     });
    //     tapdata.save();
    //     count++;
    //   }
    // }
    //console.log(count);
    res.send("done");
  } catch (e) {
    res.send(e);
  }
});

router.get("/tapoutdataentry", async (req, res) => {
  try {
    let count = 0;
    //console.log(tapoutData[0].Country);
    // for (let i = 0; i < tapoutData.length; i++) {
    //   if (tapoutData[i]["Country"] != "#N/A") {
    //     let FILEGENERATIONDATE = tapoutData[i]["FILEGENERATIONDATE"];
    //     let FIRSTCALLDATE = tapoutData[i]["FIRSTCALLDATE"];
    //     let LASTCALLDATE = tapoutData[i]["LASTCALLDATE"];
    //     let OPERATORTADIG = tapoutData[i]["OPERATORTADIG"];
    //     let VPLMNCIRCLE = tapoutData[i]["VPLMNCIRCLE"];
    //     let SENDERTADIG = tapoutData[i]["SENDERTADIG"];
    //     let HPLMNCIRCLE = tapoutData[i]["HPLMNCIRCLE"];
    //     let TAPOUTFILENAME = tapoutData[i]["TAPOUTFILENAME"];
    //     let SEQUENCE = tapoutData[i]["SEQUENCE"];
    //     let COUNTOFCDR = tapoutData[i]["COUNTOFCDR"];
    //     let MOCCOUNT = tapoutData[i]["MOCCOUNT"];
    //     let MOCACTUALDURATION = tapoutData[i]["MOCACTUALDURATION"];
    //     let MOCTOTALDURATION = tapoutData[i]["MOCTOTALDURATION"];
    //     let MOCTOTALSDR = tapoutData[i]["MOCTOTALSDR"];
    //     let MTCCOUNT = tapoutData[i]["MTCCOUNT"];
    //     let MTCACTUALDURATION = tapoutData[i]["MTCACTUALDURATION"];
    //     let MTCTOTALDURATION = tapoutData[i]["MTCTOTALDURATION"];
    //     let MTCTOTALSDR = tapoutData[i]["MTCTOTALSDR"];
    //     let SMSMOCOUNT = tapoutData[i]["SMSMOCOUNT"];
    //     let SMSMOTOTALSDR = tapoutData[i]["SMSMOTOTALSDR"];
    //     let SMSMTCOUNT = tapoutData[i]["SMSMTCOUNT"];
    //     let SMSMTTOTALSDR = tapoutData[i]["SMSMTTOTALSDR"];
    //     let GPRSCOUNT = tapoutData[i]["GPRSCOUNT"];
    //     let GPRSACTUALVOLUME = tapoutData[i]["GPRSACTUALVOLUME"];
    //     let GPRSBILLEDVOLUME = tapoutData[i]["GPRSBILLEDVOLUME"];
    //     let GPRSTOTALSDR = tapoutData[i]["GPRSTOTALSDR"];
    //     let NETSDR = tapoutData[i]["NETSDR"];
    //     let TAXSDR = tapoutData[i]["TAXSDR"];
    //     let GROSSSDR = tapoutData[i]["GROSSSDR"];
    //     let NETUSD = tapoutData[i]["NETUSD"];
    //     let TAXUSD = tapoutData[i]["TAXUSD"];
    //     let GROSSUSD = tapoutData[i]["GROSSUSD"];
    //     let Country = tapoutData[i]["Country"];

    //     const tapdata = new tapout({
    //       FILEGENERATIONDATE,
    //       FIRSTCALLDATE,
    //       LASTCALLDATE,
    //       OPERATORTADIG,
    //       VPLMNCIRCLE,
    //       SENDERTADIG,
    //       HPLMNCIRCLE,
    //       TAPOUTFILENAME,
    //       SEQUENCE,
    //       COUNTOFCDR,
    //       MOCCOUNT,
    //       MOCACTUALDURATION,
    //       MOCTOTALDURATION,
    //       MOCTOTALSDR,
    //       MTCCOUNT,
    //       MTCACTUALDURATION,
    //       MTCTOTALDURATION,
    //       MTCTOTALSDR,
    //       SMSMOCOUNT,
    //       SMSMOTOTALSDR,
    //       SMSMTCOUNT,
    //       SMSMTTOTALSDR,
    //       GPRSCOUNT,
    //       GPRSACTUALVOLUME,
    //       GPRSBILLEDVOLUME,
    //       GPRSTOTALSDR,
    //       NETSDR,
    //       TAXSDR,
    //       GROSSSDR,
    //       NETUSD,
    //       TAXUSD,
    //       GROSSUSD,
    //       Country,
    //     });
    //     tapdata.save();
    //     count++;
    //   }
    // }
    //console.log(count);
    res.send("done");
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
