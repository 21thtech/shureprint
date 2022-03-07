import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const pdf = require("html-pdf");
admin.initializeApp();

const runtimeOpts: any = {
  timeoutSeconds: 540,
  memory: "2GB",
};

const useHtmlTemplate = (body: any) => {
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


export const generateReceiptDoc = functions.runWith(runtimeOpts).https.onRequest(async (request: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(request.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(request.body);
      let html = useHtmlTemplate(body);
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