import { getTemplates } from "@/lib/db/queries";

export async function listTemplates() {
  return getTemplates();
}
