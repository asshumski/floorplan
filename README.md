# Floorplan v1.0.0

Beta version of an indoor office map that allows you to arrange your staff, rooms, and printers.
  
Frontend [Demo](https://asshumski.github.io/floorplan/ "Frontend").  
Admin [Demo](https://asshumski.github.io/floorplan/admin "Admin Panel"). Save Button disabled for demo.

All you need to make everething runing are:
1. Web server with PHP 
2. python-gdal library which used by [gdal2tiles-leaflet](https://github.com/commenthol/gdal2tiles-leaflet "gdal2tiles-leaflet") to create image tiles for [leaflet.js](https://leafletjs.com/ "leaflet.js")

Install the python-gdal library that creates image tiles from ./map.png
```sh
sudo apt install python-gdal
```

Than go to public folder And run createtiles.sh with params 'mpz'
```sh
sudo ./createtiles.sh mpz
```
This will create image tiles from ./map.png for the map.
In order to use your office plan you need to replace 'map.png' image with yours.
To create more realistic office image you can use [SketchUp](https://www.sketchup.com/ "SketchUp")

If you have any questions feel free to reach me out by [Skype](https://join.skype.com/invite/oow3xojeC5aT "Skype Profile") or 
[Linkedin](https://www.linkedin.com/in/andrei-shumski-600265113/ "Linkedin Profile")
