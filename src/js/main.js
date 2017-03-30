import Vue from 'vue';
import Camera from './camera';
import FaceAPI from './faceapi';

/*
 * This needs to be done so that the styles get compiled.
 * Normally I'd use more components, more layouts, etc. and with this you could
 * very well separate concerns. It's somewhat useless here.
 */
import styles from '../scss/style.scss';

// Suppress linter errors
let faceApi;
let camera;

/*
 * I'm using the Vue.js framework to dynamically update the front-end values and
 * to utilize a simple templating engine.
 *
 * See index.html for the template. All components could be stored in separate
 * files, but I didn't like the way that would have to be structured, so I
 * didn't do it.
 *
 * 'el' is the element used by it.
 *
 * 'data' is like an application state. Changing it makes Vue update the
 * corresponding fields in the HTML template.
 *
 * 'methods' is an object of functions which can be executed, again, from the
 * template.
 */
const app = new Vue({
  el: '#app',
  data: {
    config: {
      key: localStorage.getItem('api-key') || '',
      intervalSpeed: 6000, // the interval's cooldown in milliseconds
    },
    // Possible errors to display status in the front-end
    errors: {
      needTrain: false,
      noneSelected: false,
      noKey: false,
    },
    groupId: localStorage.getItem('person-group-id') || Math.round(Math.random() * 10000).toString(2).substring(0, 32), // TODO: Implement better generation method
    personList: [], // persons in the personGroup
    detectedFaces: [], // currently detected faces
    selectedPerson: null, // currently selected person (for updating)
  },
  methods: {
    // Changes the selected person by index
    setSelectedPerson: (index) => {
      app.errors.noneSelected = false;
      app.selectedPerson = index;
    },
    // Creates a new person based on the front-end form and resets the form
    createPerson: () => {
      faceApi.createPerson(app.groupId, app.$refs.newPersonName.value, null)
        .then(person => app.personList.push(person));

      app.$refs.newPersonName.value = null;
    },
    // Deletes a person
    deletePerson: (index) => {
      faceApi.deletePerson(app.groupId, app.personList[index].personId);
      app.personList.splice(index, 1);
    },
    // Trains the person group
    trainPersonGroup: () => {
      app.errors.needTrain = false;
      faceApi.trainPersonGroup(app.groupId);
    },
    // Add a face to the selected person
    addFaceToPerson: (faceRectangle) => {
      if (app.selectedPerson === null) return app.errors.noneSelected = true;
      app.errors.noneSelected = false;
      app.errors.needTrain = true;

      return camera.takeImage().toBlob(blob =>
        faceApi.addPersonFace(app.groupId, app.personList[app.selectedPerson].personId, blob, faceRectangle),
      );
    },
    // Set the API key to the input's value
    setApiKey: (e) => {
      const key = e.target.value;

      localStorage.setItem('api-key', key);
      faceApi.setKey(key);

      setupPersonGroup();
    },
  },
});

/**
 * Initialize the FaceAPI class used for accessing Microsoft's API.
 * Camera needs to be initialized after Vue.js because it otherwise hijacks the
 * video element.
 */
faceApi = new FaceAPI(app.config.key);
camera = new Camera();

/**
 * Checks whether the key is set.
 * This is a very simple error handler, I would've liked to expand it to also
 * check for other errors.
 */
function checkKey() {
  if (app.config.key.length < 6) {
    app.errors.noKey = true;
    return false;
  }

  app.errors.noKey = false;
  return true;
}

/**
 * Here we're setting up the personGroup.
 * I opted to use one personGroup for each user, as we don't need mulitple for
 * the use case specified. We save the id in the localStorage for persistence.
 * The FaceAPI does support multiple personGroups.
 */
function setupPersonGroup() {
  if (!checkKey()) return;

  faceApi.getPersonGroupOrCreate(app.groupId)
    .then((group) => {
      // If there was an error (most often incorrect api key, reset persons)
      if (group.response && group.response.error) {
        app.personList = [];
        return;
      }

      // save to localStorage
      localStorage.setItem('person-group-id', app.groupId);

      // If the group is not newly created, fetch all existing persons.
      if (!group.newlyCreated) {
        faceApi.listPersons(app.groupId)
          .then((persons) => {
            app.personList = persons;
          });
      }
    });
}

setupPersonGroup();

/**
 * The function detectInImage runs every six seconds, as is restricted by the
 * free rate limit (20 requests per minute, this function does two - detect and
 * identify).
 */
setTimeout(function detectInImage() {
  if (!checkKey()) {
    setTimeout(detectInImage, app.config.intervalSpeed);
    return;
  }

  // Take an image and convert it to a POSTable format (blob)
  camera.takeImage().toBlob((blob) => {
    // Send a request to the API to detect the faces
    faceApi.detect(blob).then((resp) => {
      if (resp.error) return [];

      return resp;
    }).then((faces) => {
      // Identify faces in the detected faces.
      faceApi.identify(app.groupId, faces.map(face => face.faceId))
        .then((response) => {
          // Reset every smiling variable. Smiling doubles as an 'isIdentified' boolean.
          app.personList.forEach((p, i) => delete app.personList[i].smiling);

          // If there was an error, skip the assigning and return originally detected faces.
          if (response.error) return faces;

          // Assign the most likely person's name to the face for displaying
          response.forEach((identifiedFace) => {
            // If the API couldn't find anyone, return.
            if (identifiedFace.candidates.length < 1) return;

            // Find the identified person and then the detected face
            const personIndex = app.personList.findIndex(p =>
              p.personId === identifiedFace.candidates[0].personId);

            const faceIndex = faces.findIndex(f =>
              f.faceId === identifiedFace.faceId);

            const person = app.personList[personIndex];
            const face = faces[faceIndex];

            // If the person couldn't be found, it's likely because it has been
            // deleted before and the API hasn't been retrained.
            if (person) {
              face.identifiedAs = person.name;
              person.smiling = face.faceAttributes.smile;
            } else {
              face.identifiedAs = 'Error. Please train.';
              app.errors.needTrain = true;
            }
          });

          return faces;
        }).then((detectedFaces) => {
          // Finally, display these faces
          app.detectedFaces = detectedFaces;
          // Repeat after 6 seconds, see comment above the initial declaration
          setTimeout(detectInImage, app.config.intervalSpeed);
        });
    });
  });
}, app.config.intervalSpeed);
