supported = {
    "coins": [ 
        {BTC:"Bitcoin"}, 
        {VTC:"Vertcoin"}
    ]
};
my = null;
gdaxCoins = ["BTC", "ETH", "LTC"];
gdaxPricesNeeded = [];
otherPricesNeeded = [];
gdaxResults = null;
otherResults = null;
ajaxCalls = 0;
canRefresh = true;

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
            console.log("Received GDAX Prices");
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
            console.log("Received Other Prices");
            generateTable();
        }
    });
}

function createAjaxRequests() {
    ajaxCalls = 0;
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
    console.log("Created Ajax Requests")
}

function tickerToName(ticker) {
    for(var i = 0; i < supported.coins.length; i++) {
        if(ticker == Object.keys(supported.coins[i])) {
            return Object.values(supported.coins[i])[0];
        }
    }
    return null;
}

function nameToTicker(name) {
    for(var i = 0; i < supported.coins.length; i++) {
        if(name == Object.values(supported.coins[i])) {
            return Object.keys(supported.coins[i])[0];
        }
    }
    return null;
}

function sortPositionsByKey(key) {
    return my.positions.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function generateTable() {
    canRefresh = true;
    if(ajaxCalls == 0) {
        var table = "<table><tr><th></th><th>Coin</th><th>Ticker</th><th>Current Price</th><th>Coin Amount</th>" +
            "<th>Purchase Price</th><th>Fees</th><th>Initial Investment</th><th>Current Worth</th><th>Percent Change</th><th>Gross</th><th>Net</th><th></th></tr>";
            var totalGross = 0;
            var totalNet = 0;
            var totalPurchasePrice = 0;
            var totalCurrentPrice = 0;
            var textClass = "";
        for(var i = 0; i < my.positions.length; i++) {
            var coinPrice = 0;
            if(gdaxResults != null) {
                if(gdaxResults.hasOwnProperty(my.positions[i].ticker)) {
                    coinPrice = gdaxResults[my.positions[i].ticker].USD;
                } else {
                    coinPrice = otherResults[my.positions[i].ticker].USD;
                }
            } else {
                coinPrice = otherResults[my.positions[i].ticker].USD;
            }
            var percentChange = (((coinPrice - my.positions[i].purchasePrice) / my.positions[i].purchasePrice) * 100);
            if(percentChange >= 0) {
                textClass = "make-it-rain";
            } else {
                textClass = "losing-money";
            }
            totalPurchasePrice += (my.positions[i].purchasePrice * my.positions[i].coinAmount);
            totalCurrentPrice += (coinPrice  * my.positions[i].coinAmount);
            var gross = ((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount));
            totalGross += gross;
            var net = (((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) - (my.positions[i].fee));
            totalNet += net;
            table += "<tr>";
            table += "<td><img src='img/" + tickerToName(my.positions[i].ticker).toLowerCase() + ".png'></td>";
            table += "<td>" + tickerToName(my.positions[i].ticker) + "</td>";
            table += "<td>" + my.positions[i].ticker + "</td>";
            table += "<td>$" + coinPrice.toFixed(2) + "</td>";
            table += "<td>" + my.positions[i].coinAmount + "</td>";
            table += "<td>$" + parseFloat(my.positions[i].purchasePrice).toFixed(2) + "</td>";
            table += "<td>$" + parseFloat(my.positions[i].fee).toFixed(2) + "</td>";
            table += "<td>$" + (my.positions[i].purchasePrice * my.positions[i].coinAmount).toFixed(2)  + "</td>";
            table += "<td>$" + (coinPrice * my.positions[i].coinAmount).toFixed(2)  + "</td>";
            table += "<td class='" + textClass + "'>" + percentChange.toFixed(2) + "%</td>";
            table += "<td class='" + textClass + "'>$" + gross.toFixed(2) + "</td>";
            table += "<td class='" + textClass + "'>$" + net.toFixed(2) + "</td>";
            table += "<td><span class='glyphicon glyphicon-remove' onclick='removePosition(" + i + ")'></span></td>";
            table += "</tr>";
        }
        var totalPercent = (((totalCurrentPrice - totalPurchasePrice) / totalPurchasePrice) * 100);
        table += "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td>Totals:</td><td>$" + 
            totalPurchasePrice.toFixed(2) + "</td><td>$" + totalCurrentPrice.toFixed(2) + "</td>";
        if(totalPercent >= 0) {
            textClass = "make-it-rain";
        } else {
            textClass = "losing-money";
        }
        table += "<td class='" + textClass + "'>" + totalPercent.toFixed(2) + "%</td>";
        if(totalGross >= 0) {
            textClass = "make-it-rain";
        } else {
            textClass = "losing-money";
        }
        table += "<td class='" + textClass + "'>$" + totalGross.toFixed(2) + "</td>";
        if(totalNet >= 0) {
            textClass = "make-it-rain";
        } else {
            textClass = "losing-money";
        }
        table += "<td class='" + textClass + "'>$" + totalNet.toFixed(2) + "</td></tr>";
        table += "</table>"
        $("#mainTable").html(table);
        console.log("Wrote Table to Page");
    } else if (ajaxCalls == -1) {
        alert("No Positions.");
    }
}

function readPositions() {
    canRefresh = false;
    $.getJSON("data/positions.json?nocache="+new Date(), function(positions) {
        my = positions;
        my.positions = sortPositionsByKey("ticker");
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
        console.log("Read the Positions")
        ajaxNotNeeded = true;
        for(var i = 0; i < gdaxPricesNeeded.length; i++) {
            if(gdaxResults != null) {
                if(!(gdaxResults.hasOwnProperty(gdaxPricesNeeded[i]))) {
                    ajaxNotNeeded = false;
                    break;
                }
            } else {
                ajaxNotNeeded = false;
                break;
            }
        }
        for(var i = 0; i < otherPricesNeeded.length; i++) {
            if(otherResults != null) {
                if(!(otherResults.hasOwnProperty(otherPricesNeeded[i]))) {
                    ajaxNotNeeded = false;
                    break;
                }
            } else {
                ajaxNotNeeded = false;
                break;
            }
        }
        if(ajaxNotNeeded) {
            ajaxCalls = 0;
            generateTable();
        } else {
            createAjaxRequests();
        }
    });
}

function removePosition(index) {
    $.ajax({
        url: "php/removePosition.php",
        type: "POST",
        data: {index: index},
        success: function(result) {
            console.log("PHP removed Position at index: " + index);
            readPositions();
        }
    });
}

$(document).ready(function() {
    readPositions();
    $("#refreshButton").on('click', function() {
        if(canRefresh) {
            canRefresh = false;
            createAjaxRequests();
            $("#refreshButton").addClass('disabled');
            setTimeout(function() {
                $("#refreshButton").removeClass('disabled');
                canRefresh = true;
            }, 5000);
        }
    });
    $("#addButton").on('click', function() {
        $("#coinsListToAdd").empty();
        for(var i = 0; i < supported.coins.length; i++) {
            $("#coinsListToAdd").append("<option value=\"" + Object.values(supported.coins[i]) +
                "\">" + Object.values(supported.coins[i]) + "</option>");
        }
        $("#addPositionModal").modal("show");
        $("#addPositionInModal").on('click', function(e) {
            var newPosition = {
                "ticker": nameToTicker($("#coinsListToAdd").val()),
                "coinAmount": $("#coinAmount").val(),
                "purchasePrice": $("#purchasePrice").val(),
                "fee": $("#fee").val()
            };
            e.preventDefault();
            e.stopImmediatePropagation();
            $.ajax({
                url: "php/addPosition.php",
                type: "POST",
                data: newPosition,
                success: function(result) {
                    console.log("PHP added New Position!");
                    readPositions();
                }
            });
            $("#coinAmount").val("");
            $("#purchasePrice").val("");
            $("#fee").val("");
            $("#addPositionModal").modal("hide");
        });
    });
});