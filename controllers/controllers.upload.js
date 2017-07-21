const uploadModel = require('../models/models.upload');
const fs = require('fs');
require('dotenv').config();
const contentDisposition = require('content-disposition');
const destroy = require('destroy');
const onFinished = require('on-finished');
const path = require('path');

let projectName = '';

const Joi = require('joi');

const schema = Joi.object().keys({
  projectName: Joi.string().regex(/^[a-zA-Z0-9_.]+$/).min(3),
});

const upload = {
  addUpload: (req, res) => {
    projectName = req.params.projectName;
    const newPath = process.env.PROJECT_FOLDER + projectName + process.env.UPLOAD;
    fs.stat(newPath, (err, stats) => {
      if (err) {
        fs.readdir(process.env.DIRECTORY_LOCAL, (err, list) => {
          if (err) { throw (err); }
          list.forEach((file) => {
            if (path.extname(file)) {
              console.log(file);
              fs.unlink(process.env.DIRECTORY_LOCAL + file, (err) => {
                if (err) { console.log(err); }
              });
            }
          });
        });

        return res.send({ message: `Tidak menemukan ${projectName}${process.env.UPLOAD}` });
      }
      fs.readdir(process.env.DIRECTORY_LOCAL, (err, list) => {
        if (err) { throw (err); }
        list.forEach((file) => {
          if (path.extname(file)) {
            fs.rename(process.env.OLDPATH + file, process.env.NEWPATH + projectName +
              process.env.UPLOAD + file, (err) => {
              if (err) { console.log(err); }
            });
          }
        });
      });
      uploadModel.addUpload(req.files.upload)
        .then((result) => {
          res.json(200, result);
        })
        .catch((error) => {
          res.json(400, error);
        });
    });
  },

  downloadProject: (req, res) => {
    projectName = req.params.projectName;
    let filepath = process.env.PROJECT_FOLDER + projectName + process.env.UPLOAD;
    const filename = req.params.filename;
    filepath = `${filepath}/${filename}`;

    fs.stat(filepath, (err, stats) => {
      if (err) {
        return res.send({ message: `Tidak menemukan ${projectName}${process.env.UPLOAD}${filename}` });
      }
      const ext = path.extname(filename);
      let fileType = '';
      switch (ext) {
        case '.png':
          fileType = 'image/png';
          break;
        case '.docx':
          fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.pdf':
          fileType = 'application/pdf';
          break;
        case '.zip':
          fileType = 'application/zip';
          break;
        case '.pptx':
          fileType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        default:
          throw ('EXTENSI SALAH');
      }
      res.setHeader('Content-Type', fileType);
      res.setHeader('Content-Disposition', contentDisposition(filepath));

      const stream = fs.createReadStream(filepath);
      stream.pipe(res);
      onFinished(res, (err) => {
        destroy(stream);
      });
    });
  },

  deleteProject: (req, res) => {
    projectName = req.params.projectName;
    let filepath = process.env.PROJECT_FOLDER + projectName + process.env.UPLOAD;
    const filename = req.params.filename;
    filepath = `${filepath}/${filename}`;
    console.log(filepath);

    fs.stat(filepath, (err, stats) => {
      if (err) {
        return res.send({ message: `Tidak menemukan ${projectName}${process.env.UPLOAD}${filename}` });
      }
      fs.unlink(filepath, (err) => {
        if (err) {
          return console.error(err);
        }
        res.send({
          message: `Success to Delete ${req.params.filename}`,
        });
      });
    });
  },

  makeDirectory: (req, res) => {
    projectName = req.params.projectName;

    Joi.validate({ projectName }, schema, (err, value) => {
      if (err) throw (err.message);
    });

    const projectPath = process.env.PROJECT_FOLDER + projectName;
    fs.stat(projectPath, (err, stats) => {
      if (err) {
        fs.mkdir(projectPath, (err) => {
          if (err) {
            return console.error(err);
          }
          res.send({ message: 'Success make a directory' });
        });
      } else if (projectPath) {
        res.send({ message: 'Directory has already' });
      }
    });
  },


};

module.exports = upload;

exports.projectName = projectName;