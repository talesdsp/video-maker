const robots = {
  state: require("./robots/state"),
  userInput: require("./robots/user-input"),
  text: require("./robots/text")
};

async function start() {
  robots.userInput();
  await robots.text();

  const content = robots.state.load();
  console.dir(content, {depth: null});
}

start();
