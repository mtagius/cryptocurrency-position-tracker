<?php
$json_array = json_decode(file_get_contents('../data/positions.json'), true);

array_splice($json_array['positions'], $_POST['index'], 1);

file_put_contents('../data/positions.json', json_encode($json_array));
?>