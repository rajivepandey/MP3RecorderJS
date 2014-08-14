# MP3RecorderJS #

Record MP3 (and WAV) files in the browser using JavaScript and HTML.

## General ##

### Why? ###

The whole project got kicked off by using [Recordmp3js](https://github.com/nusofthq/Recordmp3js) - discovered in [this wonderful article by Remus](http://nusofthq.com/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/) -
and discovering that my needs were not entirely met. I needed the possibility to have multiple recorders on one site. Also, since the original code was being altered to only reflect the MP3 changes and changing
it from stereo to mono, I had the feeling that a lot of unused code has been left in there and I found it difficult to actually see what's going on.

### Fork? ###

My first idea was to fork the original project, but I soon discovered that I'm going more for a rewrite than a fork. Hence I ended up writing it anew in a different style.

## Requirements ##

* [jQuery (>= v1.11.1)](http://jquery.com/)
* [libmp3lame.js](https://github.com/akrennmair/libmp3lame-js)
* A browser that supports `navigator.getUserMedia`
  * [WC3 specification](http://dev.w3.org/2011/webrtc/editor/getusermedia.html)
  * [Supported Browsers](http://caniuse.com/#search=getUserMedia)
  
For easy use `jQuery` and `libmp3lame.js` are included in this project.

## Usage ##

### Creation ###

    // create an audio context
    var audio_context = new AudioContext;
    
    // tell the browser you want to get some audio user media
    navigator.getUserMedia({audio: true}, function(stream) {
      // create an MP3Recorder object supplying the audio context and the stream
      var recorderObject = new MP3Recorder(audio_context, stream);
    }, function(e) {
      // some error occured
    });
    
### Start recording ###

On a given `MP3Recorder` object you can simply call `start()` to start recording.

    recorderObject.start();

### Stop recording ###

On a given `MP3Recorder` object you can simply call `stop()` to stop recording.

    recorderObject.stop();
    
### Retrieving recorded data ###

On a given `MP3Recorder` object you can call 3 methods to get the recorded data, depending on which type you need.

#### As Blob data ####

    recorderObject.exportBlob(function(blobData) {
      // blobData is a Blob object
    });
    
#### As WAV data ####

    recorderObject.exportWAV(function(wavData) {
      // wavData is a base64 encoded Uint8Array
    });
    
#### As MP3 data ####

    recorderObject.exportMP3(function(mp3Data) {
      // mp3Data is a base64 encoded Uint8Array
    });
    
### Logging ###

If you create the `MP3Recorder` object with a third parameter you can specify a container and a method to log to.

    var recorderObject = new MP3Recorder(audio_context, stream,
      { statusContainer: $('#status'), statusMethod: 'replace' }
    );
    
* `statusContainer` must be a jQuery object that responds to the [`text()`](http://api.jquery.com/text/) function.
* `statusMethod` can be `'append'` to append the status text or anything else to replace it.

## Example ##

For a complete example, using multiple recorders on a page, see the `index.html` file.

## Known issues ##

As mentioned in [the article by Remus](http://nusofthq.com/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/) the resulting mp3 recording will be longer by approximately 50%,
which is an issue of the lame library that's being used.

A possible fix for this is mentioned [by Nicholas in the comment section](https://nusofthq.com/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/#comment-674).


## Disclaimer ##

For the purpose of this project, [libmp3lame.js](https://github.com/akrennmair/libmp3lame-js) was used which was not developed by me.
Using LAME in your project may result in requiring a special patent license for your country. For more information see the [LAME project site](http://lame.sourceforge.net/links.php#Patents).