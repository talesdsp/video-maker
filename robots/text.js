const fs = require("fs");
const Algorithmia = require("algorithmia");
const SentenceBoundaryDetection = require("sbd");
const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const {IamAuthenticator} = require("ibm-watson/auth");

const WATSON_API_KEY = require("../credentials/watson-nlu.json").apikey;
const ALGORITHMIA_API_KEY = require("../credentials/algorithmia.json").apiKey;

const nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({apikey: WATSON_API_KEY}),
  version: "2018-04-05",
  url: "https://gateway.watsonplatform.net/natural-language-understanding/api/"
});

async function robot(content) {
  await fetchContentFromWikipedia(content);
  sanitizeContent(content);
  breakContentIntoSentences(content);
  lineMaximumSentences(content);
  await fetchKeywordsOfAllSentences(content);
  console.log(content.sentences);
  // content.sentences.forEach((v) => {});
}

async function fetchContentFromWikipedia(content) {
  const response = await Algorithmia.client(ALGORITHMIA_API_KEY)
    .algo("web/WikipediaParser/0.1.2?timeout=300")
    .pipe(content.search_term);

  content.source_content_original = await response.get().content;
}

function sanitizeContent(content) {
  const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content).join(" ");
  const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown);

  content.source_content_sanitized = withoutDatesInParentheses;
}

function removeBlankLinesAndMarkdown(content) {
  const allLines = content.source_content_original.split("\n");

  return allLines.filter((line) =>
    line.trim().length === 0 || line.trim().startsWith("=") ? false : true
  );
}

function removeDatesInParentheses(text) {
  return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, "").replace(/  /g, " ");
}

function breakContentIntoSentences(content) {
  content.sentences = [];
  const sentences = SentenceBoundaryDetection.sentences(content.source_content_sanitized);
  sentences.forEach((v) => {
    content.sentences.push({
      text: v,
      keywords: [],
      images: []
    });
  });
}

function lineMaximumSentences(content) {
  content.sentences = content.sentences.slice(0, content.maximum_sentences);
}

async function fetchKeywordsOfAllSentences(content) {
  for (const sentence of content.sentences) {
    sentence.keywords = [...(await fetchWatsonAndReturnKeywords(sentence.text))];
  }
}

async function fetchWatsonAndReturnKeywords(sentence) {
  return new Promise((resolve, reject) => {
    nlu.analyze(
      {
        text: sentence,
        features: {
          keywords: {}
        }
      },
      (error, response) => {
        if (error) {
          throw error;
        }

        const keywords = response.result.keywords.map((k) => k.text);

        resolve(keywords);
      }
    );
  });
}

module.exports = robot;
