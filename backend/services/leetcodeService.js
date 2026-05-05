const axios = require("axios");

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const headers = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0",
  Referer: "https://leetcode.com",
};

/**
 * Fetch total solved counts per difficulty for a username.
 */
const fetchUserStats = async (username) => {
  const query = `
    query getUserStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const response = await axios.post(
    LEETCODE_GRAPHQL,
    { query, variables: { username } },
    { headers }
  );

  const data = response.data?.data?.matchedUser;
  if (!data) {
    throw new Error(`User "${username}" not found on LeetCode.`);
  }

  const stats = { easy: 0, medium: 0, hard: 0, all: 0 };
  for (const item of data.submitStats.acSubmissionNum) {
    if (item.difficulty === "Easy") stats.easy = item.count;
    else if (item.difficulty === "Medium") stats.medium = item.count;
    else if (item.difficulty === "Hard") stats.hard = item.count;
    else if (item.difficulty === "All") stats.all = item.count;
  }

  return stats;
};

/**
 * Fetch recent accepted submissions (returns up to `limit` items).
 * LeetCode caps this at ~20 for unauthenticated requests.
 */
const fetchRecentAccepted = async (username, limit = 20) => {
  const query = `
    query getRecentAC($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  const response = await axios.post(
    LEETCODE_GRAPHQL,
    { query, variables: { username, limit } },
    { headers }
  );

  const submissions = response.data?.data?.recentAcSubmissionList;
  if (!submissions) return [];

  // Deduplicate by slug
  const seen = new Set();
  const unique = [];
  for (const s of submissions) {
    if (!seen.has(s.titleSlug)) {
      seen.add(s.titleSlug);
      unique.push({ title: s.title, slug: s.titleSlug });
    }
  }
  return unique;
};

/**
 * Fetch the complete list of solved problem slugs via the
 * problemsetQuestionList endpoint (paginates through all solved problems).
 * Requires the LEETCODE_SESSION cookie.
 */
/**
 * Fetch the complete list of solved problem slugs via the LeetCode REST API.
 * This is much faster and more reliable than GraphQL pagination.
 * Requires the LEETCODE_SESSION cookie.
 */
const fetchAllSolvedWithCookie = async (sessionCookie) => {
  // Ensure we have a properly formatted cookie header
  let cookieHeader = sessionCookie;
  if (!cookieHeader.includes("LEETCODE_SESSION=")) {
    cookieHeader = `LEETCODE_SESSION=${sessionCookie}`;
  }

  // Extract CSRF token if present to be extra safe
  let csrfToken = "";
  const match = cookieHeader.match(/csrftoken=([^;]+)/);
  if (match) {
    csrfToken = match[1];
  }

  const customHeaders = {
    ...headers,
    Cookie: cookieHeader,
  };
  
  if (csrfToken) {
    customHeaders["X-CSRFToken"] = csrfToken;
  }

  try {
    // This REST API returns all problems and their status in a single call
    const response = await axios.get("https://leetcode.com/api/problems/all/", {
      headers: customHeaders,
    });

    if (!response.data || !response.data.stat_status_pairs) {
      throw new Error("Invalid response from LeetCode API. Check your cookie.");
    }

    const allSolved = response.data.stat_status_pairs
      .filter((p) => p.status === "ac")
      .map((p) => ({
        title: p.stat.question__title,
        slug: p.stat.question__title_slug,
        difficulty: p.difficulty.level === 1 ? "Easy" : p.difficulty.level === 2 ? "Medium" : "Hard",
        topics: [], // Topics are not provided by this endpoint, but can be filled later if needed
      }));

    return allSolved;
  } catch (error) {
    console.error("Error fetching solved problems with cookie:", error.message);
    throw new Error("Failed to fetch solved problems. Your session might be expired.");
  }
};

/**
 * Fetch the limited list of solved problem slugs for unauthenticated users.
 * Uses a more robust public query that might return more items (up to 100).
 */
const fetchAllSolvedSlugs = async (username) => {
  const query = `
    query userPublicProfile($username: String!) {
      recentAcSubmissionList(username: $username, limit: 100) {
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL,
      { query, variables: { username } },
      { headers }
    );

    const submissions = response.data?.data?.recentAcSubmissionList || [];
    const allSlugs = new Set();
    const results = [];
    
    for (const s of submissions) {
      if (!allSlugs.has(s.titleSlug)) {
        allSlugs.add(s.titleSlug);
        results.push({ title: s.title, slug: s.titleSlug, topics: [] });
      }
    }

    return results;
  } catch (error) {
    console.error("Error fetching public solved slugs:", error.message);
    return [];
  }
};

module.exports = { fetchUserStats, fetchRecentAccepted, fetchAllSolvedSlugs, fetchAllSolvedWithCookie };
