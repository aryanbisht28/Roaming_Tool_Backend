const router = require("express").Router();
const multer = require("multer");
const ppsendEmail = require("../utils/ppSendEmail");
const tccEmail = require("../utils/testSendEmail");
const Ppmodel = require("../models/ppModel");
const connect = require("../models/Connect");
const Addcr = require("../models/addCr");
const TestDetails = require("../models/testingModel")
const dot = require("dot-object");
const Details = require("../models/detail");
const sendDetail = require("../utils/SendData");

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

router.post("/", async (req, res) => {
  try {
    const roamPartner = req.body.roamingPartner;
    let service = req.body.service;
    const direction1 = req.body.direction;
    const unilateral =
      req.body.unilateral == "" ? "Inbound & Outbound" : req.body.unilateral;
    const ownSim = req.body.ownSim;
    const roamSim = req.body.roamingSim;
    const name = req.body.name;


    const data = await Ppmodel.aggregate([
      {
        $match: {
          roamPartner: roamPartner,
          direction: "Inbound",
          TccInbound: { $exists: false }
        },
      },
    ]);

    const datas = await Ppmodel.aggregate([
      {
        $match: {
          roamPartner: roamPartner,
          direction: "Outbound",
          TccOutbound: { $exists: false }
        },
      },
    ]);

    //console.log('data', data, 'datas', datas)

    const data1 = await Ppmodel.aggregate([
      {
        $match: {
          roamPartner: roamPartner,
          direction: "Inbound",
          TccInbound: { $exists: false }
        },
      },

      {
        $project: {
          _id: 0,

          services: "$service",

          missingServices: {
            $setDifference: [service, "$service"],
          },
        },
      },
    ]);

    const data2 = await Ppmodel.aggregate([
      {
        $match: {
          roamPartner: roamPartner,
          direction: "Outbound",
          TccOutbound: { $exists: false }
        },
      },

      {
        $project: {
          _id: 0,

          services: "$service",

          missingServices: {
            $setDifference: [service, "$service"],
          },
        },
      },
    ]);
    //console.log("data1", data1, "data2", data2);
    const det = await Details.findOne({ tadig: req.body.roamingPartner });
    //console.log("details", det);
    const country = det.country;

    if (direction1 === "Bi-Lateral") {
      // //console.log("hiewe");
      // //console.log("data len", data.length);
      // //console.log("datas len", datas.length);
      if (data.length == 0 && datas.length == 0) {
        let direction = "Inbound";
        let Sim = roamSim;
        const newPpentry = new Ppmodel({
          roamPartner,
          service,
          direction,
          country,
          // unilateral,
          Sim,
        });
        // //console.log("newPpentry", newPpentry);
        newPpentry.save();
        direction = "Outbound";
        Sim = ownSim;
        const newPpentry1 = new Ppmodel({
          roamPartner,
          service,
          direction,
          country,
          // unilateral,
          Sim,
        });
        //console.log("newPpentry1", newPpentry1);
        newPpentry1.save();
        // res.send("posted");
      }
      else if (data.length === 0) {
        let direction = "Inbound";
        let Sim = roamSim;
        const newPpentry = new Ppmodel({
          roamPartner,
          service,
          direction,
          country,
          // unilateral,
          Sim,
        });
        // //console.log("newPpentry", newPpentry);
        newPpentry.save();
        const up = await Ppmodel.updateOne(
          { roamPartner: roamPartner, direction: "Outbound" },
          { $push: { service: { $each: data2[0]["missingServices"] } } }
        );
      }
      else if (datas.length === 0){
        const up = await Ppmodel.updateOne(
          { roamPartner: roamPartner, direction: "Inbound" },
          { $push: { service: { $each: data1[0]["missingServices"] } } }
        );
        let direction = "Outbound";
        Sim = ownSim;
        const newPpentry1 = new Ppmodel({
          roamPartner,
          service,
          direction,
          country,
          // unilateral,
          Sim,
        });
        //console.log("newPpentry1", newPpentry1);
        newPpentry1.save();
      }else{
        const up = await Ppmodel.updateOne(
          { roamPartner: roamPartner, direction: "Outbound" },
          { $push: { service: { $each: data2[0]["missingServices"] } } }
        );
        const up1 = await Ppmodel.updateOne(
          { roamPartner: roamPartner, direction: "Inbound" },
          { $push: { service: { $each: data1[0]["missingServices"] } } }
        );
      }
      // else {
      //   if (data.length != 0) {
      //     //console.log("data", data1[0]["missingServices"]);
      //     const up = await Ppmodel.updateOne(
      //       { roamPartner: roamPartner, direction: "Inbound" },
      //       { $push: { service: { $each: data1[0]["missingServices"] } } }
      //     );
      //   }
      //   if (datas.length != 0) {
      //     const up = await Ppmodel.updateOne(
      //       { roamPartner: roamPartner, direction: "Outbound" },
      //       { $push: { service: { $each: data2[0]["missingServices"] } } }
      //     );
      //   }
      //   if(data.length==0){}
      // }
    } else {
      let direction = unilateral;
      let Sim = roamSim;
      if (direction == "Inbound") {
        //console.log("uni data len", data.length, data);
        if (data.length == 0) {
          //console.log("new uni inbound");
          const newPpentry1 = new Ppmodel({
            roamPartner,
            service,
            direction,
            country,
            // unilateral,
            Sim,
          });
          newPpentry1.save();
        } else {
          const up = await Ppmodel.updateOne(
            { roamPartner: roamPartner, direction: "Inbound", TccInbound: { $exists: false } },
            { $push: { service: { $each: data1[0]["missingServices"] } } }
          );
        }
      } else {
        Sim = ownSim;
        if (datas.length == 0) {
          const newPpentry1 = new Ppmodel({
            roamPartner,
            service,
            direction,
            country,
            // unilateral,
            Sim,
          });
          newPpentry1.save();
        } else {
          const up = await Ppmodel.updateOne(
            { roamPartner: roamPartner, direction: "Outbound", TccOutbound: { $exists: false } },
            { $push: { service: { $each: data2[0]["missingServices"] } } }
          );
        }
      }
    }

    //console.log("jhihih");
    let tadig = req.body.roamingPartner;
    const crdata = await Addcr.findOne({ tadig });
    if (crdata) {
      if (
        req.body.direction === "Bi-Lateral" &&
        ownSim.length > 0 &&
        roamSim.length > 0
      ) {
        //console.log("inside");
        let message =
          "<p> Dear Colleagues, </p>" +
          `<p> I hope this email finds you well. Require your confirmation on the use of the SIM cards in our possession for testing ${req.body.service}. Our team currently has the following SIM cards: -` +
          "</p>"
        //
        message +=
          //     "</table>" +
          // "<br>" +
          // "<p> ROAMING SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          /*...*/
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.roamingSim) {
          message +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">'
        }
        message +=
          "</table>" +
          `<p>We kindly request that you confirm whether or not we are able to utilize these SIM cards for ${req.body.direction} testing purposes. If they are not suitable, please inform us as soon as possible so that we may proceed accordingly.</p>` +
          `<p> If new SIM cards are required, please send them to the following address: </p>` +
          `<p> [Insert Address Here] </p>` +
          `<p> Furthermore, we think that below SIM cards are currently in your possession. </p>`

        let message1 = "";
        message1 +=
          // "<p> OWN SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.ownSim) {
          message1 +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
        message1 +=
          "</table>" +
          `<p> if new SIM cards are required, kindly share your address with us so that we may send them to you.</p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name}</p>` +
          "<p> STC Roaming Co-ordinator </p>"
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message + message1
        );
      } else if (
        req.body.direction === "Bi-Lateral" &&
        ownSim.length > 0 &&
        roamSim.length == 0
      ) {
        let message =
          "<p> Dear Colleagues,  </p>" +
          "<p>I hope this email finds you well.</p>" +
          `<p> We require new SIM cards for testing ${req.body.service} our network, please send them to the following address:` +
          "</p>" +
          "<p>[Insert Address Here]</p>" +
          "<p>Furthermore, we think that below SIM cards are currently in your possession.</p>"
        message +=
          // "<p> OWN SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.ownSim) {
          message +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">'
        }
        message +=
          `</table>
        <p>
        if new SIM cards are required, kindly share your address with us so that we may send them to you.Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          // `<p> Furthermore, for testing our services on your network if new SIM cards are required, kindly share your address with us so that we may send them to you. </p>` +
          // `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name}</p>` +
          "<p> STC Roaming Co-ordinator</p>"
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message
        );
      } else if (
        req.body.direction === "Bi-Lateral" &&
        ownSim.length == 0 &&
        roamSim.length > 0
      ) {
        let message =
          "<p> Dear Colleagues, </p>" +
          `<p> I hope this email finds you well. Require your confirmation on the use of the SIM cards in our possession for testing ${req.body.service}. Our team currently has the following SIM cards:</p>`;
        // `<p> We require new SIM cards for testing  in our network, please send them to the following address: </p> ` +
        let message1 = "";
        message1 +=
          // "<p> ROAMING SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.roamingSim) {
          message1 +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
        message1 +=
          `</table>` +
          `<p> We kindly request that you confirm whether or not we are able to utilize these SIM cards for ${req.body.direction} testing purposes.</p>` +
          `<p> Furthermore, for testing our services on your network if new SIM cards are required, kindly share your address with us so that we may send them to you.</p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name}</p>` +
          "<p> STC Roaming Co-ordinator </p>"
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message + message1
        );
      } else if (
        req.body.direction === "Bi-Lateral" &&
        ownSim.length == 0 &&
        roamSim.length == 0
      ) {
        let message =
          "<p> Dear Colleagues, </p>" +
          "<p>I hope this email finds you well.</p>" +
          `<p> We require new SIM cards for testing ${req.body.service} our network, please send them to the following address:` +
          "</p>" +
          "<p>[Insert Address Here]</p>" +
          "<p>Furthermore, we think that below SIM cards are currently in your possession.</p>" +
          "<p>And Kindly let us know if you have our sim cards in your possession or not if new SIM cards are required, kindly share your address with us so that we may send them to you.</p>" +
          "<p>Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.<p>" +
          "<p>Best regards,</p>" +
          `<p> ${name}</p>` +
          "<p> STC Roaming Co-ordinator </p>"
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message
        );
      } else if (
        req.body.direction === "Unilateral" &&
        unilateral === "Inbound" &&
        ownSim.length == 0 &&
        roamSim.length > 0
      ) {
        let message =
          "<p> Dear Colleagues </p>" +
          `<p> I hope this email finds you well. Require your confirmation on the use of the SIM cards in our possession for testing ${req.body.service}. Our team currently has the following SIM cards: -` +
          "</p>";
        message +=
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          /*...*/
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.roamingSim) {
          message +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
        message +=
          "</table>" +
          `<p>We kindly request that you confirm whether or not we are able to utilize these SIM cards for ${req.body.direction} testing purposes. If they are not suitable, please inform us as soon as possible so that we may proceed accordingly.</p>` +
          `<p> If new SIM cards are required, please send them to the following address: </p>` +
          `<p> [Insert Address Here] </p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name}</p>`
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message
        );
      } else if (
        req.body.direction === "Unilateral" &&
        unilateral === "Inbound" &&
        ownSim.length == 0 &&
        roamSim.length == 0
      ) {
        let message =
          "<p> Dear Colleagues, </p>" +
          `<p> I hope this email finds you well. Require your confirmation on the use of the SIM cards in our possession for testing ${req.body.service}. Our team requires sim cards for testing` +
          "</p>" +
          `<p> Please send them to the following address: </p>` +
          `<p> [Insert Address Here] </p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name} </p>` +
          "<p> STC Roaming Co-ordinator </p>";
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message
        );
      } else if (
        req.body.direction === "Unilateral" &&
        unilateral === "Outbound" &&
        ownSim.length > 0 &&
        roamSim.length == 0
      ) {
        let message =
          "<p> Dear Colleagues, </p>" +
          `<p> I hope this email finds you well.` +
          "</p>"
        message +=
          `<p> We think that below SIM cards are currently in your possession. </p>` +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.ownSim) {
          message +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
        message +=
          "</table>" +
          `<p> if new SIM cards are required, kindly share your address with us so that we may send them to you.</p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name} </p>`
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${name})`,
          message
        );
      } else if (
        req.body.direction === "Unilateral" &&
        unilateral === "Outbound" &&
        ownSim.length == 0 &&
        roamSim.length == 0
      ) {
        let message =
          "<p> Dear Colleagues </p>" +
          `<p> I hope this email finds you well.` +
          "</p>";
        message +=
          `<p> Kindly share your address with us so that we may send them to you.</p>` +
          `<p> Thank you for your attention to this matter. We look forward to hearing from you soon and establishing a successful testing partnership.</p>` +
          `<p> Best regards,</p>` +
          `<p> ${name} </p>` +
          "<p> STC Roaming Co-ordinator </p>";
        const email = crdata["spocDetail"].map((data) => data.mail);
        await ppsendEmail(
          email,
          `Request for Confirmation of SIM Card Usage and Request for New SIM Cards (${roamPartner})`,
          message
        );
      }
    }
    // //console.log("before")
    res.send("email sent");
  } catch (e) {
    res.send(e);
  }
});

router.post("/sendTccReminder", async (req, res) => {
  try {
    const tadig = req.body.pname;
    const name = req.body.name;
    const data = await Addcr.findOne({ tadig });
    //console.log("data", data);
    if (data) {
      const subject = `Reminder to send TCC for ${req.body.service} after verifying the test documents (${tadig})`

      let message = "<p> Dear Colleagues,</p>";
      message +=
        "<p> I hope this email finds you well. I am writing to remind you about the Test Completion Certificate (TCC) that we have been expecting from you. As per our agreement, it is important for us to receive the TCC after you have verified the test documents. </p>" +
        "<p> I would like to request you to kindly expedite the process and send us the TCC as soon as possible. We understand that verifying the test documents may take some time, but we would appreciate your prompt action in this matter. </p>" +
        "<p> Please let us know if you need any further assistance or clarification on this matter. We value our partnership with you and look forward to continuing our collaboration in the future. </p>" +
        "<p> Thank you for your attention to this matter. </p>" +
        "<p> Best regards, </p>" +
        `<p> ${name} </p>` +
        "<p> STC Roaming Co-ordinator </p>"
      const email = data.spocDetail.map((m) => m.mail);
      await ppsendEmail(email, subject, message);
      res.send("email sent");
    }
  } catch (e) {
    res.send(e);
  }
});

router.post("/tapfileArray", async (req, res) => {
  try {
    const tadig = req.body.tadig;
    const name = req.body.name;
    // const data = await Addcr.findOne({ tadig });
    // //console.log("data", data);
    // if (data) {
    const subject = `Reminder to send Tap file (${tadig})`;

    let message = "<p> Dear Colleagues, </p>"
    message +=
      "<p> I hope this email finds you well. I am writing to remind you about the Test Completion Certificate (TCC) that we have been expecting from you. Request you to kindly share the below  </p>" +
      "<p> Tap File Name </p>" +
      '<table style="border: 1px solid #333;">' +
      "<thead>" +
      '<th style="border: 1px solid #333;"> Tap File Name </th>' +
      "</thead>";
    for (let i = 0; i < req.body.tapfile.length; i++) {
      message +=
        '<tr style="border: 1px solid #333;">' +
        '<td style="border: 1px solid #333;">' +
        req.body.tapfile[i] +
        "</td>" +
        '</tr style="border: 1px solid #333;">'
    }
    message +=
      "</table>" +
      "<p> Thank you for your attention to this matter. </p>" +
      "<p> Best regards, </p>" +
      `<p> ${name} </p>` +
      "<p> STC Roaming Co-ordinator </p>"
    await ppsendEmail("adityadhunna2@kpmg.com", subject, message);
    res.send("email sent");
    // }
  } catch (e) {
    res.send(e);
  }
});

router.get("/", async (req, res) => {
  try {
    const viewPP = await Ppmodel.aggregate([
      {
        $match: {
          $or: [
            {
              direction: "Inbound",
              TccInbound: { $exists: false },
            },
            {
              direction: "Outbound",
              $or: [{ TccOutbound: { $exists: false } }],
            },
          ],
        },
      },
    ]);
    res.send(viewPP);
  } catch (e) {
    res.send(e);
  }
});
router.get("/connect", async (req, res) => {
  try {
    const viewPP = await connect.aggregate([
      {
        $project: {
          _id: 0,
          Tadig: "$TADIG code",
          Inboundservice: {
            "GSM": "$GSM Status Inbound",
            "GPRS": "$GPRS Status Inbound",
            "3G": "$UMTS/3G Status Inbound",
            "CAMEL": "$CAMEL Status Inbound",
            "LTE": "$LTE Status Inbound",
            "VOLTE": "$VoLTE Status Inbound",
            "5G": "$5G Status Inbound"
          },
          Outboundservice: {
            "GSM": "$GSM Status Outbound",
            "GPRS": "$GPRS Status Outbound",
            "3G": "$UMTS/3G Status Outbound",
            "CAMEL": "$CAMEL Status Outbound",
            "LTE": "$LTE Status Outbound",
            "VOLTE": "$VoLTE Status Outbound",
            "5G": "$5G Status Outbound"
          }
        }
      }
    ]);
    res.send(viewPP);
  } catch (e) {
    res.send(e);
  }
});

router.get("/subs", async (req, res) => {
  try {
    const viewPP = await Ppmodel.aggregate([
      {
        $match: {
          $or: [
            {
              direction: "Inbound",
              TccInbound: { $exists: true },
            },
            {
              direction: "Outbound",
              $or: [{ TccOutbound: { $exists: true } }],
            },
          ],
        },
      },
    ]);
    res.send(viewPP);
  } catch (e) {
    res.send(e);
  }
});

router.get("/testing", async (req, res) => {
  try {
    const viewPP = await Ppmodel.aggregate([
      {
        $match:
        /**
         * query: The query in MQL.
         */
        {
          // testedService: {
          //   $exists: true,
          //   $size: 0,
          // },
          $nor: [{ TccInbound: { $exists: true } }, { TccOutbound: { $exists: true } }],
        },
      },
      {
        $group: {
          _id: "$roamPartner",
          Inbound: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$direction", "Inbound"],
                },
                then: "$service",
                else: null,
              },
            },
          },
          Outbound: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$direction", "Outbound"],
                },
                then: "$service",
                else: null,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
          Inbound: {
            $filter: {
              input: "$Inbound",
              cond: {
                $ne: ["$$this", null],
              },
            },
          },
          Outbound: {
            $filter: {
              input: "$Outbound",
              cond: {
                $ne: ["$$this", null],
              },
            },
          },
        },
      },
    ]);
    res.send(viewPP);
  } catch (e) {
    res.send(e);
  }
});

router.get("/country", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      { $match: { $and: [{ TccInbound: { $exists: false } }, { TccOutbound: { $exists: false } }] } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      // [{ $group: { _id: "$country", count: { $sum: 1 } } }],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/service", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        { $unwind: "$service" },
        { $match: { $and: [{ TccInbound: { $exists: false } }, { TccOutbound: { $exists: false } }] } },
        // { $group: { _id: "$country", count: { $sum: 1 } } },
        { $group: { _id: "$service", count: { $sum: 1 } } },
      ],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

// router.get("/tcount", async (req, res) => {
//   try {
//     const query = {
//       $or: [
//         {
//           direction: "Bi-Lateral",
//           $or: [
//             { TccInbound: { $exists: true } },
//             { TccOutbound: { $exists: true } },
//           ],
//         },
//         {
//           direction: "Uni-Lateral",
//           TccInbound: { $exists: true },
//           TccOutbound: { $exists: true },
//         },
//       ],
//     };
//     const count = await Ppmodel.countDocuments(query);
//     res.send(count);
//     //console.log(count);
//   } catch (e) {
//     res.send(e);
//   }
// });
//

router.get("/tcountry", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        // { $match: { gender: "Male" } },
        // { $group: { _id: "$class", count: { $sum: 1 } } },
        // {
        //   $lookup: {
        //     from: "countrydetails",
        //     localField: "roamPartner",
        //     foreignField: "tadig",
        //     as: "result",
        //   },
        // },  
        { $match: { $or: [{ TccInbound: { $exists: true } }, { TccOutbound: { $exists: true } }] } },
        { $group: { _id: { country: "$country", tadig: "$tadig" }, count: { $sum: 1 } } },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/ttdate", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        { $match: { $and: [{ TccInbound: { $exists: false } }, { TccOutbound: { $exists: false } }] } },
        {
          $group: {
            _id: "$createdAt",

          },
        },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/tcount", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        {
          $count: "createdAt",
        },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/tservice", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        {
          $unwind: "$testedService",
        },
        {
          $group: {
            _id: "$testedService",
            count: {
              $sum: 1,
            },
          },
        },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/count", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        {
          $count: "createdAt",
        },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/mcount", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
      ],
    ]);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/sermonth", async (req, res) => {
  try {
    const viewPPData = await Ppmodel.aggregate([
      [
        {
          $addFields: {
            month: {
              $month: "$createdAt",
            },
          },
        },
        {
          $unwind: "$service",
        },
        {
          $group: {
            _id: "$month",
            count: {
              $sum: 1,
            },
          },
        },
      ],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewPPData);
    //console.log(viewPPData);
  } catch (e) {
    res.send(e);
  }
});

const sendMail = async (pname, direction, document, name,services) => {
  let message =
    "<p>Dear Colleagues,</p>" +
    `<p> I hope this email finds you well. I am writing to request for the Commercial Launch Letter (CLL) for ${services}. ` +
    "</p>" +
    "<p> We have completed the testing phase and sending you the Test Completion Certificate (TCC). I kindly request you to share the CLL with us as soon as possible, with a launch date scheduled after next week. " +
    "</p>" +
    "<p>Attached to this email, please find the Test Completion Certificate (TCC) for your reference. " +
    "</p>" +
    "<p> Thank you for your continued support and cooperation in this matter. We look forward to working with you on this project. " +
    "</p>" +
    "<p>Best regards,</p>" +
    `${name}` +
    `<p> STC Roaming Co-ordinator </p>`;
  let attachments = [
    {
      filename: document,
      path: `uploads/docs/${document}`,
      contentType: "application/pdf",
    },
  ];
  await tccEmail(
    "adityadhunna2@kpmg.com",
    `Request for Commercial Launch Letter and sending TCC for our ${direction}`,
    message,
    attachments
  );
  return true;
};

router.patch(
  "/",
  upload.fields([{ name: "document", maxCount: 1 }]),
  async (req, res) => {
    //console.log("body", req.body);
    let updateData = {};
    let document = "";
    let name = req.body.name;
    //console.log(req.body);
    if (req.body.direction === "Outbound") {
      document = req.files["document"]
        ? req.files["document"][0].filename
        : null;
      //console.log("document", req.files["document"][0].path, document);
      updateData["TccOutbound"] = document;
      updateData["TccOutboundDate"] = Date.now();
      let len = req.body.services.split(',').length;
      let services = req.body.services.split(',')
      for (let i = 0; i < len; i++) {
        let updateData1 = {}
        updateData1['TCC'] = 'uploaded'
        TestDetails.updateOne(
          { pname: req.body.pname, direction: req.body.direction, tadig: req.body.tadig, service: services[i] },
          { $set: dot.dot(updateData1) },
          async (err, results) => {
            if (err) res.json({ err: true });
            else {
              //console.log('updated test details')
            }
          }
        );

      }
    } else if (req.body.direction === "Inbound") {
      document = req.files["document"]
        ? req.files["document"][0].filename
        : null;
      //console.log("document", document);
      updateData["TccInbound"] = document;
      updateData["TccInboundDate"] = Date.now();
      let len = req.body.services.split(',').length;
      let services = req.body.services.split(',')
      for (let i = 0; i < len; i++) {
        let updateData1 = {}
        updateData1['TCC'] = 'uploaded'
        TestDetails.updateOne(
          { pname: req.body.pname, direction: req.body.direction, tadig: req.body.tadig, service: services[i] },
          { $set: dot.dot(updateData1) },
          async (err, results) => {
            if (err) res.json({ err: true });
            else {
              //console.log('updated test details')
            }
          }
        );

      }
    }

    //console.log("updateData", updateData);
    Ppmodel.updateOne(
      { roamPartner: req.body.tadig, direction: req.body.direction },
      { $set: dot.dot(updateData) },
      async (err, results) => {
        if (err) res.json({ err: true });
        else {
          // //console.log("res", results);
          sendMail(req.body.pname, req.body.direction, document, name, services);
          // //console.log('result',result)
          // if (result === true) {
          res.json({ success: true });
          // }
        }
      }
    );
    // } else if (req.body.direction === "Inbound") {

    //   Ppmodel.updateOne(
    //     { roamPartner: req.body.pname },
    //     { $set: dot.dot(updateData) },
    //     (err, results) => {
    //       if (err) res.json({ err: true });
    //       else res.json({ success: true });
    //     }
    //   );
    // }
  }
);

router.patch("/UpdateService", async (req, res) => {
  //console.log("hi UpdateService", req.body);
  const data = await Ppmodel.findOne({
    roamPartner: req.body.pname,
    direction: req.body.direction,
  });
  if (data) {
    const _id = data["_id"];
    Ppmodel.findByIdAndUpdate(
      _id,
      {
        testedService: req.body.service,
      },
      function (err, docs) {
        if (err) {
          //console.log(err);
        } else {
          res.send("updated");
        }
      }
    );
  }
  // const result =  await Ppmodel.updateOne(
  //   { roamPartner: req.body.pname, direction: req.body.direction },
  //   { $set: { testedService: req.body.service } },
  //   { upsert: false },
  //   async (err, results) => {
  //     if (err) res.json({ err: true });
  //     else {
  //       res.json({ success: true });
  //     }
  //   }
  // );
});

router.put("/:id", async (req, res) => {
  try {
    //console.log("req.body", req.body);
    const tadig = req.body.roamingPartner;
    const service = req.body.service;
    const direction = req.body.direction;
    // const unilateral = req.body.unilateral;
    const ownSim = req.body.ownSim;
    const roamSim = req.body.roamingSim;
    const _id = req.params.id;
    //console.log("_id", _id);
    //console.log("pname", tadig);
    // const det= await Details.findOne({ tadig });
    const data = await Addcr.findOne({ tadig });
    //console.log("data", data);
    if (data) {
      //console.log("hi");
      let message =
        "<p> Dear Colleagues," +
        "<p> I hope this email finds you well. Below are the modified details:-"
      "<p> Roaming Partner - " +
        req.body.roamingPartner +
        "</p>" +
        "<p> Services - " +
        req.body.service +
        "</p>" +
        "<p> Direction - " +
        req.body.direction +
        "</p>";
      if (req.body.unilateral != "") {
        message += "<p> Unilateral - " + req.body.unilateral + "</p>";
      }
      if (
        req.body.unilateral == "Outbound" ||
        req.body.direction === "Bi-Lateral"
      ) {
        message +=
          "<p> OWN SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.ownSim) {
          message +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
      }
      let message1 = "";
      if (
        req.body.unilateral == "Inbound" ||
        req.body.direction === "Bi-Lateral"
      ) {
        message1 +=
          "</table>" +
          "<br>" +
          "<p> ROAMING SIM </p>" +
          '<table style="border: 1px solid #333;">' +
          "<thead>" +
          '<th style="border: 1px solid #333;"> TADIG </th>' +
          '<th style="border: 1px solid #333;"> MCC </th>' +
          '<th style="border: 1px solid #333;"> IMSI </th> ' +
          '<th style="border: 1px solid #333;"> ICCID </th> ' +
          '<th style="border: 1px solid #333;"> MSISDN </th> ' +
          '<th style="border: 1px solid #333;"> CardFormat </th> ' +
          '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
          '<th style="border: 1px solid #333;"> CreationDate </th> ' +
          '<th style="border: 1px solid #333;"> Status </th> ' +
          /*...*/
          "</thead>";
        for (const {
          TADIG,
          MCC,
          IMSI,
          ICCID,
          MSISDN,
          CardFormat,
          ValidUntil,
          CreationDate,
          Status,
        } of req.body.roamingSim) {
          message1 +=
            '<tr style="border: 1px solid #333;">' +
            '<td style="border: 1px solid #333;">' +
            TADIG +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MCC +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            IMSI +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ICCID +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            MSISDN +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CardFormat +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            ValidUntil +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            CreationDate +
            "</td>" +
            '<td style="border: 1px solid #333;">' +
            Status +
            "</td>" +
            '</tr style="border: 1px solid #333;">';
        }
      }
      const email = data.spocDetail.map((data) => data.mail);
      Ppmodel.findByIdAndUpdate(
        _id,
        {
          service: service,
          direction: direction,
          // unilateral: unilateral,
          ownSim: ownSim,
          roamSim: roamSim,
        },
        function (err, docs) {
          if (err) {
            //console.log(err);
          } else {
            ppsendEmail(
              email,
              `Modify Partner Provision (${req.body.roamingPartner})`,
              message + message1
            );
            res.send("updated");
          }
        }
      );
      // res.send("updated");
    }
  } catch (e) {
    res.send(e);
  }
});

router.post("/sendInfoMAil", async (req, res) => {
  //console.log("Email Sent");
  const roamPartner = req.body.roamPartner;
  const service = req.body.service;
  const direction = req.body.direction;
  // const unilateral = req.body.unilateral;
  const to = req.body.to;
  const cc = req.body.cc;
  const name = req.body.name;
  let message =
    "<p> Dear Colleagues,</p>" +
    "<p>I hope this email finds you well. Sending you the details for </p>" +
    "<p>Roaming Partner Name :- " +
    roamPartner +
    "</p>" +
    "<p>Direction :- " +
    direction +
    "</p>" +
    "<p>Service :- " +
    service +
    // "</p>" +
    // "<p>Unilateral :- " +
    // unilateral +
    "</p>"
  if (req.body.Sim.length > 0) {
    message +=
      "<p> SIM Details </p>" +
      '<table style="border: 1px solid #333;">' +
      "<thead>" +
      '<th style="border: 1px solid #333;"> TADIG </th>' +
      '<th style="border: 1px solid #333;"> MCC </th>' +
      '<th style="border: 1px solid #333;"> IMSI </th> ' +
      '<th style="border: 1px solid #333;"> ICCID </th> ' +
      '<th style="border: 1px solid #333;"> MSISDN </th> ' +
      // '<th style="border: 1px solid #333;"> CardFormat </th> ' +
      '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
      // '<th style="border: 1px solid #333;"> CreationDate </th> ' +
      '<th style="border: 1px solid #333;"> Status </th> ' +
      /*...*/
      "</thead>";
    for (const {
      TADIG,
      MCC,
      IMSI,
      ICCID,
      MSISDN,
      // CardFormat,
      ValidUntil,
      // CreationDate,
      Status,
    } of req.body.Sim) {
      message +=
        '<tr style="border: 1px solid #333;">' +
        '<td style="border: 1px solid #333;">' +
        TADIG +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        MCC +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        IMSI +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        ICCID +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        MSISDN +
        "</td>" +
        // '<td style="border: 1px solid #333;">' +
        // CardFormat +
        // "</td>" +
        '<td style="border: 1px solid #333;">' +
        ValidUntil +
        "</td>" +
        // '<td style="border: 1px solid #333;">' +
        // CreationDate +
        // "</td>" +
        '<td style="border: 1px solid #333;">' +
        Status +
        "</td>" +
        '</tr style="border: 1px solid #333;">'
    }
  }
  message += "</table>"

  // let message1 = "";
  // if (req.body.ownSim.length > 0) {
  //   message1 +=
  //     // "<p> OWN SIM </p>" +
  //     "<p> OWN SIM </p>" +
  //     '<table style="border: 1px solid #333;">' +
  //     "<thead>" +
  //     '<th style="border: 1px solid #333;"> TADIG </th>' +
  //     '<th style="border: 1px solid #333;"> MCC </th>' +
  //     '<th style="border: 1px solid #333;"> IMSI </th> ' +
  //     '<th style="border: 1px solid #333;"> ICCID </th> ' +
  //     '<th style="border: 1px solid #333;"> MSISDN </th> ' +
  //     // '<th style="border: 1px solid #333;"> CardFormat </th> ' +
  //     '<th style="border: 1px solid #333;"> ValidUntil </th> ' +
  //     // '<th style="border: 1px solid #333;"> CreationDate </th> ' +
  //     '<th style="border: 1px solid #333;"> Status </th> ' +
  //     "</thead>";
  //   for (const {
  //     TADIG,
  //     MCC,
  //     IMSI,
  //     ICCID,
  //     MSISDN,
  //     // CardFormat,
  //     ValidUntil,
  //     // CreationDate,
  //     Status,
  //   } of req.body.ownSim) {
  //     message1 +=
  //       '<tr style="border: 1px solid #333;">' +
  //       '<td style="border: 1px solid #333;">' +
  //       TADIG +
  //       "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       MCC +
  //       "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       IMSI +
  //       "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       ICCID +
  //       "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       MSISDN +
  //       "</td>" +
  //       // '<td style="border: 1px solid #333;">' +
  //       // CardFormat +
  //       // "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       ValidUntil +
  //       "</td>" +
  //       // '<td style="border: 1px solid #333;">' +
  //       // CreationDate +
  //       // "</td>" +
  //       '<td style="border: 1px solid #333;">' +
  //       Status +
  //       "</td>" +
  //       '</tr style="border: 1px solid #333;">';
  //   }
  //   message1 += "</table>";
  // }
  message +=
    // message1 +
    "<p>Thank you for your patience and cooperation throughout this process.</p>" +
    "<p>Best regards,</p>" +
    "<p>" +
    name +
    "</p>" +
    "<p> STC Roaming Co-ordinator </p>"
  let sub = `Commercial Review Data (${roamPartner})`
  let attachments = [];
  await sendDetail(to, cc, sub, message, attachments);
  res.send("posted");
});

router.post("/sendInfo", async (req, res) => {
  //console.log("Email Sent");
  const pname = req.body.pname;
  const tadig = req.body.tadig;
  const direction = req.body.direction;
  const service = req.body.service;
  const tccDate = req.body.tccDate;
  const to = req.body.to;
  const cc = req.body.cc;
  const document = req.body.document;
  const tcc = req.body.tcc;
  const name = req.body.name;
  let attachments = [];

  if (tcc) {
    let objtcc = {};
    objtcc["filename"] = tcc;
    objtcc["path"] = `uploads/docs/${tcc}`;
    objtcc["contentType"] = "application/pdf";
    attachments.push(objtcc);
  }

  if (document.length > 0) {
    for (let i = 0; i < document.length; i++) {
      let obj = {};
      obj["filename"] = document[i];
      obj["path"] = `uploads/docs/${document[i]}`;
      obj["contentType"] = "application/pdf";
      attachments.push(obj);
    }
  }
  //console.log("attach", attachments);
  let message =
    "<p> Dear Colleagues ,</p>" +
    "<p>I hope this email finds you well. Sending to the details for </p>" +
    "<p>Roaming Partner Name :- " +
    pname +
    "</p>" +
    "<p>TADIG :- " +
    tadig +
    "</p>" +
    "<p>Direction :- " +
    direction +
    "</p>";
  "<p>Service :- " + service + "</p>" + "<p>TCC Date :- " + tccDate + "</p>";

  message +=
    "<p>We are also attaching the documents for your reference.</p>" +
    "<p>Thank you for your patience and cooperation throughout this process.</p>" +
    "<p>Best regards,</p>" +
    "<p>" +
    name +
    "</p>" +
    "<p> STC Roaming Co-ordinator"
  await sendDetail(
    to,
    cc,
    `Commercial Review Data (${tadig})`,
    message,
    attachments
  );
  res.send("posted");
});


router.post("/sendConnectionInfoMAil", async (req, res) => {
  //console.log("Email Sent");
  const tadig = req.body.Tadig;
  const service = req.body.service;
  const to = req.body.to;
  const cc = req.body.cc;
  const name = req.body.name;  
  //console.log('inbound',req.body.Inboundservice)
  //console.log('outbound',req.body.Outboundservice)

  let message =
    "<p> Dear Colleagues ,</p>" +
    "<p>I hope this email finds you well. Sending to the details for </p>" +
    "<p>Roaming Partner Name :- " +
    tadig +
    "</p>" +
    "<p>Inbound Service :- " + "</p>"+
    '<table style="border: 1px solid #333;">' +
        "<thead>" +
        '<th style="border: 1px solid #333;"> GSM </th>' +
        '<th style="border: 1px solid #333;"> GPRS </th>' +
        '<th style="border: 1px solid #333;"> 3G </th> ' +
        '<th style="border: 1px solid #333;"> CAMEL </th> ' +
        '<th style="border: 1px solid #333;"> LTE </th> ' +
        '<th style="border: 1px solid #333;"> VOLTE </th> ' +
        '<th style="border: 1px solid #333;"> 5G </th> ' +
        "</thead>" +
        '<tr style="border: 1px solid #333;">' +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice.GSM +
         "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice.GPRS +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice['3G'] +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice.CAMEL +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice.LTE+
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice.VOLTE +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Inboundservice['5G'] +
        "</td>" +
        '</tr style="border: 1px solid #333;">' +
            "</table>" +
            "<p>Outbound Service :- " + "</p>"+
    '<table style="border: 1px solid #333;">' +
        "<thead>" +
        '<th style="border: 1px solid #333;"> GSM </th>' +
        '<th style="border: 1px solid #333;"> GPRS </th>' +
        '<th style="border: 1px solid #333;"> 3G </th> ' +
        '<th style="border: 1px solid #333;"> CAMEL </th> ' +
        '<th style="border: 1px solid #333;"> LTE </th> ' +
        '<th style="border: 1px solid #333;"> VOLTE </th> ' +
        '<th style="border: 1px solid #333;"> 5G </th> ' +
        "</thead>" +
        '<tr style="border: 1px solid #333;">' +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice.GSM +
         "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice.GPRS +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice['3G'] +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice.CAMEL +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice.LTE+
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice.VOLTE +
        "</td>" +
        '<td style="border: 1px solid #333;">' +
        req.body.Outboundservice['5G'] +
        "</td>" +
        '</tr style="border: 1px solid #333;">' +
            "</table>" 
              //  + "<p>Outbound Service :- " + req.body.Outboundservice + "</p>";

  message +=
    "<p>We are also attaching the documents for your reference.</p>" +
    "<p>Thank you for your patience and cooperation throughout this process.</p>" +
    "<p>Best regards,</p>" +
    "<p>" +
    name +
    "</p>" +
    "<p> STC Roaming Co-ordinator"
    // //console.log('message',message)
  await sendDetail(
    to,
    cc,
    `Connection Status (${tadig})`,
    message,
    ''
  );
  res.send("posted");
});

module.exports = router;
