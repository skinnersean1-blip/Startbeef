import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { functions } from "@/inngest/functions";

// Create API handler for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
