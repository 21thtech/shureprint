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

      .padding-l-20 {
        padding-left: 20px;
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

      .content table,
      .content td {
        border: 1px solid;
        text-align: center;
      }

      .total {
        text-align: right;
      }

      .total div {
        width: 60px;
        margin: 5px;
        padding: 1px
      }

      .total div:first-child {
        margin-left: auto;
      }

      .total div:nth-child(even) {
        border: 1px solid;
      }

      .footer {
        width: 100%;
        position: absolute;
        bottom: 50px;
        padding-left: 20px;
        padding-right: 20px;
      }

      .order-table td {
        padding-top: 20px;
      }
    </style>
  </head>

  <body>
    <div class="d-flex">
      <div style="width: 60%;">
        <h3><i>ENVISION PACK</i></h3>
      </div>
      <div style="width: 40%;">
        <div class="text-header2">Delivery Receipt</div>
        <div class="text-barcode">211402</div>
        <table>
          <tr>
            <td><b>Delivery Receipt No</b></td>
            <td class="font-mono">${body.receipt_no}</td>
          </tr>
          <tr>
            <td>Shipping Date:</td>
            <td class="font-mono">1/28/2022</td>
          </tr>
          <tr>
            <td>Page:</td>
            <td class="font-mono">1</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="content">
      <div class="d-flex padding-y-80">
        <div style="width: 50%;">
          <div class="d-flex">
            <div class="text-right" style="width: 30%;">
              Ship To:
            </div>
            <div class="padding-l-20 text-address">
              Company Name <br>
              Address <br>
              <br><br>
              City, State Zipcode
            </div>
          </div>
        </div>
        <div style="width: 50%;">
          <div class="d-flex">
            <div class="text-right" style="width: 30%;">
              Sold To:
            </div>
            <div class="padding-l-20 text-address">
              Company Name <br>
              Address <br>
              <br><br>
              City, State Zipcode
            </div>
          </div>
        </div>
      </div>
      <table>
        <tr>
          <td>Salesman</td>
          <td>Ship Via</td>
          <td>Truck</td>
          <td>FOB</td>
        </tr>
        <tr class="font-mono">
          <td></td>
          <td>Our Truck</td>
          <td>River Side</td>
          <td>Destination</td>
        </tr>
      </table>
      <table class="order-table">
        <tr>
          <td>Pkg</td>
          <td>Release Quantity</td>
          <td style="width: 30%;">Order No/Description</td>
          <td>Customer P.O.Number</td>
          <td># Of Units</td>
          <td># Per Unit</td>
          <td>Ship Qty</td>
          <td>P/C</td>
          <td>Weight</td>
        </tr>
        <tr class="font-mono">
          <td>2</td>
          <td>4929 EA</td>
          <td>206818-1-1 shroud wm queens endcap Z474441-1--
            scored sheet w</td>
          <td>1845/</td>
          <td>2</td>
          <td>300</td>
          <td>600 EA</td>
          <td>P</td>
          <td>3530</td>
        </tr>
      </table>
      <br>
      <div class="d-flex total">
        <div>Total SQA:</div>
        <div> 132154</div>
        <div>Total Weight:</div>
        <div> 17985</div>
      </p>
    </div>`;

  createdTemplate += `
    <div class="footer d-flex">
      <div>Received By:</div>
      <div>__________________________________</div>
      <div style="margin-left: 30%;">Date:</div>
      <div>______</div>
      <div style="margin-left: 5%;">Time:</div>
      <div>______</div>
    </div>

    </body>`;

  return createdTemplate;
}


export const generateReceiptDoc = functions.runWith(runtimeOpts).https.onRequest(async (request: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(request.method) > - 1) {
    response.end();
  } else {
    try {
      const body = request.body || {};
      console.log(body);
      let html = useHtmlTemplate(body);
      pdf.create(html, {
        format: "A4",
        zoomFactor: "1",
        border: "0",
        orientation: "portrait"
      }).toBuffer((err: any, buffer: any) => {
        if (err) {
          response.status(500).send('error creating document');
        }
        response.type("application/pdf");
        response.status(200).send(buffer);
      });
    } catch {
      response.status(500).send('error getting content');
    }
  }
});