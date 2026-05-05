const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { fetchUserStats, fetchAllSolvedSlugs, fetchAllSolvedWithCookie } = require("../services/leetcodeService");
const neetcode150 = require("../data/neetcode150.json");

// Build a flat slug→topic/difficulty lookup from neetcode150
const buildRoadmapLookup = () => {
  const lookup = {};
  for (const section of neetcode150) {
    for (const problem of section.problems) {
      lookup[problem.slug] = {
        topic: section.topic,
        difficulty: problem.difficulty,
        title: problem.title,
      };
    }
  }
  return lookup;
};

const roadmapLookup = buildRoadmapLookup();

// ─── POST /api/sync ───────────────────────────────────────────────────────────
router.post("/sync", async (req, res) => {
  try {
    const { leetcodeUsername, sessionCookie } = req.body;
    if (!leetcodeUsername || typeof leetcodeUsername !== "string") {
      return res.status(400).json({ error: "leetcodeUsername is required." });
    }

    const username = leetcodeUsername.trim().toLowerCase();

    // Fetch stats and solved slugs from LeetCode
    let stats, solvedList;
    if (sessionCookie) {
      // If a cookie is provided, we can fetch all solved problems
      [stats, solvedList] = await Promise.all([
        fetchUserStats(username),
        fetchAllSolvedWithCookie(sessionCookie),
      ]);
    } else {
      // Unauthenticated fallback (limited to recent)
      [stats, solvedList] = await Promise.all([
        fetchUserStats(username),
        fetchAllSolvedSlugs(username),
      ]);
    }

    // Enrich each solved problem with roadmap metadata where available
    const enriched = solvedList.map((p) => {
      const meta = roadmapLookup[p.slug];
      return {
        title: p.title,
        slug: p.slug,
        difficulty: meta?.difficulty || "Medium",
        topics: meta ? [meta.topic] : [],
      };
    });

    // Upsert user document
    const user = await User.findOneAndUpdate(
      { leetcodeUsername: username },
      {
        leetcodeUsername: username,
        solvedProblems: enriched,
        totalSolved: stats,
        lastSynced: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `Synced ${enriched.length} recently solved problems for "${username}".`,
      user: {
        leetcodeUsername: user.leetcodeUsername,
        totalSolved: user.totalSolved,
        solvedCount: user.solvedProblems.length,
        lastSynced: user.lastSynced,
      },
    });
  } catch (err) {
    console.error("Sync error:", err.message);
    if (err.message.includes("not found on LeetCode")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to sync. " + err.message });
  }
});

// ─── GET /api/user/:username ──────────────────────────────────────────────────
router.get("/user/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ leetcodeUsername: username });
    if (!user) {
      return res.status(404).json({ error: `User "${username}" not found. Please sync first.` });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/roadmap/:username ───────────────────────────────────────────────
router.get("/roadmap/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ leetcodeUsername: username });

    // Build a set of solved slugs for fast lookup
    const solvedSlugs = new Set(
      user ? user.solvedProblems.map((p) => p.slug) : []
    );

    // Build roadmap with completion status
    const roadmap = neetcode150.map((section) => {
      const problems = section.problems.map((p) => ({
        ...p,
        completed: solvedSlugs.has(p.slug),
        leetcodeUrl: `https://leetcode.com/problems/${p.slug}/`,
      }));

      const completedCount = problems.filter((p) => p.completed).length;

      return {
        topic: section.topic,
        total: problems.length,
        completed: completedCount,
        percentage: Math.round((completedCount / problems.length) * 100),
        problems,
      };
    });

    const totalProblems = roadmap.reduce((s, t) => s + t.total, 0);
    const totalCompleted = roadmap.reduce((s, t) => s + t.completed, 0);

    res.json({
      username: username,
      lastSynced: user?.lastSynced || null,
      totalProblems,
      totalCompleted,
      overallPercentage: Math.round((totalCompleted / totalProblems) * 100),
      roadmap,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/random ─────────────────────────────────────────────────────────
router.get("/random", async (req, res) => {
  try {
    const { username, mode = "all", topic, includeUnsolved } = req.query;

    if (!username) {
      return res.status(400).json({ error: "username query param is required." });
    }

    const user = await User.findOne({ leetcodeUsername: username.toLowerCase() });
    const solvedSlugs = new Set(
      user ? user.solvedProblems.map((p) => p.slug) : []
    );

    // Flatten roadmap into a pool of candidates
    let pool = [];
    for (const section of neetcode150) {
      for (const p of section.problems) {
        const isSolved = solvedSlugs.has(p.slug);
        // Filter by mode
        if (mode === "topic" && topic && section.topic !== topic) continue;
        // Filter by solved/unsolved
        if (!includeUnsolved && !isSolved) continue;

        pool.push({
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty,
          topic: section.topic,
          completed: isSolved,
          leetcodeUrl: `https://leetcode.com/problems/${p.slug}/`,
        });
      }
    }

    if (pool.length === 0) {
      return res.status(404).json({
        error: "No problems found matching the criteria. Try syncing or enabling 'include unsolved'.",
      });
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    res.json(picked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/topics ─────────────────────────────────────────────────────────
router.get("/topics", (req, res) => {
  const topics = neetcode150.map((s) => s.topic);
  res.json(topics);
});

module.exports = router;
