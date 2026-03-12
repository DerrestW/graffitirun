import { getTemplates } from "@/lib/db/queries";
import { templates as mockTemplates } from "@/lib/mock-data";

export async function listTemplates() {
  const dbTemplates = await getTemplates();
  const merged = [...dbTemplates];

  for (const template of mockTemplates) {
    if (!merged.some((item) => item.id === template.id)) {
      merged.push(template);
    }
  }

  return merged;
}
