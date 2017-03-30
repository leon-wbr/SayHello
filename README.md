# SayHello - Microsoft Face API Demo

This is a project created for a competition to demonstrate the Microsoft Face API. The classes I created, Camera and FaceAPI, can be used in any JavaScript project.

### Features

* (Nearly) completely done using Microsoft's Face API
* Real-time tracking (depending on your license this might be slow because of rate limits)
* Real-time identification with name
* Multiple faces, multiple persons
* Makes you happier by forcing you to smile (scientifically proven: [source](https://www.scientificamerican.com/article/smile-it-could-make-you-happier/))



The project was created using ES6, SCSS, Webpack (to transpile ES6 and SCSS) and ESDoc. I only used it to simplify the development, it could have just as well been done without these resources. I have not thoroughly tested compatibility, but it works in relatively up-to-date Google Chrome and Firefox.

## Getting started

Clone the repository, install node modules (`npm install`) and run `npm start`. You might need to install some of the modules globally as needed (trial & error, sorry, but I'm on a deadline!). I was restricted to the free trial of Microsoft's cognitive services and I suspect it works much better with a paid version.

## Using the FaceAPI class

The FaceAPI class can be used in any other project. In this project, it is used for a very specific example: identifying a user by their name.

If you wanted to, let's say, tag people on a picture (given that the personGroup was already set up) and needed the coordinates for that, you could do the following:

```
import FaceApi from './faceapi';
const api = new FaceApi('your-key-inserted-here');
const image = { url: 'http://example.com/1.jpg' };
const personGroupId = 'your-person-group-id';

// uh oh, try not to nest it.
api.detect(image)
  .then(detectedFaces => {
      api.identify(personGroupId, detectedFaces.map(f => f.faceId))
        .then(identifiedFaces => {
            // Determine the identified persons.
          });
    });
```

Please note that each call of the FaceAPI corresponds to a resulting fetch request to Microsoft's API server. Thus, they are limited in rate (not regulated by the class) and asynchronously completed.

## Motivation

I created this for [IT-Talent's March competition](https://www.it-talents.de/foerderung/code-competition/code-competition-03-2017) and it took me a little less than a week. It was difficult to wrap my head around Microsoft's API and I had never used Vue.js before.

## API reference

The documentation I created was done inline with ESDoc for simplicity, it's available [here on GitHub](leon-wbr.github.io/sayhello/doc). It's not great but it has 100% coverage.

## More information

I used ESLinter with Airbnb's style guide and scss-linter with default settings.
