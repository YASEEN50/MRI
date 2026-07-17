const SPECIALTY_ICONS: Record<string, string> = {
  'طب عام': '🩺',
  'general': '🩺',
  'أطفال': '👶',
  'pediatr': '👶',
  'قلب': '❤️',
  'cardio': '❤️',
  'عظام': '🦴',
  'ortho': '🦴',
  'جلدية': '🧴',
  'derma': '🧴',
  'أسنان': '🦷',
  'dental': '🦷',
  'نفس': '🧠',
  'psych': '🧠',
  'عيون': '👁️',
  'ophthal': '👁️',
  'نساء': '🤰',
  'gyn': '🤰',
  'تجميل': '✨',
  'plastic': '✨',
  'باطنة': '🫀',
  'internal': '🫀',
  'جراحة': '🔬',
  'surgery': '🔬',
  'أنف': '👃',
  'ent': '👃',
  'تغذية': '🥗',
  'nutrition': '🥗',
}

export function specialtyIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(SPECIALTY_ICONS)) {
    if (lower.includes(key.toLowerCase()) || name.includes(key)) return icon
  }
  return '🩺'
}
