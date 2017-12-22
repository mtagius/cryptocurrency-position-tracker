<?php
$json_array = json_decode(file_get_contents('../data/positions.json'), true);

array_push($json_array['positions'], $_POST);

function sortByTickerandCoinAmount($a, $b) {
    if($a['ticker'] == $b['ticker']) {
        if(($a['sellPrice'] != "-1") && (($b['sellPrice'] != "-1"))) {
            return (($a['coinAmount'] * $a['sellPrice']) - ($a['coinAmount'] * $a['purchasePrice']) > ($b['coinAmount'] * $b['sellPrice']) - ($b['coinAmount'] * $b['purchasePrice']) ) ? -1 : 1;
        } else {
            return ($a['coinAmount'] * $a['purchasePrice'] > $b['coinAmount'] * $b['purchasePrice']) ? -1 : 1;
        }
    } else {
        return ($a['ticker'] < $b['ticker']) ? -1 : 1;
    }
}

usort($json_array['positions'], 'sortByTickerandCoinAmount');

file_put_contents('../data/positions.json', json_encode($json_array));
?>