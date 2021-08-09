let app = require("./src/app.json");

app.version++;
app.createdAt = new Date();

require("fs").writeFileSync(
  __dirname + "/src/app.json",
  JSON.stringify(app, null, 2)
);
