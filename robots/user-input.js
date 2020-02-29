const readline = require("readline-sync");
const state = require("./state");

function robot() {
  const content = {
    maximum_sentences: 7,
    search_term: askAndReturnSearchTerm(),
    prefix: askAndReturnPrefix()
  };

  state.save(content);
}

function askAndReturnSearchTerm() {
  return readline.question("Type wiki term: ");
}

function askAndReturnPrefix() {
  const prefixes = ["Who is", "What is", "The history of"];
  const selectedPrefixIndex = readline.keyInSelect(prefixes, "Choose one option");
  const selectedPrefixText = prefixes[selectedPrefixIndex];

  return selectedPrefixText;
}

module.exports = robot;
