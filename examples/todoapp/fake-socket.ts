import * as B from "../../src/eggs/eggs";

// Fake server implementation

const items = [
  "buy beer",
  "clean the house",
  "fix the bike",
  "get a lawyer",
  "buy a new shovel",
  "dispose of the corpses in garage",
  "get a haircut",
  "shave more often",
  "post something smart on twitter",
  "understand monad transformers",
  "blow up some things",
  "have fun",
  "visit new reaktor HQ"
];
const randomInterval = () => Math.random() * 10000 + 5000;
const randomItem = () => items[Math.floor(Math.random() * items.length)];

export default B.repeat(() => B.later(randomInterval(), randomItem()));
