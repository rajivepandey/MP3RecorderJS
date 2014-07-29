var recordingLength = 0,
    recordingBuffer = [],
    bits = 16,
    sampleRate = 0;
    
    
this.addEventListener('message', function(e) {
  switch (e.data.cmd) {
    case 'init':
      init(e.data.sampleRate);
      break;
    case 'start':
      start();
      break;
    case 'stop':
      stop();
      break;
    case 'destroy':
      destroy();
      break;
      
    case 'record':
      record(e.data.buffer);
      break;
      
    case 'exportBlob':
      exportBlob();
      break;
  }
});



function init(sr) {
  sampleRate = sr;
}

function start() {
  
}

function stop() {
  
}

function destroy() {
  recordingLength  = 0;
  recordingBuffer  = [];
  sampleRate       = 0;
}



function record(buffer) {
  recordingBuffer.push(buffer);
  recordingLength += buffer.length;
}



function exportBlob() {
  var audioBlob = new Blob([encodeWAV(mergeBuffer(recordingBuffer, recordingLength))]);
  this.postMessage({ from: 'exportBlob', blob: audioBlob });
}



// HELPER FUNCTIONS

function mergeBuffer(buf, len){
  var result = new Float32Array(len);
  var offset = 0;
  for (var i = 0; i < buf.length; i++){
    result.set(buf[i], offset);
    offset += buf[i].length;
  }
  return result;
}

function encodeWAV(samples){
  var buffer  = new ArrayBuffer(44 + samples.length * 2);
  var view    = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  //view.setUint16(22, 2, true); /*STEREO*/
  view.setUint16(22, 1, true); /*MONO*/
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  //view.setUint32(28, sampleRate * 4, true); /*STEREO*/
  view.setUint32(28, sampleRate * 2, true); /*MONO*/
  /* block align (channel count * bytes per sample) */
  //view.setUint16(32, 4, true); /*STEREO*/
  view.setUint16(32, 2, true); /*MONO*/
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}

function floatTo16BitPCM(output, offset, input){
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}