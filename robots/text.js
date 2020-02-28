const Algorithmia = require("algorithmia");
const SentenceBoundaryDetection = require("sbd");
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey;

async function robot(content) {
  await fetchContentFromWikipedia(content);
  sanitizeContent(content);
  breakContentIntoSentences(content);
}

async function fetchContentFromWikipedia(content) {
  const response = await Algorithmia.client(algorithmiaApiKey)
    .algo("web/WikipediaParser/0.1.2?timeout=300")
    .pipe(content.searchTerm);

  content.sourceContentOriginal = await response.get().content;
}

function sanitizeContent(content) {
  const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content).join(" ");
  const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown);

  content.sourceContentSanitized = withoutDatesInParentheses;
}

function removeBlankLinesAndMarkdown(content) {
  const allLines = content.sourceContentOriginal.split("\n");

  return allLines.filter((line) =>
    line.trim().length === 0 || line.trim().startsWith("=") ? false : true
  );
}
0;
function removeDatesInParentheses(text) {
  return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, "").replace(/  /g, " ");
}

function breakContentIntoSentences(content) {
  content.sentences = [];
  const sentences = SentenceBoundaryDetection.sentences(content.sourceContentSanitized);
  sentences.forEach((v) => {
    content.sentences.push({
      text: v,
      keywords: [],
      images: []
    });
  });
}
module.exports = robot;
