import path from 'path'
const formidable = require('formidable');
import feathersErrors from 'feathers-errors'
import fs from 'fs';
import fsExtra from 'fs-extra'
const decompress = require('decompress')
const exec = require('child_process').exec
import compileIndex from '../../../components/compile-index';
import themes from '../../../components/seed/seed/themes'
import extensions from '../../../components/seed/seed/extensions'

const collections = [
  "extensions",
  "themes",
  "bans",
  "comments",
  "custom",
  "images",
  "menus",
  "pages",
  "roles",
  "settings",
  "staging",
  "users"
]

export default function(req, res, next) {

  if(req.method !== "POST") { return next() }

  function importCollection(collection) {
    return new Promise((resolve, reject) => {
      if(!req.app.get('db') || !collection || !req.app.get('exportPath')) { return reject('missing either the collection, db ENV or dataExportPath ENV')}

      const child = exec(`mongoimport --db ${req.app.get('db')} --collection ${collection} --file ${path.join(req.app.get('exportPath'), 'data', collection + '.json')} --jsonArray`)

      child.on('close', function(code) {
        console.log(`Import of ${collection} was successful`);
        return resolve(`Import of ${collection} was successful`)
      })
    })
  }

  async function removeData(name) {
    console.log('resetting ' + name);
    await req.app.service(name).remove(null, {query:{}})
  }

  if(!req.app || !req.app.get('importPath')) {
    next(new Error('importPath not found on server'));
  }

  var createdFolderName = '125098dsflkj1324';

  var createdFolderPath = path.join(req.app.get('importPath'));
  try {
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
      if(err) {
        console.log("Error parsing zip: ", err);
        return next(new feathersErrors.NotAcceptable('The zip folder must be compressed in the correct format.'));
      }
      if(!files || !files.file) {
        return next(new feathersErrors.NotAcceptable('The zip folder must be compressed.'));
      }

      var tempFilePath = files.file.path;
      var fileName  = files.file.name;
      var contentType   = files.file.type;

      decompress(tempFilePath, req.app.get('importPath')).then(async () => {
        let currentPath = path.join(req.app.get('importContentPath'))
        try {
          fsExtra.copySync(path.join(currentPath, 'images'), req.app.get('uploadsPath'))
          fsExtra.copySync(path.join(currentPath, 'themes'), req.app.get('themesPath'))
          fsExtra.copySync(path.join(currentPath, 'extensions'), req.app.get('extensionsPath'))

          let includeUsers = req.query.includeUsersAndRoles
          if(typeof includeUsers === 'string') {
            includeUsers = includeUsers.toLowerCase() === 'true'
          }

          for (var i = 0; i < collections.length; i++) {
            let doesFileExist = fs.lstatSync(path.join(currentPath, 'data', collections[i] + '.json'))
            try {
              if((collections[i] !== 'users' && collections[i] !== 'roles') || includeUsers) {
                if(doesFileExist) {
                  // await removeData(collections[i])
                  let response = await importCollection(collections[i])
                }
              }

            } catch(err) {
              console.log("Error importing data", err);
              break
              return next(err)
            }
          }
          console.log("success!")
          await themes.call(req.app)
          await extensions.call(req.app)
          compileIndex.call(req.app);
          console.log('Recompiling index.html');
          next()
        } catch (err) {
          console.error(err)
          return next(err)
        }
        next()
      }, function(err) {
        console.log('Error unzipping import data from another meanbase site', err);
        next(err)
      })
    });
  } catch(err) {
    return next(err);
  }
}
