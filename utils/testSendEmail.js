const nodemailer = require("nodemailer");
const ccmail = [];
ccmail.push(process.env.CC);
ccmail.push(process.env.CC1);
// console.log(ccmail)
module.exports = async (email, subject, message, attachments) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      cc: ccmail,
      subject: subject,
      html: message,
      attachments: attachments,
    });
    console.log("email sent successfully");
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
    // return error;
  }
};
