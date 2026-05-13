import type { BusinessAnalysis } from '../types'

export function toJSON(analysis: BusinessAnalysis): Record<string, unknown> {
  return { ...analysis }
}
