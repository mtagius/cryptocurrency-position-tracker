supported = {
    "coins": [ 
        {BTC:"Bitcoin"}, 
        {ETH:"Ether"},
        {BCH:"Bitcoin Cash"},
        {XRP:"Ripple"},
        {LTC:"Litecoin"},
        {ADA:"Cardano"},
        {IOTA:"IOTA"},
        {DASH:"Dash"},
        {XEM:"NEM"},
        {EOS:"EOS"},
        {XMR:"Monero"},
        {BTG:"Bitcoin Gold"},
        {QTUM:"Qtum"},
        {XVG:"Verge"},
        {ZEC:"Zcash"},
        {USDT:"Tether"},
        {DOGE:"Dogecoin"},
        {VTC:"Vertcoin"}
    ]
};
my = null;
gdaxCoins = ["BTC", "ETH", "LTC", "BCH"];
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

function formatNumber(number,shouldRound) {
    number = parseFloat(number);
    if((shouldRound == 1) || ((shouldRound == 0) && (number > .1))) {
        number = number.toFixed(2);
    }
    if(String(number).search(/\./g) == -1) {
        number = String(number) + ".";
    }
    number = String(number).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    if(number.endsWith(".")) {
        number = number.slice(0, -1);
    }
    return number;
}

function coinHyperlink(ticker) {
    var coinName = tickerToName(ticker);
    coinName = coinName.replace(/ /g, "-");
    if(coinName == "Ether") {
        coinName = "ethereum";
    }
    return "https://coinmarketcap.com/currencies/" + coinName;
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
        var table = "<h1>Open Positions</h1><table><tr class='table-header'><th></th><th>Coin</th><th>Ticker</th><th>Current Price</th><th>Coin Amount</th>" +
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
                table += "<td class='coin-logos'><img src='img/" + tickerToName(my.positions[i].ticker).toLowerCase().replace(/ /g,'') + ".png'></td>";
                table += "<td>" + tickerToName(my.positions[i].ticker) + "</td>";
                table += "<td>" + "<a href='" + coinHyperlink(my.positions[i].ticker) + "' target='_blank'>" + my.positions[i].ticker + "</a></td>";
                table += "<td>$" + formatNumber(coinPrice, 0) + "</td>";
                table += "<td>" + formatNumber(my.positions[i].coinAmount, -1) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice, 0) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].fee, 0) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice * my.positions[i].coinAmount, 0) + "</td>";
                table += "<td>$" + formatNumber(coinPrice * my.positions[i].coinAmount, 0)  + "</td>";
                textClass = percentChange >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>" + formatNumber(percentChange, 1) + "%</td>";
                textClass = gross >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(gross, 1) + "</td>";
                textClass = net >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(net, 1) + "</td>";
                table += "<td><span class='glyphicon glyphicon-usd main-table-icon' onclick='sellPosition(" + i + ")'></span>";
                table += "<span class='glyphicon glyphicon-remove main-table-icon' onclick='removePosition(" + i + ")'></span></td></tr>";
            }
        }
        if(unsoldPositions == true) {
            var totalPercent = (((totalCurrentPrice - totalPurchasePrice) / totalPurchasePrice) * 100);
            table += "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td>Total:</td><td>$" + 
                formatNumber(totalPurchasePrice, 1) + "</td><td>$" + formatNumber(totalCurrentPrice, 1) + "</td>";
            textClass = totalPercent >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>" + formatNumber(totalPercent, 1) + "%</td>";
            textClass = totalGross >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalGross, 1) + "</td>";
            textClass = totalNet >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalNet, 1) + "</td></tr>";
            table += "</table>";
            grandTotalGross += totalGross;
            grandTotalNet += totalNet;
        } else {
            table = "";
        }
        $("#mainTable").html(table);
        table = "<h1>Closed Positions</h1><table><tr class='table-header'><th></th><th>Coin</th><th>Ticker</th><th>Sold Price</th><th>Coin Amount</th>" +
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
                var gross = ((soldPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount));
                totalGross += gross;
                var net = (((soldPrice * my.positions[i].coinAmount) - (my.positions[i].purchasePrice * my.positions[i].coinAmount)) - (my.positions[i].fee));
                totalNet += net;
                table += "<tr>";
                table += "<td class='coin-logos'><img src='img/" + tickerToName(my.positions[i].ticker).toLowerCase().replace(/ /g,'') + ".png'></td>";
                table += "<td>" + tickerToName(my.positions[i].ticker) + "</td>";
                table += "<td>" + "<a href='" + coinHyperlink(my.positions[i].ticker) + "' target='_blank'>" + my.positions[i].ticker + "</a></td>";
                table += "<td>$" + formatNumber(soldPrice, 0) + "</td>";
                table += "<td>" + formatNumber(my.positions[i].coinAmount, -1) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice, 0) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].fee, 0) + "</td>";
                table += "<td>$" + formatNumber(my.positions[i].purchasePrice * my.positions[i].coinAmount, 0) + "</td>";
                table += "<td>$" + formatNumber(soldPrice * my.positions[i].coinAmount, 0)  + "</td>";
                textClass = percentChange >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>" + formatNumber(percentChange, 1) + "%</td>";
                textClass = gross >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(gross, 1) + "</td>";
                textClass = net >= 0 ? "make-it-rain" : "losing-money";
                table += "<td class='" + textClass + "'>$" + formatNumber(net, 1) + "</td>";
                table += "<td><span class='glyphicon glyphicon-remove' onclick='removePosition(" + i + ")'></span></td></tr>";
            }
        }
        if(soldPositions == true) {
            table += "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>Total:</td>";
            textClass = totalGross >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalGross, 1) + "</td>";
            textClass = totalNet >= 0 ? "make-it-rain" : "losing-money";
            table += "<td class='" + textClass + "'>$" + formatNumber(totalNet, 1) + "</td></tr>";
            table += "</table>";
            grandTotalGross += totalGross;
            grandTotalNet += totalNet;
        } else {
            table = "";
        }
        $("#soldTable").html(table);
        if(($("#mainTable").html() != "") && ($("#soldTable").html() != "")) {
            var totals = "<h1>Total</h1>";
            textClass = grandTotalGross >= 0 ? "make-it-rain" : "losing-money";
            totals += "<table><tr><td>Gross:</td><td><span class='" + textClass + "' >$" + formatNumber(grandTotalGross, 1) + "</span></td></tr>";
            textClass = grandTotalNet >= 0 ? "make-it-rain" : "losing-money";
            totals += "<tr><td>Net:</td><td><span class='" + textClass + "' >$" + formatNumber(grandTotalNet, 1) + "</span></td></tr></table>";
            $("#totals").html(totals);
        }
        if($("#mainTable").html() == "") {
            $("#mainTable").css({"margin-bottom": "0px"});
        } else {
            $("#mainTable").css({"margin-bottom": "100px"});
        }
        if(($("#mainTable").html() == "") && ($("#soldTable").html() == "")) {
            $("#mainTable").html("<h1>Click the button to add your first Position!</h1>");
        }
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
        $("#sellForm").submit( function (e) {
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
        $("#addForm").submit( function (e) {
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
    $('#particles').particleground({
        dotColor: '#ebebeb',
        lineColor: '#ebebeb',
        density: 15000,
        minSpeedX: .1,
        maxSpeedX: 1,
        minSpeedY: .1,
        maxSpeedY: 1,
        particleRadius: 15,
        parallaxMultiplier: 10,
        proximity: 120
    });
    $("#refreshButton").on('click', function() {
        refresh();
    });
    $("#addButton").on('click', function() {
        addPosition();
    });
});