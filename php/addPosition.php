<?php
$json_array = json_decode(file_get_contents('../data/positions.json'), true);

array_push($json_array['positions'], $_POST);

function sortByTicker($a, $b) {
    return ($a['ticker']<$b['ticker'])?-1:1;
}

usort($json_array['positions'], 'sortByTicker');

file_put_contents('../data/positions.json', json_encode($json_array));
?>