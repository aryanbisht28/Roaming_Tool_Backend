const router = require("express").Router();
const { User, validate } = require("../models/user");
const bcrypt = require("bcryptjs");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

router.post("/", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error){
      return res.status(400).send({ message: error.details[0].message });
    }
    let user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(409).send({ message: "User with given email already Exist!" });

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({ ...req.body, password: hashPassword }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}users/${user._id}/verify/${token.token}`;
    await sendEmail(user.email, "Verify Email", url);

    res.status(201).send({ message: "An Email sent to your account please verify" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error1" });
  }
});

router.get("/:id/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    ////console.log(user)
    if (!user){ 

    return res.status(400).send({ message: "Invalid Link" });
  }
  ////console.log(user._id)
  ////console.log(req.params.token)
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    ////console.log(token)
    if (!token){
     
      return res.status(400).send({ message: "invalid link" });
    }

   
    const var1 = await User.updateOne({ _id: user._id},{$set: {verified: true}});
    
    ////console.log(var1);

    await token.remove();

    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error2" });
  }
});

router.put("/", async (req, res) => {
  try {
	////console.log('hi',req.body.password.length)
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    if (password.length >0) {
		////console.log('pass')
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashPassword = await bcrypt.hash(req.body.password, salt);
      const user = await User.findOne({ email });
      ////console.log("connected", firstName, lastName, req.body);
      if (user) {
        const _id = user["_id"];
        User.findByIdAndUpdate(
          _id,
          {
            ...req.body,
            password: hashPassword,
          },
          function (err, docs) {
            if (err) {
              ////console.log(err);
            } else {
              res.send("updated");
            }
          }
        );
      }
    } else {
      const user = await User.findOne({ email });
      ////console.log("without pass", firstName, lastName, req.body);
      if (user) {
        const _id = user["_id"];

        User.findByIdAndUpdate(
          _id,
          {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: req.body.phone,
            company: req.body.company,
            desig: req.body.desig,
            gender: req.body.gender,
          },
          function (err, docs) {
            if (err) {
              ////console.log(err);
            } else {
              res.send("updated");
            }
          }
        );
      }
    }

    // res.send("hi");
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error2" });
  }
});

module.exports = router;
