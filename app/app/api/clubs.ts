import sub1kImage from '~/images/clubs/sub1k.png'
import sub10kImage from '~/images/clubs/sub10k.png'
import sub50kImage from '~/images/clubs/sub50k.png'
import sub100Image from '~/images/clubs/sub100.png'
import sub100kImage from '~/images/clubs/sub100k.png'

export interface Club {
  id: string
  slug: string
  title: string
  range: number
  image: string
}

const clubs: Club[] = [
  {
    id: '100',
    slug: 'sub-100',
    title: 'Sub 100',
    range: 100,
    image: sub100Image,
  },
  {
    id: '1k',
    slug: 'sub-1k',
    title: 'Sub 1k',
    range: 1000,
    image: sub1kImage,
  },
  {
    id: '10k',
    slug: 'sub-10k',
    title: 'Sub 10k',
    range: 10000,
    image: sub10kImage,
  },
  {
    id: '50k',
    slug: 'sub-50k',
    title: 'Sub 50k',
    range: 50000,
    image: sub50kImage,
  },
  {
    id: '100k',
    slug: 'sub-100k',
    title: 'Sub 100k',
    range: 100000,
    image: sub100kImage,
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
