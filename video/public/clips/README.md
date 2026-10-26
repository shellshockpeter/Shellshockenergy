# Screen recordings for "EVERYTHING INSIDE"

Drop iPhone screen recordings here as `clip01.mp4` … `clip12.mp4` (portrait).
Then run `node scripts/render-inside.mjs`. Missing clips render as labeled slots.

| File | Screen | Used for |
|------|--------|----------|
| clip01 | LOG A PERSONAL RECORD → LOG IT → NEW PR → RANK UP | 1A hook |
| clip02 | LOG A PERSONAL RECORD: 180 × 5 → ESTIMATED 1RM 210 → VERIFICATION REQUIRED | 3B |
| clip03 | FITNESS → ROUTINES: CREATE SPLIT / templates (0s) then THIS WEEK A/B (8s) | 2B, 2C |
| clip04 | ACTIVE WORKOUT: ADD EXERCISE → LOG SET | 2A |
| clip05 | FITNESS → MAP: YOUR STRENGTH MAP, tap chest then legs | 3A |
| clip06 | NUTRITION: GOALS (0s) then DIARY (15s) | 4A, 4B |
| clip07 | Header pill → LOG A WEIGH-IN → GOAL REACHED | 4C |
| clip08 | SOCIAL → SHELLSHOCK ACADEMY feed, tap a reaction | 5A |
| clip09 | Public profile scroll | 5B |
| clip10 | CHALLENGES → JOIN CHALLENGE | 5C |
| clip11 | Friend profile → MESSAGE → DM | 5D |
| clip12 | RANKINGS → BRAND REWARDS (Legendary Pantheon card) | 7A |

Where two beats share one clip, the beat's `startSec` in `src/EverythingInside.tsx` picks the moment.
