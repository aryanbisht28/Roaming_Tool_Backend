const router = require("express").Router();
const Addcr = require("../models/addCr");
const Details = require("../models/detail");
const multer = require("multer");
const sendDetail = require("../utils/SendData");
const crsendEmail = require("../utils/crSendEmail")

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

router.post("/sendInfoMAil", async (req, res) => {
  const AA12 = req.body.AA12;
  const AA13 = req.body.AA13;
  const AA14 = req.body.AA14;
  const IR21 = req.body.IR21;
  const pname = req.body.pname;
  const tadig = req.body.tadig;
  const spocDetail = req.body.spocDetail;
  const to = req.body.to;
  const cc = req.body.cc;
  let attachments = [];
  //AA12
  if(AA12){

    let objAA12 = {};
    objAA12["filename"] = AA12;
    objAA12["path"] = `uploads/docs/${AA12}`;
    objAA12["contentType"] = "application/pdf";
    attachments.push(objAA12);
  }
  //AA13
  if(AA13){
    let objAA13 = {};
    objAA13["filename"] = AA13;
    objAA13["path"] = `uploads/docs/${AA13}`;
    objAA13["contentType"] = "application/pdf";
    attachments.push(objAA13);
    
  }
  //AA14
  if(AA14){

    let objAA14 = {};
    objAA14["filename"] = AA14;
    objAA14["path"] = `uploads/docs/${AA14}`;
    objAA14["contentType"] = "application/pdf";
    attachments.push(objAA14);
  }
  //IR21
  if(IR21){
    let objIR21 = {};
    objIR21["filename"] = IR21;
    objIR21["path"] = `uploads/docs/${IR21}`;
    objIR21["contentType"] = "application/pdf";
    attachments.push(objIR21);
  }
  //console.log('attach',attachments)
  let message =
    "<p> Dear Colleagues ,</p>" +
    "<p>I hope this email finds you well. Sending to the details for </p>" +
    "<p>Roaming Partner Name :- " +
    pname +
    "</p>" +
    "<p>Tadig:- " +
    tadig +
    "</p>";
  message +=
    '<table style="border: 1px solid #333;">' +
    "<thead>" +
    '<th style="border: 1px solid #333;"> Name</th>' +
    '<th style="border: 1px solid #333;"> Contact </th>' +
    '<th style="border: 1px solid #333;"> Mail </th> ' +
    '<th style="border: 1px solid #333;"> Address </th> ' +
    "</thead>"
  for (const { name, contact, mail, address } of spocDetail) {
    message +=
      '<tr style="border: 1px solid #333;">' +
      '<td style="border: 1px solid #333;">' +
      name +
      "</td>" +
      '<td style="border: 1px solid #333;">' +
      contact +
      "</td>" +
      '<td style="border: 1px solid #333;">' +
      mail +
      "</td>" +
      '<td style="border: 1px solid #333;">' +
      address +
      "</td>" +
      '</tr style="border: 1px solid #333;">'
  }
  let message1=  message +
    "</table>" +
    "<p>We are also attaching the documents for your reference.</p>" +
    "<p>Thank you for your patience and cooperation throughout this process.</p>" +
    "<p>Best regards,</p>" +
    "<p>" +
    req.body.name +
    "</p>" +
    "<p>STC Roaming Co-ordinator</p>" 
    // //console.log('mess',message1)
  await sendDetail(to, cc, `Commercial Review Data ${tadig}`, message1, attachments);
  res.send("posted");
});


router.post(
  "/",
  upload.fields([
    { name: "AA12", maxCount: 1 },
    { name: "AA13", maxCount: 1 },
    { name: "AA14", maxCount: 1 },
    { name: "IR21", maxCount: 1 },
  ]),
  async (req, res) => {
    const AA12 = req.files["AA12"]
      ? req.files["AA12"][0].filename
      : req.body.AA12;
    const AA13 = req.files["AA13"]
      ? req.files["AA13"][0].filename
      : req.body.AA13;
    const AA14 = req.files["AA14"]
      ? req.files["AA14"][0].filename
      : req.body.AA14;
    const IR21 = req.files["IR21"]
      ? req.files["IR21"][0].filename
      : req.body.IR21;
    const pname = req.body.pname;
    const tadig = req.body.tadig;
    const spocDetail = JSON.parse(req.body.spocDetail);
    const det = await Details.findOne({ tadig });
    //console.log("details", det);
    if (det) {
      const country = det.country;
      const MC = det.MCC;
      const MNC = det.MNC;
      let MCC = "";
      //console.log("type of", typeof MNC);
      if (parseInt(MNC) < 10) {
        let MN = `0${MNC}`;
        //console.log("mn", MN);
        MCC = MC + MN;
      } else {
        MCC = MC + MNC;
      }

      // //console.log(country,MCC,MNC)
      const email = spocDetail.map((data) => data.mail);
      const newAddcr = new Addcr({
        pname,
        tadig,
        AA12,
        AA13,
        AA14,
        IR21,
        spocDetail,
        MCC,
        country,
      });
      newAddcr.save();
      let attachments = [];
  //AA12
  if(AA12){

    let objAA12 = {};
    objAA12["filename"] = AA12;
    objAA12["path"] = `uploads/docs/${AA12}`;
    objAA12["contentType"] = "application/pdf";
    attachments.push(objAA12);
  }
  //AA13
  if(AA13){
    let objAA13 = {};
    objAA13["filename"] = AA13;
    objAA13["path"] = `uploads/docs/${AA13}`;
    objAA13["contentType"] = "application/pdf";
    attachments.push(objAA13);
    
  }
  //AA14
  if(AA14){

    let objAA14 = {};
    objAA14["filename"] = AA14;
    objAA14["path"] = `uploads/docs/${AA14}`;
    objAA14["contentType"] = "application/pdf";
    attachments.push(objAA14);
  }
  //IR21
  if(IR21){
    let objIR21 = {};
    objIR21["filename"] = IR21;
    objIR21["path"] = `uploads/docs/${IR21}`;
    objIR21["contentType"] = "application/pdf";
    attachments.push(objIR21);
  }
      let message =
        "<p> Dear Colleagues, </p>" +
        "<p>I hope this email finds you well.I am writing to inform you that the commercial review for our proposed roaming partnership has been completed from our side. We are pleased to let you know that we are now ready to move forward with the testing phase of the partnership.</p>" +
        "<p>We appreciate your cooperation during the commercial review process and we believe that this partnership will be mutually beneficial for both our companies. We are excited to work with you and bring the best possible service to our customers.</p>" +
        "<p>As we move into the testing phase, we will keep you updated on our progress and any developments. Our team will be in touch with you shortly to coordinate the testing process and to discuss any further requirements or concerns that you may have.</p>" +
        "<p>Thank you for your patience and cooperation throughout this process. We look forward to a successful partnership with you.</p>" +
        "<p>Best regards,</p>" +
        "<p>" +
        req.body.name +
        "</p>"+
        "<p>" +
        "STC Roaming Co-ordinator" +
        "</p>"
        let subject=`New Commercial Review (${tadig})`
      await crsendEmail(email,subject, message,attachments);
      res.send("posted");
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const viewCrData = await Addcr.find();
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewCrData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/country", async (req, res) => {
  try {
    const viewCrData = await Addcr.aggregate([
      [{ $group: { _id: "$country", count: { $sum: 1 } } }],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewCrData);
    //console.log(viewCrData);
  } catch (e) {
    res.send(e);
  }
});

router.get("/count", async (req, res) => {
  try {
    const viewCrData = await Addcr.aggregate([
      [
        {
          $count: "createdAt",
        },
      ],
    ]);
    // //console.log("ViewCr Called", viewCrData);
    res.send(viewCrData);
    //console.log(viewCrData);
  } catch (e) {
    res.send(e);
  }
});

router.put(
  "/:id",
  upload.fields([
    { name: "AA12", maxCount: 1 },
    { name: "AA13", maxCount: 1 },
    { name: "AA14", maxCount: 1 },
    { name: "IR21", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // //console.log(req);
      const _id = req.params.id;
      const AA12 = req.files["AA12"]
        ? req.files["AA12"][0].filename
        : req.body.AA12;
      const AA13 = req.files["AA13"]
        ? req.files["AA13"][0].filename
        : req.body.AA13;
      const AA14 = req.files["AA14"]
        ? req.files["AA14"][0].filename
        : req.body.AA14;
      const IR21 = req.files["IR21"]
        ? req.files["IR21"][0].filename
        : req.body.IR21;
      Addcr.findByIdAndUpdate(
        _id,
        {
          spocDetail: JSON.parse(req.body.spocDetail),
          AA12: AA12,
          AA13: AA13,
          AA14: AA14,
          IR21: IR21,
        },
        function (err, docs) {
          if (err) {
            //console.log(err);
          } else {
            res.send("updated");
          }
        }
      );
    } catch (e) {
      res.send(e);
    }
  }
);
module.exports = router;
