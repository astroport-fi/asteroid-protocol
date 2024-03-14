export interface Club {
  id: string
  slug: string
  title: string
  range: number
}

const clubs: Club[] = [
  {
    id: '100',
    slug: 'sub-100',
    title: 'Sub 100',
    range: 100,
  },
  {
    id: '1k',
    slug: 'sub-1k',
    title: 'Sub 1k',
    range: 1000,
  },
  {
    id: '5k',
    slug: 'sub-5k',
    title: 'Sub 5k',
    range: 5000,
  },
  {
    id: '10k',
    slug: 'sub-10k',
    title: 'Sub 10k',
    range: 10000,
  },
  {
    id: '50k',
    slug: 'sub-50k',
    title: 'Sub 50k',
    range: 50000,
  },
  {
    id: '100k',
    slug: 'sub-100k',
    title: 'Sub 100k',
    range: 100000,
  },
]

const clubsBySlug = clubs.reduce((acc, club) => {
  acc.set(club.slug, club)
  return acc
}, new Map<string, Club>())

export function getClubBySlug(slug: string) {
  return clubsBySlug.get(slug)
}

export default clubs
