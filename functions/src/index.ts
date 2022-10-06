import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const pdf = require("html-pdf");
const request = require('request').defaults({ encoding: null });
admin.initializeApp();
const { json2csvAsync } = require('json-2-csv');
const { getStorage, ref, getDownloadURL, uploadString } = require('firebase/storage');
const { initializeApp } = require('firebase/app');
const firebaseConfig = {
  storageBucket: 'gs://shureprint.appspot.com'
};
const app = initializeApp(firebaseConfig);

const runtimeOpts: any = {
  timeoutSeconds: 540,
  memory: "2GB",
};

const Mailjet = require('node-mailjet');

const mailjet = new Mailjet({
  apiKey: functions.config().MJ_APIKEY_PUBLIC || "a48d7d7b220cc74d7e900e6a2b802ba7",
  apiSecret: functions.config().MJ_APIKEY_PRIVATE || "7bca17218694f8e29b9859955ba5b85c"
});

const send = mailjet.post("send", { 'version': 'v3.1' });
const logoBase64 = "data:image/png;base64,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"

const company_id = 223218;
const ACCESS_TOKEN = "30646533633736342d323230332d343430632d393233322d396362363937613565643731";
const Upserve_API_KEY = "3048326406c4964a2b917b9518370685";

const useReceiptHtml = (body: any) => {
  let createdTemplate = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link href='https://fonts.googleapis.com/css?family=Libre Barcode 39' rel='stylesheet'>
    <style type="text/css">
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
        bottom: 20px;
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
    <div id="pageHeader">
      <div class="d-flex">
        <div style="width: 40%;"><img src="${logoBase64}" width="100%" alt=""></div>
        <div style="width: 60%; font-size: 18px; font-weight: bold; color: grey; text-align: right;">Delivery Receipt</div>
      </div>
    </div>
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
            <td class="font-mono">${body.po_number || '0'}</td>
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
            <br> <span class="font-mono padding-l-30">${body.shipping_city || ''}${body.shipping_state ? `, ${body.shipping_state}` : ''} ${body.shipping_zipcode || ''}</span></td>
          <td>Address: <span class="font-mono">${body.dropoff_address || ''}</span>
            <br> <span class="font-mono padding-l-30">${body.dropoff_city || ''}${body.dropoff_state ? `, ${body.dropoff_state}` : ''} ${body.dropoff_zipcode || ''}</span></td>
        </tr>
        <tr>
          <td>Phone: <span class="font-mono">${body.shipping_phone || ''}</span></td>
          <td>Phone: <span class="font-mono">${body.dropoff_phone || ''}</span></td>
        </tr>
        <tr>
          <td>Email: <span class="font-mono" style="text-transform: lowercase;">${body.shipping_email || ''}</span></td>
          <td>Email: <span class="font-mono" style="text-transform: lowercase;">${body.dropoff_email || ''}</span></td>
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
        font-size: 8.5px;
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
        border-left: solid 1px lightgrey;
      }

      .text-barcode {
        font-family: 'Libre Barcode 39';
        font-size: 30px;
        text-align: center;
      }

      .footer {
        width: 100%;
        margin-top: 100px;
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
    <div id="pageHeader">
      <div class="d-flex">
        <div style="width: 40%;"><img src="${logoBase64}" width="100%" alt=""></div>
        <div style="width: 60%; font-size: 15px; font-weight: bold; color: grey; text-align: right;">Quote</div>
      </div>
    </div>
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
    <br>
    <div class="d-flex">
      <div style="width: 50%;">
        <b>Customer:</b><br>
        ${body.billing_company || body.customer_company || ''}<br>
        ${body.billing_name || body.customer_name || ''}<br>
        ${body.billing_address || ''}<br>
        ${body.billing_city || ''}${body.billing_state ? `, ${body.billing_state}` : ''} ${body.billing_zipcode || ''}<br>
      </div>
      <div style="width: 50%;">
        <b>Ship To:</b><br>
        ${body.customer_company || ''}<br>
        ${body.customer_name || ''}<br>
        ${body.customer_address || ''}<br>
        ${body.customer_city || ''}${body.customer_state ? `, ${body.customer_state}` : ''} ${body.customer_zipcode || ''}
        <br><br>
        <b><i>Notes: price does not include sales tax or shipping</i></b>
      </div>
    </div>
    <br><br>
    <div class="content">
      <table>
      <thead style="display: table-header-group;">
        <tr>
          <th width="10%"></th>
          <th width="10%" style="text-align: left;">Code</th>
          <th width="10%" style="text-align: left;">Item</th>
          <th width="15%" style="text-align: left;">Note</th>
          <th width="5%">Qty</th>
          <th width="10%">Case Qty</th>
          <th width="10%">Unit Price</th>` + (!body.is_stock_quote ? `
          <th width="10%">Lead Time</th>
          <th width="5%">Set Ups</th>` : '') + (body.showPreviousPrice ? `
          <th width="10%">Previous Price</th>` : '') + (body.showDiscount ? `
          <th width="10%">Discount</th>` : '') + `
          <th width="10%">Sub Total</th>
        </tr></thead><tbody>`;
  for (let item of body.items) {
    createdTemplate += `
        <tr>
          <td><img src="${item.image_url || ''}" style="width:100%;padding:0;margin:0"></td>
          <td style="text-align: left;">${item.code || ''}</td>
          <td style="text-align: left;">${item.name || ''}</td>
          <td>${item.desc || ''}</td>
          <td>${item.qty || '0'}</td>
          <td>${item.case_qty || ''}</td>
          <td>$${item.unit_price ? item.unit_price.toFixed(2) : '0.00'}</td>` + (!body.is_stock_quote ? `
          <td>${item.leadTime || ''}</td>
          <td>${item.setups ? ('$' + item.setups.toFixed(2)) : ''}</td>` : '') + (body.showPreviousPrice ? `
          <td>${item.previous_price ? ('$' + item.previous_price.toFixed(2)) : ''}</td>` : '') + (body.showDiscount ? `
          <td>${item.discount ? ('$' + item.discount.toFixed(2)) : ''}</td>` : '') + `
          <td>$${item.sub_total ? item.sub_total.toFixed(2) : '0.00'}</td>
        </tr>`;
  }
  createdTemplate += `
      </tbody></table>
      <hr>` + (body.showPaymentDetails ? `
      <div class="d-flex">
        <div style="width: 60%">
          <b>Payment Terms</b>
        </div>
        <div style="width: 40%;">
          <div class="d-flex">
            <div style="width: 50%; text-align: right;">
              Product Cost:<br>
              Surcharge:<br>
              Delivery Details:
            </div>
            <div style="width: 50%; text-align: right;">
              $${body.product_cost ? body.product_cost.toFixed(2) : '0.00'}<br>
              $${body.surcharge ? body.surcharge.toFixed(2) : '0.00'}<br>
              $${body.delivery_details ? body.delivery_details.toFixed(2) : '0.00'}
            </div>
          </div>
          <hr>
          <div class="d-flex">
            <div style="width: 50%; text-align: right;">
              Discount:<br>
              Sub Total:<br>
              Tax (${(body.tax_rate || 0) * 100}%):
            </div>
            <div style="width: 50%; text-align: right;">
              $${body.discount ? body.discount.toFixed(2) : '0.00'}<br>
              $${body.sub_total ? body.sub_total.toFixed(2) : '0.00'}<br>
              $${body.tax ? body.tax.toFixed(2) : '0.00'}
            </div>
          </div>
          <br>

          <div class="d-flex">
            <div style="width: 50%; text-align: right; font-weight: bold;">
              Total (USD):
            </div>
            <div style="width: 50%; text-align: right; font-weight: bold;">
              $${body.total ? body.total.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>
      <hr> ` : ``) + `
      <div class="footer d-flex">
        <div>Received By:</div>
        <div class="signature_div">${body.signature_link ? `<img src="${body.signature_link}" class="signature" alt="">` : ''}</div>
      </div>
      <div id="pageFooter">
        <div style="width: 100%; text-align: center;">1318 N. Spring St Unit B Los Angeles CA 90012 United States</div>
      </div>
    </div>
  </body>`;
  return createdTemplate;
}


const useReturnHTML = (body: any) => {
  let createdTemplate = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link href='https://fonts.googleapis.com/css?family=Libre Barcode 39' rel='stylesheet'>
    <style type="text/css">
      body {
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
        border-left: solid 1px lightgrey;
      }

      .text-barcode {
        font-family: 'Libre Barcode 39';
        font-size: 30px;
        text-align: center;
      }

      .footer {
        width: 100%;
        position: absolute;
        bottom: 20px;
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
    <div id="pageHeader">
      <div class="d-flex">
        <div style="width: 40%;"><img src="${logoBase64}" width="100%" alt=""></div>
        <div style="width: 60%; font-size: 18px; font-weight: bold; color: grey; text-align: right;">Delivery Receipt</div>
      </div>
    </div>
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
        <b>Ref</b><br>
        ${body.ref || ''}
      </div>
      <div class="text-subheader">
        <b>Reason for return</b><br>
        ${body.reason || ''}
      </div>
      <div class="text-subheader">
        <b>Original Order Reference</b><br>
        ${body.original_reference || ''}
      </div>
    </div>
    <hr>
    <br>
    <div class="d-flex">
      <div style="width: 50%;">
        <b>Customer:</b><br>
        ${body.billing_company || body.customer_company || ''}<br>
        ${body.billing_name || body.customer_name || ''}<br>
        ${body.billing_address || ''}<br>
        ${body.billing_city || ''}${body.billing_state ? `, ${body.billing_state}` : ''} ${body.billing_zipcode || ''}<br>
      </div>
      <div style="width: 50%;">
        <b>Ship To:</b><br>
        ${body.customer_company || ''}<br>
        ${body.customer_name || ''}<br>
        ${body.customer_address || ''}<br>
        ${body.customer_city || ''}${body.customer_state ? `, ${body.customer_state}` : ''} ${body.customer_zipcode || ''}
        <br><br>
      </div>
    </div>
    <br><br>
    <div class="content">
      <table>
        <tr>
          <th width="10%">Code</th>
          <th width="30%" style="text-align: left;">Item</th>
          <th width="10%">Description</th>
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
          <td>${item.desc || ''}</td>
          <td>${item.qty || '0'}</td>
          <td>$${item.unit_price ? item.unit_price.toFixed(2) : '0.00'}</td>
          <td>${item.discount ? ('$' + item.discount.toFixed(2)) : ''}</td>
          <td>$${item.sub_total ? item.sub_total.toFixed(2) : '0.00'}</td>
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
              Sub Total:<br>
              Tax (${(body.tax_rate || 0) * 100}%):
            </div>
            <div style="width: 50%; text-align: right;">
              $${body.product_cost ? body.product_cost.toFixed(2) : '0.00'}<br>
              $${body.tax ? body.tax.toFixed(2) : '0.00'}
            </div>
          </div>
          <br>

          <div class="d-flex">
            <div style="width: 50%; text-align: right; font-weight: bold;">
              Total (USD):
            </div>
            <div style="width: 50%; text-align: right; font-weight: bold;">
              $${body.total ? body.total.toFixed(2) : '0.00'}
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


export const generateReceiptDoc = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(req.body);
      let html = useReceiptHtml(body);
      let file = admin.storage().bucket().file(`receipts/receipt_${body.receipt_no}${body.signature_link ? '_signed' : ''}.pdf`)
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: {
          "top": "50px",
          "right": "30px",
          "bottom": "30px",
          "left": "30px"
        },
        header: {
          height: "50px"
        },
        footer: {
          height: "30px"
        },
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

export const generateQuoteDoc = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(req.body);
      console.log(logoBase64);
      let html = useQuoteHTML(body);
      let file = admin.storage().bucket().file(`quotes/quote_${body.ref}${body.signature_link ? '_signed' : ''}.pdf`)
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: {
          "top": "20px",
          "right": "12px",
          "bottom": "40px",
          "left": "12px"
        },
        header: {
          height: "40px"
        },
        footer: {
          height: "40px"
        },
        orientation: "portrait"
      }).toBuffer((err: any, buffer: any) => {
        if (err) {
          console.log(err.message);
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
    } catch (err) {
      console.log(err.message);
      response.status(500).send('error getting content');
    }
  }
});

export const generateReturnDoc = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(req.body);
      let html = useReturnHTML(body);
      let file = admin.storage().bucket().file(`returns/return_${body.ref}${body.signature_link ? '_signed' : ''}.pdf`)
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: {
          "top": "50px",
          "right": "30px",
          "bottom": "30px",
          "left": "30px"
        },
        header: {
          height: "50px"
        },
        footer: {
          height: "30px"
        },
        orientation: "portrait"
      }).toBuffer((err: any, buffer: any) => {
        if (err) {
          console.log(err.message);
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
    } catch (err) {
      console.log(err.message);
      response.status(500).send('error getting content');
    }
  }
});

export const getBase64FromUrl = functions.https.onRequest((req: any, res: any) => {
  request.get(req.query.url, function (err: any, response: any, body: any) {
    if (!err && res.statusCode == 200) {
      let data = Buffer.from(body).toString('base64');
      res.status(200).send(data);
    }
  });
});

const locations: any = {
  // "282508": 
  "Bird Streets Club": {
    r365_code: 1301,
    paycome_code: "OKS71",
    location: "Bird Streets Club"
  },
  // "282509": 
  "Bootsy Bellows": {
    r365_code: 101,
    paycome_code: "0OA74",
    location: "Bootsy Bellows",
    user: "michael-green_bootsy-bellows-2",
    password: "88ZADAE9DNBC",
    type: "nightclub"
  },
  // "282510": 
  "Delilah": {
    r365_code: 401,
    paycome_code: "0OA77",
    location: "Delilah",
    user: "michael-green_delilah",
    password: "3WgrMsw3zRyH",
    type: "restaurant"
  },
  // "282511": 
  "Harriet's Rooftop": {
    r365_code: 1201,
    paycome_code: "0OA83",
    location: "Harriet's Rooftop"
  },
  // "282512": 
  "Petite Taqueria": {
    r365_code: 602,
    paycome_code: "0OA79",
    location: "Petite Taqueria",
    user: "michael-green_petite-taqueria",
    password: "vwLQdp7dNotf",
    type: "restaurant"
  },
  // "282514": 
  "Poppy": {
    r365_code: 701,
    paycome_code: "0OA80",
    location: "Poppy",
    user: "michael-green_poppy",
    password: "hTWCQJgVGyWR",
    type: "nightclub"
  },
  // "282515": 
  "SHOREbar": {
    r365_code: 201,
    paycome_code: "0OA75",
    location: "SHOREbar",
    user: "michael-green_shorebar",
    password: "zEHXeXRGZEVX",
    type: "nightclub"
  },
  // "282516": 
  "Slab BBQ LA": {
    r365_code: 1101,
    paycome_code: "0OA82",
    location: "Slab BBQ LA",
    user: "michael-green_slab-la",
    password: "s4dzzx1-seEN",
    type: "restaurant"
  },
  // "282517": 
  "The Nice Guy": {
    r365_code: 302,
    paycome_code: "0OA76",
    location: "The Nice Guy",
    user: "michael-green_the-nice-guy",
    password: "ESSshcA1k1bS",
    type: "restaurant"
  },
  // "282518": 
  "The Peppermint Club": {
    r365_code: 501,
    paycome_code: "0OA78",
    location: "The Peppermint Club",
    user: "michael-green_peppermint",
    password: "X1gVdkgypoWL",
    type: "restaurant"
  },
  // "283224": 
  "Nate 'n Al's": {
    r365_code: 1004,
    paycome_code: "N/A",
    location: "Nate 'n Al's"
  }
}

export const generateWeeklyReportCSV = functions.runWith(runtimeOpts).pubsub.schedule('0 12 * * 1').onRun(async (context) => {

  let now = new Date();
  let fromDate = getMonday(now, 0);
  let toDate = getSunday(now, 1);
  let users: any[] = [];
  try {

    const options = {
      method: 'GET',
      url: `https://api.7shifts.com/v2/reports/hours_and_wages?punches=true&company_id=${company_id}&from=${fromDate}&to=${toDate}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    };

    let res: any = await doRequest(options);
    users = [...users, ...res.users];
    console.log('Generated Report');

    let converted_csv_data: any[] = [];

    for (let user of users) {
      for (let role of user.roles) {
        let location = locations[role.location_label];
        let hourly_wage = user.weeks[0].shifts.find((shift: any) => shift.role_id === role.role_id).wage;
        converted_csv_data = [...converted_csv_data, {
          ...(location || {}),
          employee_id: user.user.employee_id,
          first: user.user.first_name.trim(),
          last: user.user.last_name.trim(),
          user_id: user.user.id,
          reg_hours: Math.round(role.total.regular_hours * 100) / 100,
          ot_hours: Math.round(role.total.overtime_hours * 100) / 100,
          dot_hours: Math.round(role.total.holiday_hours * 100) / 100,
          reg_rate: hourly_wage,
          ot_rate: hourly_wage * 1.5,
          dot_rate: hourly_wage * 2,
          exception_costs: role.total.compliance_exceptions_pay,
          mbp: Math.round(role.total.total_pay * 100) / 100
        }]
      }
    }
    console.log('Get CSV Date');
    const csv = await json2csvAsync(converted_csv_data, {
      keys: [
        { field: 'employee_id', title: 'Employee ID' },
        { field: 'user_id', title: 'User ID' },
        { field: 'first', title: 'First Name' },
        { field: 'last', title: 'Last Name' },
        { field: 'location', title: 'Location' },
        { field: 'paycome_code', title: 'Paycom Code' },
        { field: 'r365_code', title: 'R365 Code' },
        { field: 'reg_hours', title: 'Reg Hours' },
        { field: 'ot_hours', title: 'OT Hours' },
        { field: 'dot_hours', title: 'DOT Hours' },
        { field: 'reg_rate', title: 'Reg Rate' },
        { field: 'ot_rate', title: 'OT Rate' },
        { field: 'dot_rate', title: 'DOT Rate' },
        { field: 'exception_costs', title: 'Exception costs' },
        { field: 'mbp', title: 'MBP' },
      ]
    });
    const storage = getStorage(app);
    const csvFileRef = ref(storage, `weekly_wage_report/wage_report_all_${fromDate}_${toDate}.csv`);
    uploadString(csvFileRef, csv).then((snapshot: any) => {
      getDownloadURL(csvFileRef).then((downloadURL: string) => {
        console.log(downloadURL);
        send.request({
          Messages: [{
            "From": {
              "Email": "connector@hwoodgroup.com",
              "Name": "Appy",
            },
            "To": [{
              "Email": "michael@hwoodgroup.com",
              "Name": "Michael Green",
            }, {
              "Email": "lydia@hwoodgroup.com",
              "Name": "Lydia Saylor",
            }, {
              "Email": "tharris@hwoodgroup.com",
              "Name": "Tierra Harris",
            }, {
              "Email": "aguerrero@hwoodgeoup.com",
              "Name": "Ada Guerrero",
            }, {
              "Email": "markkostevych1100@gmail.com",
              "Name": "Mark Kostevych",
            }],
            "Subject": `Weekly Wage Report From ${fromDate} to ${toDate}`,
            "HTMLPart": `Hello sir, click <a href="${downloadURL}">Here</a> to download weekly wage report. Thank you.`
          }]
        }).then((res: any) => {
          console.log(res.body);
          return;
        }).catch((err: any) => {
          console.log(err.message);
          return;
        })
      });
    });
  } catch (err) {
    console.log(err.message);
    return;
  }
});

export const generateWeeklyPosReportCSV = functions.runWith(runtimeOpts).pubsub.schedule('0 12 * * 1').onRun(async (context) => {
  const now = new Date();
  const fromDate = getMonday(now, -1);
  const toDate = getSunday(now, 0);
  let users: any[] = [];
  let csv_data: any = {};
  const options = {
    method: 'GET',
    url: `https://api.7shifts.com/v2/reports/hours_and_wages?punches=true&company_id=${company_id}&from=${fromDate}&to=${toDate}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  };

  let res: any = await doRequest(options);
  users = [...users, ...res.users];
  console.log("Getting Report: ", users.length);
  for (let loc of Object.keys(locations))
    try {
      const employees: any = {};
      let acc = locations[loc];
      if (!acc.user) continue;
      let offset = 0, limit = 500;
      while (true) {
        const options = {
          method: 'GET',
          url: `https://api.breadcrumb.com/ws/v2/employees.json?offset=${offset}&limit=${limit}`,
          headers: {
            Accept: 'application/json',
            "X-Breadcrumb-API-Key": Upserve_API_KEY,
            "X-Breadcrumb-Username": acc.user,
            "X-Breadcrumb-Password": acc.password
          }
        };
        let result: any = await doRequest(options);
        if (result.objects?.length) {
          for (let employee of result.objects) {
            employees[employee.id] = { ...employee };
          }
          if (result.meta.next == null) break;
          offset += limit;
        } else {
          break;
        }
      }
      console.log("Getting Employee: ", acc.location);
      offset = 0;
      let trading_days: any[] = [];
      while (true) {
        const options = {
          method: 'GET',
          url: `https://api.breadcrumb.com/ws/v2/trading_days.json?start=${fromDate}T12:00:00-08:00&end=${toDate}T12:00:00-08:00&offset=${offset}`,
          headers: {
            Accept: 'application/json',
            "X-Breadcrumb-API-Key": Upserve_API_KEY,
            "X-Breadcrumb-Username": acc.user,
            "X-Breadcrumb-Password": acc.password
          }
        };
        let result: any = await doRequest(options);
        if (result.objects?.length) {
          trading_days = [...trading_days, ...result.objects];
          if (result.meta.next == null) break;
          offset += limit;
        } else {
          break;
        }
      }
      console.log("Getting Trading_Days: ", acc.location);
      offset = 0;
      for (let trading_day of trading_days) {
        let serverPool = {
          pts: 0,
          tips: 0
        };
        let bartenderPool = {
          pts: 0,
          tips: 0
        };
        let busserRunnerPool = {
          pts: 0,
          tips: 0
        };
        let receptionHostPool = {
          pts: 0,
          tips: 0
        };
        let barbackPool = {
          pts: 0,
          tips: 0
        };
        while (true) {
          const options = {
            method: 'GET',
            url: `https://api.breadcrumb.com/ws/v2/timesheets.json?trading_day=${trading_day.id}&limit=${limit}&offset=${offset}`,
            headers: {
              Accept: 'application/json',
              "X-Breadcrumb-API-Key": Upserve_API_KEY,
              "X-Breadcrumb-Username": acc.user,
              "X-Breadcrumb-Password": acc.password
            }
          };
          let result: any = await doRequest(options);
          if (result.objects?.length) {
            // Iterate TimeSheet
            for (let timesheet of result.objects) {
              const employee = employees[timesheet.employee_id];
              let id = `${employee['employee_identifier']}_${employee['first_name'].trim()}_${acc.location}`;
              if (!csv_data[id]) {
                csv_data[id] = {
                  employee_id: employee['employee_identifier'],
                  first_name: employee['first_name'].trim(),
                  last_name: employee['last_name'].trim(),
                  role_name: acc.location === 'Slab BBQ LA' ? 'Server' : timesheet.role_name,
                  cash_tips: 0,
                  cc_tips: 0,
                  auto_grat: 0,
                  total_tips: 0,
                  final_tips: 0,
                  pts: 0,
                  location: acc.location
                }
              }
              csv_data[id].cash_tips += Number(timesheet.cash_tips);
              csv_data[id].cc_tips += Number(timesheet.cc_tips);
              csv_data[id].total_tips += Number(timesheet.total_tips);

              // Apply distribution Rule
              if (acc.type == 'restaurant') {
                switch (csv_data[id].role_name) {
                  case 'Event Server':
                  case 'Events Server':
                  case 'Server': { //Server pool
                    serverPool.tips += parseFloat(timesheet.total_tips);
                    break;
                  }
                  case 'Event Bartender':
                  case 'Events Bartender':
                  case 'Bartender': { //Bartender pool
                    bartenderPool.tips += parseFloat(timesheet.total_tips);
                    break;
                  }
                }
              }
            }
            if (result.meta.next == null)
              break;
            offset += limit;
          }
          else {
            break;
          }
        }

        for (let user of users) {
          for (let shift of user['weeks'][0]['shifts'].filter((sh: any) => sh.location_label === acc.location && sh.date.split(" ")[0] === trading_day.date)) {
            let id = `${user.user['employee_id']}_${user.user['first_name'].trim()}_${acc.location}`;
            if (!csv_data[id]) {
              csv_data[id] = {
                employee_id: user.user['employee_id'],
                first_name: user.user['first_name'].trim(),
                last_name: user.user['last_name'].trim(),
                role_name: acc.location === 'Slab BBQ LA' ? 'Server' : shift.role_label,
                cash_tips: 0,
                cc_tips: 0,
                auto_grat: 0,
                total_tips: 0,
                final_tips: 0,
                pts: 0,
                location: acc.location
              }
            }

            csv_data[id].auto_grat += shift.total.auto_gratuity;
            csv_data[id].total_tips += shift.total.auto_gratuity;
            if (acc.type == 'restaurant') {
              let daily_pts = shift.total.regular_hours >= 3.5 ? 1 : 0;
              csv_data[id].pts = daily_pts;
              switch (csv_data[id].role_name) {
                case 'Event Server':
                case 'Events Server':
                case 'Server': { //Server pool
                  serverPool.pts += daily_pts;
                  serverPool.tips += shift.total.auto_gratuity;
                  break;
                }
                case 'Event Bartender':
                case 'Events Bartender':
                case 'Bartender': { //Bartender pool
                  bartenderPool.pts += daily_pts;
                  bartenderPool.tips += shift.total.auto_gratuity;
                  break;
                }
                case 'Event Busser':
                case 'Busser':
                case 'Event Runner':
                case 'Runner': {
                  busserRunnerPool.pts += daily_pts;
                  break;
                }
                case 'Host':
                case 'Events Reception':
                case 'Reception': {
                  receptionHostPool.pts += daily_pts;
                  break;
                }
                case 'Barback':
                case 'Event Barback': {
                  barbackPool.pts += daily_pts / 2;
                  csv_data[id].pts = daily_pts / 2;
                  break;
                }
              }
            }
          }
        }
        let temp_tips = bartenderPool.pts > 0 ? Math.round(0.15 * serverPool.tips * 100) / 100 : 0;
        busserRunnerPool.tips = busserRunnerPool.pts > 0 ? Math.round(0.285 * serverPool.tips * 100) / 100 : 0;
        receptionHostPool.tips = receptionHostPool.pts > 0 ? Math.round(0.015 * serverPool.tips * 100) / 100 : 0;
        bartenderPool.tips += temp_tips;
        serverPool.tips -= temp_tips + busserRunnerPool.tips + receptionHostPool.tips;
        for (let id of Object.keys(csv_data)) {
          if (!csv_data[id].pts) continue;
          switch (csv_data[id].role_name) {
            case 'Event Server':
            case 'Events Server':
            case 'Server': { //Server pool
              csv_data[id].final_tips += Math.round(serverPool.tips * csv_data[id].pts / serverPool.pts * 100) / 100;
              break;
            }
            case 'Barback':
            case 'Event Barback':
            case 'Event Bartender':
            case 'Events Bartender':
            case 'Bartender': { //Bartender pool
              csv_data[id].final_tips += Math.round(bartenderPool.tips * csv_data[id].pts / (bartenderPool.pts + barbackPool.pts) * 100) / 100;
              break;
            }
            case 'Event Busser':
            case 'Busser':
            case 'Event Runner':
            case 'Runner': {
              csv_data[id].final_tips += Math.round(busserRunnerPool.tips * csv_data[id].pts / busserRunnerPool.pts * 100) / 100;
              break;
            }
            case 'Host':
            case 'Events Reception':
            case 'Reception': {
              csv_data[id].final_tips += Math.round(receptionHostPool.tips * csv_data[id].pts / receptionHostPool.pts * 100) / 100;
              break;
            }
          }
          csv_data[id].pts = 0;
        }
      }
      console.log("Getting Tips: ", acc.location);
    } catch (err) {
      console.log(err);
      return;
    }

  let converted_csv_data: any[] = [];
  for (let key of Object.keys(csv_data)) {
    converted_csv_data = [...converted_csv_data, csv_data[key]];
  }
  converted_csv_data = converted_csv_data.filter(data => data.total_tips || data.final_tips);
  converted_csv_data = converted_csv_data.sort((a, b) => a.first_name - b.first_name).sort((a, b) => a.role_name - b.role_name).sort((a, b) => a.location - b.location);
  console.log('Get CSV Date');
  const csv = await json2csvAsync(converted_csv_data, {
    keys: [
      { field: 'employee_id', title: 'Employee ID' },
      { field: 'first_name', title: 'First Name' },
      { field: 'last_name', title: 'Last Name' },
      { field: 'role_name', title: 'Role' },
      { field: 'cash_tips', title: 'Cash Tips' },
      { field: 'cc_tips', title: 'Card Tips' },
      { field: 'auto_grat', title: 'AutoGrat' },
      { field: 'total_tips', title: 'Total Tips' },
      { field: 'final_tips', title: 'Final Tips' },
      { field: 'location', title: 'Location' },
    ]
  });
  const storage = getStorage(app);
  const csvFileRef = ref(storage, `weekly_tips_report/tips_report_all_${fromDate}_${toDate}.csv`);
  uploadString(csvFileRef, csv).then((snapshot: any) => {
    getDownloadURL(csvFileRef).then((downloadURL: string) => {
      console.log(downloadURL);
      send.request({
        Messages: [{
          "From": {
            "Email": "connector@hwoodgroup.com",
            "Name": "Appy",
          },
          "To": [{
            "Email": "michael@hwoodgroup.com",
            "Name": "Michael Green",
          }, {
            "Email": "lydia@hwoodgroup.com",
            "Name": "Lydia Saylor",
          }, {
            "Email": "tharris@hwoodgroup.com",
            "Name": "Tierra Harris",
          }, {
            "Email": "aguerrero@hwoodgeoup.com",
            "Name": "Ada Guerrero",
          }, {
            "Email": "markkostevych1100@gmail.com",
            "Name": "Mark Kostevych",
          }],
          "Subject": `Weekly Wage Report From ${fromDate} to ${toDate}`,
          "HTMLPart": `Hello sir, click <a href="${downloadURL}">Here</a> to download weekly wage report. Thank you.`
        }]
      }).then((res: any) => {
        console.log(res.body);
        return;
      }).catch((err: any) => {
        console.log(err.message);
        return;
      })
    });
  });
});

const getMonday = (d: Date, week: number) => {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1) + 7 * (week - 1); // adjust when day is sunday
  return getDateFormat(new Date(d.setDate(diff)));
}

const getSunday = (d: Date, week: number) => {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -7 : 0) + 7 * (week - 1); // adjust when day is sunday
  return getDateFormat(new Date(d.setDate(diff)));
}

const getDateFormat = (d_t: Date) => {
  let year = d_t.getFullYear();
  let month = ("0" + (d_t.getMonth() + 1)).slice(-2);
  let day = ("0" + d_t.getDate()).slice(-2);
  return year + "-" + month + "-" + day;
}

function doRequest(option: any) {
  return new Promise(function (resolve, reject) {
    request(option, function (error: any, res: any, body: any) {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body.toString()));
      } else {
        reject(error);
      }
    });
  });
}