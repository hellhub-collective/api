import type { Hono } from "hono";

import * as Assignments from "controllers/assignments";

export default async function assignments(app: Hono) {
  app.get("/assignments", Assignments.getAllAssignments);
  app.get("/assignments/:id", Assignments.getAssignmentById);
  app.get("/assignments/:id/rewards", Assignments.getAssignmentReward);
}
