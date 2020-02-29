const fs = require("fs");
const contentFilePath = "./content/content.json";

function save(content) {
  const contentString = JSON.stringify(content);
  return fs.writeFileSync(contentFilePath, contentString);
}

function load() {
  const fileBuffer = fs.readFileSync(contentFilePath, "utf-8");
  return JSON.parse(fileBuffer);
}

module.exports = {
  save,
  load
};
