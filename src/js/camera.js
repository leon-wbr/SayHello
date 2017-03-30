/**
 * provides easy functions to take images, sets up a video and canvas element
 */
export default class Camera {
  /**
   * creates an instance of Camera
   *
   * @param {Object} [mediaOptions={ video: true, audio: false }] - configuration for getUserMedia
   * @param {number} [width=640] - width in pixels for the video element
   */
  constructor(mediaOptions = { video: true, audio: false }, width = 640) {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');

    navigator.mediaDevices.getUserMedia(mediaOptions)
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener('canplay', this.setResolution.bind(this), false);
        video.play();
      })
      .catch(err => console.error(err));

    /** type {number} */
    this.width = width;
    /** type {Object} */
    this.canvas = canvas;
    /** type {Object} */
    this.video = video;
  }

  /**
   * sets the resolution of both video and canvas element, so that no distortion happens.
   *
   * @return {Object} Object with attributes width and height, calculated.
   */
  setResolution() {
    const { canvas, video, width, setResolution } = this;
    const height = video.videoHeight / (video.videoWidth / width);

    video.setAttribute('width', width);
    video.setAttribute('height', height);
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    video.removeEventListener('canplay', setResolution);
    return { width, height };
  }

  /**
   * takes an image by drawing the video element's content on the canvas.
   *
   * @return {Object} the canvas element (can be used to access functions such as .toBlob())
   */
  takeImage() {
    const { canvas, video, video: { videoWidth, videoHeight } } = this;
    const context = canvas.getContext('2d');

    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    return canvas;
  }
}
