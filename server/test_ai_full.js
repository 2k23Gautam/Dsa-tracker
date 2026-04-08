require('dotenv').config();
const { suggestProblemMetadata } = require('./utils/ai');

async function run() {
  try {
    const res = await suggestProblemMetadata("Two Sum", "function twoSum() {}", "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.");
    console.log(res);
  } catch(e) {
    console.error("ERROR CAUGHT IN SCRIPT:", e);
  }
}
run();
