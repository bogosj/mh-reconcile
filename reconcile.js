window._fileContents = {};

function readFile(e) {
    let file = e.target.files[0];
    let fileType = e.target.id;
    if (!file) {
        return;
    }
    let reader = new FileReader();
    reader.onload = function(e) {
        let contents = e.target.result;
        window._fileContents[fileType] = contents;
    };
    reader.readAsText(file);
}

function findColumn(wepayData, columnName) {
    for (let i=0; i<wepayData[0].length; i++) {
        if (wepayData[0][i] == columnName) {
            return i;
        }
    }
    alert(`Could not find the column ${columnName}.`);
}

function getColumnData(wepayData, columnId) {
    let data = [];
    for (let i=1; i<wepayData.length; i++) {
        data.push(wepayData[i][columnId]);
    }
    return data;
}

function filterOrders(memberhubData, paymentIds, paymentColumn, lineItemNameColumn, lineItemTotalColumn) {
    let data = [];
    for (let i=1; i<memberhubData.length; i++) {
        if (paymentIds.includes('C'+memberhubData[i][paymentColumn])) {
            data.push(
                [
                    memberhubData[i][lineItemNameColumn],
                    memberhubData[i][lineItemTotalColumn]
                ]
            );
        }
    }
    return data;
}

function displayTotals(netSettled, lineItemValues) {
    let div = document.getElementById('totals');
    div.innerHTML = '';
    div.innerHTML += `<br /><strong>WePay reports net settlement of:</strong> ${netSettled}`;
    div.innerHTML += '<br /><br /><strong>Line item totals from MemberHub:</strong><br />';
    let calculatedTotal = 0;
    let keys = Object.keys(lineItemValues);
    for (let i=0; i<keys.length; i++) {
        let key = keys[i];
        let value = lineItemValues[keys[i]]
        calculatedTotal += value;
        div.innerHTML += `${key}: ${value}<br />`;
    }
    div.innerHTML += `Calculated Total From MemberHub: ${calculatedTotal}`;
}

function reconcile(e) {
    if (!window._fileContents['wepay'] || !window._fileContents['memberhub']) {
        alert('Both files are required.');
        return;
    }
    let wepay = Papa.parse(window._fileContents['wepay']);
    let memberhub = Papa.parse(window._fileContents['memberhub']);

    let paymentIdColumn = findColumn(wepay.data, 'payment_id');
    let paymentIds = getColumnData(wepay.data, paymentIdColumn);

    let netSettledColumn = findColumn(wepay.data, 'net_settled');
    let netSettled = getColumnData(wepay.data, netSettledColumn)[0];

    let mPaymentIdColumn = findColumn(memberhub.data, 'Payment ID');
    let mLineItemNameColumn = findColumn(memberhub.data, 'Line Item Name');
    let mLineItemTotal = findColumn(memberhub.data, 'Line Item Total');

    let filteredOrders = filterOrders(
        memberhub.data,
        paymentIds,
        mPaymentIdColumn,
        mLineItemNameColumn,
        mLineItemTotal);
    
    let values = {};
    for (let i=0; i<filteredOrders.length; i++) {
        let amount = parseFloat(filteredOrders[i][1].replace(/\$/, ''))
        if (!values[filteredOrders[i][0]]) { values[filteredOrders[i][0]]=0; }
        values[filteredOrders[i][0]] += amount;
    }
    displayTotals(netSettled, values);
}

document.getElementById('loading').style.display = 'none';
document.getElementById('content').style.display = 'block';
document.getElementById('wepay').addEventListener('change', readFile);
document.getElementById('memberhub').addEventListener('change', readFile);
document.getElementById('reconcile').addEventListener('click', reconcile);