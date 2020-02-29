const state = require("./state");
const imageDownloader = require("image-downloader");
const google = require("googleapis").google;
const customSearch = google.customsearch("v1");

const googleSearchCredentials = require("../credentials/google-search.json");

async function robot() {
  const content = state.load();

  await fetchImagesOfAllSentences(content);

  await downloadAllImages(content);
  state.save(content);
}

async function fetchImagesOfAllSentences(content) {
  for (const sentence of content.sentences) {
    const query = `${content.search_term} ${sentence.keywords[0]}`;
    sentence.images = await fetchGoogleAndReturnImagesLinks(query);
    sentence.googleSearch = query;
  }
}

async function fetchGoogleAndReturnImagesLinks(query) {
  const response = await customSearch.cse.list({
    auth: googleSearchCredentials.apiKey,
    cx: googleSearchCredentials.searchEngineId,
    q: query,
    searchType: "image",
    num: 2
  });

  const imagesUrl = response.data.items.map((item) => item.link);

  return imagesUrl;
}

async function downloadAllImages(content) {
  content.downloadedImages = [];

  for (let i = 0; i < content.sentences.length; i++) {
    const images = content.sentences[i].images;

    for (let j = 0; j < images.length; j++) {
      const imageUrl = images[j];
      try {
        if (content.downloadedImages.includes(imageUrl)) {
          throw new Error("Image already exists");
        }
        await downloadAndSave(imageUrl, `${i}-original.png`);
        content.downloadedImages.push(imageUrl);
        console.log(`-> Download successfully [${i}][${j}] ${imageUrl}`);
        break;
      } catch (err) {
        console.log(`-> Error on download [${i}][${j}] ${imageUrl}: ${err}`);
      }
    }
  }
}

async function downloadAndSave(url, filename) {
  imageDownloader.image({
    url,
    dest: `./content/${filename}`
  });
}

module.exports = robot;
