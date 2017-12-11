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

function formatNumber(number, round) {
    number = parseFloat(number);
    if(number > 0.10 || number < -0.1) {
        number = round > 0 ? number.toFixed(round) : number;
    }
    number = String(number).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    return number;
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
        var table = "<table><tr><th></th><th>Coin</th><th>Ticker</th><th>Current Price</th><th>Coin Amount</th>" +
            "<th>Purchase Price</th><th>Fees</th><th>Initial Investment</th><th>Current Worth</th><th>Percent Change</th><th>Gross</th><th>Net</th><th></th></tr>";
        var totalGross = 0;
        var totalNet = 0;
        var totalPurchasePrice = 0;
        var totalCurrentPrice = 0;
        var textClass = "";
        var unsoldPositions = false;
        var grandTotalGross = 0;
        var grandTotalNet = 0;
        for(var i = 0; i < my.positions.length; i++) {
            if(my.positions[i].sellPrice == -1) {
                unsoldPositions = true;
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
                table += "<td>$" + formatNumber(coinPrice, 2) + "</td>";
                table += "<td>" + formatNumber(my.positions[i].coinAmount, -1) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice, 2) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].fee, 2) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice * my.positions[i].coinAmount, 2) + "</td>";
                table += "<td>$" + formatNumber(coinPrice * my.positions[i].coinAmount, 2)  + "</td>";
                textClass = percentChange >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>" + formatNumber(percentChange, 2) + "%</td>";
                textClass = gross >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(gross, 2) + "</td>";
                textClass = net >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(net, 2) + "</td>";
                table += "<td><span class='glyphicon glyphicon-remove' onclick='removePosition(" + i + ")'></span>";
                table += "<span class='glyphicon glyphicon-usd' onclick='sellPosition(" + i + ")'></td>";
                table += "</tr>";
            }
        }
        if(unsoldPositions == true) {
            var totalPercent = (((totalCurrentPrice - totalPurchasePrice) / totalPurchasePrice) * 100);
            table += "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td>Total:</td><td>$" + 
                formatNumber(totalPurchasePrice, 2) + "</td><td>$" + formatNumber(totalCurrentPrice, 2) + "</td>";
            textClass = totalPercent >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>" + formatNumber(totalPercent, 2) + "%</td>";
            textClass = totalGross >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalGross, 2) + "</td>";
            textClass = totalNet >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalNet, 2) + "</td></tr>";
            table += "</table>";
            grandTotalGross += totalGross;
            grandTotalNet += totalNet;
        } else {
            table = "<h2>No Unsold Positions</h2>";
        }
        $("#mainTable").html(table);
        table = "<table><tr><th></th><th>Coin</th><th>Ticker</th><th>Sold Price</th><th>Coin Amount</th>" +
        "<th>Purchase Price</th><th>Fees</th><th>Initial Investment</th><th>Sold Value</th><th>Percent Change</th><th>Gross</th><th>Net</th><th></th></tr>";
        totalGross = 0;
        totalNet = 0;
        totalPurchasePrice = 0;
        totalCurrentPrice = 0;
        textClass = "";
        soldPositions = false;
        for(var i = 0; i < my.positions.length; i++) {
            if(my.positions[i].sellPrice != -1) {
                soldPositions = true;
                var soldPrice = parseFloat(my.positions[i].sellPrice);
                var percentChange = (((soldPrice - my.positions[i].purchasePrice) / my.positions[i].purchasePrice) * 100);
                totalPurchasePrice += (my.positions[i].purchasePrice * my.positions[i].coinAmount);
                totalCurrentPrice += (soldPrice  * my.positions[i].coinAmount);
                var gross = ((soldPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount));
                totalGross += gross;
                var net = (((soldPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) - (my.positions[i].fee));
                totalNet += net;
                table += "<tr>";
                table += "<td><img src='img/" + tickerToName(my.positions[i].ticker).toLowerCase() + ".png'></td>";
                table += "<td>" + tickerToName(my.positions[i].ticker) + "</td>";
                table += "<td>" + my.positions[i].ticker + "</td>";
                table += "<td>$" + formatNumber(soldPrice, 2) + "</td>";
                table += "<td>" + formatNumber(my.positions[i].coinAmount, -1) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice, 2) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].fee, 2) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice * my.positions[i].coinAmount, 2) + "</td>";
                table += "<td>$" + formatNumber(soldPrice * my.positions[i].coinAmount, 2)  + "</td>";
                textClass = percentChange >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>" + formatNumber(percentChange, 2) + "%</td>";
                textClass = gross >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(gross, 2) + "</td>";
                textClass = net >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(net, 2) + "</td>";
                table += "<td><span class='glyphicon glyphicon-remove' onclick='removePosition(" + i + ")'></span></td></tr>";
            }
        }
        if(soldPositions == true) {
            var totalPercent = (((totalCurrentPrice - totalPurchasePrice) / totalPurchasePrice) * 100);
            table += "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td>Total:</td><td>$" + 
                formatNumber(totalPurchasePrice, 2) + "</td><td>$" + formatNumber(totalCurrentPrice, 2) + "</td>";
            textClass = totalPercent >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>" + formatNumber(totalPercent, 2) + "%</td>";
            textClass = totalGross >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalGross, 2) + "</td>";
            textClass = totalNet >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalNet, 2) + "</td></tr>";
            table += "</table>";
            grandTotalGross += totalGross;
            grandTotalNet += totalNet;
        } else {
            table = "<h2>No Sold Positions</h2>";
        }
        $("#soldTable").html(table);
        var totals = "";
        textClass = grandTotalGross >= 0 ? "make-it-rain" : "losing-money";
        totals += "Gross: <span class='" + textClass + "' >" + formatNumber(grandTotalGross, 2) + "</span><br>";
        textClass = grandTotalNet >= 0 ? "make-it-rain" : "losing-money";
        totals += "Net: <span class='" + textClass + "' >" + formatNumber(grandTotalNet, 2) + "</span>";
        $("#totals").html(totals);
        console.log("Wrote Tables to Page");
    } else if (ajaxCalls == -1) {
        alert("No Positions. :(");
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
            console.log("PHP removed position at index: " + index);
            readPositions();
        }
    });
}

function sellPosition(index) {
    $.get("html/sell.html", function (data) {
        $("#modalContainer").html(data);
        $("#sellPositionModal").modal("show");
        $("#sellPositionInModal").on('click', function (e) {
            var sellPrice = $("#coinPrice").val();
            e.preventDefault();
            e.stopImmediatePropagation();
            $.ajax({
                url: "php/sellPosition.php",
                type: "POST",
                data: {
                    index: index,
                    sellPrice, sellPrice},
                success: function(result) {
                    console.log("PHP sold position at index " + index + " for the price of $" + sellPrice);
                    readPositions();
                }
            });
            $("#sellPositionModal").modal("hide");
        });
    });
}

function addPosition() {
    $.get("html/add.html", function (data) {
        $("#modalContainer").html(data);
        $("#coinsListToAdd").empty();
        for (var i = 0; i < supported.coins.length; i++) {
            $("#coinsListToAdd").append("<option value=\"" + Object.values(supported.coins[i]) +
                "\">" + Object.values(supported.coins[i]) + "</option>");
        }
        $("#addPositionModal").modal("show");
        $("#addPositionInModal").on('click', function (e) {
            var newPosition = {
                "ticker": nameToTicker($("#coinsListToAdd").val()),
                "coinAmount": $("#coinAmount").val(),
                "purchasePrice": $("#purchasePrice").val(),
                "fee": $("#fee").val(),
                "sellPrice": "-1"
            };
            e.preventDefault();
            e.stopImmediatePropagation();
            $.ajax({
                url: "php/addPosition.php",
                type: "POST",
                data: newPosition,
                success: function (result) {
                    console.log("PHP added New Position!");
                    readPositions();
                }
            });
            $("#addPositionModal").modal("hide");
        });
    });
}

function refresh() {
    if(canRefresh) {
        canRefresh = false;
        createAjaxRequests();
        $("#refreshButton").addClass('disabled');
        setTimeout(function() {
            $("#refreshButton").removeClass('disabled');
            canRefresh = true;
        }, 5000);
    }
}

$(document).ready(function() {
    readPositions();
    $("#refreshButton").on('click', function() {
        refresh();
    });
    $("#addButton").on('click', function() {
        addPosition();
    });
});