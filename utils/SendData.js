const nodemailer = require("nodemailer");

module.exports = async (to,cc, subject, message,attachments) => {
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
			to: to,
            cc:cc,
			subject: subject,
            html:message,
            attachments: attachments,
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		// return error;
	}
};