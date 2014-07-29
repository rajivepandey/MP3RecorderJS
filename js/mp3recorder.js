(function(window){

  var RECORDER_WORKER_PATH  = 'js/recorderWorker.js';
  var ENCODER_WORKER_PATH   = 'js/mp3Worker.js';
  
  
  var MP3Recorder = function(context, stream, cfg) {
    var config      = cfg || { statusContainer: null, statusMethod: 'append' }
    
    var bufferLen   = 4096;
    var recording   = false;
    
    this.source     = context.createMediaStreamSource(stream);
    this.node       = (context.createScriptProcessor || context.createJavaScriptNode).call(context, bufferLen, 1, 1);
    
    var recorderWorker  = new Worker(RECORDER_WORKER_PATH);
    var encoderWorker   = new Worker(ENCODER_WORKER_PATH);
    var exportCallback;
    
    
    // initialize the Recorder Worker
    recorderWorker.postMessage({ cmd: 'init', sampleRate: context.sampleRate });
    
    // the recording loop
    this.node.onaudioprocess = function(e) {
      if(!recording) return;
      recorderWorker.postMessage({ cmd: 'record', buffer: e.inputBuffer.getChannelData(0) });
    }
    
    
    this.start = function() {
      recording = true;
      this.logStatus('recording...');
    }
    this.stop = function() {
      recording = false;
      this.logStatus('stopping...');
    }
    this.destroy  = function() { recorderWorker.postMessage({ cmd: 'destroy' }); }
    
    this.logStatus = function(status) {
      if(config.statusContainer) {
        if(config.statusMethod == 'append') {
          config.statusContainer.text(config.statusContainer.text + "\n" + status);
        } else {
          config.statusContainer.text(status);
        }
      }
    }
    
    this.exportBlob = function(cb) {
      exportCallback = cb;
      if (!exportCallback) throw new Error('Callback not set');
      recorderWorker.postMessage({ cmd: 'exportBlob' });
    }
    
    this.exportWAV = function(cb) {
      // export the blob from the worker
      this.exportBlob(function(blob) {
        var fileReader = new FileReader();

        // read the blob as array buffer and convert it
        // to a base64 encoded WAV buffer
        fileReader.addEventListener("loadend", function() {
          var resultBuffer = new Uint8Array(this.result);
          cb(encode64(resultBuffer));
        });
        fileReader.readAsArrayBuffer(blob);
      });
    }
    
    this.exportMP3 = function(cb) {
      this.logStatus('converting...');
      
      // export the blob from the worker
      this.exportBlob(function(blob) {
        var fileReader = new FileReader();
        
        fileReader.addEventListener("loadend", function() {
          var wavBuffer = new Uint8Array(this.result);
          var wavData = parseWav(wavBuffer);
          
          encoderWorker.addEventListener('message', function(e) {
            if (e.data.cmd == 'data') {
              cb(encode64(e.data.buffer));
            }
          });
          
          encoderWorker.postMessage({ cmd: 'init', config: { mode: 3, channels: 1, samplerate: wavData.sampleRate, bitrate: wavData.bitsPerSample } });
          encoderWorker.postMessage({ cmd: 'encode', buf: Uint8ArrayToFloat32Array(wavData.samples) });
          encoderWorker.postMessage({ cmd: 'finish' });
        });
        
        fileReader.readAsArrayBuffer(blob);
      });
    }
    
    
    
    
    // event listener for return values of the recorderWorker
    recorderWorker.addEventListener('message', function(e) {
      switch(e.data.from) {
        case 'exportBlob':
          exportCallback(e.data.blob);
          break;
      };
    });
    
    
    // HELPER FUNCTIONS
    
  	function encode64(buffer) {
  		var binary  = '';
  	  var bytes   = new Uint8Array(buffer);
  		var len     = bytes.byteLength;

  		for(var i = 0; i < len; i++) {
  			binary += String.fromCharCode(bytes[i]);
  		}
  		return window.btoa(binary);
  	}

  	function parseWav(wav) {
  		function readInt(i, bytes) {
  			var ret = 0, shft = 0;
        
  			while(bytes) {
  				ret += wav[i] << shft; shft += 8;
  				i++; bytes--;
  			}
  			return ret;
  		}
  		if(readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
  		if(readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
      
  		return { sampleRate: readInt(24, 4), bitsPerSample: readInt(34, 2), samples: wav.subarray(44) };
  	}

  	function Uint8ArrayToFloat32Array(u8a){
  		var f32Buffer = new Float32Array(u8a.length);
  		for (var i = 0; i < u8a.length; i++) {
  			var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
  			if (value >= 0x8000) value |= ~0x7FFF;
  			f32Buffer[i] = value / 0x8000;
  		}
  		return f32Buffer;
  	}
	

    this.source.connect(this.node);
    this.node.connect(context.destination);    // this should not be necessary
  }
  
  window.MP3Recorder = MP3Recorder;

})(window);
