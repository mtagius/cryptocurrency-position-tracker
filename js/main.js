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

function generateTable() {
    canRefresh = true;
    if(ajaxCalls == 0) {
        var table = "<table><tr><th>Icon</th><th>Coin</th><th>Ticker</th><th>Current Price</th><th>Coin Amount</th>" +
            "<th>Purchase Price</th><th>Fees</th><th>Percent Change</th><th>Gross</th><th>Net</th></tr>";
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
            table += "<tr>";
            table += "<td><img src='img/" + tickerToName(my.positions[i].ticker).toLowerCase() + ".png'></td>";
            table += "<td>" + tickerToName(my.positions[i].ticker) + "</td>";
            table += "<td>" + my.positions[i].ticker + "</td>";
            table += "<td>$" + coinPrice + "</td>";
            table += "<td>" + my.positions[i].coinAmount + "</td>";
            table += "<td>$" + my.positions[i].purchasePrice + "</td>";
            table += "<td>$" + my.positions[i].fee + "</td>";
            table += "<td>" + (((coinPrice - my.positions[i].purchasePrice) / my.positions[i].purchasePrice) * 100).toFixed(2) + "%</td>";
            table += "<td>$" + ((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)).toFixed(2) + "</td>";
            table += "<td>$" + (((coinPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) - (my.positions[i].fee)).toFixed(2) + "</td>";
            table += "</tr>";
        }
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