// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != 'undefined';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string' && process.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {

}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == 'undefined' || !process.release || process.release.name !== 'node') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split('.').slice(0, 3);
  numericVersion = (numericVersion[0] * 10000) + (numericVersion[1] * 100) + (numericVersion[2].split('-')[0] * 1);
  var minVersion = 160000;
  if (numericVersion < 160000) {
    throw new Error('This emscripten-generated code requires node v16.0.0 (detected v' + nodeVersion + ')');
  }

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('fs');
  var nodePath = require('path');

  scriptDirectory = __dirname + '/';

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  assert(Buffer.isBuffer(ret));
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  assert(binary ? Buffer.isBuffer(ret) : typeof ret == 'string');
  return ret;
};
// end include: node_shell_read.js
  if (!Module['thisProgram'] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  arguments_ = process.argv.slice(2);

  if (typeof module != 'undefined') {
    module['exports'] = Module;
  }

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else
if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof WorkerGlobalScope != 'undefined') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith('blob:')) {
    scriptDirectory = '';
  } else {
    scriptDirectory = scriptDirectory.slice(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/')+1);
  }

  if (!(typeof window == 'object' || typeof WorkerGlobalScope != 'undefined')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');

// include: wasm2js.js
// wasm2js.js - enough of a polyfill for the WebAssembly object so that we can load
// wasm2js code that way.

// Emit "var WebAssembly" if definitely using wasm2js. Otherwise, in MAYBE_WASM2JS
// mode, we can't use a "var" since it would prevent normal wasm from working.
/** @suppress{duplicate, const} */
var
WebAssembly = {
  // Note that we do not use closure quoting (this['buffer'], etc.) on these
  // functions, as they are just meant for internal use. In other words, this is
  // not a fully general polyfill.
  /** @constructor */
  Memory: function(opts) {
    this.buffer = new ArrayBuffer(opts['initial'] * 65536);
  },

  Module: function(binary) {
    // TODO: use the binary and info somehow - right now the wasm2js output is embedded in
    // the main JS
  },

  /** @constructor */
  Instance: function(module, info) {
    // TODO: use the module somehow - right now the wasm2js output is embedded in
    // the main JS
    // This will be replaced by the actual wasm2js code.
    this.exports = (
function instantiate(info) {
function Table(ret) {
  // grow method not included; table is not growable
  ret.set = function(i, func) {
    this[i] = func;
  };
  ret.get = function(i) {
    return this[i];
  };
  return ret;
}

  var bufferView;
  var base64ReverseLookup = new Uint8Array(123/*'z'+1*/);
  for (var i = 25; i >= 0; --i) {
    base64ReverseLookup[48+i] = 52+i; // '0-9'
    base64ReverseLookup[65+i] = i; // 'A-Z'
    base64ReverseLookup[97+i] = 26+i; // 'a-z'
  }
  base64ReverseLookup[43] = 62; // '+'
  base64ReverseLookup[47] = 63; // '/'
  /** @noinline Inlining this function would mean expanding the base64 string 4x times in the source code, which Closure seems to be happy to do. */
  function base64DecodeToExistingUint8Array(uint8Array, offset, b64) {
    var b1, b2, i = 0, j = offset, bLength = b64.length, end = offset + (bLength*3>>2) - (b64[bLength-2] == '=') - (b64[bLength-1] == '=');
    for (; i < bLength; i += 4) {
      b1 = base64ReverseLookup[b64.charCodeAt(i+1)];
      b2 = base64ReverseLookup[b64.charCodeAt(i+2)];
      uint8Array[j++] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
      if (j < end) uint8Array[j++] = b1 << 4 | b2 >> 2;
      if (j < end) uint8Array[j++] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i+3)];
    }
    return uint8Array;
  }
function initActiveSegments(imports) {
  base64DecodeToExistingUint8Array(bufferView, 65536, "LSsgICAwWDB4AC0wWCswWCAwWC0weCsweCAweAAlczolZDogJXMAdmVjdG9yAC9lbXNkay9lbXNjcmlwdGVuL3N5c3RlbS9saWIvbGliY3h4YWJpL3NyYy9wcml2YXRlX3R5cGVpbmZvLmNwcABzdGQ6OmV4Y2VwdGlvbgBuYW4AYmFkX2FycmF5X25ld19sZW5ndGgAaW5mAHN0ZDo6YmFkX2FsbG9jAE5BTgBJTkYAY2F0Y2hpbmcgYSBjbGFzcyB3aXRob3V0IGFuIG9iamVjdD8ALgAobnVsbCkAbGliYysrYWJpOiAAAACADQEAGQALABkZGQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAAZAAoKGRkZAwoHAAEACQsYAAAJBgsAAAsABhkAAAAZGRkAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAGQALDRkZGQANAAACAAkOAAAACQAOAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAABMAAAAAEwAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAABA8AAAAACRAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAEQAAAAARAAAAAAkSAAAAAAASAAASAAAaAAAAGhoaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAAaGhoAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAXAAAAABcAAAAACRQAAAAAABQAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgAAAAAAAAAAAAAAFQAAAAAVAAAAAAkWAAAAAAAWAAAWAAAwMTIzNDU2Nzg5QUJDREVGYAMBANwCAQCwBAEATjEwX19jeHhhYml2MTE2X19zaGltX3R5cGVfaW5mb0UAAAAAYAMBAAwDAQDQAgEATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAAAAAAAAAAADAQAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAAAAAAACAAwEACQAAABEAAAALAAAADAAAAA0AAAASAAAAEwAAABQAAABgAwEAjAMBAAADAQBOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UAAAAAAAAAAAgEAQABAAAAFQAAABYAAAAAAAAAJAQBAAEAAAAXAAAAGAAAAAAAAADwAwEAAQAAABkAAAAaAAAAOAMBAPgDAQBTdDlleGNlcHRpb24AAAAAYAMBABQEAQDwAwEAU3Q5YmFkX2FsbG9jAAAAAGADAQAwBAEACAQBAFN0MjBiYWRfYXJyYXlfbmV3X2xlbmd0aAAAAAAAAAAAYAQBAAIAAAAbAAAAHAAAAGADAQBsBAEA8AMBAFN0MTFsb2dpY19lcnJvcgAAAAAAkAQBAAIAAAAdAAAAHAAAAGADAQCcBAEAYAQBAFN0MTJsZW5ndGhfZXJyb3IAAAAAOAMBALgEAQBTdDl0eXBlX2luZm8ATm8gZXJyb3IgaW5mb3JtYXRpb24ASWxsZWdhbCBieXRlIHNlcXVlbmNlAERvbWFpbiBlcnJvcgBSZXN1bHQgbm90IHJlcHJlc2VudGFibGUATm90IGEgdHR5AFBlcm1pc3Npb24gZGVuaWVkAE9wZXJhdGlvbiBub3QgcGVybWl0dGVkAE5vIHN1Y2ggZmlsZSBvciBkaXJlY3RvcnkATm8gc3VjaCBwcm9jZXNzAEZpbGUgZXhpc3RzAFZhbHVlIHRvbyBsYXJnZSBmb3IgZGF0YSB0eXBlAE5vIHNwYWNlIGxlZnQgb24gZGV2aWNlAE91dCBvZiBtZW1vcnkAUmVzb3VyY2UgYnVzeQBJbnRlcnJ1cHRlZCBzeXN0ZW0gY2FsbABSZXNvdXJjZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZQBJbnZhbGlkIHNlZWsAQ3Jvc3MtZGV2aWNlIGxpbmsAUmVhZC1vbmx5IGZpbGUgc3lzdGVtAERpcmVjdG9yeSBub3QgZW1wdHkAQ29ubmVjdGlvbiByZXNldCBieSBwZWVyAE9wZXJhdGlvbiB0aW1lZCBvdXQAQ29ubmVjdGlvbiByZWZ1c2VkAEhvc3QgaXMgZG93bgBIb3N0IGlzIHVucmVhY2hhYmxlAEFkZHJlc3MgaW4gdXNlAEJyb2tlbiBwaXBlAEkvTyBlcnJvcgBObyBzdWNoIGRldmljZSBvciBhZGRyZXNzAEJsb2NrIGRldmljZSByZXF1aXJlZABObyBzdWNoIGRldmljZQBOb3QgYSBkaXJlY3RvcnkASXMgYSBkaXJlY3RvcnkAVGV4dCBmaWxlIGJ1c3kARXhlYyBmb3JtYXQgZXJyb3IASW52YWxpZCBhcmd1bWVudABBcmd1bWVudCBsaXN0IHRvbyBsb25nAFN5bWJvbGljIGxpbmsgbG9vcABGaWxlbmFtZSB0b28gbG9uZwBUb28gbWFueSBvcGVuIGZpbGVzIGluIHN5c3RlbQBObyBmaWxlIGRlc2NyaXB0b3JzIGF2YWlsYWJsZQBCYWQgZmlsZSBkZXNjcmlwdG9yAE5vIGNoaWxkIHByb2Nlc3MAQmFkIGFkZHJlc3MARmlsZSB0b28gbGFyZ2UAVG9vIG1hbnkgbGlua3MATm8gbG9ja3MgYXZhaWxhYmxlAFJlc291cmNlIGRlYWRsb2NrIHdvdWxkIG9jY3VyAFN0YXRlIG5vdCByZWNvdmVyYWJsZQBQcmV2aW91cyBvd25lciBkaWVkAE9wZXJhdGlvbiBjYW5jZWxlZABGdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQATm8gbWVzc2FnZSBvZiBkZXNpcmVkIHR5cGUASWRlbnRpZmllciByZW1vdmVkAERldmljZSBub3QgYSBzdHJlYW0ATm8gZGF0YSBhdmFpbGFibGUARGV2aWNlIHRpbWVvdXQAT3V0IG9mIHN0cmVhbXMgcmVzb3VyY2VzAExpbmsgaGFzIGJlZW4gc2V2ZXJlZABQcm90b2NvbCBlcnJvcgBCYWQgbWVzc2FnZQBGaWxlIGRlc2NyaXB0b3IgaW4gYmFkIHN0YXRlAE5vdCBhIHNvY2tldABEZXN0aW5hdGlvbiBhZGRyZXNzIHJlcXVpcmVkAE1lc3NhZ2UgdG9vIGxhcmdlAFByb3RvY29sIHdyb25nIHR5cGUgZm9yIHNvY2tldABQcm90b2NvbCBub3QgYXZhaWxhYmxlAFByb3RvY29sIG5vdCBzdXBwb3J0ZWQAU29ja2V0IHR5cGUgbm90IHN1cHBvcnRlZABOb3Qgc3VwcG9ydGVkAFByb3RvY29sIGZhbWlseSBub3Qgc3VwcG9ydGVkAEFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWQgYnkgcHJvdG9jb2wAQWRkcmVzcyBub3QgYXZhaWxhYmxlAE5ldHdvcmsgaXMgZG93bgBOZXR3b3JrIHVucmVhY2hhYmxlAENvbm5lY3Rpb24gcmVzZXQgYnkgbmV0d29yawBDb25uZWN0aW9uIGFib3J0ZWQATm8gYnVmZmVyIHNwYWNlIGF2YWlsYWJsZQBTb2NrZXQgaXMgY29ubmVjdGVkAFNvY2tldCBub3QgY29ubmVjdGVkAENhbm5vdCBzZW5kIGFmdGVyIHNvY2tldCBzaHV0ZG93bgBPcGVyYXRpb24gYWxyZWFkeSBpbiBwcm9ncmVzcwBPcGVyYXRpb24gaW4gcHJvZ3Jlc3MAU3RhbGUgZmlsZSBoYW5kbGUAUmVtb3RlIEkvTyBlcnJvcgBRdW90YSBleGNlZWRlZABObyBtZWRpdW0gZm91bmQAV3JvbmcgbWVkaXVtIHR5cGUATXVsdGlob3AgYXR0ZW1wdGVkAFJlcXVpcmVkIGtleSBub3QgYXZhaWxhYmxlAEtleSBoYXMgZXhwaXJlZABLZXkgaGFzIGJlZW4gcmV2b2tlZABLZXkgd2FzIHJlamVjdGVkIGJ5IHNlcnZpY2UAAAAApQJbAPABtQWMBSUBgwYdA5QE/wDHAzEDCwa8AY8BfwPKBCsA2gavAEIDTgPcAQ4EFQChBg0BlAILAjgGZAK8Av8CXQPnBAsHzwLLBe8F2wXhAh4GRQKFAIICbANvBPEA8wMYBdkA2gNMBlQCewGdA70EAABRABUCuwCzA20A/wGFBC8F+QQ4AGUBRgGfALcGqAFzAlMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIQQAAAAAAAAAAC8CAAAAAAAAAAAAAAAAAAAAAAAAAAA1BEcEVgQAAAAAAAAAAAAAAAAAAAAAoAQAAAAAAAAAAAAAAAAAAAAAAABGBWAFbgVhBgAAzwEAAAAAAAAAAMkG6Qb5Bh4HOQdJB14H");
  base64DecodeToExistingUint8Array(bufferView, 68984, "8BABAAAAAAAFAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAABgAAACwOAQAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAA//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACADQEA");
}

  var scratchBuffer = new ArrayBuffer(16);
  var i32ScratchView = new Int32Array(scratchBuffer);
  var f32ScratchView = new Float32Array(scratchBuffer);
  var f64ScratchView = new Float64Array(scratchBuffer);
  
  function wasm2js_scratch_load_i32(index) {
    return i32ScratchView[index];
  }
      
  function wasm2js_scratch_store_i32(index, value) {
    i32ScratchView[index] = value;
  }
      
  function wasm2js_scratch_load_f64() {
    return f64ScratchView[0];
  }
      
  function wasm2js_scratch_store_f64(value) {
    f64ScratchView[0] = value;
  }
      
  function wasm2js_memory_copy(dest, source, size) {
    // TODO: traps on invalid things
    bufferView.copyWithin(dest, source, source + size);
  }
      function wasm2js_trap() { throw new Error('abort'); }

  function wasm2js_memory_fill(dest, value, size) {
    dest = dest >>> 0;
    size = size >>> 0;
    if (dest + size > bufferView.length) throw "trap: invalid memory.fill";
    bufferView.fill(value, dest, dest + size);
  }
      
function asmFunc(imports) {
 var buffer = new ArrayBuffer(16908288);
 var HEAP8 = new Int8Array(buffer);
 var HEAP16 = new Int16Array(buffer);
 var HEAP32 = new Int32Array(buffer);
 var HEAPU8 = new Uint8Array(buffer);
 var HEAPU16 = new Uint16Array(buffer);
 var HEAPU32 = new Uint32Array(buffer);
 var HEAPF32 = new Float32Array(buffer);
 var HEAPF64 = new Float64Array(buffer);
 var Math_imul = Math.imul;
 var Math_fround = Math.fround;
 var Math_abs = Math.abs;
 var Math_clz32 = Math.clz32;
 var Math_min = Math.min;
 var Math_max = Math.max;
 var Math_floor = Math.floor;
 var Math_ceil = Math.ceil;
 var Math_trunc = Math.trunc;
 var Math_sqrt = Math.sqrt;
 var env = imports.env;
 var fimport$0 = env.__cxa_throw;
 var fimport$1 = env.emscripten_resize_heap;
 var fimport$2 = env._abort_js;
 var wasi_snapshot_preview1 = imports.wasi_snapshot_preview1;
 var fimport$3 = wasi_snapshot_preview1.fd_close;
 var fimport$4 = wasi_snapshot_preview1.fd_write;
 var fimport$5 = wasi_snapshot_preview1.fd_seek;
 var global$0 = 65536;
 var global$1 = 0;
 var global$2 = 0;
 var global$3 = 0;
 var __wasm_intrinsics_temp_i64 = 0;
 var __wasm_intrinsics_temp_i64$hi = 0;
 var i64toi32_i32$HIGH_BITS = 0;
 // EMSCRIPTEN_START_FUNCS
;
 function $0() {
  $132();
  $11();
  $39();
 }
 
 function $1($0_1) {
  $0_1 = $0_1 | 0;
  HEAP32[$0_1 >> 2] = 1;
  HEAP32[($0_1 + 4 | 0) >> 2] = 1;
  return $0_1 | 0;
 }
 
 function $2($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0, $2_1 = 0;
  $1_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
  $2_1 = HEAP32[$0_1 >> 2] | 0;
  HEAP32[($0_1 + 4 | 0) >> 2] = $2_1;
  $1_1 = $1_1 + $2_1 | 0;
  HEAP32[$0_1 >> 2] = $1_1;
  return $1_1 | 0;
 }
 
 function $3($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  block : {
   $1_1 = HEAP32[(0 + 69140 | 0) >> 2] | 0;
   if (!$1_1) {
    break block
   }
   HEAP32[(0 + 69144 | 0) >> 2] = $1_1;
   $68($1_1 | 0);
  }
 }
 
 function $4($0_1) {
  $0_1 = $0_1 | 0;
  return $2((HEAP32[(0 + 69140 | 0) >> 2] | 0) + ($0_1 << 3 | 0) | 0 | 0) | 0 | 0;
 }
 
 function $5() {
  var $2_1 = 0, $3_1 = 0, $7_1 = 0, $1_1 = 0, $4_1 = 0, $6_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $0_1 = 0, $5_1 = 0, $21_1 = 0, $59_1 = 0, $89_1 = 0;
  $0_1 = global$0 - 16 | 0;
  global$0 = $0_1;
  $1_1 = $1($0_1 + 8 | 0 | 0) | 0;
  block5 : {
   block2 : {
    block1 : {
     block : {
      $2_1 = HEAP32[(0 + 69144 | 0) >> 2] | 0;
      $3_1 = HEAP32[(0 + 69148 | 0) >> 2] | 0;
      if ($2_1 >>> 0 >= $3_1 >>> 0) {
       break block
      }
      i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
      $21_1 = i64toi32_i32$0;
      i64toi32_i32$0 = $2_1;
      HEAP32[$2_1 >> 2] = $21_1;
      HEAP32[($2_1 + 4 | 0) >> 2] = i64toi32_i32$1;
      $2_1 = $2_1 + 8 | 0;
      break block1;
     }
     $4_1 = HEAP32[(0 + 69140 | 0) >> 2] | 0;
     $2_1 = $2_1 - $4_1 | 0;
     $5_1 = $2_1 >> 3 | 0;
     $6_1 = $5_1 + 1 | 0;
     if ($6_1 >>> 0 >= 536870912 >>> 0) {
      break block2
     }
     block4 : {
      block3 : {
       $3_1 = $3_1 - $4_1 | 0;
       $7_1 = $3_1 >> 2 | 0;
       $3_1 = $3_1 >>> 0 < 2147483640 >>> 0 ? ($7_1 >>> 0 > $6_1 >>> 0 ? $7_1 : $6_1) : 536870911;
       if ($3_1) {
        break block3
       }
       $6_1 = 0;
       break block4;
      }
      if ($3_1 >>> 0 >= 536870912 >>> 0) {
       break block5
      }
      $6_1 = $65($3_1 << 3 | 0 | 0) | 0;
     }
     $7_1 = $6_1 + $2_1 | 0;
     i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
     i64toi32_i32$0 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
     $59_1 = i64toi32_i32$1;
     i64toi32_i32$1 = $7_1;
     HEAP32[$7_1 >> 2] = $59_1;
     HEAP32[($7_1 + 4 | 0) >> 2] = i64toi32_i32$0;
     $1_1 = $7_1 - ($5_1 << 3 | 0) | 0;
     block6 : {
      if (!$2_1) {
       break block6
      }
      wasm2js_memory_copy($1_1, $4_1, $2_1);
     }
     HEAP32[(0 + 69148 | 0) >> 2] = $6_1 + ($3_1 << 3 | 0) | 0;
     $2_1 = $7_1 + 8 | 0;
     HEAP32[(0 + 69144 | 0) >> 2] = $2_1;
     HEAP32[(0 + 69140 | 0) >> 2] = $1_1;
     if (!$4_1) {
      break block1
     }
     $68($4_1 | 0);
    }
    HEAP32[(0 + 69144 | 0) >> 2] = $2_1;
    $4_1 = HEAP32[(0 + 69140 | 0) >> 2] | 0;
    global$0 = $0_1 + 16 | 0;
    return (($2_1 - $4_1 | 0) >> 3 | 0) + -1 | 0 | 0;
   }
   $6(69140 | 0);
   wasm2js_trap();
  }
  $7();
  wasm2js_trap();
 }
 
 function $6($0_1) {
  $0_1 = $0_1 | 0;
  $9(65575 | 0);
  wasm2js_trap();
 }
 
 function $7() {
  fimport$0($117($87(4 | 0) | 0 | 0) | 0 | 0, 66596 | 0, 1 | 0);
  wasm2js_trap();
 }
 
 function $8() {
  var $0_1 = 0;
  $0_1 = $5() | 0;
  $2((HEAP32[(0 + 69140 | 0) >> 2] | 0) + ($0_1 << 3 | 0) | 0 | 0) | 0;
  return 0 | 0;
 }
 
 function $9($0_1) {
  $0_1 = $0_1 | 0;
  fimport$0($10($87(8 | 0) | 0 | 0, $0_1 | 0) | 0 | 0, 66704 | 0, 2 | 0);
  wasm2js_trap();
 }
 
 function $10($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1_1 = $75($0_1 | 0, $1_1 | 0) | 0;
  HEAP32[$1_1 >> 2] = 66684 + 8 | 0;
  return $1_1 | 0;
 }
 
 function $11() {
  var i64toi32_i32$1 = 0;
  i64toi32_i32$1 = 0;
  HEAP32[(i64toi32_i32$1 + 69140 | 0) >> 2] = 0;
  HEAP32[(i64toi32_i32$1 + 69144 | 0) >> 2] = 0;
  HEAP32[(0 + 69148 | 0) >> 2] = 0;
  $13(3 | 0, 0 | 0, 65536 | 0) | 0;
 }
 
 function $12($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  return $8() | 0 | 0;
 }
 
 function $13($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  return 0 | 0;
 }
 
 function $14() {
  return __wasm_memory_size() << 16 | 0 | 0;
 }
 
 function $15() {
  return 69152 | 0;
 }
 
 function $16($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0, $2_1 = 0;
  $1_1 = HEAP32[(0 + 68984 | 0) >> 2] | 0;
  $2_1 = ($0_1 + 7 | 0) & -8 | 0;
  $0_1 = $1_1 + $2_1 | 0;
  block2 : {
   block1 : {
    block : {
     if (!$2_1) {
      break block
     }
     if ($0_1 >>> 0 <= $1_1 >>> 0) {
      break block1
     }
    }
    if ($0_1 >>> 0 <= ($14() | 0) >>> 0) {
     break block2
    }
    if (fimport$1($0_1 | 0) | 0) {
     break block2
    }
   }
   HEAP32[($15() | 0) >> 2] = 48;
   return -1 | 0;
  }
  HEAP32[(0 + 68984 | 0) >> 2] = $0_1;
  return $1_1 | 0;
 }
 
 function $17() {
  fimport$2();
  wasm2js_trap();
 }
 
 function $18($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  if ($2_1) {
   wasm2js_memory_copy($0_1, $1_1, $2_1)
  }
  return $0_1 | 0;
 }
 
 function $19($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4_1 = 0, $5_1 = 0;
  block : {
   if ($2_1 >>> 0 < 512 >>> 0) {
    break block
   }
   return $18($0_1 | 0, $1_1 | 0, $2_1 | 0) | 0 | 0;
  }
  $3_1 = $0_1 + $2_1 | 0;
  block6 : {
   block1 : {
    if (($1_1 ^ $0_1 | 0) & 3 | 0) {
     break block1
    }
    block3 : {
     block2 : {
      if ($0_1 & 3 | 0) {
       break block2
      }
      $2_1 = $0_1;
      break block3;
     }
     block4 : {
      if ($2_1) {
       break block4
      }
      $2_1 = $0_1;
      break block3;
     }
     $2_1 = $0_1;
     label : while (1) {
      HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
      $1_1 = $1_1 + 1 | 0;
      $2_1 = $2_1 + 1 | 0;
      if (!($2_1 & 3 | 0)) {
       break block3
      }
      if ($2_1 >>> 0 < $3_1 >>> 0) {
       continue label
      }
      break label;
     };
    }
    $4_1 = $3_1 & -4 | 0;
    block5 : {
     if ($3_1 >>> 0 < 64 >>> 0) {
      break block5
     }
     $5_1 = $4_1 + -64 | 0;
     if ($2_1 >>> 0 > $5_1 >>> 0) {
      break block5
     }
     label1 : while (1) {
      HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
      HEAP32[($2_1 + 4 | 0) >> 2] = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
      HEAP32[($2_1 + 8 | 0) >> 2] = HEAP32[($1_1 + 8 | 0) >> 2] | 0;
      HEAP32[($2_1 + 12 | 0) >> 2] = HEAP32[($1_1 + 12 | 0) >> 2] | 0;
      HEAP32[($2_1 + 16 | 0) >> 2] = HEAP32[($1_1 + 16 | 0) >> 2] | 0;
      HEAP32[($2_1 + 20 | 0) >> 2] = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
      HEAP32[($2_1 + 24 | 0) >> 2] = HEAP32[($1_1 + 24 | 0) >> 2] | 0;
      HEAP32[($2_1 + 28 | 0) >> 2] = HEAP32[($1_1 + 28 | 0) >> 2] | 0;
      HEAP32[($2_1 + 32 | 0) >> 2] = HEAP32[($1_1 + 32 | 0) >> 2] | 0;
      HEAP32[($2_1 + 36 | 0) >> 2] = HEAP32[($1_1 + 36 | 0) >> 2] | 0;
      HEAP32[($2_1 + 40 | 0) >> 2] = HEAP32[($1_1 + 40 | 0) >> 2] | 0;
      HEAP32[($2_1 + 44 | 0) >> 2] = HEAP32[($1_1 + 44 | 0) >> 2] | 0;
      HEAP32[($2_1 + 48 | 0) >> 2] = HEAP32[($1_1 + 48 | 0) >> 2] | 0;
      HEAP32[($2_1 + 52 | 0) >> 2] = HEAP32[($1_1 + 52 | 0) >> 2] | 0;
      HEAP32[($2_1 + 56 | 0) >> 2] = HEAP32[($1_1 + 56 | 0) >> 2] | 0;
      HEAP32[($2_1 + 60 | 0) >> 2] = HEAP32[($1_1 + 60 | 0) >> 2] | 0;
      $1_1 = $1_1 + 64 | 0;
      $2_1 = $2_1 + 64 | 0;
      if ($2_1 >>> 0 <= $5_1 >>> 0) {
       continue label1
      }
      break label1;
     };
    }
    if ($2_1 >>> 0 >= $4_1 >>> 0) {
     break block6
    }
    label2 : while (1) {
     HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
     $1_1 = $1_1 + 4 | 0;
     $2_1 = $2_1 + 4 | 0;
     if ($2_1 >>> 0 < $4_1 >>> 0) {
      continue label2
     }
     break block6;
    };
   }
   block7 : {
    if ($3_1 >>> 0 >= 4 >>> 0) {
     break block7
    }
    $2_1 = $0_1;
    break block6;
   }
   block8 : {
    $4_1 = $3_1 + -4 | 0;
    if ($0_1 >>> 0 <= $4_1 >>> 0) {
     break block8
    }
    $2_1 = $0_1;
    break block6;
   }
   $2_1 = $0_1;
   label3 : while (1) {
    HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
    HEAP8[($2_1 + 1 | 0) >> 0] = HEAPU8[($1_1 + 1 | 0) >> 0] | 0;
    HEAP8[($2_1 + 2 | 0) >> 0] = HEAPU8[($1_1 + 2 | 0) >> 0] | 0;
    HEAP8[($2_1 + 3 | 0) >> 0] = HEAPU8[($1_1 + 3 | 0) >> 0] | 0;
    $1_1 = $1_1 + 4 | 0;
    $2_1 = $2_1 + 4 | 0;
    if ($2_1 >>> 0 <= $4_1 >>> 0) {
     continue label3
    }
    break label3;
   };
  }
  block9 : {
   if ($2_1 >>> 0 >= $3_1 >>> 0) {
    break block9
   }
   label4 : while (1) {
    HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
    $1_1 = $1_1 + 1 | 0;
    $2_1 = $2_1 + 1 | 0;
    if (($2_1 | 0) != ($3_1 | 0)) {
     continue label4
    }
    break label4;
   };
  }
  return $0_1 | 0;
 }
 
 function $20($0_1) {
  $0_1 = $0_1 | 0;
  block : {
   if ($0_1) {
    break block
   }
   return 0 | 0;
  }
  HEAP32[($15() | 0) >> 2] = $0_1;
  return -1 | 0;
 }
 
 function $21($0_1) {
  $0_1 = $0_1 | 0;
  return $0_1 | 0;
 }
 
 function $22($0_1) {
  $0_1 = $0_1 | 0;
  return $20(fimport$3($21(HEAP32[($0_1 + 60 | 0) >> 2] | 0 | 0) | 0 | 0) | 0 | 0) | 0 | 0;
 }
 
 function $23($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $4_1 = 0, $3_1 = 0, $5_1 = 0, $8_1 = 0, $6_1 = 0, $7_1 = 0, $9_1 = 0;
  $3_1 = global$0 - 32 | 0;
  global$0 = $3_1;
  $4_1 = HEAP32[($0_1 + 28 | 0) >> 2] | 0;
  HEAP32[($3_1 + 16 | 0) >> 2] = $4_1;
  $5_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
  HEAP32[($3_1 + 28 | 0) >> 2] = $2_1;
  HEAP32[($3_1 + 24 | 0) >> 2] = $1_1;
  $1_1 = $5_1 - $4_1 | 0;
  HEAP32[($3_1 + 20 | 0) >> 2] = $1_1;
  $6_1 = $1_1 + $2_1 | 0;
  $4_1 = $3_1 + 16 | 0;
  $7_1 = 2;
  block5 : {
   block4 : {
    block2 : {
     block1 : {
      block : {
       if (!($20(fimport$4(HEAP32[($0_1 + 60 | 0) >> 2] | 0 | 0, $3_1 + 16 | 0 | 0, 2 | 0, $3_1 + 12 | 0 | 0) | 0 | 0) | 0)) {
        break block
       }
       $5_1 = $4_1;
       break block1;
      }
      label : while (1) {
       $1_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
       if (($6_1 | 0) == ($1_1 | 0)) {
        break block2
       }
       block3 : {
        if (($1_1 | 0) > (-1 | 0)) {
         break block3
        }
        $5_1 = $4_1;
        break block4;
       }
       $8_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
       $9_1 = $1_1 >>> 0 > $8_1 >>> 0;
       $5_1 = $4_1 + ($9_1 ? 8 : 0) | 0;
       $8_1 = $1_1 - ($9_1 ? $8_1 : 0) | 0;
       HEAP32[$5_1 >> 2] = (HEAP32[$5_1 >> 2] | 0) + $8_1 | 0;
       $4_1 = $4_1 + ($9_1 ? 12 : 4) | 0;
       HEAP32[$4_1 >> 2] = (HEAP32[$4_1 >> 2] | 0) - $8_1 | 0;
       $6_1 = $6_1 - $1_1 | 0;
       $4_1 = $5_1;
       $7_1 = $7_1 - $9_1 | 0;
       if (!($20(fimport$4(HEAP32[($0_1 + 60 | 0) >> 2] | 0 | 0, $4_1 | 0, $7_1 | 0, $3_1 + 12 | 0 | 0) | 0 | 0) | 0)) {
        continue label
       }
       break label;
      };
     }
     if (($6_1 | 0) != (-1 | 0)) {
      break block4
     }
    }
    $1_1 = HEAP32[($0_1 + 44 | 0) >> 2] | 0;
    HEAP32[($0_1 + 28 | 0) >> 2] = $1_1;
    HEAP32[($0_1 + 20 | 0) >> 2] = $1_1;
    HEAP32[($0_1 + 16 | 0) >> 2] = $1_1 + (HEAP32[($0_1 + 48 | 0) >> 2] | 0) | 0;
    $1_1 = $2_1;
    break block5;
   }
   $1_1 = 0;
   HEAP32[($0_1 + 28 | 0) >> 2] = 0;
   HEAP32[($0_1 + 16 | 0) >> 2] = 0;
   HEAP32[($0_1 + 20 | 0) >> 2] = 0;
   HEAP32[$0_1 >> 2] = HEAP32[$0_1 >> 2] | 0 | 32 | 0;
   if (($7_1 | 0) == (2 | 0)) {
    break block5
   }
   $1_1 = $2_1 - (HEAP32[($5_1 + 4 | 0) >> 2] | 0) | 0;
  }
  global$0 = $3_1 + 32 | 0;
  return $1_1 | 0;
 }
 
 function $24($0_1, $1_1, $1$hi, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  $2_1 = $2_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, $3_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0;
  $3_1 = global$0 - 16 | 0;
  global$0 = $3_1;
  i64toi32_i32$0 = $1$hi;
  $2_1 = $20($143($0_1 | 0, $1_1 | 0, i64toi32_i32$0 | 0, $2_1 & 255 | 0 | 0, $3_1 + 8 | 0 | 0) | 0 | 0) | 0;
  i64toi32_i32$2 = $3_1;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  $1_1 = i64toi32_i32$0;
  $1$hi = i64toi32_i32$1;
  global$0 = i64toi32_i32$2 + 16 | 0;
  i64toi32_i32$1 = -1;
  i64toi32_i32$0 = $1$hi;
  i64toi32_i32$3 = $2_1 ? -1 : $1_1;
  i64toi32_i32$2 = $2_1 ? i64toi32_i32$1 : i64toi32_i32$0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$2;
  return i64toi32_i32$3 | 0;
 }
 
 function $25($0_1, $1_1, $1$hi, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  $2_1 = $2_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  i64toi32_i32$0 = $1$hi;
  i64toi32_i32$0 = $24(HEAP32[($0_1 + 60 | 0) >> 2] | 0 | 0, $1_1 | 0, i64toi32_i32$0 | 0, $2_1 | 0) | 0;
  i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$0 | 0;
 }
 
 function $26($0_1) {
  $0_1 = $0_1 | 0;
  return 1 | 0;
 }
 
 function $27($0_1) {
  $0_1 = $0_1 | 0;
 }
 
 function $28($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  return 0 | 0;
 }
 
 function $29($0_1) {
  $0_1 = $0_1 | 0;
 }
 
 function $30($0_1) {
  $0_1 = $0_1 | 0;
 }
 
 function $31() {
  $29(69164 | 0);
  return 69168 | 0;
 }
 
 function $32() {
  $30(69164 | 0);
 }
 
 function $33($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = HEAP32[($0_1 + 72 | 0) >> 2] | 0;
  HEAP32[($0_1 + 72 | 0) >> 2] = $1_1 + -1 | 0 | $1_1 | 0;
  block : {
   $1_1 = HEAP32[$0_1 >> 2] | 0;
   if (!($1_1 & 8 | 0)) {
    break block
   }
   HEAP32[$0_1 >> 2] = $1_1 | 32 | 0;
   return -1 | 0;
  }
  HEAP32[($0_1 + 4 | 0) >> 2] = 0;
  HEAP32[($0_1 + 8 | 0) >> 2] = 0;
  $1_1 = HEAP32[($0_1 + 44 | 0) >> 2] | 0;
  HEAP32[($0_1 + 28 | 0) >> 2] = $1_1;
  HEAP32[($0_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($0_1 + 16 | 0) >> 2] = $1_1 + (HEAP32[($0_1 + 48 | 0) >> 2] | 0) | 0;
  return 0 | 0;
 }
 
 function $34($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4_1 = 0;
  $3_1 = ($2_1 | 0) != (0 | 0);
  block2 : {
   block1 : {
    block : {
     if (!($0_1 & 3 | 0)) {
      break block
     }
     if (!$2_1) {
      break block
     }
     $4_1 = $1_1 & 255 | 0;
     label : while (1) {
      if ((HEAPU8[$0_1 >> 0] | 0 | 0) == ($4_1 | 0)) {
       break block1
      }
      $2_1 = $2_1 + -1 | 0;
      $3_1 = ($2_1 | 0) != (0 | 0);
      $0_1 = $0_1 + 1 | 0;
      if (!($0_1 & 3 | 0)) {
       break block
      }
      if ($2_1) {
       continue label
      }
      break label;
     };
    }
    if (!$3_1) {
     break block2
    }
    block3 : {
     if ((HEAPU8[$0_1 >> 0] | 0 | 0) == ($1_1 & 255 | 0 | 0)) {
      break block3
     }
     if ($2_1 >>> 0 < 4 >>> 0) {
      break block3
     }
     $4_1 = Math_imul($1_1 & 255 | 0, 16843009);
     label1 : while (1) {
      $3_1 = (HEAP32[$0_1 >> 2] | 0) ^ $4_1 | 0;
      if (((16843008 - $3_1 | 0 | $3_1 | 0) & -2139062144 | 0 | 0) != (-2139062144 | 0)) {
       break block1
      }
      $0_1 = $0_1 + 4 | 0;
      $2_1 = $2_1 + -4 | 0;
      if ($2_1 >>> 0 > 3 >>> 0) {
       continue label1
      }
      break label1;
     };
    }
    if (!$2_1) {
     break block2
    }
   }
   $3_1 = $1_1 & 255 | 0;
   label2 : while (1) {
    block4 : {
     if ((HEAPU8[$0_1 >> 0] | 0 | 0) != ($3_1 | 0)) {
      break block4
     }
     return $0_1 | 0;
    }
    $0_1 = $0_1 + 1 | 0;
    $2_1 = $2_1 + -1 | 0;
    if ($2_1) {
     continue label2
    }
    break label2;
   };
  }
  return 0 | 0;
 }
 
 function $35($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $2_1 = 0;
  $2_1 = $34($0_1 | 0, 0 | 0, $1_1 | 0) | 0;
  return ($2_1 ? $2_1 - $0_1 | 0 : $1_1) | 0;
 }
 
 function $36() {
  return 42 | 0;
 }
 
 function $37() {
  return $36() | 0 | 0;
 }
 
 function $38() {
  return 69232 | 0;
 }
 
 function $39() {
  HEAP32[(0 + 69328 | 0) >> 2] = 69208;
  HEAP32[(0 + 69256 | 0) >> 2] = $37() | 0;
 }
 
 function $40($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0;
  $3_1 = 1;
  block1 : {
   block : {
    if (!$0_1) {
     break block
    }
    if ($1_1 >>> 0 <= 127 >>> 0) {
     break block1
    }
    block3 : {
     block2 : {
      if (HEAP32[(HEAP32[(($38() | 0) + 96 | 0) >> 2] | 0) >> 2] | 0) {
       break block2
      }
      if (($1_1 & -128 | 0 | 0) == (57216 | 0)) {
       break block1
      }
      HEAP32[($15() | 0) >> 2] = 25;
      break block3;
     }
     block4 : {
      if ($1_1 >>> 0 > 2047 >>> 0) {
       break block4
      }
      HEAP8[($0_1 + 1 | 0) >> 0] = $1_1 & 63 | 0 | 128 | 0;
      HEAP8[$0_1 >> 0] = $1_1 >>> 6 | 0 | 192 | 0;
      return 2 | 0;
     }
     block6 : {
      block5 : {
       if ($1_1 >>> 0 < 55296 >>> 0) {
        break block5
       }
       if (($1_1 & -8192 | 0 | 0) != (57344 | 0)) {
        break block6
       }
      }
      HEAP8[($0_1 + 2 | 0) >> 0] = $1_1 & 63 | 0 | 128 | 0;
      HEAP8[$0_1 >> 0] = $1_1 >>> 12 | 0 | 224 | 0;
      HEAP8[($0_1 + 1 | 0) >> 0] = ($1_1 >>> 6 | 0) & 63 | 0 | 128 | 0;
      return 3 | 0;
     }
     block7 : {
      if (($1_1 + -65536 | 0) >>> 0 > 1048575 >>> 0) {
       break block7
      }
      HEAP8[($0_1 + 3 | 0) >> 0] = $1_1 & 63 | 0 | 128 | 0;
      HEAP8[$0_1 >> 0] = $1_1 >>> 18 | 0 | 240 | 0;
      HEAP8[($0_1 + 2 | 0) >> 0] = ($1_1 >>> 6 | 0) & 63 | 0 | 128 | 0;
      HEAP8[($0_1 + 1 | 0) >> 0] = ($1_1 >>> 12 | 0) & 63 | 0 | 128 | 0;
      return 4 | 0;
     }
     HEAP32[($15() | 0) >> 2] = 25;
    }
    $3_1 = -1;
   }
   return $3_1 | 0;
  }
  HEAP8[$0_1 >> 0] = $1_1;
  return 1 | 0;
 }
 
 function $41($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  block : {
   if ($0_1) {
    break block
   }
   return 0 | 0;
  }
  return $40($0_1 | 0, $1_1 | 0, 0 | 0) | 0 | 0;
 }
 
 function $42($0_1, $1_1) {
  $0_1 = +$0_1;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0, $3_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$4 = 0, $2_1 = 0, $10_1 = 0, $2$hi = 0;
  block : {
   wasm2js_scratch_store_f64(+$0_1);
   i64toi32_i32$0 = wasm2js_scratch_load_i32(1 | 0) | 0;
   $2_1 = wasm2js_scratch_load_i32(0 | 0) | 0;
   $2$hi = i64toi32_i32$0;
   i64toi32_i32$2 = $2_1;
   i64toi32_i32$1 = 0;
   i64toi32_i32$3 = 52;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$1 = 0;
    $10_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   } else {
    i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
    $10_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
   }
   $3_1 = $10_1 & 2047 | 0;
   if (($3_1 | 0) == (2047 | 0)) {
    break block
   }
   block1 : {
    if ($3_1) {
     break block1
    }
    block3 : {
     block2 : {
      if ($0_1 != 0.0) {
       break block2
      }
      $3_1 = 0;
      break block3;
     }
     $0_1 = +$42(+($0_1 * 18446744073709551615.0), $1_1 | 0);
     $3_1 = (HEAP32[$1_1 >> 2] | 0) + -64 | 0;
    }
    HEAP32[$1_1 >> 2] = $3_1;
    return +$0_1;
   }
   HEAP32[$1_1 >> 2] = $3_1 + -1022 | 0;
   i64toi32_i32$1 = $2$hi;
   i64toi32_i32$0 = $2_1;
   i64toi32_i32$2 = -2146435073;
   i64toi32_i32$3 = -1;
   i64toi32_i32$2 = i64toi32_i32$1 & i64toi32_i32$2 | 0;
   i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
   i64toi32_i32$0 = 1071644672;
   i64toi32_i32$3 = 0;
   i64toi32_i32$0 = i64toi32_i32$2 | i64toi32_i32$0 | 0;
   wasm2js_scratch_store_i32(0 | 0, i64toi32_i32$1 | i64toi32_i32$3 | 0 | 0);
   wasm2js_scratch_store_i32(1 | 0, i64toi32_i32$0 | 0);
   $0_1 = +wasm2js_scratch_load_f64();
  }
  return +$0_1;
 }
 
 function $43($0_1, $1_1, $1$hi, $2_1, $2$hi, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  $2_1 = $2_1 | 0;
  $2$hi = $2$hi | 0;
  $3_1 = $3_1 | 0;
  var i64toi32_i32$1 = 0, i64toi32_i32$4 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$3 = 0, $4$hi = 0, $18_1 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $11$hi = 0, $18$hi = 0, $19_1 = 0, $19$hi = 0, $4_1 = 0, $24$hi = 0;
  block1 : {
   block : {
    if (!($3_1 & 64 | 0)) {
     break block
    }
    i64toi32_i32$0 = $1$hi;
    i64toi32_i32$0 = 0;
    $11$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $1$hi;
    i64toi32_i32$2 = $1_1;
    i64toi32_i32$1 = $11$hi;
    i64toi32_i32$3 = $3_1 + -64 | 0;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
     $18_1 = 0;
    } else {
     i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
     $18_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    }
    $2_1 = $18_1;
    $2$hi = i64toi32_i32$1;
    i64toi32_i32$1 = 0;
    $1_1 = 0;
    $1$hi = i64toi32_i32$1;
    break block1;
   }
   if (!$3_1) {
    break block1
   }
   i64toi32_i32$1 = $1$hi;
   i64toi32_i32$1 = 0;
   $18$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $1$hi;
   i64toi32_i32$0 = $1_1;
   i64toi32_i32$2 = $18$hi;
   i64toi32_i32$3 = 64 - $3_1 | 0;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = 0;
    $20_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   } else {
    i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
    $20_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
   }
   $19_1 = $20_1;
   $19$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $2$hi;
   i64toi32_i32$2 = 0;
   $4_1 = $3_1;
   $4$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $2$hi;
   i64toi32_i32$1 = $2_1;
   i64toi32_i32$0 = $4$hi;
   i64toi32_i32$3 = $3_1;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
    $21_1 = 0;
   } else {
    i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$4 | 0) | 0;
    $21_1 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
   }
   $24$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $19$hi;
   i64toi32_i32$2 = $19_1;
   i64toi32_i32$1 = $24$hi;
   i64toi32_i32$3 = $21_1;
   i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
   $2_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
   $2$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $1$hi;
   i64toi32_i32$1 = $4$hi;
   i64toi32_i32$1 = $1$hi;
   i64toi32_i32$0 = $1_1;
   i64toi32_i32$2 = $4$hi;
   i64toi32_i32$3 = $4_1;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
    $22_1 = 0;
   } else {
    i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
    $22_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
   }
   $1_1 = $22_1;
   $1$hi = i64toi32_i32$2;
  }
  i64toi32_i32$2 = $1$hi;
  i64toi32_i32$0 = $0_1;
  HEAP32[i64toi32_i32$0 >> 2] = $1_1;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$2;
  i64toi32_i32$2 = $2$hi;
  HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $2_1;
  HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$2;
 }
 
 function $44($0_1, $1_1, $1$hi, $2_1, $2$hi, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  $2_1 = $2_1 | 0;
  $2$hi = $2$hi | 0;
  $3_1 = $3_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$4 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0, $4$hi = 0, $18_1 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $11$hi = 0, $18$hi = 0, $19_1 = 0, $19$hi = 0, $4_1 = 0, $24$hi = 0;
  block1 : {
   block : {
    if (!($3_1 & 64 | 0)) {
     break block
    }
    i64toi32_i32$0 = $2$hi;
    i64toi32_i32$0 = 0;
    $11$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $2$hi;
    i64toi32_i32$2 = $2_1;
    i64toi32_i32$1 = $11$hi;
    i64toi32_i32$3 = $3_1 + -64 | 0;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = 0;
     $18_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
     $18_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
    }
    $1_1 = $18_1;
    $1$hi = i64toi32_i32$1;
    i64toi32_i32$1 = 0;
    $2_1 = 0;
    $2$hi = i64toi32_i32$1;
    break block1;
   }
   if (!$3_1) {
    break block1
   }
   i64toi32_i32$1 = $2$hi;
   i64toi32_i32$1 = 0;
   $18$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $2$hi;
   i64toi32_i32$0 = $2_1;
   i64toi32_i32$2 = $18$hi;
   i64toi32_i32$3 = 64 - $3_1 | 0;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
    $20_1 = 0;
   } else {
    i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
    $20_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
   }
   $19_1 = $20_1;
   $19$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $1$hi;
   i64toi32_i32$2 = 0;
   $4_1 = $3_1;
   $4$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $1$hi;
   i64toi32_i32$1 = $1_1;
   i64toi32_i32$0 = $4$hi;
   i64toi32_i32$3 = $3_1;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = 0;
    $21_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
   } else {
    i64toi32_i32$0 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
    $21_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
   }
   $24$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $19$hi;
   i64toi32_i32$2 = $19_1;
   i64toi32_i32$1 = $24$hi;
   i64toi32_i32$3 = $21_1;
   i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
   $1_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
   $1$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $2$hi;
   i64toi32_i32$1 = $4$hi;
   i64toi32_i32$1 = $2$hi;
   i64toi32_i32$0 = $2_1;
   i64toi32_i32$2 = $4$hi;
   i64toi32_i32$3 = $4_1;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = 0;
    $22_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   } else {
    i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
    $22_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
   }
   $2_1 = $22_1;
   $2$hi = i64toi32_i32$2;
  }
  i64toi32_i32$2 = $1$hi;
  i64toi32_i32$0 = $0_1;
  HEAP32[i64toi32_i32$0 >> 2] = $1_1;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$2;
  i64toi32_i32$2 = $2$hi;
  HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $2_1;
  HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$2;
 }
 
 function $45($0_1, $0$hi, $1_1, $1$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  var i64toi32_i32$3 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$5 = 0, i64toi32_i32$4 = 0, $7_1 = 0, $7$hi = 0, $3_1 = 0, $2_1 = 0, $8_1 = 0, $8$hi = 0, $6_1 = 0, $47_1 = 0, $48_1 = 0, $49_1 = 0, $50_1 = 0, $51_1 = 0, $4_1 = 0, $5_1 = 0, $52_1 = 0, $53_1 = 0, $54_1 = 0, $23_1 = 0, $23$hi = 0, $25$hi = 0, $39$hi = 0, $48$hi = 0, $58_1 = 0, $58$hi = 0, $60$hi = 0, $79_1 = 0, $79$hi = 0, $92_1 = 0, $92$hi = 0, $95$hi = 0, $98_1 = 0, $98$hi = 0, $103_1 = 0, $103$hi = 0, $105_1 = 0, $105$hi = 0, $108_1 = 0, $109$hi = 0, $118$hi = 0, $122_1 = 0, $122$hi = 0, $133$hi = 0, $135_1 = 0, $135$hi = 0, $136$hi = 0;
  $2_1 = global$0 - 32 | 0;
  global$0 = $2_1;
  i64toi32_i32$0 = $1$hi;
  i64toi32_i32$2 = $1_1;
  i64toi32_i32$1 = 65535;
  i64toi32_i32$3 = -1;
  i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$1 | 0;
  $7_1 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
  $7$hi = i64toi32_i32$1;
  block3 : {
   block : {
    i64toi32_i32$1 = i64toi32_i32$0;
    i64toi32_i32$1 = i64toi32_i32$0;
    i64toi32_i32$0 = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    i64toi32_i32$3 = 48;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = 0;
     $47_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
     $47_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
    }
    i64toi32_i32$1 = $47_1;
    i64toi32_i32$0 = 0;
    i64toi32_i32$3 = 32767;
    i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
    $8_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
    $8$hi = i64toi32_i32$0;
    $3_1 = $8_1;
    if (($3_1 + -15361 | 0) >>> 0 > 2045 >>> 0) {
     break block
    }
    i64toi32_i32$0 = $0$hi;
    i64toi32_i32$2 = $0_1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 60;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = 0;
     $48_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
     $48_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
    }
    $23_1 = $48_1;
    $23$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $7$hi;
    i64toi32_i32$0 = $7_1;
    i64toi32_i32$2 = 0;
    i64toi32_i32$3 = 4;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
     $49_1 = 0;
    } else {
     i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
     $49_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
    }
    $25$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $23$hi;
    i64toi32_i32$1 = $23_1;
    i64toi32_i32$0 = $25$hi;
    i64toi32_i32$3 = $49_1;
    i64toi32_i32$0 = i64toi32_i32$2 | i64toi32_i32$0 | 0;
    $7_1 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
    $7$hi = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    $8_1 = $3_1 + -15360 | 0;
    $8$hi = i64toi32_i32$0;
    block2 : {
     block1 : {
      i64toi32_i32$0 = $0$hi;
      i64toi32_i32$2 = $0_1;
      i64toi32_i32$1 = 268435455;
      i64toi32_i32$3 = -1;
      i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$1 | 0;
      $0_1 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
      $0$hi = i64toi32_i32$1;
      i64toi32_i32$0 = $0_1;
      i64toi32_i32$2 = 134217728;
      i64toi32_i32$3 = 1;
      if (i64toi32_i32$1 >>> 0 < i64toi32_i32$2 >>> 0 | ((i64toi32_i32$1 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) {
       break block1
      }
      i64toi32_i32$0 = $7$hi;
      i64toi32_i32$3 = $7_1;
      i64toi32_i32$1 = 0;
      i64toi32_i32$2 = 1;
      i64toi32_i32$4 = i64toi32_i32$3 + i64toi32_i32$2 | 0;
      i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1 | 0;
      if (i64toi32_i32$4 >>> 0 < i64toi32_i32$2 >>> 0) {
       i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
      }
      $7_1 = i64toi32_i32$4;
      $7$hi = i64toi32_i32$5;
      break block2;
     }
     i64toi32_i32$5 = $0$hi;
     i64toi32_i32$0 = $0_1;
     i64toi32_i32$3 = 134217728;
     i64toi32_i32$2 = 0;
     if ((i64toi32_i32$0 | 0) != (i64toi32_i32$2 | 0) | (i64toi32_i32$5 | 0) != (i64toi32_i32$3 | 0) | 0) {
      break block2
     }
     i64toi32_i32$0 = $7$hi;
     i64toi32_i32$2 = $7_1;
     i64toi32_i32$5 = 0;
     i64toi32_i32$3 = 1;
     i64toi32_i32$5 = i64toi32_i32$0 & i64toi32_i32$5 | 0;
     $39$hi = i64toi32_i32$5;
     i64toi32_i32$5 = i64toi32_i32$0;
     i64toi32_i32$5 = $39$hi;
     i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
     i64toi32_i32$2 = $7$hi;
     i64toi32_i32$3 = $7_1;
     i64toi32_i32$1 = i64toi32_i32$0 + i64toi32_i32$3 | 0;
     i64toi32_i32$4 = i64toi32_i32$5 + i64toi32_i32$2 | 0;
     if (i64toi32_i32$1 >>> 0 < i64toi32_i32$3 >>> 0) {
      i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
     }
     $7_1 = i64toi32_i32$1;
     $7$hi = i64toi32_i32$4;
    }
    i64toi32_i32$4 = $7$hi;
    i64toi32_i32$5 = $7_1;
    i64toi32_i32$0 = 1048575;
    i64toi32_i32$3 = -1;
    $3_1 = i64toi32_i32$4 >>> 0 > i64toi32_i32$0 >>> 0 | ((i64toi32_i32$4 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$5 >>> 0 > i64toi32_i32$3 >>> 0 | 0) | 0;
    i64toi32_i32$2 = $3_1;
    i64toi32_i32$5 = 0;
    i64toi32_i32$0 = i64toi32_i32$2 ? 0 : $7_1;
    i64toi32_i32$3 = i64toi32_i32$2 ? i64toi32_i32$5 : i64toi32_i32$4;
    $0_1 = i64toi32_i32$0;
    $0$hi = i64toi32_i32$3;
    i64toi32_i32$3 = 0;
    $48$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $8$hi;
    i64toi32_i32$3 = $48$hi;
    i64toi32_i32$0 = $8$hi;
    i64toi32_i32$5 = $8_1;
    i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$5 | 0;
    i64toi32_i32$1 = i64toi32_i32$3 + i64toi32_i32$0 | 0;
    if (i64toi32_i32$4 >>> 0 < i64toi32_i32$5 >>> 0) {
     i64toi32_i32$1 = i64toi32_i32$1 + 1 | 0
    }
    $7_1 = i64toi32_i32$4;
    $7$hi = i64toi32_i32$1;
    break block3;
   }
   block4 : {
    i64toi32_i32$1 = $0$hi;
    i64toi32_i32$1 = $7$hi;
    i64toi32_i32$1 = $0$hi;
    i64toi32_i32$3 = $0_1;
    i64toi32_i32$2 = $7$hi;
    i64toi32_i32$5 = $7_1;
    i64toi32_i32$2 = i64toi32_i32$1 | i64toi32_i32$2 | 0;
    if (!(i64toi32_i32$3 | i64toi32_i32$5 | 0 | i64toi32_i32$2 | 0)) {
     break block4
    }
    i64toi32_i32$2 = $8$hi;
    i64toi32_i32$1 = $8_1;
    i64toi32_i32$3 = 0;
    i64toi32_i32$5 = 32767;
    if ((i64toi32_i32$1 | 0) != (i64toi32_i32$5 | 0) | (i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | 0) {
     break block4
    }
    i64toi32_i32$1 = $0$hi;
    i64toi32_i32$5 = $0_1;
    i64toi32_i32$2 = 0;
    i64toi32_i32$3 = 60;
    i64toi32_i32$0 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = 0;
     $50_1 = i64toi32_i32$1 >>> i64toi32_i32$0 | 0;
    } else {
     i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$0 | 0;
     $50_1 = (((1 << i64toi32_i32$0 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$0 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$0 | 0) | 0;
    }
    $58_1 = $50_1;
    $58$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $7$hi;
    i64toi32_i32$1 = $7_1;
    i64toi32_i32$5 = 0;
    i64toi32_i32$3 = 4;
    i64toi32_i32$0 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$5 = i64toi32_i32$1 << i64toi32_i32$0 | 0;
     $51_1 = 0;
    } else {
     i64toi32_i32$5 = ((1 << i64toi32_i32$0 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$0 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$0 | 0) | 0;
     $51_1 = i64toi32_i32$1 << i64toi32_i32$0 | 0;
    }
    $60$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $58$hi;
    i64toi32_i32$2 = $58_1;
    i64toi32_i32$1 = $60$hi;
    i64toi32_i32$3 = $51_1;
    i64toi32_i32$1 = i64toi32_i32$5 | i64toi32_i32$1 | 0;
    i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
    i64toi32_i32$2 = 524288;
    i64toi32_i32$3 = 0;
    i64toi32_i32$2 = i64toi32_i32$1 | i64toi32_i32$2 | 0;
    $0_1 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
    $0$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $7_1 = 2047;
    $7$hi = i64toi32_i32$2;
    break block3;
   }
   block5 : {
    if ($3_1 >>> 0 <= 17406 >>> 0) {
     break block5
    }
    i64toi32_i32$2 = 0;
    $7_1 = 2047;
    $7$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $0_1 = 0;
    $0$hi = i64toi32_i32$2;
    break block3;
   }
   block6 : {
    i64toi32_i32$2 = $8$hi;
    $4_1 = !($8_1 | i64toi32_i32$2 | 0);
    $5_1 = $4_1 ? 15360 : 15361;
    $6_1 = $5_1 - $3_1 | 0;
    if (($6_1 | 0) <= (112 | 0)) {
     break block6
    }
    i64toi32_i32$2 = 0;
    $0_1 = 0;
    $0$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $7_1 = 0;
    $7$hi = i64toi32_i32$2;
    break block3;
   }
   i64toi32_i32$2 = $0$hi;
   i64toi32_i32$2 = $7$hi;
   i64toi32_i32$1 = $7_1;
   i64toi32_i32$5 = 65536;
   i64toi32_i32$3 = 0;
   i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5 | 0;
   $79_1 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
   $79$hi = i64toi32_i32$5;
   i64toi32_i32$0 = $4_1;
   i64toi32_i32$5 = i64toi32_i32$2;
   i64toi32_i32$1 = $79$hi;
   i64toi32_i32$3 = i64toi32_i32$0 ? $7_1 : $79_1;
   i64toi32_i32$2 = i64toi32_i32$0 ? i64toi32_i32$2 : i64toi32_i32$1;
   $7_1 = i64toi32_i32$3;
   $7$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $0$hi;
   i64toi32_i32$3 = $7$hi;
   $43($2_1 + 16 | 0 | 0, $0_1 | 0, i64toi32_i32$2 | 0, $7_1 | 0, i64toi32_i32$3 | 0, 128 - $6_1 | 0 | 0);
   i64toi32_i32$3 = i64toi32_i32$2;
   i64toi32_i32$3 = $7$hi;
   i64toi32_i32$3 = i64toi32_i32$2;
   i64toi32_i32$2 = $7$hi;
   $44($2_1 | 0, $0_1 | 0, i64toi32_i32$3 | 0, $7_1 | 0, i64toi32_i32$2 | 0, $6_1 | 0);
   i64toi32_i32$0 = $2_1;
   i64toi32_i32$2 = HEAP32[i64toi32_i32$0 >> 2] | 0;
   i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] | 0;
   $7_1 = i64toi32_i32$2;
   $7$hi = i64toi32_i32$3;
   i64toi32_i32$0 = i64toi32_i32$2;
   i64toi32_i32$2 = 0;
   i64toi32_i32$5 = 60;
   i64toi32_i32$1 = i64toi32_i32$5 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$5 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = 0;
    $52_1 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
   } else {
    i64toi32_i32$2 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
    $52_1 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$1 | 0) | 0;
   }
   $92_1 = $52_1;
   $92$hi = i64toi32_i32$2;
   i64toi32_i32$3 = $2_1;
   i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 8 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 12 | 0) >> 2] | 0;
   i64toi32_i32$3 = i64toi32_i32$2;
   i64toi32_i32$2 = 0;
   i64toi32_i32$5 = 4;
   i64toi32_i32$1 = i64toi32_i32$5 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$5 & 63 | 0) >>> 0) {
    i64toi32_i32$2 = i64toi32_i32$3 << i64toi32_i32$1 | 0;
    $53_1 = 0;
   } else {
    i64toi32_i32$2 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$1 | 0) | 0;
    $53_1 = i64toi32_i32$3 << i64toi32_i32$1 | 0;
   }
   $95$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $92$hi;
   i64toi32_i32$0 = $92_1;
   i64toi32_i32$3 = $95$hi;
   i64toi32_i32$5 = $53_1;
   i64toi32_i32$3 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
   $0_1 = i64toi32_i32$0 | i64toi32_i32$5 | 0;
   $0$hi = i64toi32_i32$3;
   block8 : {
    block7 : {
     i64toi32_i32$3 = $7$hi;
     i64toi32_i32$2 = $7_1;
     i64toi32_i32$0 = 268435455;
     i64toi32_i32$5 = -1;
     i64toi32_i32$0 = i64toi32_i32$3 & i64toi32_i32$0 | 0;
     $98_1 = i64toi32_i32$2 & i64toi32_i32$5 | 0;
     $98$hi = i64toi32_i32$0;
     i64toi32_i32$3 = $2_1;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 16 | 0) >> 2] | 0;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 20 | 0) >> 2] | 0;
     $103_1 = i64toi32_i32$0;
     $103$hi = i64toi32_i32$2;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 24 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 28 | 0) >> 2] | 0;
     $105_1 = i64toi32_i32$2;
     $105$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $103$hi;
     i64toi32_i32$3 = $103_1;
     i64toi32_i32$2 = $105$hi;
     i64toi32_i32$5 = $105_1;
     i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
     i64toi32_i32$0 = i64toi32_i32$3 | i64toi32_i32$5 | 0;
     i64toi32_i32$3 = 0;
     i64toi32_i32$5 = 0;
     $108_1 = ($5_1 | 0) != ($3_1 | 0) & ((i64toi32_i32$0 | 0) != (i64toi32_i32$5 | 0) | (i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | 0) | 0;
     i64toi32_i32$0 = 0;
     $109$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $98$hi;
     i64toi32_i32$5 = $98_1;
     i64toi32_i32$2 = $109$hi;
     i64toi32_i32$3 = $108_1;
     i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
     $7_1 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
     $7$hi = i64toi32_i32$2;
     i64toi32_i32$0 = $7_1;
     i64toi32_i32$5 = 134217728;
     i64toi32_i32$3 = 1;
     if (i64toi32_i32$2 >>> 0 < i64toi32_i32$5 >>> 0 | ((i64toi32_i32$2 | 0) == (i64toi32_i32$5 | 0) & i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) {
      break block7
     }
     i64toi32_i32$0 = $0$hi;
     i64toi32_i32$3 = $0_1;
     i64toi32_i32$2 = 0;
     i64toi32_i32$5 = 1;
     i64toi32_i32$1 = i64toi32_i32$3 + i64toi32_i32$5 | 0;
     i64toi32_i32$4 = i64toi32_i32$0 + i64toi32_i32$2 | 0;
     if (i64toi32_i32$1 >>> 0 < i64toi32_i32$5 >>> 0) {
      i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
     }
     $0_1 = i64toi32_i32$1;
     $0$hi = i64toi32_i32$4;
     break block8;
    }
    i64toi32_i32$4 = $7$hi;
    i64toi32_i32$0 = $7_1;
    i64toi32_i32$3 = 134217728;
    i64toi32_i32$5 = 0;
    if ((i64toi32_i32$0 | 0) != (i64toi32_i32$5 | 0) | (i64toi32_i32$4 | 0) != (i64toi32_i32$3 | 0) | 0) {
     break block8
    }
    i64toi32_i32$0 = $0$hi;
    i64toi32_i32$5 = $0_1;
    i64toi32_i32$4 = 0;
    i64toi32_i32$3 = 1;
    i64toi32_i32$4 = i64toi32_i32$0 & i64toi32_i32$4 | 0;
    $118$hi = i64toi32_i32$4;
    i64toi32_i32$4 = i64toi32_i32$0;
    i64toi32_i32$4 = $118$hi;
    i64toi32_i32$0 = i64toi32_i32$5 & i64toi32_i32$3 | 0;
    i64toi32_i32$5 = $0$hi;
    i64toi32_i32$3 = $0_1;
    i64toi32_i32$2 = i64toi32_i32$0 + i64toi32_i32$3 | 0;
    i64toi32_i32$1 = i64toi32_i32$4 + i64toi32_i32$5 | 0;
    if (i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0) {
     i64toi32_i32$1 = i64toi32_i32$1 + 1 | 0
    }
    $0_1 = i64toi32_i32$2;
    $0$hi = i64toi32_i32$1;
   }
   i64toi32_i32$1 = $0$hi;
   i64toi32_i32$4 = $0_1;
   i64toi32_i32$0 = 1048576;
   i64toi32_i32$3 = 0;
   i64toi32_i32$0 = i64toi32_i32$1 ^ i64toi32_i32$0 | 0;
   $122_1 = i64toi32_i32$4 ^ i64toi32_i32$3 | 0;
   $122$hi = i64toi32_i32$0;
   i64toi32_i32$0 = i64toi32_i32$1;
   i64toi32_i32$1 = i64toi32_i32$4;
   i64toi32_i32$4 = 1048575;
   i64toi32_i32$3 = -1;
   $3_1 = i64toi32_i32$0 >>> 0 > i64toi32_i32$4 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$4 | 0) & i64toi32_i32$1 >>> 0 > i64toi32_i32$3 >>> 0 | 0) | 0;
   i64toi32_i32$5 = $3_1;
   i64toi32_i32$1 = $122$hi;
   i64toi32_i32$4 = i64toi32_i32$5 ? $122_1 : $0_1;
   i64toi32_i32$3 = i64toi32_i32$5 ? i64toi32_i32$1 : i64toi32_i32$0;
   $0_1 = i64toi32_i32$4;
   $0$hi = i64toi32_i32$3;
   i64toi32_i32$3 = 0;
   $7_1 = i64toi32_i32$5;
   $7$hi = i64toi32_i32$3;
  }
  global$0 = $2_1 + 32 | 0;
  i64toi32_i32$3 = $7$hi;
  i64toi32_i32$5 = $7_1;
  i64toi32_i32$4 = 0;
  i64toi32_i32$1 = 52;
  i64toi32_i32$0 = i64toi32_i32$1 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$1 & 63 | 0) >>> 0) {
   i64toi32_i32$4 = i64toi32_i32$5 << i64toi32_i32$0 | 0;
   $54_1 = 0;
  } else {
   i64toi32_i32$4 = ((1 << i64toi32_i32$0 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$0 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$0 | 0) | 0;
   $54_1 = i64toi32_i32$5 << i64toi32_i32$0 | 0;
  }
  $133$hi = i64toi32_i32$4;
  i64toi32_i32$4 = $1$hi;
  i64toi32_i32$3 = $1_1;
  i64toi32_i32$5 = -2147483648;
  i64toi32_i32$1 = 0;
  i64toi32_i32$5 = i64toi32_i32$4 & i64toi32_i32$5 | 0;
  $135_1 = i64toi32_i32$3 & i64toi32_i32$1 | 0;
  $135$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $133$hi;
  i64toi32_i32$4 = $54_1;
  i64toi32_i32$3 = $135$hi;
  i64toi32_i32$1 = $135_1;
  i64toi32_i32$3 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
  $136$hi = i64toi32_i32$3;
  i64toi32_i32$3 = $0$hi;
  i64toi32_i32$3 = $136$hi;
  i64toi32_i32$5 = i64toi32_i32$4 | i64toi32_i32$1 | 0;
  i64toi32_i32$4 = $0$hi;
  i64toi32_i32$1 = $0_1;
  i64toi32_i32$4 = i64toi32_i32$3 | i64toi32_i32$4 | 0;
  wasm2js_scratch_store_i32(0 | 0, i64toi32_i32$5 | i64toi32_i32$1 | 0 | 0);
  wasm2js_scratch_store_i32(1 | 0, i64toi32_i32$4 | 0);
  return +(+wasm2js_scratch_load_f64());
 }
 
 function $46($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4_1 = 0, $5_1 = 0;
  block1 : {
   block : {
    $3_1 = HEAP32[($2_1 + 16 | 0) >> 2] | 0;
    if ($3_1) {
     break block
    }
    $4_1 = 0;
    if ($33($2_1 | 0) | 0) {
     break block1
    }
    $3_1 = HEAP32[($2_1 + 16 | 0) >> 2] | 0;
   }
   block2 : {
    $4_1 = HEAP32[($2_1 + 20 | 0) >> 2] | 0;
    if ($1_1 >>> 0 <= ($3_1 - $4_1 | 0) >>> 0) {
     break block2
    }
    return FUNCTION_TABLE[HEAP32[($2_1 + 36 | 0) >> 2] | 0 | 0]($2_1, $0_1, $1_1) | 0 | 0;
   }
   block5 : {
    block3 : {
     if ((HEAP32[($2_1 + 80 | 0) >> 2] | 0 | 0) < (0 | 0)) {
      break block3
     }
     if (!$1_1) {
      break block3
     }
     $3_1 = $1_1;
     block4 : {
      label : while (1) {
       $5_1 = $0_1 + $3_1 | 0;
       if ((HEAPU8[($5_1 + -1 | 0) >> 0] | 0 | 0) == (10 | 0)) {
        break block4
       }
       $3_1 = $3_1 + -1 | 0;
       if (!$3_1) {
        break block3
       }
       continue label;
      };
     }
     $4_1 = FUNCTION_TABLE[HEAP32[($2_1 + 36 | 0) >> 2] | 0 | 0]($2_1, $0_1, $3_1) | 0;
     if ($4_1 >>> 0 < $3_1 >>> 0) {
      break block1
     }
     $1_1 = $1_1 - $3_1 | 0;
     $4_1 = HEAP32[($2_1 + 20 | 0) >> 2] | 0;
     break block5;
    }
    $5_1 = $0_1;
    $3_1 = 0;
   }
   $19($4_1 | 0, $5_1 | 0, $1_1 | 0) | 0;
   HEAP32[($2_1 + 20 | 0) >> 2] = (HEAP32[($2_1 + 20 | 0) >> 2] | 0) + $1_1 | 0;
   $4_1 = $3_1 + $1_1 | 0;
  }
  return $4_1 | 0;
 }
 
 function $47($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $4_1 = 0, $5_1 = 0;
  $4_1 = Math_imul($2_1, $1_1);
  block1 : {
   block : {
    if ((HEAP32[($3_1 + 76 | 0) >> 2] | 0 | 0) > (-1 | 0)) {
     break block
    }
    $0_1 = $46($0_1 | 0, $4_1 | 0, $3_1 | 0) | 0;
    break block1;
   }
   $5_1 = $26($3_1 | 0) | 0;
   $0_1 = $46($0_1 | 0, $4_1 | 0, $3_1 | 0) | 0;
   if (!$5_1) {
    break block1
   }
   $27($3_1 | 0);
  }
  block2 : {
   if (($0_1 | 0) != ($4_1 | 0)) {
    break block2
   }
   return ($1_1 ? $2_1 : 0) | 0;
  }
  return ($0_1 >>> 0) / ($1_1 >>> 0) | 0 | 0;
 }
 
 function $48($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, i64toi32_i32$0 = 0, $4_1 = 0, i64toi32_i32$1 = 0, $6_1 = 0, $5_1 = 0, $6$hi = 0;
  block : {
   if (!$2_1) {
    break block
   }
   HEAP8[$0_1 >> 0] = $1_1;
   $3_1 = $0_1 + $2_1 | 0;
   HEAP8[($3_1 + -1 | 0) >> 0] = $1_1;
   if ($2_1 >>> 0 < 3 >>> 0) {
    break block
   }
   HEAP8[($0_1 + 2 | 0) >> 0] = $1_1;
   HEAP8[($0_1 + 1 | 0) >> 0] = $1_1;
   HEAP8[($3_1 + -3 | 0) >> 0] = $1_1;
   HEAP8[($3_1 + -2 | 0) >> 0] = $1_1;
   if ($2_1 >>> 0 < 7 >>> 0) {
    break block
   }
   HEAP8[($0_1 + 3 | 0) >> 0] = $1_1;
   HEAP8[($3_1 + -4 | 0) >> 0] = $1_1;
   if ($2_1 >>> 0 < 9 >>> 0) {
    break block
   }
   $4_1 = (0 - $0_1 | 0) & 3 | 0;
   $3_1 = $0_1 + $4_1 | 0;
   $1_1 = Math_imul($1_1 & 255 | 0, 16843009);
   HEAP32[$3_1 >> 2] = $1_1;
   $4_1 = ($2_1 - $4_1 | 0) & -4 | 0;
   $2_1 = $3_1 + $4_1 | 0;
   HEAP32[($2_1 + -4 | 0) >> 2] = $1_1;
   if ($4_1 >>> 0 < 9 >>> 0) {
    break block
   }
   HEAP32[($3_1 + 8 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 4 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -8 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -12 | 0) >> 2] = $1_1;
   if ($4_1 >>> 0 < 25 >>> 0) {
    break block
   }
   HEAP32[($3_1 + 24 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 20 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 16 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -16 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -20 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -24 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -28 | 0) >> 2] = $1_1;
   $5_1 = $3_1 & 4 | 0 | 24 | 0;
   $2_1 = $4_1 - $5_1 | 0;
   if ($2_1 >>> 0 < 32 >>> 0) {
    break block
   }
   i64toi32_i32$0 = 0;
   i64toi32_i32$1 = 1;
   i64toi32_i32$1 = __wasm_i64_mul($1_1 | 0, i64toi32_i32$0 | 0, 1 | 0, i64toi32_i32$1 | 0) | 0;
   i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
   $6_1 = i64toi32_i32$1;
   $6$hi = i64toi32_i32$0;
   $1_1 = $3_1 + $5_1 | 0;
   label : while (1) {
    i64toi32_i32$0 = $6$hi;
    i64toi32_i32$1 = $1_1;
    HEAP32[($1_1 + 24 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 28 | 0) >> 2] = i64toi32_i32$0;
    i64toi32_i32$1 = $1_1;
    HEAP32[($1_1 + 16 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 20 | 0) >> 2] = i64toi32_i32$0;
    i64toi32_i32$1 = $1_1;
    HEAP32[($1_1 + 8 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 12 | 0) >> 2] = i64toi32_i32$0;
    i64toi32_i32$1 = $1_1;
    HEAP32[$1_1 >> 2] = $6_1;
    HEAP32[($1_1 + 4 | 0) >> 2] = i64toi32_i32$0;
    $1_1 = $1_1 + 32 | 0;
    $2_1 = $2_1 + -32 | 0;
    if ($2_1 >>> 0 > 31 >>> 0) {
     continue label
    }
    break label;
   };
  }
  return $0_1 | 0;
 }
 
 function $49($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $5_1 = 0, i64toi32_i32$0 = 0, $8_1 = 0, $6_1 = 0, $7_1 = 0;
  $5_1 = global$0 - 208 | 0;
  global$0 = $5_1;
  HEAP32[($5_1 + 204 | 0) >> 2] = $2_1;
  block : {
   if (!40) {
    break block
   }
   wasm2js_memory_fill($5_1 + 160 | 0, 0, 40);
  }
  HEAP32[($5_1 + 200 | 0) >> 2] = HEAP32[($5_1 + 204 | 0) >> 2] | 0;
  block2 : {
   block1 : {
    if (($50(0 | 0, $1_1 | 0, $5_1 + 200 | 0 | 0, $5_1 + 80 | 0 | 0, $5_1 + 160 | 0 | 0, $3_1 | 0, $4_1 | 0) | 0 | 0) >= (0 | 0)) {
     break block1
    }
    $4_1 = -1;
    break block2;
   }
   block4 : {
    block3 : {
     if ((HEAP32[($0_1 + 76 | 0) >> 2] | 0 | 0) >= (0 | 0)) {
      break block3
     }
     $6_1 = 1;
     break block4;
    }
    $6_1 = !($26($0_1 | 0) | 0);
   }
   $7_1 = HEAP32[$0_1 >> 2] | 0;
   HEAP32[$0_1 >> 2] = $7_1 & -33 | 0;
   block8 : {
    block7 : {
     block6 : {
      block5 : {
       if (HEAP32[($0_1 + 48 | 0) >> 2] | 0) {
        break block5
       }
       HEAP32[($0_1 + 48 | 0) >> 2] = 80;
       HEAP32[($0_1 + 28 | 0) >> 2] = 0;
       i64toi32_i32$0 = 0;
       HEAP32[($0_1 + 16 | 0) >> 2] = 0;
       HEAP32[($0_1 + 20 | 0) >> 2] = i64toi32_i32$0;
       $8_1 = HEAP32[($0_1 + 44 | 0) >> 2] | 0;
       HEAP32[($0_1 + 44 | 0) >> 2] = $5_1;
       break block6;
      }
      $8_1 = 0;
      if (HEAP32[($0_1 + 16 | 0) >> 2] | 0) {
       break block7
      }
     }
     $2_1 = -1;
     if ($33($0_1 | 0) | 0) {
      break block8
     }
    }
    $2_1 = $50($0_1 | 0, $1_1 | 0, $5_1 + 200 | 0 | 0, $5_1 + 80 | 0 | 0, $5_1 + 160 | 0 | 0, $3_1 | 0, $4_1 | 0) | 0;
   }
   $4_1 = $7_1 & 32 | 0;
   block9 : {
    if (!$8_1) {
     break block9
    }
    FUNCTION_TABLE[HEAP32[($0_1 + 36 | 0) >> 2] | 0 | 0]($0_1, 0, 0) | 0;
    HEAP32[($0_1 + 48 | 0) >> 2] = 0;
    HEAP32[($0_1 + 44 | 0) >> 2] = $8_1;
    HEAP32[($0_1 + 28 | 0) >> 2] = 0;
    $3_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
    i64toi32_i32$0 = 0;
    HEAP32[($0_1 + 16 | 0) >> 2] = 0;
    HEAP32[($0_1 + 20 | 0) >> 2] = i64toi32_i32$0;
    $2_1 = $3_1 ? $2_1 : -1;
   }
   $3_1 = HEAP32[$0_1 >> 2] | 0;
   HEAP32[$0_1 >> 2] = $3_1 | $4_1 | 0;
   $4_1 = $3_1 & 32 | 0 ? -1 : $2_1;
   if ($6_1) {
    break block2
   }
   $27($0_1 | 0);
  }
  global$0 = $5_1 + 208 | 0;
  return $4_1 | 0;
 }
 
 function $50($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  var $12_1 = 0, $7_1 = 0, $15_1 = 0, $20_1 = 0, $17_1 = 0, $14_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $13_1 = 0, $11_1 = 0, i64toi32_i32$2 = 0, $16_1 = 0, $19_1 = 0, $22_1 = 0, $18_1 = 0, i64toi32_i32$5 = 0, $25_1 = 0, $25$hi = 0, $9_1 = 0, $24_1 = 0, $10_1 = 0, i64toi32_i32$3 = 0, $21_1 = 0, $23_1 = 0, $33_1 = 0, $34_1 = 0, $35_1 = 0, $8_1 = 0, $267 = 0;
  $7_1 = global$0 - 64 | 0;
  global$0 = $7_1;
  HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
  $8_1 = $7_1 + 39 | 0;
  $9_1 = $7_1 + 40 | 0;
  $10_1 = 0;
  $11_1 = 0;
  block68 : {
   block32 : {
    block26 : {
     block : {
      label4 : while (1) {
       $12_1 = 0;
       label1 : while (1) {
        $13_1 = $1_1;
        if (($12_1 | 0) > ($11_1 ^ 2147483647 | 0 | 0)) {
         break block
        }
        $11_1 = $12_1 + $11_1 | 0;
        $12_1 = $1_1;
        block31 : {
         block34 : {
          block47 : {
           block60 : {
            block15 : {
             block1 : {
              $14_1 = HEAPU8[$12_1 >> 0] | 0;
              if (!$14_1) {
               break block1
              }
              label7 : while (1) {
               block4 : {
                block3 : {
                 block2 : {
                  $14_1 = $14_1 & 255 | 0;
                  if ($14_1) {
                   break block2
                  }
                  $1_1 = $12_1;
                  break block3;
                 }
                 if (($14_1 | 0) != (37 | 0)) {
                  break block4
                 }
                 $14_1 = $12_1;
                 label : while (1) {
                  block5 : {
                   if ((HEAPU8[($14_1 + 1 | 0) >> 0] | 0 | 0) == (37 | 0)) {
                    break block5
                   }
                   $1_1 = $14_1;
                   break block3;
                  }
                  $12_1 = $12_1 + 1 | 0;
                  $15_1 = HEAPU8[($14_1 + 2 | 0) >> 0] | 0;
                  $1_1 = $14_1 + 2 | 0;
                  $14_1 = $1_1;
                  if (($15_1 | 0) == (37 | 0)) {
                   continue label
                  }
                  break label;
                 };
                }
                $12_1 = $12_1 - $13_1 | 0;
                $14_1 = $11_1 ^ 2147483647 | 0;
                if (($12_1 | 0) > ($14_1 | 0)) {
                 break block
                }
                block6 : {
                 if (!$0_1) {
                  break block6
                 }
                 $51($0_1 | 0, $13_1 | 0, $12_1 | 0);
                }
                if ($12_1) {
                 continue label1
                }
                HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
                $12_1 = $1_1 + 1 | 0;
                $16_1 = -1;
                block7 : {
                 $15_1 = (HEAP8[($1_1 + 1 | 0) >> 0] | 0) + -48 | 0;
                 if ($15_1 >>> 0 > 9 >>> 0) {
                  break block7
                 }
                 if ((HEAPU8[($1_1 + 2 | 0) >> 0] | 0 | 0) != (36 | 0)) {
                  break block7
                 }
                 $12_1 = $1_1 + 3 | 0;
                 $10_1 = 1;
                 $16_1 = $15_1;
                }
                HEAP32[($7_1 + 60 | 0) >> 2] = $12_1;
                $17_1 = 0;
                block9 : {
                 block8 : {
                  $18_1 = HEAP8[$12_1 >> 0] | 0;
                  $1_1 = $18_1 + -32 | 0;
                  if ($1_1 >>> 0 <= 31 >>> 0) {
                   break block8
                  }
                  $15_1 = $12_1;
                  break block9;
                 }
                 $17_1 = 0;
                 $15_1 = $12_1;
                 $1_1 = 1 << $1_1 | 0;
                 if (!($1_1 & 75913 | 0)) {
                  break block9
                 }
                 label2 : while (1) {
                  $15_1 = $12_1 + 1 | 0;
                  HEAP32[($7_1 + 60 | 0) >> 2] = $15_1;
                  $17_1 = $1_1 | $17_1 | 0;
                  $18_1 = HEAP8[($12_1 + 1 | 0) >> 0] | 0;
                  $1_1 = $18_1 + -32 | 0;
                  if ($1_1 >>> 0 >= 32 >>> 0) {
                   break block9
                  }
                  $12_1 = $15_1;
                  $1_1 = 1 << $1_1 | 0;
                  if ($1_1 & 75913 | 0) {
                   continue label2
                  }
                  break label2;
                 };
                }
                block17 : {
                 block10 : {
                  if (($18_1 | 0) != (42 | 0)) {
                   break block10
                  }
                  block14 : {
                   block11 : {
                    $12_1 = (HEAP8[($15_1 + 1 | 0) >> 0] | 0) + -48 | 0;
                    if ($12_1 >>> 0 > 9 >>> 0) {
                     break block11
                    }
                    if ((HEAPU8[($15_1 + 2 | 0) >> 0] | 0 | 0) != (36 | 0)) {
                     break block11
                    }
                    block13 : {
                     block12 : {
                      if ($0_1) {
                       break block12
                      }
                      HEAP32[($4_1 + ($12_1 << 2 | 0) | 0) >> 2] = 10;
                      $19_1 = 0;
                      break block13;
                     }
                     $19_1 = HEAP32[($3_1 + ($12_1 << 3 | 0) | 0) >> 2] | 0;
                    }
                    $1_1 = $15_1 + 3 | 0;
                    $10_1 = 1;
                    break block14;
                   }
                   if ($10_1) {
                    break block15
                   }
                   $1_1 = $15_1 + 1 | 0;
                   block16 : {
                    if ($0_1) {
                     break block16
                    }
                    HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
                    $10_1 = 0;
                    $19_1 = 0;
                    break block17;
                   }
                   $12_1 = HEAP32[$2_1 >> 2] | 0;
                   HEAP32[$2_1 >> 2] = $12_1 + 4 | 0;
                   $19_1 = HEAP32[$12_1 >> 2] | 0;
                   $10_1 = 0;
                  }
                  HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
                  if (($19_1 | 0) > (-1 | 0)) {
                   break block17
                  }
                  $19_1 = 0 - $19_1 | 0;
                  $17_1 = $17_1 | 8192 | 0;
                  break block17;
                 }
                 $19_1 = $52($7_1 + 60 | 0 | 0) | 0;
                 if (($19_1 | 0) < (0 | 0)) {
                  break block
                 }
                 $1_1 = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
                }
                $12_1 = 0;
                $20_1 = -1;
                block19 : {
                 block18 : {
                  if ((HEAPU8[$1_1 >> 0] | 0 | 0) == (46 | 0)) {
                   break block18
                  }
                  $21_1 = 0;
                  break block19;
                 }
                 block20 : {
                  if ((HEAPU8[($1_1 + 1 | 0) >> 0] | 0 | 0) != (42 | 0)) {
                   break block20
                  }
                  block24 : {
                   block21 : {
                    $15_1 = (HEAP8[($1_1 + 2 | 0) >> 0] | 0) + -48 | 0;
                    if ($15_1 >>> 0 > 9 >>> 0) {
                     break block21
                    }
                    if ((HEAPU8[($1_1 + 3 | 0) >> 0] | 0 | 0) != (36 | 0)) {
                     break block21
                    }
                    block23 : {
                     block22 : {
                      if ($0_1) {
                       break block22
                      }
                      HEAP32[($4_1 + ($15_1 << 2 | 0) | 0) >> 2] = 10;
                      $20_1 = 0;
                      break block23;
                     }
                     $20_1 = HEAP32[($3_1 + ($15_1 << 3 | 0) | 0) >> 2] | 0;
                    }
                    $1_1 = $1_1 + 4 | 0;
                    break block24;
                   }
                   if ($10_1) {
                    break block15
                   }
                   $1_1 = $1_1 + 2 | 0;
                   block25 : {
                    if ($0_1) {
                     break block25
                    }
                    $20_1 = 0;
                    break block24;
                   }
                   $15_1 = HEAP32[$2_1 >> 2] | 0;
                   HEAP32[$2_1 >> 2] = $15_1 + 4 | 0;
                   $20_1 = HEAP32[$15_1 >> 2] | 0;
                  }
                  HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
                  $21_1 = ($20_1 | 0) > (-1 | 0);
                  break block19;
                 }
                 HEAP32[($7_1 + 60 | 0) >> 2] = $1_1 + 1 | 0;
                 $21_1 = 1;
                 $20_1 = $52($7_1 + 60 | 0 | 0) | 0;
                 $1_1 = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
                }
                label3 : while (1) {
                 $15_1 = $12_1;
                 $22_1 = 28;
                 $18_1 = $1_1;
                 $12_1 = HEAP8[$1_1 >> 0] | 0;
                 if (($12_1 + -123 | 0) >>> 0 < -58 >>> 0) {
                  break block26
                 }
                 $1_1 = $1_1 + 1 | 0;
                 $12_1 = HEAPU8[(($12_1 + Math_imul($15_1, 58) | 0) + 65711 | 0) >> 0] | 0;
                 if ((($12_1 + -1 | 0) & 255 | 0) >>> 0 < 8 >>> 0) {
                  continue label3
                 }
                 break label3;
                };
                HEAP32[($7_1 + 60 | 0) >> 2] = $1_1;
                block30 : {
                 block27 : {
                  if (($12_1 | 0) == (27 | 0)) {
                   break block27
                  }
                  if (!$12_1) {
                   break block26
                  }
                  block28 : {
                   if (($16_1 | 0) < (0 | 0)) {
                    break block28
                   }
                   block29 : {
                    if ($0_1) {
                     break block29
                    }
                    HEAP32[($4_1 + ($16_1 << 2 | 0) | 0) >> 2] = $12_1;
                    continue label4;
                   }
                   i64toi32_i32$2 = $3_1 + ($16_1 << 3 | 0) | 0;
                   i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
                   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
                   $267 = i64toi32_i32$0;
                   i64toi32_i32$0 = $7_1;
                   HEAP32[($7_1 + 48 | 0) >> 2] = $267;
                   HEAP32[($7_1 + 52 | 0) >> 2] = i64toi32_i32$1;
                   break block30;
                  }
                  if (!$0_1) {
                   break block31
                  }
                  $53($7_1 + 48 | 0 | 0, $12_1 | 0, $2_1 | 0, $6_1 | 0);
                  break block30;
                 }
                 if (($16_1 | 0) > (-1 | 0)) {
                  break block26
                 }
                 $12_1 = 0;
                 if (!$0_1) {
                  continue label1
                 }
                }
                if ((HEAPU8[$0_1 >> 0] | 0) & 32 | 0) {
                 break block32
                }
                $23_1 = $17_1 & -65537 | 0;
                $17_1 = $17_1 & 8192 | 0 ? $23_1 : $17_1;
                $16_1 = 0;
                $24_1 = 65536;
                $22_1 = $9_1;
                block35 : {
                 block65 : {
                  block64 : {
                   block62 : {
                    block46 : {
                     block44 : {
                      block41 : {
                       block36 : {
                        block56 : {
                         block48 : {
                          block37 : {
                           block39 : {
                            block33 : {
                             block40 : {
                              block38 : {
                               block42 : {
                                block43 : {
                                 $18_1 = HEAPU8[$18_1 >> 0] | 0;
                                 $12_1 = $18_1 << 24 >> 24;
                                 $12_1 = $15_1 ? (($18_1 & 15 | 0 | 0) == (3 | 0) ? $12_1 & -45 | 0 : $12_1) : $12_1;
                                 switch ($12_1 + -88 | 0 | 0) {
                                 case 0:
                                 case 32:
                                  break block33;
                                 case 1:
                                 case 2:
                                 case 3:
                                 case 4:
                                 case 5:
                                 case 6:
                                 case 7:
                                 case 8:
                                 case 10:
                                 case 16:
                                 case 18:
                                 case 19:
                                 case 20:
                                 case 21:
                                 case 25:
                                 case 26:
                                 case 28:
                                 case 30:
                                 case 31:
                                  break block34;
                                 case 9:
                                 case 13:
                                 case 14:
                                 case 15:
                                  break block35;
                                 case 11:
                                  break block36;
                                 case 12:
                                 case 17:
                                  break block37;
                                 case 22:
                                  break block38;
                                 case 23:
                                  break block39;
                                 case 24:
                                  break block40;
                                 case 27:
                                  break block41;
                                 case 29:
                                  break block42;
                                 default:
                                  break block43;
                                 };
                                }
                                $22_1 = $9_1;
                                block45 : {
                                 switch ($12_1 + -65 | 0 | 0) {
                                 case 1:
                                 case 3:
                                  break block34;
                                 case 0:
                                 case 4:
                                 case 5:
                                 case 6:
                                  break block35;
                                 case 2:
                                  break block44;
                                 default:
                                  break block45;
                                 };
                                }
                                if (($12_1 | 0) == (83 | 0)) {
                                 break block46
                                }
                                break block47;
                               }
                               $16_1 = 0;
                               $24_1 = 65536;
                               i64toi32_i32$2 = $7_1;
                               i64toi32_i32$1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                               i64toi32_i32$0 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
                               $25_1 = i64toi32_i32$1;
                               $25$hi = i64toi32_i32$0;
                               break block48;
                              }
                              $12_1 = 0;
                              block55 : {
                               switch ($15_1 | 0) {
                               case 0:
                                HEAP32[(HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 2] = $11_1;
                                continue label1;
                               case 1:
                                HEAP32[(HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 2] = $11_1;
                                continue label1;
                               case 2:
                                i64toi32_i32$1 = $11_1;
                                i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
                                i64toi32_i32$1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                                HEAP32[i64toi32_i32$1 >> 2] = $11_1;
                                HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
                                continue label1;
                               case 3:
                                HEAP16[(HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 1] = $11_1;
                                continue label1;
                               case 4:
                                HEAP8[(HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 0] = $11_1;
                                continue label1;
                               case 6:
                                HEAP32[(HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 2] = $11_1;
                                continue label1;
                               case 7:
                                break block55;
                               default:
                                continue label1;
                               };
                              }
                              i64toi32_i32$1 = $11_1;
                              i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
                              i64toi32_i32$1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                              HEAP32[i64toi32_i32$1 >> 2] = $11_1;
                              HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
                              continue label1;
                             }
                             $20_1 = $20_1 >>> 0 > 8 >>> 0 ? $20_1 : 8;
                             $17_1 = $17_1 | 8 | 0;
                             $12_1 = 120;
                            }
                            $16_1 = 0;
                            $24_1 = 65536;
                            i64toi32_i32$2 = $7_1;
                            i64toi32_i32$0 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                            i64toi32_i32$1 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
                            $25_1 = i64toi32_i32$0;
                            $25$hi = i64toi32_i32$1;
                            $13_1 = $54(i64toi32_i32$0 | 0, i64toi32_i32$1 | 0, $9_1 | 0, $12_1 & 32 | 0 | 0) | 0;
                            if (!(i64toi32_i32$0 | i64toi32_i32$1 | 0)) {
                             break block56
                            }
                            if (!($17_1 & 8 | 0)) {
                             break block56
                            }
                            $24_1 = ($12_1 >>> 4 | 0) + 65536 | 0;
                            $16_1 = 2;
                            break block56;
                           }
                           $16_1 = 0;
                           $24_1 = 65536;
                           i64toi32_i32$2 = $7_1;
                           i64toi32_i32$1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                           i64toi32_i32$0 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
                           $25_1 = i64toi32_i32$1;
                           $25$hi = i64toi32_i32$0;
                           $13_1 = $55(i64toi32_i32$1 | 0, i64toi32_i32$0 | 0, $9_1 | 0) | 0;
                           if (!($17_1 & 8 | 0)) {
                            break block56
                           }
                           $12_1 = $9_1 - $13_1 | 0;
                           $20_1 = ($20_1 | 0) > ($12_1 | 0) ? $20_1 : $12_1 + 1 | 0;
                           break block56;
                          }
                          block57 : {
                           i64toi32_i32$2 = $7_1;
                           i64toi32_i32$0 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                           i64toi32_i32$1 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
                           $25_1 = i64toi32_i32$0;
                           $25$hi = i64toi32_i32$1;
                           i64toi32_i32$2 = i64toi32_i32$0;
                           i64toi32_i32$0 = -1;
                           i64toi32_i32$3 = -1;
                           if ((i64toi32_i32$1 | 0) > (i64toi32_i32$0 | 0)) {
                            $33_1 = 1
                           } else {
                            if ((i64toi32_i32$1 | 0) >= (i64toi32_i32$0 | 0)) {
                             if (i64toi32_i32$2 >>> 0 <= i64toi32_i32$3 >>> 0) {
                              $34_1 = 0
                             } else {
                              $34_1 = 1
                             }
                             $35_1 = $34_1;
                            } else {
                             $35_1 = 0
                            }
                            $33_1 = $35_1;
                           }
                           if ($33_1) {
                            break block57
                           }
                           i64toi32_i32$2 = $25$hi;
                           i64toi32_i32$2 = 0;
                           i64toi32_i32$3 = 0;
                           i64toi32_i32$1 = $25$hi;
                           i64toi32_i32$0 = $25_1;
                           i64toi32_i32$5 = (i64toi32_i32$3 >>> 0 < i64toi32_i32$0 >>> 0) + i64toi32_i32$1 | 0;
                           i64toi32_i32$5 = i64toi32_i32$2 - i64toi32_i32$5 | 0;
                           $25_1 = i64toi32_i32$3 - i64toi32_i32$0 | 0;
                           $25$hi = i64toi32_i32$5;
                           i64toi32_i32$3 = $7_1;
                           HEAP32[($7_1 + 48 | 0) >> 2] = $25_1;
                           HEAP32[($7_1 + 52 | 0) >> 2] = i64toi32_i32$5;
                           $16_1 = 1;
                           $24_1 = 65536;
                           break block48;
                          }
                          block58 : {
                           if (!($17_1 & 2048 | 0)) {
                            break block58
                           }
                           $16_1 = 1;
                           $24_1 = 65537;
                           break block48;
                          }
                          $16_1 = $17_1 & 1 | 0;
                          $24_1 = $16_1 ? 65538 : 65536;
                         }
                         i64toi32_i32$5 = $25$hi;
                         $13_1 = $56($25_1 | 0, i64toi32_i32$5 | 0, $9_1 | 0) | 0;
                        }
                        if ($21_1 & ($20_1 | 0) < (0 | 0) | 0) {
                         break block
                        }
                        $17_1 = $21_1 ? $17_1 & -65537 | 0 : $17_1;
                        block59 : {
                         i64toi32_i32$5 = $25$hi;
                         i64toi32_i32$2 = $25_1;
                         i64toi32_i32$3 = 0;
                         i64toi32_i32$0 = 0;
                         if ((i64toi32_i32$2 | 0) != (i64toi32_i32$0 | 0) | (i64toi32_i32$5 | 0) != (i64toi32_i32$3 | 0) | 0) {
                          break block59
                         }
                         if ($20_1) {
                          break block59
                         }
                         $13_1 = $9_1;
                         $22_1 = $13_1;
                         $20_1 = 0;
                         break block34;
                        }
                        i64toi32_i32$2 = $25$hi;
                        $12_1 = ($9_1 - $13_1 | 0) + !($25_1 | i64toi32_i32$2 | 0) | 0;
                        $20_1 = ($20_1 | 0) > ($12_1 | 0) ? $20_1 : $12_1;
                        break block47;
                       }
                       $12_1 = HEAPU8[($7_1 + 48 | 0) >> 0] | 0;
                       break block60;
                      }
                      $12_1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                      $13_1 = $12_1 ? $12_1 : 65751;
                      $12_1 = $35($13_1 | 0, ($20_1 >>> 0 < 2147483647 >>> 0 ? $20_1 : 2147483647) | 0) | 0;
                      $22_1 = $13_1 + $12_1 | 0;
                      block61 : {
                       if (($20_1 | 0) <= (-1 | 0)) {
                        break block61
                       }
                       $17_1 = $23_1;
                       $20_1 = $12_1;
                       break block34;
                      }
                      $17_1 = $23_1;
                      $20_1 = $12_1;
                      if (HEAPU8[$22_1 >> 0] | 0) {
                       break block
                      }
                      break block34;
                     }
                     i64toi32_i32$0 = $7_1;
                     i64toi32_i32$2 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                     i64toi32_i32$5 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
                     $25_1 = i64toi32_i32$2;
                     $25$hi = i64toi32_i32$5;
                     if (!!(i64toi32_i32$2 | i64toi32_i32$5 | 0)) {
                      break block62
                     }
                     $12_1 = 0;
                     break block60;
                    }
                    block63 : {
                     if (!$20_1) {
                      break block63
                     }
                     $14_1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                     break block64;
                    }
                    $12_1 = 0;
                    $57($0_1 | 0, 32 | 0, $19_1 | 0, 0 | 0, $17_1 | 0);
                    break block65;
                   }
                   HEAP32[($7_1 + 12 | 0) >> 2] = 0;
                   i64toi32_i32$5 = $25$hi;
                   HEAP32[($7_1 + 8 | 0) >> 2] = $25_1;
                   HEAP32[($7_1 + 48 | 0) >> 2] = $7_1 + 8 | 0;
                   $14_1 = $7_1 + 8 | 0;
                   $20_1 = -1;
                  }
                  $12_1 = 0;
                  block66 : {
                   label5 : while (1) {
                    $15_1 = HEAP32[$14_1 >> 2] | 0;
                    if (!$15_1) {
                     break block66
                    }
                    $15_1 = $41($7_1 + 4 | 0 | 0, $15_1 | 0) | 0;
                    if (($15_1 | 0) < (0 | 0)) {
                     break block32
                    }
                    if ($15_1 >>> 0 > ($20_1 - $12_1 | 0) >>> 0) {
                     break block66
                    }
                    $14_1 = $14_1 + 4 | 0;
                    $12_1 = $15_1 + $12_1 | 0;
                    if ($12_1 >>> 0 < $20_1 >>> 0) {
                     continue label5
                    }
                    break label5;
                   };
                  }
                  $22_1 = 61;
                  if (($12_1 | 0) < (0 | 0)) {
                   break block26
                  }
                  $57($0_1 | 0, 32 | 0, $19_1 | 0, $12_1 | 0, $17_1 | 0);
                  block67 : {
                   if ($12_1) {
                    break block67
                   }
                   $12_1 = 0;
                   break block65;
                  }
                  $15_1 = 0;
                  $14_1 = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
                  label6 : while (1) {
                   $13_1 = HEAP32[$14_1 >> 2] | 0;
                   if (!$13_1) {
                    break block65
                   }
                   $13_1 = $41($7_1 + 4 | 0 | 0, $13_1 | 0) | 0;
                   $15_1 = $13_1 + $15_1 | 0;
                   if ($15_1 >>> 0 > $12_1 >>> 0) {
                    break block65
                   }
                   $51($0_1 | 0, $7_1 + 4 | 0 | 0, $13_1 | 0);
                   $14_1 = $14_1 + 4 | 0;
                   if ($15_1 >>> 0 < $12_1 >>> 0) {
                    continue label6
                   }
                   break label6;
                  };
                 }
                 $57($0_1 | 0, 32 | 0, $19_1 | 0, $12_1 | 0, $17_1 ^ 8192 | 0 | 0);
                 $12_1 = ($19_1 | 0) > ($12_1 | 0) ? $19_1 : $12_1;
                 continue label1;
                }
                if ($21_1 & ($20_1 | 0) < (0 | 0) | 0) {
                 break block
                }
                $22_1 = 61;
                $12_1 = FUNCTION_TABLE[$5_1 | 0]($0_1, +HEAPF64[($7_1 + 48 | 0) >> 3], $19_1, $20_1, $17_1, $12_1) | 0;
                if (($12_1 | 0) >= (0 | 0)) {
                 continue label1
                }
                break block26;
               }
               $14_1 = HEAPU8[($12_1 + 1 | 0) >> 0] | 0;
               $12_1 = $12_1 + 1 | 0;
               continue label7;
              };
             }
             if ($0_1) {
              break block68
             }
             if (!$10_1) {
              break block31
             }
             $12_1 = 1;
             block69 : {
              label8 : while (1) {
               $14_1 = HEAP32[($4_1 + ($12_1 << 2 | 0) | 0) >> 2] | 0;
               if (!$14_1) {
                break block69
               }
               $53($3_1 + ($12_1 << 3 | 0) | 0 | 0, $14_1 | 0, $2_1 | 0, $6_1 | 0);
               $11_1 = 1;
               $12_1 = $12_1 + 1 | 0;
               if (($12_1 | 0) != (10 | 0)) {
                continue label8
               }
               break block68;
              };
             }
             block70 : {
              if ($12_1 >>> 0 < 10 >>> 0) {
               break block70
              }
              $11_1 = 1;
              break block68;
             }
             label9 : while (1) {
              if (HEAP32[($4_1 + ($12_1 << 2 | 0) | 0) >> 2] | 0) {
               break block15
              }
              $11_1 = 1;
              $12_1 = $12_1 + 1 | 0;
              if (($12_1 | 0) == (10 | 0)) {
               break block68
              }
              continue label9;
             };
            }
            $22_1 = 28;
            break block26;
           }
           HEAP8[($7_1 + 39 | 0) >> 0] = $12_1;
           $20_1 = 1;
           $13_1 = $8_1;
           $22_1 = $9_1;
           $17_1 = $23_1;
           break block34;
          }
          $22_1 = $9_1;
         }
         $1_1 = $22_1 - $13_1 | 0;
         $18_1 = ($20_1 | 0) > ($1_1 | 0) ? $20_1 : $1_1;
         if (($18_1 | 0) > ($16_1 ^ 2147483647 | 0 | 0)) {
          break block
         }
         $22_1 = 61;
         $15_1 = $16_1 + $18_1 | 0;
         $12_1 = ($19_1 | 0) > ($15_1 | 0) ? $19_1 : $15_1;
         if (($12_1 | 0) > ($14_1 | 0)) {
          break block26
         }
         $57($0_1 | 0, 32 | 0, $12_1 | 0, $15_1 | 0, $17_1 | 0);
         $51($0_1 | 0, $24_1 | 0, $16_1 | 0);
         $57($0_1 | 0, 48 | 0, $12_1 | 0, $15_1 | 0, $17_1 ^ 65536 | 0 | 0);
         $57($0_1 | 0, 48 | 0, $18_1 | 0, $1_1 | 0, 0 | 0);
         $51($0_1 | 0, $13_1 | 0, $1_1 | 0);
         $57($0_1 | 0, 32 | 0, $12_1 | 0, $15_1 | 0, $17_1 ^ 8192 | 0 | 0);
         $1_1 = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
         continue label1;
        }
        break label1;
       };
       break label4;
      };
      $11_1 = 0;
      break block68;
     }
     $22_1 = 61;
    }
    HEAP32[($15() | 0) >> 2] = $22_1;
   }
   $11_1 = -1;
  }
  global$0 = $7_1 + 64 | 0;
  return $11_1 | 0;
 }
 
 function $51($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  block : {
   if ((HEAPU8[$0_1 >> 0] | 0) & 32 | 0) {
    break block
   }
   $46($1_1 | 0, $2_1 | 0, $0_1 | 0) | 0;
  }
 }
 
 function $52($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $1_1 = 0, $2_1 = 0, $4_1 = 0, $5_1 = 0;
  $1_1 = 0;
  block : {
   $2_1 = HEAP32[$0_1 >> 2] | 0;
   $3_1 = (HEAP8[$2_1 >> 0] | 0) + -48 | 0;
   if ($3_1 >>> 0 <= 9 >>> 0) {
    break block
   }
   return 0 | 0;
  }
  label : while (1) {
   $4_1 = -1;
   block1 : {
    if ($1_1 >>> 0 > 214748364 >>> 0) {
     break block1
    }
    $1_1 = Math_imul($1_1, 10);
    $4_1 = $3_1 >>> 0 > ($1_1 ^ 2147483647 | 0) >>> 0 ? -1 : $3_1 + $1_1 | 0;
   }
   $3_1 = $2_1 + 1 | 0;
   HEAP32[$0_1 >> 2] = $3_1;
   $5_1 = HEAP8[($2_1 + 1 | 0) >> 0] | 0;
   $1_1 = $4_1;
   $2_1 = $3_1;
   $3_1 = $5_1 + -48 | 0;
   if ($3_1 >>> 0 < 10 >>> 0) {
    continue label
   }
   break label;
  };
  return $1_1 | 0;
 }
 
 function $53($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $21_1 = 0, $29_1 = 0, $37_1 = 0, $45_1 = 0, $55_1 = 0, $63_1 = 0, $71_1 = 0, $79_1 = 0, $87_1 = 0, $97_1 = 0, $105_1 = 0, $115_1 = 0, $125_1 = 0, $133_1 = 0, $141_1 = 0;
  block18 : {
   switch ($1_1 + -9 | 0 | 0) {
   case 0:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    HEAP32[$0_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
    return;
   case 1:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = i64toi32_i32$0 >> 31 | 0;
    $21_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $21_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 2:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$0 = 0;
    $29_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $29_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 4:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = i64toi32_i32$0 >> 31 | 0;
    $37_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $37_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 5:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$0 = 0;
    $45_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $45_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 3:
    $1_1 = ((HEAP32[$2_1 >> 2] | 0) + 7 | 0) & -8 | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 8 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
    $55_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $55_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 6:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$1 = HEAP16[$1_1 >> 1] | 0;
    i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
    $63_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $63_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 7:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAPU16[$1_1 >> 1] | 0;
    i64toi32_i32$1 = 0;
    $71_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $71_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 8:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$1 = HEAP8[$1_1 >> 0] | 0;
    i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
    $79_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $79_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 9:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAPU8[$1_1 >> 0] | 0;
    i64toi32_i32$1 = 0;
    $87_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $87_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 10:
    $1_1 = ((HEAP32[$2_1 >> 2] | 0) + 7 | 0) & -8 | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 8 | 0;
    i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$0 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
    $97_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $97_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 11:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = 0;
    $105_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $105_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 12:
    $1_1 = ((HEAP32[$2_1 >> 2] | 0) + 7 | 0) & -8 | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 8 | 0;
    i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$0 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
    $115_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $115_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 13:
    $1_1 = ((HEAP32[$2_1 >> 2] | 0) + 7 | 0) & -8 | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 8 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
    $125_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $125_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 14:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$1 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
    $133_1 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1;
    HEAP32[i64toi32_i32$1 >> 2] = $133_1;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    return;
   case 15:
    $1_1 = HEAP32[$2_1 >> 2] | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 4 | 0;
    i64toi32_i32$0 = HEAP32[$1_1 >> 2] | 0;
    i64toi32_i32$1 = 0;
    $141_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[i64toi32_i32$0 >> 2] = $141_1;
    HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
    return;
   case 16:
    $1_1 = ((HEAP32[$2_1 >> 2] | 0) + 7 | 0) & -8 | 0;
    HEAP32[$2_1 >> 2] = $1_1 + 8 | 0;
    HEAPF64[$0_1 >> 3] = +HEAPF64[$1_1 >> 3];
    return;
   case 17:
    FUNCTION_TABLE[$3_1 | 0]($0_1, $2_1);
    break;
   default:
    break block18;
   };
  }
 }
 
 function $54($0_1, $0$hi, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$4 = 0, i64toi32_i32$3 = 0, $10_1 = 0, $3_1 = 0;
  block : {
   i64toi32_i32$0 = $0$hi;
   if (!($0_1 | i64toi32_i32$0 | 0)) {
    break block
   }
   label : while (1) {
    $1_1 = $1_1 + -1 | 0;
    i64toi32_i32$0 = $0$hi;
    HEAP8[$1_1 >> 0] = HEAPU8[(($0_1 & 15 | 0) + 66240 | 0) >> 0] | 0 | $2_1 | 0;
    i64toi32_i32$2 = $0_1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 15;
    $3_1 = i64toi32_i32$0 >>> 0 > i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$1 | 0) & i64toi32_i32$2 >>> 0 > i64toi32_i32$3 >>> 0 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$3 = $0_1;
    i64toi32_i32$0 = 0;
    i64toi32_i32$1 = 4;
    i64toi32_i32$4 = i64toi32_i32$1 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$1 & 63 | 0) >>> 0) {
     i64toi32_i32$0 = 0;
     $10_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$0 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
     $10_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
    }
    $0_1 = $10_1;
    $0$hi = i64toi32_i32$0;
    if ($3_1) {
     continue label
    }
    break label;
   };
  }
  return $1_1 | 0;
 }
 
 function $55($0_1, $0$hi, $1_1) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$4 = 0, i64toi32_i32$3 = 0, $9_1 = 0, $2_1 = 0;
  block : {
   i64toi32_i32$0 = $0$hi;
   if (!($0_1 | i64toi32_i32$0 | 0)) {
    break block
   }
   label : while (1) {
    $1_1 = $1_1 + -1 | 0;
    i64toi32_i32$0 = $0$hi;
    HEAP8[$1_1 >> 0] = $0_1 & 7 | 0 | 48 | 0;
    i64toi32_i32$2 = $0_1;
    i64toi32_i32$1 = 0;
    i64toi32_i32$3 = 7;
    $2_1 = i64toi32_i32$0 >>> 0 > i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$1 | 0) & i64toi32_i32$2 >>> 0 > i64toi32_i32$3 >>> 0 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$3 = $0_1;
    i64toi32_i32$0 = 0;
    i64toi32_i32$1 = 3;
    i64toi32_i32$4 = i64toi32_i32$1 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$1 & 63 | 0) >>> 0) {
     i64toi32_i32$0 = 0;
     $9_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$0 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
     $9_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
    }
    $0_1 = $9_1;
    $0$hi = i64toi32_i32$0;
    if ($2_1) {
     continue label
    }
    break label;
   };
  }
  return $1_1 | 0;
 }
 
 function $56($0_1, $0$hi, $1_1) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$5 = 0, $3_1 = 0, i64toi32_i32$3 = 0, $2_1 = 0, $2$hi = 0, $4_1 = 0, $16_1 = 0, $16$hi = 0, $5_1 = 0;
  block1 : {
   block : {
    i64toi32_i32$0 = $0$hi;
    i64toi32_i32$2 = $0_1;
    i64toi32_i32$1 = 1;
    i64toi32_i32$3 = 0;
    if (i64toi32_i32$0 >>> 0 > i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$1 | 0) & i64toi32_i32$2 >>> 0 >= i64toi32_i32$3 >>> 0 | 0) | 0) {
     break block
    }
    i64toi32_i32$2 = i64toi32_i32$0;
    $2_1 = $0_1;
    $2$hi = i64toi32_i32$2;
    break block1;
   }
   label : while (1) {
    $1_1 = $1_1 + -1 | 0;
    i64toi32_i32$2 = $0$hi;
    i64toi32_i32$0 = 0;
    i64toi32_i32$0 = __wasm_i64_udiv($0_1 | 0, i64toi32_i32$2 | 0, 10 | 0, i64toi32_i32$0 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
    $2_1 = i64toi32_i32$0;
    $2$hi = i64toi32_i32$2;
    i64toi32_i32$0 = 0;
    i64toi32_i32$0 = __wasm_i64_mul($2_1 | 0, i64toi32_i32$2 | 0, 10 | 0, i64toi32_i32$0 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
    $16_1 = i64toi32_i32$0;
    $16$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $0$hi;
    i64toi32_i32$3 = $0_1;
    i64toi32_i32$0 = $16$hi;
    i64toi32_i32$1 = $16_1;
    i64toi32_i32$5 = ($0_1 >>> 0 < i64toi32_i32$1 >>> 0) + i64toi32_i32$0 | 0;
    i64toi32_i32$5 = i64toi32_i32$2 - i64toi32_i32$5 | 0;
    HEAP8[$1_1 >> 0] = $0_1 - i64toi32_i32$1 | 0 | 48 | 0;
    i64toi32_i32$5 = i64toi32_i32$2;
    i64toi32_i32$5 = i64toi32_i32$2;
    i64toi32_i32$2 = $0_1;
    i64toi32_i32$3 = 9;
    i64toi32_i32$1 = -1;
    $3_1 = i64toi32_i32$5 >>> 0 > i64toi32_i32$3 >>> 0 | ((i64toi32_i32$5 | 0) == (i64toi32_i32$3 | 0) & i64toi32_i32$2 >>> 0 > i64toi32_i32$1 >>> 0 | 0) | 0;
    i64toi32_i32$2 = $2$hi;
    $0_1 = $2_1;
    $0$hi = i64toi32_i32$2;
    if ($3_1) {
     continue label
    }
    break label;
   };
  }
  block2 : {
   i64toi32_i32$2 = $2$hi;
   if (!($2_1 | i64toi32_i32$2 | 0)) {
    break block2
   }
   $3_1 = $2_1;
   label1 : while (1) {
    $1_1 = $1_1 + -1 | 0;
    $4_1 = ($3_1 >>> 0) / (10 >>> 0) | 0;
    HEAP8[$1_1 >> 0] = $3_1 - Math_imul($4_1, 10) | 0 | 48 | 0;
    $5_1 = $3_1 >>> 0 > 9 >>> 0;
    $3_1 = $4_1;
    if ($5_1) {
     continue label1
    }
    break label1;
   };
  }
  return $1_1 | 0;
 }
 
 function $57($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $5_1 = 0;
  $5_1 = global$0 - 256 | 0;
  global$0 = $5_1;
  block : {
   if (($2_1 | 0) <= ($3_1 | 0)) {
    break block
   }
   if ($4_1 & 73728 | 0) {
    break block
   }
   $3_1 = $2_1 - $3_1 | 0;
   $2_1 = $3_1 >>> 0 < 256 >>> 0;
   $48($5_1 | 0, $1_1 | 0, ($2_1 ? $3_1 : 256) | 0) | 0;
   block1 : {
    if ($2_1) {
     break block1
    }
    label : while (1) {
     $51($0_1 | 0, $5_1 | 0, 256 | 0);
     $3_1 = $3_1 + -256 | 0;
     if ($3_1 >>> 0 > 255 >>> 0) {
      continue label
     }
     break label;
    };
   }
   $51($0_1 | 0, $5_1 | 0, $3_1 | 0);
  }
  global$0 = $5_1 + 256 | 0;
 }
 
 function $58($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  return $49($0_1 | 0, $1_1 | 0, $2_1 | 0, 7 | 0, 8 | 0) | 0 | 0;
 }
 
 function $59($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = +$1_1;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $10_1 = 0, $11_1 = 0, $18_1 = 0, $19_1 = 0, $12_1 = 0, i64toi32_i32$1 = 0, $15_1 = 0, $6_1 = 0, i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$5 = 0, i64toi32_i32$3 = 0, $22_1 = 0, i64toi32_i32$2 = 0, $23_1 = 0, $20_1 = 0, $17_1 = 0, $8_1 = 0, $27_1 = 0.0, $13_1 = 0, $24_1 = 0, $14_1 = 0, $16_1 = 0, $24$hi = 0, $9_1 = 0, $21_1 = 0, $7_1 = 0, $48_1 = 0, $49_1 = 0, $50_1 = 0, $142_1 = 0, $25$hi = 0, $51_1 = 0, $898 = 0, $133_1 = 0, $25_1 = 0, $172 = 0, $174$hi = 0, $176$hi = 0, $178 = 0, $178$hi = 0, $26$hi = 0, $184 = 0, $184$hi = 0, $390 = 0.0, $891 = 0;
  $6_1 = global$0 - 560 | 0;
  global$0 = $6_1;
  $7_1 = 0;
  HEAP32[($6_1 + 44 | 0) >> 2] = 0;
  block1 : {
   block : {
    i64toi32_i32$0 = $61(+$1_1) | 0;
    i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    $24_1 = i64toi32_i32$0;
    $24$hi = i64toi32_i32$1;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$0 = -1;
    i64toi32_i32$3 = -1;
    if ((i64toi32_i32$1 | 0) > (i64toi32_i32$0 | 0)) {
     $48_1 = 1
    } else {
     if ((i64toi32_i32$1 | 0) >= (i64toi32_i32$0 | 0)) {
      if (i64toi32_i32$2 >>> 0 <= i64toi32_i32$3 >>> 0) {
       $49_1 = 0
      } else {
       $49_1 = 1
      }
      $50_1 = $49_1;
     } else {
      $50_1 = 0
     }
     $48_1 = $50_1;
    }
    if ($48_1) {
     break block
    }
    $8_1 = 1;
    $9_1 = 65546;
    $1_1 = -$1_1;
    i64toi32_i32$2 = $61(+$1_1) | 0;
    i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    $24_1 = i64toi32_i32$2;
    $24$hi = i64toi32_i32$1;
    break block1;
   }
   block2 : {
    if (!($4_1 & 2048 | 0)) {
     break block2
    }
    $8_1 = 1;
    $9_1 = 65549;
    break block1;
   }
   $8_1 = $4_1 & 1 | 0;
   $9_1 = $8_1 ? 65552 : 65547;
   $7_1 = !$8_1;
  }
  block4 : {
   block3 : {
    i64toi32_i32$1 = $24$hi;
    i64toi32_i32$3 = $24_1;
    i64toi32_i32$2 = 2146435072;
    i64toi32_i32$0 = 0;
    i64toi32_i32$2 = i64toi32_i32$1 & i64toi32_i32$2 | 0;
    i64toi32_i32$1 = i64toi32_i32$3 & i64toi32_i32$0 | 0;
    i64toi32_i32$3 = 2146435072;
    i64toi32_i32$0 = 0;
    if ((i64toi32_i32$1 | 0) != (i64toi32_i32$0 | 0) | (i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | 0) {
     break block3
    }
    $10_1 = $8_1 + 3 | 0;
    $57($0_1 | 0, 32 | 0, $2_1 | 0, $10_1 | 0, $4_1 & -65537 | 0 | 0);
    $51($0_1 | 0, $9_1 | 0, $8_1 | 0);
    $11_1 = $5_1 & 32 | 0;
    $51($0_1 | 0, ($1_1 != $1_1 ? ($11_1 ? 65661 : 65705) : $11_1 ? 65686 : 65709) | 0, 3 | 0);
    $57($0_1 | 0, 32 | 0, $2_1 | 0, $10_1 | 0, $4_1 ^ 8192 | 0 | 0);
    $12_1 = ($2_1 | 0) > ($10_1 | 0) ? $2_1 : $10_1;
    break block4;
   }
   $13_1 = $6_1 + 16 | 0;
   block7 : {
    block8 : {
     block6 : {
      block5 : {
       $1_1 = +$42(+$1_1, $6_1 + 44 | 0 | 0);
       $1_1 = $1_1 + $1_1;
       if ($1_1 == 0.0) {
        break block5
       }
       $10_1 = HEAP32[($6_1 + 44 | 0) >> 2] | 0;
       HEAP32[($6_1 + 44 | 0) >> 2] = $10_1 + -1 | 0;
       $14_1 = $5_1 | 32 | 0;
       if (($14_1 | 0) != (97 | 0)) {
        break block6
       }
       break block7;
      }
      $14_1 = $5_1 | 32 | 0;
      if (($14_1 | 0) == (97 | 0)) {
       break block7
      }
      $15_1 = ($3_1 | 0) < (0 | 0) ? 6 : $3_1;
      $16_1 = HEAP32[($6_1 + 44 | 0) >> 2] | 0;
      break block8;
     }
     $16_1 = $10_1 + -29 | 0;
     HEAP32[($6_1 + 44 | 0) >> 2] = $16_1;
     $15_1 = ($3_1 | 0) < (0 | 0) ? 6 : $3_1;
     $1_1 = $1_1 * 268435456.0;
    }
    $17_1 = ($6_1 + 48 | 0) + (($16_1 | 0) < (0 | 0) ? 0 : 288) | 0;
    $11_1 = $17_1;
    label : while (1) {
     $133_1 = $11_1;
     if ($1_1 < 4294967295.0 & $1_1 >= 0.0 | 0) {
      $142_1 = ~~$1_1 >>> 0
     } else {
      $142_1 = 0
     }
     $10_1 = $142_1;
     HEAP32[$133_1 >> 2] = $10_1;
     $11_1 = $11_1 + 4 | 0;
     $1_1 = ($1_1 - +($10_1 >>> 0)) * 1.0e9;
     if ($1_1 != 0.0) {
      continue label
     }
     break label;
    };
    block10 : {
     block9 : {
      if (($16_1 | 0) >= (1 | 0)) {
       break block9
      }
      $18_1 = $16_1;
      $10_1 = $11_1;
      $19_1 = $17_1;
      break block10;
     }
     $19_1 = $17_1;
     $18_1 = $16_1;
     label3 : while (1) {
      $18_1 = $18_1 >>> 0 < 29 >>> 0 ? $18_1 : 29;
      block11 : {
       $10_1 = $11_1 + -4 | 0;
       if ($10_1 >>> 0 < $19_1 >>> 0) {
        break block11
       }
       i64toi32_i32$1 = 0;
       $25_1 = $18_1;
       $25$hi = i64toi32_i32$1;
       i64toi32_i32$1 = 0;
       $24_1 = 0;
       $24$hi = i64toi32_i32$1;
       label1 : while (1) {
        $172 = $10_1;
        i64toi32_i32$0 = $10_1;
        i64toi32_i32$1 = HEAP32[$10_1 >> 2] | 0;
        i64toi32_i32$2 = 0;
        $174$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $25$hi;
        i64toi32_i32$2 = $174$hi;
        i64toi32_i32$0 = i64toi32_i32$1;
        i64toi32_i32$1 = $25$hi;
        i64toi32_i32$3 = $25_1;
        i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
        if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
         i64toi32_i32$1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
         $51_1 = 0;
        } else {
         i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$4 | 0) | 0;
         $51_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
        }
        $176$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $24$hi;
        i64toi32_i32$2 = $24_1;
        i64toi32_i32$0 = 0;
        i64toi32_i32$3 = -1;
        i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$0 | 0;
        $178 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
        $178$hi = i64toi32_i32$0;
        i64toi32_i32$0 = $176$hi;
        i64toi32_i32$1 = $51_1;
        i64toi32_i32$2 = $178$hi;
        i64toi32_i32$3 = $178;
        i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
        i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$2 | 0;
        if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
         i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
        }
        $26$hi = i64toi32_i32$5;
        i64toi32_i32$1 = 0;
        i64toi32_i32$1 = __wasm_i64_udiv(i64toi32_i32$4 | 0, i64toi32_i32$5 | 0, 1e9 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
        $24_1 = i64toi32_i32$1;
        $24$hi = i64toi32_i32$5;
        i64toi32_i32$1 = 0;
        i64toi32_i32$1 = __wasm_i64_mul($24_1 | 0, i64toi32_i32$5 | 0, 1e9 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
        $184 = i64toi32_i32$1;
        $184$hi = i64toi32_i32$5;
        i64toi32_i32$5 = $26$hi;
        i64toi32_i32$0 = i64toi32_i32$4;
        i64toi32_i32$1 = $184$hi;
        i64toi32_i32$3 = $184;
        i64toi32_i32$2 = i64toi32_i32$4 - i64toi32_i32$3 | 0;
        i64toi32_i32$4 = (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) + i64toi32_i32$1 | 0;
        i64toi32_i32$4 = i64toi32_i32$5 - i64toi32_i32$4 | 0;
        HEAP32[$172 >> 2] = i64toi32_i32$2;
        $10_1 = $10_1 + -4 | 0;
        if ($10_1 >>> 0 >= $19_1 >>> 0) {
         continue label1
        }
        break label1;
       };
       i64toi32_i32$4 = i64toi32_i32$5;
       i64toi32_i32$4 = i64toi32_i32$5;
       i64toi32_i32$5 = i64toi32_i32$0;
       i64toi32_i32$0 = 0;
       i64toi32_i32$3 = 1e9;
       if (i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0 | ((i64toi32_i32$4 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$5 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) {
        break block11
       }
       $19_1 = $19_1 + -4 | 0;
       i64toi32_i32$5 = $24$hi;
       HEAP32[$19_1 >> 2] = $24_1;
      }
      block12 : {
       label2 : while (1) {
        $10_1 = $11_1;
        if ($10_1 >>> 0 <= $19_1 >>> 0) {
         break block12
        }
        $11_1 = $10_1 + -4 | 0;
        if (!(HEAP32[$11_1 >> 2] | 0)) {
         continue label2
        }
        break label2;
       };
      }
      $18_1 = (HEAP32[($6_1 + 44 | 0) >> 2] | 0) - $18_1 | 0;
      HEAP32[($6_1 + 44 | 0) >> 2] = $18_1;
      $11_1 = $10_1;
      if (($18_1 | 0) > (0 | 0)) {
       continue label3
      }
      break label3;
     };
    }
    block13 : {
     if (($18_1 | 0) > (-1 | 0)) {
      break block13
     }
     $20_1 = ((($15_1 + 25 | 0) >>> 0) / (9 >>> 0) | 0) + 1 | 0;
     $21_1 = ($14_1 | 0) == (102 | 0);
     label5 : while (1) {
      $11_1 = 0 - $18_1 | 0;
      $12_1 = $11_1 >>> 0 < 9 >>> 0 ? $11_1 : 9;
      block15 : {
       block14 : {
        if ($19_1 >>> 0 < $10_1 >>> 0) {
         break block14
        }
        $11_1 = HEAP32[$19_1 >> 2] | 0 ? 0 : 4;
        break block15;
       }
       $22_1 = 1e9 >>> $12_1 | 0;
       $23_1 = (-1 << $12_1 | 0) ^ -1 | 0;
       $18_1 = 0;
       $11_1 = $19_1;
       label4 : while (1) {
        $3_1 = HEAP32[$11_1 >> 2] | 0;
        HEAP32[$11_1 >> 2] = ($3_1 >>> $12_1 | 0) + $18_1 | 0;
        $18_1 = Math_imul($3_1 & $23_1 | 0, $22_1);
        $11_1 = $11_1 + 4 | 0;
        if ($11_1 >>> 0 < $10_1 >>> 0) {
         continue label4
        }
        break label4;
       };
       $11_1 = HEAP32[$19_1 >> 2] | 0 ? 0 : 4;
       if (!$18_1) {
        break block15
       }
       HEAP32[$10_1 >> 2] = $18_1;
       $10_1 = $10_1 + 4 | 0;
      }
      $18_1 = (HEAP32[($6_1 + 44 | 0) >> 2] | 0) + $12_1 | 0;
      HEAP32[($6_1 + 44 | 0) >> 2] = $18_1;
      $19_1 = $19_1 + $11_1 | 0;
      $11_1 = $21_1 ? $17_1 : $19_1;
      $10_1 = (($10_1 - $11_1 | 0) >> 2 | 0 | 0) > ($20_1 | 0) ? $11_1 + ($20_1 << 2 | 0) | 0 : $10_1;
      if (($18_1 | 0) < (0 | 0)) {
       continue label5
      }
      break label5;
     };
    }
    $18_1 = 0;
    block16 : {
     if ($19_1 >>> 0 >= $10_1 >>> 0) {
      break block16
     }
     $18_1 = Math_imul(($17_1 - $19_1 | 0) >> 2 | 0, 9);
     $11_1 = 10;
     $3_1 = HEAP32[$19_1 >> 2] | 0;
     if ($3_1 >>> 0 < 10 >>> 0) {
      break block16
     }
     label6 : while (1) {
      $18_1 = $18_1 + 1 | 0;
      $11_1 = Math_imul($11_1, 10);
      if ($3_1 >>> 0 >= $11_1 >>> 0) {
       continue label6
      }
      break label6;
     };
    }
    block17 : {
     $11_1 = ($15_1 - (($14_1 | 0) == (102 | 0) ? 0 : $18_1) | 0) - (($15_1 | 0) != (0 | 0) & ($14_1 | 0) == (103 | 0) | 0) | 0;
     if (($11_1 | 0) >= (Math_imul(($10_1 - $17_1 | 0) >> 2 | 0, 9) + -9 | 0 | 0)) {
      break block17
     }
     $3_1 = $11_1 + 9216 | 0;
     $22_1 = ($3_1 | 0) / (9 | 0) | 0;
     $12_1 = (($6_1 + 48 | 0) + (($16_1 | 0) < (0 | 0) ? -4092 : -3804) | 0) + ($22_1 << 2 | 0) | 0;
     $11_1 = 10;
     block18 : {
      $3_1 = $3_1 - Math_imul($22_1, 9) | 0;
      if (($3_1 | 0) > (7 | 0)) {
       break block18
      }
      label7 : while (1) {
       $11_1 = Math_imul($11_1, 10);
       $3_1 = $3_1 + 1 | 0;
       if (($3_1 | 0) != (8 | 0)) {
        continue label7
       }
       break label7;
      };
     }
     $23_1 = $12_1 + 4 | 0;
     block20 : {
      block19 : {
       $3_1 = HEAP32[$12_1 >> 2] | 0;
       $20_1 = ($3_1 >>> 0) / ($11_1 >>> 0) | 0;
       $22_1 = $3_1 - Math_imul($20_1, $11_1) | 0;
       if ($22_1) {
        break block19
       }
       if (($23_1 | 0) == ($10_1 | 0)) {
        break block20
       }
      }
      block22 : {
       block21 : {
        if ($20_1 & 1 | 0) {
         break block21
        }
        $1_1 = 9007199254740992.0;
        if (($11_1 | 0) != (1e9 | 0)) {
         break block22
        }
        if ($12_1 >>> 0 <= $19_1 >>> 0) {
         break block22
        }
        if (!((HEAPU8[($12_1 + -4 | 0) >> 0] | 0) & 1 | 0)) {
         break block22
        }
       }
       $1_1 = 9007199254740994.0;
      }
      $390 = ($23_1 | 0) == ($10_1 | 0) ? 1.0 : 1.5;
      $23_1 = $11_1 >>> 1 | 0;
      $27_1 = $22_1 >>> 0 < $23_1 >>> 0 ? .5 : ($22_1 | 0) == ($23_1 | 0) ? $390 : 1.5;
      block23 : {
       if ($7_1) {
        break block23
       }
       if ((HEAPU8[$9_1 >> 0] | 0 | 0) != (45 | 0)) {
        break block23
       }
       $27_1 = -$27_1;
       $1_1 = -$1_1;
      }
      $3_1 = $3_1 - $22_1 | 0;
      HEAP32[$12_1 >> 2] = $3_1;
      if ($1_1 + $27_1 == $1_1) {
       break block20
      }
      $11_1 = $3_1 + $11_1 | 0;
      HEAP32[$12_1 >> 2] = $11_1;
      block24 : {
       if ($11_1 >>> 0 < 1e9 >>> 0) {
        break block24
       }
       label8 : while (1) {
        HEAP32[$12_1 >> 2] = 0;
        block25 : {
         $12_1 = $12_1 + -4 | 0;
         if ($12_1 >>> 0 >= $19_1 >>> 0) {
          break block25
         }
         $19_1 = $19_1 + -4 | 0;
         HEAP32[$19_1 >> 2] = 0;
        }
        $11_1 = (HEAP32[$12_1 >> 2] | 0) + 1 | 0;
        HEAP32[$12_1 >> 2] = $11_1;
        if ($11_1 >>> 0 > 999999999 >>> 0) {
         continue label8
        }
        break label8;
       };
      }
      $18_1 = Math_imul(($17_1 - $19_1 | 0) >> 2 | 0, 9);
      $11_1 = 10;
      $3_1 = HEAP32[$19_1 >> 2] | 0;
      if ($3_1 >>> 0 < 10 >>> 0) {
       break block20
      }
      label9 : while (1) {
       $18_1 = $18_1 + 1 | 0;
       $11_1 = Math_imul($11_1, 10);
       if ($3_1 >>> 0 >= $11_1 >>> 0) {
        continue label9
       }
       break label9;
      };
     }
     $11_1 = $12_1 + 4 | 0;
     $10_1 = $10_1 >>> 0 > $11_1 >>> 0 ? $11_1 : $10_1;
    }
    block26 : {
     label10 : while (1) {
      $11_1 = $10_1;
      $3_1 = $10_1 >>> 0 <= $19_1 >>> 0;
      if ($3_1) {
       break block26
      }
      $10_1 = $10_1 + -4 | 0;
      if (!(HEAP32[$10_1 >> 2] | 0)) {
       continue label10
      }
      break label10;
     };
    }
    block28 : {
     block27 : {
      if (($14_1 | 0) == (103 | 0)) {
       break block27
      }
      $22_1 = $4_1 & 8 | 0;
      break block28;
     }
     $10_1 = $15_1 ? $15_1 : 1;
     $12_1 = ($10_1 | 0) > ($18_1 | 0) & ($18_1 | 0) > (-5 | 0) | 0;
     $15_1 = ($12_1 ? $18_1 ^ -1 | 0 : -1) + $10_1 | 0;
     $5_1 = ($12_1 ? -1 : -2) + $5_1 | 0;
     $22_1 = $4_1 & 8 | 0;
     if ($22_1) {
      break block28
     }
     $10_1 = -9;
     block29 : {
      if ($3_1) {
       break block29
      }
      $12_1 = HEAP32[($11_1 + -4 | 0) >> 2] | 0;
      if (!$12_1) {
       break block29
      }
      $3_1 = 10;
      $10_1 = 0;
      if (($12_1 >>> 0) % (10 >>> 0) | 0) {
       break block29
      }
      label11 : while (1) {
       $22_1 = $10_1;
       $10_1 = $10_1 + 1 | 0;
       $3_1 = Math_imul($3_1, 10);
       if (!(($12_1 >>> 0) % ($3_1 >>> 0) | 0)) {
        continue label11
       }
       break label11;
      };
      $10_1 = $22_1 ^ -1 | 0;
     }
     $3_1 = Math_imul(($11_1 - $17_1 | 0) >> 2 | 0, 9);
     block30 : {
      if (($5_1 & -33 | 0 | 0) != (70 | 0)) {
       break block30
      }
      $22_1 = 0;
      $10_1 = ($3_1 + $10_1 | 0) + -9 | 0;
      $10_1 = ($10_1 | 0) > (0 | 0) ? $10_1 : 0;
      $15_1 = ($15_1 | 0) < ($10_1 | 0) ? $15_1 : $10_1;
      break block28;
     }
     $22_1 = 0;
     $10_1 = (($18_1 + $3_1 | 0) + $10_1 | 0) + -9 | 0;
     $10_1 = ($10_1 | 0) > (0 | 0) ? $10_1 : 0;
     $15_1 = ($15_1 | 0) < ($10_1 | 0) ? $15_1 : $10_1;
    }
    $12_1 = -1;
    $23_1 = $15_1 | $22_1 | 0;
    if (($15_1 | 0) > (($23_1 ? 2147483645 : 2147483646) | 0)) {
     break block4
    }
    $3_1 = ($15_1 + (($23_1 | 0) != (0 | 0)) | 0) + 1 | 0;
    block32 : {
     block31 : {
      $21_1 = $5_1 & -33 | 0;
      if (($21_1 | 0) != (70 | 0)) {
       break block31
      }
      if (($18_1 | 0) > ($3_1 ^ 2147483647 | 0 | 0)) {
       break block4
      }
      $10_1 = ($18_1 | 0) > (0 | 0) ? $18_1 : 0;
      break block32;
     }
     block33 : {
      $10_1 = $18_1 >> 31 | 0;
      i64toi32_i32$5 = 0;
      $10_1 = $56(($18_1 ^ $10_1 | 0) - $10_1 | 0 | 0, i64toi32_i32$5 | 0, $13_1 | 0) | 0;
      if (($13_1 - $10_1 | 0 | 0) > (1 | 0)) {
       break block33
      }
      label12 : while (1) {
       $10_1 = $10_1 + -1 | 0;
       HEAP8[$10_1 >> 0] = 48;
       if (($13_1 - $10_1 | 0 | 0) < (2 | 0)) {
        continue label12
       }
       break label12;
      };
     }
     $20_1 = $10_1 + -2 | 0;
     HEAP8[$20_1 >> 0] = $5_1;
     $12_1 = -1;
     HEAP8[($10_1 + -1 | 0) >> 0] = ($18_1 | 0) < (0 | 0) ? 45 : 43;
     $10_1 = $13_1 - $20_1 | 0;
     if (($10_1 | 0) > ($3_1 ^ 2147483647 | 0 | 0)) {
      break block4
     }
    }
    $12_1 = -1;
    $10_1 = $10_1 + $3_1 | 0;
    if (($10_1 | 0) > ($8_1 ^ 2147483647 | 0 | 0)) {
     break block4
    }
    $5_1 = $10_1 + $8_1 | 0;
    $57($0_1 | 0, 32 | 0, $2_1 | 0, $5_1 | 0, $4_1 | 0);
    $51($0_1 | 0, $9_1 | 0, $8_1 | 0);
    $57($0_1 | 0, 48 | 0, $2_1 | 0, $5_1 | 0, $4_1 ^ 65536 | 0 | 0);
    block45 : {
     block40 : {
      block38 : {
       block34 : {
        if (($21_1 | 0) != (70 | 0)) {
         break block34
        }
        $18_1 = $6_1 + 16 | 0 | 9 | 0;
        $3_1 = $19_1 >>> 0 > $17_1 >>> 0 ? $17_1 : $19_1;
        $19_1 = $3_1;
        label14 : while (1) {
         i64toi32_i32$3 = $19_1;
         i64toi32_i32$5 = HEAP32[$19_1 >> 2] | 0;
         i64toi32_i32$4 = 0;
         $10_1 = $56(i64toi32_i32$5 | 0, i64toi32_i32$4 | 0, $18_1 | 0) | 0;
         block36 : {
          block35 : {
           if (($19_1 | 0) == ($3_1 | 0)) {
            break block35
           }
           if ($10_1 >>> 0 <= ($6_1 + 16 | 0) >>> 0) {
            break block36
           }
           label13 : while (1) {
            $10_1 = $10_1 + -1 | 0;
            HEAP8[$10_1 >> 0] = 48;
            if ($10_1 >>> 0 > ($6_1 + 16 | 0) >>> 0) {
             continue label13
            }
            break block36;
           };
          }
          if (($10_1 | 0) != ($18_1 | 0)) {
           break block36
          }
          $10_1 = $10_1 + -1 | 0;
          HEAP8[$10_1 >> 0] = 48;
         }
         $51($0_1 | 0, $10_1 | 0, $18_1 - $10_1 | 0 | 0);
         $19_1 = $19_1 + 4 | 0;
         if ($19_1 >>> 0 <= $17_1 >>> 0) {
          continue label14
         }
         break label14;
        };
        block37 : {
         if (!$23_1) {
          break block37
         }
         $51($0_1 | 0, 65749 | 0, 1 | 0);
        }
        if ($19_1 >>> 0 >= $11_1 >>> 0) {
         break block38
        }
        if (($15_1 | 0) < (1 | 0)) {
         break block38
        }
        label16 : while (1) {
         block39 : {
          i64toi32_i32$3 = $19_1;
          i64toi32_i32$4 = HEAP32[$19_1 >> 2] | 0;
          i64toi32_i32$5 = 0;
          $10_1 = $56(i64toi32_i32$4 | 0, i64toi32_i32$5 | 0, $18_1 | 0) | 0;
          if ($10_1 >>> 0 <= ($6_1 + 16 | 0) >>> 0) {
           break block39
          }
          label15 : while (1) {
           $10_1 = $10_1 + -1 | 0;
           HEAP8[$10_1 >> 0] = 48;
           if ($10_1 >>> 0 > ($6_1 + 16 | 0) >>> 0) {
            continue label15
           }
           break label15;
          };
         }
         $51($0_1 | 0, $10_1 | 0, (($15_1 | 0) < (9 | 0) ? $15_1 : 9) | 0);
         $10_1 = $15_1 + -9 | 0;
         $19_1 = $19_1 + 4 | 0;
         if ($19_1 >>> 0 >= $11_1 >>> 0) {
          break block40
         }
         $3_1 = ($15_1 | 0) > (9 | 0);
         $15_1 = $10_1;
         if ($3_1) {
          continue label16
         }
         break block40;
        };
       }
       block41 : {
        if (($15_1 | 0) < (0 | 0)) {
         break block41
        }
        $12_1 = $11_1 >>> 0 > $19_1 >>> 0 ? $11_1 : $19_1 + 4 | 0;
        $18_1 = $6_1 + 16 | 0 | 9 | 0;
        $11_1 = $19_1;
        label18 : while (1) {
         block42 : {
          i64toi32_i32$3 = $11_1;
          i64toi32_i32$5 = HEAP32[$11_1 >> 2] | 0;
          i64toi32_i32$4 = 0;
          $10_1 = $56(i64toi32_i32$5 | 0, i64toi32_i32$4 | 0, $18_1 | 0) | 0;
          if (($10_1 | 0) != ($18_1 | 0)) {
           break block42
          }
          $10_1 = $10_1 + -1 | 0;
          HEAP8[$10_1 >> 0] = 48;
         }
         block44 : {
          block43 : {
           if (($11_1 | 0) == ($19_1 | 0)) {
            break block43
           }
           if ($10_1 >>> 0 <= ($6_1 + 16 | 0) >>> 0) {
            break block44
           }
           label17 : while (1) {
            $10_1 = $10_1 + -1 | 0;
            HEAP8[$10_1 >> 0] = 48;
            if ($10_1 >>> 0 > ($6_1 + 16 | 0) >>> 0) {
             continue label17
            }
            break block44;
           };
          }
          $51($0_1 | 0, $10_1 | 0, 1 | 0);
          $10_1 = $10_1 + 1 | 0;
          if (!($15_1 | $22_1 | 0)) {
           break block44
          }
          $51($0_1 | 0, 65749 | 0, 1 | 0);
         }
         $3_1 = $18_1 - $10_1 | 0;
         $51($0_1 | 0, $10_1 | 0, (($15_1 | 0) > ($3_1 | 0) ? $3_1 : $15_1) | 0);
         $15_1 = $15_1 - $3_1 | 0;
         $11_1 = $11_1 + 4 | 0;
         if ($11_1 >>> 0 >= $12_1 >>> 0) {
          break block41
         }
         if (($15_1 | 0) > (-1 | 0)) {
          continue label18
         }
         break label18;
        };
       }
       $57($0_1 | 0, 48 | 0, $15_1 + 18 | 0 | 0, 18 | 0, 0 | 0);
       $51($0_1 | 0, $20_1 | 0, $13_1 - $20_1 | 0 | 0);
       break block45;
      }
      $10_1 = $15_1;
     }
     $57($0_1 | 0, 48 | 0, $10_1 + 9 | 0 | 0, 9 | 0, 0 | 0);
    }
    $57($0_1 | 0, 32 | 0, $2_1 | 0, $5_1 | 0, $4_1 ^ 8192 | 0 | 0);
    $12_1 = ($2_1 | 0) > ($5_1 | 0) ? $2_1 : $5_1;
    break block4;
   }
   $20_1 = $9_1 + ((($5_1 << 26 | 0) >> 31 | 0) & 9 | 0) | 0;
   block46 : {
    if ($3_1 >>> 0 > 11 >>> 0) {
     break block46
    }
    $10_1 = 12 - $3_1 | 0;
    $27_1 = 16.0;
    label19 : while (1) {
     $27_1 = $27_1 * 16.0;
     $10_1 = $10_1 + -1 | 0;
     if ($10_1) {
      continue label19
     }
     break label19;
    };
    block47 : {
     if ((HEAPU8[$20_1 >> 0] | 0 | 0) != (45 | 0)) {
      break block47
     }
     $1_1 = -($27_1 + (-$1_1 - $27_1));
     break block46;
    }
    $1_1 = $1_1 + $27_1 - $27_1;
   }
   block48 : {
    $11_1 = HEAP32[($6_1 + 44 | 0) >> 2] | 0;
    $10_1 = $11_1 >> 31 | 0;
    i64toi32_i32$4 = 0;
    $10_1 = $56(($11_1 ^ $10_1 | 0) - $10_1 | 0 | 0, i64toi32_i32$4 | 0, $13_1 | 0) | 0;
    if (($10_1 | 0) != ($13_1 | 0)) {
     break block48
    }
    $10_1 = $10_1 + -1 | 0;
    HEAP8[$10_1 >> 0] = 48;
    $11_1 = HEAP32[($6_1 + 44 | 0) >> 2] | 0;
   }
   $22_1 = $8_1 | 2 | 0;
   $19_1 = $5_1 & 32 | 0;
   $23_1 = $10_1 + -2 | 0;
   HEAP8[$23_1 >> 0] = $5_1 + 15 | 0;
   HEAP8[($10_1 + -1 | 0) >> 0] = ($11_1 | 0) < (0 | 0) ? 45 : 43;
   $18_1 = ($3_1 | 0) < (1 | 0) & !($4_1 & 8 | 0) | 0;
   $11_1 = $6_1 + 16 | 0;
   label20 : while (1) {
    $10_1 = $11_1;
    $891 = $10_1;
    if (Math_abs($1_1) < 2147483647.0) {
     $898 = ~~$1_1
    } else {
     $898 = -2147483648
    }
    $11_1 = $898;
    HEAP8[$891 >> 0] = HEAPU8[($11_1 + 66240 | 0) >> 0] | 0 | $19_1 | 0;
    $1_1 = ($1_1 - +($11_1 | 0)) * 16.0;
    block49 : {
     $11_1 = $10_1 + 1 | 0;
     if (($11_1 - ($6_1 + 16 | 0) | 0 | 0) != (1 | 0)) {
      break block49
     }
     if ($1_1 == 0.0 & $18_1 | 0) {
      break block49
     }
     HEAP8[($10_1 + 1 | 0) >> 0] = 46;
     $11_1 = $10_1 + 2 | 0;
    }
    if ($1_1 != 0.0) {
     continue label20
    }
    break label20;
   };
   $12_1 = -1;
   $19_1 = $13_1 - $23_1 | 0;
   $18_1 = $22_1 + $19_1 | 0;
   if (($3_1 | 0) > (2147483645 - $18_1 | 0 | 0)) {
    break block4
   }
   $10_1 = $11_1 - ($6_1 + 16 | 0) | 0;
   $3_1 = $3_1 ? (($10_1 + -2 | 0 | 0) < ($3_1 | 0) ? $3_1 + 2 | 0 : $10_1) : $10_1;
   $11_1 = $18_1 + $3_1 | 0;
   $57($0_1 | 0, 32 | 0, $2_1 | 0, $11_1 | 0, $4_1 | 0);
   $51($0_1 | 0, $20_1 | 0, $22_1 | 0);
   $57($0_1 | 0, 48 | 0, $2_1 | 0, $11_1 | 0, $4_1 ^ 65536 | 0 | 0);
   $51($0_1 | 0, $6_1 + 16 | 0 | 0, $10_1 | 0);
   $57($0_1 | 0, 48 | 0, $3_1 - $10_1 | 0 | 0, 0 | 0, 0 | 0);
   $51($0_1 | 0, $23_1 | 0, $19_1 | 0);
   $57($0_1 | 0, 32 | 0, $2_1 | 0, $11_1 | 0, $4_1 ^ 8192 | 0 | 0);
   $12_1 = ($2_1 | 0) > ($11_1 | 0) ? $2_1 : $11_1;
  }
  global$0 = $6_1 + 560 | 0;
  return $12_1 | 0;
 }
 
 function $60($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $2_1 = 0, $12_1 = 0, $12$hi = 0, $14_1 = 0, $14$hi = 0;
  $2_1 = ((HEAP32[$1_1 >> 2] | 0) + 7 | 0) & -8 | 0;
  HEAP32[$1_1 >> 2] = $2_1 + 16 | 0;
  i64toi32_i32$2 = $2_1;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $12_1 = i64toi32_i32$0;
  $12$hi = i64toi32_i32$1;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  $14_1 = i64toi32_i32$1;
  $14$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $12$hi;
  i64toi32_i32$1 = $14$hi;
  HEAPF64[$0_1 >> 3] = +$45($12_1 | 0, i64toi32_i32$0 | 0, $14_1 | 0, i64toi32_i32$1 | 0);
 }
 
 function $61($0_1) {
  $0_1 = +$0_1;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  wasm2js_scratch_store_f64(+$0_1);
  i64toi32_i32$0 = wasm2js_scratch_load_i32(1 | 0) | 0;
  i64toi32_i32$1 = wasm2js_scratch_load_i32(0 | 0) | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function $62($0_1) {
  $0_1 = $0_1 | 0;
  var $5_1 = 0, $4_1 = 0, $7_1 = 0, $8_1 = 0, $3_1 = 0, $2_1 = 0, $6_1 = 0, $12_1 = 0, $11_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $10_1 = 0, i64toi32_i32$2 = 0, $1_1 = 0, $9_1 = 0, $87_1 = 0, $201 = 0, $1154 = 0, $1156 = 0;
  $1_1 = global$0 - 16 | 0;
  global$0 = $1_1;
  block5 : {
   block88 : {
    block4 : {
     block6 : {
      block : {
       if ($0_1 >>> 0 > 244 >>> 0) {
        break block
       }
       block1 : {
        $2_1 = HEAP32[(0 + 69364 | 0) >> 2] | 0;
        $3_1 = $0_1 >>> 0 < 11 >>> 0 ? 16 : ($0_1 + 11 | 0) & 504 | 0;
        $4_1 = $3_1 >>> 3 | 0;
        $0_1 = $2_1 >>> $4_1 | 0;
        if (!($0_1 & 3 | 0)) {
         break block1
        }
        block3 : {
         block2 : {
          $3_1 = (($0_1 ^ -1 | 0) & 1 | 0) + $4_1 | 0;
          $0_1 = $3_1 << 3 | 0;
          $5_1 = $0_1 + 69404 | 0;
          $4_1 = HEAP32[($0_1 + 69412 | 0) >> 2] | 0;
          $0_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
          if (($5_1 | 0) != ($0_1 | 0)) {
           break block2
          }
          HEAP32[(0 + 69364 | 0) >> 2] = $2_1 & (__wasm_rotl_i32(-2 | 0, $3_1 | 0) | 0) | 0;
          break block3;
         }
         if ($0_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
          break block4
         }
         if ((HEAP32[($0_1 + 12 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block4
         }
         HEAP32[($0_1 + 12 | 0) >> 2] = $5_1;
         HEAP32[($5_1 + 8 | 0) >> 2] = $0_1;
        }
        $0_1 = $4_1 + 8 | 0;
        $3_1 = $3_1 << 3 | 0;
        HEAP32[($4_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
        $4_1 = $4_1 + $3_1 | 0;
        HEAP32[($4_1 + 4 | 0) >> 2] = HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 1 | 0;
        break block5;
       }
       $6_1 = HEAP32[(0 + 69372 | 0) >> 2] | 0;
       if ($3_1 >>> 0 <= $6_1 >>> 0) {
        break block6
       }
       block7 : {
        if (!$0_1) {
         break block7
        }
        block9 : {
         block8 : {
          $87_1 = $0_1 << $4_1 | 0;
          $0_1 = 2 << $4_1 | 0;
          $5_1 = __wasm_ctz_i32($87_1 & ($0_1 | (0 - $0_1 | 0) | 0) | 0 | 0) | 0;
          $0_1 = $5_1 << 3 | 0;
          $7_1 = $0_1 + 69404 | 0;
          $0_1 = HEAP32[($0_1 + 69412 | 0) >> 2] | 0;
          $4_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
          if (($7_1 | 0) != ($4_1 | 0)) {
           break block8
          }
          $2_1 = $2_1 & (__wasm_rotl_i32(-2 | 0, $5_1 | 0) | 0) | 0;
          HEAP32[(0 + 69364 | 0) >> 2] = $2_1;
          break block9;
         }
         if ($4_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
          break block4
         }
         if ((HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) != ($0_1 | 0)) {
          break block4
         }
         HEAP32[($4_1 + 12 | 0) >> 2] = $7_1;
         HEAP32[($7_1 + 8 | 0) >> 2] = $4_1;
        }
        HEAP32[($0_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
        $7_1 = $0_1 + $3_1 | 0;
        $4_1 = $5_1 << 3 | 0;
        $3_1 = $4_1 - $3_1 | 0;
        HEAP32[($7_1 + 4 | 0) >> 2] = $3_1 | 1 | 0;
        HEAP32[($0_1 + $4_1 | 0) >> 2] = $3_1;
        block10 : {
         if (!$6_1) {
          break block10
         }
         $5_1 = ($6_1 & -8 | 0) + 69404 | 0;
         $4_1 = HEAP32[(0 + 69384 | 0) >> 2] | 0;
         block12 : {
          block11 : {
           $8_1 = 1 << ($6_1 >>> 3 | 0) | 0;
           if ($2_1 & $8_1 | 0) {
            break block11
           }
           HEAP32[(0 + 69364 | 0) >> 2] = $2_1 | $8_1 | 0;
           $8_1 = $5_1;
           break block12;
          }
          $8_1 = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
          if ($8_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
           break block4
          }
         }
         HEAP32[($5_1 + 8 | 0) >> 2] = $4_1;
         HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
         HEAP32[($4_1 + 12 | 0) >> 2] = $5_1;
         HEAP32[($4_1 + 8 | 0) >> 2] = $8_1;
        }
        $0_1 = $0_1 + 8 | 0;
        HEAP32[(0 + 69384 | 0) >> 2] = $7_1;
        HEAP32[(0 + 69372 | 0) >> 2] = $3_1;
        break block5;
       }
       $9_1 = HEAP32[(0 + 69368 | 0) >> 2] | 0;
       if (!$9_1) {
        break block6
       }
       $7_1 = HEAP32[(((__wasm_ctz_i32($9_1 | 0) | 0) << 2 | 0) + 69668 | 0) >> 2] | 0;
       $4_1 = ((HEAP32[($7_1 + 4 | 0) >> 2] | 0) & -8 | 0) - $3_1 | 0;
       $5_1 = $7_1;
       block14 : {
        label : while (1) {
         block13 : {
          $0_1 = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
          if ($0_1) {
           break block13
          }
          $0_1 = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
          if (!$0_1) {
           break block14
          }
         }
         $5_1 = ((HEAP32[($0_1 + 4 | 0) >> 2] | 0) & -8 | 0) - $3_1 | 0;
         $201 = $5_1;
         $5_1 = $5_1 >>> 0 < $4_1 >>> 0;
         $4_1 = $5_1 ? $201 : $4_1;
         $7_1 = $5_1 ? $0_1 : $7_1;
         $5_1 = $0_1;
         continue label;
        };
       }
       $10_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
       if ($7_1 >>> 0 < $10_1 >>> 0) {
        break block4
       }
       $11_1 = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
       block16 : {
        block15 : {
         $0_1 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
         if (($0_1 | 0) == ($7_1 | 0)) {
          break block15
         }
         $5_1 = HEAP32[($7_1 + 8 | 0) >> 2] | 0;
         if ($5_1 >>> 0 < $10_1 >>> 0) {
          break block4
         }
         if ((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != ($7_1 | 0)) {
          break block4
         }
         if ((HEAP32[($0_1 + 8 | 0) >> 2] | 0 | 0) != ($7_1 | 0)) {
          break block4
         }
         HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
         HEAP32[($0_1 + 8 | 0) >> 2] = $5_1;
         break block16;
        }
        block19 : {
         block18 : {
          block17 : {
           $5_1 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
           if (!$5_1) {
            break block17
           }
           $8_1 = $7_1 + 20 | 0;
           break block18;
          }
          $5_1 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
          if (!$5_1) {
           break block19
          }
          $8_1 = $7_1 + 16 | 0;
         }
         label1 : while (1) {
          $12_1 = $8_1;
          $0_1 = $5_1;
          $8_1 = $0_1 + 20 | 0;
          $5_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
          if ($5_1) {
           continue label1
          }
          $8_1 = $0_1 + 16 | 0;
          $5_1 = HEAP32[($0_1 + 16 | 0) >> 2] | 0;
          if ($5_1) {
           continue label1
          }
          break label1;
         };
         if ($12_1 >>> 0 < $10_1 >>> 0) {
          break block4
         }
         HEAP32[$12_1 >> 2] = 0;
         break block16;
        }
        $0_1 = 0;
       }
       block20 : {
        if (!$11_1) {
         break block20
        }
        block22 : {
         block21 : {
          $8_1 = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
          $5_1 = ($8_1 << 2 | 0) + 69668 | 0;
          if (($7_1 | 0) != (HEAP32[$5_1 >> 2] | 0 | 0)) {
           break block21
          }
          HEAP32[$5_1 >> 2] = $0_1;
          if ($0_1) {
           break block22
          }
          HEAP32[(0 + 69368 | 0) >> 2] = $9_1 & (__wasm_rotl_i32(-2 | 0, $8_1 | 0) | 0) | 0;
          break block20;
         }
         if ($11_1 >>> 0 < $10_1 >>> 0) {
          break block4
         }
         block24 : {
          block23 : {
           if ((HEAP32[($11_1 + 16 | 0) >> 2] | 0 | 0) != ($7_1 | 0)) {
            break block23
           }
           HEAP32[($11_1 + 16 | 0) >> 2] = $0_1;
           break block24;
          }
          HEAP32[($11_1 + 20 | 0) >> 2] = $0_1;
         }
         if (!$0_1) {
          break block20
         }
        }
        if ($0_1 >>> 0 < $10_1 >>> 0) {
         break block4
        }
        HEAP32[($0_1 + 24 | 0) >> 2] = $11_1;
        block25 : {
         $5_1 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
         if (!$5_1) {
          break block25
         }
         if ($5_1 >>> 0 < $10_1 >>> 0) {
          break block4
         }
         HEAP32[($0_1 + 16 | 0) >> 2] = $5_1;
         HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
        }
        $5_1 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
        if (!$5_1) {
         break block20
        }
        if ($5_1 >>> 0 < $10_1 >>> 0) {
         break block4
        }
        HEAP32[($0_1 + 20 | 0) >> 2] = $5_1;
        HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
       }
       block27 : {
        block26 : {
         if ($4_1 >>> 0 > 15 >>> 0) {
          break block26
         }
         $0_1 = $4_1 + $3_1 | 0;
         HEAP32[($7_1 + 4 | 0) >> 2] = $0_1 | 3 | 0;
         $0_1 = $7_1 + $0_1 | 0;
         HEAP32[($0_1 + 4 | 0) >> 2] = HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 1 | 0;
         break block27;
        }
        HEAP32[($7_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
        $3_1 = $7_1 + $3_1 | 0;
        HEAP32[($3_1 + 4 | 0) >> 2] = $4_1 | 1 | 0;
        HEAP32[($3_1 + $4_1 | 0) >> 2] = $4_1;
        block28 : {
         if (!$6_1) {
          break block28
         }
         $5_1 = ($6_1 & -8 | 0) + 69404 | 0;
         $0_1 = HEAP32[(0 + 69384 | 0) >> 2] | 0;
         block30 : {
          block29 : {
           $8_1 = 1 << ($6_1 >>> 3 | 0) | 0;
           if ($8_1 & $2_1 | 0) {
            break block29
           }
           HEAP32[(0 + 69364 | 0) >> 2] = $8_1 | $2_1 | 0;
           $8_1 = $5_1;
           break block30;
          }
          $8_1 = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
          if ($8_1 >>> 0 < $10_1 >>> 0) {
           break block4
          }
         }
         HEAP32[($5_1 + 8 | 0) >> 2] = $0_1;
         HEAP32[($8_1 + 12 | 0) >> 2] = $0_1;
         HEAP32[($0_1 + 12 | 0) >> 2] = $5_1;
         HEAP32[($0_1 + 8 | 0) >> 2] = $8_1;
        }
        HEAP32[(0 + 69384 | 0) >> 2] = $3_1;
        HEAP32[(0 + 69372 | 0) >> 2] = $4_1;
       }
       $0_1 = $7_1 + 8 | 0;
       break block5;
      }
      $3_1 = -1;
      if ($0_1 >>> 0 > -65 >>> 0) {
       break block6
      }
      $4_1 = $0_1 + 11 | 0;
      $3_1 = $4_1 & -8 | 0;
      $11_1 = HEAP32[(0 + 69368 | 0) >> 2] | 0;
      if (!$11_1) {
       break block6
      }
      $6_1 = 31;
      block31 : {
       if ($0_1 >>> 0 > 16777204 >>> 0) {
        break block31
       }
       $0_1 = Math_clz32($4_1 >>> 8 | 0);
       $6_1 = ((($3_1 >>> (38 - $0_1 | 0) | 0) & 1 | 0) - ($0_1 << 1 | 0) | 0) + 62 | 0;
      }
      $4_1 = 0 - $3_1 | 0;
      block37 : {
       block35 : {
        block33 : {
         block32 : {
          $5_1 = HEAP32[(($6_1 << 2 | 0) + 69668 | 0) >> 2] | 0;
          if ($5_1) {
           break block32
          }
          $0_1 = 0;
          $8_1 = 0;
          break block33;
         }
         $0_1 = 0;
         $7_1 = $3_1 << (($6_1 | 0) == (31 | 0) ? 0 : 25 - ($6_1 >>> 1 | 0) | 0) | 0;
         $8_1 = 0;
         label2 : while (1) {
          block34 : {
           $2_1 = ((HEAP32[($5_1 + 4 | 0) >> 2] | 0) & -8 | 0) - $3_1 | 0;
           if ($2_1 >>> 0 >= $4_1 >>> 0) {
            break block34
           }
           $4_1 = $2_1;
           $8_1 = $5_1;
           if ($4_1) {
            break block34
           }
           $4_1 = 0;
           $8_1 = $5_1;
           $0_1 = $5_1;
           break block35;
          }
          $2_1 = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
          $12_1 = HEAP32[(($5_1 + (($7_1 >>> 29 | 0) & 4 | 0) | 0) + 16 | 0) >> 2] | 0;
          $0_1 = $2_1 ? (($2_1 | 0) == ($12_1 | 0) ? $0_1 : $2_1) : $0_1;
          $7_1 = $7_1 << 1 | 0;
          $5_1 = $12_1;
          if ($5_1) {
           continue label2
          }
          break label2;
         };
        }
        block36 : {
         if ($0_1 | $8_1 | 0) {
          break block36
         }
         $8_1 = 0;
         $0_1 = 2 << $6_1 | 0;
         $0_1 = ($0_1 | (0 - $0_1 | 0) | 0) & $11_1 | 0;
         if (!$0_1) {
          break block6
         }
         $0_1 = HEAP32[(((__wasm_ctz_i32($0_1 | 0) | 0) << 2 | 0) + 69668 | 0) >> 2] | 0;
        }
        if (!$0_1) {
         break block37
        }
       }
       label3 : while (1) {
        $2_1 = ((HEAP32[($0_1 + 4 | 0) >> 2] | 0) & -8 | 0) - $3_1 | 0;
        $7_1 = $2_1 >>> 0 < $4_1 >>> 0;
        block38 : {
         $5_1 = HEAP32[($0_1 + 16 | 0) >> 2] | 0;
         if ($5_1) {
          break block38
         }
         $5_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
        }
        $4_1 = $7_1 ? $2_1 : $4_1;
        $8_1 = $7_1 ? $0_1 : $8_1;
        $0_1 = $5_1;
        if ($0_1) {
         continue label3
        }
        break label3;
       };
      }
      if (!$8_1) {
       break block6
      }
      if ($4_1 >>> 0 >= ((HEAP32[(0 + 69372 | 0) >> 2] | 0) - $3_1 | 0) >>> 0) {
       break block6
      }
      $12_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
      if ($8_1 >>> 0 < $12_1 >>> 0) {
       break block4
      }
      $6_1 = HEAP32[($8_1 + 24 | 0) >> 2] | 0;
      block40 : {
       block39 : {
        $0_1 = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
        if (($0_1 | 0) == ($8_1 | 0)) {
         break block39
        }
        $5_1 = HEAP32[($8_1 + 8 | 0) >> 2] | 0;
        if ($5_1 >>> 0 < $12_1 >>> 0) {
         break block4
        }
        if ((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != ($8_1 | 0)) {
         break block4
        }
        if ((HEAP32[($0_1 + 8 | 0) >> 2] | 0 | 0) != ($8_1 | 0)) {
         break block4
        }
        HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
        HEAP32[($0_1 + 8 | 0) >> 2] = $5_1;
        break block40;
       }
       block43 : {
        block42 : {
         block41 : {
          $5_1 = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
          if (!$5_1) {
           break block41
          }
          $7_1 = $8_1 + 20 | 0;
          break block42;
         }
         $5_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
         if (!$5_1) {
          break block43
         }
         $7_1 = $8_1 + 16 | 0;
        }
        label4 : while (1) {
         $2_1 = $7_1;
         $0_1 = $5_1;
         $7_1 = $0_1 + 20 | 0;
         $5_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
         if ($5_1) {
          continue label4
         }
         $7_1 = $0_1 + 16 | 0;
         $5_1 = HEAP32[($0_1 + 16 | 0) >> 2] | 0;
         if ($5_1) {
          continue label4
         }
         break label4;
        };
        if ($2_1 >>> 0 < $12_1 >>> 0) {
         break block4
        }
        HEAP32[$2_1 >> 2] = 0;
        break block40;
       }
       $0_1 = 0;
      }
      block44 : {
       if (!$6_1) {
        break block44
       }
       block46 : {
        block45 : {
         $7_1 = HEAP32[($8_1 + 28 | 0) >> 2] | 0;
         $5_1 = ($7_1 << 2 | 0) + 69668 | 0;
         if (($8_1 | 0) != (HEAP32[$5_1 >> 2] | 0 | 0)) {
          break block45
         }
         HEAP32[$5_1 >> 2] = $0_1;
         if ($0_1) {
          break block46
         }
         $11_1 = $11_1 & (__wasm_rotl_i32(-2 | 0, $7_1 | 0) | 0) | 0;
         HEAP32[(0 + 69368 | 0) >> 2] = $11_1;
         break block44;
        }
        if ($6_1 >>> 0 < $12_1 >>> 0) {
         break block4
        }
        block48 : {
         block47 : {
          if ((HEAP32[($6_1 + 16 | 0) >> 2] | 0 | 0) != ($8_1 | 0)) {
           break block47
          }
          HEAP32[($6_1 + 16 | 0) >> 2] = $0_1;
          break block48;
         }
         HEAP32[($6_1 + 20 | 0) >> 2] = $0_1;
        }
        if (!$0_1) {
         break block44
        }
       }
       if ($0_1 >>> 0 < $12_1 >>> 0) {
        break block4
       }
       HEAP32[($0_1 + 24 | 0) >> 2] = $6_1;
       block49 : {
        $5_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
        if (!$5_1) {
         break block49
        }
        if ($5_1 >>> 0 < $12_1 >>> 0) {
         break block4
        }
        HEAP32[($0_1 + 16 | 0) >> 2] = $5_1;
        HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
       }
       $5_1 = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
       if (!$5_1) {
        break block44
       }
       if ($5_1 >>> 0 < $12_1 >>> 0) {
        break block4
       }
       HEAP32[($0_1 + 20 | 0) >> 2] = $5_1;
       HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
      }
      block51 : {
       block50 : {
        if ($4_1 >>> 0 > 15 >>> 0) {
         break block50
        }
        $0_1 = $4_1 + $3_1 | 0;
        HEAP32[($8_1 + 4 | 0) >> 2] = $0_1 | 3 | 0;
        $0_1 = $8_1 + $0_1 | 0;
        HEAP32[($0_1 + 4 | 0) >> 2] = HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 1 | 0;
        break block51;
       }
       HEAP32[($8_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
       $7_1 = $8_1 + $3_1 | 0;
       HEAP32[($7_1 + 4 | 0) >> 2] = $4_1 | 1 | 0;
       HEAP32[($7_1 + $4_1 | 0) >> 2] = $4_1;
       block52 : {
        if ($4_1 >>> 0 > 255 >>> 0) {
         break block52
        }
        $0_1 = ($4_1 & -8 | 0) + 69404 | 0;
        block54 : {
         block53 : {
          $3_1 = HEAP32[(0 + 69364 | 0) >> 2] | 0;
          $4_1 = 1 << ($4_1 >>> 3 | 0) | 0;
          if ($3_1 & $4_1 | 0) {
           break block53
          }
          HEAP32[(0 + 69364 | 0) >> 2] = $3_1 | $4_1 | 0;
          $4_1 = $0_1;
          break block54;
         }
         $4_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
         if ($4_1 >>> 0 < $12_1 >>> 0) {
          break block4
         }
        }
        HEAP32[($0_1 + 8 | 0) >> 2] = $7_1;
        HEAP32[($4_1 + 12 | 0) >> 2] = $7_1;
        HEAP32[($7_1 + 12 | 0) >> 2] = $0_1;
        HEAP32[($7_1 + 8 | 0) >> 2] = $4_1;
        break block51;
       }
       $0_1 = 31;
       block55 : {
        if ($4_1 >>> 0 > 16777215 >>> 0) {
         break block55
        }
        $0_1 = Math_clz32($4_1 >>> 8 | 0);
        $0_1 = ((($4_1 >>> (38 - $0_1 | 0) | 0) & 1 | 0) - ($0_1 << 1 | 0) | 0) + 62 | 0;
       }
       HEAP32[($7_1 + 28 | 0) >> 2] = $0_1;
       i64toi32_i32$1 = $7_1;
       i64toi32_i32$0 = 0;
       HEAP32[($7_1 + 16 | 0) >> 2] = 0;
       HEAP32[($7_1 + 20 | 0) >> 2] = i64toi32_i32$0;
       $3_1 = ($0_1 << 2 | 0) + 69668 | 0;
       block58 : {
        block57 : {
         block56 : {
          $5_1 = 1 << $0_1 | 0;
          if ($11_1 & $5_1 | 0) {
           break block56
          }
          HEAP32[(0 + 69368 | 0) >> 2] = $11_1 | $5_1 | 0;
          HEAP32[$3_1 >> 2] = $7_1;
          HEAP32[($7_1 + 24 | 0) >> 2] = $3_1;
          break block57;
         }
         $0_1 = $4_1 << (($0_1 | 0) == (31 | 0) ? 0 : 25 - ($0_1 >>> 1 | 0) | 0) | 0;
         $5_1 = HEAP32[$3_1 >> 2] | 0;
         label5 : while (1) {
          $3_1 = $5_1;
          if (((HEAP32[($5_1 + 4 | 0) >> 2] | 0) & -8 | 0 | 0) == ($4_1 | 0)) {
           break block58
          }
          $5_1 = $0_1 >>> 29 | 0;
          $0_1 = $0_1 << 1 | 0;
          $2_1 = $3_1 + ($5_1 & 4 | 0) | 0;
          $5_1 = HEAP32[($2_1 + 16 | 0) >> 2] | 0;
          if ($5_1) {
           continue label5
          }
          break label5;
         };
         $0_1 = $2_1 + 16 | 0;
         if ($0_1 >>> 0 < $12_1 >>> 0) {
          break block4
         }
         HEAP32[$0_1 >> 2] = $7_1;
         HEAP32[($7_1 + 24 | 0) >> 2] = $3_1;
        }
        HEAP32[($7_1 + 12 | 0) >> 2] = $7_1;
        HEAP32[($7_1 + 8 | 0) >> 2] = $7_1;
        break block51;
       }
       if ($3_1 >>> 0 < $12_1 >>> 0) {
        break block4
       }
       $0_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
       if ($0_1 >>> 0 < $12_1 >>> 0) {
        break block4
       }
       HEAP32[($0_1 + 12 | 0) >> 2] = $7_1;
       HEAP32[($3_1 + 8 | 0) >> 2] = $7_1;
       HEAP32[($7_1 + 24 | 0) >> 2] = 0;
       HEAP32[($7_1 + 12 | 0) >> 2] = $3_1;
       HEAP32[($7_1 + 8 | 0) >> 2] = $0_1;
      }
      $0_1 = $8_1 + 8 | 0;
      break block5;
     }
     block59 : {
      $0_1 = HEAP32[(0 + 69372 | 0) >> 2] | 0;
      if ($0_1 >>> 0 < $3_1 >>> 0) {
       break block59
      }
      $4_1 = HEAP32[(0 + 69384 | 0) >> 2] | 0;
      block61 : {
       block60 : {
        $5_1 = $0_1 - $3_1 | 0;
        if ($5_1 >>> 0 < 16 >>> 0) {
         break block60
        }
        $7_1 = $4_1 + $3_1 | 0;
        HEAP32[($7_1 + 4 | 0) >> 2] = $5_1 | 1 | 0;
        HEAP32[($4_1 + $0_1 | 0) >> 2] = $5_1;
        HEAP32[($4_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
        break block61;
       }
       HEAP32[($4_1 + 4 | 0) >> 2] = $0_1 | 3 | 0;
       $0_1 = $4_1 + $0_1 | 0;
       HEAP32[($0_1 + 4 | 0) >> 2] = HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 1 | 0;
       $7_1 = 0;
       $5_1 = 0;
      }
      HEAP32[(0 + 69372 | 0) >> 2] = $5_1;
      HEAP32[(0 + 69384 | 0) >> 2] = $7_1;
      $0_1 = $4_1 + 8 | 0;
      break block5;
     }
     block62 : {
      $7_1 = HEAP32[(0 + 69376 | 0) >> 2] | 0;
      if ($7_1 >>> 0 <= $3_1 >>> 0) {
       break block62
      }
      $4_1 = $7_1 - $3_1 | 0;
      HEAP32[(0 + 69376 | 0) >> 2] = $4_1;
      $0_1 = HEAP32[(0 + 69388 | 0) >> 2] | 0;
      $5_1 = $0_1 + $3_1 | 0;
      HEAP32[(0 + 69388 | 0) >> 2] = $5_1;
      HEAP32[($5_1 + 4 | 0) >> 2] = $4_1 | 1 | 0;
      HEAP32[($0_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
      $0_1 = $0_1 + 8 | 0;
      break block5;
     }
     block64 : {
      block63 : {
       if (!(HEAP32[(0 + 69836 | 0) >> 2] | 0)) {
        break block63
       }
       $4_1 = HEAP32[(0 + 69844 | 0) >> 2] | 0;
       break block64;
      }
      i64toi32_i32$1 = 0;
      i64toi32_i32$0 = -1;
      HEAP32[(i64toi32_i32$1 + 69848 | 0) >> 2] = -1;
      HEAP32[(i64toi32_i32$1 + 69852 | 0) >> 2] = i64toi32_i32$0;
      i64toi32_i32$1 = 0;
      i64toi32_i32$0 = 4096;
      HEAP32[(i64toi32_i32$1 + 69840 | 0) >> 2] = 4096;
      HEAP32[(i64toi32_i32$1 + 69844 | 0) >> 2] = i64toi32_i32$0;
      HEAP32[(0 + 69836 | 0) >> 2] = (($1_1 + 12 | 0) & -16 | 0) ^ 1431655768 | 0;
      HEAP32[(0 + 69856 | 0) >> 2] = 0;
      HEAP32[(0 + 69808 | 0) >> 2] = 0;
      $4_1 = 4096;
     }
     $0_1 = 0;
     $6_1 = $3_1 + 47 | 0;
     $2_1 = $4_1 + $6_1 | 0;
     $12_1 = 0 - $4_1 | 0;
     $8_1 = $2_1 & $12_1 | 0;
     if ($8_1 >>> 0 <= $3_1 >>> 0) {
      break block5
     }
     $0_1 = 0;
     block65 : {
      $4_1 = HEAP32[(0 + 69804 | 0) >> 2] | 0;
      if (!$4_1) {
       break block65
      }
      $5_1 = HEAP32[(0 + 69796 | 0) >> 2] | 0;
      $11_1 = $5_1 + $8_1 | 0;
      if ($11_1 >>> 0 <= $5_1 >>> 0) {
       break block5
      }
      if ($11_1 >>> 0 > $4_1 >>> 0) {
       break block5
      }
     }
     block77 : {
      block74 : {
       block66 : {
        if ((HEAPU8[(0 + 69808 | 0) >> 0] | 0) & 4 | 0) {
         break block66
        }
        block70 : {
         block75 : {
          block73 : {
           block69 : {
            block67 : {
             $4_1 = HEAP32[(0 + 69388 | 0) >> 2] | 0;
             if (!$4_1) {
              break block67
             }
             $0_1 = 69812;
             label6 : while (1) {
              block68 : {
               $5_1 = HEAP32[$0_1 >> 2] | 0;
               if ($4_1 >>> 0 < $5_1 >>> 0) {
                break block68
               }
               if ($4_1 >>> 0 < ($5_1 + (HEAP32[($0_1 + 4 | 0) >> 2] | 0) | 0) >>> 0) {
                break block69
               }
              }
              $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
              if ($0_1) {
               continue label6
              }
              break label6;
             };
            }
            $7_1 = $16(0 | 0) | 0;
            if (($7_1 | 0) == (-1 | 0)) {
             break block70
            }
            $2_1 = $8_1;
            block71 : {
             $0_1 = HEAP32[(0 + 69840 | 0) >> 2] | 0;
             $4_1 = $0_1 + -1 | 0;
             if (!($4_1 & $7_1 | 0)) {
              break block71
             }
             $2_1 = ($8_1 - $7_1 | 0) + (($4_1 + $7_1 | 0) & (0 - $0_1 | 0) | 0) | 0;
            }
            if ($2_1 >>> 0 <= $3_1 >>> 0) {
             break block70
            }
            block72 : {
             $0_1 = HEAP32[(0 + 69804 | 0) >> 2] | 0;
             if (!$0_1) {
              break block72
             }
             $4_1 = HEAP32[(0 + 69796 | 0) >> 2] | 0;
             $5_1 = $4_1 + $2_1 | 0;
             if ($5_1 >>> 0 <= $4_1 >>> 0) {
              break block70
             }
             if ($5_1 >>> 0 > $0_1 >>> 0) {
              break block70
             }
            }
            $0_1 = $16($2_1 | 0) | 0;
            if (($0_1 | 0) != ($7_1 | 0)) {
             break block73
            }
            break block74;
           }
           $2_1 = ($2_1 - $7_1 | 0) & $12_1 | 0;
           $7_1 = $16($2_1 | 0) | 0;
           if (($7_1 | 0) == ((HEAP32[$0_1 >> 2] | 0) + (HEAP32[($0_1 + 4 | 0) >> 2] | 0) | 0 | 0)) {
            break block75
           }
           $0_1 = $7_1;
          }
          if (($0_1 | 0) == (-1 | 0)) {
           break block70
          }
          block76 : {
           if ($2_1 >>> 0 < ($3_1 + 48 | 0) >>> 0) {
            break block76
           }
           $7_1 = $0_1;
           break block74;
          }
          $4_1 = HEAP32[(0 + 69844 | 0) >> 2] | 0;
          $4_1 = (($6_1 - $2_1 | 0) + $4_1 | 0) & (0 - $4_1 | 0) | 0;
          if (($16($4_1 | 0) | 0 | 0) == (-1 | 0)) {
           break block70
          }
          $2_1 = $4_1 + $2_1 | 0;
          $7_1 = $0_1;
          break block74;
         }
         if (($7_1 | 0) != (-1 | 0)) {
          break block74
         }
        }
        HEAP32[(0 + 69808 | 0) >> 2] = HEAP32[(0 + 69808 | 0) >> 2] | 0 | 4 | 0;
       }
       $7_1 = $16($8_1 | 0) | 0;
       $0_1 = $16(0 | 0) | 0;
       if (($7_1 | 0) == (-1 | 0)) {
        break block77
       }
       if (($0_1 | 0) == (-1 | 0)) {
        break block77
       }
       if ($7_1 >>> 0 >= $0_1 >>> 0) {
        break block77
       }
       $2_1 = $0_1 - $7_1 | 0;
       if ($2_1 >>> 0 <= ($3_1 + 40 | 0) >>> 0) {
        break block77
       }
      }
      $0_1 = (HEAP32[(0 + 69796 | 0) >> 2] | 0) + $2_1 | 0;
      HEAP32[(0 + 69796 | 0) >> 2] = $0_1;
      block78 : {
       if ($0_1 >>> 0 <= (HEAP32[(0 + 69800 | 0) >> 2] | 0) >>> 0) {
        break block78
       }
       HEAP32[(0 + 69800 | 0) >> 2] = $0_1;
      }
      block84 : {
       block81 : {
        block80 : {
         block79 : {
          $4_1 = HEAP32[(0 + 69388 | 0) >> 2] | 0;
          if (!$4_1) {
           break block79
          }
          $0_1 = 69812;
          label7 : while (1) {
           $5_1 = HEAP32[$0_1 >> 2] | 0;
           $8_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
           if (($7_1 | 0) == ($5_1 + $8_1 | 0 | 0)) {
            break block80
           }
           $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
           if ($0_1) {
            continue label7
           }
           break block81;
          };
         }
         block83 : {
          block82 : {
           $0_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
           if (!$0_1) {
            break block82
           }
           if ($7_1 >>> 0 >= $0_1 >>> 0) {
            break block83
           }
          }
          HEAP32[(0 + 69380 | 0) >> 2] = $7_1;
         }
         $0_1 = 0;
         HEAP32[(0 + 69816 | 0) >> 2] = $2_1;
         HEAP32[(0 + 69812 | 0) >> 2] = $7_1;
         HEAP32[(0 + 69396 | 0) >> 2] = -1;
         HEAP32[(0 + 69400 | 0) >> 2] = HEAP32[(0 + 69836 | 0) >> 2] | 0;
         HEAP32[(0 + 69824 | 0) >> 2] = 0;
         label8 : while (1) {
          $4_1 = $0_1 << 3 | 0;
          $5_1 = $4_1 + 69404 | 0;
          HEAP32[($4_1 + 69412 | 0) >> 2] = $5_1;
          HEAP32[($4_1 + 69416 | 0) >> 2] = $5_1;
          $0_1 = $0_1 + 1 | 0;
          if (($0_1 | 0) != (32 | 0)) {
           continue label8
          }
          break label8;
         };
         $0_1 = $2_1 + -40 | 0;
         $4_1 = (-8 - $7_1 | 0) & 7 | 0;
         $5_1 = $0_1 - $4_1 | 0;
         HEAP32[(0 + 69376 | 0) >> 2] = $5_1;
         $4_1 = $7_1 + $4_1 | 0;
         HEAP32[(0 + 69388 | 0) >> 2] = $4_1;
         HEAP32[($4_1 + 4 | 0) >> 2] = $5_1 | 1 | 0;
         HEAP32[(($7_1 + $0_1 | 0) + 4 | 0) >> 2] = 40;
         HEAP32[(0 + 69392 | 0) >> 2] = HEAP32[(0 + 69852 | 0) >> 2] | 0;
         break block84;
        }
        if ($4_1 >>> 0 >= $7_1 >>> 0) {
         break block81
        }
        if ($4_1 >>> 0 < $5_1 >>> 0) {
         break block81
        }
        if ((HEAP32[($0_1 + 12 | 0) >> 2] | 0) & 8 | 0) {
         break block81
        }
        HEAP32[($0_1 + 4 | 0) >> 2] = $8_1 + $2_1 | 0;
        $0_1 = (-8 - $4_1 | 0) & 7 | 0;
        $5_1 = $4_1 + $0_1 | 0;
        HEAP32[(0 + 69388 | 0) >> 2] = $5_1;
        $7_1 = (HEAP32[(0 + 69376 | 0) >> 2] | 0) + $2_1 | 0;
        $0_1 = $7_1 - $0_1 | 0;
        HEAP32[(0 + 69376 | 0) >> 2] = $0_1;
        HEAP32[($5_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
        HEAP32[(($4_1 + $7_1 | 0) + 4 | 0) >> 2] = 40;
        HEAP32[(0 + 69392 | 0) >> 2] = HEAP32[(0 + 69852 | 0) >> 2] | 0;
        break block84;
       }
       block85 : {
        if ($7_1 >>> 0 >= (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
         break block85
        }
        HEAP32[(0 + 69380 | 0) >> 2] = $7_1;
       }
       $5_1 = $7_1 + $2_1 | 0;
       $0_1 = 69812;
       block87 : {
        block86 : {
         label9 : while (1) {
          $8_1 = HEAP32[$0_1 >> 2] | 0;
          if (($8_1 | 0) == ($5_1 | 0)) {
           break block86
          }
          $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
          if ($0_1) {
           continue label9
          }
          break block87;
         };
        }
        if (!((HEAPU8[($0_1 + 12 | 0) >> 0] | 0) & 8 | 0)) {
         break block88
        }
       }
       $0_1 = 69812;
       block90 : {
        label10 : while (1) {
         block89 : {
          $5_1 = HEAP32[$0_1 >> 2] | 0;
          if ($4_1 >>> 0 < $5_1 >>> 0) {
           break block89
          }
          $5_1 = $5_1 + (HEAP32[($0_1 + 4 | 0) >> 2] | 0) | 0;
          if ($4_1 >>> 0 < $5_1 >>> 0) {
           break block90
          }
         }
         $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
         continue label10;
        };
       }
       $0_1 = $2_1 + -40 | 0;
       $8_1 = (-8 - $7_1 | 0) & 7 | 0;
       $12_1 = $0_1 - $8_1 | 0;
       HEAP32[(0 + 69376 | 0) >> 2] = $12_1;
       $8_1 = $7_1 + $8_1 | 0;
       HEAP32[(0 + 69388 | 0) >> 2] = $8_1;
       HEAP32[($8_1 + 4 | 0) >> 2] = $12_1 | 1 | 0;
       HEAP32[(($7_1 + $0_1 | 0) + 4 | 0) >> 2] = 40;
       HEAP32[(0 + 69392 | 0) >> 2] = HEAP32[(0 + 69852 | 0) >> 2] | 0;
       $0_1 = ($5_1 + ((39 - $5_1 | 0) & 7 | 0) | 0) + -47 | 0;
       $8_1 = $0_1 >>> 0 < ($4_1 + 16 | 0) >>> 0 ? $4_1 : $0_1;
       HEAP32[($8_1 + 4 | 0) >> 2] = 27;
       i64toi32_i32$2 = 0;
       i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 69820 | 0) >> 2] | 0;
       i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 69824 | 0) >> 2] | 0;
       $1154 = i64toi32_i32$0;
       i64toi32_i32$0 = $8_1 + 16 | 0;
       HEAP32[i64toi32_i32$0 >> 2] = $1154;
       HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
       i64toi32_i32$2 = 0;
       i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 69812 | 0) >> 2] | 0;
       i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 69816 | 0) >> 2] | 0;
       $1156 = i64toi32_i32$1;
       i64toi32_i32$1 = $8_1;
       HEAP32[($8_1 + 8 | 0) >> 2] = $1156;
       HEAP32[($8_1 + 12 | 0) >> 2] = i64toi32_i32$0;
       HEAP32[(0 + 69820 | 0) >> 2] = $8_1 + 8 | 0;
       HEAP32[(0 + 69816 | 0) >> 2] = $2_1;
       HEAP32[(0 + 69812 | 0) >> 2] = $7_1;
       HEAP32[(0 + 69824 | 0) >> 2] = 0;
       $0_1 = $8_1 + 24 | 0;
       label11 : while (1) {
        HEAP32[($0_1 + 4 | 0) >> 2] = 7;
        $7_1 = $0_1 + 8 | 0;
        $0_1 = $0_1 + 4 | 0;
        if ($7_1 >>> 0 < $5_1 >>> 0) {
         continue label11
        }
        break label11;
       };
       if (($8_1 | 0) == ($4_1 | 0)) {
        break block84
       }
       HEAP32[($8_1 + 4 | 0) >> 2] = (HEAP32[($8_1 + 4 | 0) >> 2] | 0) & -2 | 0;
       $7_1 = $8_1 - $4_1 | 0;
       HEAP32[($4_1 + 4 | 0) >> 2] = $7_1 | 1 | 0;
       HEAP32[$8_1 >> 2] = $7_1;
       block94 : {
        block91 : {
         if ($7_1 >>> 0 > 255 >>> 0) {
          break block91
         }
         $0_1 = ($7_1 & -8 | 0) + 69404 | 0;
         block93 : {
          block92 : {
           $5_1 = HEAP32[(0 + 69364 | 0) >> 2] | 0;
           $7_1 = 1 << ($7_1 >>> 3 | 0) | 0;
           if ($5_1 & $7_1 | 0) {
            break block92
           }
           HEAP32[(0 + 69364 | 0) >> 2] = $5_1 | $7_1 | 0;
           $5_1 = $0_1;
           break block93;
          }
          $5_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
          if ($5_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
           break block4
          }
         }
         HEAP32[($0_1 + 8 | 0) >> 2] = $4_1;
         HEAP32[($5_1 + 12 | 0) >> 2] = $4_1;
         $7_1 = 12;
         $8_1 = 8;
         break block94;
        }
        $0_1 = 31;
        block95 : {
         if ($7_1 >>> 0 > 16777215 >>> 0) {
          break block95
         }
         $0_1 = Math_clz32($7_1 >>> 8 | 0);
         $0_1 = ((($7_1 >>> (38 - $0_1 | 0) | 0) & 1 | 0) - ($0_1 << 1 | 0) | 0) + 62 | 0;
        }
        HEAP32[($4_1 + 28 | 0) >> 2] = $0_1;
        i64toi32_i32$1 = $4_1;
        i64toi32_i32$0 = 0;
        HEAP32[($4_1 + 16 | 0) >> 2] = 0;
        HEAP32[($4_1 + 20 | 0) >> 2] = i64toi32_i32$0;
        $5_1 = ($0_1 << 2 | 0) + 69668 | 0;
        block98 : {
         block97 : {
          block96 : {
           $8_1 = HEAP32[(0 + 69368 | 0) >> 2] | 0;
           $2_1 = 1 << $0_1 | 0;
           if ($8_1 & $2_1 | 0) {
            break block96
           }
           HEAP32[(0 + 69368 | 0) >> 2] = $8_1 | $2_1 | 0;
           HEAP32[$5_1 >> 2] = $4_1;
           HEAP32[($4_1 + 24 | 0) >> 2] = $5_1;
           break block97;
          }
          $0_1 = $7_1 << (($0_1 | 0) == (31 | 0) ? 0 : 25 - ($0_1 >>> 1 | 0) | 0) | 0;
          $8_1 = HEAP32[$5_1 >> 2] | 0;
          label12 : while (1) {
           $5_1 = $8_1;
           if (((HEAP32[($5_1 + 4 | 0) >> 2] | 0) & -8 | 0 | 0) == ($7_1 | 0)) {
            break block98
           }
           $8_1 = $0_1 >>> 29 | 0;
           $0_1 = $0_1 << 1 | 0;
           $2_1 = $5_1 + ($8_1 & 4 | 0) | 0;
           $8_1 = HEAP32[($2_1 + 16 | 0) >> 2] | 0;
           if ($8_1) {
            continue label12
           }
           break label12;
          };
          $0_1 = $2_1 + 16 | 0;
          if ($0_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
           break block4
          }
          HEAP32[$0_1 >> 2] = $4_1;
          HEAP32[($4_1 + 24 | 0) >> 2] = $5_1;
         }
         $7_1 = 8;
         $8_1 = 12;
         $5_1 = $4_1;
         $0_1 = $5_1;
         break block94;
        }
        $7_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
        if ($5_1 >>> 0 < $7_1 >>> 0) {
         break block4
        }
        $0_1 = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
        if ($0_1 >>> 0 < $7_1 >>> 0) {
         break block4
        }
        HEAP32[($0_1 + 12 | 0) >> 2] = $4_1;
        HEAP32[($5_1 + 8 | 0) >> 2] = $4_1;
        HEAP32[($4_1 + 8 | 0) >> 2] = $0_1;
        $0_1 = 0;
        $7_1 = 24;
        $8_1 = 12;
       }
       HEAP32[($4_1 + $8_1 | 0) >> 2] = $5_1;
       HEAP32[($4_1 + $7_1 | 0) >> 2] = $0_1;
      }
      $0_1 = HEAP32[(0 + 69376 | 0) >> 2] | 0;
      if ($0_1 >>> 0 <= $3_1 >>> 0) {
       break block77
      }
      $4_1 = $0_1 - $3_1 | 0;
      HEAP32[(0 + 69376 | 0) >> 2] = $4_1;
      $0_1 = HEAP32[(0 + 69388 | 0) >> 2] | 0;
      $5_1 = $0_1 + $3_1 | 0;
      HEAP32[(0 + 69388 | 0) >> 2] = $5_1;
      HEAP32[($5_1 + 4 | 0) >> 2] = $4_1 | 1 | 0;
      HEAP32[($0_1 + 4 | 0) >> 2] = $3_1 | 3 | 0;
      $0_1 = $0_1 + 8 | 0;
      break block5;
     }
     HEAP32[($15() | 0) >> 2] = 48;
     $0_1 = 0;
     break block5;
    }
    $17();
    wasm2js_trap();
   }
   HEAP32[$0_1 >> 2] = $7_1;
   HEAP32[($0_1 + 4 | 0) >> 2] = (HEAP32[($0_1 + 4 | 0) >> 2] | 0) + $2_1 | 0;
   $0_1 = $63($7_1 | 0, $8_1 | 0, $3_1 | 0) | 0;
  }
  global$0 = $1_1 + 16 | 0;
  return $0_1 | 0;
 }
 
 function $63($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $4_1 = 0, $5_1 = 0, $8_1 = 0, $6_1 = 0, $9_1 = 0, $7_1 = 0, $3_1 = 0, $353 = 0;
  $3_1 = $0_1 + ((-8 - $0_1 | 0) & 7 | 0) | 0;
  HEAP32[($3_1 + 4 | 0) >> 2] = $2_1 | 3 | 0;
  $4_1 = $1_1 + ((-8 - $1_1 | 0) & 7 | 0) | 0;
  $5_1 = $3_1 + $2_1 | 0;
  $0_1 = $4_1 - $5_1 | 0;
  block6 : {
   block1 : {
    block : {
     if (($4_1 | 0) != (HEAP32[(0 + 69388 | 0) >> 2] | 0 | 0)) {
      break block
     }
     HEAP32[(0 + 69388 | 0) >> 2] = $5_1;
     $2_1 = (HEAP32[(0 + 69376 | 0) >> 2] | 0) + $0_1 | 0;
     HEAP32[(0 + 69376 | 0) >> 2] = $2_1;
     HEAP32[($5_1 + 4 | 0) >> 2] = $2_1 | 1 | 0;
     break block1;
    }
    block2 : {
     if (($4_1 | 0) != (HEAP32[(0 + 69384 | 0) >> 2] | 0 | 0)) {
      break block2
     }
     HEAP32[(0 + 69384 | 0) >> 2] = $5_1;
     $2_1 = (HEAP32[(0 + 69372 | 0) >> 2] | 0) + $0_1 | 0;
     HEAP32[(0 + 69372 | 0) >> 2] = $2_1;
     HEAP32[($5_1 + 4 | 0) >> 2] = $2_1 | 1 | 0;
     HEAP32[($5_1 + $2_1 | 0) >> 2] = $2_1;
     break block1;
    }
    block3 : {
     $6_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
     if (($6_1 & 3 | 0 | 0) != (1 | 0)) {
      break block3
     }
     $2_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
     block8 : {
      block4 : {
       if ($6_1 >>> 0 > 255 >>> 0) {
        break block4
       }
       block5 : {
        $1_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
        $7_1 = $6_1 >>> 3 | 0;
        $8_1 = ($7_1 << 3 | 0) + 69404 | 0;
        if (($1_1 | 0) == ($8_1 | 0)) {
         break block5
        }
        if ($1_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
         break block6
        }
        if ((HEAP32[($1_1 + 12 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
         break block6
        }
       }
       block7 : {
        if (($2_1 | 0) != ($1_1 | 0)) {
         break block7
        }
        HEAP32[(0 + 69364 | 0) >> 2] = (HEAP32[(0 + 69364 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $7_1 | 0) | 0) | 0;
        break block8;
       }
       block9 : {
        if (($2_1 | 0) == ($8_1 | 0)) {
         break block9
        }
        if ($2_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
         break block6
        }
        if ((HEAP32[($2_1 + 8 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
         break block6
        }
       }
       HEAP32[($1_1 + 12 | 0) >> 2] = $2_1;
       HEAP32[($2_1 + 8 | 0) >> 2] = $1_1;
       break block8;
      }
      $9_1 = HEAP32[($4_1 + 24 | 0) >> 2] | 0;
      block11 : {
       block10 : {
        if (($2_1 | 0) == ($4_1 | 0)) {
         break block10
        }
        $1_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
        if ($1_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
         break block6
        }
        if ((HEAP32[($1_1 + 12 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
         break block6
        }
        if ((HEAP32[($2_1 + 8 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
         break block6
        }
        HEAP32[($1_1 + 12 | 0) >> 2] = $2_1;
        HEAP32[($2_1 + 8 | 0) >> 2] = $1_1;
        break block11;
       }
       block14 : {
        block13 : {
         block12 : {
          $1_1 = HEAP32[($4_1 + 20 | 0) >> 2] | 0;
          if (!$1_1) {
           break block12
          }
          $8_1 = $4_1 + 20 | 0;
          break block13;
         }
         $1_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
         if (!$1_1) {
          break block14
         }
         $8_1 = $4_1 + 16 | 0;
        }
        label : while (1) {
         $7_1 = $8_1;
         $2_1 = $1_1;
         $8_1 = $2_1 + 20 | 0;
         $1_1 = HEAP32[($2_1 + 20 | 0) >> 2] | 0;
         if ($1_1) {
          continue label
         }
         $8_1 = $2_1 + 16 | 0;
         $1_1 = HEAP32[($2_1 + 16 | 0) >> 2] | 0;
         if ($1_1) {
          continue label
         }
         break label;
        };
        if ($7_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
         break block6
        }
        HEAP32[$7_1 >> 2] = 0;
        break block11;
       }
       $2_1 = 0;
      }
      if (!$9_1) {
       break block8
      }
      block16 : {
       block15 : {
        $8_1 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
        $1_1 = ($8_1 << 2 | 0) + 69668 | 0;
        if (($4_1 | 0) != (HEAP32[$1_1 >> 2] | 0 | 0)) {
         break block15
        }
        HEAP32[$1_1 >> 2] = $2_1;
        if ($2_1) {
         break block16
        }
        HEAP32[(0 + 69368 | 0) >> 2] = (HEAP32[(0 + 69368 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $8_1 | 0) | 0) | 0;
        break block8;
       }
       if ($9_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
        break block6
       }
       block18 : {
        block17 : {
         if ((HEAP32[($9_1 + 16 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block17
         }
         HEAP32[($9_1 + 16 | 0) >> 2] = $2_1;
         break block18;
        }
        HEAP32[($9_1 + 20 | 0) >> 2] = $2_1;
       }
       if (!$2_1) {
        break block8
       }
      }
      $8_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
      if ($2_1 >>> 0 < $8_1 >>> 0) {
       break block6
      }
      HEAP32[($2_1 + 24 | 0) >> 2] = $9_1;
      block19 : {
       $1_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
       if (!$1_1) {
        break block19
       }
       if ($1_1 >>> 0 < $8_1 >>> 0) {
        break block6
       }
       HEAP32[($2_1 + 16 | 0) >> 2] = $1_1;
       HEAP32[($1_1 + 24 | 0) >> 2] = $2_1;
      }
      $1_1 = HEAP32[($4_1 + 20 | 0) >> 2] | 0;
      if (!$1_1) {
       break block8
      }
      if ($1_1 >>> 0 < $8_1 >>> 0) {
       break block6
      }
      HEAP32[($2_1 + 20 | 0) >> 2] = $1_1;
      HEAP32[($1_1 + 24 | 0) >> 2] = $2_1;
     }
     $2_1 = $6_1 & -8 | 0;
     $0_1 = $2_1 + $0_1 | 0;
     $4_1 = $4_1 + $2_1 | 0;
     $6_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
    }
    HEAP32[($4_1 + 4 | 0) >> 2] = $6_1 & -2 | 0;
    HEAP32[($5_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
    HEAP32[($5_1 + $0_1 | 0) >> 2] = $0_1;
    block20 : {
     if ($0_1 >>> 0 > 255 >>> 0) {
      break block20
     }
     $2_1 = ($0_1 & -8 | 0) + 69404 | 0;
     block22 : {
      block21 : {
       $1_1 = HEAP32[(0 + 69364 | 0) >> 2] | 0;
       $0_1 = 1 << ($0_1 >>> 3 | 0) | 0;
       if ($1_1 & $0_1 | 0) {
        break block21
       }
       HEAP32[(0 + 69364 | 0) >> 2] = $1_1 | $0_1 | 0;
       $0_1 = $2_1;
       break block22;
      }
      $0_1 = HEAP32[($2_1 + 8 | 0) >> 2] | 0;
      if ($0_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
       break block6
      }
     }
     HEAP32[($2_1 + 8 | 0) >> 2] = $5_1;
     HEAP32[($0_1 + 12 | 0) >> 2] = $5_1;
     HEAP32[($5_1 + 12 | 0) >> 2] = $2_1;
     HEAP32[($5_1 + 8 | 0) >> 2] = $0_1;
     break block1;
    }
    $2_1 = 31;
    block23 : {
     if ($0_1 >>> 0 > 16777215 >>> 0) {
      break block23
     }
     $2_1 = Math_clz32($0_1 >>> 8 | 0);
     $2_1 = ((($0_1 >>> (38 - $2_1 | 0) | 0) & 1 | 0) - ($2_1 << 1 | 0) | 0) + 62 | 0;
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = $2_1;
    HEAP32[($5_1 + 16 | 0) >> 2] = 0;
    HEAP32[($5_1 + 20 | 0) >> 2] = 0;
    $1_1 = ($2_1 << 2 | 0) + 69668 | 0;
    block26 : {
     block25 : {
      block24 : {
       $8_1 = HEAP32[(0 + 69368 | 0) >> 2] | 0;
       $4_1 = 1 << $2_1 | 0;
       if ($8_1 & $4_1 | 0) {
        break block24
       }
       HEAP32[(0 + 69368 | 0) >> 2] = $8_1 | $4_1 | 0;
       HEAP32[$1_1 >> 2] = $5_1;
       HEAP32[($5_1 + 24 | 0) >> 2] = $1_1;
       break block25;
      }
      $2_1 = $0_1 << (($2_1 | 0) == (31 | 0) ? 0 : 25 - ($2_1 >>> 1 | 0) | 0) | 0;
      $8_1 = HEAP32[$1_1 >> 2] | 0;
      label1 : while (1) {
       $1_1 = $8_1;
       if (((HEAP32[($1_1 + 4 | 0) >> 2] | 0) & -8 | 0 | 0) == ($0_1 | 0)) {
        break block26
       }
       $8_1 = $2_1 >>> 29 | 0;
       $2_1 = $2_1 << 1 | 0;
       $4_1 = $1_1 + ($8_1 & 4 | 0) | 0;
       $8_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
       if ($8_1) {
        continue label1
       }
       break label1;
      };
      $2_1 = $4_1 + 16 | 0;
      if ($2_1 >>> 0 < (HEAP32[(0 + 69380 | 0) >> 2] | 0) >>> 0) {
       break block6
      }
      HEAP32[$2_1 >> 2] = $5_1;
      HEAP32[($5_1 + 24 | 0) >> 2] = $1_1;
     }
     HEAP32[($5_1 + 12 | 0) >> 2] = $5_1;
     HEAP32[($5_1 + 8 | 0) >> 2] = $5_1;
     break block1;
    }
    $0_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
    if ($1_1 >>> 0 < $0_1 >>> 0) {
     break block6
    }
    $2_1 = HEAP32[($1_1 + 8 | 0) >> 2] | 0;
    if ($2_1 >>> 0 < $0_1 >>> 0) {
     break block6
    }
    HEAP32[($2_1 + 12 | 0) >> 2] = $5_1;
    HEAP32[($1_1 + 8 | 0) >> 2] = $5_1;
    HEAP32[($5_1 + 24 | 0) >> 2] = 0;
    HEAP32[($5_1 + 12 | 0) >> 2] = $1_1;
    HEAP32[($5_1 + 8 | 0) >> 2] = $2_1;
   }
   return $3_1 + 8 | 0 | 0;
  }
  $17();
  wasm2js_trap();
 }
 
 function $64($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $5_1 = 0, $1_1 = 0, $6_1 = 0, $4_1 = 0, $2_1 = 0, $7_1 = 0, $8_1 = 0, $10_1 = 0, $9_1 = 0;
  block1 : {
   block : {
    if (!$0_1) {
     break block
    }
    $1_1 = $0_1 + -8 | 0;
    $2_1 = HEAP32[(0 + 69380 | 0) >> 2] | 0;
    if ($1_1 >>> 0 < $2_1 >>> 0) {
     break block1
    }
    $3_1 = HEAP32[($0_1 + -4 | 0) >> 2] | 0;
    if (($3_1 & 3 | 0 | 0) == (1 | 0)) {
     break block1
    }
    $0_1 = $3_1 & -8 | 0;
    $4_1 = $1_1 + $0_1 | 0;
    block2 : {
     if ($3_1 & 1 | 0) {
      break block2
     }
     if (!($3_1 & 2 | 0)) {
      break block
     }
     $5_1 = HEAP32[$1_1 >> 2] | 0;
     $1_1 = $1_1 - $5_1 | 0;
     if ($1_1 >>> 0 < $2_1 >>> 0) {
      break block1
     }
     $0_1 = $5_1 + $0_1 | 0;
     block3 : {
      if (($1_1 | 0) == (HEAP32[(0 + 69384 | 0) >> 2] | 0 | 0)) {
       break block3
      }
      $3_1 = HEAP32[($1_1 + 12 | 0) >> 2] | 0;
      block4 : {
       if ($5_1 >>> 0 > 255 >>> 0) {
        break block4
       }
       block5 : {
        $6_1 = HEAP32[($1_1 + 8 | 0) >> 2] | 0;
        $7_1 = $5_1 >>> 3 | 0;
        $5_1 = ($7_1 << 3 | 0) + 69404 | 0;
        if (($6_1 | 0) == ($5_1 | 0)) {
         break block5
        }
        if ($6_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        if ((HEAP32[($6_1 + 12 | 0) >> 2] | 0 | 0) != ($1_1 | 0)) {
         break block1
        }
       }
       block6 : {
        if (($3_1 | 0) != ($6_1 | 0)) {
         break block6
        }
        HEAP32[(0 + 69364 | 0) >> 2] = (HEAP32[(0 + 69364 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $7_1 | 0) | 0) | 0;
        break block2;
       }
       block7 : {
        if (($3_1 | 0) == ($5_1 | 0)) {
         break block7
        }
        if ($3_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        if ((HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) != ($1_1 | 0)) {
         break block1
        }
       }
       HEAP32[($6_1 + 12 | 0) >> 2] = $3_1;
       HEAP32[($3_1 + 8 | 0) >> 2] = $6_1;
       break block2;
      }
      $8_1 = HEAP32[($1_1 + 24 | 0) >> 2] | 0;
      block9 : {
       block8 : {
        if (($3_1 | 0) == ($1_1 | 0)) {
         break block8
        }
        $5_1 = HEAP32[($1_1 + 8 | 0) >> 2] | 0;
        if ($5_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        if ((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != ($1_1 | 0)) {
         break block1
        }
        if ((HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) != ($1_1 | 0)) {
         break block1
        }
        HEAP32[($5_1 + 12 | 0) >> 2] = $3_1;
        HEAP32[($3_1 + 8 | 0) >> 2] = $5_1;
        break block9;
       }
       block12 : {
        block11 : {
         block10 : {
          $5_1 = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
          if (!$5_1) {
           break block10
          }
          $6_1 = $1_1 + 20 | 0;
          break block11;
         }
         $5_1 = HEAP32[($1_1 + 16 | 0) >> 2] | 0;
         if (!$5_1) {
          break block12
         }
         $6_1 = $1_1 + 16 | 0;
        }
        label : while (1) {
         $7_1 = $6_1;
         $3_1 = $5_1;
         $6_1 = $3_1 + 20 | 0;
         $5_1 = HEAP32[($3_1 + 20 | 0) >> 2] | 0;
         if ($5_1) {
          continue label
         }
         $6_1 = $3_1 + 16 | 0;
         $5_1 = HEAP32[($3_1 + 16 | 0) >> 2] | 0;
         if ($5_1) {
          continue label
         }
         break label;
        };
        if ($7_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        HEAP32[$7_1 >> 2] = 0;
        break block9;
       }
       $3_1 = 0;
      }
      if (!$8_1) {
       break block2
      }
      block14 : {
       block13 : {
        $6_1 = HEAP32[($1_1 + 28 | 0) >> 2] | 0;
        $5_1 = ($6_1 << 2 | 0) + 69668 | 0;
        if (($1_1 | 0) != (HEAP32[$5_1 >> 2] | 0 | 0)) {
         break block13
        }
        HEAP32[$5_1 >> 2] = $3_1;
        if ($3_1) {
         break block14
        }
        HEAP32[(0 + 69368 | 0) >> 2] = (HEAP32[(0 + 69368 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $6_1 | 0) | 0) | 0;
        break block2;
       }
       if ($8_1 >>> 0 < $2_1 >>> 0) {
        break block1
       }
       block16 : {
        block15 : {
         if ((HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0) != ($1_1 | 0)) {
          break block15
         }
         HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
         break block16;
        }
        HEAP32[($8_1 + 20 | 0) >> 2] = $3_1;
       }
       if (!$3_1) {
        break block2
       }
      }
      if ($3_1 >>> 0 < $2_1 >>> 0) {
       break block1
      }
      HEAP32[($3_1 + 24 | 0) >> 2] = $8_1;
      block17 : {
       $5_1 = HEAP32[($1_1 + 16 | 0) >> 2] | 0;
       if (!$5_1) {
        break block17
       }
       if ($5_1 >>> 0 < $2_1 >>> 0) {
        break block1
       }
       HEAP32[($3_1 + 16 | 0) >> 2] = $5_1;
       HEAP32[($5_1 + 24 | 0) >> 2] = $3_1;
      }
      $5_1 = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
      if (!$5_1) {
       break block2
      }
      if ($5_1 >>> 0 < $2_1 >>> 0) {
       break block1
      }
      HEAP32[($3_1 + 20 | 0) >> 2] = $5_1;
      HEAP32[($5_1 + 24 | 0) >> 2] = $3_1;
      break block2;
     }
     $3_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
     if (($3_1 & 3 | 0 | 0) != (3 | 0)) {
      break block2
     }
     HEAP32[(0 + 69372 | 0) >> 2] = $0_1;
     HEAP32[($4_1 + 4 | 0) >> 2] = $3_1 & -2 | 0;
     HEAP32[($1_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
     HEAP32[$4_1 >> 2] = $0_1;
     return;
    }
    if ($1_1 >>> 0 >= $4_1 >>> 0) {
     break block1
    }
    $7_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
    if (!($7_1 & 1 | 0)) {
     break block1
    }
    block36 : {
     block18 : {
      if ($7_1 & 2 | 0) {
       break block18
      }
      block19 : {
       if (($4_1 | 0) != (HEAP32[(0 + 69388 | 0) >> 2] | 0 | 0)) {
        break block19
       }
       HEAP32[(0 + 69388 | 0) >> 2] = $1_1;
       $0_1 = (HEAP32[(0 + 69376 | 0) >> 2] | 0) + $0_1 | 0;
       HEAP32[(0 + 69376 | 0) >> 2] = $0_1;
       HEAP32[($1_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
       if (($1_1 | 0) != (HEAP32[(0 + 69384 | 0) >> 2] | 0 | 0)) {
        break block
       }
       HEAP32[(0 + 69372 | 0) >> 2] = 0;
       HEAP32[(0 + 69384 | 0) >> 2] = 0;
       return;
      }
      block20 : {
       $9_1 = HEAP32[(0 + 69384 | 0) >> 2] | 0;
       if (($4_1 | 0) != ($9_1 | 0)) {
        break block20
       }
       HEAP32[(0 + 69384 | 0) >> 2] = $1_1;
       $0_1 = (HEAP32[(0 + 69372 | 0) >> 2] | 0) + $0_1 | 0;
       HEAP32[(0 + 69372 | 0) >> 2] = $0_1;
       HEAP32[($1_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
       HEAP32[($1_1 + $0_1 | 0) >> 2] = $0_1;
       return;
      }
      $3_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
      block24 : {
       block21 : {
        if ($7_1 >>> 0 > 255 >>> 0) {
         break block21
        }
        block22 : {
         $5_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
         $8_1 = $7_1 >>> 3 | 0;
         $6_1 = ($8_1 << 3 | 0) + 69404 | 0;
         if (($5_1 | 0) == ($6_1 | 0)) {
          break block22
         }
         if ($5_1 >>> 0 < $2_1 >>> 0) {
          break block1
         }
         if ((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block1
         }
        }
        block23 : {
         if (($3_1 | 0) != ($5_1 | 0)) {
          break block23
         }
         HEAP32[(0 + 69364 | 0) >> 2] = (HEAP32[(0 + 69364 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $8_1 | 0) | 0) | 0;
         break block24;
        }
        block25 : {
         if (($3_1 | 0) == ($6_1 | 0)) {
          break block25
         }
         if ($3_1 >>> 0 < $2_1 >>> 0) {
          break block1
         }
         if ((HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block1
         }
        }
        HEAP32[($5_1 + 12 | 0) >> 2] = $3_1;
        HEAP32[($3_1 + 8 | 0) >> 2] = $5_1;
        break block24;
       }
       $10_1 = HEAP32[($4_1 + 24 | 0) >> 2] | 0;
       block27 : {
        block26 : {
         if (($3_1 | 0) == ($4_1 | 0)) {
          break block26
         }
         $5_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
         if ($5_1 >>> 0 < $2_1 >>> 0) {
          break block1
         }
         if ((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block1
         }
         if ((HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
          break block1
         }
         HEAP32[($5_1 + 12 | 0) >> 2] = $3_1;
         HEAP32[($3_1 + 8 | 0) >> 2] = $5_1;
         break block27;
        }
        block30 : {
         block29 : {
          block28 : {
           $5_1 = HEAP32[($4_1 + 20 | 0) >> 2] | 0;
           if (!$5_1) {
            break block28
           }
           $6_1 = $4_1 + 20 | 0;
           break block29;
          }
          $5_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
          if (!$5_1) {
           break block30
          }
          $6_1 = $4_1 + 16 | 0;
         }
         label1 : while (1) {
          $8_1 = $6_1;
          $3_1 = $5_1;
          $6_1 = $3_1 + 20 | 0;
          $5_1 = HEAP32[($3_1 + 20 | 0) >> 2] | 0;
          if ($5_1) {
           continue label1
          }
          $6_1 = $3_1 + 16 | 0;
          $5_1 = HEAP32[($3_1 + 16 | 0) >> 2] | 0;
          if ($5_1) {
           continue label1
          }
          break label1;
         };
         if ($8_1 >>> 0 < $2_1 >>> 0) {
          break block1
         }
         HEAP32[$8_1 >> 2] = 0;
         break block27;
        }
        $3_1 = 0;
       }
       if (!$10_1) {
        break block24
       }
       block32 : {
        block31 : {
         $6_1 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
         $5_1 = ($6_1 << 2 | 0) + 69668 | 0;
         if (($4_1 | 0) != (HEAP32[$5_1 >> 2] | 0 | 0)) {
          break block31
         }
         HEAP32[$5_1 >> 2] = $3_1;
         if ($3_1) {
          break block32
         }
         HEAP32[(0 + 69368 | 0) >> 2] = (HEAP32[(0 + 69368 | 0) >> 2] | 0) & (__wasm_rotl_i32(-2 | 0, $6_1 | 0) | 0) | 0;
         break block24;
        }
        if ($10_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        block34 : {
         block33 : {
          if ((HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0) != ($4_1 | 0)) {
           break block33
          }
          HEAP32[($10_1 + 16 | 0) >> 2] = $3_1;
          break block34;
         }
         HEAP32[($10_1 + 20 | 0) >> 2] = $3_1;
        }
        if (!$3_1) {
         break block24
        }
       }
       if ($3_1 >>> 0 < $2_1 >>> 0) {
        break block1
       }
       HEAP32[($3_1 + 24 | 0) >> 2] = $10_1;
       block35 : {
        $5_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
        if (!$5_1) {
         break block35
        }
        if ($5_1 >>> 0 < $2_1 >>> 0) {
         break block1
        }
        HEAP32[($3_1 + 16 | 0) >> 2] = $5_1;
        HEAP32[($5_1 + 24 | 0) >> 2] = $3_1;
       }
       $5_1 = HEAP32[($4_1 + 20 | 0) >> 2] | 0;
       if (!$5_1) {
        break block24
       }
       if ($5_1 >>> 0 < $2_1 >>> 0) {
        break block1
       }
       HEAP32[($3_1 + 20 | 0) >> 2] = $5_1;
       HEAP32[($5_1 + 24 | 0) >> 2] = $3_1;
      }
      $0_1 = ($7_1 & -8 | 0) + $0_1 | 0;
      HEAP32[($1_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
      HEAP32[($1_1 + $0_1 | 0) >> 2] = $0_1;
      if (($1_1 | 0) != ($9_1 | 0)) {
       break block36
      }
      HEAP32[(0 + 69372 | 0) >> 2] = $0_1;
      return;
     }
     HEAP32[($4_1 + 4 | 0) >> 2] = $7_1 & -2 | 0;
     HEAP32[($1_1 + 4 | 0) >> 2] = $0_1 | 1 | 0;
     HEAP32[($1_1 + $0_1 | 0) >> 2] = $0_1;
    }
    block37 : {
     if ($0_1 >>> 0 > 255 >>> 0) {
      break block37
     }
     $3_1 = ($0_1 & -8 | 0) + 69404 | 0;
     block39 : {
      block38 : {
       $5_1 = HEAP32[(0 + 69364 | 0) >> 2] | 0;
       $0_1 = 1 << ($0_1 >>> 3 | 0) | 0;
       if ($5_1 & $0_1 | 0) {
        break block38
       }
       HEAP32[(0 + 69364 | 0) >> 2] = $5_1 | $0_1 | 0;
       $0_1 = $3_1;
       break block39;
      }
      $0_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
      if ($0_1 >>> 0 < $2_1 >>> 0) {
       break block1
      }
     }
     HEAP32[($3_1 + 8 | 0) >> 2] = $1_1;
     HEAP32[($0_1 + 12 | 0) >> 2] = $1_1;
     HEAP32[($1_1 + 12 | 0) >> 2] = $3_1;
     HEAP32[($1_1 + 8 | 0) >> 2] = $0_1;
     return;
    }
    $3_1 = 31;
    block40 : {
     if ($0_1 >>> 0 > 16777215 >>> 0) {
      break block40
     }
     $3_1 = Math_clz32($0_1 >>> 8 | 0);
     $3_1 = ((($0_1 >>> (38 - $3_1 | 0) | 0) & 1 | 0) - ($3_1 << 1 | 0) | 0) + 62 | 0;
    }
    HEAP32[($1_1 + 28 | 0) >> 2] = $3_1;
    HEAP32[($1_1 + 16 | 0) >> 2] = 0;
    HEAP32[($1_1 + 20 | 0) >> 2] = 0;
    $6_1 = ($3_1 << 2 | 0) + 69668 | 0;
    block44 : {
     block43 : {
      block42 : {
       block41 : {
        $5_1 = HEAP32[(0 + 69368 | 0) >> 2] | 0;
        $4_1 = 1 << $3_1 | 0;
        if ($5_1 & $4_1 | 0) {
         break block41
        }
        HEAP32[(0 + 69368 | 0) >> 2] = $5_1 | $4_1 | 0;
        HEAP32[$6_1 >> 2] = $1_1;
        $0_1 = 8;
        $3_1 = 24;
        break block42;
       }
       $3_1 = $0_1 << (($3_1 | 0) == (31 | 0) ? 0 : 25 - ($3_1 >>> 1 | 0) | 0) | 0;
       $6_1 = HEAP32[$6_1 >> 2] | 0;
       label2 : while (1) {
        $5_1 = $6_1;
        if (((HEAP32[($5_1 + 4 | 0) >> 2] | 0) & -8 | 0 | 0) == ($0_1 | 0)) {
         break block43
        }
        $6_1 = $3_1 >>> 29 | 0;
        $3_1 = $3_1 << 1 | 0;
        $4_1 = $5_1 + ($6_1 & 4 | 0) | 0;
        $6_1 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
        if ($6_1) {
         continue label2
        }
        break label2;
       };
       $0_1 = $4_1 + 16 | 0;
       if ($0_1 >>> 0 < $2_1 >>> 0) {
        break block1
       }
       HEAP32[$0_1 >> 2] = $1_1;
       $0_1 = 8;
       $3_1 = 24;
       $6_1 = $5_1;
      }
      $5_1 = $1_1;
      $4_1 = $5_1;
      break block44;
     }
     if ($5_1 >>> 0 < $2_1 >>> 0) {
      break block1
     }
     $6_1 = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
     if ($6_1 >>> 0 < $2_1 >>> 0) {
      break block1
     }
     HEAP32[($6_1 + 12 | 0) >> 2] = $1_1;
     HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
     $4_1 = 0;
     $0_1 = 24;
     $3_1 = 8;
    }
    HEAP32[($1_1 + $3_1 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 12 | 0) >> 2] = $5_1;
    HEAP32[($1_1 + $0_1 | 0) >> 2] = $4_1;
    $1_1 = (HEAP32[(0 + 69396 | 0) >> 2] | 0) + -1 | 0;
    HEAP32[(0 + 69396 | 0) >> 2] = $1_1 ? $1_1 : -1;
   }
   return;
  }
  $17();
  wasm2js_trap();
 }
 
 function $65($0_1) {
  $0_1 = $0_1 | 0;
  block : {
   $0_1 = $66($0_1 | 0) | 0;
   if ($0_1) {
    break block
   }
   $67();
  }
  return $0_1 | 0;
 }
 
 function $66($0_1) {
  $0_1 = $0_1 | 0;
  var $2_1 = 0, $1_1 = 0;
  $1_1 = $0_1 >>> 0 > 1 >>> 0 ? $0_1 : 1;
  block : {
   label : while (1) {
    $2_1 = $62($1_1 | 0) | 0;
    if ($2_1) {
     break block
    }
    $0_1 = $86() | 0;
    if (!$0_1) {
     break block
    }
    FUNCTION_TABLE[$0_1 | 0]();
    continue label;
   };
  }
  return $2_1 | 0;
 }
 
 function $67() {
  $70();
  wasm2js_trap();
 }
 
 function $68($0_1) {
  $0_1 = $0_1 | 0;
  $64($0_1 | 0);
 }
 
 function $69($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $68($0_1 | 0);
 }
 
 function $70() {
  $17();
  wasm2js_trap();
 }
 
 function $71($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0, $2_1 = 0, $3_1 = 0;
  $1_1 = $0_1;
  block2 : {
   block : {
    if (!($1_1 & 3 | 0)) {
     break block
    }
    block1 : {
     if (HEAPU8[$1_1 >> 0] | 0) {
      break block1
     }
     return $1_1 - $1_1 | 0 | 0;
    }
    $1_1 = $0_1;
    label : while (1) {
     $1_1 = $1_1 + 1 | 0;
     if (!($1_1 & 3 | 0)) {
      break block
     }
     if (HEAPU8[$1_1 >> 0] | 0) {
      continue label
     }
     break block2;
    };
   }
   label1 : while (1) {
    $2_1 = $1_1;
    $1_1 = $1_1 + 4 | 0;
    $3_1 = HEAP32[$2_1 >> 2] | 0;
    if (((16843008 - $3_1 | 0 | $3_1 | 0) & -2139062144 | 0 | 0) == (-2139062144 | 0)) {
     continue label1
    }
    break label1;
   };
   label2 : while (1) {
    $1_1 = $2_1;
    $2_1 = $1_1 + 1 | 0;
    if (HEAPU8[$1_1 >> 0] | 0) {
     continue label2
    }
    break label2;
   };
  }
  return $1_1 - $0_1 | 0 | 0;
 }
 
 function $72($0_1) {
  $0_1 = $0_1 | 0;
  HEAP32[$0_1 >> 2] = 66524 + 8 | 0;
  return $0_1 | 0;
 }
 
 function $73($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $2_1 = 0, $3_1 = 0;
  $2_1 = $71($1_1 | 0) | 0;
  $3_1 = $65($2_1 + 13 | 0 | 0) | 0;
  HEAP32[($3_1 + 8 | 0) >> 2] = 0;
  HEAP32[($3_1 + 4 | 0) >> 2] = $2_1;
  HEAP32[$3_1 >> 2] = $2_1;
  $3_1 = $74($3_1 | 0) | 0;
  block : {
   $2_1 = $2_1 + 1 | 0;
   if (!$2_1) {
    break block
   }
   wasm2js_memory_copy($3_1, $1_1, $2_1);
  }
  HEAP32[$0_1 >> 2] = $3_1;
  return $0_1 | 0;
 }
 
 function $74($0_1) {
  $0_1 = $0_1 | 0;
  return $0_1 + 12 | 0 | 0;
 }
 
 function $75($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $0_1 = $72($0_1 | 0) | 0;
  HEAP32[$0_1 >> 2] = 66636 + 8 | 0;
  $73($0_1 + 4 | 0 | 0, $1_1 | 0) | 0;
  return $0_1 | 0;
 }
 
 function $76($0_1) {
  $0_1 = $0_1 | 0;
  return 1 | 0;
 }
 
 function $77($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $3_1 = 0, $2_1 = 0, $4_1 = 0;
  $2_1 = global$0 - 16 | 0;
  global$0 = $2_1;
  HEAP8[($2_1 + 15 | 0) >> 0] = $1_1;
  block2 : {
   block : {
    $3_1 = HEAP32[($0_1 + 16 | 0) >> 2] | 0;
    if ($3_1) {
     break block
    }
    block1 : {
     if (!($33($0_1 | 0) | 0)) {
      break block1
     }
     $3_1 = -1;
     break block2;
    }
    $3_1 = HEAP32[($0_1 + 16 | 0) >> 2] | 0;
   }
   block3 : {
    $4_1 = HEAP32[($0_1 + 20 | 0) >> 2] | 0;
    if (($4_1 | 0) == ($3_1 | 0)) {
     break block3
    }
    $3_1 = $1_1 & 255 | 0;
    if ((HEAP32[($0_1 + 80 | 0) >> 2] | 0 | 0) == ($3_1 | 0)) {
     break block3
    }
    HEAP32[($0_1 + 20 | 0) >> 2] = $4_1 + 1 | 0;
    HEAP8[$4_1 >> 0] = $1_1;
    break block2;
   }
   block4 : {
    if ((FUNCTION_TABLE[HEAP32[($0_1 + 36 | 0) >> 2] | 0 | 0]($0_1, $2_1 + 15 | 0, 1) | 0 | 0) == (1 | 0)) {
     break block4
    }
    $3_1 = -1;
    break block2;
   }
   $3_1 = HEAPU8[($2_1 + 15 | 0) >> 0] | 0;
  }
  global$0 = $2_1 + 16 | 0;
  return $3_1 | 0;
 }
 
 function $78($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  return $79($0_1 | 0, $1_1 | 0) | 0 | 0;
 }
 
 function $79($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $2_1 = 0, $3_1 = 0;
  block1 : {
   block : {
    $2_1 = HEAP32[($1_1 + 76 | 0) >> 2] | 0;
    if (($2_1 | 0) < (0 | 0)) {
     break block
    }
    if (!$2_1) {
     break block1
    }
    if (($2_1 & 1073741823 | 0 | 0) != (HEAP32[(($38() | 0) + 24 | 0) >> 2] | 0 | 0)) {
     break block1
    }
   }
   block2 : {
    $2_1 = $0_1 & 255 | 0;
    if (($2_1 | 0) == (HEAP32[($1_1 + 80 | 0) >> 2] | 0 | 0)) {
     break block2
    }
    $3_1 = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
    if (($3_1 | 0) == (HEAP32[($1_1 + 16 | 0) >> 2] | 0 | 0)) {
     break block2
    }
    HEAP32[($1_1 + 20 | 0) >> 2] = $3_1 + 1 | 0;
    HEAP8[$3_1 >> 0] = $0_1;
    return $2_1 | 0;
   }
   return $77($1_1 | 0, $2_1 | 0) | 0 | 0;
  }
  return $80($0_1 | 0, $1_1 | 0) | 0 | 0;
 }
 
 function $80($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $3_1 = 0, $2_1 = 0, $4_1 = 0;
  block : {
   $2_1 = $1_1 + 76 | 0;
   if (!($81($2_1 | 0) | 0)) {
    break block
   }
   $26($1_1 | 0) | 0;
  }
  block2 : {
   block1 : {
    $3_1 = $0_1 & 255 | 0;
    if (($3_1 | 0) == (HEAP32[($1_1 + 80 | 0) >> 2] | 0 | 0)) {
     break block1
    }
    $4_1 = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
    if (($4_1 | 0) == (HEAP32[($1_1 + 16 | 0) >> 2] | 0 | 0)) {
     break block1
    }
    HEAP32[($1_1 + 20 | 0) >> 2] = $4_1 + 1 | 0;
    HEAP8[$4_1 >> 0] = $0_1;
    break block2;
   }
   $3_1 = $77($1_1 | 0, $3_1 | 0) | 0;
  }
  block3 : {
   if (!(($82($2_1 | 0) | 0) & 1073741824 | 0)) {
    break block3
   }
   $83($2_1 | 0);
  }
  return $3_1 | 0;
 }
 
 function $81($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = HEAP32[$0_1 >> 2] | 0;
  HEAP32[$0_1 >> 2] = $1_1 ? $1_1 : 1073741823;
  return $1_1 | 0;
 }
 
 function $82($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = HEAP32[$0_1 >> 2] | 0;
  HEAP32[$0_1 >> 2] = 0;
  return $1_1 | 0;
 }
 
 function $83($0_1) {
  $0_1 = $0_1 | 0;
  $28($0_1 | 0, 1 | 0) | 0;
 }
 
 function $84($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $3_1 = 0, $2_1 = 0;
  $2_1 = global$0 - 16 | 0;
  global$0 = $2_1;
  $3_1 = HEAP32[(0 + 65772 | 0) >> 2] | 0;
  $47(65758 | 0, 11 | 0, 1 | 0, $3_1 | 0) | 0;
  HEAP32[($2_1 + 12 | 0) >> 2] = $1_1;
  $58($3_1 | 0, $0_1 | 0, $1_1 | 0) | 0;
  $78(10 | 0, $3_1 | 0) | 0;
  $17();
  wasm2js_trap();
 }
 
 function $85($0_1) {
  $0_1 = $0_1 | 0;
  return HEAP32[$0_1 >> 2] | 0 | 0;
 }
 
 function $86() {
  return $85(69860 | 0) | 0 | 0;
 }
 
 function $87($0_1) {
  $0_1 = $0_1 | 0;
  return ($62($0_1 + 80 | 0 | 0) | 0) + 80 | 0 | 0;
 }
 
 function $88($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $3_1 = 0, $2_1 = 0;
  $2_1 = HEAPU8[$1_1 >> 0] | 0;
  block : {
   $3_1 = HEAPU8[$0_1 >> 0] | 0;
   if (!$3_1) {
    break block
   }
   if (($3_1 | 0) != ($2_1 & 255 | 0 | 0)) {
    break block
   }
   label : while (1) {
    $2_1 = HEAPU8[($1_1 + 1 | 0) >> 0] | 0;
    $3_1 = HEAPU8[($0_1 + 1 | 0) >> 0] | 0;
    if (!$3_1) {
     break block
    }
    $1_1 = $1_1 + 1 | 0;
    $0_1 = $0_1 + 1 | 0;
    if (($3_1 | 0) == ($2_1 & 255 | 0 | 0)) {
     continue label
    }
    break label;
   };
  }
  return $3_1 - ($2_1 & 255 | 0) | 0 | 0;
 }
 
 function $89($0_1) {
  $0_1 = $0_1 | 0;
  return $128($0_1 | 0) | 0 | 0;
 }
 
 function $90($0_1) {
  $0_1 = $0_1 | 0;
 }
 
 function $91($0_1) {
  $0_1 = $0_1 | 0;
 }
 
 function $92($0_1) {
  $0_1 = $0_1 | 0;
  $69($89($0_1 | 0) | 0 | 0, 8 | 0);
 }
 
 function $93($0_1) {
  $0_1 = $0_1 | 0;
  $69($89($0_1 | 0) | 0 | 0, 12 | 0);
 }
 
 function $94($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  block : {
   if ($2_1) {
    break block
   }
   return (HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 0) == (HEAP32[($1_1 + 4 | 0) >> 2] | 0 | 0) | 0;
  }
  block1 : {
   if (($0_1 | 0) != ($1_1 | 0)) {
    break block1
   }
   return 1 | 0;
  }
  return !($88($95($0_1 | 0) | 0 | 0, $95($1_1 | 0) | 0 | 0) | 0) | 0;
 }
 
 function $95($0_1) {
  $0_1 = $0_1 | 0;
  return HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 0;
 }
 
 function $96($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4_1 = 0, $54_1 = 0;
  $3_1 = global$0 - 80 | 0;
  global$0 = $3_1;
  $4_1 = 1;
  block1 : {
   block : {
    if ($94($0_1 | 0, $1_1 | 0, 0 | 0) | 0) {
     break block
    }
    $4_1 = 0;
    if (!$1_1) {
     break block
    }
    $4_1 = 0;
    $1_1 = $97($1_1 | 0, 66256 | 0, 66304 | 0, 0 | 0) | 0;
    if (!$1_1) {
     break block
    }
    $4_1 = HEAP32[$2_1 >> 2] | 0;
    if (!$4_1) {
     break block1
    }
    block2 : {
     if (!56) {
      break block2
     }
     wasm2js_memory_fill($3_1 + 24 | 0, 0, 56);
    }
    HEAP8[($3_1 + 75 | 0) >> 0] = 1;
    HEAP32[($3_1 + 32 | 0) >> 2] = -1;
    HEAP32[($3_1 + 28 | 0) >> 2] = $0_1;
    HEAP32[($3_1 + 20 | 0) >> 2] = $1_1;
    HEAP32[($3_1 + 68 | 0) >> 2] = 1;
    FUNCTION_TABLE[HEAP32[((HEAP32[$1_1 >> 2] | 0) + 28 | 0) >> 2] | 0 | 0]($1_1, $3_1 + 20 | 0, $4_1, 1);
    block3 : {
     $4_1 = HEAP32[($3_1 + 44 | 0) >> 2] | 0;
     if (($4_1 | 0) != (1 | 0)) {
      break block3
     }
     HEAP32[$2_1 >> 2] = HEAP32[($3_1 + 36 | 0) >> 2] | 0;
    }
    $4_1 = ($4_1 | 0) == (1 | 0);
   }
   global$0 = $3_1 + 80 | 0;
   return $4_1 | 0;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = 65713;
  HEAP32[($3_1 + 4 | 0) >> 2] = 485;
  HEAP32[$3_1 >> 2] = 65582;
  $84(65565 | 0, $3_1 | 0);
  wasm2js_trap();
 }
 
 function $97($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $4_1 = 0, $6_1 = 0, $5_1 = 0, $7_1 = 0;
  $4_1 = global$0 - 16 | 0;
  global$0 = $4_1;
  $98($4_1 + 4 | 0 | 0, $0_1 | 0);
  $5_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  $6_1 = $94($5_1 | 0, $2_1 | 0, 0 | 0) | 0;
  $7_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
  block1 : {
   block : {
    if (!$6_1) {
     break block
    }
    $6_1 = $99($0_1 | 0, $7_1 | 0, $1_1 | 0, $2_1 | 0, HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, $3_1 | 0) | 0;
    break block1;
   }
   $6_1 = $100($0_1 | 0, $7_1 | 0, $2_1 | 0, $5_1 | 0, $3_1 | 0) | 0;
   if ($6_1) {
    break block1
   }
   $6_1 = $101($0_1 | 0, $7_1 | 0, $1_1 | 0, $2_1 | 0, $5_1 | 0, $3_1 | 0) | 0;
  }
  global$0 = $4_1 + 16 | 0;
  return $6_1 | 0;
 }
 
 function $98($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $2_1 = 0, $3_1 = 0;
  $2_1 = HEAP32[$1_1 >> 2] | 0;
  $3_1 = HEAP32[($2_1 + -8 | 0) >> 2] | 0;
  HEAP32[($0_1 + 8 | 0) >> 2] = $3_1;
  HEAP32[$0_1 >> 2] = $1_1 + $3_1 | 0;
  HEAP32[($0_1 + 4 | 0) >> 2] = HEAP32[($2_1 + -4 | 0) >> 2] | 0;
 }
 
 function $99($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $6_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $7_1 = 0;
  $6_1 = global$0 - 64 | 0;
  global$0 = $6_1;
  $7_1 = 0;
  block1 : {
   block : {
    if (($5_1 | 0) < (0 | 0)) {
     break block
    }
    $7_1 = ($4_1 | 0) == (0 - $5_1 | 0 | 0) ? $1_1 : 0;
    break block1;
   }
   if (($5_1 | 0) == (-2 | 0)) {
    break block1
   }
   $7_1 = $6_1 + 28 | 0;
   i64toi32_i32$1 = $7_1;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $6_1 + 36 | 0;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $6_1 + 44 | 0;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $6_1;
   i64toi32_i32$0 = 0;
   HEAP32[($6_1 + 20 | 0) >> 2] = 0;
   HEAP32[($6_1 + 24 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[($6_1 + 16 | 0) >> 2] = $5_1;
   HEAP32[($6_1 + 12 | 0) >> 2] = $2_1;
   HEAP32[($6_1 + 8 | 0) >> 2] = $0_1;
   HEAP32[($6_1 + 4 | 0) >> 2] = $3_1;
   HEAP32[($6_1 + 60 | 0) >> 2] = 0;
   i64toi32_i32$1 = $6_1;
   i64toi32_i32$0 = 16777216;
   HEAP32[($6_1 + 52 | 0) >> 2] = 1;
   HEAP32[($6_1 + 56 | 0) >> 2] = i64toi32_i32$0;
   FUNCTION_TABLE[HEAP32[((HEAP32[$3_1 >> 2] | 0) + 20 | 0) >> 2] | 0 | 0]($3_1, $6_1 + 4 | 0, $1_1, $1_1, 1, 0);
   $7_1 = (HEAP32[$7_1 >> 2] | 0 | 0) == (1 | 0) ? $1_1 : 0;
  }
  global$0 = $6_1 + 64 | 0;
  return $7_1 | 0;
 }
 
 function $100($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $5_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $6_1 = 0;
  $5_1 = global$0 - 64 | 0;
  global$0 = $5_1;
  $6_1 = 0;
  block : {
   if (($4_1 | 0) < (0 | 0)) {
    break block
   }
   $0_1 = $0_1 - $4_1 | 0;
   if (($0_1 | 0) < ($1_1 | 0)) {
    break block
   }
   $6_1 = $5_1 + 28 | 0;
   i64toi32_i32$1 = $6_1;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $5_1 + 36 | 0;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $5_1 + 44 | 0;
   i64toi32_i32$0 = 0;
   HEAP32[i64toi32_i32$1 >> 2] = 0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $5_1;
   i64toi32_i32$0 = 0;
   HEAP32[($5_1 + 20 | 0) >> 2] = 0;
   HEAP32[($5_1 + 24 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[($5_1 + 16 | 0) >> 2] = $4_1;
   HEAP32[($5_1 + 12 | 0) >> 2] = $2_1;
   HEAP32[($5_1 + 4 | 0) >> 2] = $3_1;
   HEAP32[($5_1 + 60 | 0) >> 2] = 0;
   i64toi32_i32$1 = $5_1;
   i64toi32_i32$0 = 16777216;
   HEAP32[($5_1 + 52 | 0) >> 2] = 1;
   HEAP32[($5_1 + 56 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[($5_1 + 8 | 0) >> 2] = $0_1;
   FUNCTION_TABLE[HEAP32[((HEAP32[$3_1 >> 2] | 0) + 20 | 0) >> 2] | 0 | 0]($3_1, $5_1 + 4 | 0, $1_1, $1_1, 1, 0);
   $6_1 = HEAP32[$6_1 >> 2] | 0 ? $0_1 : 0;
  }
  global$0 = $5_1 + 64 | 0;
  return $6_1 | 0;
 }
 
 function $101($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $6_1 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0, wasm2js_i32$2 = 0, wasm2js_i32$3 = 0, wasm2js_i32$4 = 0, wasm2js_i32$5 = 0, wasm2js_i32$6 = 0, wasm2js_i32$7 = 0, wasm2js_i32$8 = 0;
  $6_1 = global$0 - 64 | 0;
  global$0 = $6_1;
  HEAP32[($6_1 + 16 | 0) >> 2] = $5_1;
  HEAP32[($6_1 + 12 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 8 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 4 | 0) >> 2] = $3_1;
  $5_1 = 0;
  block : {
   if (!39) {
    break block
   }
   wasm2js_memory_fill($6_1 + 20 | 0, 0, 39);
  }
  HEAP32[($6_1 + 60 | 0) >> 2] = 0;
  HEAP8[($6_1 + 59 | 0) >> 0] = 1;
  FUNCTION_TABLE[HEAP32[((HEAP32[$4_1 >> 2] | 0) + 24 | 0) >> 2] | 0 | 0]($4_1, $6_1 + 4 | 0, $1_1, 1, 0);
  block3 : {
   block2 : {
    switch (HEAP32[($6_1 + 40 | 0) >> 2] | 0 | 0) {
    case 0:
     $5_1 = (wasm2js_i32$0 = (wasm2js_i32$3 = (wasm2js_i32$6 = HEAP32[($6_1 + 24 | 0) >> 2] | 0, wasm2js_i32$7 = 0, wasm2js_i32$8 = (HEAP32[($6_1 + 36 | 0) >> 2] | 0 | 0) == (1 | 0), wasm2js_i32$8 ? wasm2js_i32$6 : wasm2js_i32$7), wasm2js_i32$4 = 0, wasm2js_i32$5 = (HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0) == (1 | 0), wasm2js_i32$5 ? wasm2js_i32$3 : wasm2js_i32$4), wasm2js_i32$1 = 0, wasm2js_i32$2 = (HEAP32[($6_1 + 44 | 0) >> 2] | 0 | 0) == (1 | 0), wasm2js_i32$2 ? wasm2js_i32$0 : wasm2js_i32$1);
     break block3;
    case 1:
     break block2;
    default:
     break block3;
    };
   }
   block4 : {
    if ((HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) == (1 | 0)) {
     break block4
    }
    if (HEAP32[($6_1 + 44 | 0) >> 2] | 0) {
     break block3
    }
    if ((HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0) != (1 | 0)) {
     break block3
    }
    if ((HEAP32[($6_1 + 36 | 0) >> 2] | 0 | 0) != (1 | 0)) {
     break block3
    }
   }
   $5_1 = HEAP32[($6_1 + 20 | 0) >> 2] | 0;
  }
  global$0 = $6_1 + 64 | 0;
  return $5_1 | 0;
 }
 
 function $102($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $4_1 = 0;
  block : {
   $4_1 = HEAP32[($1_1 + 36 | 0) >> 2] | 0;
   if ($4_1) {
    break block
   }
   HEAP32[($1_1 + 24 | 0) >> 2] = $3_1;
   HEAP32[($1_1 + 16 | 0) >> 2] = $2_1;
   HEAP32[($1_1 + 36 | 0) >> 2] = 1;
   HEAP32[($1_1 + 20 | 0) >> 2] = HEAP32[($1_1 + 56 | 0) >> 2] | 0;
   return;
  }
  block2 : {
   block1 : {
    if ((HEAP32[($1_1 + 20 | 0) >> 2] | 0 | 0) != (HEAP32[($1_1 + 56 | 0) >> 2] | 0 | 0)) {
     break block1
    }
    if ((HEAP32[($1_1 + 16 | 0) >> 2] | 0 | 0) != ($2_1 | 0)) {
     break block1
    }
    if ((HEAP32[($1_1 + 24 | 0) >> 2] | 0 | 0) != (2 | 0)) {
     break block2
    }
    HEAP32[($1_1 + 24 | 0) >> 2] = $3_1;
    return;
   }
   HEAP8[($1_1 + 54 | 0) >> 0] = 1;
   HEAP32[($1_1 + 24 | 0) >> 2] = 2;
   HEAP32[($1_1 + 36 | 0) >> 2] = $4_1 + 1 | 0;
  }
 }
 
 function $103($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, 0 | 0) | 0)) {
    break block
   }
   $102($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0);
  }
 }
 
 function $104($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, 0 | 0) | 0)) {
    break block
   }
   $102($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0);
   return;
  }
  $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
  FUNCTION_TABLE[HEAP32[((HEAP32[$0_1 >> 2] | 0) + 28 | 0) >> 2] | 0 | 0]($0_1, $1_1, $2_1, $3_1);
 }
 
 function $105($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  HEAP8[($1_1 + 53 | 0) >> 0] = 1;
  block : {
   if (($3_1 | 0) != (HEAP32[($1_1 + 4 | 0) >> 2] | 0 | 0)) {
    break block
   }
   HEAP8[($1_1 + 52 | 0) >> 0] = 1;
   block2 : {
    block1 : {
     $3_1 = HEAP32[($1_1 + 16 | 0) >> 2] | 0;
     if ($3_1) {
      break block1
     }
     HEAP32[($1_1 + 36 | 0) >> 2] = 1;
     HEAP32[($1_1 + 24 | 0) >> 2] = $4_1;
     HEAP32[($1_1 + 16 | 0) >> 2] = $2_1;
     if (($4_1 | 0) != (1 | 0)) {
      break block
     }
     if ((HEAP32[($1_1 + 48 | 0) >> 2] | 0 | 0) == (1 | 0)) {
      break block2
     }
     break block;
    }
    block3 : {
     if (($3_1 | 0) != ($2_1 | 0)) {
      break block3
     }
     block4 : {
      $3_1 = HEAP32[($1_1 + 24 | 0) >> 2] | 0;
      if (($3_1 | 0) != (2 | 0)) {
       break block4
      }
      HEAP32[($1_1 + 24 | 0) >> 2] = $4_1;
      $3_1 = $4_1;
     }
     if ((HEAP32[($1_1 + 48 | 0) >> 2] | 0 | 0) != (1 | 0)) {
      break block
     }
     if (($3_1 | 0) == (1 | 0)) {
      break block2
     }
     break block;
    }
    HEAP32[($1_1 + 36 | 0) >> 2] = (HEAP32[($1_1 + 36 | 0) >> 2] | 0) + 1 | 0;
   }
   HEAP8[($1_1 + 54 | 0) >> 0] = 1;
  }
 }
 
 function $106($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  block : {
   if (($2_1 | 0) != (HEAP32[($1_1 + 4 | 0) >> 2] | 0 | 0)) {
    break block
   }
   if ((HEAP32[($1_1 + 28 | 0) >> 2] | 0 | 0) == (1 | 0)) {
    break block
   }
   HEAP32[($1_1 + 28 | 0) >> 2] = $3_1;
  }
 }
 
 function $107($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, $4_1 | 0) | 0)) {
    break block
   }
   $106($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0);
   return;
  }
  block4 : {
   block1 : {
    if (!($94($0_1 | 0, HEAP32[$1_1 >> 2] | 0 | 0, $4_1 | 0) | 0)) {
     break block1
    }
    block3 : {
     block2 : {
      if (($2_1 | 0) == (HEAP32[($1_1 + 16 | 0) >> 2] | 0 | 0)) {
       break block2
      }
      if (($2_1 | 0) != (HEAP32[($1_1 + 20 | 0) >> 2] | 0 | 0)) {
       break block3
      }
     }
     if (($3_1 | 0) != (1 | 0)) {
      break block4
     }
     HEAP32[($1_1 + 32 | 0) >> 2] = 1;
     return;
    }
    HEAP32[($1_1 + 32 | 0) >> 2] = $3_1;
    block5 : {
     if ((HEAP32[($1_1 + 44 | 0) >> 2] | 0 | 0) == (4 | 0)) {
      break block5
     }
     HEAP16[($1_1 + 52 | 0) >> 1] = 0;
     $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
     FUNCTION_TABLE[HEAP32[((HEAP32[$0_1 >> 2] | 0) + 20 | 0) >> 2] | 0 | 0]($0_1, $1_1, $2_1, $2_1, 1, $4_1);
     block6 : {
      if ((HEAPU8[($1_1 + 53 | 0) >> 0] | 0 | 0) != (1 | 0)) {
       break block6
      }
      HEAP32[($1_1 + 44 | 0) >> 2] = 3;
      if (!(HEAPU8[($1_1 + 52 | 0) >> 0] | 0)) {
       break block5
      }
      break block4;
     }
     HEAP32[($1_1 + 44 | 0) >> 2] = 4;
    }
    HEAP32[($1_1 + 20 | 0) >> 2] = $2_1;
    HEAP32[($1_1 + 40 | 0) >> 2] = (HEAP32[($1_1 + 40 | 0) >> 2] | 0) + 1 | 0;
    if ((HEAP32[($1_1 + 36 | 0) >> 2] | 0 | 0) != (1 | 0)) {
     break block4
    }
    if ((HEAP32[($1_1 + 24 | 0) >> 2] | 0 | 0) != (2 | 0)) {
     break block4
    }
    HEAP8[($1_1 + 54 | 0) >> 0] = 1;
    return;
   }
   $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
   FUNCTION_TABLE[HEAP32[((HEAP32[$0_1 >> 2] | 0) + 24 | 0) >> 2] | 0 | 0]($0_1, $1_1, $2_1, $3_1, $4_1);
  }
 }
 
 function $108($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, $4_1 | 0) | 0)) {
    break block
   }
   $106($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0);
   return;
  }
  block1 : {
   if (!($94($0_1 | 0, HEAP32[$1_1 >> 2] | 0 | 0, $4_1 | 0) | 0)) {
    break block1
   }
   block3 : {
    block2 : {
     if (($2_1 | 0) == (HEAP32[($1_1 + 16 | 0) >> 2] | 0 | 0)) {
      break block2
     }
     if (($2_1 | 0) != (HEAP32[($1_1 + 20 | 0) >> 2] | 0 | 0)) {
      break block3
     }
    }
    if (($3_1 | 0) != (1 | 0)) {
     break block1
    }
    HEAP32[($1_1 + 32 | 0) >> 2] = 1;
    return;
   }
   HEAP32[($1_1 + 20 | 0) >> 2] = $2_1;
   HEAP32[($1_1 + 32 | 0) >> 2] = $3_1;
   HEAP32[($1_1 + 40 | 0) >> 2] = (HEAP32[($1_1 + 40 | 0) >> 2] | 0) + 1 | 0;
   block4 : {
    if ((HEAP32[($1_1 + 36 | 0) >> 2] | 0 | 0) != (1 | 0)) {
     break block4
    }
    if ((HEAP32[($1_1 + 24 | 0) >> 2] | 0 | 0) != (2 | 0)) {
     break block4
    }
    HEAP8[($1_1 + 54 | 0) >> 0] = 1;
   }
   HEAP32[($1_1 + 44 | 0) >> 2] = 4;
  }
 }
 
 function $109($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, $5_1 | 0) | 0)) {
    break block
   }
   $105($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0, $4_1 | 0);
   return;
  }
  $0_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
  FUNCTION_TABLE[HEAP32[((HEAP32[$0_1 >> 2] | 0) + 20 | 0) >> 2] | 0 | 0]($0_1, $1_1, $2_1, $3_1, $4_1, $5_1);
 }
 
 function $110($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  block : {
   if (!($94($0_1 | 0, HEAP32[($1_1 + 8 | 0) >> 2] | 0 | 0, $5_1 | 0) | 0)) {
    break block
   }
   $105($1_1 | 0, $1_1 | 0, $2_1 | 0, $3_1 | 0, $4_1 | 0);
  }
 }
 
 function $111($0_1) {
  $0_1 = $0_1 | 0;
  return $0_1 | 0;
 }
 
 function $112($0_1) {
  $0_1 = $0_1 | 0;
  $111($0_1 | 0) | 0;
  $69($0_1 | 0, 4 | 0);
 }
 
 function $113($0_1) {
  $0_1 = $0_1 | 0;
  return 65646 | 0;
 }
 
 function $114($0_1) {
  $0_1 = $0_1 | 0;
  $0_1 = $72($0_1 | 0) | 0;
  HEAP32[$0_1 >> 2] = 66484 + 8 | 0;
  return $0_1 | 0;
 }
 
 function $115($0_1) {
  $0_1 = $0_1 | 0;
  $111($0_1 | 0) | 0;
  $69($0_1 | 0, 4 | 0);
 }
 
 function $116($0_1) {
  $0_1 = $0_1 | 0;
  return 65690 | 0;
 }
 
 function $117($0_1) {
  $0_1 = $0_1 | 0;
  $0_1 = $114($0_1 | 0) | 0;
  HEAP32[$0_1 >> 2] = 66504 + 8 | 0;
  return $0_1 | 0;
 }
 
 function $118($0_1) {
  $0_1 = $0_1 | 0;
  $111($0_1 | 0) | 0;
  $69($0_1 | 0, 4 | 0);
 }
 
 function $119($0_1) {
  $0_1 = $0_1 | 0;
  return 65665 | 0;
 }
 
 function $120($0_1) {
  $0_1 = $0_1 | 0;
  HEAP32[$0_1 >> 2] = 66636 + 8 | 0;
  $121($0_1 + 4 | 0 | 0) | 0;
  return $111($0_1 | 0) | 0 | 0;
 }
 
 function $121($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  block : {
   if (!($76($0_1 | 0) | 0)) {
    break block
   }
   $1_1 = $122(HEAP32[$0_1 >> 2] | 0 | 0) | 0;
   if (($123($1_1 + 8 | 0 | 0) | 0 | 0) > (-1 | 0)) {
    break block
   }
   $68($1_1 | 0);
  }
  return $0_1 | 0;
 }
 
 function $122($0_1) {
  $0_1 = $0_1 | 0;
  return $0_1 + -12 | 0 | 0;
 }
 
 function $123($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = (HEAP32[$0_1 >> 2] | 0) + -1 | 0;
  HEAP32[$0_1 >> 2] = $1_1;
  return $1_1 | 0;
 }
 
 function $124($0_1) {
  $0_1 = $0_1 | 0;
  $120($0_1 | 0) | 0;
  $69($0_1 | 0, 8 | 0);
 }
 
 function $125($0_1) {
  $0_1 = $0_1 | 0;
  return $126($0_1 + 4 | 0 | 0) | 0 | 0;
 }
 
 function $126($0_1) {
  $0_1 = $0_1 | 0;
  return HEAP32[$0_1 >> 2] | 0 | 0;
 }
 
 function $127($0_1) {
  $0_1 = $0_1 | 0;
  $120($0_1 | 0) | 0;
  $69($0_1 | 0, 8 | 0);
 }
 
 function $128($0_1) {
  $0_1 = $0_1 | 0;
  return $0_1 | 0;
 }
 
 function $129($0_1) {
  $0_1 = $0_1 | 0;
  global$1 = $0_1;
 }
 
 function $131($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0, i64toi32_i32$1 = 0, $2_1 = 0, i64toi32_i32$0 = 0, $3_1 = 0;
  block : {
   if ($0_1) {
    break block
   }
   $1_1 = 0;
   block1 : {
    if (!(HEAP32[(0 + 69172 | 0) >> 2] | 0)) {
     break block1
    }
    $1_1 = $131(HEAP32[(0 + 69172 | 0) >> 2] | 0 | 0) | 0;
   }
   block2 : {
    if (!(HEAP32[(0 + 69136 | 0) >> 2] | 0)) {
     break block2
    }
    $1_1 = $131(HEAP32[(0 + 69136 | 0) >> 2] | 0 | 0) | 0 | $1_1 | 0;
   }
   block3 : {
    $0_1 = HEAP32[($31() | 0) >> 2] | 0;
    if (!$0_1) {
     break block3
    }
    label : while (1) {
     block5 : {
      block4 : {
       if ((HEAP32[($0_1 + 76 | 0) >> 2] | 0 | 0) >= (0 | 0)) {
        break block4
       }
       $2_1 = 1;
       break block5;
      }
      $2_1 = !($26($0_1 | 0) | 0);
     }
     block6 : {
      if ((HEAP32[($0_1 + 20 | 0) >> 2] | 0 | 0) == (HEAP32[($0_1 + 28 | 0) >> 2] | 0 | 0)) {
       break block6
      }
      $1_1 = $131($0_1 | 0) | 0 | $1_1 | 0;
     }
     block7 : {
      if ($2_1) {
       break block7
      }
      $27($0_1 | 0);
     }
     $0_1 = HEAP32[($0_1 + 56 | 0) >> 2] | 0;
     if ($0_1) {
      continue label
     }
     break label;
    };
   }
   $32();
   return $1_1 | 0;
  }
  block9 : {
   block8 : {
    if ((HEAP32[($0_1 + 76 | 0) >> 2] | 0 | 0) >= (0 | 0)) {
     break block8
    }
    $2_1 = 1;
    break block9;
   }
   $2_1 = !($26($0_1 | 0) | 0);
  }
  block12 : {
   block11 : {
    block10 : {
     if ((HEAP32[($0_1 + 20 | 0) >> 2] | 0 | 0) == (HEAP32[($0_1 + 28 | 0) >> 2] | 0 | 0)) {
      break block10
     }
     FUNCTION_TABLE[HEAP32[($0_1 + 36 | 0) >> 2] | 0 | 0]($0_1, 0, 0) | 0;
     if (HEAP32[($0_1 + 20 | 0) >> 2] | 0) {
      break block10
     }
     $1_1 = -1;
     if (!$2_1) {
      break block11
     }
     break block12;
    }
    block13 : {
     $1_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
     $3_1 = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
     if (($1_1 | 0) == ($3_1 | 0)) {
      break block13
     }
     i64toi32_i32$1 = $1_1 - $3_1 | 0;
     i64toi32_i32$0 = i64toi32_i32$1 >> 31 | 0;
     i64toi32_i32$0 = FUNCTION_TABLE[HEAP32[($0_1 + 40 | 0) >> 2] | 0 | 0]($0_1, i64toi32_i32$1, i64toi32_i32$0, 1) | 0;
     i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    }
    $1_1 = 0;
    HEAP32[($0_1 + 28 | 0) >> 2] = 0;
    i64toi32_i32$0 = $0_1;
    i64toi32_i32$1 = 0;
    HEAP32[($0_1 + 16 | 0) >> 2] = 0;
    HEAP32[($0_1 + 20 | 0) >> 2] = i64toi32_i32$1;
    i64toi32_i32$0 = $0_1;
    i64toi32_i32$1 = 0;
    HEAP32[($0_1 + 4 | 0) >> 2] = 0;
    HEAP32[($0_1 + 8 | 0) >> 2] = i64toi32_i32$1;
    if ($2_1) {
     break block12
    }
   }
   $27($0_1 | 0);
  }
  return $1_1 | 0;
 }
 
 function $132() {
  global$3 = 65536;
  global$2 = (0 + 15 | 0) & -16 | 0;
 }
 
 function $133() {
  return global$0 - global$2 | 0 | 0;
 }
 
 function $134() {
  return global$3 | 0;
 }
 
 function $135() {
  return global$2 | 0;
 }
 
 function $136($0_1) {
  $0_1 = $0_1 | 0;
  global$0 = $0_1;
 }
 
 function $137($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = (global$0 - $0_1 | 0) & -16 | 0;
  global$0 = $1_1;
  return $1_1 | 0;
 }
 
 function $138() {
  return global$0 | 0;
 }
 
 function $139($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  return (HEAPU16[((($0_1 >>> 0 > 153 >>> 0 ? 0 : $0_1) << 1 | 0) + 68672 | 0) >> 1] | 0) + 66757 | 0 | 0;
 }
 
 function $140($0_1) {
  $0_1 = $0_1 | 0;
  return $139($0_1 | 0, $0_1 | 0) | 0 | 0;
 }
 
 function $141($0_1, $1_1, $2_1, $2$hi, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $2$hi = $2$hi | 0;
  $3_1 = $3_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  i64toi32_i32$0 = $2$hi;
  i64toi32_i32$0 = FUNCTION_TABLE[$0_1 | 0]($1_1, $2_1, i64toi32_i32$0, $3_1) | 0;
  i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$0 | 0;
 }
 
 function $142($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var i64toi32_i32$2 = 0, i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0, $17_1 = 0, $18_1 = 0, $6_1 = 0, $7_1 = 0, $9_1 = 0, $9$hi = 0, $12$hi = 0, $5_1 = 0, $5$hi = 0;
  $6_1 = $0_1;
  $7_1 = $1_1;
  i64toi32_i32$0 = 0;
  $9_1 = $2_1;
  $9$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  i64toi32_i32$2 = $3_1;
  i64toi32_i32$1 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   $17_1 = 0;
  } else {
   i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
   $17_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
  }
  $12$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$0 = $9_1;
  i64toi32_i32$2 = $12$hi;
  i64toi32_i32$3 = $17_1;
  i64toi32_i32$2 = i64toi32_i32$1 | i64toi32_i32$2 | 0;
  i64toi32_i32$2 = $141($6_1 | 0, $7_1 | 0, i64toi32_i32$0 | i64toi32_i32$3 | 0 | 0, i64toi32_i32$2 | 0, $4_1 | 0) | 0;
  i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
  $5_1 = i64toi32_i32$2;
  $5$hi = i64toi32_i32$0;
  i64toi32_i32$1 = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $18_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $18_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
  }
  $129($18_1 | 0);
  i64toi32_i32$2 = $5$hi;
  return $5_1 | 0;
 }
 
 function $143($0_1, $1_1, $1$hi, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0, $12_1 = 0, $4_1 = 0, $6_1 = 0, i64toi32_i32$2 = 0;
  $4_1 = $0_1;
  i64toi32_i32$0 = $1$hi;
  $6_1 = $1_1;
  i64toi32_i32$2 = $1_1;
  i64toi32_i32$1 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = 0;
   $12_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $12_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
  }
  return fimport$5($4_1 | 0, $6_1 | 0, $12_1 | 0, $2_1 | 0, $3_1 | 0) | 0 | 0;
 }
 
 function _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, var$2 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, var$3 = 0, var$4 = 0, var$5 = 0, $21_1 = 0, $22_1 = 0, var$6 = 0, $24_1 = 0, $17_1 = 0, $18_1 = 0, $23_1 = 0, $29_1 = 0, $45_1 = 0, $56$hi = 0, $62$hi = 0;
  i64toi32_i32$0 = var$1$hi;
  var$2 = var$1;
  var$4 = var$2 >>> 16 | 0;
  i64toi32_i32$0 = var$0$hi;
  var$3 = var$0;
  var$5 = var$3 >>> 16 | 0;
  $17_1 = Math_imul(var$4, var$5);
  $18_1 = var$2;
  i64toi32_i32$2 = var$3;
  i64toi32_i32$1 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = 0;
   $21_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $21_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
  }
  $23_1 = $17_1 + Math_imul($18_1, $21_1) | 0;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$0 = var$1;
  i64toi32_i32$2 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $22_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $22_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $29_1 = $23_1 + Math_imul($22_1, var$3) | 0;
  var$2 = var$2 & 65535 | 0;
  var$3 = var$3 & 65535 | 0;
  var$6 = Math_imul(var$2, var$3);
  var$2 = (var$6 >>> 16 | 0) + Math_imul(var$2, var$5) | 0;
  $45_1 = $29_1 + (var$2 >>> 16 | 0) | 0;
  var$2 = (var$2 & 65535 | 0) + Math_imul(var$4, var$3) | 0;
  i64toi32_i32$2 = 0;
  i64toi32_i32$1 = $45_1 + (var$2 >>> 16 | 0) | 0;
  i64toi32_i32$0 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
   $24_1 = 0;
  } else {
   i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$4 | 0) | 0;
   $24_1 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
  }
  $56$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $62$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $56$hi;
  i64toi32_i32$2 = $24_1;
  i64toi32_i32$1 = $62$hi;
  i64toi32_i32$3 = var$2 << 16 | 0 | (var$6 & 65535 | 0) | 0;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  i64toi32_i32$2 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$2 | 0;
 }
 
 function _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, i64toi32_i32$4 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$5 = 0, var$2 = 0, var$3 = 0, var$4 = 0, var$5 = 0, var$5$hi = 0, var$6 = 0, var$6$hi = 0, i64toi32_i32$6 = 0, $37_1 = 0, $38_1 = 0, $39_1 = 0, $40_1 = 0, $41_1 = 0, $42_1 = 0, $43_1 = 0, $44_1 = 0, var$8$hi = 0, $45_1 = 0, $46_1 = 0, $47_1 = 0, $48_1 = 0, var$7$hi = 0, $49_1 = 0, $63$hi = 0, $65_1 = 0, $65$hi = 0, $120$hi = 0, $129$hi = 0, $134$hi = 0, var$8 = 0, $140_1 = 0, $140$hi = 0, $142$hi = 0, $144 = 0, $144$hi = 0, $151 = 0, $151$hi = 0, $154$hi = 0, var$7 = 0, $165$hi = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         label$8 : {
          label$9 : {
           label$10 : {
            label$11 : {
             i64toi32_i32$0 = var$0$hi;
             i64toi32_i32$2 = var$0;
             i64toi32_i32$1 = 0;
             i64toi32_i32$3 = 32;
             i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
             if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
              i64toi32_i32$1 = 0;
              $37_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
             } else {
              i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
              $37_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
             }
             var$2 = $37_1;
             if (var$2) {
              i64toi32_i32$1 = var$1$hi;
              var$3 = var$1;
              if (!var$3) {
               break label$11
              }
              i64toi32_i32$0 = var$3;
              i64toi32_i32$2 = 0;
              i64toi32_i32$3 = 32;
              i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
              if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
               i64toi32_i32$2 = 0;
               $38_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
              } else {
               i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
               $38_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
              }
              var$4 = $38_1;
              if (!var$4) {
               break label$9
              }
              var$2 = Math_clz32(var$4) - Math_clz32(var$2) | 0;
              if (var$2 >>> 0 <= 31 >>> 0) {
               break label$8
              }
              break label$2;
             }
             i64toi32_i32$2 = var$1$hi;
             i64toi32_i32$1 = var$1;
             i64toi32_i32$0 = 1;
             i64toi32_i32$3 = 0;
             if (i64toi32_i32$2 >>> 0 > i64toi32_i32$0 >>> 0 | ((i64toi32_i32$2 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$1 >>> 0 >= i64toi32_i32$3 >>> 0 | 0) | 0) {
              break label$2
             }
             i64toi32_i32$1 = var$0$hi;
             var$2 = var$0;
             i64toi32_i32$1 = i64toi32_i32$2;
             i64toi32_i32$1 = i64toi32_i32$2;
             var$3 = var$1;
             var$2 = (var$2 >>> 0) / (var$3 >>> 0) | 0;
             i64toi32_i32$1 = 0;
             __wasm_intrinsics_temp_i64 = var$0 - Math_imul(var$2, var$3) | 0;
             __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
             i64toi32_i32$1 = 0;
             i64toi32_i32$2 = var$2;
             i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
             return i64toi32_i32$2 | 0;
            }
            i64toi32_i32$2 = var$1$hi;
            i64toi32_i32$3 = var$1;
            i64toi32_i32$1 = 0;
            i64toi32_i32$0 = 32;
            i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
            if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
             i64toi32_i32$1 = 0;
             $39_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
            } else {
             i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
             $39_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
            }
            var$3 = $39_1;
            i64toi32_i32$1 = var$0$hi;
            if (!var$0) {
             break label$7
            }
            if (!var$3) {
             break label$6
            }
            var$4 = var$3 + -1 | 0;
            if (var$4 & var$3 | 0) {
             break label$6
            }
            i64toi32_i32$1 = 0;
            i64toi32_i32$2 = var$4 & var$2 | 0;
            i64toi32_i32$3 = 0;
            i64toi32_i32$0 = 32;
            i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
            if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
             i64toi32_i32$3 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
             $40_1 = 0;
            } else {
             i64toi32_i32$3 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
             $40_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
            }
            $63$hi = i64toi32_i32$3;
            i64toi32_i32$3 = var$0$hi;
            i64toi32_i32$1 = var$0;
            i64toi32_i32$2 = 0;
            i64toi32_i32$0 = -1;
            i64toi32_i32$2 = i64toi32_i32$3 & i64toi32_i32$2 | 0;
            $65_1 = i64toi32_i32$1 & i64toi32_i32$0 | 0;
            $65$hi = i64toi32_i32$2;
            i64toi32_i32$2 = $63$hi;
            i64toi32_i32$3 = $40_1;
            i64toi32_i32$1 = $65$hi;
            i64toi32_i32$0 = $65_1;
            i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1 | 0;
            __wasm_intrinsics_temp_i64 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
            __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
            i64toi32_i32$1 = 0;
            i64toi32_i32$3 = var$2 >>> ((__wasm_ctz_i32(var$3 | 0) | 0) & 31 | 0) | 0;
            i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
            return i64toi32_i32$3 | 0;
           }
          }
          var$4 = var$3 + -1 | 0;
          if (!(var$4 & var$3 | 0)) {
           break label$5
          }
          var$2 = (Math_clz32(var$3) + 33 | 0) - Math_clz32(var$2) | 0;
          var$3 = 0 - var$2 | 0;
          break label$3;
         }
         var$3 = 63 - var$2 | 0;
         var$2 = var$2 + 1 | 0;
         break label$3;
        }
        var$4 = (var$2 >>> 0) / (var$3 >>> 0) | 0;
        i64toi32_i32$3 = 0;
        i64toi32_i32$2 = var$2 - Math_imul(var$4, var$3) | 0;
        i64toi32_i32$1 = 0;
        i64toi32_i32$0 = 32;
        i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
        if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
         i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
         $41_1 = 0;
        } else {
         i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$4 | 0) | 0;
         $41_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
        }
        __wasm_intrinsics_temp_i64 = $41_1;
        __wasm_intrinsics_temp_i64$hi = i64toi32_i32$1;
        i64toi32_i32$1 = 0;
        i64toi32_i32$2 = var$4;
        i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
        return i64toi32_i32$2 | 0;
       }
       var$2 = Math_clz32(var$3) - Math_clz32(var$2) | 0;
       if (var$2 >>> 0 < 31 >>> 0) {
        break label$4
       }
       break label$2;
      }
      i64toi32_i32$2 = var$0$hi;
      i64toi32_i32$2 = 0;
      __wasm_intrinsics_temp_i64 = var$4 & var$0 | 0;
      __wasm_intrinsics_temp_i64$hi = i64toi32_i32$2;
      if ((var$3 | 0) == (1 | 0)) {
       break label$1
      }
      i64toi32_i32$2 = var$0$hi;
      i64toi32_i32$2 = 0;
      $120$hi = i64toi32_i32$2;
      i64toi32_i32$2 = var$0$hi;
      i64toi32_i32$3 = var$0;
      i64toi32_i32$1 = $120$hi;
      i64toi32_i32$0 = __wasm_ctz_i32(var$3 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$1 = 0;
       $42_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
      } else {
       i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
       $42_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
      }
      i64toi32_i32$3 = $42_1;
      i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
      return i64toi32_i32$3 | 0;
     }
     var$3 = 63 - var$2 | 0;
     var$2 = var$2 + 1 | 0;
    }
    i64toi32_i32$3 = var$0$hi;
    i64toi32_i32$3 = 0;
    $129$hi = i64toi32_i32$3;
    i64toi32_i32$3 = var$0$hi;
    i64toi32_i32$2 = var$0;
    i64toi32_i32$1 = $129$hi;
    i64toi32_i32$0 = var$2 & 63 | 0;
    i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = 0;
     $43_1 = i64toi32_i32$3 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$1 = i64toi32_i32$3 >>> i64toi32_i32$4 | 0;
     $43_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
    }
    var$5 = $43_1;
    var$5$hi = i64toi32_i32$1;
    i64toi32_i32$1 = var$0$hi;
    i64toi32_i32$1 = 0;
    $134$hi = i64toi32_i32$1;
    i64toi32_i32$1 = var$0$hi;
    i64toi32_i32$3 = var$0;
    i64toi32_i32$2 = $134$hi;
    i64toi32_i32$0 = var$3 & 63 | 0;
    i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = i64toi32_i32$3 << i64toi32_i32$4 | 0;
     $44_1 = 0;
    } else {
     i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
     $44_1 = i64toi32_i32$3 << i64toi32_i32$4 | 0;
    }
    var$0 = $44_1;
    var$0$hi = i64toi32_i32$2;
    label$13 : {
     if (var$2) {
      i64toi32_i32$2 = var$1$hi;
      i64toi32_i32$1 = var$1;
      i64toi32_i32$3 = -1;
      i64toi32_i32$0 = -1;
      i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
      i64toi32_i32$5 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
      if (i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0) {
       i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
      }
      var$8 = i64toi32_i32$4;
      var$8$hi = i64toi32_i32$5;
      label$15 : while (1) {
       i64toi32_i32$5 = var$5$hi;
       i64toi32_i32$2 = var$5;
       i64toi32_i32$1 = 0;
       i64toi32_i32$0 = 1;
       i64toi32_i32$3 = i64toi32_i32$0 & 31 | 0;
       if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
        i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$3 | 0;
        $45_1 = 0;
       } else {
        i64toi32_i32$1 = ((1 << i64toi32_i32$3 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$3 | 0) | 0) | 0 | (i64toi32_i32$5 << i64toi32_i32$3 | 0) | 0;
        $45_1 = i64toi32_i32$2 << i64toi32_i32$3 | 0;
       }
       $140_1 = $45_1;
       $140$hi = i64toi32_i32$1;
       i64toi32_i32$1 = var$0$hi;
       i64toi32_i32$5 = var$0;
       i64toi32_i32$2 = 0;
       i64toi32_i32$0 = 63;
       i64toi32_i32$3 = i64toi32_i32$0 & 31 | 0;
       if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
        i64toi32_i32$2 = 0;
        $46_1 = i64toi32_i32$1 >>> i64toi32_i32$3 | 0;
       } else {
        i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$3 | 0;
        $46_1 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$3 | 0) | 0;
       }
       $142$hi = i64toi32_i32$2;
       i64toi32_i32$2 = $140$hi;
       i64toi32_i32$1 = $140_1;
       i64toi32_i32$5 = $142$hi;
       i64toi32_i32$0 = $46_1;
       i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5 | 0;
       var$5 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
       var$5$hi = i64toi32_i32$5;
       $144 = var$5;
       $144$hi = i64toi32_i32$5;
       i64toi32_i32$5 = var$8$hi;
       i64toi32_i32$5 = var$5$hi;
       i64toi32_i32$5 = var$8$hi;
       i64toi32_i32$2 = var$8;
       i64toi32_i32$1 = var$5$hi;
       i64toi32_i32$0 = var$5;
       i64toi32_i32$3 = i64toi32_i32$2 - i64toi32_i32$0 | 0;
       i64toi32_i32$6 = i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0;
       i64toi32_i32$4 = i64toi32_i32$6 + i64toi32_i32$1 | 0;
       i64toi32_i32$4 = i64toi32_i32$5 - i64toi32_i32$4 | 0;
       i64toi32_i32$5 = i64toi32_i32$3;
       i64toi32_i32$2 = 0;
       i64toi32_i32$0 = 63;
       i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
       if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
        i64toi32_i32$2 = i64toi32_i32$4 >> 31 | 0;
        $47_1 = i64toi32_i32$4 >> i64toi32_i32$1 | 0;
       } else {
        i64toi32_i32$2 = i64toi32_i32$4 >> i64toi32_i32$1 | 0;
        $47_1 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$4 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$1 | 0) | 0;
       }
       var$6 = $47_1;
       var$6$hi = i64toi32_i32$2;
       i64toi32_i32$2 = var$1$hi;
       i64toi32_i32$2 = var$6$hi;
       i64toi32_i32$4 = var$6;
       i64toi32_i32$5 = var$1$hi;
       i64toi32_i32$0 = var$1;
       i64toi32_i32$5 = i64toi32_i32$2 & i64toi32_i32$5 | 0;
       $151 = i64toi32_i32$4 & i64toi32_i32$0 | 0;
       $151$hi = i64toi32_i32$5;
       i64toi32_i32$5 = $144$hi;
       i64toi32_i32$2 = $144;
       i64toi32_i32$4 = $151$hi;
       i64toi32_i32$0 = $151;
       i64toi32_i32$1 = i64toi32_i32$2 - i64toi32_i32$0 | 0;
       i64toi32_i32$6 = i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0;
       i64toi32_i32$3 = i64toi32_i32$6 + i64toi32_i32$4 | 0;
       i64toi32_i32$3 = i64toi32_i32$5 - i64toi32_i32$3 | 0;
       var$5 = i64toi32_i32$1;
       var$5$hi = i64toi32_i32$3;
       i64toi32_i32$3 = var$0$hi;
       i64toi32_i32$5 = var$0;
       i64toi32_i32$2 = 0;
       i64toi32_i32$0 = 1;
       i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
       if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
        i64toi32_i32$2 = i64toi32_i32$5 << i64toi32_i32$4 | 0;
        $48_1 = 0;
       } else {
        i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$4 | 0) | 0;
        $48_1 = i64toi32_i32$5 << i64toi32_i32$4 | 0;
       }
       $154$hi = i64toi32_i32$2;
       i64toi32_i32$2 = var$7$hi;
       i64toi32_i32$2 = $154$hi;
       i64toi32_i32$3 = $48_1;
       i64toi32_i32$5 = var$7$hi;
       i64toi32_i32$0 = var$7;
       i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5 | 0;
       var$0 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
       var$0$hi = i64toi32_i32$5;
       i64toi32_i32$5 = var$6$hi;
       i64toi32_i32$2 = var$6;
       i64toi32_i32$3 = 0;
       i64toi32_i32$0 = 1;
       i64toi32_i32$3 = i64toi32_i32$5 & i64toi32_i32$3 | 0;
       var$6 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
       var$6$hi = i64toi32_i32$3;
       var$7 = var$6;
       var$7$hi = i64toi32_i32$3;
       var$2 = var$2 + -1 | 0;
       if (var$2) {
        continue label$15
       }
       break label$15;
      };
      break label$13;
     }
    }
    i64toi32_i32$3 = var$5$hi;
    __wasm_intrinsics_temp_i64 = var$5;
    __wasm_intrinsics_temp_i64$hi = i64toi32_i32$3;
    i64toi32_i32$3 = var$0$hi;
    i64toi32_i32$5 = var$0;
    i64toi32_i32$2 = 0;
    i64toi32_i32$0 = 1;
    i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = i64toi32_i32$5 << i64toi32_i32$4 | 0;
     $49_1 = 0;
    } else {
     i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$4 | 0) | 0;
     $49_1 = i64toi32_i32$5 << i64toi32_i32$4 | 0;
    }
    $165$hi = i64toi32_i32$2;
    i64toi32_i32$2 = var$6$hi;
    i64toi32_i32$2 = $165$hi;
    i64toi32_i32$3 = $49_1;
    i64toi32_i32$5 = var$6$hi;
    i64toi32_i32$0 = var$6;
    i64toi32_i32$5 = i64toi32_i32$2 | i64toi32_i32$5 | 0;
    i64toi32_i32$3 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
    i64toi32_i32$HIGH_BITS = i64toi32_i32$5;
    return i64toi32_i32$3 | 0;
   }
   i64toi32_i32$3 = var$0$hi;
   __wasm_intrinsics_temp_i64 = var$0;
   __wasm_intrinsics_temp_i64$hi = i64toi32_i32$3;
   i64toi32_i32$3 = 0;
   var$0 = 0;
   var$0$hi = i64toi32_i32$3;
  }
  i64toi32_i32$3 = var$0$hi;
  i64toi32_i32$5 = var$0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$3;
  return i64toi32_i32$5 | 0;
 }
 
 function __wasm_ctz_i32(var$0) {
  var$0 = var$0 | 0;
  if (var$0) {
   return 31 - Math_clz32((var$0 + -1 | 0) ^ var$0 | 0) | 0 | 0
  }
  return 32 | 0;
 }
 
 function __wasm_i64_mul(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$0 = var$1$hi;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$1 = _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0 | 0, i64toi32_i32$0 | 0, var$1 | 0, i64toi32_i32$1 | 0) | 0;
  i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function __wasm_i64_udiv(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$0 = var$1$hi;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$1 = _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E(var$0 | 0, i64toi32_i32$0 | 0, var$1 | 0, i64toi32_i32$1 | 0) | 0;
  i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function __wasm_rotl_i32(var$0, var$1) {
  var$0 = var$0 | 0;
  var$1 = var$1 | 0;
  var var$2 = 0;
  var$2 = var$1 & 31 | 0;
  var$1 = (0 - var$1 | 0) & 31 | 0;
  return ((-1 >>> var$2 | 0) & var$0 | 0) << var$2 | 0 | (((-1 << var$1 | 0) & var$0 | 0) >>> var$1 | 0) | 0 | 0;
 }
 
 // EMSCRIPTEN_END_FUNCS
;
 bufferView = HEAPU8;
 initActiveSegments(imports);
 var FUNCTION_TABLE = Table([null, $111, $120, $3, $22, $23, $25, $59, $60, $89, $92, $90, $91, $96, $110, $108, $103, $93, $109, $107, $104, $115, $116, $118, $119, $112, $113, $124, $125, $127]);
 function __wasm_memory_size() {
  return buffer.byteLength / 65536 | 0;
 }
 
 return {
  "memory": Object.create(Object.prototype, {
   "grow": {
    
   }, 
   "buffer": {
    "get": function () {
     return buffer;
    }
    
   }
  }), 
  "__wasm_call_ctors": $0, 
  "__indirect_function_table": FUNCTION_TABLE, 
  "next_val": $4, 
  "new_fib": $5, 
  "main": $12, 
  "fflush": $131, 
  "strerror": $140, 
  "emscripten_stack_init": $132, 
  "emscripten_stack_get_free": $133, 
  "emscripten_stack_get_base": $134, 
  "emscripten_stack_get_end": $135, 
  "_emscripten_stack_restore": $136, 
  "_emscripten_stack_alloc": $137, 
  "emscripten_stack_get_current": $138, 
  "dynCall_jiji": $142
 };
}

  return asmFunc(info);
}

)(info);
  },

  instantiate: /** @suppress{checkTypes} */ function(binary, info) {
    return {
      then: function(ok) {
        var module = new WebAssembly.Module(binary);
        ok({
          'instance': new WebAssembly.Instance(module, info)
        });
        // Emulate a simple WebAssembly.instantiate(..).then(()=>{}).catch(()=>{}) syntax.
        return { catch: function() {} };
      }
    };
  },

  RuntimeError: Error,

  isWasm2js: true,
};
// end include: wasm2js.js
if (WebAssembly.isWasm2js) {
  // We don't need to actually download a wasm binary, mark it as present but
  // empty.
  wasmBinary = [];
}

if (typeof WebAssembly != 'object') {
  err('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _malloc() {
  abort('malloc() called but not included in the build - add `_malloc` to EXPORTED_FUNCTIONS');
}
function _free() {
  // Show a helpful error since we used to include free by default in the past.
  abort('free() called but not included in the build - add `_free` to EXPORTED_FUNCTIONS');
}

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

var runtimeInitialized = false;

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_shared.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

function legacyModuleProp(prop, newName, incoming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort(`Attempt to set \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

/**
 * Intercept access to a global symbol.  This enables us to give informative
 * warnings/errors when folks attempt to use symbols they did not include in
 * their build, or no symbols that no longer exist.
 */
function hookGlobalSymbolAccess(sym, func) {
  if (typeof globalThis != 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith('_')) {
      librarySymbol = '$' + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
    }
    warnOnce(msg);
  });

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}
// end include: runtime_debug.js
// include: memoryprofiler.js
// end include: memoryprofiler.js


function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

// end include: runtime_shared.js
assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  consumedModuleProp('preRun');
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  

  wasmExports['__wasm_call_ctors']();

  
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  consumedModuleProp('postRun');

  callRuntimeCallbacks(onPostRuns);
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};
var runDependencyWatcher = null;

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init() { FS.error() },
  createDataFile() { FS.error() },
  createPreloadedFile() { FS.error() },
  createLazyFile() { FS.error() },
  open() { FS.error() },
  mkdev() { FS.error() },
  registerDevice() { FS.error() },
  analyzePath() { FS.error() },

  ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;
function findWasmBinary() {
    return locateFile('hello.wasm');
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary && typeof WebAssembly.instantiateStreaming == 'function'
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid instantiateStreaming() on Node.js environment for now, as while
      // Node.js v18.1.0 implements it, it does not have a full fetch()
      // implementation yet.
      //
      // Reference:
      //   https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, 'memory not found in wasm exports');
    updateMemoryViews();

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    return new Promise((resolve, reject) => {
      try {
        Module['instantiateWasm'](info, (mod, inst) => {
          receiveInstance(mod, inst);
          resolve(mod.exports);
        });
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();

    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===
// end include: preamble.js


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.unshift(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.unshift(cb);


  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = Module['noExitRuntime'] || true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  
  var exceptionLast = 0;
  
  var uncaughtExceptionCount = 0;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  var __abort_js = () =>
      abort('native code called abort()');

  var getHeapMax = () =>
      HEAPU8.length;
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  
  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      abortOnCannotGrowMemory(requestedSize);
    };

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined/NaN means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  var SYSCALLS = {
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
  
    
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};
var wasmExports;
createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors', 0);
var _next_val = Module['_next_val'] = createExportWrapper('next_val', 1);
var _new_fib = Module['_new_fib'] = createExportWrapper('new_fib', 0);
var _main = createExportWrapper('main', 2);
var _fflush = createExportWrapper('fflush', 1);
var _strerror = createExportWrapper('strerror', 1);
var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports['emscripten_stack_init'])();
var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'])();
var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'])();
var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'])();
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['_emscripten_stack_restore'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();
var dynCall_jiji = Module['dynCall_jiji'] = createExportWrapper('dynCall_jiji', 5);


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'stackAlloc',
  'getTempRet0',
  'setTempRet0',
  'zeroMemory',
  'exitJS',
  'growMemory',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'emscriptenLog',
  'readEmAsmArgs',
  'jstoi_q',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asmjsMangle',
  'asyncLoad',
  'mmapAlloc',
  'HandleAllocator',
  'getNativeTypeSize',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnExit',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'getEnvStrings',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'initRandomFill',
  'randomFill',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'Browser_asyncPrepareDataCounter',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar',
  'FS_unlink',
  'FS_createDataFile',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'setErrNo',
  'demangle',
  'stackTrace',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

var unexportedSymbols = [
  'run',
  'addRunDependency',
  'removeRunDependency',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmMemory',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'convertI32PairToI53Checked',
  'stackSave',
  'stackRestore',
  'ptrToString',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'ENV',
  'ERRNO_CODES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'jstoi_s',
  'alignMemory',
  'wasmTable',
  'noExitRuntime',
  'addOnPreRun',
  'addOnPostRun',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'UTF16Decoder',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'flush_NO_FILESYSTEM',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'SYSCALLS',
  'preloadPlugins',
  'FS_stdin_getChar_buffer',
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_createLazyFile',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'print',
  'printErr',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);



var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    Module['onRuntimeInitialized']?.();
    consumedModuleProp('onRuntimeInitialized');

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
consumedModuleProp('preInit');

run();

// end include: postamble.js

