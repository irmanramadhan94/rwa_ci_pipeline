const path = require("path");
const express = require("express");
import history from "connect-history-api-fallback";
const setupProxy = require("../src/setupProxy");
const { frontendPort } = require("../src/utils/portUtils");

const app = express();

setupProxy(app);

app.use(history());
app.use(express.static(path.join(__dirname, "../build")));

app.listen(frontendPort);
