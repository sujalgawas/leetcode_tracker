const axios = require('axios');

async function testWithCookie() {
  const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";
  
  const query = `
    query problemsetQuestionList($limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: ""
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          title
          titleSlug
          status
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL,
      { 
        query, 
        variables: { limit: 10, skip: 0, filters: { status: "AC" } } 
      },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

testWithCookie();
