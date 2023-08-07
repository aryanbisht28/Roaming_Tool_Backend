const router = require("express").Router();
const multer = require("multer");
const Addcr = require("../models/addCr");
const Details = require("../models/detail");
const Ppmodel = require("../models/ppModel");
const TestDetails = require("../models/testingModel");
const ppsendEmail = require("../utils/ppSendEmail");
const testSendEmail = require("../utils/testSendEmail");

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
  upload.fields([{ name: "document", maxCount: 1 }]),
  async (req, res) => {
    // ////console.log("connected", req.files["document"][0]);
    const tadig = req.body.pname;
    const direction = req.body.direction;
    const sno = req.body.sno;
    const service = req.body.service;
    const document = req.files["document"]
      ? req.files["document"][0].filename
      : req.body.Inbound;
    const date = req.body.date;
    const data = await Addcr.findOne({ tadig });
    const present = await TestDetails.findOne({ tadig, direction, service });
    const det = await Details.findOne({ tadig });
    ////console.log("details", det);
    const country = det.country;
    if (data) {
      const pname = data.pname;
      ////console.log("present", present);
      if (present) {
        const _id = present["_id"];
        if (direction === "Inbound") {
          const InboundTapFile = req.body.InboundTapFile;
          const up = await TestDetails.findByIdAndUpdate(_id, {
            InboundTapFile: InboundTapFile,
            document: document,
            date: date,
          });
          res.send("posted");
        } else {
          const OutboundTapFile = req.body.OutboundTapFile;
          const up = await TestDetails.findByIdAndUpdate(_id, {
            OutboundTapFile: OutboundTapFile,
            document: document,
            date: date,
          });
          res.send("posted");
        }
      } else {
        if (direction === "Inbound") {
          const InboundTapFile = req.body.InboundTapFile;
          ////console.log("InboundTapFile", InboundTapFile);
          const newTest = new TestDetails({
            pname,
            tadig,
            direction,
            sno,
            service,
            document,
            InboundTapFile,
            date,
            country
          });
          ////console.log("newTest", newTest);
          newTest.save();
          res.send("posted");
        } else {
          const OutboundTapFile = req.body.OutboundTapFile;
          const newTest = new TestDetails({
            pname,
            tadig,
            direction,
            sno,
            service,
            document,
            OutboundTapFile,
            date,
            country
          });
          ////console.log("newTest", newTest);
          newTest.save();
          res.send("posted");
        }
      }
    }
  }
);

router.get("/sendMail", async (req, res) => {
  try {
    ////console.log("connected");
    const tadig = req.query.pname;
    const direction = req.query.direction;
    const name = req.query.name;
    ////console.log("name", tadig, "direction", direction, "query", req.query);
    const viewTest = await TestDetails.find({ tadig, direction }).exec();
    // const data = await Addcr.findOne({ tadig });
    // ////console.log("data", data);
    if (viewTest) {
      const data = await Addcr.findOne({ tadig });
      if (data) {
        ////console.log("hi");
        let message = "<p> Dear Colleagues,</p>";
        message +=
          "<p> I am writing to inform you that we have completed the testing of our roaming services with your network. Attached, you will find the necessary test documents and table below that include the services tested, test dates, and the corresponding TAP file names. </p>";
        if (direction === "Outbound") {
          const data = req.query.data;
          message +=
            "<br>" +
            '<table style="border: 1px solid #333;">' +
            "<thead>" +
            '<th style="border: 1px solid #333;"> Service</th>' +
            '<th style="border: 1px solid #333;"> Test Dates </th>' +
            '<th style="border: 1px solid #333;"> TAP File Name </th> ' +
            "</thead>";
          for (const { service, date, OutboundTapFile } of data) {
            message +=
              '<tr style="border: 1px solid #333;">' +
              '<td style="border: 1px solid #333;">' +
              service +
              "</td>" +
              '<td style="border: 1px solid #333;">' +
              date +
              "</td>" +
              '<td style="border: 1px solid #333;">' +
              OutboundTapFile +
              "</td>" +
              '</tr style="border: 1px solid #333;">';
          }
        } else if (direction === "Inbound") {
          ////console.log("hhh");
          const data = req.query.data;
          ////console.log("data", data);
          message +=
            "<br>" +
            '<table style="border: 1px solid #333;">' +
            "<thead>" +
            '<th style="border: 1px solid #333;"> Service</th>' +
            '<th style="border: 1px solid #333;"> Test Dates </th>' +
            '<th style="border: 1px solid #333;"> TAP File Name </th> ' +
            "</thead>";
          for (const { service, date, InboundTapFile } of data) {
            message +=
              '<tr style="border: 1px solid #333;">' +
              '<td style="border: 1px solid #333;">' +
              service +
              "</td>" +
              '<td style="border: 1px solid #333;">' +
              date +
              "</td>" +
              '<td style="border: 1px solid #333;">' +
              InboundTapFile +
              "</td>" +
              '</tr style="border: 1px solid #333;">';
          }
        }
        message +=
          "</table>" +
          // "<br>" +
          "<p> We are pleased to report that the testing was successful, and we are now ready to move forward with the implementation of the roaming services between our networks. </p>" +
          "<p> To proceed with the integration, we kindly request that you provide us with the TCC (Test Completion Certificate) for the testing that we have completed. </p>" +
          "<p> Please let us know if you require any further information or if you have any questions about the testing or the TCC. We look forward to your response and to continuing our successful partnership. </p>" +
          "<p> Thank you for your cooperation and support. </p>" +
          "<p> Best regards, </p>" +
          `<p> ${name} </p>`+
          "<p> STC Roaming Co-ordinator </p>"
        // ////console.log("email");
        const email = data.spocDetail.map((m) => m.mail);
        let subject = "";
        if (direction === "Inbound") {
          subject = `Completion of Inbound Testing for ${req.query.service} and Request for TCC (${tadig})`;
        } else {
          subject = ` Completion of Outbound Testing for ${req.query.service} and Request for TCC  (${tadig})`;
        }
        let attachments = [];
        for (let i = 0; i < viewTest.length; i++) {
          ////console.log("i", i, viewTest[i].document);
          let obj = {};
          obj["filename"] = viewTest[i].document;
          obj["path"] = `uploads/docs/${viewTest[i].document}`;
          obj["contentType"] = "application/pdf";
          // ////console.log(obj);
          attachments.push(obj);
        }
        // ////console.log("attach", attachments);
        // ////console.log("message", message);
        await testSendEmail(email, subject, message, attachments);
        res.send(viewTest);
      }
    }
  } catch (e) {
    res.send(e);
  }
});

router.get("/", async (req, res) => {
  try {
    const viewTest = await TestDetails.aggregate([
      {
        $match: {
          document: { $exists: true },
        },
      },
    ]);
    res.send(viewTest);
  } catch (e) {
    res.send(e);
  }
});

router.get("/tcc", async (req, res) => {
  try {
    const viewTest = await Ppmodel.find({
      testedService: { $not: { $size: 0 } },
      $nor: [
        { TccOutbound: { $exists: true } },
        { TccInbound: { $exists: true } }
      ]
    });
    res.send(viewTest);
  } catch (e) {
    res.send(e);
  }
});

router.get("/join1", async (req, res) => {
  try {
    const viewTest = await TestDetails.aggregate([
      {$match: {
        TCC: null,
      }},
      {
        $group: {          
          _id: { tadig: "$tadig", direction: "$direction" },
          tadig: {
            $first: "$tadig",
          },
          direction: {
            $first: "$direction",
          },
          service: { $push: "$service" },
          document: { $push: "$document" },
          date: { $push: "$date" },         
          tapin:{ $push: "$InboundTapFile" }, 
          tapout:{ $push: "$OutboundTapFile" },
          pname: { $first: "$pname" },
        },
      },
      // {
      //   $lookup: {
      //     from: "ppmodels",
      //     localField: "_id.tadig",
      //     foreignField: "roamPartner",
      //     as: "ppmodel",
      //   },
      // },
      // {
      //   $addFields: {
      //     tcc: {
      //       $cond: {
      //         if: { $eq: ["$direction", "Inbound"] },
      //         then: { $arrayElemAt: ["$ppmodel.TccInbound", 0] },
      //         else: { $arrayElemAt: ["$ppmodel.TccOutbound", 0] },
      //       },
      //     },
      //     tccDate: {
      //       $cond: {
      //         if: { $eq: ["$direction", "Inbound"] },
      //         then: { $arrayElemAt: ["$ppmodel.TccInboundDate", 0] },
      //         else: { $arrayElemAt: ["$ppmodel.TccOutboundDate", 0] },
      //       },
      //     },
      //     country: { $arrayElemAt: ["$ppmodel.country", 0] },
      //   },
      // },
      // {
      //   $match: {
      //     $nor: [
      //          { TCC: { $exists: true } },
      //         //  { TCC: { $exists: true } }
      //    ]
      //   },
      // },
      {
        $project: {
          _id: 0,
          tadig: 1,
          direction: 1,
          service: 1,
          document: 1,
          date:1,
          tapin:1,
          tapout:1,
          pname: 1,
          // tcc: 1,
          // tccDate: 1,
          // country: 1,
        },
      },
    ]);

    res.send(viewTest);
  } catch (e) {
    res.send(e);
  }
});

router.get("/join", async (req, res) => {
  try {
    const viewTest = await TestDetails.aggregate([
      {
        $group: {
          _id: { tadig: "$tadig", direction: "$direction" },
          tadig: {
            $first: "$tadig",
          },
          direction: {
            $first: "$direction",
          },
          service: { $push: "$service" },
          document: { $push: "$document" },
          pname: { $first: "$pname" },
        },
      },
      {
        $lookup: {
          from: "ppmodels",
          localField: "_id.tadig",
          foreignField: "roamPartner",
          as: "ppmodel",
        },
      },
      {
        $addFields: {
          tcc: {
            $cond: {
              if: { $eq: ["$direction", "Inbound"] },
              then: { $arrayElemAt: ["$ppmodel.TccInbound", 0] },
              else: { $arrayElemAt: ["$ppmodel.TccOutbound", 0] },
            },
          },
          tccDate: {
            $cond: {
              if: { $eq: ["$direction", "Inbound"] },
              then: { $arrayElemAt: ["$ppmodel.TccInboundDate", 0] },
              else: { $arrayElemAt: ["$ppmodel.TccOutboundDate", 0] },
            },
          },
          country: { $arrayElemAt: ["$ppmodel.country", 0] },
        },
      },
      {
        $match: {
          tcc: { $exists: true },
        },
      },
      {
        $project: {
          _id: 0,
          tadig: 1,
          direction: 1,
          service: 1,
          document: 1,
          pname: 1,
          tcc: 1,
          tccDate: 1,
          country: 1,
        },
      },
    ]);

    res.send(viewTest);
  } catch (e) {
    res.send(e);
  }
});

router.post("/sendTestingReminder", async (req, res) => {
  try {
    const tadig = req.body.pname;
    const name = req.body.name;
    ////console.log("connected", tadig);
    const data = await Addcr.findOne({ tadig });
    ////console.log("data", data);
    if (data) {
      const subject = `Reminder for testing for ${req.body.service}`;
      let message = "<p> Dear Colleagues,</p>";
      message +=
        "<p> I hope this email finds you well. I am writing to follow up on the testing that we have been conducting together. </p>" +
        "<p> I understand that testing can be a complex process, and there may be challenges that arise along the way. However, it is important that we work together to ensure that the testing is completed. </p>" +
        "<p> Therefore, I would like to request you to kindly expedite the testing process and provide us with the test results as soon as possible. If you require any assistance or clarification on this matter, please do not hesitate to let us know. </p>" +
        "<p> We value our partnership with you and appreciate your cooperation in this matter. Thank you for your attention to this matter. </p>" +
        "<p> Best regards, </p>" +
        `<p> ${name} </p>`+
        "<p> STC Roaming Co-ordinator"
      const email = data.spocDetail.map((m) => m.mail);
      await ppsendEmail(email, subject, message);
      res.send("email sent");
    }
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
