## MUST

* see that both circle and country are set to correct/incorrect (only one of them is clicked) [when first loading the countries this already works]
- progress bar does not seem to work
	- possibly related to *small countries* toggle

## SHOULD

* check the [HN thread](https://news.ycombinator.com/item?id=36913829) and convert all reports into user stories
* make the "overlapping circles" interaction in the Caribbean more fun somehow?
* bug: when nemesis dict is all 0, something will still be nemesis (likely similar with the others)
	- fixed?
* extend testing
* explore why quick zoom works - sometimes -

## COULD

* save the SVG that's generated everytime, and just load that statically (=no more circle generation on load)
* consider implementing proper patterns like Observer into `main.js`, e.g. with stats (see `DOC.md`)
* make a mobile version, start with stage MVP and get it running *smoothly*
* fun facts for countries when guessed correctly?

