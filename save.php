<?php
$data = file_get_contents('php://input');
if (copy('./employee_list.json', './employee_list_copy_' . time() . '.json')) {
    file_put_contents('./employee_list.json', $data);
}
