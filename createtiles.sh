#!/bin/bash

rm -rf tiles

case $1 in
  mpz)
    ./gda2tiles/gdal2tiles-multiprocess.py -l -p raster -z 1-6 -w none map.png tiles
    ;;
  mp)
    ./gda2tiles/gdal2tiles-multiprocess.py -l -p raster -w none map.png tiles
    ;;
  z)
    ./gda2tiles/gdal2tiles.py -l -p raster -w none map.png -z 0-5 tiles
    ;;
  *)
    ./gda2tiles/gdal2tiles.py -l -p raster -w none map.png tiles
    ;;
esac
