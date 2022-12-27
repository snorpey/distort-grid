# image distortion experiment

this is an experiment for the web browser. it lets you distort an image by moving intersections in a grid.

[![distortion experiment screen shot](distort-grid.png)](http://snorpey.github.io/distort-grid/)

[online demo](http://snorpey.github.io/distort-grid/)

some parts of the warping code are taken from [@migurski](https://github.com/migurski)s [canvas warp demo](https://github.com/migurski/canvas-warp/blob/master/index.html).

## build script

the build script takes care of concatenating and minifying all scripts and styles. it uses [vite](https://vitejs.dev/) under the hood.

please make sure that [nodejs](http://nodejs.org/) is installed on your machine.

run `npm install` from within the root folder of the project to install the dependencies of the build script.

to build the project, run `npm run build`. the optimized files will get copied to the `dist/` folder.

run `npm run dev` to start a live-reload server for the project.

## third party code used in this project

-   [vite](https://vitejs.dev/), MIT license
-   [eventbus](https://github.com/tbreuss/eventbus) by [tbreuss](https://github.com/tbreuss/), BSD clause 3 License

## most importantly

thank you for taking a look at this repo. have a great day :)
