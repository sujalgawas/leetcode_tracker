const axios = require('axios');

async function test() {
  try {
    const username = "neetcode";
    
    console.log("Fetching acSubmission...");
    const res1 = await axios.get(`https://alfa-leetcode-api.onrender.com/${username}/acSubmission`);
    console.log("Keys in acSubmission:", Object.keys(res1.data));
    if (res1.data.submission && Array.isArray(res1.data.submission)) {
      console.log(`Found ${res1.data.submission.length} submissions in acSubmission`);
    } else {
      console.log(`Found ${res1.data.count} submissions, showing snippet:`, res1.data.submission?.slice(0, 2));
    }
    
    console.log("Fetching solved...");
    const res2 = await axios.get(`https://alfa-leetcode-api.onrender.com/${username}/solved`);
    console.log("Keys in solved:", Object.keys(res2.data));
    console.log("Solved data:", res2.data);
    
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
