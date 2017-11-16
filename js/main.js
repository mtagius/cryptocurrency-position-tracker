my = null;
gdaxCoins = ["BTC", "ETH", "LTC"]
gdaxResults = null;
otherResults = null;
ajaxCalls = 0;

function getGDAXPrices(tickers) {
    url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
    for(var i = 0; i < tickers.length; i++) {
        if(i != tickers.length - 1) {
            url += tickers[i] + ",";
        } else {
            url += tickers[i];
        }
    }
    url += "&tsyms=USD&e=GDAX";
    $.ajax({
        url: url,
        type: "GET",
        success: function(result){
            ajaxCalls -= 1;
            gdaxResults = result;
            generateTable();
        }
    });
}
function getOtherPrices(tickers) {
    url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
    for(var i = 0; i < tickers.length; i++) {
        if(i != tickers.length - 1) {
            url += tickers[i] + ",";
        } else {
            url += tickers[i];
        }
    }
    url += "&tsyms=USD";
    $.ajax({
        url: url,
        type: "GET",
        success: function(result){
            ajaxCalls -= 1;
            otherResults = result;
            generateTable();
        }
    });
}

function generateTable() {
    if(ajaxCalls == 0) {
        var table = "<table><tr><th>Coin</th><th>Current Price</th><th>Coin Amount</th>" +
            "<th>Purchase Price</th><th>Fees</th><th>Percent Change</th><th>Gross</th><th>Net</th></tr>";
        for(var i = 0; i < my.positions.length; i++) {
            var coinPrice = 0;
            if(gdaxResults.hasOwnProperty(my.positions[i].ticker)) {
                coinPrice = gdaxResults[my.positions[i].ticker].USD;
            } else {
                coinPrice = otherResults[my.positions[i].ticker].USD;
            }
            table += "<tr>";
            table += "<td>" + my.positions[i].ticker + "</td>";
            table += "<td>" + coinPrice + "</td>";
            table += "<td>" + my.positions[i].coinAmount + "</td>";
            table += "<td>" + my.positions[i].purchasePrice + "</td>";
            table += "<td>" + my.positions[i].fee + "</td>";
            table += "<td>" + (((coinPrice - my.positions[i].purchasePrice) / my.positions[i].purchasePrice) * 100) + "%</td>";
            table += "<td>" + ((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) + "</td>";
            table += "<td>" + (((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) - (my.positions[i].fee)) + "</td>";
            table += "</tr>";
        }
        table += "</table>"
        $("#mainTable").html(table);
    } else if (ajaxCalls == -1) {
        alert("No Positions.");
    }
}

$(document).ready(function() {
    $.getJSON("../data/positions.json?nocache="+new Date(), function(positions) {
        my = positions;
        tickers = [];
        for(var i = 0; i < my.positions.length; i++) {
            tickers.push(my.positions[i].ticker);
        }
        var uniqueTickers = tickers.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        })
        gdaxPricesNeeded = [];
        for(var i = 0; i < uniqueTickers.length; i++) {
            if(gdaxCoins.includes(uniqueTickers[i])) {
                gdaxPricesNeeded.push(uniqueTickers[i]);
                uniqueTickers[i] = null;
            }
        }
        otherPricesNeeded = []
        for(var i = 0; i < uniqueTickers.length; i++) {
            if(uniqueTickers[i] != null) {
                otherPricesNeeded.push(uniqueTickers[i]);
            }
        }
        if(gdaxPricesNeeded.length > 0) {
            ajaxCalls += 1;
        }
        if(otherPricesNeeded.length > 0) {
            ajaxCalls += 1;
        }
        if(ajaxCalls == 0) {
            ajaxCalls = -1;
            generateTable();
        }
        if(gdaxPricesNeeded.length > 0) {
            getGDAXPrices(gdaxPricesNeeded);
        }
        if(otherPricesNeeded.length > 0) {
            getOtherPrices(otherPricesNeeded);
        }
    });
});