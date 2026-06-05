import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// In-Memory cache for Gemini responses to save quota, reduce network latency, and cache patterns
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route: Smart Suggestions Endpoint
  app.post("/api/suggestions", async (req, res) => {
    const { type, payload } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Missing type in request body" });
    }

    // Generate stable cache key from type + serialized payload
    const cacheKey = `${type}:${JSON.stringify(payload || {})}`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      return res.json({ ...cachedEntry.data, _cached: true });
    }

    try {
      const ai = getGeminiClient();
      let prompt = "";
      let responseSchema: any = null;

      switch (type) {
        case "prediction": {
          const { task, history = [] } = payload;
          prompt = `Analyze the candidate task and historical records of other tasks to predict user completion success rate.
Task to predict:
- Description: "${task.text}"
- Size / Estimated Minutes: ${task.estimatedTime || "not specified"}
- Category: "${task.category}"
- Subtasks count: ${task.subtasks?.length || 0}

User Task Completion History Context (completed/abandoned/pending other items):
${JSON.stringify(history.slice(0, 15))}

Provide your task completion prediction matching the requested JSON schema. Be encouraging, constructive, and data-driven.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              rating: {
                type: Type.STRING,
                description: "Likelihood to complete: 'High', 'Medium', or 'Low'",
              },
              reason: {
                type: Type.STRING,
                description: "Concise analysis explanation of why this rating makes sense based on characteristics/history.",
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable hints (maximum 2-3) to improve likelihood (e.g., break into subtasks, allocate deep focus session).",
              },
            },
            required: ["rating", "reason", "suggestions"],
          };
          break;
        }

        case "optimal": {
          const { pendingTasks = [], availableMinutes = 60, currentEnergy = 5, dayBlocks = [], googleMeetings = [] } = payload;
          prompt = `Determine the single most optimal task for the user to work on right now based on available slot, bio-energy state, task difficulty / dependencies, and calendar meetings.
Current State:
- Time Slot Available: ${availableMinutes} minutes
- Self-Reported Energy Level: ${currentEnergy} (scale 1-10)
- Scheduled GCal meetings for today: ${JSON.stringify(googleMeetings)}
- Configured focus blocks for today: ${JSON.stringify(dayBlocks)}
- List of Pending Tasks to select from:
${JSON.stringify(pendingTasks)}

Return the single best task ID and descriptive text. If no task is appropriate or backlog is empty, return null for taskId. Explain the logic in a warm, encouraging manner.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              taskId: {
                type: Type.STRING,
                description: "The ID of the recommended task from the input list, or null if empty/none fits.",
              },
              taskText: {
                type: Type.STRING,
                description: "The description of the recommended task, or an encouraging fallback prompt if none.",
              },
              reason: {
                type: Type.STRING,
                description: "Warm explanation (e.g. 'Since you have 90m and high energy, let us tackle this deep session!').",
              },
              confidence: {
                type: Type.STRING,
                description: "'High', 'Medium', or 'Low' recommendation confidence level.",
              },
            },
            required: ["taskId", "taskText", "reason", "confidence"],
          };
          break;
        }

        case "blocker": {
          const { abandonedTasks = [], reflections = [] } = payload;
          prompt = `Analyze tasks that were abandoned or journals highlighting hurdles to extract recurrent cognitive blocker patterns.
Recently Abandoned Tasks (including reasons if present):
${JSON.stringify(abandonedTasks)}

Recent Daily Reflections Journals (look for obstacles/blocked metrics):
${JSON.stringify(reflections)}

Identify 2-3 blocker patterns/recurrent themes and supply a highly specific, constructive and encouraging action plan with clarity steps.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              patterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of identified recurring blocker patterns (e.g., 'Unclear parameters reported on multiple sprint tasks').",
              },
              actionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Constructive action guidelines to solve these barriers (e.g., 'Write a definition of done checklist first').",
              },
            },
            required: ["patterns", "actionPlan"],
          };
          break;
        }

        case "insights": {
          const { reflections = [] } = payload;
          prompt = `Synthesize recent weekly reflections / mental journal records to find overarching progress, struggles, and strategic updates.
Weekly Reflections:
${JSON.stringify(reflections)}

Return a cohesive weekly summary, key recurring patterns (either positive or negative, e.g. "Meetings are interrupting deep work blocks in the morning"), and explicit suggestions to re-orchestrate schedule or methods.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "A motivating, 2-3 sentence overview of executive momentum and patterns this week.",
              },
              patterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific recurring patterns noted from emotional logs (e.g., 'Morning focus remains outstanding, afternoons are interrupted by slack').",
              },
              actionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Practical suggestions for improvement (such as setting morning focus shields).",
              },
            },
            required: ["summary", "patterns", "actionPlan"],
          };
          break;
        }

        case "goal-breakdown": {
          const { goalTitle = "", goalDescription = "" } = payload;
          prompt = `A user has set a task objective / weekly goal:
Title: "${goalTitle}"
Description: "${goalDescription}"

This text might be vague or large. Suggest a structured step-by-step division into distinct milestones or nested subtask components to make it highly executable and realistic under a week layout.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              breakdownTitle: {
                type: Type.STRING,
                description: "An optimized, polished version of the objective goal name.",
              },
              keyResults: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Suggested observable milestone descriptions/metrics to prove success.",
              },
              subtasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Suggested initial task breakdown pieces (e.g. Setup, Core Logic, Testing/Polishing, Launch).",
              },
            },
            required: ["breakdownTitle", "keyResults", "subtasks"],
          };
          break;
        }

        case "retry": {
          const { taskText = "", failureCount = 2, reasons = [] } = payload;
          prompt = `A task titled "${taskText}" has been marked incomplete or carried over ${failureCount} times.
Historical reasons or failure contexts reported:
${JSON.stringify(reasons)}

Review this block task and break it down into much smaller subtask pieces that can easily fit in a standard 30-minute to 1-hour interval. Send kind, encouraging support that inspires action instead of shame.`;

          responseSchema = {
            type: Type.OBJECT,
            properties: {
              suggestedBreakdown: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-4 micro-sized executable steps.",
              },
              encouragementText: {
                type: Type.STRING,
                description: "Empathetic, data-driven retry encouragement that reduces cognitive guilt.",
              },
            },
            required: ["suggestedBreakdown", "encouragementText"],
          };
          break;
        }

        default:
          return res.status(400).json({ error: `Unsupported suggestion type: ${type}` });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are Anchor AI, an encouraging, data-driven productivity companion. Keep your advice constructive, smart, and fully optional. Anchor is a focus-tracking, time-blocking system for executive alignment. Speak in a balanced tone that validates executive limits while providing logical advice. Avoid clinical jargon or marketing fluff. Always output valid JSON strictly according to the requested schema structure.`,
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const rawText = response.text || "{}";
      const data = JSON.parse(rawText);

      // Save to memory cache
      cache.set(cacheKey, { timestamp: Date.now(), data });

      return res.json(data);
    } catch (err: any) {
      console.error("Gemini suggestion route error:", err);
      // Fallback clean mock details if API Key isn't populated or rate limited
      return res.status(200).json({
        _error: err.message || "Failed to make call",
        _fallback: true,
        // Provide standard local fallback mock data structures so application continues functioning elegantly
        ...(type === "prediction" && {
          rating: "Medium",
          reason: "Using standard prediction analysis. Try breaking into subtasks to increase clarity.",
          suggestions: ["Integrate clear milestones", "Schedule a Dedicated deep block"],
        }),
        ...(type === "optimal" && {
          taskId: payload.pendingTasks?.[0]?.id || null,
          taskText: payload.pendingTasks?.[0]?.text || "No pending tasks",
          reason: "We suggest prioritizing your oldest backlog items during high focus slots.",
          confidence: "Medium",
        }),
        ...(type === "blocker" && {
          patterns: ["Tasks carryover occurs when deep sessions are scheduled late in the evening."],
          actionPlan: ["Move complex code reviews into the morning", "Mute channels during active Deep runs."],
        }),
        ...(type === "insights" && {
          summary: "Your week showed consistent deep blocks with some mid-afternoon communication drift.",
          patterns: ["Deep focus session duration usually averages 90 minutes.", "Emotional rating drops when logs identify frequent meetings."],
          actionPlan: ["Protect the 9:00 - 10:30 block", "Dedicate Friday afternoon to communications sweep."],
        }),
        ...(type === "goal-breakdown" && {
          breakdownTitle: payload.goalTitle || "Project Goals Plan",
          keyResults: ["Establish core functional prototype", "Verify performance checks pass"],
          subtasks: ["Initial workspace setup", "Map logical data architecture", "Polish interface layouts", "Assemble final checks"],
        }),
        ...(type === "retry" && {
          suggestedBreakdown: ["Break into a 15-min discovery run", "Set up simple file structure", "Write down core tests"],
          encouragementText: "No worries! It is completely normal to refine large goals. Let us tackle it with micro tasks.",
        }),
      });
    }
  });

  // Serve static UI assets of Vite or run Vite Middleware in dev modes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on Host 0.0.0.0 on Port ${PORT}`);
  });
}

startServer();
