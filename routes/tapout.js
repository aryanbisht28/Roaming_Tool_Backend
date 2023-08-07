const router = require("express").Router();
const tapout = require("../models/tapoutData");
// common routes

router.get("/", async (req, res) => {
  try {
    let ribbon = await tapout.aggregate([
      [
        {
          $group: {
            _id: "$Country",

            senderNames: {
              $addToSet: "$SENDERNAME",
            },

            total: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            total: -1,
          },
        },

        {
          $project: {
            _id: 0,

            Country: "$_id",

            senderNames: 1,

            total: 1,
          },
        },

        {
          $limit: 10,
        },
      ],
    ]);

    let totalGROSSSDR = await tapout.aggregate([
      {
        $group: {
          _id: null,

          totalGROSSSDR: { $sum: "$GROSSSDR" },
        },
      },
    ]);

    let countofcdr = await tapout.aggregate([
      {
        $group: {
          _id: null,

          countofcdr: { $sum: "$COUNTOFCDR" },
        },
      },
    ]);

    let tax = await tapout.aggregate([
      {
        $group: {
          _id: null,

          TAXUSD: { $sum: "$TAXUSD" },
        },
      },
    ]);

    let countries = await tapout.aggregate([
      {
        $group: {
          _id: "$Country",
        },
      },

      {
        $project: {
          _id: 0,

          country: "$_id",
        },
      },
    ]);

    let roamingPartner = await tapout.aggregate([
      {
        $group: {
          _id: "$OPERATORTADIG",
        },
      },

      {
        $project: {
          _id: 0,

          roam: "$_id",
        },
      },
    ]);

    let TAPINFILENAME = await tapout.find();

    let totalgross = totalGROSSSDR[0]["totalGROSSSDR"];

    let countcdr = countofcdr[0]["countofcdr"];

    let countryCount = countries.length;

    let TAXUSD = tax[0]["TAXUSD"];

    let roamPart = roamingPartner.length;

    let tapfilecount = TAPINFILENAME.length;

    res.send({
      roamPart,

      countcdr,

      tapfilecount,

      totalgross,

      countryCount,

      TAXUSD,

      ribbon,
    });
  } catch (e) {
    res.send(e);
  }
});

router.get("/countadig", async (req, res) => {
  try {
    let countries = await tapout.aggregate([
      {
        $group: {
          _id: "$Country",
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id",
        },
      },
    ]);
    let tadig = await tapout.aggregate([
      {
        $group: {
          _id: "$OPERATORTADIG",
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
        },
      },
    ]);
    let date = await tapout.aggregate([
      {
        $addFields: {
          created_at: {
            $toDate: "$FIRSTCALLDATE",
          },
        },
      },
      {
        $group: {
          _id: "$created_at",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          count: 0,
          _id: 1,
        },
      },
    ]);
    res.send([countries, tadig, date]);
  } catch (e) {
    res.send(e);
  }
});

//filter

router.post("/mocfiltercountry", async (req, res) => {
  try {
    ////console.log("req", req.body.country);
    let tadig = await tapout.aggregate([
      {
        $match: {
          Country: req.body.country,
        },
      },
      {
        $group: {
          _id: "$OPERATORTADIG",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
        },
      },
    ]);

    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxGROSSSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);

    let moctotalduration = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MOCTOTALDURATION" },
        },
      },
    ]);
    let MOCCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          MOCCOUNT: { $sum: "$MOCCOUNT" },
        },
      },
    ]);
    let MOCTOTALSDR = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          MOCTOTALSDR: { $sum: "$MOCTOTALSDR" },
        },
      },
    ]);

    let tapcount = await tapout.aggregate([
      {
        $match: {
          country: req.body.country,
        },
      },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$MOCCOUNT" },
          maxMTCTOTALSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      tadig,
      countries,
      moctotalduration,
      MOCCOUNT,
      MOCTOTALSDR,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/mocfiltertadig", async (req, res) => {
  try {
    ////console.log("req", req.body.tadig, req.body);
    ////console.log("req", req.body.country);

    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);

    let moctotalduration = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MOCTOTALDURATION" },
        },
      },
    ]);
    let MOCCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          MOCCOUNT: { $sum: "$MOCCOUNT" },
        },
      },
    ]);
    let MOCTOTALSDR = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          MOCTOTALSDR: { $sum: "$MOCTOTALSDR" },
        },
      },
    ]);

    let tapcount = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$MOCCOUNT" },
          maxMTCTOTALSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      countries,
      moctotalduration,
      MOCCOUNT,
      MOCTOTALSDR,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/mtcfiltercountry", async (req, res) => {
  try {
    ////console.log("req", req.body.country);
    let tadig = await tapout.aggregate([
      {
        $match: {
          Country: req.body.country,
        },
      },
      {
        $group: {
          _id: "$OPERATORTADIG",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
        },
      },
    ]);
    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);
    let mtcactualduration = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MTCACTUALDURATION" },
        },
      },
    ]);
    let MTCCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          MTCCOUNT: { $sum: "$MTCCOUNT" },
        },
      },
    ]);
    let MTCTOTALSDR = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          MTCTOTALSDR: { $sum: "$MTCTOTALSDR" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      {
        $match: {
          country: req.body.country,
        },
      },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$MTCCOUNT" },
          maxMTCTOTALSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      tadig,
      countries,
      mtcactualduration,
      MTCCOUNT,
      MTCTOTALSDR,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/mtcfiltertadig", async (req, res) => {
  try {
    ////console.log("req", req.body.tadig, req.body);
    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxGROSSSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);
    let mtcactualduration = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MTCACTUALDURATION" },
        },
      },
    ]);
    let MTCCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          MTCCOUNT: { $sum: "$MTCCOUNT" },
        },
      },
    ]);
    let MTCTOTALSDR = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          MTCTOTALSDR: { $sum: "$MTCTOTALSDR" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      {
        $match: {
          country: req.body.country,
          OPERATORTADIG: req.body.tadig,
        },
      },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$MTCCOUNT" },
          maxMTCTOTALSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 10 },
    ]);
    ////console.log("tap", tap);
    // let tap = TAPINFILENAME.length;
    ////console.log("tadig filter", countries);

    res.send({
      countries,
      mtcactualduration,
      MTCCOUNT,
      MTCTOTALSDR,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/smsmofiltercountry", async (req, res) => {
  try {
    ////console.log("req", req.body.country);
    let tadig = await tapout.aggregate([
      {
        $match: {
          Country: req.body.country,
        },
      },
      {
        $group: {
          _id: "$OPERATORTADIG",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
        },
      },
    ]);

    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);

    let smsmototalsdr = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$SMSMOTOTALSDR" },
        },
      },
    ]);
    let SMSMOCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          SMSMOCOUNT: { $sum: "$SMSMOCOUNT" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      {
        $match: {
          country: req.body.country,
        },
      },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$SMSMOCOUNT" },
          maxMTCTOTALSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      tadig,
      countries,
      smsmototalsdr,
      SMSMOCOUNT,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/smsmofiltertadig", async (req, res) => {
  try {
    ////console.log("req", req.body.country);

    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);

    let smsmototalsdr = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$SMSMOTOTALSDR" },
        },
      },
    ]);
    let SMSMOCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          SMSMOCOUNT: { $sum: "$SMSMOCOUNT" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$SMSMOCOUNT" },
          maxMTCTOTALSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      countries,
      smsmototalsdr,
      SMSMOCOUNT,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/gprsfiltercountry", async (req, res) => {
  try {
    ////console.log("req", req.body.country);
    let tadig = await tapout.aggregate([
      {
        $match: {
          Country: req.body.country,
        },
      },
      {
        $group: {
          _id: "$OPERATORTADIG",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $project: {
          _id: 0,
          tadig: "$_id",
        },
      },
    ]);

    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);

    let gprsactualduration = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSACTUALVOLUME" },
        },
      },
    ]);
    let gprstotalsdr = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSTOTALSDR" },
        },
      },
    ]);
    let GPRSCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: null,
          GPRSCOUNT: { $sum: "$GPRSCOUNT" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      {
        $match: {
          country: req.body.country,
        },
      },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$GPRSCOUNT" },
          maxMTCTOTALSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      tadig,
      countries,
      gprsactualduration,
      gprstotalsdr,
      GPRSCOUNT,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

router.post("/gprsfiltertadig", async (req, res) => {
  try {
    ////console.log("req", req.body.country);
    let countries = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);

    let gprsactualduration = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSACTUALVOLUME" },
        },
      },
    ]);
    let gprstotalsdr = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSTOTALSDR" },
        },
      },
    ]);
    let GPRSCOUNT = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: null,
          GPRSCOUNT: { $sum: "$GPRSCOUNT" },
        },
      },
    ]);
    let tapcount = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
    ]);
    let tap = tapcount.length;
    let MTCTREND = await tapout.aggregate([
      { $match: { Country: req.body.country, OPERATORTADIG: req.body.tadig } },
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$GPRSCOUNT" },
          maxMTCTOTALSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      { $limit: 10 },
    ]);

    res.send({
      countries,
      gprsactualduration,
      gprstotalsdr,
      GPRSCOUNT,
      tap,
      MTCTREND,
    });
  } catch (e) {
    res.send(e);
  }
});

// moc routes

router.get("/summarytopfivemoctotalsdr", async (req, res) => {
  try {
    let countries = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxGROSSSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);
    res.send(countries);
  } catch (e) {
    res.send(e);
  }
});

router.get("/summarytopfivemocduration", async (req, res) => {
  try {
    let countries = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$Country",
          maxMOCTOTALDURATION: { $max: "$MOCTOTALDURATION" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxMOCTOTALDURATION: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);
    res.send(countries);
  } catch (e) {
    res.send(e);
  }
});

router.get("/mocsummary", async (req, res) => {
  try {
    let moctotalduration = await tapout.aggregate([
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MOCTOTALDURATION" },
        },
      },
    ]);
    let MOCCOUNT = await tapout.aggregate([
      {
        $group: {
          _id: null,
          MOCCOUNT: { $sum: "$MOCCOUNT" },
        },
      },
    ]);
    let MOCTOTALSDR = await tapout.aggregate([
      {
        $group: {
          _id: null,
          MOCTOTALSDR: { $sum: "$MOCTOTALSDR" },
        },
      },
    ]);
    let TAPINFILENAME = await tapout.find();
    let tap = TAPINFILENAME.length;

    res.send({ moctotalduration, MOCCOUNT, MOCTOTALSDR, tap });
  } catch (e) {
    res.send(e);
  }
});

router.get("/moctrendanalysis", async (req, res) => {
  try {
    let MOCCOUNT = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMOCCOUNT: { $max: "$MOCCOUNT" },
          maxMOCTOTALSDR: { $max: "$MOCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxMOCCOUNT: -1, maxMOCTOTALSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 10 },
    ]);
    // let MOCTOTALSDR = await tapout.aggregate([
    //   // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
    //   {
    //     $group: {
    //       _id: "$FIRSTCALLDATE",

    //     },
    //   },
    //   // Sort by the maxGROSSSDR value in descending order
    //   { $sort: { maxMOCTOTALSDR: -1 } },
    //   // Limit the result to the top 5 documents
    //   { $limit: 10 },
    // ]);
    res.send(MOCCOUNT);
  } catch (e) {
    res.send(e);
  }
});

//mtc routes

router.get("/mtcsummary", async (req, res) => {
  try {
    let mtcactualduration = await tapout.aggregate([
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$MTCACTUALDURATION" },
        },
      },
    ]);
    let MTCCOUNT = await tapout.aggregate([
      {
        $group: {
          _id: null,
          MTCCOUNT: { $sum: "$MTCCOUNT" },
        },
      },
    ]);
    let MTCTOTALSDR = await tapout.aggregate([
      {
        $group: {
          _id: null,
          MTCTOTALSDR: { $sum: "$MTCTOTALSDR" },
        },
      },
    ]);
    let TAPINFILENAME = await tapout.find();
    let tap = TAPINFILENAME.length;

    res.send({ mtcactualduration, MTCCOUNT, MTCTOTALSDR, tap });
  } catch (e) {
    res.send(e);
  }
});

router.get("/summarytopfivemtctotalsdr", async (req, res) => {
  try {
    let countries = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxGROSSSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);
    res.send(countries);
  } catch (e) {
    res.send(e);
  }
});

router.get("/summarytopfivemtcduration", async (req, res) => {
  try {
    let countries = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$Country",
          maxMTCTOTALDURATION: { $max: "$MTCTOTALDURATION" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxMTCTOTALDURATION: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 5 },
    ]);
    res.send(countries);
  } catch (e) {
    res.send(e);
  }
});

router.get("/mtctrendanalysis", async (req, res) => {
  try {
    let MTCCOUNT = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          maxMTCCOUNT: { $max: "$MTCCOUNT" },
          maxMTCTOTALSDR: { $max: "$MTCTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { maxMTCCOUNT: -1, maxMTCTOTALSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 10 },
    ]);
    res.send(MTCCOUNT);
  } catch (e) {
    res.send(e);
  }
});

// SMSMO routes

router.get("/smsmosummary", async (req, res) => {
  try {
    let smsmototalsdr = await tapout.aggregate([
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$SMSMOTOTALSDR" },
        },
      },
    ]);
    let SMSMOCOUNT = await tapout.aggregate([
      {
        $group: {
          _id: null,
          SMSMOCOUNT: { $sum: "$SMSMOCOUNT" },
        },
      },
    ]);
    let TAPINFILENAME = await tapout.find();
    let tap = TAPINFILENAME.length;

    res.send({ smsmototalsdr, SMSMOCOUNT, tap });
  } catch (e) {
    res.send(e);
  }
});

router.get("/topfivesmsmototalsdr", async (req, res) => {
  try {
    let smsottlsdr = await tapout.aggregate([
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);
    res.send(smsottlsdr);
  } catch (e) {
    res.send(e);
  }
});

router.get("/topfivesmsmocount", async (req, res) => {
  try {
    let smsmocount = await tapout.aggregate([
      {
        $group: {
          _id: "$Country",
          maxSMSMOCOUNT: { $max: "$SMSMOCOUNT" },
        },
      },
      { $sort: { maxSMSMOCOUNT: -1 } },
      { $limit: 5 },
    ]);
    res.send(smsmocount);
  } catch (e) {
    res.send(e);
  }
});

router.get("/smsmotrendanalysis", async (req, res) => {
  try {
    let SMSMOCOUNT = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          SMSMOCOUNT: { $max: "$SMSMOCOUNT" },
          maxSMSMOTOTALSDR: { $max: "$SMSMOTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { SMSMOCOUNT: -1, maxSMSMOTOTALSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 10 },
    ]);
    res.send(SMSMOCOUNT);
  } catch (e) {
    res.send(e);
  }
});

// GPRS routes

router.get("/gprssummary", async (req, res) => {
  try {
    let gprsactualduration = await tapout.aggregate([
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSACTUALVOLUME" },
        },
      },
    ]);
    let gprstotalsdr = await tapout.aggregate([
      {
        $group: {
          _id: null,
          totalduration: { $sum: "$GPRSTOTALSDR" },
        },
      },
    ]);
    let GPRSCOUNT = await tapout.aggregate([
      {
        $group: {
          _id: null,
          GPRSCOUNT: { $sum: "$GPRSCOUNT" },
        },
      },
    ]);
    let TAPINFILENAME = await tapout.find();
    let tap = TAPINFILENAME.length;

    res.send({ gprsactualduration, gprstotalsdr, GPRSCOUNT, tap });
  } catch (e) {
    res.send(e);
  }
});

router.get("/topfivegprsmototalsdr", async (req, res) => {
  try {
    let gprsttlsdr = await tapout.aggregate([
      {
        $group: {
          _id: "$OPERATORTADIG",
          maxGROSSSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      { $sort: { maxGROSSSDR: -1 } },
      { $limit: 5 },
    ]);
    res.send(gprsttlsdr);
  } catch (e) {
    res.send(e);
  }
});

router.get("/topfivegprscount", async (req, res) => {
  try {
    let gprscount = await tapout.aggregate([
      {
        $group: {
          _id: "$Country",
          maxGPRSCOUNT: { $max: "$GPRSCOUNT" },
        },
      },
      { $sort: { maxGPRSCOUNT: -1 } },
      { $limit: 5 },
    ]);
    res.send(gprscount);
  } catch (e) {
    res.send(e);
  }
});

router.get("/gprstrendanalysis", async (req, res) => {
  try {
    let GPRSCOUNT = await tapout.aggregate([
      // Group by the OPERATORTADIG field and calculate the maximum GROSSSDR value
      {
        $group: {
          _id: "$FIRSTCALLDATE",
          GPRSCOUNT: { $max: "$GPRSCOUNT" },
          maxGPRSTOTALSDR: { $max: "$GPRSTOTALSDR" },
        },
      },
      // Sort by the maxGROSSSDR value in descending order
      { $sort: { GPRSCOUNT: -1, maxGPRSTOTALSDR: -1 } },
      // Limit the result to the top 5 documents
      { $limit: 10 },
    ]);
    res.send(GPRSCOUNT);
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
