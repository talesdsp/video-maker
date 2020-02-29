const robots = {
  userInput: require("./robots/user-input"),
  text: require("./robots/text")
};

async function start() {
  const content = {
    maximum_sentences: 7
  };
  robots.userInput(content);
  await robots.text(content);
}

start();
