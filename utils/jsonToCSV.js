// Import the necessary modules
const fs = require("fs");
const { parse } = require("json2csv");

const writeToCsv = (data, fields, filePath) => {
  const csv = parse(data, { fields });
  fs.writeFileSync(filePath, csv, "utf-8");
};

module.exports = { writeToCsv };
