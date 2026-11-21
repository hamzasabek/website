export const CATEGORIES = [
  { id: 'profile', index: 1, number: '01', en: 'Profile', fr: 'Profil' },
  { id: 'projects', index: 2, number: '02', en: 'Projects', fr: 'Projets' },
  { id: 'publications', index: 3, number: '03', en: 'Publications', fr: 'Publications' },
  { id: 'experience', index: 4, number: '04', en: 'Experience', fr: 'Expérience' },
  { id: 'education', index: 5, number: '05', en: 'Education', fr: 'Diplômes' },
  { id: 'talks', index: 6, number: '06', en: 'Talks', fr: 'Communications' },
  { id: 'teaching', index: 7, number: '07', en: 'Teaching', fr: 'Enseignements' },
  { id: 'skills', index: 8, number: '08', en: 'Skills', fr: 'Compétences' },
  { id: 'more', index: 9, number: '09', en: 'More', fr: 'Plus' },
];

export function getCategoryIndex(id) {
  const idx = CATEGORIES.findIndex((c) => c.id === id);
  return idx === -1 ? 0 : idx;
}
