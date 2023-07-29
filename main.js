// get names by getting the name property of every path in #math
let targetCountry = {}
const elChallengeCountry = document.getElementById('challengeCountry')
const elFeedback = document.getElementById('feedback')
const elMap = document.getElementById('map')
const elGradeLED = document.getElementById('gradeLED')
const allCountries = document.getElementById('map').getElementsByTagName('path');
console.log('countries', allCountries);
let countries = []
let allCircles = []
let localStorageDataExists = false
// define stats data
let statsGlobalStreak = 0;
let correctGuesses = 0;
let incorrectGuesses = 0;
let statsTrainingUnits = 0;
let statsTrainingUnitsThisSession = 0;
let statsTimeOfLastReveal = null;
let statsThinkingTimes = []
let countriesNrOfFailuresDict = {};
let confusionDict = {};
let nemesisDict = {};
// see if we have the nr of training units last session in localstorage
let statsTrainingUnitsLastSession = localStorage.getItem('statsTrainingUnitsThisSession') ? localStorage.getItem('statsTrainingUnitsThisSession') : 'N/A'
// define stats elements
const elStatsGlobalStreak = document.getElementById('stats-global-streak')
const elStatsAccuracy = document.getElementById('stats-accuracy')
const elStatsDue = document.getElementById('stats-due')
const elStatsUnits = document.getElementById('stats-units')
const elStatsUnitsThisSession = document.getElementById('stats-units-this-session')
const elStatsUnitsLastSession = document.getElementById('stats-units-last-session')
const elStatsThinkingTime = document.getElementById('stats-thinking-time')
const elStatsHardestCountry = document.getElementById('stats-hardest-country')
const elStatsMostConfusedA = document.getElementById('stats-most-confused-a')
const elStatsMostConfusedB = document.getElementById('stats-most-confused-b')
const elStatsNemesis = document.getElementById('stats-nemesis')

// load countries from localStorage (if it exists)
if (localStorage.getItem('countries')) {
    countries = JSON.parse(localStorage.getItem('countries'))
    localStorageDataExists = true
}

console.log('countries after load from local', countries)

// for every path, add a <circle> at its center
for (let i = 0; i < allCountries.length; i++) {
    const country = allCountries[i];
    // get the bounding box of the path:
    const bbox = country.getBBox();
    const manualSmallCountries = [
        'Federated States of Micronesia',
        'French Polynesia',
        'Saint Helena',
        'Marshall Islands',
    ]
    const excludeCountries = [
        'Burundi',
        'Albania',
        'Macedonia',
        'Montenegro',
        'Lesotho',
        'Lebanon',
        'Rwanda',
        'Malawi',
        'Swaziland',
        'Equatorial Guinea',
        'Guinea-Bissau',
        'Israel',
        'Switzerland',
        'Sri Lanka',
        'Slovakia'
    ]
    if ((bbox.width < 8 || bbox.height < 8 || manualSmallCountries.includes(country.getAttribute('name'))) && !excludeCountries.includes(country.getAttribute('name'))) {
        // create a <circle> element:
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        // set its center to the center of the bounding box:
        circle.setAttribute('cx', bbox.x + bbox.width / 2);
        circle.setAttribute('cy', bbox.y + bbox.height / 2);
        // set its radius to half the width of the bounding box:
        circle.setAttribute('r', '2')
        // set stroke width to 1
        circle.setAttribute('stroke-width', '1')
        // give it same name property as country
        circle.setAttribute('name', country.getAttribute('name'))
        circle.classList.add('small-country-circle')
        // append it to the <svg> element:
        document.getElementById('map').appendChild(circle);
        allCircles.push(circle)
    }
    // if we have not loaded data
    if (!localStorageDataExists) {
        countries.push({
            name: country.getAttribute('name'),
            path: country,
            interval: 10,
            dueAt: null,
            repetitions: []
        })
    } else {
        // if we have loaded data, find the country in the countries array and set its path property
        const countryObject = countries.find(function (countryObject) {
            return countryObject.name == country.getAttribute('name')
        })
        countryObject.path = country
        // create proper date object from dueAt string
        if (countryObject.dueAt) {
            countryObject.dueAt = new Date(countryObject.dueAt)
        }

        // if the last repetition on the country has a grade of 1, color a light green, if its 0, color a light red
        if (countryObject.repetitions.length > 0) {
            console.log('object has repetitions')
            const lastRepetition = countryObject.repetitions[countryObject.repetitions.length - 1]
            // also check if there is a circle with the same name
            const matchingCircles = allCircles.filter(function (circle) {
                return circle.getAttribute('name') == countryObject.name
            })
            if (lastRepetition.grade == 1) {
                countryObject.path.classList.add('previouslyCorrect')
                if (matchingCircles.length > 0) {
                    matchingCircles[0].classList.add('previouslyCorrect')
                }
            } else {
                countryObject.path.classList.add('previouslyIncorrect')
                if (matchingCircles.length > 0) {
                    matchingCircles[0].classList.add('previouslyIncorrect')
                }
            }

            // add the nr of incorrect and correct repetitions to stat variables
            correctGuesses += countryObject.repetitions.filter(function (repetition) {
                return repetition.grade == 1
            }).length
            incorrectGuesses += countryObject.repetitions.filter(function (repetition) {
                return repetition.grade == 0
            }).length

            // add relevant data to countriesNrOfFailuresDict
            //  should look like {'Burundi': 3, 'Germany': 2}:
            if (countryObject.repetitions.filter(function (repetition) {
                return repetition.grade == 0
            }).length > 0) {
                countriesNrOfFailuresDict[countryObject.name] = countryObject.repetitions.filter(function (repetition) {
                    return repetition.grade == 0
                }).length
            }
            // add relevant data to confusion dict
            // should look like {'Germany-Burundi': 2, 'Germany-Frane': 1}
            for (let i = 0; i < countryObject.repetitions.length; i++) {
                const repetition = countryObject.repetitions[i];
                if (repetition.grade == 0) {
                    const confusionKey = countryObject.name + '-' + repetition.mixedUpWith
                    if (confusionDict[confusionKey]) {
                        confusionDict[confusionKey] += 1
                    } else {
                        confusionDict[confusionKey] = 1
                    }
                }
            }

            // add relevant data to the nemesis dict
            // for every country, it tracks the unbroken streak of 0 grades, from last to first
            // looks like {'Germany': 0}
            let negativeStreak = 0
            for (let i = countryObject.repetitions.length - 1; i >= 0; i--) {
                const repetition = countryObject.repetitions[i];
                if (repetition.grade == 0) {
                    negativeStreak += 1
                } else {
                    break;
                }
            }
            nemesisDict[countryObject.name] = negativeStreak

            renderFailureAndConfusion()
            statsTrainingUnits += countryObject.repetitions.length
        }
    }
}

console.log('Confusion Dict', confusionDict)
calculateAccuracy()
elStatsUnits.innerHTML = statsTrainingUnits
elStatsUnitsLastSession.innerHTML = statsTrainingUnitsLastSession

// listen to all clicks - if the click is on the svg, display the title of the clicked sub-object
document.getElementById('map').addEventListener('click', function (e) {

    // if we're not currently awaiting a click, return instantly
    if (elFeedback.innerHTML != 'Waiting for click...') {
        console.log('aborting..')
        return;
    }
    // find the path that was clicked on, and log its html 'name' property:
    const clickedCountry = e.target;
    const clickedName = clickedCountry.getAttribute('name');
    if (clickedName) {
        // difference in seconds between now and statsTimeOfLastReveal, max at 60s
        const thinkingTime = Math.min((new Date() - statsTimeOfLastReveal) / 1000, 60)
        statsThinkingTimes.push(thinkingTime)
        // calculate avg thinking time, round to 2 after decimal
        elStatsThinkingTime.innerHTML = (statsThinkingTimes.reduce(function (a, b) {
            return a + b
        }) / statsThinkingTimes.length).toFixed(2) + 's'
        calculateAccuracy()
        iterateTrainingUnitCounter()

        let guessedRight = false;
        if (clickedName === targetCountry.getAttribute('name')) {
            guessedRight = true
        }
        // handle SR 
        // find the country in the countries array
        targetCountryObject = countries.find(function (country) {
            return country.name == targetCountry.getAttribute('name')
        })

        targetCountryObject.repetitions.push({
            grade: guessedRight ? 1 : 0,
            date: new Date(),
            mixedUpWith: guessedRight ? null : clickedName,
            thinkingTime: thinkingTime
        })

        // if correct, double interval, if incorrect, half it (minimum 10)
        if (guessedRight) {
            statsGlobalStreak += 1;
            correctGuesses += 1;
            // set this country's nemesisDict entry to 0
            nemesisDict[targetCountryObject.name] = 0
            renderStreak();
            renderFailureAndConfusion();

            // get the streak: how many of the last repetitions are all correct, uniterrupted?
            let streak = 0
            for (let i = targetCountryObject.repetitions.length - 1; i >= 0; i--) {
                const repetition = targetCountryObject.repetitions[i];
                if (repetition.grade == 1) {
                    streak++
                } else {
                    break;
                }
            }
            console.log('streak:', streak)

            targetCountryObject.interval *= Math.pow(2, streak)
            // special case when the country is new: set the interval to two minutes immediately
            if (targetCountryObject.repetitions.length == 1) {
                targetCountryObject.interval = 120
            }
        } else {
            // set country value for countriesNrOfFailuresDict +1 or to 1 if key doesn't exist
            countriesNrOfFailuresDict[targetCountryObject.name] = countriesNrOfFailuresDict[targetCountryObject.name] ? countriesNrOfFailuresDict[targetCountryObject.name] + 1 : 1
            // same for confusion dict
            const confusionKey = targetCountryObject.name + '-' + clickedName
            confusionDict[confusionKey] = confusionDict[confusionKey] ? confusionDict[confusionKey] + 1 : 1
            console.log('new change in failure dict', countriesNrOfFailuresDict)
            console.log('new change in confusion dict', confusionDict)
            nemesisDict[targetCountryObject.name] = nemesisDict[targetCountryObject.name] ? nemesisDict[targetCountryObject.name] + 1 : 1
            console.log('new change in nemesis dict', nemesisDict)
            renderFailureAndConfusion()
            statsGlobalStreak = 0;
            incorrectGuesses += 1;
            renderStreak();
            targetCountryObject.interval /= 2
            if (targetCountryObject.interval < 10) {
                targetCountryObject.interval = 10
            }
            if (targetCountryObject.interval > 100) {
                targetCountryObject.interval = 100
            }
        }
        targetCountryObject.dueAt = new Date(new Date().getTime() + targetCountryObject.interval * 1000)


        console.log('obj now', targetCountryObject);
        // save obj to localStorage
        localStorage.setItem('countries', JSON.stringify(countries))

        // check if correct
        // give feedback accordingly
        // if correct ,set country green
        // if incorrect, set targetCountry red and clickedCountry blue
        // after 2 seconds, pick new challenge:
        if (guessedRight) {
            elFeedback.innerHTML = 'Correct!'
            elGradeLED.style.backgroundColor = '#6bb66b'
            // remove and add .correct class
            clickedCountry.classList.remove('correct', 'incorrect')
            clickedCountry.classList.add('correct')
            setTimeout(function () {
                pickRandomChallenge()
            }, 2000)
        } else {
            setTimeout(function () {
                zoomToWorld();
            }, 1000);
            elFeedback.innerHTML = `Incorrect! That's ${clickedName}.`
            elGradeLED.style.backgroundColor = '#b66b6b'
            targetCountry.classList.remove('incorrect', 'correct')
            targetCountry.classList.add('incorrect')
            // check if the targetCountry is somewhat small: if ((bbox.width < 20 || bbox.height < 20
            let targetIsSmall = false
            for (let i = 0; i < allCountries.length; i++) {
                const country = allCountries[i];
                if (country.getAttribute('name') == targetCountry.getAttribute('name')) {
                    const bbox = country.getBBox()
                    if (bbox.width < 50 || bbox.height < 50) {
                        targetIsSmall = true
                    }
                }
            }

            if (targetIsSmall) {
                console.log('target is small');
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                // set its center to the center of the bounding box:
                circle.setAttribute('cx', targetCountry.getBBox().x + targetCountry.getBBox().width / 2);
                circle.setAttribute('cy', targetCountry.getBBox().y + targetCountry.getBBox().height / 2);
                // set its radius to half the width of the bounding box:
                circle.setAttribute('r', '20')
                circle.classList.add('guide-circle')
                // append it to the <svg> element:
                document.getElementById('map').appendChild(circle);
                setTimeout(function () {
                    circle.remove()
                }, 2000)
            }
            clickedCountry.classList.add('selected')
            setTimeout(function () {
                clickedCountry.classList.remove('selected')
                pickRandomChallenge()
            }, 2001)
        }
    }
})

function pickRandomChallenge() {
    // check whether to include tiny countries by checking state of #tiny-country-check
    const includeTinyCountries = document.getElementById('tiny-country-check').checked
    let countriesToPickFrom = countries
    if (!includeTinyCountries) {
        // exclude everything that's included in the allCircles list
        // check by matching country.name against the the .name property of the objects in allCircles
        countriesToPickFrom = countries.filter(function (country) {
            for (let i = 0; i < allCircles.length; i++) {
                const circle = allCircles[i];
                if (circle.getAttribute('name') == country.name) {
                    return false
                }
            }
            return true
        })
        console.log(`got ${countriesToPickFrom.length} countries now`)
    }
    zoomToWorld();
    elFeedback.innerHTML = 'Waiting for click...'
    elGradeLED.style.backgroundColor = '#e0e0e0'
    // pick from countries array, where dueAt is in the past or null
    // with 80% chance, try to find something that was seen before first
    let dueCountries = []
    if (Math.random() < 0.8) {
        console.log('going for old learning item first')
        dueCountries = countriesToPickFrom.filter(function (country) {
            if (country.dueAt == null) {
                return false;
            }
            return country.dueAt.getTime() < new Date()
        })
        console.log('old learning items that are due:', dueCountries)
    }

    if (dueCountries.length == 0) {
        console.log('picking new learning item')
        dueCountries = countriesToPickFrom.filter(function (country) {
            return country.dueAt == null
        })
    }

    const countriesDue = countriesToPickFrom.filter(function (country) {
        return country.dueAt == null || country.dueAt < new Date()
    }).length
    // set value property of elStatsDue progress to 255-due:
    elStatsDue.value = 255 - countriesDue

    // handle no due countries
    if (countriesDue.length == 0) {
        alert('I think you are done for now? This is unexpected. Something will probably break. Try reloading?')
        return;
    }

    targetCountry = dueCountries[Math.floor(Math.random() * dueCountries.length)].path
    elChallengeCountry.innerHTML = targetCountry.getAttribute('name')

    statsTimeOfLastReveal = new Date();
}

pickRandomChallenge()


const elZoomMiddleAmerica = document.getElementById('zoom-middle-america')
// implement zooming the svg around Element with name `Cuba`
elZoomMiddleAmerica.addEventListener('click', function () {
    // const elCuba = document.querySelector('path[name="Montserrat"]')
    // const bbox = elCuba.getBBox()
    elMap.setAttribute('viewBox', `220 380 90 70`)
    // hide all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'none'
    }
})

const elZoomWorld = document.getElementById('zoom-world')
elZoomWorld.addEventListener('click', function () {
    zoomToWorld()
})

const elZoomMediterranean = document.getElementById('zoom-mediterranean')
elZoomMediterranean.addEventListener('click', function () {
    elMap.setAttribute('viewBox', `450 265 200 130`)
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'block'
    }
})

function zoomToWorld() {
    elMap.setAttribute('viewBox', `0 0 1010 666`)
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'block'
    }
}

const elZoomSEA = document.getElementById('zoom-sea')
elZoomSEA.addEventListener('click', function () {
    zoomToSEA()
})

function zoomToSEA() {
    elMap.setAttribute('viewBox', `720 380 200 130`)
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'block'
    }
}

const elZoomAfrica = document.getElementById('zoom-africa')
elZoomAfrica.addEventListener('click', function () {
    elMap.setAttribute('viewBox', `380 400 300 195`)
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'block'
    }
})

const elZoomOceania = document.getElementById('zoom-oceania')
elZoomOceania.addEventListener('click', function () {
    elMap.setAttribute('viewBox', `830 430 200 130`)
    // show all circles 
    for (let i = 0; i < allCircles.length; i++) {
        const currentCircle = allCircles[i]
        currentCircle.style.display = 'block'
    }
})

function calculateAccuracy() {
    // calculate accuracy out of number of correct and incorrect guesses, round to two after decimal
    const accuracy = Math.round(correctGuesses / (correctGuesses + incorrectGuesses) * 10000) / 100
    elStatsAccuracy.innerHTML = accuracy + ' %'
}

function iterateTrainingUnitCounter() {
    statsTrainingUnits += 1
    statsTrainingUnitsThisSession += 1
    // save to localstorage
    localStorage.setItem('statsTrainingUnitsThisSession', statsTrainingUnitsThisSession)
    elStatsUnits.innerHTML = statsTrainingUnits
    elStatsUnitsThisSession.innerHTML = statsTrainingUnitsThisSession
}


function renderFailureAndConfusion() {
    // find the most commonly incorrectly guessed country from  countriesNrOfFailuresDict- has to be more than 2 wrong
    let mostCommonlyIncorrectlyGuessedCountry = null
    let mostCommonlyIncorrectlyGuessedCountryNrOfFailures = 0
    for (const [key, value] of Object.entries(countriesNrOfFailuresDict)) {
        if (value > mostCommonlyIncorrectlyGuessedCountryNrOfFailures && value > 2) {
            mostCommonlyIncorrectlyGuessedCountry = key
            mostCommonlyIncorrectlyGuessedCountryNrOfFailures = value
        }
    }
    elStatsHardestCountry.innerHTML = mostCommonlyIncorrectlyGuessedCountry

    // find the most common confusion from confusionDict
    let mostCommonConfusion = null
    let mostCommonConfusionNrOfConfusions = 0
    for (const [key, value] of Object.entries(confusionDict)) {
        if (value > mostCommonConfusionNrOfConfusions && value > 1) {
            mostCommonConfusion = key
            mostCommonConfusionNrOfConfusions = value
        }
    }
    if (mostCommonConfusion != null) {
        elStatsMostConfusedA.innerHTML = mostCommonConfusion.split('-')[0]
        elStatsMostConfusedB.innerHTML = mostCommonConfusion.split('-')[1]
    } else {
        elStatsMostConfusedA.innerHTML = '-'
        elStatsMostConfusedB.innerHTML = '-'
    }


    // find the highest value in the nemesisDict, using reduce
    const nemesis = Object.keys(nemesisDict).reduce(function (a, b) {
        return nemesisDict[a] > nemesisDict[b] ? a : b
    })
    elStatsNemesis.innerHTML = nemesis

}

function renderStreak() {
    // generate .progress-bar-iterator, as many as streak counter, add into  elStatsGlobalStreak
    elStatsGlobalStreak.innerHTML = ''
    for (let i = 0; i < statsGlobalStreak; i++) {
        const elProgressBarIterator = document.createElement('div')
        elProgressBarIterator.classList.add('progress-bar-iterator')
        // set the width according to amount of bars (more = slimmer), minimum is 3px, maximum is 20px - we don't want the sum to exceed 800px:
        const width = Math.min(20, Math.max(3, 800 / statsGlobalStreak))
        elProgressBarIterator.style.width = width + 'px'
        elProgressBarIterator.style.minWidth = width + 'px'
        elStatsGlobalStreak.appendChild(elProgressBarIterator)
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // Variables to store the initial mouse position and viewBox values
    let mouseX, mouseY, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight;

    // Function to handle the start of dragging
    function handleDragStart(event) {
        // Store the initial mouse position and current viewBox values
        mouseX = event.clientX;
        mouseY = event.clientY;
        const viewBox = elMap.getAttribute('viewBox').split(' ');
        viewBoxX = parseFloat(viewBox[0]);
        viewBoxY = parseFloat(viewBox[1]);
        viewBoxWidth = parseFloat(viewBox[2]);
        viewBoxHeight = parseFloat(viewBox[3]);

        // Attach the drag event handlers to the document
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    }

    // Function to handle the dragging
    function handleDrag(event) {
        // Calculate the distance moved by the mouse
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        // Update the viewBox based on the distance moved
        const newViewBoxX = viewBoxX - deltaX;
        const newViewBoxY = viewBoxY - deltaY;

        // Preserve the existing viewBox width and height
        const newViewBoxWidth = viewBoxWidth;
        const newViewBoxHeight = viewBoxHeight;

        elMap.setAttribute('viewBox', `${newViewBoxX} ${newViewBoxY} ${newViewBoxWidth} ${newViewBoxHeight}`);
    }

    // Function to handle the end of dragging
    function handleDragEnd() {
        // Remove the drag event handlers from the document
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
    }

    // Attach the drag event handler to the SVG map element
    elMap.addEventListener('mousedown', handleDragStart);
});

// add viewport zoom to #zoom-out and #zoom-in:
const elZoomOut = document.getElementById('zoom-out')
elZoomOut.addEventListener('click', function () {
    const viewBox = elMap.getAttribute('viewBox').split(' ');
    const viewBoxX = parseFloat(viewBox[0]);
    const viewBoxY = parseFloat(viewBox[1]);
    const viewBoxWidth = parseFloat(viewBox[2]);
    const viewBoxHeight = parseFloat(viewBox[3]);
    elMap.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth * 1.1} ${viewBoxHeight * 1.1}`);
})

const elZoomIn = document.getElementById('zoom-in')
elZoomIn.addEventListener('click', function () {
    const viewBox = elMap.getAttribute('viewBox').split(' ');
    const viewBoxX = parseFloat(viewBox[0]);
    const viewBoxY = parseFloat(viewBox[1]);
    const viewBoxWidth = parseFloat(viewBox[2]);
    const viewBoxHeight = parseFloat(viewBox[3]);
    elMap.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth * 0.9} ${viewBoxHeight * 0.9}`);
})



// MOBILE


// allow panning of the viewport with finger on mobile devices
elMap.addEventListener('touchstart', function (e) {
    const touch = e.touches[0];
    touchstartX = touch.clientX;
    touchstartY = touch.clientY;
    e.preventDefault();
}
    , false);

elMap.addEventListener('touchmove', function (e) {
    // watch out that this is not too accelerated
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    const viewBox = elMap.getAttribute('viewBox').split(' ');
    const viewBoxX = parseFloat(viewBox[0]);
    const viewBoxY = parseFloat(viewBox[1]);
    const viewBoxWidth = parseFloat(viewBox[2]);
    const viewBoxHeight = parseFloat(viewBox[3]);
    const deltaX = touchstartX - touchX;
    const deltaY = touchstartY - touchY;
    const newViewBoxX = viewBoxX + deltaX;
    const newViewBoxY = viewBoxY + deltaY;
    elMap.setAttribute('viewBox', `${newViewBoxX} ${newViewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    e.preventDefault();
}
    , false);

// allow zooming of the viewport with pinch on mobile devices
elMap.addEventListener('touchstart', function (e) {
    const touch0 = e.touches[0];
    const touch1 = e.touches[1];
    touchstartX0 = touch0.clientX;
    touchstartY0 = touch0.clientY;
    touchstartX1 = touch1.clientX;
    touchstartY1 = touch1.clientY;
    e.preventDefault();
}, false);
