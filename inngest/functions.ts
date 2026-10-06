import { inngest } from "@/lib/inngest";
import { executeJudgment } from "@/lib/executeJudgment";

// Function that judges a beef at its exact expiry time
export const judgeExpiredBeef = inngest.createFunction(
  { id: "judge-expired-beef", name: "Judge Expired Beef" },
  { event: "beef/judgment.scheduled" },
  async ({ event, step }) => {
    const { beefId } = event.data;

    // Execute the judgment
    await step.run("judge-beef", async () => {
      console.log(`🤖 Judging beef ${beefId}...`);
      await executeJudgment(beefId);
      console.log(`✅ Beef ${beefId} judged successfully`);
      return { success: true, beefId };
    });
  }
);

// Export all functions
export const functions = [judgeExpiredBeef];
