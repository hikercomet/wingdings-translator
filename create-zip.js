const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, 'wingdings-translator-1.1.1.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archiver has been finalized and the output file descriptor has closed.');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    // log warning
    console.warn(err);
  } else {
    // throw error
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory('dist/', false);

archive.finalize();
