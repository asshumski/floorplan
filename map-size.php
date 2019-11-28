<?php
/**
 * Created by Andrei Shumski.
 * Date: 2019-11-28
 * All rights reserved
 */
$imageData = getimagesize($_GET['file_path']);
$arr = [
    'width' => $imageData[0],
    'height' => $imageData[1]
];
echo json_encode($arr);