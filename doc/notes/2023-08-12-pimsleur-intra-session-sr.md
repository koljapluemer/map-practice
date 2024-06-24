---
layout: post
title: Implementing an intra-session Spaced Repetition algorithm in my world map practice game
tags: learning deliberate-practice
description: "A summary of my implementation of a rapid Pimsleur-style Spaced Repetition algorithm with second-long intervals for a geography tutor web game"
---

![Screenshot of my World Map Web Game](https://koljapluemer.com/assets/img/blog/game.png).

There is a [curious Spaced Repetition paper by Pimsleur, written in 1967](https://doi.org/10.1111/j.1540-4781.1967.tb06700.x). It contains the earliest version of the serrated forgetting curve I've seen so far, and even more intriguing, Pimsleur uses intervals that range continuously from *seconds* to hundreds of days.

![Serrated forgetting curve from the Pimsleur Paper](https://koljapluemer.com/assets/img/blog/pimsleur1.png).

Most SR software today tracks intervals on the level of days, and would thus never bother with a starting interval of "say, five seconds". The unbothered, smooth climbing from seconds to months is also a blatant non-acknowledgement of any kind of working- or short-term memory theory. I love it.

As such, when I felt the burning need to get better at [this quiz](https://www.geoguessr.com/vgp/3355), I built [a little web game](https://world.koljapluemer.com/) using ideas from this paper.

This here is a little write-up, lessons learned kind of thing in regards to the Spaced Repetition System I built. It's not really about the game, so if you're interested in that, I kindly point you to [its README](https://github.com/koljapluemer/map-practice).

### The Algorithm

Like with any SR algorithm, we have learning items. In this case they are countries, which have to be clicked on the map ("find Angola"). However, the topic or nature of said items is not really that important. Two characteristics are worth pointing out:

- Finding countries on the world map is sort of fun and may be counted as a game. Thus, motivational mechanics here presumably differ from scenarios such as memorizing drug names in pre=med. 
- An country can be placed correctly or not; the evaluation is binary.

My algorithm works as follows:

- The default interval is 10s.
- When an item was done correctly:
    * The interval is multiplied by two to the power of the streak (as in the number of right guesses for this item in a row).
        * Meaning something we already got right three times in a row is going to have - a lot - of interval growth.
        * In a way, this is a cheapo version of the Ease Factor in SM-2.
    * If it's a new item (no repetitions before), we set the interval to 120 seconds.
        * This is getting at the fact that a country gotten right on the first try is likely already memorized - we don't want to have to take a guess on that again in 20 seconds
        * I think this is a similar reasoning as to why the original SM-2 has a (arbitrarily set) nr. of days until an item is seen again after the first review.
        * Thinking about it, I think a correct second repetition (after the first one is wrong) may be similarly meaningful ("aah of course - this - is Panama, I remember"). But this isn't considered yet.

- When an item was done incorrectly:
    * By default, we half the interval
        * ...but it can't fall below 10s...
        * ...and it can't go above 100.
            * We don't want to have country which we got wrong to hide for 24 days just because it's interval was 48 days before..but we also don't want to undo all progress with a single miss-click.

The algorithm is [open source](https://github.com/koljapluemer/map-practice/blob/main/main.js), but it's not really isolated from the rest of the game's functionality, so...sorry.

### Effectiveness

Sadly, I don't have much data to evaluate whether my algo is any good. Since I built this thing in plain JS, sending learning data to a backend in a secure way turned out to be quite a hurdle, and I gave that idea up for now. The only data I do have is page views, and I can't tell if a click is a new one-time visitor or a returning player getting their daily fix.

Personally, the game is decent fun, the algo feels decent; sometimes it may over-serve already memorized countries. Then again, at this point I'm sort of good at the game. So that's a success? 

### Lessons Learned

The biggest thing I've gained is an appreciation as to *why* especially early SR algos do so much damn guesswork. I used to scoff at Anki's preposterous discussion about modifying the first review's interval from the default set in SM-2 (which is also guessed). Same with the Leitner box, where the physical properties of a paper box crucially influence the learning journey. Now I sort of get it. When a learner gets an item right first try, what does it mean? Is it luck, or is it already rock-solid memory? You can sort of only guess. What do you do when an item keeps coming up even though you *feel* that you know it well already? You sort of hack in some magic math to make it go away.

With the sort of statistics and AI and large datasets that people like the [MaiMemo](https://github.com/maimemo/SSP-MMC-Plus) guys are using, we may move beyond unscientific guess-work. But that's novel, and comes with complexity. Until then, I think I like hacking around by hand. Though next time, I'll make sure that I can actually track efficacy.