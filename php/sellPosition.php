<?php
$json_array = json_decode(file_get_contents('../data/positions.json'), true);

$json_array['positions'][$_POST['index']]['sellPrice'] = $_POST['sellPrice'];

file_put_contents('../data/positions.json', json_encode($json_array));
?>