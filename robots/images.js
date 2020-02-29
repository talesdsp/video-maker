const state = require("./state");
const imageDownloader = require("image-downloader");
const google = require("googleapis").google;
const customSearch = google.customsearch("v1");
const gm = require("gm").subClass({imageMagick: true});

const googleSearchCredentials = require("../credentials/google-search.json");

async function robot() {
  const content = state.load();
  await fetchImagesOfAllSentences(content);
  await downloadAllImages(content);
  await convertAllImages(content);
  await createAllSentences(content);
  await createYoutubeThumbnail();
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

async function convertAllImages(content) {
  for (let i = 0; i < content.sentences.length; i++) {
    await convertImage(i);
  }
}

async function convertImage(sentence) {
  return new Promise((resolve, reject) => {
    const inputFile = `./content/${sentence}-original.png[0]`;
    const outputFile = `./content/${sentence}-converted.png`;
    const width = 1920;
    const height = 1080;

    gm()
      .in(inputFile)
      .out("(")
      .out("-clone")
      .out("0")
      .out("-background", "white")
      .out("-blur", "0x9")
      .out("-resize", `${width}x${height}^`)
      .out(")")
      .out("(")
      .out("-clone")
      .out("0")
      .out("-background", "white")
      .out("-resize", `${width}x${height}`)
      .out(")")
      .out("-delete", "0")
      .out("-gravity", "center")
      .out("-compose", "over")
      .out("-composite")
      .out("-extent", `${width}x${height}`)
      .write(outputFile, (error) => {
        if (error) {
          return reject(error);
        }

        console.log(`> [video-robot] Image converted: ${outputFile}`);
        resolve();
      });
  });
}

async function createAllSentences(content) {
  for (let sentence = 0; sentence < content.sentences.length; sentence++) {
    await createSentenceImage(sentence, content.sentences[sentence].text);
  }
}

async function createSentenceImage(sentence, text) {
  return new Promise((resolve, reject) => {
    const outputFile = `./content/${sentence}-sentence.png`;

    const templateSettings = {
      0: {
        size: "1920x400",
        gravity: "center"
      },
      1: {
        size: "1920x1080",
        gravity: "center"
      },
      2: {
        size: "800,1080",
        gravity: "west"
      },
      3: {
        size: "1920x400",
        gravity: "center"
      },
      4: {
        size: "1920x1080",
        gravity: "center"
      },
      5: {
        size: "800x1080",
        gravity: "west"
      },
      6: {
        size: "1920x400",
        gravity: "center"
      }
    };

    gm()
      .out("-size", templateSettings[sentence].size)
      .out("-gravity", templateSettings[sentence].gravity)
      .out("-background", "transparent")
      .out("-fill", "white")
      .out("-kerning", "-1")
      .out(`caption:${text}`)
      .write(outputFile, (err) => {
        if (err) {
          reject(err);
        }
        console.log(`-> Created Sentence: ${outputFile}`);
        resolve();
      });
  });
}

async function createYoutubeThumbnail() {
  return new Promise((resolve, reject) => {
    gr()
      .in("./content/0-converted.png")
      .write("./content/youtube-thumbnail.jpg", (error) => {
        if (error) {
          reject(error);
        }
        console.log("-> Youtube Thumbnail Created");
        resolve();
      });
  });
}

module.exports = robot;
