import { GamificationInput, GamificationStories } from "@/types";

export const generateGamificationStories = async (
  payload: GamificationInput
): Promise<GamificationStories> => {
  const response = await fetch("/api/gamify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to generate stories right now.");
  }

  const data = (await response.json()) as { stories: GamificationStories };
  return data.stories;
};