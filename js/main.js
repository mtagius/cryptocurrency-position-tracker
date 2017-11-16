my = null;

$(document).ready(function() {
    /*
    $.ajax({
        url: "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,LTC,ETH&tsyms=USD&e=GDAX",
        type: "GET",
        success: function(result){
            
        }
    });
    $.ajax({
        url: "https://min-api.cryptocompare.com/data/pricemulti?fsyms=LTE,VTC&tsyms=USD",
        type: "GET",
        success: function(result){

        }
    });
    */
    $.getJSON("../data/positions.json?nocache="+new Date(), function(positions) {
        my = positions;
        alert(my.positions[0].ticker);
    });
});