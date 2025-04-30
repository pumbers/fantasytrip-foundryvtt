"use strict";

const pkg = require("./package.json");

const gulp = require("gulp");
const postcss = require("gulp-postcss");
const sourcemaps = require("gulp-sourcemaps");
const { Transform } = require("stream");
const rename = require("gulp-rename");
const yaml = require("js-yaml");
const rollup = require("rollup");
const terser = require("@rollup/plugin-terser");
const clean = require("gulp-clean");
const fs = require("fs");
const path = require("path");

const webp = (...args) => import("gulp-webp").then(({ default: webp }) => webp(...args));

const compilePack = (...args) => import("@foundryvtt/foundryvtt-cli").then(({ compilePack }) => compilePack(...args));
const extractPack = (...args) => import("@foundryvtt/foundryvtt-cli").then(({ extractPack }) => extractPack(...args));

/*
 * Build settings & locations
 */
const SYSTEM_STYLES = ["src/styles/**/*.css"];
const SYSTEM_STATIC = ["src/assets/**/*", "src/templates/**/*"];
const SYSTEM_YAML = ["src/system.yml", "src/lang/**/*.yml"];
const SYSTEM_PACKS = "src/packs";

const IMPORT_DIR = "import";
const BUILD_DIR = "build";
const DIST_DIR = "dist";

/* ----------------------------------------- */
/*  Clean the build folder
/* ----------------------------------------- */

function cleanBuild() {
  return gulp.src([BUILD_DIR, DIST_DIR], { allowEmpty: true }, { read: false }).pipe(clean());
}

/* ----------------------------------------- */
/*  Compile YAML data files to JSON
/* ----------------------------------------- */

function compileYaml(cb) {
  if (!SYSTEM_YAML.length) cb();

  return gulp
    .src(SYSTEM_YAML, {
      base: "src",
    })
    .pipe(
      new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform: function (file, _, cb) {
          const json = yaml.loadAll(file.contents.toString())[0];
          file.contents = Buffer.from(JSON.stringify(json));
          cb(null, file);
        },
      })
    )
    .pipe(rename({ extname: ".json" }))
    .pipe(gulp.dest(BUILD_DIR));
}

/* ----------------------------------------- */
/*  Compile Packs
/* ----------------------------------------- */

function cleanPacks() {
  return gulp.src(SYSTEM_PACKS, { allowEmpty: true }, { read: false }).pipe(clean());
}

// Extract LevelDB packs from a world or module to Yaml
function importPacks(cb) {
  const PACKS_DIR = path.join(IMPORT_DIR, "packs");
  const packs = fs.readdirSync(PACKS_DIR).filter((location) => {
    return fs.statSync(path.join(PACKS_DIR, location)).isDirectory();
  });

  if (!packs.length) cb();

  return Promise.all(
    packs.map((pack) => {
      return extractPack(path.join(PACKS_DIR, pack), path.resolve(__dirname, "src", "packs", pack), {
        yaml: true,
        log: true,
      });
    })
  ).then(() => cb());
}

// Compile Yaml documents to LevelDB
function compilePacks(cb) {
  const packs = fs.readdirSync(SYSTEM_PACKS).filter((location) => {
    return fs.statSync(path.join(SYSTEM_PACKS, location)).isDirectory();
  });

  if (!packs.length) cb();

  return Promise.all(
    packs.map((folder) => {
      return compilePack(path.join(SYSTEM_PACKS, folder), path.resolve(__dirname, BUILD_DIR, "packs", folder), {
        yaml: true,
        log: true,
      });
    })
  ).then(() => cb());
}

/* ----------------------------------------- */
/*  Compile CSS
/* ----------------------------------------- */

function compileCss() {
  return gulp
    .src(SYSTEM_STYLES)
    .pipe(sourcemaps.init())
    .pipe(postcss())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${BUILD_DIR}/styles`));
}

/* ----------------------------------------- */
/*  Bundle, minify & uglify js
/* ----------------------------------------- */

function bundleJs() {
  return rollup
    .rollup({
      input: [`src/module/${pkg.name}.mjs`],
      plugins: [
        terser({
          keep_fnames: true,
          mangle: true,
        }),
      ],
    })
    .then((bundle) => {
      return bundle.write({
        // dir: `${BUILD_DIR}/module`,
        file: `${BUILD_DIR}/module/${pkg.name}.mjs`,
        format: "es",
        sourcemap: true,
      });
    });
}

/* ----------------------------------------- */
/*  Optimize images
/* ----------------------------------------- */

const optimizeImages = function () {
  return gulp.src("src/assets/**/*.+(png|jpg|gif)").pipe(webp()).pipe(gulp.dest("src/assets"));
};

/* ----------------------------------------- */
/*  Copy static files
/* ----------------------------------------- */

function copyFiles() {
  return gulp
    .src(SYSTEM_STATIC, {
      base: "src",
      nodir: true,
      encoding: false,
    })
    .pipe(gulp.dest(BUILD_DIR));
}

/* ----------------------------------------- */
/*  Create a distribution folder
/* ----------------------------------------- */

function createDist() {
  return gulp
    .src(["LICENSE", `${BUILD_DIR}/**/*`], {
      nodir: true,
    })
    .pipe(gulp.dest(DIST_DIR));
}

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch([, "src/**/*.js", "src/**/*.mjs"], bundleJs);
  gulp.watch(["src/**/*.yml", "!src/packs/**/*"], compileYaml);
  gulp.watch(["src/packs/**/*"], compilePacks);
  gulp.watch(["src/**/*.css"], compileCss);
  gulp.watch(["src/LICENSE", "src/assets/**/*", "src/lib/**/*"], copyFiles);
  gulp.watch(["src/templates/**/*"], gulp.parallel(copyFiles, compileCss));
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
  cleanBuild,
  gulp.parallel(compileYaml, compilePacks, compileCss, bundleJs, copyFiles),
  watchUpdates
);
exports.yaml = compileYaml;
exports.importPacks = gulp.series(cleanPacks, importPacks);
exports.compilePacks = compilePacks;
exports.css = compileCss;
exports.images = optimizeImages;
exports.bundle = bundleJs;
exports.copy = copyFiles;
exports.build = gulp.series(cleanBuild, gulp.parallel(compileYaml, compilePacks, compileCss, bundleJs, copyFiles));
exports.dist = gulp.series(
  cleanBuild,
  gulp.parallel(compileYaml, compilePacks, compileCss, bundleJs, copyFiles),
  createDist
);
exports.clean = cleanBuild;
