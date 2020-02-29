const robots = {
  state: require("./robots/state"),
  userInput: require("./robots/user-input"),
  text: require("./robots/text"),
  images: require("./robots/images")
};

async function start() {
  // robots.userInput();
  // await robots.text();
  await robots.images();

  const content = robots.state.load();
  console.dir(content, {depth: null});
}

start();
