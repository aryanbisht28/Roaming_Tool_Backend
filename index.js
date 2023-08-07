require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");

// database connection
connection();

// middlewares
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

//commercial reiew routes
app.use("/uploads", express.static("uploads"));
app.use("/addCr", require("./routes/commercialReview"));

// partner provisioning routes
app.use("/ppini", require("./routes/partnerProvisioning"));
app.use("/simRepo", require("./routes/simRepo"));

//testing routes
app.use("/testing", require("./routes/testing"));

//subscriber provisionig routes
app.use("/subs", require("./routes/subsProvision"));

// chargeable event generation
app.use("/ChargeableEventGeneration", require("./routes/tapout"));
app.use("/ChargeableEventGeneration/tapin", require("./routes/tapin"));

const port = process.env.PORT || 8080;
app.listen(port, console.log(`Listening on port ${port}...`));
