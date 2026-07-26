import type { Milestone } from '../types'

/*  ╔══════════════════════════════════════════════════════════════════════╗
    ║  DEV-ONLY SAMPLE DATA — DELETE BEFORE REAL USE                       ║
    ║                                                                      ║
    ║  These are the mock milestones from the design prototype. They seed  ║
    ║  an empty store in development only so the screens have something    ║
    ║  to render. Production builds start empty.                           ║
    ║                                                                      ║
    ║  This flag is the only switch — flip it or delete this file.         ║
    ╚══════════════════════════════════════════════════════════════════════╝ */
export const USE_SEED_DATA = import.meta.env.DEV

export const SEED_MILESTONES: Milestone[] = [
  { id: '1', title: 'Weekend in Asheville', cat: 'trips', date: '2026-07-29T15:00', time: true, who: 'both', notes: 'Cabin off the Blue Ridge Parkway. Check in after 4pm.' },
  { id: '2', title: "Mom's Birthday", cat: 'birthdays', date: '2026-08-14', time: false, who: 'me', notes: 'She wants the pottery class, not another candle.' },
  { id: '3', title: 'NFL Season Kickoff', cat: 'sports', date: '2026-09-09T20:20', time: true, who: 'me', notes: 'Thursday night opener.' },
  { id: '4', title: 'Hozier at The Anthem', cat: 'concerts', date: '2026-09-26T19:30', time: true, who: 'maddie', notes: 'Doors at 7. Tickets in the wallet app.' },
  { id: '5', title: 'Australia Trip', cat: 'trips', date: '2026-10-03', time: false, who: 'both', notes: 'Sydney → Cairns → Melbourne. Reef day trip still to sort.' },
  { id: '6', title: 'Apothecary Diaries S3', cat: 'tv', date: '2026-10-17', time: false, who: 'me', notes: 'Weekly episodes, Saturday drops.' },
  { id: '7', title: 'First half marathon', cat: 'goals', date: '2026-11-08T07:30', time: true, who: 'maddie', notes: 'Wave 2 start. 16 weeks of training in.' },
  { id: '8', title: 'Dune: Part Three', cat: 'movies', date: '2026-12-18', time: false, who: 'both', notes: 'IMAX or nothing.' },
  { id: '9', title: 'Harry Potter series premiere', cat: 'tv', date: '2026-12-25', time: false, who: 'both', notes: 'Christmas Day drop.' },
  { id: '10', title: 'Outer Banks beach week', cat: 'trips', date: '2026-06-20', time: false, who: 'both', notes: 'Same house as last year.' },
  { id: '11', title: "Dad's 60th", cat: 'birthdays', date: '2026-05-30', time: false, who: 'me', notes: 'Surprise dinner — 14 people.' },
  { id: '12', title: 'Severance finale', cat: 'tv', date: '2026-07-10', time: false, who: 'both', notes: 'No spoilers until we both watch.' },
  { id: '13', title: 'Maddie’s gallery show', cat: 'goals', date: '2026-07-18T18:00', time: true, who: 'maddie', notes: 'Opening night, six pieces hung.' },
]
