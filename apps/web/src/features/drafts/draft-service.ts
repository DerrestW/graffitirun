import { getDraftById, getDrafts } from "@/lib/db/queries";

export async function listDrafts() {
  return getDrafts();
}

export async function getDraftDetailsById(id: string) {
  return getDraftById(id);
}
