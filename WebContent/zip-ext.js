/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {

	var ERR_HTTP_RANGE = "HTTP Range not supported.";
	
	var Reader = zip.Reader;

	function HttpReader(url) {
		var that = this;

		function getData(callback, onerror) {
			var request;
			if (!that.data) {
				request = new XMLHttpRequest();
				request.addEventListener("load", function() {
					if (!that.size)
						that.size = Number(request.getResponseHeader("Content-Length"));
					that.data = new Uint8Array(request.response);
					callback();
				}, false);
				request.addEventListener("error", onerror, false);
				request.open("GET", url);
				request.responseType = "arraybuffer";
				request.send();
			} else
				callback();
		}

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				callback();
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			getData(function() {
				callback(new Uint8Array(that.data.subarray(index, index + length)));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpReader.prototype = new Reader();
	HttpReader.prototype.constructor = HttpReader;

	function HttpRangeReader(url) {
		var that = this;

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				if (request.getResponseHeader("Accept-Ranges") == "bytes")
					callback();
				else
					onerror(ERR_HTTP_RANGE);
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readArrayBuffer(index, length, callback, onerror) {
			var request = new XMLHttpRequest();
			request.open("GET", url);
			request.responseType = "arraybuffer";
			request.setRequestHeader("Range", "bytes=" + index + "-" + (index + length - 1));
			request.addEventListener("load", function() {
				callback(request.response);
			}, false);
			request.addEventListener("error", onerror, false);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			readArrayBuffer(index, length, function(arraybuffer) {
				callback(new Uint8Array(arraybuffer));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpRangeReader.prototype = new Reader();
	HttpRangeReader.prototype.constructor = HttpRangeReader;
	
	function ArrayBufferReader(arrayBuffer) {
		var that = this;

		function init(callback, onerror) {
			that.size = arrayBuffer.byteLength;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			callback(new Uint8Array(arrayBuffer.slice(index, index + length)));
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	ArrayBufferReader.prototype = new zip.Reader();
	ArrayBufferReader.prototype.constructor = ArrayBufferReader;

	function ArrayBufferWriter() {
		var array, that = this;

		function init(callback, onerror) {
			array = new Uint8Array();
			callback();
		}

		function writeUint8Array(arr, callback, onerror) {
			var tmpArray = new Uint8Array(array.length + arr.length);
			tmpArray.set(array);
			tmpArray.set(arr, array.length);
			array = tmpArray;
			callback();
		}

		function getData(callback) {
			callback(array.buffer);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	ArrayBufferWriter.prototype = new zip.Writer();
	ArrayBufferWriter.prototype.constructor = ArrayBufferWriter;

	zip.HttpReader = HttpReader;
	zip.HttpRangeReader = HttpRangeReader;
	zip.ArrayBufferReader = ArrayBufferReader;
	zip.ArrayBufferWriter = ArrayBufferWriter;

})();