export const TABS = [
  { key: null,           label: 'All' },
  { key: 'FILTERED',     label: 'Filtered' },
  { key: 'NEEDS_REVIEW', label: 'Needs Review' },
  { key: 'NO_DEADLINE',  label: 'No Deadline' },
  { key: 'DONE',         label: 'Done' },
  { key: 'MISSED',       label: 'Missed' },
  { key: 'BIN',          label: 'Bin', isBin: true },
]

export const TAB_LABELS = {
  FILTERED:     'Filtered',
  NEEDS_REVIEW: 'Needs Review',
  NO_DEADLINE:  'No Deadline',
  DONE:         'Done',
  MISSED:       'Missed',
}

export const TAB_COLORS = {
  FILTERED:     '#3b82f6',
  NEEDS_REVIEW: '#f59e0b',
  DONE:         '#5d8a6d',
  MISSED:       '#ef4444',
  NO_DEADLINE:  '#6b7280',
}

export function getStatusOptions(tab) {
  switch (tab) {
    case 'FILTERED':     return ['NEEDS_REVIEW', 'NO_DEADLINE']
    case 'NEEDS_REVIEW': return ['FILTERED', 'NO_DEADLINE']
    case 'NO_DEADLINE':  return ['FILTERED', 'NEEDS_REVIEW']
    case 'DONE':         return ['MISSED', 'FILTERED']
    case 'MISSED':       return ['DONE']
    default:             return []
  }
}
