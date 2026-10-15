export const getInstagramContent = (alert) => {
  const value = alert?.caption || alert?.content || ''

  return String(value)
    .replace(/^\s*\d[\d,.\s]*\s+likes?,\s*\d[\d,.\s]*\s+comments?\s*-\s*[^:]+:\s*/i, '')
    .trim()
}