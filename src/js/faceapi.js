/**
 * Used for accessing Microsoft's Face API. Written for general use cases,
 * not specifically for this application.
 *
 */
export default class FaceAPI {
  /**
   * creates an instance of FaceAPI
   *
   * @param {string} key - API key
   */
  constructor(key) {
    /** type {number} */
    this.key = key;

    // This is done because internally calling functions rebinds "this" wrongly.
    this.makeRequest = this.makeRequest.bind(this);
    //this.getPersonGroupOrCreate = this.getPersonGroupOrCreate.bind(this);
    this.getPersonGroup = this.getPersonGroup.bind(this);
    this.createPersonGroup = this.createPersonGroup.bind(this);
  }

  /** type {number} */
  setKey(key) {
    this.key = key;
  }

  /**
   * makes a request to the API, used for simplifying.
   *
   * @param {string} endpoint - Endpoint to access in request
   * @param {string} [method='GET'] - Method to use for request, e.g. GET, POST, PUT, etc.
   * @param {Object} [headers={ 'Ocp-Apim-Subscription-Key': this.key, 'Content-Type': 'application/json', Accept: 'application/json' }] - Headers to send
   * @param {boolean} [isImage] - If an image is in the body
   * @return {Object} fetch request or error
   */
  makeRequest(endpoint, method = 'GET', body, headers) {
    return fetch(`https://westus.api.cognitive.microsoft.com/face/v1.0/${endpoint}`, {
      body: headers && headers['Content-Type'] === 'application/octet-stream' ? body : JSON.stringify(body),
      headers: Object.assign({ 'Ocp-Apim-Subscription-Key': this.key, 'Content-Type': 'application/json', Accept: 'application/json' }, headers),
      method,
    }).then(response => response.text())
      .then((response) => {
        // Sometimes, the response body is empty, so response.json() fails. This
        // prevents the error from happening by checking if response.text()
        // returns something proper.
        return response !== null ? JSON.parse(response) : {};
      })
      .then((response) => {
        // Catching the error is halting other parts of the class, notably
        // getPersonGroupOrCreate. So we just log it and continue.
        if (response.error) console.error(response.error);

        return response;
      });
  }

  /**
   * fetches a personGroup
   *
   * @param {number} personGroupId
   * @return {Object} fetch request
   */
  getPersonGroup(personGroupId) {
    return this.makeRequest(`persongroups/${personGroupId}`);
  }

  /**
   * creates a personGroup with name identical to the id.
   *
   * @param {string} personGroupId
   * @return {Object} fetch request
   */
  createPersonGroup(personGroupId) {
    return this.makeRequest(`persongroups/${personGroupId}`, 'PUT', {
      name: personGroupId,
    }).then(response => ({
      personGroupId,
      name: personGroupId,
      newlyCreated: true,
      response,
    }));
  }

  /**
   * trains a personGroup
   *
   * @param {string} personGroupId
   * @return {Object} fetch request
   */
  trainPersonGroup(personGroupId) {
    return this.makeRequest(`persongroups/${personGroupId}/train`, 'POST');
  }

  /**
   * checks if personGroup exists and if it doesn't, creates it.
   *
   * @param {string} personGroupId
   * @return {Object} fetch request
   */
  getPersonGroupOrCreate(personGroupId) {
    const { getPersonGroup, createPersonGroup } = this;

    return getPersonGroup(personGroupId)
      .then((response) => {
        // If there was an error (i.e. the group couldn't be found), try creating it.
        if (response.error) return createPersonGroup(personGroupId);

        return response;
      });
  }

  /**
   * create a Person
   *
   * @param {string} personGroupId
   * @param {string} name - Name to display
   * @param {string} [userData] - Secret data
   * @return {Object} fetch request
   */
  createPerson(personGroupId, name, userData) {
    return this.makeRequest(`persongroups/${personGroupId}/persons`, 'POST', {
      name,
      userData,
    }).then(response => ({
      personId: response.personId,
      persistedFaceIds: [],
      name,
      userData,
    }));
  }

  /**
   * deletes a person
   *
   * @param {string} personGroupId
   * @param {string} personId
   * @return {Object} fetch request
   */
  deletePerson(personGroupId, personId) {
    return this.makeRequest(`persongroups/${personGroupId}/persons/${personId}`, 'DELETE');
  }

  /**
   * add a PersonFace to a Person
   *
   * @param {string} personGroupId
   * @param {string} personId
   * @param {Object} image
   * @param {Object} faceRectangle
   * @return {Object} fetch request
   */
  addPersonFace(personGroupId, personId, image, faceRectangle) {
    let faceDimensions;

    if (faceRectangle) {
      const { left, top, width, height } = faceRectangle;
      faceDimensions = `?targetFace=${left},${top},${width},${height}`;
    }

    return this.makeRequest(`persongroups/${personGroupId}/persons/${personId}/persistedFaces${faceDimensions}`, 'POST', image, {
      'Content-Type': 'application/octet-stream',
    });
  }

  /**
   * lists all Persons of a PersonGroup
   *
   * @param {string} personGroupId
   * @return {Object} fetch request
   */
  listPersons(personGroupId) {
    return this.makeRequest(`persongroups/${personGroupId}/persons`);
  }

  /**
   * detects faces in an image
   *
   * @param {blob} image
   * @return {Object} fetch request
   */
  detect(image) {
    let headers;

    if (image && !image.url) {
      headers = {
        'Content-Type': 'application/octet-stream',
      };
    }

    return this.makeRequest('detect?returnFaceId=true&returnFaceAttributes=smile', 'POST', image, headers);
  }

  /**
   * identifies persons from faceIds
   *
   * @param {string} personGroupId
   * @param {string[]} faceIds
   * @return {Object} fetch request
   */
  identify(personGroupId, faceIds) {
    return this.makeRequest('identify', 'POST', {
      personGroupId,
      faceIds,
    });
  }
}
