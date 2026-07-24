import express from "express";
import serverless from "serverless-http";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_CORS_URL }));

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS")); // <- this throws, causing a 500
    }
  }
}));

// GET /scoreboard - Retrieve scoreboard data
app.get("/scoreboard", async (req, res) => {
  try {
    const scoreboard = await prisma.scoreboard.findUnique({
      where: { id: process.env.DEV_SETTING === "development" ? 2 : 1 },
      select: {
        id: true,
        team1_name: true,
        team1_score: true,
        team2_name: true,
        team2_score: true,
        timer: true,
        period: true,
        resetcount: true,
        team1_color: true,
        team2_color: true,
        team1_fouls: true,
        team2_fouls: true,
      },
    });
    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scoreboard" });
  }
});

// PUT /scoreboard - Update scoreboard data
app.put("/scoreboard", async (req, res) => {
  try {
    const {
      team1_score,
      team2_score,
      team1_color,
      team2_color,
      timer,
      team1_name,
      team2_name,
      period,
      resetcount,
      team1_fouls,
      team2_fouls,
    } = req.body;

    const updatedScoreboard = await prisma.scoreboard.update({
      where: { id: process.env.DEV_SETTING === "development" ? 2 : 1 },
      data: {
        team1_score,
        team2_score,
        team1_color,
        team2_color,
        timer,
        team1_name,
        team2_name,
        period,
        resetcount,
        team1_fouls,
        team2_fouls,
      },
    });

    res.json(updatedScoreboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to update scoreboard" });
  }
});

// PUT /timerreset - Reset timer
app.put("/timerreset", async (req, res) => {
  try {
    const { previouscount } = req.body;
    const parsedCount = parseInt(previouscount);

    if (isNaN(parsedCount)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    await prisma.scoreboard.update({
      where: { id: process.env.DEV_SETTING === "development" ? 2 : 1 },
      data: { resetcount: parsedCount + 1 },
    });

    return res.status(200).json({ message: "Resetcount updated successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message || "An unexpected error occurred",
    });
  }
});

// PUT /toggletimer - Toggle timer state
app.put("/toggletimer", async (req, res) => {
  try {
    const scoreboard = await prisma.scoreboard.findUnique({
      where: { id: process.env.DEV_SETTING === "development" ? 2 : 1 },
    });

    if (!scoreboard) {
      return res.status(404).json({ error: "Scoreboard not found" });
    }

    const updatedScoreboard = await prisma.scoreboard.update({
      where: { id: scoreboard.id },
      data: { timerRunning: !scoreboard.timerRunning },
    });

    res.json(updatedScoreboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle timer" });
  }
});

// PUT /stoptimer - Stop the timer
app.put("/stoptimer", async (req, res) => {
  try {
    const scoreboard = await prisma.scoreboard.findUnique({
      where: { id: process.env.DEV_SETTING === "development" ? 2 : 1 },
    });

    if (!scoreboard) {
      return res.status(404).json({ error: "Scoreboard not found" });
    }

    const updatedScoreboard = await prisma.scoreboard.update({
      where: { id: scoreboard.id },
      data: { timerRunning: false },
    });

    res.json(updatedScoreboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

// Export handler for Netlify
export const handler = serverless(app);
