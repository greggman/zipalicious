import mime from 'mime-types';
import {assert} from 'chai';
import zip from '../../src/zip';
import setZipConfig from './config';

describe('Blob', () => {

  it('should handle blobs', async () => {
    setZipConfig();
    return new Promise((resolve, reject) => {
      test((success) => {
        assert.isOk(success);
        resolve();
      });
    });
  });

  const TEXT_CONTENT = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum clari, fiant sollemnes in futurum.';
  const FILENAME = 'lorem.txt';

  function onerror(message) {
    console.error(message);
  }

  function zipBlob(blob, callback) {
    zip.createWriter(new zip.BlobWriter('application/zip'), function(zipWriter) {
      zipWriter.add(FILENAME, new zip.BlobReader(blob), function() {
        zipWriter.close(callback);
      });
    }, onerror);
  }

  function unzipBlob(blob, callback) {
    zip.createReader(new zip.BlobReader(blob), function(zipReader) {
      zipReader.getEntries(function(entries) {
        entries[0].getData(new zip.BlobWriter(mime.lookup(entries[0].filename)), function(data) {
          zipReader.close();
          callback(data);
        });
      });
    }, onerror);
  }

  function getBlobText(blob, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      callback(e.target.result);
    };
    reader.readAsText(blob);
  }

  function test(callback) {
    const blob = new Blob([TEXT_CONTENT], {
      type: mime.lookup(FILENAME),
    });
    zipBlob(blob, function(zippedBlob) {
      unzipBlob(zippedBlob, function(unzippedBlob) {
        getBlobText(unzippedBlob, function(text) {
          callback(text === TEXT_CONTENT);
        });
      });
    });
  }

});
