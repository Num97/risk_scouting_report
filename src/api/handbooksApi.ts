import type { HandbooksResponse } from "../types/handbooks"

export async function getHandbooks(): Promise<HandbooksResponse> {
  const response = await fetch("/api/v1/handbooks")

  if (!response.ok) {
    throw new Error("Ошибка загрузки справочников")
  }

  const json = await response.json()

  return json.data
}