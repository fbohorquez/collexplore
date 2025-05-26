// backend/server.js
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3001;



app.get("/", (req, res) => {
	res.send("Backend Running");
});

app.get("/app", (req, res) => {
  app.use(express.static(path.join(__dirname, "../../build")));
	res.sendFile(path.resolve(__dirname, "../../build", "index.html"));
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});





