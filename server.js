const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/dist"));

app.listen(3333, () => {
  console.log("binance-spot on port", 3333);
});
