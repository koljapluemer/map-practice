# Documentation

...an attempt to make sense of this mess.

## Architecture

The project is plain HTML/CSS/JSS. Maybe it shouldn't be, the logic is quite complex. I failed to get several mapping libraries running in Vue and also wanted to do some global-ish event listener stuff (which vue tends to dislike), so I settled for this vanilla stack.

## Files

### index.html

There is just a single HTML page in this project, which is this one. Additional info is kept in the `README.md`.

Since this is HTML, it should be fine to read. Here are a few noteworthy things:

1. Loads in `Funcssion CSS`, which is a nice atomic CSS solution, albeit incomplete in regards to flexbox.
2. Includes SVG map used for playing, as code. I think this is necessary. Using an `iframe` makes interaction with the SVG hard, using an `img` makes it impossible.
3. The stats are a grid, which was a really good idea. Use more grids!  

*lesson learned*: I never tried to do this mobile-first, possibly should have. Now this is unusable on phones. In retrospect the HN idea of using a fullscreen approach like gMaps is quite obvious and I would have thought of it if I would've forces myself to stare at the mobile version longer.

4. Includes `GoatCounter` widget. The best!


### main.js

All the logic.

#### Setup

Defines a lot of variables, dicts, etc, mostly used for stats. Also `HTML` elements that we need later. My stats handling is horrible, btw.

*lesson learned*: I'm pretty sure that is what the `Observer Pattern` is for. Use next time for stats! Makes quest tracking etc. possible as well.

Then, we load learning data from localStorage.

*lesson learned*: JS Dates get mangled when saving and retrieving them as JSON, do take care here.


#### allcountries[] loop

Next, we go through all countries and add a marking circle around all that are small. We also fill `countries[]` if no localStorage data was found (with the data that's in the svg).

We do stuff like coloring countries depending on whether or not there were guessed correctly on the last run and extract values from the saved learning data into the statistics variables.

After this, a render of the relevant stats is triggered. This *really* needs some proper software design as well, what does this call for, event emitter? Observer?

#### click listener

Then, we implement an EventListener for #map.

If we are not currently expecting a click (as in the feedback phase) or whatever was clicked isn't a country (no name), we do nothing.

Otherwise, we again start with some stats calculations: Thinking time, iterating the unit counter. Also, we want to know whether the guess was right.

We push all relevant learning data into `repetitions[]` of the relevant item in `country[]`.

That done, we attack Spaced Repetition. This is essentially split into two large conditions, depending on whether the guess was right.

##### guess was right

We do some stuff, like resetting the counter of the country in `nemesisDict`.

Then, SR:

* The interval is multiplied by 2 to the power of the streak (the default interval starting out is 10s)
    * meaning, something we already got right 3 times in a row is going to have - a lot - of interval growth
    * in a way, this is a cheapo version of the Ease Factor in SM-2
* If it's a new country (no repetitions before), we set the interval to 120 seconds
    * this is getting at the fact that a country gotten right on the first try is likely already memorized - we don't want to have to take a guess on that again in 20 seconds
    * I think this is a similar reasoning as to why the original SM-2 has a guessed nr of days until item is seen again
    * Thinking about it, I think that the second repetition (after the first one is wrong) may be similarly meaningful ("aah of course - this - is Panama, I remember"). TODO?

##### guess was wrong

We do somewhat more statistics stuff, like with the `confusionDict{}` and what not.

After that, interval calculation:

 * by default, we half the interval
 * ...but it can't fall below 10s...
 * ...and it can't go above 100
    * we don't want to have country which we got wrong to hide for 24 days just because it's interval was 48 days before..but we also don't want to undo all progress
    * there is a questionable amount of feeling involved in these numbers.

##### rest of the listener

We calculate the `dueAt` with the interval, we save `countries[]` to localStorage.

Then, we do coloring. It's somewhat lengthy, but non-complex stuff: Remove and add some CSS classes, so countries get colored this and that, also add a red circle around the country you should have clicked (if it ain't Russia-sized) and so on.

What color goes where should be clear after playing for 30 seconds, and the coloring needs a bit of rework, so, not going to bother here.

#### pickRandomChallenge()

This is the function that gets called at the very end of the listener described above; it delivers a new challenge.

First, some logic to cull the list of small countries (everything that's circled) if the user has activated the toggle.

Then, we pick a random country from the list that's due.

* With 80% chance, we try and go for a country we had before
    * this is so that if you get something wrong and its interval is 10s you actually do see it again in the next minute, instead of it being buried by 200 new countries forthe next hour
* With 20% chance, or if there are no 'old' countries, we pick a country we haven't seen before.

We actually set the target, we do some statistics and DOM manipulation, and done.

#### The Rest TM

Honestly, the rest are (fairly) modular functions that either 

* render statistical values to the DOM
* handle panning/zooming

These are somewhat non-DRY and somewhat overtly AI-generated, but they do their job and anyways they are not so integral to the whole thing. You can figure them out.


### svg-pan-zoom.js

The complete library, from the GitHub repo of the same name. I adapted the source code:
* zoom in/out buttons are not created, but hook into my existing ones
* rest button is hidden

We actually load the library in the middle of `main.js`. The object is called `panZoomLibrary`, and is created after the circles are made (chapter **allcountries[] loop**). We use it then to do pan and zoom calls. The library, or rather the object's public API is logged in the console, so we know what we have. I swear I saw the documentation for the whole thing somewhere, but it proves impossible to find now. However you can also see the capabilities of the `svg-pan-zoom` by Ctrl+F for `prototype.` in `svg-pan-zoom.js`. 

By the way, I think we need to load the library at that point (after the circle creation), because otherwise the pan will influence the SVG in fucky ways and the guidance circles for small islands will be at the wrong points. Now I am sure I could reverse engineer the coordinates of 'em with the panning and zooming that this library seems to do included, but why bother? 

We could stop all this madness by saving the SVG the js dynamically generates everytime, but I guess we would loose some dynamicness (what if we want to have Lebanon a circle after all?) [see TODO].

## Logging

I attempted to put in learning data logging later. 

Problem is: Calling anything w/o exposing an API key - which isn't actually a threat, but may lead to autoremoval on GitHub and stuff. Also crawler finding it and subsequent spam. 

Nothing worked. Pure JSON backend is to crude, because no idea how I would not overwrite the old db continously. Actual logging frameworks always mean $$$ and definitely npm. 

Netlify functions are horrible with Vanilla JS. Merely getting them to work is something. Then they don't have any libraries to do a god damn API request. XHR is apparently not available. Neither is fetch, because that apparently only exists in random node versions. Nor is axios, which is just a library. Which you can't install w/o converting the whole thing into a damn npm project, which is a hassle. Injecting an env var in the Netlify build like [here](https://simonplend.com/how-to-securely-call-an-authenticated-api-from-your-front-end/) didn't work either (it tried calling my supabase API with 'API_KEY', not the actual API key. Not sure why).

Supabase setup itself was decently quick after I figured out how to make it work with a CDN.

Next time I reckon I just build an API myself, and secure it reasonably w/ access tokens or something. Or just go Vue/Node after all and get some logging library.