# SHELL SHOCK TRAINER — "EVERYTHING INSIDE" (final script, verified against the code)

Source of truth: Lovable project `abcbd240-ef0a-491f-a882-5dc7bd3624fc` (Shell Shock Trainer), read file by file. Every label below is a string that exists in the code. Anything I could not confirm is marked **CONFIRM ON DEVICE**.

Format: 9:16, ~25s, no VO, hard cuts on the beat (120 bpm = 0.5s grid), real iPhone screen recordings in a phone mockup.

---

## 0. READ THIS FIRST — 6 things that change the script

1. **"VIDEO DEMO ON EACH" does not exist.** 78 built-in exercises, zero demo videos. The only video fields in the whole database are lesson videos (Courses), PR proof and challenge proof. Cut it.
2. **"FIRST 200 MEMBERS: FREE FOR LIFE" is not in the app. Replaced.** No membership, subscription, lifetime or payment code anywhere (`featureGates.ts`, `perks.ts`, DB schema, `MOBILE.md` says "no purchase surface"). The app is free for everyone. The video now uses the real perk: **Legendary Pantheon = one free tub of Shell Shock Energy + lifetime 25% off on ShellShockEnergy.com** (`perks.ts`).
3. **"CHALLENGE YOUR FRIENDS" is false.** Challenges are posted by the coach/admin to the whole community; users tap **JOIN CHALLENGE**. No friend-vs-friend.
4. **"DM THE PEOPLE YOU'RE CHASING" is false as written.** DMs only work between accepted friends, and the friends system unlocks at **Silver Hero**.
5. **"THE SHOCK CULT IS WAITING" is false.** It is an invite-only ambassador channel (GoAffPro affiliates, verified by email code). Normal users hit a lock screen. Cut it.
6. **"NUMBERS STAY HONEST" is an overclaim.** The video-proof rule only exists on the **LOG A PERSONAL RECORD** screen. Logging sets in an active workout, or finishing a routine checklist, writes PRs with no video check. Say exactly what is true: big jumps there need video.

Also: 14 beats in 25s is still fast than anyone can read. I retimed it (below) and kept every overlay to what fits at 0.3s/word. If you want it comfortable, go 28–30s instead of cutting more.

---

## 1. FINAL SCRIPT

### Retimed scene map (all cuts land on a 0.5s beat)

| # | Scene | Time | Len | Change vs your draft |
|---|-------|------|-----|----------------------|
| 1 | HOOK | 0:00–0:02.0 | 2.0 | same |
| 2 | TRAIN | 0:02.0–0:06.5 | 4.5 | +0.5s (3 beats need 1.5s each) |
| 3 | TRACK | 0:06.5–0:10.0 | 3.5 | same |
| 4 | FUEL | 0:10.0–0:13.0 | 3.0 | +0.5s |
| 5 | COMMUNITY | 0:13.0–0:17.5 | 4.5 | −1.0s (Shock Cult cut) |
| 6 | THE TURN | 0:17.5–0:20.5 | 3.0 | +1.0s (10 words need 3s) |
| 7 | PERK + OUTRO | 0:20.5–0:25.0 | 4.5 | Real perk replaces "FIRST 200"; total runtime is now **25.0s** |

Overlay rule: max 6 words, ALL CAPS, minimum 0.3s per word once fully on screen.

---

### SCENE 1 — HOOK (0:00–0:02.0)

| Beat | Screen to record | Action | Overlay | Len | Mockup |
|------|------------------|--------|---------|-----|--------|
| 1A | **LOG A PERSONAL RECORD** (plus button → "LOG A PERSONAL RECORD"), then the **RANK UP** overlay (`RankUpOverlay`: "FROM {tier}" / **RANK UP** / {NEW TIER} / "ASCEND.") | On the staged account, tap **LOG IT**. Capture: white flash → **NEW PR** gold burst → **RANK UP** overlay. Cut on the RANK UP frame. | Stacked: **NOT JUST A RANK.** / **HERE'S WHAT'S INSIDE.** (7 words, tight; your 8-word original does not fit 2s) | 2.0 | Punch-in 1.15× at the flash, then hold. |

Fallback if you can't stage a rank-up: use the **NEW PR** burst alone (it fires on any PR increase of 15% or less).
Rank is ONE beat, and this is it.

---

### SCENE 2 — TRAIN (0:02.0–0:06.5)

| Beat | Screen to record | Action | Overlay | Len | Mockup |
|------|------------------|--------|---------|-----|--------|
| 2A | **ACTIVE WORKOUT** → tap **+** → **ADD EXERCISE** sheet (search box "SEARCH EXERCISES…", category pills **CHEST (12) BACK (14) LEGS (16) SHOULDERS (12) ARMS (14) ABS (10)**) → pick an exercise → type weight/reps → **LOG SET** | Open the sheet, pause on the pill row (that is the 78), pick, tap LOG SET, rest bar starts ("REST 90s"). | **LOG EVERY LIFT. 70+ EXERCISES.** | 1.5 | Still, punch-in on LOG SET tap. |
| 2B | **FITNESS → ROUTINES** → **CREATE SPLIT** → **NEW SPLIT** sheet (**START FROM A TEMPLATE** / **BUILD YOUR OWN**) → tap START FROM A TEMPLATE → **SPLIT TEMPLATES** list | Tap CREATE SPLIT, hold the two-option sheet 0.7s, tap START FROM A TEMPLATE, land on the list. | **PRE-BUILT SPLITS. OR BUILD YOURS.** | 1.5 | Still. |
| 2C | **FITNESS → ROUTINES → THIS WEEK** card ("WEEK A / WEEK B" buttons, MON–SUN chips, "WEEK B ACTIVE · AUTO-ALTERNATES") | Tap WEEK A, then WEEK B; today's chip glows. | **A/B WEEKS FLIP AUTOMATICALLY.** | 1.5 | Punch-in 1.2× on the week toggle. |

Note: the app calls them **splits** ("YOUR SPLITS", "CREATE SPLIT", "SPLIT TEMPLATES"), not programs. The A/B calendar flips every Monday (New York time; Mon Sept 21 2026 = Week A). It does not auto-start your workout, so don't say it "runs the week for you."

---

### SCENE 3 — TRACK (0:06.5–0:10.0)

| Beat | Screen to record | Action | Overlay | Len | Mockup |
|------|------------------|--------|---------|-----|--------|
| 3A | **FITNESS → MAP** tab: **YOUR STRENGTH MAP** (FRONT/BACK toggle, "TAP A MUSCLE · REVEAL YOUR RANK") | On FRONT, tap the chest, then the legs. Gold ring ripples, the group glows in its tier color, the inline card shows tier + "N LBS BEST" + "+N LBS TO …". | **6 MUSCLE GROUPS. 6 RANKS.** | 1.5 | Punch-in 1.2× on the figure. |
| 3B | **LOG A PERSONAL RECORD**: type **180 lbs × 5 reps** → **ESTIMATED 1RM** card shows **210 lbs** → raise the weight to more than 15% over the current PR → tap **LOG IT** → **VERIFICATION REQUIRED** modal ("Upload a video of the lift. Your rank won't change until an admin reviews it." / **SUBMIT FOR REVIEW**) | 0.8s on the 210 card, 1.2s on the modal. Do not submit. | **BIG JUMP? VIDEO PROOF REQUIRED.** | 2.0 | Still. |

Why 180×5: 180 × (1 + 5/30) = 210 exactly. Your earlier 225×5 = 262.5, which the live LOG screen rounds to **263**, while the explainer page hard-codes 262.

---

### SCENE 4 — FUEL (0:10.0–0:13.0)

| Beat | Screen to record | Action | Overlay | Len | Mockup |
|------|------------------|--------|---------|-----|--------|
| 4A | **FITNESS → NUTRITION → GOALS** (or the first-time **SET YOUR NUTRITION GOALS** intro): AGE / SEX / HEIGHT / WEIGHT / **GOAL WEIGHT** / **GOAL: LOSE · MAINTAIN · GAIN**, then **TARGET** under BMR/TDEE | Tap LOSE; TARGET number appears. | **SET YOUR GOAL.** | 1.0 | Punch-in 1.2× on GOAL chips. |
| 4B | **NUTRITION → DIARY**: **CALORIES REMAINING** ring + **PROTEIN / CARBS / FAT** bars after **ADD FOOD** | Add one food; ring and bars animate. | **TRACK YOUR MACROS.** | 1.0 | Still. |
| 4C | Header pill ("N cal left · X%") → **LOG A WEIGH-IN** → **SAVE** → **GOAL REACHED / YOU DID IT.** overlay | Weigh-in that passes the goal weight. | **HIT YOUR GOAL.** | 1.0 | Hold on the overlay. |

Gotchas: the header pill and the GOAL REACHED overlay need **Gold Warrior or higher** (lower ranks see a lock pill: "GOLD UNLOCKS NUTRITION"). The overlay is triggered by reaching your **goal weight**, not by hitting macros, and fires once per saved goal.

---

### SCENE 5 — COMMUNITY (0:13.0–0:17.5)

| Beat | Screen to record | Action | Overlay | Len | Mockup |
|------|------------------|--------|---------|-----|--------|
| 5A | **SOCIAL → SHELLSHOCK ACADEMY** feed: your workout recap post ("🏋️ Just crushed a workout … 🔥 N NEW PRS") with the **ReactionsBar** | Scroll to the post, tap one reaction (the +1 pops). Avoid 🥊. | **YOUR WORKOUTS HIT THE FEED.** | 1.5 | Still, punch-in on reaction. |
| 5B | **Public profile**: cover photo, avatar, tier badge, **POWER LEVEL / SHELL SHOCK SCORE**, **THIS WEEK'S LIFTS** (WORKOUTS / SETS / VOLUME), **MUSCLE RANKS**, **BADGES EARNED** | Open your profile from the feed, flick-scroll. | **PUBLIC PROFILES.** | 1.0 | Smooth scroll. |
| 5C | **CHALLENGES** (Home tile): an **ACTIVE CHALLENGES** card with **JOIN CHALLENGE**, then a joined one with progress bar + **SUBMIT VIDEO PROOF / UPLOAD PROOF VIDEO** | Tap JOIN CHALLENGE. | **JOIN COMMUNITY CHALLENGES.** | 1.0 | Still. |
| 5D | Friend's profile → **ADD FRIEND**/**MESSAGE** → DM thread ("Message {name}…", reactions) | Tap MESSAGE, type a short line, send. | **ADD FRIENDS. SEND DMS.** (4 words, 1.0s is tight; shorten to **FRIENDS. DMS.** if it reads rushed) | 1.0 | Punch-in on send button. |

Privacy: the **FIND** tab lists every user's username and avatar. Do not film it on production. Use demo accounts only.

---

### SCENE 6 — THE TURN (0:17.5–0:20.5) — plain dark card, no app screen

| Beat | Card | Overlay | Len |
|------|------|---------|-----|
| 6A | Dark card | **OTHER APPS LOG YOUR LIFTS.** (strike-through lands on the cut) | 1.5 |
| 6B | Dark card | **THIS ONE MAKES THEM COUNT.** | 1.5 |

---

### SCENE 7 — PERK + OUTRO (0:20.5–0:25.0)

| Beat | Screen / card | Action | Overlay | Len | Mockup |
|------|---------------|--------|---------|-----|--------|
| 7A | **RANKINGS** screen (Home tile) → scroll to **BRAND REWARDS** → the **LEGENDARY PANTHEON** card ("ONE FREE TUB of Shell Shock Energy + LIFETIME 25% OFF on ShellShockEnergy.com.") | Scroll so the Legendary card fills the frame; if your account hasn't earned it, the card shows LOCKED, which is fine (it's a goal). | **REACH LEGENDARY PANTHEON.** then **FREE TUB. 25% OFF FOR LIFE.** | 2.5 | Still; punch-in 1.2× on the card text. |
| 7B | Logo card: **SHELL SHOCK** + **trainer** wordmark (Robot Reavers) on black | — | **DOWNLOAD FREE ON THE APP STORE** | 2.0 | Hold. |

Perk wording is taken from `perks.ts` and the RANKINGS screen: "ONE FREE TUB … + LIFETIME 25% OFF on ShellShockEnergy.com." The only caveat is that the discount applies on your website, not in the app. The overlay doesn't claim otherwise. Keep the perk out of the App Store listing and screenshots (see `MOBILE.md` section 7.3 on steering to outside purchases).

Runtime is now 25.0s. Every cut still lands on a 0.5s beat.

---

## 2. RECORDING CHECKLIST (filming order, grouped by screen)

**P0 — Prep (do first, ~20 min)**
1. Record on a real iPhone running the **App Store build**, portrait, Do Not Disturb on, battery/signal clean, screen recording on.
2. **Account A (hero):** Gold Warrior or higher overall. Must have: a cover photo, ≥1 friend, ≥1 pending PR-free lift history, and nutrition goals NOT yet saved (so the intro form shows) or use the GOALS tab.
3. **Account B (friend):** any rank Silver Hero or higher, already friends with A (needed for DMs).
4. **Stage the rank-up (Scene 1):** on a separate staging account (or Account A before shooting), look at Home → "N PTS TO NEXT". Get within ~8 points of the next division, then plan one lift that moves a single muscle group up one division (one division in one group ≈ 8.6 Strength Score points). The lift must be an exercise with an existing PR, and no more than 15% over it, or you'll get the video-proof modal instead of RANK UP.
5. **Admin account:** post one challenge via **+ → POST A CHALLENGE**, so Challenges isn't empty (Scene 5C).
6. All faces/usernames on screen must be demo accounts.

**Clips in order**

| # | Screen group | Pre-setup | Taps | Record |
|---|--------------|-----------|------|--------|
| 1 | **LOG A PERSONAL RECORD** (rank-up, Scene 1) | Staging from P0.4 | + → LOG A PERSONAL RECORD → pick exercise → weight/reps → **LOG IT** | 10s (cut to 2s on RANK UP) |
| 2 | **LOG A PERSONAL RECORD** (verification, Scene 3B) | An exercise with a PR, or one never logged | Type 180 × 5 → pause on ESTIMATED 1RM (210) → increase weight >15% over PR → LOG IT → modal. Don't submit. | 12s |
| 3 | **FITNESS → ROUTINES** (Scene 2B, 2C) | At least one A/B split adopted | CREATE SPLIT → pause → START FROM A TEMPLATE → list. Back out. Scroll to THIS WEEK → WEEK A → WEEK B. | 15s |
| 4 | **ROUTINES → ACTIVE WORKOUT** (Scene 2A) + feed post source | A split with today's day set | START (today) → BEGIN WORKOUT → **OPEN** → tap + (ADD EXERCISE) → pick → enter → LOG SET → add 2 more sets → **FINISH** (top-right) → "WORKOUT COMPLETE / SHARED TO SHELLSHOCK ACADEMY" | 40s. Finishing here is what creates the feed post you need for 5A. |
| 5 | **FITNESS → MAP** (Scene 3A) | PRs in ≥3 muscle groups | Land on MAP → tap chest → tap legs → flip to BACK → tap back | 15s |
| 6 | **FITNESS → NUTRITION** (Scene 4A, 4B) | Goals unsaved (or use GOALS tab) | GOALS: enter age/sex/height/weight/goal weight, tap LOSE → SAVE GOALS. DIARY → ADD FOOD → add 1 food. | 30s |
| 7 | **Header pill → weigh-in** (Scene 4C) | Goal weight set 1 lb below current; Gold+ | Tap header pill → LOG A WEIGH-IN → enter a weight past goal → SAVE → overlay | 12s (re-save goals to re-trigger; fires once per goal) |
| 8 | **SOCIAL → SHELLSHOCK ACADEMY** (Scene 5A) | The post from clip 4 | Open channel → scroll to post → tap one reaction | 10s |
| 9 | **Public profile** (Scene 5B) | Cover photo set | Tap your avatar on the post → slow scroll | 10s |
| 10 | **Home → CHALLENGES** (Scene 5C) | Challenge posted (P0.5) | Open CHALLENGES → tap JOIN CHALLENGE | 8s |
| 11 | **Friend profile → DM** (Scene 5D) | A and B are friends | Open B's profile → MESSAGE → type + send → react to a message | 12s |

| 12 | **Home → RANKINGS** (Scene 7A) | Any account | Tap RANKINGS → scroll to **BRAND REWARDS** → stop with the Legendary Pantheon card centered | 8s |

Scene 6 and the Scene 7B logo are text/logo cards (build in Remotion, no recording).

**Before you press record on 6 and 7:** weigh-ins also call `pushWeighInSlack`. I did not read what it sends. Check before filming on a real account.

---

## 3. DISCREPANCY LIST (your script vs the real app)

| # | Your line | Status | What the code says | Corrected line |
|---|-----------|--------|--------------------|----------------|
| 1 | 70+ EXERCISES | ✓ | 78 built-in (12+14+16+12+14+10) plus custom exercises | 70+ EXERCISES |
| 2 | VIDEO DEMO ON EACH | ✗ | No exercise demo video anywhere; `video_url` only on lessons, PR proof, challenge proof | *(cut)* |
| 3 | PRE-BUILT PROGRAMS OR BUILD YOUR OWN | ~ | Real, but the app says "splits"; buttons **START FROM A TEMPLATE** / **BUILD YOUR OWN**. Template count lives in the DB (CONFIRM ON DEVICE). | PRE-BUILT SPLITS. OR BUILD YOURS. |
| 4 | A/B SPLITS THAT RUN THE WEEK FOR YOU | ~ | A/B alternates automatically each Monday (NY time); the calendar shows today and NEXT UP; it doesn't start workouts | A/B WEEKS FLIP AUTOMATICALLY. |
| 5 | EVERY MUSCLE GETS ITS OWN RANK | ~ | 6 muscle groups (CHEST, BACK, LEGS, SHOULDERS, ARMS, ABS); ABS is ranked but excluded from the overall score | 6 MUSCLE GROUPS. 6 RANKS. |
| 6 | BODY MAP LIGHTS UP AS YOU GROW | ~ | Map lights up when you tap or hover a group, in its tier color; otherwise static | TAP A MUSCLE. SEE ITS RANK. |
| 7 | (hypertrophy history) | ✗ | No hypertrophy section found. Closest: TRACKING DASHBOARD ("EVERY EXERCISE · EVERY PR · EVERY DATE") and WORKOUT HISTORY | *(not used)* |
| 8 | BIG PR? PROVE IT ON VIDEO | ✓ with detail | Triggers when a new PR is >15% over your current best, **or** it's your first PR for that lift. Modal: VERIFICATION REQUIRED. Rank unchanged until an admin approves (admin PR VERIFICATION tab). Only on LOG A PERSONAL RECORD. | BIG JUMP? VIDEO PROOF REQUIRED. |
| 9 | NUMBERS STAY HONEST | ✗ | ACTIVE WORKOUT "LOG SET" and routine checklist "FINISH WORKOUT" both write PRs with no video check. Also LOG A PERSONAL RECORD can lower a PR. | *(cut, or keep only the line in #8)* |
| 10 | Epley "Est. 1RM" | ✓ / label | W × (1 + reps/30). Card label is **ESTIMATED 1RM**. 225×5 = 262.5 → live screen shows **263**; explainer page says 262. | Use 180×5 → 210 |
| 11 | HIT IT. FEEL IT. | ~ | **GOAL REACHED / YOU DID IT.** fires when a weigh-in reaches your goal **weight**, not macros; once per goal; Gold+ only | HIT YOUR GOAL. |
| 12 | YOUR PRS HIT THE FEED | ~ | Confirmed: the workout recap ("🏋️ Just crushed a workout … 🔥 N NEW PRS") when you **FINISH** from the active workout screen. The routine checklist FINISH does **not** post. PR-styled feed cards exist in the renderer, but I found nothing that creates them. | YOUR WORKOUTS HIT THE FEED. |
| 13 | REACTIONS · POSTS · PROFILES | ✓ | Posting needs Bronze Mortal; video posts need Gold Warrior; cover photo needs Gold Warrior. The reaction bar includes 🥊: don't show it (no boxing). | PUBLIC PROFILES. |
| 14 | CHALLENGE YOUR FRIENDS | ✗ | Challenges are admin/coach-posted, community-wide, JOIN CHALLENGE, video proof reviewed by COACH | JOIN COMMUNITY CHALLENGES. |
| 15 | DM THE PEOPLE YOU'RE CHASING | ✗ | DMs are friends-only; friends unlock at Silver Hero | ADD FRIENDS. SEND DMS. |
| 16 | THE SHOCK CULT IS WAITING | ✗ | Invite-only ambassador channel (GoAffPro email + 6-digit code). Not open to users. | *(cut)* |
| 17 | FIRST 200 MEMBERS: FREE FOR LIFE | ✗ → replaced | Not in `featureGates.ts`, `perks.ts` or the DB. No payments in the app. **Decision: keep the real perk.** Legendary Pantheon = free tub + lifetime 25% off on ShellShockEnergy.com. | REACH LEGENDARY PANTHEON. FREE TUB. 25% OFF FOR LIFE. |
| 18 | Score range | ~ | Strength Score 0–1000 (Legendary Pantheon III tops it); Pantheon Ascended runs above. **SHELL SHOCK SCORE** on the app is a different number (Power Level points). My v1 video said "SCORE 914–1000". | Say **STRENGTH SCORE** |
| 19 | Rank tier names | ✓ | Rust Mortal, Bronze Mortal, Silver Hero, Gold Warrior, Platinum Demigod, Diamond Titan, Mythic Olympian, Legendary Pantheon, Pantheon Ascended | — |
| 20 | v1 video "225×5 → 262" | ✗ | Live LOG screen shows 263 | Re-render v1 with 180×5 → 210 |
| 21 | In-app inconsistency | ! | The Strength Score FAQ says "Can my rank go down? No." Code does let rank drop ("RANK DOWN / EARN IT BACK."), and the Power Level page says Strength Score "can move up or down." Don't film that FAQ; fix the copy. | — |
| 22 | ASK COACH, Reels feed, BJJ/MMA/Boxing | ✓ none used | I found no ASK COACH or Reels in the files I read. 🥊 is in the reaction presets; "COACH" appears on the challenge-proof screens. | Keep off camera |

**"Is it in the App Store build?"** The iPhone app loads the published web app (`server.url`), so web features go live when you publish in Lovable, not when Apple reviews. The project was last edited Oct 11 and shows as published. I cannot see which version is live, so CONFIRM the latest publish includes Splits and the A/B calendar (Sept). Push notifications need a native rebuild; they are not in this script.
