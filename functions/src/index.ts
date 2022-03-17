import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const pdf = require("html-pdf");
admin.initializeApp();

const runtimeOpts: any = {
  timeoutSeconds: 540,
  memory: "2GB",
};

const useReceiptHtml = (body: any) => {
  let createdTemplate = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link href='https://fonts.googleapis.com/css?family=Libre Barcode 39' rel='stylesheet'>
    <style type="text/css">
      body {
        margin: 50px 30px;
      }

      .d-flex {
        display: -webkit-box;
        display: -webkit-flex;
        -webkit-flex-wrap: wrap;
        display: flex;
        flex-wrap: wrap;
      }

      .info-table tr {
        border-bottom: 1px solid #ababab;
      }

      .content table,
      .content tr,
      .content th,
      .content td {
        border: 1px solid;
      }

      .order-table td {
        text-align: center;
      }

      td {
        padding: 5px;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .font-normal {
        font-style: normal;
      }

      .font-mono {
        font-family: 'Courier New', Courier, monospace;
        font-style: normal;
        text-transform: uppercase;
      }

      table {
        width: 100%;
        font-style: italic;
        font-size: 9px;
        border-collapse: collapse;
      }

      .padding-l-30 {
        padding-left: 30px;
      }

      .padding-y-80 {
        padding: 80px 0;
      }

      .content {
        font-size: 9px;
        font-style: italic;
      }

      .text-address {
        font-size: 10px;
        font-style: normal;
        text-transform: uppercase;
        font-weight: bold;
      }

      .text-header2 {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
      }

      .text-barcode {
        font-family: 'Libre Barcode 39';
        font-size: 30px;
        text-align: center;
      }

      .footer {
        width: 100%;
        position: absolute;
        bottom: 50px;
        padding-left: 20px;
        padding-right: 20px;
      }

      .signature_div {
        position: relative;
        width: 200px;
        border-bottom: 1px solid grey;
      }

      .signature {
        position: absolute;
        width: 100%;
        top: -55px;
      }
    </style>
  </head>

  <body>
    <div class="text-header2">Delivery Receipt</div><br>
    <div class="d-flex">
      <div style="width: 50%;">
      </div>
      <div style="width: 50%;">
        <table class="info-table">
          <tr>
            <td><b>No</b></td>
            <td class="font-mono">${body.receipt_no || ''}</td>
          </tr>
          <tr>
            <td>Date:</td>
            <td class="font-mono">${body.shipping_date || ''}</td>
          </tr>
          <tr>
            <td>PO:</td>
            <td class="font-mono">${body.po_number || ''}</td>
          </tr>
        </table>
      </div>
    </div>
    <br>
    <div class="content">
      <div class="d-flex">
        <div style="width: 50%;">
          <div class="padding-l-30">From:</div>
        </div>
        <div style="width: 50%;">
          <div class="padding-l-30">To:</div>
        </div>
      </div>
      <br>
      <table>
        <tr>
          <th>Company Details</th>
          <th>Customer Details</th>
        </tr>
        <tr>
          <td>Company Name: <span class="font-mono">${body.shipping_company || ''}</span></td>
          <td>Customer Name: <span class="font-mono">${body.dropoff_company || ''}</span></td>
        </tr>
        <tr>
          <td>Address: <span class="font-mono">${body.shipping_address || ''}</span> 
            <br> <span class="font-mono padding-l-30">${body.shipping_city || ''}, ${body.shipping_state || ''} ${body.shipping_zipcode || ''}</span></td>
          <td>Address: <span class="font-mono">${body.dropoff_address || ''}</span>
            <br> <span class="font-mono padding-l-30">${body.dropoff_city || ''}, ${body.dropoff_state || ''} ${body.dropoff_zipcode || ''}</span></td>
        </tr>
        <tr>
          <td>Phone: <span class="font-mono">${body.shipping_phone || ''}</span></td>
          <td>Phone: <span class="font-mono">${body.dropoff_phone || ''}</span></td>
        </tr>
        <tr>
          <td>Email: <span class="font-mono">${body.shipping_email || ''}</span></td>
          <td>Email: <span class="font-mono">${body.dropoff_email || ''}</span></td>
        </tr>
      </table>
      <br>
      <table class="order-table">
        <tr>
          <th>Item</th>
          <th style="width: 50%;">Description</th>
          <th>No. of Units</th>
          <th>Amount</th>
        </tr>
        `;
  let total = 0;
  for (let item of body.items) {
    createdTemplate += `
      <tr class="font-mono">
        <td>${item.name || ''}</td>
        <td>${item.desc || ''}</td>
        <td>${item.no || ''}</td>
        <td>${item.amount || ''}</td>
      </tr>`;
    total += item.amount;
  }
  createdTemplate += `
        <tr>
          <td colspan="4" style="text-align: right;">
            Total: ${total}
          </td>
        </tr>
      </table>
      <div class="footer d-flex">
        <div>Received By:</div>
        <div class="signature_div">${body.signature_link ? `<img src="${body.signature_link}" class="signature" alt="">` : ''}</div>
      </div>
    </div>
    </body>`;
  return createdTemplate;
}

const useQuoteHTML = (body: any) => {
  let createdTemplate = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link href='https://fonts.googleapis.com/css?family=Libre Barcode 39' rel='stylesheet'>
    <style type="text/css">
      body {
        margin: 50px 30px;
        font-size: 10px;
      }

      .d-flex {
        display: -webkit-box;
        display: -webkit-flex;
        -webkit-flex-wrap: wrap;
        display: flex;
        flex-wrap: wrap;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .font-normal {
        font-style: normal;
      }

      .font-mono {
        font-family: 'Courier New', Courier, monospace;
        font-style: normal;
        text-transform: uppercase;
      }

      table {
        font-size: inherit;
        width: 100%;
        border-collapse: collapse;
      }

      th {
        border-top: solid 1px lightgrey;
        border-bottom: solid 1px lightgrey;
        background-color: #f2f2f2;
      }

      td {
        padding: 5px;
        text-align: center;
      }

      .padding-l-30 {
        padding-left: 30px;
      }

      .padding-y-80 {
        padding: 80px 0;
      }

      .text-address {
        font-style: normal;
        text-transform: uppercase;
        font-weight: bold;
      }

      .text-header2 {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
      }

      .text-subheader {
        padding-left: 10px;
        width: calc(20% - 12px);
        border-left: solid 2px lightgrey;
      }

      .text-barcode {
        font-family: 'Libre Barcode 39';
        font-size: 30px;
        text-align: center;
      }

      .footer {
        width: 100%;
        position: absolute;
        bottom: 50px;
        padding-left: 20px;
        padding-right: 20px;
      }

      .signature_div {
        position: relative;
        width: 200px;
        border-bottom: 1px solid grey;
      }

      .signature {
        position: absolute;
        width: 100%;
        top: -55px;
      }
    </style>
  </head>

  <body>
    <div class="d-flex">
      <div style="width: 20%;"><img
          src="https://firebasestorage.googleapis.com/v0/b/shureprint.appspot.com/o/logo.png?alt=media&token=3d35f50c-7ab3-4d84-aedb-af467e97dc88"
          width="100%" alt=""></div>
      <div style="width: 80%; font-size: 18px; font-weight: bold; color: grey; text-align: right;">Quote</div>
    </div>
    <br>
    <div class="d-flex">
      <div class="text-subheader">
        <b>Created Date</b><br>
        ${body.created_date || ''}
      </div>
      <div class="text-subheader">
        <b>Created By</b><br>
        ${body.created_by || ''}
      </div>
      <div class="text-subheader">
        <b>ETD</b><br>
        ${body.etd || ''}
      </div>
      <div class="text-subheader">
        <b>Ref</b><br>
        ${body.ref || ''}
      </div>
      <div class="text-subheader">
        <b>Customer PO No</b><br>
        ${body.customer_no || ''}
      </div>
    </div>
    <hr>
    <div class="d-flex">
      <div style="width: 50%;">
        <b>Customer:</b><br>
        <b>${body.customer_company || ''}</b><br>
        ${body.customer_name || ''}<br>
        ${body.customer_address || ''}<br>
        ${body.customer_city || ''}, ${body.customer_state || ''} ${body.customer_zipcode || ''}
      </div>
      <div style="width: 50%;">
        <b>Ship To:</b><br>
        <b>${body.billing_company || ''}</b><br>
        ${body.billing_name || ''}<br>
        ${body.billing_address || ''}<br>
        ${body.billing_city || ''}, ${body.billing_state || ''} ${body.billing_zipcode || ''}<br>
        <br>
        <b>Notes: price does not include sales tax or shipping</b>
      </div>
    </div>
    <br>
    <div class="content">
      <table>
        <tr>
          <th width="10%">Code</th>
          <th width="30%" style="text-align: left;">Item</th>
          <th width="10%">Options</th>
          <th width="10%">Qty</th>
          <th width="10%">Unit Price</th>
          <th width="10%">Discount</th>
          <th width="10%">Sub Total</th>
        </tr>`;
  for (let item of body.items) {
    createdTemplate += `
        <tr>
          <td>${item.code || ''}</td>
          <td style="text-align: left;">${item.name || ''}</td>
          <td>${item.option || ''}</td>
          <td>${item.qty || '0'}</td>
          <td>$${item.unit_price || '0.00'}</td>
          <td>${item.discount ? ('$' + item.discount) : ''}</td>
          <td>$${item.sub_total || '0.00'}</td>
        </tr>`;
  }
  createdTemplate += `
      </table>
      <hr>
      <div class="d-flex">
        <div style="width: 60%">
          <b>Payment Terms</b>
        </div>
        <div style="width: 40%;">
          <div class="d-flex">
            <div style="width: 50%; text-align: right;">
              Product Cost: <br>
              Surcharge: <br>
              Delivery Details:
            </div>
            <div style="width: 50%; text-align: right;">
              $${body.product_cost || '0.00'} <br>
              $${body.surcharge || '0.00'} <br>
              $${body.delivery_details || '0.00'}
            </div>
          </div>
          <hr>
          <div class="d-flex">
            <div style="width: 50%; text-align: right;">
              Discount: <br>
              Sub Total: <br>
              Tax (9.5%):
            </div>
            <div style="width: 50%; text-align: right;">
              $$${body.discount || '0.00'} <br>
              $$${body.sub_total || '0.00'} <br>
              $$${body.tax || '0.00'}
            </div>
          </div>
          <br>

          <div class="d-flex">
            <div style="width: 50%; text-align: right; font-weight: bold;">
              Total (USD):
            </div>
            <div style="width: 50%; text-align: right; font-weight: bold;">
              $$${body.total || '0.00'}
            </div>
          </div>
        </div>
      </div>
      <hr>
      <div class="footer d-flex">
        <div>Received By:</div>
        <div class="signature_div">${body.signature_link ? `<img src="${body.signature_link}" class="signature" alt="">` : ''}</div>
      </div>
    </div>
  </body>`;
  return createdTemplate;
}


export const generateReceiptDoc = functions.runWith(runtimeOpts).https.onRequest(async (request: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(request.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(request.body);
      let html = useReceiptHtml(body);
      let file = admin.storage().bucket().file(`receipt_${body.receipt_no}${body.signature_link ? '_signed' : ''}.pdf`)
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: "0",
        orientation: "portrait"
      }).toBuffer((err: any, buffer: any) => {
        if (err) {
          response.status(500).send('error creating document');
        }
        file.save(buffer, (stuff: any) => {
          if (!stuff) {
            file.makePublic().then(() => {
              file.getMetadata().then((meta) => {
                response.type("application/text");
                response.status(200).send(meta[0].mediaLink);
              })
            })
          }
        })
      });
    } catch {
      response.status(500).send('error getting content');
    }
  }
});

export const generateQuoteDoc = functions.runWith(runtimeOpts).https.onRequest(async (request: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(request.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(request.body);
      let html = useQuoteHTML(body);
      let file = admin.storage().bucket().file(`quote_${body.ref}${body.signature_link ? '_signed' : ''}.pdf`)
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: "0",
        orientation: "portrait"
      }).toBuffer((err: any, buffer: any) => {
        if (err) {
          response.status(500).send('error creating document');
        }
        file.save(buffer, (stuff: any) => {
          if (!stuff) {
            file.makePublic().then(() => {
              file.getMetadata().then((meta) => {
                response.type("application/text");
                response.status(200).send(meta[0].mediaLink);
              })
            })
          }
        })
      });
    } catch {
      response.status(500).send('error getting content');
    }
  }
});