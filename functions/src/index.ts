import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const PDFDocument = require("pdfkit-table");
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
const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAw4AAABNCAYAAAAPZjMSAAAAAXNSR0IArs4c6QAAAHhlWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAAEsAAAAAQAAASwAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAAw6gAwAEAAAAAQAAAE0AAAAAHUmCHQAAAAlwSFlzAAAuIwAALiMBeKU/dgAAPUNJREFUeAHtne1527jytyUne3a/WU8F1qnAOhVYW0F8Koi2AmsriFJBlAqiU8EqFaxcwSoVHKWCv/xt92RjPfcPBGVaJsF3kZTA66IoAsPBYDAYzOC136vg+uGHH0a7V68G/d1utOv3B4coCd8Svu5//7799u3b+jDev3sOeA54DngOeA54DngOeA54DngOtJsD/SLkGUfh4mLCt2Pua+681xeciXXv4mL1qtdb/fnnn5u8CNoA//rHH+fQMcpAy/bvv/6aALfNAFsZSNvpy5LRHHlYw+NpFpx1wUDrKgvufr+/+Pbnn4sssMeGyZqHMnRR9ze7i4uNxbF63ettuqoDXHzIIbsuNHXHNaKb0jJ1BDnc9ujMsnScnAzaNnqexucK4tfwcRt2Dv7955/i6bYCvK1CkUMeG2+Hkhj3w08/TXa73SQpPhK+7T8+zprs5M1Ba+P8PmJdixRRtX/z2iR5HIfB659+mqIgJrte78qS/YXnikTXhG2SlMZPP/00/LvXG5LYELhhb7cb892I+5Jb1xfiFt/++mvB/84oHatMbqD5njv2snkWv75g2I55Hi1/lj7xec0dezVJXyxBB4FZ8sAnyuMlsvmfb//73+QAxdFeoXUHP7+qLjgSlbzQ1vZ/aaPzkDEPjuxlijLlFYUU39ALq8deb/n9f/9bRuO6+j+j7DaZvQGJq+Pn6LopLdN1y2FE70VJeeBF7dmSuikZ3EYju/SftnpMffodmtVG15mPEfjDdtywyOrAJUpuiU2wMoEd/8koj4YXTbdDSaxGJmbIxDvi75NgbHjQRtGevrq4mDXRqZOR1lbw+4h1LaXYCkfXYpPIYZhRcbaqPNxreYOQOChMpv1Qnhr45j/8+OPG4t798I9/LORolMV9jO+heSW6XWlZ3olvhnfAluabK71onKVvFQ07/N8kfYe0xL1nyoMtB/FY8hOH5xhhpoylnB2XgQlkYWfrkQP6+FFZ8lAVVarnUrpWBk1dsvzZKox0jlZXqspTFA95UZ5W0bA2/Te8t7IInWtoaw2/jRyk1KWqeCk+0AZNpTtIN2znjC5RXFXpHBPPvmyPRL/a8lf/+Mct/JtLlkz5SR/Ttou35L01slWkHEx+UuQRmL0Oa7IdSsofMjFTPpLiw/AQzpZhI7o4pCGkKe7ZFn4fu67F8aJMmC1nY6NmtUkuXAmKIVT6tfVSNST5M73mI9tTunV9myVOQ2GaXsJIw1C45amzFuLt37vdf8nMHBydVjZRHqiHmfdrCXsb8yXet5k+aEu77kP5aaPSPiD+I+9fGDb+lLWiHnx/Eq/qyVKPJPdMo3Hc/8/Wk410DnVlowaEzJ6MHmhjwZ1A3S/FVskgbdBco5XI4CDSFt2q1146W4ZxqURO/GO15RopVHvOPXrd7/+z3+v9qmxjqX5QXT4TXacRni+yYzrQDsVKpfQxEfeKpAy3oS5uafl1qd0XS9t65bJJEh0HIyQoTSr9AAPn3yiDsRRsXbk2yhvFLYVDGp+574yyORGFLWerzc6DGs2uGxBhHlqvtJkTrPqEjJ+98wAPotdW9USGh4w3IkynhTovvOEWZVO1/1lv0mrdVG1u07GFbRFyqA6t93wxgkd/0B6dVGdWOieKQ6hTwDhj8FDtngxQdZTICevKjIKCuX/S7R12HrDDJuT/AftvG+piW35rdSgX5E0tn3Wm3a8l9xUhzWmTxDoO6uWTkECS5r4Ojznn2PRC/vXXLWnLA7pEYZ9Mb493HioScgeaDimRpwaGuqZhfke2zi5KxpucK3VamM4LDLeW9nidRNm0XTc1xOQtcjjDiNJoQ9iZteL/oCF6OpmsZMvOKpATdsOMglPvCHjS7TgP1uHsVNnJDkP3TiBaa6A0Gjy2DuCAEQgzCtcmB7BD7X6b5eBJbrFJXO3tC8fBjjS8I3fNLpjDAwo57J2HkBP1P8MKSEqtnVaVxoUwD60feaA3RwqZ/DyglBe+V/1lydrpD0Ni/OjMS/ZUGuKdh3h2hp1Z9Jr/CoT04sbX1XheuULlhLFbz7/M6MPpdwSEuv0LPLlzGWEunjUZZzuMP+MovNMog3UANRosB3CkKeV2OlYrHOkOtftNFmta2nu51eBBktw+cxwkHJGRhjEp7I33tNSi8ZFFj8JRSqhQNMLR886DuHCcK6yApOadh/pZrq3vxkrmlGS8YrZJmY3MGhaUmUZEK8bv0VkOeOchWRQ09cZO2/B1NZlNzhithYCPI4DOoSMgkxHmZFjDkejdCY7eV3TvAlJky5lROMKHRh8HIyqtWYsW2i4d6DRsuGSdyafKLVuo7y8d4LZgWsADQ7O3f2d0GtTzwuFvWkQ2BpMUwiWe6B4pvTPmv4SP0A2Kd0WAFkTqmXpJ0ZDGWEaVNazGCkv9sOUAaqDx5mBbMO/T9jxv20K2KiC9CT1VQM1LbRt9WfgUzYPyovcs3x0bpmsyXsZwRw9spAeKHAa5L89e7x3lOWxreeaRH/XowI9hnm+qgsVhHVK/X6Bru24KCS4jh7vHx3X/4kJG0CrEl+UpeNse/dH19kgdfLTzkyz5joMJeVjgHBZjmKhdsb2aPclcXBonENb1vOrw3gmGiqYnaf3ZrS2TrdHHP/wwpx7MiX/HWrQJ9t2s6bLctxPBGpPWtvstl22n3O4dB5TwlEp8pXlsGppNy5QZwtjtZjR6VwiNwHWo2xIh2oTGgQIJM6dJg3tE+IjnO4LfIYQPgufbeZoj0DXDSvnOcrW9gY5WQO88ZCnR4jCdkvGgDhfKrNEUfIme6EkH8HeFztG++YssCJHJKd9Jp2jXks43CujDCfm+yZL3qmHinIYwjbbrJkNnCTlE5hDCnWRQqHKdI2Tq6k8//ULZfeqy84DTMJTBF5Z53mfIQ/CYuqz2/DH7OSxb00HJegfxUZ1oWXVAXjpbAO80wlpAn5MEOcvYh+8lK1qLF13zam03bak9Jn6hsqROTXEgpnmdcicROSOjtsvR2onAucpJaQI408Hg3ywhVvUtbEqTQKoIT5Tb0HHQgpcpKd2nVV7TSyEHYbe7RvV+5f71FQ2/w9lYHeRggJK45ftbNf4ImHq0v6CE5q60O2VYHWTY9dr2BjpaASknP/LgKsyScZ2S8RTFlsQKO0Kp0c0ROkcOgHTBG2Rrji6ZmekgSR8H4ZraNcFg++NUnAeydW9H9Nw5P3Js23WTYUdBOZShQ4/5gHZnjNzd0gp/QAY/gPMjZTHj6Rz9FW+AV+/rmy47D9BP7x7brOccedFnxljUHxbP2rr8Fl6+pef56yP2RNTADMCe/8pmwBCdUAa/yeD0zsNz/rTpTUas5J2y0jlbo0N7z8rPkLKfUpdmyINGKD7jHE4PYY+Vr6jtUqfzoLyD3xwlQN4eqE/zUnnM7szfk9aqVFpPHyfhSXQeeho9oJB3ej7heflPjT5wW90SkJcQuUPM4XLg2pj09ZTnysVTgvrCq3pGQ8NbtULfKo7GKBeS8hGF0f+wDAR/GFf03dK3cn2fmb7gcKRdlfS56ArjMuUhKAdnPoWPyr1QeVUkuyGJ+6dwp/EnC0xExld75Ef6k4W+LDB5yJXshzoA3MrzIO37UG5Fi8o1Db6JeOXF5icx+SwwiR8fKWKvm378cXmkJHsq1yrqUlZ6SWtsy2LHc6s6mOHbgWANrdm/yYC2PIjNj3g4TsKWBSbp24RwdQru67Ktl+l1GbmyPEy1QRLSrT3Y0JfSNgOTWt8hVDKzFr6MMlZZ3ijvmdItijBHu2TsOqVlbocMJtGShVZwZ+F37e1+mIe9fVGyPbI8m4V4455ZYOK+KxH2TG7N4mj1/oPwwdXjr5EG9awoYS3mzNAzKNC0yyy0AdcQT/YXJFojH/JUNYUpVuGoV/YUF5Na3t+nMaypeHnvTaVdVbphHuipjpWtqtIpi8cO/67L4unK95J9owOCXWtu1CBAu7OM6OWZA6OpTg925GHBf3/VwIGIbnKWSQ1JHw2leg3NqE9wfoim0mXZ/ld73EsOdZ3U1uFBlnL/mnNYqMvBRgbBbIIVWJxyo17pMCWNPFD/Q56Gwaf0lMyY/LI21MmXtmXa2F4aTWBqpQx7B33GrqNc/wmMpqQveDaW12O1+0qHvJqRh7Z2ZjnKLC3qmdyGuyq90fxE15cseJ4Tf2mchhoWJ6txQnEPSeMj9xvuO+7Y61Sdh9jM+kDPgTPhgDoj1IFAdsPdvFw53xK54L7s43B458HFKh+XlQNyINTGIVNfMWLnab3C1oEV+nv92GlLI/0/48ssnA3rMkaUbIfEy05luRfPZXgBeHeChldi/rsUIR0NvWaL1rS6YcpVU1FZB5smA13igYvWE3ce9lm/2Be+HU3Yx0T+aLSBVzkX/7G9oZHYSv9qPtUUxf0vsGrB2tck7N55SOKMD/cc6C4H1IEQGhwpvVoa+VyYnHLmixmxzNjD2V3ueMqPwQHTxj0+3pq0Li6WKWluif9MWzWUwyFY7zyIC71wsfNHOfVpB1xSf7WjozZamcvO8B0BAQ/b+IuNNoGuB+R8wXPAnXjJEScykwwkIulYRNR5MLNnUnjUsewZci8e+/2h/lFpN3rGXd+DqUy9VxcXs7j4qsOkuBHOkaYvuHAfOA9zF6yP8xzwHOgGB/ZTY4INGxIbJlP/1bmgqZNPDkemqU7d4ISnsikOWNkyuwZq3r6LDozepTF6AfLOw3NOmY5A6ujF05Su5wD2jfq7NH8vLsZRw8uPPMSyq7ZA8Rtjd2s7i5PS2TIaNyFSI8OzJKAwHBkQjDbA0cLqYRh+yk/JMFPS3pNHbfyx4pnYjnWRDxfsZT0S4XiG66QM4P2bTDe1Oj6JLoVLwfNIpN31rY/zHPAcaCkH2A8cyi5ZND1xUYjBtkY/jQRjHQ5Ndbw+l6FxF298XDkOmKlzckzZdtyF6RVbCpv4V69GB51ZCjdtp4k/1x/qshyr/eyGeD5sGbXRWU9jRUedBwyvefwnPrRqDqBLh+DUWVxLF267Y5Z07V3aaBIwZic8i3fB8ywubOqZRsLJbDj19mR0QbjGQQW5dZWmKrUr3sd5DngOeA5UxQENcUvnhIZEIt5+f03cdRhvejjtVAdvcIRc8c+iHED+zGiCy+gNO9TohR0pHTkPtkf28hR7G/PyMhxNMAfFOj6G1xui98aV6bWlp5qwu7RRHwdaH1WMA9dpU0WjIwkksS+3uOTsCN6vxKUtrI77vLNhkZHwk3IeXmctESr1VVbYNDgNV3FojI4s1z7uhwK3KnKqbFqaPt5zwHPguBxQY4/eGBZONThYcpz3exkcGGxKV71hq7T95PPibwqehnzcVNp2l7ttY+mXSNgYQLtdbt7RPm3Id482qtdjNAGPYO0g4564URgvmWO07Ffk/wOyOJNDG8Z18ZlmRKbmabd7gJdjJ5z2pD/Ywx6+jeV84Yh9wnlb2xkGTjQ+sjQHJMtblQU8Xzp4vj9ThzJaqqxcKWsED7jbDHhdaDoXJ+eBtpBsmx3DOnkW1iHTo47DgMjtIYDezdHyKE8ZAnY6QByYM0zDWQxv6NC3W4bBLg1e84NqfX69Y9FNDwFTqHZaWKYcMPf8a//mOeA50AoO2F5XGVPrnARJF12/0AzxSFYEv5NRbRfiGSgasVsMtzXzTBcEDLljdRvh3bnYqrphYmVQdO8KDNb8csjhcMjglTLMc5g349ZQGvPdHfK5jMpnXlyNw2NE0hZrBHCTkxZTl3N+EwUPjdOVXYyrcvRXzRxAf6rzZdMLNgcQz7dxScqpQLbNqdLo26lkPg4uDJNeFl5blmPCY/GG8KfyjDoPapcK1KNCrNBIKbx2lklmxJEjEl6HTgGFP0pSbLb3JJzruSShzIVtHAYWRsGoK+4Hvl2hgFY4EGvSWx/g0sEhI+KHWvBIoy/F/QFHQ7024enSudLPzBQP6DngOVAHB7TRwbgIYnTBTL1Trm/t6b89jVIewG3RMRO+/13rHey0hwOQ7r2aHWeC3UyOTnwMj49OQ4kEi8thiUOzdEYB7dcYOZxD+6gE/Y1/Sn1a0GbPihBC+70q8p2+kXGKsTWTLSCdUJSGoumf6Xfat/+Wzp9U/anyoHxlq80wVFeOEQqx0iysZu7/b3zT+ZG4PLIRcR4meb4rA2vOCtntbsChKX+HbWRe1Pr+Xu3A6wuGY1EIPU0bInCVhElHyNvCzjrUopPmFuDTmQxftUgExi357yJeB4esgNG10I+mNdldnaZ2qGeOQM+BmxPtwqXP/eU54DlwwhwwmzswnSSusZIuwWkwWzuiR2bhXPQus4Peo01ER3Y5K2dBu2QOY3cuB1idaKcyba6OwmNHqiG2iDoXX1zqyVaPNjbAlEjf9r/gUPUB0jPYcNpKVVM+ly7ZxUGe4CCvs4wKmY7oQC+f1FTSLCVgZ+wsXLDwHB+s4ksdGE+2dWnkF7bBfYDSsQubClvGPzDXGmpBGbrg5TSsgJXT8JFKP7IMy23oS/FKaXAPcRh+Bt9aShj8GykS3v3lOeA5cIocoKe2n7YpQ2T4NI4F4RbS3x8fZ3HxPsxzoG4O0GDL0H2g/Tzb9op6PIQHzvYfA1Uwa+7YS52XRKTutBb7sQ8sxAFGi2d8aLZS5TlIQiI7zU5N1SLgeRJcGM4I8FS6nTqxICwRbwjvn+3iAMsO2Hs62HpLRr6zAGX8y3nAyRhgvP+OgCzj9uUlfAaua8EieFP+b7lLX/KYzLSHwIHYQIemMK2tUiqN3yPwHPAcaBUHRuiZVQpFI+I1DBt72VGGzxglbwFw6rdYBD7wrDmgOcJiAG2ksw2zbVASjMIX3Ddx7SXhJ30pz7TVV3T8rVMyOoLPmyQY03kZrLOYJMH48Mo5sN9KVfaeC7sdkfgMjNb0jF2wxG2Zjn7L8zINbwoeH90AB4zjYIeXehT2NI0GOQ8MS42Ak4C8YXjqvyr4UFDs807xdpQhDWXueOtAaC3Er3wcKKXcWPwHngOeA23lgKZ1QNsli/NWDhoHxN1wu2DwPXYLYHrgHOvpL8+BzBy4uBgb2MfHlXkm/KQZxuEp599TRvYT0Hc6mB0UJ8oAc6OXSRmxDtplmnMBn4Xj+hwdsCTe1R2uWSnW1rpJm+VBx+4E2K84gAvokn5OvMxsl+CQtFS8iUh8RCMcMI6Dnft0Tws7zVIh1YuHgNzaqUPGgdAIBEK14TlXTrQorO4caQpT6MRgHJh0607T4/cc8ByonwOMVs5I5YHOh2VSaqEjQN1fJcEonJ4wEx8edumC9XGeAwccMFMq4tbQhHBhp5k2GgnDDp/hlGCz6cdh5Gm/a3aCbIF7Fw/pvJyIDdpBUc/Ey8afowOWyJMjRMjWIpl7HLcP4ShcQrJmUwo50nQoLxJg9sHYnjNehFcLq0f7CP+n1Rx4vadODTXGPyMIC8LG+3DHH+twrORs8N2Uwp8AfqVPeF+yfevcNvxbhdVx2akIt3XgrhInjcssDR9e+hAjaJwFNg2X4g2+/NvnZUHtYTwHauOAerXQJde2lytRd+BcTCDiwQ6Ru+gRji/ot7ELqKk48jnMVOd1rkVJ/YDOnpPPRJ42xYM2pqtRLziuKTbvnfTtdreKDx1UB+yaKXMjR/zJRWlHM3iokYSZK3PUAfH6i23PE0Flc2CQ9oAdJgL5iFo4kHUBtCmjcIvWDFv4Z8VbS6Y80kIc2DsOtkJ+BMsdlX2RZ/tCW9mnfDuVsrUN+huM4E9U8k+Ef+b/IkMDXygTnfgoZVtJ5QFlqOsK4+Am+Fvu1+LblMPiv/YcOB4HzKFxbL9Mive2lys2cdtZ8Qbn+D+xAC8DZSwPXgY3HrI29TSbU3NvqM0G+yxjGGZmSif6+NasE/POwzP+xLwMaMcW8O0rnV/zmPh9EDDG6CVAMpZ8xRxwlgzc/RjbAfCWnHyUfZGUI1vnr+woYxLYPlxlgj0x2gf4P0fhgOw87LsJ5aStVOfokWlSwpS3tmjVdq5zdPXK5RAqDhnY75rpwpuUng8/Lgf2joOSpcBmVHYd0vYW56GXx3kIybbOwZL3AcIgwZFwvUHY3iBID/zXGom5S5BCXKfwVAUiH7r95TngOeDggDE0AqfhC7ro1gGqEc254rVr0jcX4FPcmr9ae9Wq61iNpBnRCDovrtHDWbfUbhWvjkhMuCvgJW2h5HCblDZ8HdPGXWHMGnlMgju3cHU+4hDLaVBdnjrzv9vNrIO2cMLZSPBu+DvIAuthquWA7DvKVltcpx5qiJ2nw37X3AuoGLso0XpYORrAGLwuWB/XPAcuDkgIV7o/yHlQA0N80Qq6lTCgNEYI0D813Ity2ILvDkF6tqD6gAb/6jngOXBGHJDxJV2DQaCRBhkaY57SFbGXRjWJeMP9MXMHRL+fiC82kRMNpAPnF7JmnAeegxPNZplshU5DsCugo6fcJILRy/OB0bGFeXf8hGsgTnkut+omHQA6G+qtRgNtXU7kihxa6r2mg80SgXxEqzgQbqXKzIglhCXqEOlmbL4ZMDem4yIlF8jKBPivBm/KNtspqHx0zRw4dBzMQUo0LlOb7g0NuoanbsvQIQFSzzvKdUjvzL/Bdc/9BgH5XQaDDIcy+P23ngOeA93igOq8Rhio/zqX5XeoH6lzQR0N/N86cmOmkBD/AOzMAeejYjigzhzvPMQwhiBNmVF7x1/jNIhX/E+8bLt1g9zOAXLJrMHB4nwDY05zTcTavQjxAb7pgLYNsvUbjsBA7bydsZDIF+NABaNg92m87h5XTppiswCaHF5S7gtXTu1008/o+HcZHOY9XnC2bnTYlc9zi3s2VSnMvCoxw1Fj9RoQdillgIDcaxFL5h6+ENnBM5zKpDnKOpTJpKEdmRj+kicLeKKiOUDlXz0HPAca4gC9iTKyxinJjxQP3CoCp7BLGpIeBkZPPUzogPd0LMx5Tav7YW+wFlv+nAEeEHsF6wK+hK/n/DT6/aefKAKzBu2spy3JmMGQv5U8a8oRcvGFrVMnrh2A9rITTJd7sLK7D076g6wPJfM0upu/k4CaCCcf1NG0uqfNNg7r/I0hV4v2ufjVQWEz5GvJaxq+AVstC+5BdkUeflg+bvjWXw1xAJlfITNK/Y0cbpfjp5EEYDe2vEd8kygbBq9dWC3k/monB2IdB5Gq3gIKW4V8za21CTeaYiQDX/OKyzoQ9vsJinvOVmxzORCkpzURk7NeRA2j/eU50HIOaPu8LNc6BmiB0b+l8d+84vyFPHoE3aMdWsxuSzRUqxjcrqABkYkNluvDU4w7Gechwy5TGLxDlSE94zM98ZjUrkkeRshT6MSGRu+C8NQLWVxIFtWzDnAmuQJ+KMR5ZF7wdV2cq7Cl7b3PiD+uzn9UXdYULNrsFXgy8QE40wEAP67Evz//+mtDWOZL35HuIvMHHrBWDlCGaQugt5SXbDvNMJnhSExdBOE8zGQLAiPb018t5ECi4yBaw8UtNPJbjnuf0JswlYGPAyEj/14CU9bItz07Y02HAv/Cjm58TBOuFvLSk+Q5cBYcoG6Oq8hoxkXNSkqGhgw1s4sSnRrzAumrEfpY4LuT/eREnIcbHIEbVyEhN8H1tLOdRp62OBRLDJq1zg7IY8yrh5W2L5jDz2LREH3qs2XztsO2N5XuagHCUcNgDclff2XnH3SY6WGMcKjjoVqyPLaCHPjMd2NsQpXjKAmHHaGQ/r3D1lul2o06r2O3845DEkMbDnc6DlKmVFTjKWLQT2Qw2Io7g+4bwnTi31cU8xIno9ROSRIkpi+NrABqS9iBnSPZMIt88p4DngNNccBMJbm4WJD+NYaepjNO8tISrtHC2Fvl/bZueDtVZlB3Oky/GdLp8yKZLjsPtEcvM/Qih+kBORxYsw4COfoE1i/I4jQd+zMIGVb3z0LO6MXaDkuyrOnPv0j28mYfHaBRop5GK/OUW950PHxGDuB4UyYryuQD5TvTaEHSl9RXjSSMKfsFMEPuLbe/OsgBp+Og/MhTxDn49UAwxnYf9SnhE8C0U9IdQqHh3sKHvtlenzF4VhrZwHkotCWs6G7LZXunJg3Ss6bC5m3gGiTXJ+05EHBAi6fRLzPeAkMjw841cbxjB4hb8GQ5oCvu81rDNE0zrce8CgLinIYQb5edhzAPx3jKMMJpeEdaqTt/JdBzI+c3Ie6UgzXKMEPO78jkA6M8PyNzqyIZlr2Bt/g1zwhRkXT8N9k5oAXQcggoXy2AXjrWB221fgid9wfwS3VEZ0/FQ7aJA6mOg4iNCga9d5rPGA7tyiCt+tC3rQTqVJwHFN0QHt1w33Mf+xodO0GfnudAWQ7Ynsk5dUdD1dkXq8YnPMBoviVKQ+rbeJDGQ79gTEmXNnZ558HJejNVDsPoDVD3tE+Sp1yyZGW6xwLRlTOlE4tUxxl8m1GXr8haqQ1WLA+vqc/vT4xNnc8OdWKCzZa6AFpORdgRrY4hu+tS5/N/bhnI5DiIKVYwVhpmwqscR71KO19tCdiLQ98QDu2asiChRY5egtB52PDtSYw8yBkSH495yfk6Zno+Lc+BEhwYoCsmfD+lV1dGhnomtdvSjP+FL4yNKYaLdmGaF0ZS/4dbjezWn4w7hQPnYWENZPdHJx4r4wajd0Y2JUOF5dH0tDJVDB6rnTzpy8xG0MiA3amqH5z0/G/ZCXl2TzpkUshD2RJl8Bzi9e+VcGCL3p5QR37TJhauKaW2I1qjwDNsyVXUlqyEEo+kdg68OMfBkaIZZlI8Q00rzc2NgX1x6JuBYQiLqUzakWkhpRLzXVxQIIjEWOdhEQfkwzwHaKA2cOHGc6K7HKBnUg3JB+4BhsavGK3Dsk4D3BjgNEx53rfBMO9C6ch5EL+4B12gtyYa5cROuTeSSdLYYBD9XEIeuzDqVRkrMeo1yvBOCM1aBuqy7VwsnIZGG2QHaKpXjg7Iwun5D/NzwJbxR5VTuK4sCYu24FUctuRCT391iwN5HAdzOBya4JYsXjqcB8MBVW4pWrzLoZQHgfcSKDkQKIGZAUr5sYKoRsw7Dym8OudoZHHTdP5DRxqjt3Fa6uYFI1m73HdKnY8YrD3tckMetmXzAY0LcKineFYWl//+tDmgDi1Nq0Fmltz/Zx0GY/jixI7KOJ5m1CuQw3mbuChjPHc9pu6nGYXwao4e/Kq8VjbCYs/MKLAgvU0sP3laqCszlb1mppDZQVKGZR+aEQqmoyKDraoXSTT78CcOMOqX75ICRXH8W4Ih54H/qecuWKNgIUVFT4QWA75DWG4RsjGpOw0Ek06w3d6DHXno/ILpfBw/e+g1HNCiusSLXqgtDX1PjX9TvVHmNNjgULNNIqGnFXGPVbXKlKXd7lZ1nvJxTlc0B0HRsUDnwgK840y4E4DspgSak/6xjNGXgN4Ht4ADpj0pQAeGzRB9MTSfcg6E3pG5K4vqQb3a6gml3VrZsDKP1o962fxusmQSWE1HWQA75E5qu7e01Rp1+F1OE/VvBmzhyxqW5vwWkCSlWRi//7BSDmx7j4+3rOVJXQCtjmFmofwHWblDTpZeT1daDrUiy+04iBpT4KxzMCcBBqdKf6bRn6YZbVYwRgjJzDoPG01JAGWiMpDTgeL4hMJaKm3vPIgLZ3RxwBCy4swwMrEWzLfHxxGAGydwTZHI50hUUqEST4U1ho6cCw5MqomM46HFachqEMhh0EhjmkMg/QGP3ks3qFfTjjjmzpNGf+jN+sSH2v1mlhuB/6AbHMAwLULogTb5wvvaGsOS6VURnEnf0HbNiGv1qJecpKz5pl6u6cz7Tfmibk2T8i18wHxWXaY+unbaSUJhwm0HgDqOPvuFtE5WtSZSaxZCPa4pf65y0wgSMOpQXpABtd/b1mTEE5LIgVxTlaJYJBwIhApah3q8kWFgHALH8FT4vQwOlM8vvF+iXFZhuOOpaU4jLbgxvSPBgumFA95HnQgH6A3cKCvhVKC4bCFPa4X3Ly4kj81cwWm0D2nOs4iDzrNSjoYnwU4oN3IIXAVkdEOGoe4kHMZpCHaueaAzQ2mdFa+T+HKq4WoPMPp/znOzyPZfGL19e4943kruuFdV8snK+p1orBp3lXTmwRWZPnzn0snCCV8nPB5wTOZ6z3tZpyHsAJjk/d7DN8cB1SdS12njH1LkxIxOAXeFLbhojmKfch4OFHYcbCLa/WhqlLYW1AVTkDYIgI4gH7oIMdOXAmPiWgrCBQv+FfHXgvHOg7hwPhcKZaPcmqlAydmWcfgF+ZOh2MzV749JeJWSuGB6KNV1CtzJRZNnM+9ZUw/J3MCVQToJJsSrU2HmgjuM04iOpk8qHONwnMWJO8Th37vFAcp7I6M8z32MXVxkLFlZL3JQXKsLwS5szeIQbOn4mZEZHRQ7zZOpA6dhzLfbPN972OY5EJGThYsa1V1svPfAvEm1BV2IfNzROFDWcTCEGqXNegU7irAhUAfCmV2U1JgboJgfvpsR/MC0gtuY6MSgqPMgJyUR0Ed0ngPIyNpmYpySmRXx12kOawqOQtGml5seExpJ0ZB82VEJAM6xEdw+BjscpToE0iemJxk94tIfUUYbw4SpK5SBdn97tl10FM7/9xyomwNGHzw5sBPSO6n6bkcQ1e7epBl6dpqKep5nwA+4066Bdl+MTDUc88FJ8S+NAacSLznBJpySn+s0O83agl8o99RO51PhT5fz8bpK4g8WQc+0HoFe4LcIjetE6RU0DPPSIecBvFJEdyivtU07L5pWwZtelgK8SMoExpcWAW6S4jsSrl6rryiUkYtejEUt1r/7OzjJfOaCrTqOdCfCqd2AvjmQkw+tg1g7QE46StMcqLM6iE3THBaunl/q9xRYLaqeA59Y9nIUtXYCvt4Ad4+hcstzy31yF/wgm0e77o+W0gkldOA0nKwDK0MPZ30iQ4/iW3In1jl08xQd+Qfy6zwbxHQSgA8hv1bHgXSAC+8Jic3JZsWuUb0lg6kLoDW1FF2+lj63s0xOli9dz1iljkPIDPUY8n9sG3VVfimYTyiOOf8XCMg8nEaAgtAcNzMNibhcl+ZQgnMl5YXCXrsMkVyIGwImHxOMy8qMfRTwoKGsVJvsbqehTCmfxEtljyx8QZ4mAM0SAauPEI8n3PehTMclYevCFflYxMWfSxh1f0rDoClF0gVjR7636q0yeoPNFGyP1DNwDI0ZuN4R+EC9+dW1CO/Zh91+yb6bVYl8ws9Nic/P8lPJI/IayOMZjHqZKYWM8qUe+BVZLCvnwNoHz2TEjjK8JVAzEP79N50MzwD8S2c5IDsNJ1MbmCzIxIh7G5cZtZ/AzbBbPgArOH+1lAOvVZH7379v6zC6rSE1Je9T05seTFXQNKY7sw0XuzmgJCQgRXu3tqGXmsEQaWkRPCcLZbyIM5KeQ2V7k1OVDbLlUBr218hVQqMTUo+hOZehqWkrxzIioWkKbam7pny3RjJ1bRnSe45P6QR4Nodn76QTXCOFtrdqAuwUx+vFVq6m00FMpNyBnZ8FP3PsZnUW/GhBJqWXkFHJtDrA7jGUbnluW0BarSTIAaCN+ayZBfBA7dYqKUHi5hqhgEcLYEbcz/gDDvOO/k7d3j0pDR/eWg48bc+bMuqkdhuZGpOTN63NjSesd0FF/h2je6VGvE5+yAhAoY4YtvyXhiGlbJQ2aWpYcuNKm2+GxD/EwRjnBMOBuBujwOOAfFinOYDsLJUB5GDiyohkjHhtrzjjOeCu+xogw1MSST2ZmAbxFriHOhz0ujNZNX45xvRof4Unc3A7y4mOgQkwl2b4+oAQ6xxqUwY5FsODaP/qOVArB9TemM6ZoB0bItM68XxMottaE24RcvUmQ84DdVB12XU97Z6jzpaDCzxGJ1wEbblTJxx86l87wAHrVJodONNszb1MdSBf50piuDj6Uj21KMG0yl+aTzKczPqEfv+fMh6EEMdl4UKMkzEifp0Eo94M4qS8ZkkwPrzTHNhCvXq2blNzESzG0gLcZQKs5GSQEJcr2KZxqTm8rg+tUaselIUL7tTi1EDIsIq7bV4vNc3BlW/bMfAemNitXCOOhROPKw0f5zmQkQMDbbGKPKv3fIMeUcfXiBGv9xg7w2ONcmaktVIwR11e2oSuNdLrStQaj5/hm852GB3Ams0T6PS5wiFz4jn4zr92hAPUEZVrlgXQmkky4v5nR7J2dmS+tjmWJzjkvkMpjlGEOu1xxXttl6ZuSEmQwOeUtAbAaAhYNCZdWyIW3Hcy0uwUqSRYH95BDjANaYlza7ZrsyMLsbmQLNHwvDeNE7tzyEk9AFzzPjoIy/1q5uRqQS5GQ9oogl2wrRGTRY6EDO4c8K0DpX4PIeqG+/6QOOI2fQI18kh5pU1zMAsx4fWCT4bcqu/mslOfTHnLqCt6aFyIzz9PjwNqE8I6mDt3QSfDCFnV2rOr8Hv+f0Ynzexo6F4ew/hTe5LfIXm64b6Pydva8mdG3II7kR/qTcbG2MRNLd5vnhA4FoUPjSN9f7WUA5o1oBkudgR5nESmt+GSONOO8MBxYH4hBtetehXM9AF6UqjcmU6DLpIN9UyQzge+1cmuExcOaLoFVvOYly44E8/aCTuXfOGE9ZGd44CcBeRmhkMwg/iFKwPI8gzDfiijlKc5++MAfnDwnuvVOA3g1pQ7ehlnKR/vpzOlORgRPKXoi+BpxV/q+DiBkIGMCMp0TvwoAcYEU5YT4KSXXpxYq/Im/BZDbgHwkHvL7S/PAcMBnIYhsvOuIDs0RXZNC2ROl9ap7xi4K8LOUsaS6rIZQciwc5L4hpNhFsDKDjgcpXE5Fnzrr45zQG2g2nHq0wc6jGbS3R3P0lmSH05VMpmXcUbFHfJi5qLhFf6XBnmVdtprVs6p50f4JDR8I6dhzNOpgHEapiiarwjYCtjEK4wH3mmAJCLwEe3nAD18yM6VHNw0YjXSEK6lQebWdrqQHNAV32oEq8glQ3clh8Q4DS9HM17gtMPuqYunox/yjZFhGSnR8BP8b4wI8pVpmoN4Dmz82Q5PU9RmJ8gnn6UqOMAJ07Q54YnRWZ8DtVPc5nRpO6LlbLOqILVrOGyniLEb0F9jF/3h2iR0+Qy4wQFsqBNyHxp3gMe/tpQDYfnLmY+ZstZSqj1ZUQ48cxxshDkN2s4vkyLQCZi/YTBt1dMqJ2JvhEUxJf8f2PmRSzkigJkpGChiGUdOBWwV0DWG2iIZ/bOYe96E118nyAE5tnIicQ7nZG+QlkXjPLBgEbhryZ7kF+PTyFxOhTVAFtWrvQFXMD0pg9Ng6knQ05m6eBq8+wsajQz/cHGx3gee6B/biGRa0E55TmFD7EJM23EgfRXvWJwo/3y2PAfawgHa9Bm0PKC/Fmk02XVhWov2AjY0LOVY5LQ10pL18S3hgBxxSHnoXVwseQ5aQpYnIyMH4hwH86nmmFG4U+4hjsMvBAY9rTgRdiRiq95XGWPGqJJhFb1ZnEr8mvv/MPQ+8f2Y+6MckqzDU1YBPQA/51t/eQ5oTvwENsQ2OHHsUSNkneB7jRTQGGm0SyMPU5fzoAZLDq+R72A6zTu+WtPg/Sur/FJPpBR7pD/RM/MVOA4P5zLPU/Ne4U2WMjVnOwB7LV3D89mVx3B59mHzLzfoyV3abcjEEU2DKxIvOW+eDZ6CjnMgOHslWOA8c+XFjFCwPgyYN3EzGqzO1G5qvu13MbK7cVvswgnt8RX6atbdbJwn5cEaB3fet+rpBUR3jwZ7zGNMY6855LpvGXK6VNzB9YX3LQaalMPK9gj2mG+a6UKYdILkFcL1bz7YZvoogBtnhPVgHeSA5Agjx2znK8PeyqYzJ9YAHxtHAYdBMisnAtl8i5zp2wfutf70mQ8tuaPB0qscDPWgLbXzVyjDQYT7V/ILxDX4fs3tAPT7Y75dcZ/FJSMCfu1HC1x8VnkDq/UOcWc7mMaIMvtNjgV4Zm1noNZlIGmrRunEGVF9oF7FrQdqlDSfeLc4kFI/n2WG+mnOdqAOzL8HdWDfzktnUoffazqL3/TgGdtO5kXT/mxbfkcZr+w0wJPJ3ylnJIvj8Cz/tlFfPQus+EUGIQ7DHWg/5xKmfn+NonlTMTkeXcs4oCkrGI8jZOQTstLL4jwoC3Ye7kT/jRPx6tUIo00LJwcEjRTO/xXDpxucBe07vnYZsQY+5icqv3bYPQYqPkh0yXHB4ZDjcTaXRgvkENhRxqEr4+qN1Kgn9wK4cRRW+gI8ZstHRo1eHBoXhW3D/6yyWyet8Osd+B+881Anl88Ht6Yh0dHyhx0tuHXk3JztgM79HRmM3fSAhbSTOMfCgdNHdYgDassp4zGdPQvIHnJvuf3Vcg5ctI0+a3R9gq7UHZde0L7bjTG4vr4I9wGnxgFzYjiZerDOwyRvBuVEyGhTr7SdkqcFkGOti1CYDP4STkMx+SUTNLgmL6/SdhHLm+H2w2ee5mBGcIKRzKSzHaZk98E6Fu3PeRsopNcXpy0YyfPTltpQIp2lwXbQaAQxdhpSNGNWx34m7C5u6ijOrJ/OEmXY6f3f9h4f5Vxqqury9LJ3mjkKHAeG/ePmGR47y5peIEOQdDPtuBRH34794ePCfdhpcUDGIz1bY3IVOA8phw8dI/covnlZ+cXxlRL9knt60zEyWHMatvf9nh7I1JOg5dypk0BTfSBrECXNyEawY4vfmSXKmJT/cpq985DCJB+diQMaQVT9zHISNLATkD5oOughcutY7KcxHsb79+5zwDiatiNIW/R2P0ennwPqtVn4fMnzNwyflV3DcNScayGq0sZgeEfC9+r55bnNSwSKapj3Gw/fXQ5I4eydB+0LHfRYPDMij5G7vfzSa0Z6heVXzjuO7xV1cX4MutuYhqY5QJcWRS7S6FNvpGAp99khbHRnFuKOLhOH9HTl3TsPXSmp1tOZ5yTocAvW2G2Z5YSQ29jd1FrPBU9gJg6oIwhAs7te3MhTJiQe6GgcuFAvn3UelOiNnW94LAfCbHOJkbA2aeN1FnUa+H4go4u5civ+++tMOBB1HsjyG4zIzRF7LaqUX0S3L6P5gTq5PJPie5HNyDSH2GlI0Q/UG6kecsJit2ANnRBkYhH9zv93c8A7D27++NhsHLDrEzWC+E6dK66voo5+DGyw6UHCbmouvD6uOxxg7dqtqI0beepOLs6DUjNV6cB5UM6NA4EBtqHRnVftAQqftv+TkWdHGdYITeZtWuOKhrURRuiIW8XF+7DT5cCB83CJA/lBsmsdiEHVOTcjDNp6OCK/GKmZt2mNo8eO9OmMiDnx2ziYcwlTDyOjh5mmOWDkTuFLbG+kcUKCIfA3TYykdrm8vPPQ5dJrD+12W9VelhHE0NEHVjrw2ZXHCXn2oX/pDAfMFNOg8+xadmdnCD9DQve7Ksl50A41mqOtRhtezDHAJjzv8ADvKMgH/q8wbNZ69r9/39reQV7dlxptegZHIB8xvUDTMcz2rWY+rd3mMus2rUkpQfctcTrzYZUEU1c4vElMkzxqe88mr1HL6auEN5JFHNIxsroCoZyHLc8P5P0Dz8/05i9fIbdF1w4Y5/niYgzeMQ1buHPXPfVB234qzXJX0Fi24swSZHYC38blMlTqazPNgTL7zcquyjLxQl9tKRdztoMd8t7D8m62fET3LAgccTtx7T+s7o+z/lWXTPWY5Dxoi1Z0diNbtbZADqtn6rExoleoQ/EyH+wmVytF0re0/2ZbVVuXE9Oz7aTsDLOo+nBHRbub2to6IeNERDVFZJBH6Zd1TclXhjalHBrNg+xQ6Lsls7I5RYvrapRWF2Fl4zLIWtkkSn2/dxyEJeo88DrRtCF6VwfssTxm5bu2zBpjoMtoeoeB1qNg9VlPjgaVfmNe7A9hMpivzCt74hulwJ74vK9kxJHWkv9bC17qoR5gGXMw+z+lEOX/eM0nN/a+j/ucfG8I193E1Xb6KuXJgfMwRF5/NnKIUymHWM4pMisZFF/WxIfyt+I9eo31Qg+YOauEvzdGfhUWyPpH4hZZHWfhcl00rDMMW3PmA3AhTa5P6ox7IK9XJDDgFp/irnv4sImLqCpMRoPd4/utxfmFZyxvoHdDnEYvRzxFdxTOueUjsHVea5Df2DtWP9SZeA7cieXZoPOg+c7X5EHlKT7GXYl0xwGfUxgN+wZ9J10nvfKifba8UD25VydgnbyR826NQdUFXa66YMqaqRC32B3LADz4lRPCKPIMufig3Rdlr0Tja/6fRR5Fu6G/ZloKod89Pq6xvfStyiFJnzaeB+xOdVxtLJ1he83ri6txWl9QVE1AFllrn+5TpaTgdtwqmMEBLzSve2xgNF0jmLKxBHYVvc1UJBuvRZ9VT3eK0mSnPe3qTCOaXvT/Pu0KtjA0/JMRWeFVMX07Y+RWSF8dqCQH8HKrOyoTktuIvK6Jl4y7buEwp6Nr2lMUV1V0W1pFw6oqnCXxDKDF8EZ1vAwuy2va+eKX+G7LaKvyK4ppXw+QjaI4iny3T7cC/VAk/aq+aSAfVcrh2MhQCfmpio/HxJOkB4vQUEFdHoQyJP0Ss44hM1lWP2354NA2yYyjAOBJyGOKbZeLLbZOzXJ9lBE4Iru7su2QkqyT1oxZygPWXVmrUsDycCwvbMTwWub9tir4UCHqWQYnwq1F6bMyOOK+rZC+TjgOlgdh5Us1OI0MBU6FHItxHA9rChtgGG8o922ZhrQG2kLelVLaFRgbJmsqH8unMvKnPG251zXwy4myqvrnTOQIkfBuyV3KEcxJZlVyeJaOg3gdMcCedaLkLIdeZXU56JRUPdwW3QK+wTb/JOSxKttOuqAOeyWUzYjslmqHhK9uWkOaK3x2V9aqErAKmXmIKmRu44ZXFcYBwl2L4yCmVURfrYrisHAreA/lo7TiqYCWQxR72oo2oIcIK37f01e0x6cqY8PmS/QsTQMQjM7k7m0Un5tqQKqofxWXb250FZdn1vSrkMOzdRzE5IgBVthYr7LsLT1r1UXVC0jMXZdDeniO+f6Y10nIYxW23TF0aUR2S7Xhx6C1BiHsrqxVIWA1MNSg3DfGJadUVEXfnp6CIw8Id22Og/JYAX1dcxyU7dKVT0gqvtpIU1wWS9EZNu5xiIuGlZ26ZOpYQyM8ZetfUZ5V9V0d5ZmRtrJyeNaOg3hc1gCroeyfTV0SfRllIQQzo7UaiSQgt+MRIin4PAl5LGvbHcsYLyu7KuNj0VpQnlyfdVfWogJWoIK7mFI4rq2NcBm66nYcxOyS9HXRcVC2nypfQadOSKq4NCWJcl5LkaleVYGzZhyFeVeDsWGyKh1UdOqS5f9Wda1mvsWiL1P/YhEeMbCu8syYhSc5zFlvoPvsHQfx2BpghXRPXWVvbQvVx21efRgp11lGGaoS7CTkMWrbwZxcDpjaMMlFlUxNwlXWeTgmrUl5KBHeXVmLVPCjCUsCo8XElQRBjXACTKPBRY0Dk68jVMQS9DVd9mXKdS838HndhANsp8psjezmNH7KZLyCb58UV446V5exYfMjmpbiJfeKsMyNXkhXU1PEita/CsqxFIqQb6WQlPv4SQ5z1B/o9o7DE9+L8nCmuvaEprp/zxyaQL9kr8tWBzShz+FAUV62Sh6LOg9G9x7BXgklrYzzcGxaQ5orfHZX1mxvXWC0M0SYt4egLBOjhpcasbL46vy+iHEgA+hY+SpIX5cdB1PcofETUSSZG6mi8mLrzVJpqqe8oUauKPnhd/upBZKdMND1DHntgikbF6YBb1MXwUfTAn6tbwirvfyj6Yb/i9S/8NumniGvm0rfppu7AYXuVhlqDfNPyRfhYW2OQ1iuYZ1Q3cyhI5WXrb5piK9FeNk6eSziPMDzo9sDRZ2HJmitQR67LWsSsnCqgDGE2DJRyqgGRhmUVvHvHRa915VWlXhDRZjZ0Dqi46B8FqDv6IqiyvIIcVnlszbKJDA4Z8RVLr9yGEIe27TmdaQT5usYzzA/WWT6WIam1Q8yHjLLp5WBRkct8/DyGGWblsaxyjONDuJzNaBWPiQb4wy4zwUkLw/rdhwM360Bq7qceepSaPRii8gOaeLKy8vWOQ5iWshHeL/mNbU9zKNvqyyUIs5DU7RWmW+Lq/uyFnUgTMEwbKjKq4ItyzBjdAV7uK8tbvUozsCbKtBl067y+zzGAfk82ohDmMec9GU2zEL8bX4eyO9WvKhg+srAKuCllVszlaaKOtEWXmaVmSMbmlKopnNBT3iVqieAm5syatCgzMrLNpT9kcszLcsq77XKT/XNBSyHoelydtHXYNyeh/Bn7qLjmGVvDcOgbDNOXYJ+1f0md1fc87LL8mjbLrVZa+TBqUOBacweyOs8NEmrq14VjGtc1voFCX/2mTGK+v2pOVk6PC06OLVSp/OuONFZp7dKEM3FSZIr+9cs2Nq9ehUK6Nie1jsiXqeGBif19vsLnT7J61ZhXbtkHJD/t5no7vffk9dZJtiKgNpOX0XZTEQjZcnJ0rcA6FT08Lrnz5oKsomTXcm8S2759gG5X766uJjpxNMQ6ak888gMJ4FWomey8E4GDidIv8sCG8JA3Ndvf/0lndOIfsnDy5DmJp/HLM+UfKoBXQFj2ooUWBqT/s/RticV/jwAcvHwiGWvqZHzzO3mU1ndQ+P46fWo/3Lxsq3yaNvDT5k414C9EtJl2uCLixXvl2GY89kgrU66ikU2KmuVN+jGibi4GO96vTH8GHJnU+oARq5743B8/7789u3bOhLe2b8aiUEJDjJkYNVE49Z2+jLwrQoQjRbc9h4fx5SVDMm8snvPN3KWl02UYRUMyIMjq8wc2xFWDzP50J35et3rLZp08LLyMnOGagQ8dnmmZGVAeU9TYEx002WchcaGYDLz8NhlrxHg/sWFdHHmCxrnAG8zf1AtYGZetlkec/C9EXslLDLbgXcbvqc8G6U1hbYi0Y3JWuWOQ1zuNe3o78CJ6O0eHwdRRRAdjaAibZpsvONo92HnzYGo7FJZhjjEQ3GE/xv+b/Tfy6244C/PAc8BzwHPAc8Bz4FT58D/B/o3hJzAlPSEAAAAAElFTkSuQmCC"

const company_id = 223218;
const ACCESS_TOKEN = "65613835363364352d333839632d343966632d623865662d623936336333356563316562";
const Upserve_API_KEY = "3048326406c4964a2b917b9518370685";
// Expire In 2024/01/05
const SOS_TOKEN = "wHDwQhPZ4klkElciRIrnQFerIp7Tln_C_1lDPdtN-zy-QTYifIjhF-avxIbF_7Ra8oA0xhXWDg2Z96fWgaetMlO1613M4bgEbIgSmDOfEyWbQkE5etJilnBmHbRXCqMpbmQs17s5-TBlTPqDdU27rTl0gtwlHnyBxqlPp_no3fB5Q08JrxAmbaXWEdxFNHu2yE0JSfAV4k-RPVVZDt6iN9-NhXdg3-JrEKvMDlwdYWDRhm6rnaHSNUBGhVtYj0r4E8Wja4nlSUvs9sYbTaLZMIXnzH4as3MQyJ-55mUzYPBF7ypE";
// const SOS_TOKEN = "u3HrboX6V-lUX6f93VHi3tX4HsbKMJWnhGXjcbsnhurRjhtcJn-RwqI-vS5m7ZoyC0B1fp3flCw7cIc9YEHVR4YkaT8ZUynI-K0mYKB2blP3mvp5nbixhIWgB41P6oCAjb29Kxz0Cb5yA1ubKa_qYIbllEGagpTtWMWrzGVegwvZ4phAjg6qyuijN1vNnpoJ5uVZbmLX4opWNzJRlvZJ-K212eFMhE1BycSTnGBZpd-rG6Kr18HhNeE2kU98FSmpCYYlwwSc_zm3RXBKhmLHeVtfsizfD4AZi_svcsU0UXBYjgc8";
// const SOS_REFRESH_TOKEN = "LO55L0vrxHBadzsSx0lzj19NtC04PczJuV_eQwBUZW3JW62X97AvzqixFoMuDM0e7bey63peBWaMYWJ0HaDKJ3JqhIfla8HRacqrSVJKFB7gXIQymmjGceWrkP8UHwyC5HP6gdMQ0q48-7X9k_Qjf8W0BcTYfbcBEbEsZhy-XfWZ2ZLhzU2oTfci-fNdc7UDs5H-9ohdWJ5R93JFHyPx89thGMU95miymYaNPM7km-jzH-I3gFAtQxQOjVm2scKEJ9KHVcVSGv1WNd43NNra2qtP4HwGHk2nWi87Wlx6BHb9o7n7nafA0ewGOPMN7h0DznbSiA";

const Airtable = require('airtable');
const base = new Airtable({ apiKey: 'pat4QLjT5Em257gfy.ca377661dda17528c99526de63d7862a591169526b20da3a34c4c9070f7f59f4' }).base('appm3mga3DgMuxH6M');
const cin7_base = new Airtable({ apiKey: 'pat4QLjT5Em257gfy.ca377661dda17528c99526de63d7862a591169526b20da3a34c4c9070f7f59f4' }).base('appKWq1KHqzZeJ3uF');
const db = require('./db');

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
        width: calc(33% - 12px);
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
        <b>Ref</b><br>
        ${body.ref || ''}
      </div>
    </div>
    <hr>
    <br>
    <div class="d-flex">
      <div style="width: 50%;">
        <b>Customer:</b><br>
        ${body.billing_dba ? `${body.billing_dba}(DBA)<br>` : ``}
        ${body.billing_company || body.customer_company || ''}<br>
        ${body.billing_name || body.customer_name || ''}<br>
        ${body.billing_address || ''}<br>
        ${body.billing_city || ''}${body.billing_state ? `, ${body.billing_state}` : ''} ${body.billing_zipcode || ''}<br>
      </div>
      <div style="width: 50%;">
        <b>Ship To:</b><br>
        ${body.customer_dba ? `${body.customer_dba}(DBA)<br>` : ``}
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
          <th width="10%">Shureprint Price</th>` + (body.showUnitPrice ? `
          <th width="10%">Unit Price</th>` : '') + (!body.is_stock_quote ? `
          <th width="10%">Lead Time</th>
          <th width="5%">Set Ups</th>` : '') + (body.showPreviousPrice ? `
          <th width="10%">Previous Price</th>
          <th width="10%">Saving %</th>` : '') + (body.showDiscount ? `
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
          <td>$${item.unit_price ? item.unit_price.toFixed(2) : '0.00'}</td>` + (body.showUnitPrice ? `
          <td>${item.unit_price2 ? ('$' + item.unit_price2.toFixed(2)) : ''}</td>` : '') + (!body.is_stock_quote ? `
          <td>${item.leadTime || ''}</td>
          <td>${item.setups ? ('$' + item.setups.toFixed(2)) : ''}</td>` : '') + (body.showPreviousPrice ? `
          <td>${item.previous_price ? ('$' + item.previous_price.toFixed(2)) : ''}</td>
          <td>${item.previous_price ? (((item.previous_price - item.unit_price) / item.previous_price * 100).toFixed(1) + '%') : ''}</td>` : '') + (body.showDiscount ? `
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
      </div>
    </div>
  </body>`;
  return createdTemplate;
}

const useOrderGuideHTML = (body: any) => {
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
        width: calc(33% - 12px);
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
        <div style="width: 60%; font-size: 15px; font-weight: bold; color: grey; text-align: right;">Order Guide</div>
      </div>
    </div>
    <br>
    <div class="content">
      <table>
      <thead style="display: table-header-group;">
        <tr>
          <th width="10%"></th>
          <th width="20%" style="text-align: left;">Code</th>
          <th width="30%" style="text-align: left;">Item</th>
          <th width="20%" style="text-align: left;">Note</th>
          <th width="20%">Qty</th>
        </tr></thead><tbody>`;
  for (let item of body.items) {
    createdTemplate += `
        <tr>
          <td><img src="${item.image_url || ''}" style="width:100%;padding:0;margin:0"></td>
          <td style="text-align: left;">${item.code || ''}</td>
          <td style="text-align: left;">${item.name || ''}</td>
          <td>${item.desc || ''}</td>
          <td>${item.qty || '0'}</td>
        </tr>`;
  }
  createdTemplate += `
      </tbody></table>
      <hr>
      <div id="pageFooter">
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
      let html = body.order_guide ? useOrderGuideHTML(body) : useQuoteHTML(body);
      let file = body.order_guide ? admin.storage().bucket().file(`order_guides/order_guides_${body.ref}.pdf`) : admin.storage().bucket().file(`quotes/quote_${body.ref}${body.signature_link ? '_signed' : ''}.pdf`);
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.log(err.message);
      response.status(500).send('error getting content');
    }
  }
});


export const generateOrderGuide = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(req.body);
      const doc = new PDFDocument({ margins: { left: 30, right: 30, top: 80, bottom: 30 }, size: 'A4', layout: "landscape", bufferPages: true });
      let file = admin.storage().bucket().file(`order_guides/order_guides_${body.ref}.pdf`);
      const writeStream = file.createWriteStream({
        resumable: false,
        contentType: "application/pdf",
      });
      writeStream.on("finish", () => {
        console.log('Finish WriteStream');
        file.getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        }, function (err, url) {
          if (err) {
            console.error(err);
            response.status(500).send('error while signing document');
            return;
          } else {
            response.status(200).send(url);
          }
        });
      });
      writeStream.on("error", (e) => {
        console.error(e.message);
        response.status(500).send('error creating document');
      });

      doc.pipe(writeStream);

      // table
      const table = {
        headers: [
          { label: "Item Name", property: 'item_name', width: 280, valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Pack No.\n(Size/Unit)", property: 'size', width: 60, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Par Level\n(Low | High)", property: 'low_high', width: 80, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Sunday\n(I | II)", property: 'sunday', width: 50, align: "center", valign: "center", headerColor: 'grey', headerAlign: "center", backgroundColor: 'grey', renderer: null },
          { label: "Monday\n(I | II)", property: 'monday', width: 50, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Tuesday\n(I | II)", property: 'tuesday', width: 50, align: "center", valign: "center", headerColor: 'grey', headerAlign: "center", backgroundColor: 'grey', renderer: null },
          { label: "Wednesday\n(I | II)", property: 'wednesday', width: 50, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Thursday\n(I | II)", property: 'thursday', width: 50, align: "center", valign: "center", headerColor: 'grey', headerAlign: "center", backgroundColor: 'grey', renderer: null },
          { label: "Friday\n(I | II)", property: 'friday', width: 50, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Saturday\n(I | II)", property: 'saturday', width: 50, align: "center", valign: "center", headerColor: 'grey', headerAlign: "center", backgroundColor: 'grey', renderer: null },
        ],
        // complex data
        datas: body.datas
      };
      // the magic
      doc.table(table, {
        padding: 3,
        prepareHeader: () => doc.font("Courier-Bold").fontSize(8),
        prepareRow: (row: any, indexColumn: number, indexRow: any, rectRow: any, rectCell: any) => {
          const { x, y, width, height } = rectCell;

          // first line 
          if (indexColumn === 0) {
            doc
              .lineWidth(.2)
              .moveTo(x, y)
              .lineTo(x, y + height)
              .stroke();
          }

          if (indexColumn > 1) {
            doc
              .lineWidth(.1)
              .moveTo(x + width / 2, y + 3)
              .lineTo(x + width / 2, y + height - 3);
          }

          doc
            .lineWidth(.2)
            .moveTo(x + width, y)
            .lineTo(x + width, y + height)
            .stroke();
          doc.font("Courier").fontSize(8)
        }
      });
      // done!

      let pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        console.log(`Switch to page ${i}`);

        //Header: Add page number
        let oldTopMargin = doc.page.margins.top;
        doc.page.margins.top = 0 //Dumb: Have to remove top margin in order to write into it
        doc.image(logoBase64, 30, 50, { width: 200 });
        doc.font("Courier-Bold").fontSize(18).text('Order Guide', 650, 40, { align: 'right', width: 150, lineBreak: false });
        doc.font("Courier").fontSize(8).text(`(I - On Hand, II - Order)`, 650, 65, { align: 'right', width: 150, lineBreak: false });
        doc.page.margins.top = oldTopMargin; // ReProtect top margin

        //Footer: Add page number
        let oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
        doc.font("Courier").fontSize(8);
        doc.text(`Page: ${i + 1} of ${pages.count}`, 0, doc.page.height - oldBottomMargin, { align: 'center' }
        );
        doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
      }
      console.log('Doc Done!');
      doc.end()
    } catch (err: any) {
      console.log(err.message);
      response.status(500).send('error getting content');
    }
  }
});


export const generateSalesReportForCustomer = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const body = JSON.parse(req.body);
      const doc = new PDFDocument({ margins: { left: 30, right: 30, top: 90, bottom: 30 }, size: 'A4', bufferPages: true });
      let file = admin.storage().bucket().file(`sales_reports/sales_report_${body.customer}.pdf`);
      const writeStream = file.createWriteStream({
        resumable: false,
        contentType: "application/pdf",
      });
      writeStream.on("finish", () => {
        console.log('Finish WriteStream');
        file.getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 24 * 60 * 60 * 1000,
        }, function (err, url) {
          if (err) {
            console.error(err);
            response.status(500).send('error while signing document');
            return;
          } else {
            response.status(200).send(url);
          }
        });
      });
      writeStream.on("error", (e) => {
        console.error(e.message);
        response.status(500).send('error creating document');
      });

      doc.pipe(writeStream);

      // table
      const table = {
        headers: [
          { label: "No", property: 'index', width: 30, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Item Name", property: 'item_name', width: 250, valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "SKU", property: 'style_code', width: 80, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "Shipped", property: 'shipped', width: 50, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "MFR", property: 'manufacturer_name', width: 70, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null },
          { label: "MFR SKU", property: 'manufacturer_code', width: 50, align: "center", valign: "center", headerColor: 'white', headerAlign: "center", renderer: null }
        ],
        // complex data
        datas: body.datas
      };
      // the magic
      doc.table(table, {
        padding: 3,
        prepareHeader: () => doc.font("Courier-Bold").fontSize(8),
        prepareRow: (row: any, indexColumn: number, indexRow: any, rectRow: any, rectCell: any) => {
          const { x, y, width, height } = rectCell;

          // first line 
          if (indexColumn === 0) {
            doc
              .lineWidth(.2)
              .moveTo(x, y)
              .lineTo(x, y + height)
              .stroke();
          }

          doc
            .lineWidth(.2)
            .moveTo(x + width, y)
            .lineTo(x + width, y + height)
            .stroke();
          doc.font("Courier").fontSize(8)
        }
      });
      // done!

      let pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        console.log(`Switch to page ${i}`);

        //Header: Add page number
        let oldTopMargin = doc.page.margins.top;
        doc.page.margins.top = 0 //Dumb: Have to remove top margin in order to write into it
        doc.image(logoBase64, 30, 40, { width: 200 });
        doc.font("Courier-Bold").fontSize(18).text('Sales Report', 400, 50, { align: 'right', width: 150, lineBreak: false });
        doc.font("Courier-Bold").fontSize(8).text(`Customer: ${body.customer}  From: ${body.start} To: ${body.end}`, 30, 75, { align: 'left', width: 500, lineBreak: false });
        doc.page.margins.top = oldTopMargin; // ReProtect top margin

        //Footer: Add page number
        let oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
        doc.font("Courier").fontSize(8);
        doc.text(`Page: ${i + 1} of ${pages.count}`, 0, doc.page.height - oldBottomMargin, { align: 'center' }
        );
        doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
      }
      console.log('Doc Done!');
      doc.end()
    } catch (err: any) {
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
    location: "Bird Streets Club",
    user: "upserve_bird-streets-club",
    password: "NK2TaqbGSVzm",
    location_id: "282508",
    type: "nightclub1",
    full_shift: 6
  },
  // "282509": 
  "Bootsy Bellows": {
    r365_code: 101,
    paycome_code: "0OA74",
    location: "Bootsy Bellows",
    user: "michael-green_bootsy-bellows-2",
    password: "88ZADAE9DNBC",
    type: "nightclub",
    location_id: "282509",
    full_shift: 4
  },
  // "282510": 
  "Delilah": {
    r365_code: 401,
    paycome_code: "0OA77",
    location: "Delilah",
    user: "michael-green_delilah",
    password: "3WgrMsw3zRyH",
    type: "restaurant",
    location_id: "282510",
    full_shift: 6
  },
  // "282511": 
  "Harriet's Rooftop": {
    r365_code: 1201,
    paycome_code: "0OA83",
    location: "Harriet's Rooftop",
    type: "restaurant",
    location_id: "282511",
    full_shift: 6
  },
  // "282512": 
  // "Petite Taqueria": {
  //   r365_code: 602,
  //   paycome_code: "0OA79",
  //   location: "Petite Taqueria",
  //   user: "michael-green_petite-taqueria",
  //   password: "vwLQdp7dNotf",
  //   type: "restaurant",
  //   location_id: "282512",
  //   full_shift: 6
  // },
  // "282514": 
  "Poppy": {
    r365_code: 701,
    paycome_code: "0OA80",
    location: "Poppy",
    user: "michael-green_poppy",
    password: "hTWCQJgVGyWR",
    type: "nightclub",
    location_id: "282514",
    full_shift: 4
  },
  // "282515": 
  "SHOREbar": {
    r365_code: 201,
    paycome_code: "0OA75",
    location: "SHOREbar",
    user: "michael-green_shorebar",
    password: "zEHXeXRGZEVX",
    type: "nightclub",
    location_id: "282515",
    full_shift: 5
  },
  // "282516": 
  "Slab BBQ LA": {
    r365_code: 1101,
    paycome_code: "0OA82",
    location: "Slab BBQ LA",
    user: "michael-green_slab-la",
    password: "s4dzzx1-seEN",
    type: "restaurant",
    location_id: "282516",
    full_shift: 6
  },
  // "282517": 
  "The Nice Guy": {
    r365_code: 302,
    paycome_code: "0OA76",
    location: "The Nice Guy",
    user: "michael-green_the-nice-guy",
    password: "ESSshcA1k1bS",
    type: "restaurant",
    location_id: "282517",
    full_shift: 6
  },
  // "282518": 
  "The Peppermint Club": {
    r365_code: 501,
    paycome_code: "0OA78",
    location: "The Peppermint Club",
    user: "michael-green_peppermint",
    password: "X1gVdkgypoWL",
    type: "nightclub",
    location_id: "282518",
    full_shift: 5
  },
  // "283224": 
  // "Nate 'n Al's": {
  //   r365_code: 1004,
  //   paycome_code: "N/A",
  //   location: "Nate 'n Al's",
  //   location_id: "283224",
  //   full_shift: 6
  // },
  // "282512": 
  "Didi": {
    r365_code: 602,
    paycome_code: "0OA79",
    location: "Didi",
    // user: "michael-green_petite-taqueria",
    // password: "vwLQdp7dNotf",
    user: "upserve_didi",
    password: "gWHgUVcxpEbs",
    type: "restaurant1",
    location_id: "282512",
    full_shift: 6
  },
  // "317863": 
  "Slab BBQ Pasadena": {
    r365_code: 1103,
    paycome_code: "160390",
    user: "7shifts_slab-pasadena",
    password: "iRufspmwkGMr",
    location: "Slab BBQ Pasadena",
    type: "restaurant",
    location_id: "317863",
    full_shift: 6
  },
  // "361814": 
  "Delilah Miami": {
    r365_code: 405,
    paycome_code: "165682",
    user: "upserve_delilah-miami-2",
    password: "J_YEk7TKJYDt",
    location: "Delilah Miami",
    type: "restaurant2",
    location_id: "361814",
    full_shift: 6
  },
}

const getMonday = (d: Date, week: number) => {
  d = new Date(d);
  var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6 : 1) + 7 * (week - 1); // adjust when day is sunday
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
        console.log(option);
        console.log("Request Error: ", error);
        reject(error);
      }
    });
  });
}

const getEmployeeData = () => {
  return new Promise(resolve => {
    let airtable_employees: any = {};
    base('Employees').select({
      fields: ["Identity", "Employee ID", "POS ID", "First", "Last", "Email", "Mobile", "Location", "Paycom Code", "R365 Code", "Role", "Role Id", "Reg Rate"],
      maxRecords: 2000,
      view: "Grid view"
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        airtable_employees[record.get('Identity')] = record;
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log(`Get ${Object.keys(airtable_employees).length} Airtable Employees`);
      resolve(airtable_employees);
    });
  })
}

const getVenueData = () => {
  return new Promise(resolve => {
    let venue_data: any = {};
    base('Venue Weekly Data').select({
      fields: ["Identity"],
      maxRecords: 1000,
      view: "Grid view"
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        venue_data[record.get('Identity')] = record.getId();
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log('Get Venue Data');
      resolve(venue_data);
    });
  })
}

const getTransferData = (fromDate: string, toDate: string) => {
  return new Promise(resolve => {
    let transfer_data: any = {};
    base('BSC Transfer Table').select({
      fields: ["Identity", "Transfer Amount"],
      maxRecords: 1000,
      view: "Grid view",
      filterByFormula: `"And(DATESTR({Date}) >= ${fromDate}, DATESTR({Date}) <= ${toDate})"`
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        transfer_data[record.get('Identity')] = record.get("Transfer Amount");
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log(`Get BSC Transfer Data from ${fromDate} to ${toDate}`);
      resolve(transfer_data);
    });
  })
}

const getOverPointData = () => {
  return new Promise(resolve => {
    let overpoint_data: any = {};
    base('Reports').select({
      fields: ["Identity", "Override Point", "Reason"],
      maxRecords: 1000,
      view: "Over points"
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        overpoint_data[record.get('Identity')] = {
          over_point: record.get('Override Point'),
          reason: record.get('Reason')
        };
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log('Get Airtable Over Point Data');
      resolve(overpoint_data);
    });
  })
}

const getDelilahAdditionalData = (fromDate: string, toDate: string) => {
  return new Promise(resolve => {
    let additional_data: any = {};
    base('Delilah Additional').select({
      fields: ["Identity", "Amount"],
      maxRecords: 1000,
      view: "Grid view",
      filterByFormula: `"And(DATESTR({Date}) >= ${fromDate}, DATESTR({Date}) <= ${toDate})"`
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        additional_data[record.get('Identity')] = record.get("Amount");
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log(`Get Delilah Additional Tip Data from ${fromDate} to ${toDate}`);
      resolve(additional_data);
    });
  })
}

const getTipReport = async (fromDate: string, toDate: string, locationId?: string) => {
  let users: any[] = [];
  let airtable_data: any = {};
  let airtable_employees: any = {};
  let overpoint_data: any = {};
  let venue_data: any = {};
  let transfer_data: any = {};
  let additional_data: any = {};

  console.log('getTipReport Started.')
  // Get Airtable Employees Data;
  airtable_employees = await getEmployeeData();
  overpoint_data = await getOverPointData();
  venue_data = await getVenueData();
  transfer_data = await getTransferData(fromDate, toDate);
  additional_data = await getDelilahAdditionalData(fromDate, toDate);

  console.log(`Getting 7shift Report from ${fromDate} to ${toDate}` + (locationId ? ` For ${locationId}` : ''));

  const options = {
    method: 'GET',
    url: `https://api.7shifts.com/v2/reports/hours_and_wages?punches=true&company_id=${company_id}&from=${fromDate}&to=${toDate}` + (locationId ? `&location_id=${locationId}` : ''),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  };

  let res: any = await doRequest(options);
  users = [...users, ...res.users];
  console.log("Got 7shift Report: ", users.length);
  for (let loc of Object.keys(locations)) {
    try {
      const employees: any = {};
      let acc = locations[loc];
      if (locationId && acc.location_id != locationId) {
        continue;
      }
      if (!acc.user) continue;

      let checks: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/checks.json?start_date=${fromDate}&end_date=${toDate}`,
        acc.user,
        acc.password,
        0
      );
      console.log("Getting Checks: ", acc.location, checks.length);
      let employee_data: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/employees.json?limit=500`,
        acc.user,
        acc.password,
        0
      );
      console.log("Getting Employee: ", acc.location, employee_data.length);
      for (let employee of employee_data) {
        employees[employee.id] = { ...employee };
      }
      let trading_days: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/trading_days.json?start=${fromDate}T12:00:00-08:00&end=${toDate}T12:00:00-08:00`,
        acc.user,
        acc.password,
        0
      );
      console.log("Getting Trading_Days: ", acc.location, trading_days.length);
      for (let trading_day of trading_days) {
        const weekday = getMonday(trading_day.date, 1)

        /*
        _pm means afternoon data for only BSC
        */
        let serverPool = {
          pts: 0,
          tips: 0,
          service_charge: 0,
          count: 0,
          pts_pm: 0,
          tips_pm: 0,
          service_charge_pm: 0,
          count_pm: 0
        };
        let bartenderPool = {
          pts: 0,
          tips: 0,
          count: 0,
          service_charge: 0,
          pts_pm: 0,
          tips_pm: 0,
          count_pm: 0,
          service_charge_pm: 0,
        };
        let busserRunnerPool = {
          pts: 0,
          tips: 0,
          count: 0,
          pts_pm: 0,
          tips_pm: 0,
          count_pm: 0
        };
        let receptionHostPool = {
          pts: 0,
          tips: 0,
          count: 0,
          pts_pm: 0,
          tips_pm: 0,
          count_pm: 0
        };
        let barbackPool = {
          pts: 0,
          tips: 0,
          count: 0,
          pts_pm: 0,
          tips_pm: 0,
          count_pm: 0
        };
        let bohPool = {
          pts: 0,
          tips: 0,
          count: 0
        }

        let sushiPool = {
          pts: 0,
          tips: 0,
          count: 0
        }

        let event = {
          pts: 0,
          tips: 0,
          pts_pm: 0,
          tips_pm: 0
        };


        let middayObj: any = {};
        if (acc.type === 'nightclub1') {
          for (let user of users) {
            for (let role of user.roles.filter((rl: any, index: number) =>
              user.roles.findIndex((rrl: any) => getRoleName(rl.role_label, rl.location_label) === getRoleName(rrl.role_label, rrl.location_label)) === index
            )) {
              const shifts = user.weeks.reduce((res: any[], week: any) => res = [...res, ...week.shifts], []);
              let role_name = role.location_label === 'Slab BBQ LA' ?
                (user.user.employee_id === '16439' ? 'Assistant Manager' : user.user.employee_id === '19120' ? 'Manager' : 'Server')
                : role.location_label === 'Slab BBQ Pasadena' ?
                  (['12065', '17414', '19557'].includes(user.user.employee_id) ? role.role_label : 'Server')
                  : role.role_label;
              role_name = getRoleName(role_name, role.location_label);
              let id = `${user.user['employee_id']}_${user.user['first_name'].trim()}_${acc.location}_${role_name}`;
              let airtable_id = `${trading_day.date}_${id}`;
              for (let shift of shifts.filter((sh: any) =>
                sh.location_label === acc.location && getRoleName(sh.role_label, sh.location_label) === getRoleName(role.role_label, role.location_label) && sh.date.split(" ")[0] === trading_day.date)) {
                middayObj[airtable_id] = Number(shift.date.slice(11, 13)) < 14 ? 'am' : 'pm';
              }
            }
          }
        }

        for (let check of checks.filter(ck => ck.trading_day_id === trading_day.id)) {
          const employee = employees[check.employee_id];
          let role_name = (acc.location === 'Slab BBQ LA' || acc.location === 'Slab BBQ Pasadena') ? 'Server' : check.employee_role_name;
          role_name = getRoleName(role_name, acc.location);
          let id = `${employee['employee_identifier']}_${employee['first_name'].trim()}_${acc.location}_${role_name}`;
          if (!employee['employee_identifier'] && acc.location !== 'Slab BBQ LA' && acc.location !== 'Slab BBQ Pasadena') {
            console.log("XXXXXXXXXXXXXXXXXXX Need to replace Employee ID: ", id);
          }

          // exceptional cases
          if (id === '18931_Raine_Bootsy Bellows_Server') {
            id = '28931_Ciara_Bootsy Bellows_Server';
          } else if (id === '18931_Raine_Poppy_Server') {
            id = '28931_Ciara_Poppy_Server';
          } else if (acc.location === 'Slab BBQ LA') {
            id = '18971_Pablo_Slab BBQ LA_Server';
          } else if (acc.location === 'Slab BBQ Pasadena') {
            id = '19642_Jefferson_Slab BBQ Pasadena_Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'Petite Taqueria') {
            id = '17642_Marco_Petite Taqueria_Bartender';
            role_name = 'Bartender';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'Bird Streets Club') {
            id = '11246_Michael_Bird Streets Club_Server';
            role_name = 'Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'Bootsy Bellows') {
            id = '28931_Ciara_Bootsy Bellows_Server';
            role_name = 'Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'The Nice Guy') {
            id = '10196_Jason_The Nice Guy_Server';
            role_name = 'Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'Delilah') {
            id = '11967_Demi_Delilah_Server';
            role_name = 'Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'The Peppermint Club') {
            id = '12495_Denvre_The Peppermint Club_Server';
            role_name = 'Server';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'SHOREbar') {
            id = '14695_Matthew_SHOREbar_Bartender';
            role_name = 'Bartender';
          } else if ((role_name === 'Admin' || role_name === 'Manager' || role_name === 'Events') && acc.location === 'Didi') {
            id = '398096_Michael_Didi_Server';
            role_name = 'Server';
          }

          let airtable_id = `${trading_day.date}_${id}`;
          let midday = acc.type === 'nightclub1' ? (middayObj[airtable_id] || ((Number(check.open_time.slice(11, 13)) < 14 && check.open_time.slice(0, 10) === trading_day.date) ? 'am' : 'pm')) : null;
          let total_tips = 0;

          if (!airtable_data[airtable_id]) {
            airtable_data[airtable_id] = {
              "Employee": [],
              "Location": acc.location,
              'Role Name': role_name,
              "Week Beginning": weekday,
              "Day": trading_day.date,
              "Midday": midday,
              "Reg Hours": 0,
              "OT Hours": 0,
              "DOT Hours": 0,
              "Total Hours": 0,
              "Exceptions Pay": 0,
              "Total Pay": 0,
              "Cash Tips": 0,
              "Card Tips": 0,
              "AutoGrat": 0,
              "Total Tips": 0,
              "Point": 0,
              "Reason": null,
              "Override Point": null,
              "Final Tips": 0,
              "Service Charge": 0,
              "Venue Weekly Data": venue_data[`${weekday}_${acc.location}`] ? [venue_data[`${weekday}_${acc.location}`]] : []
            }
          }

          if (check.id === 'b6affee6-a9a9-4d45-9985-dffa252be6d9' || check.id === 'af10245e-58b2-49fa-b7b7-63359dc51887' || check.id === '678314ef-37d5-4259-8ff5-5126790c17f5') {
            continue;
          }
          airtable_data[airtable_id]['AutoGrat'] += Number(check.mandatory_tip_amount);
          total_tips += Number(check.mandatory_tip_amount);

          if (check.payments) {
            for (let payment of check.payments) {

              if (check.trading_day_id === '0fdef4ea-3d9d-4fe4-8900-fb49f0ba2511' && check.employee_id === '38521f27-cd2a-41bc-af70-74828f9e789c') continue;

              if (payment.id === 'be43ce02-2dc6-406b-aba9-e7477d2636b3') {
                payment.tip_amount = 146.00;
              }
              if (payment.id === 'f7b1122d-b6a2-4c66-8424-af6350a84417') {
                payment.tip_amount = 50.00;
              }
              if (payment.id === '7fc773e0-e3ae-4941-86d1-0a20f542162e') { // Delilah 08/09 +30$
                payment.tip_amount = 30.00;
              }
              if (payment.id === 'c981e893-efec-4c37-81e2-325061d7dbff') {// Delilah 08/13 +50$
                payment.tip_amount = 50.00;
              }
              if (payment.id === '28a81425-41b8-4f46-a039-aa2f803933c8') { // TNG 08/13 +292$
                payment.tip_amount = 292.00;
              }
              if (payment.id === '5148fb9b-a3d2-4596-830c-600f210d2644') { // Didi 8/23 +$40.71 to server tip pool
                payment.tip_amount = 58.94;
              }
              if (payment.id === '3b2b05a9-682a-4f97-9c40-ea5186a74b01') { // Didi 8/26 -$20
                payment.tip_amount = 6.81;
              }
              if (payment.id === 'f088664b-b2a8-4b4a-b1f1-122eaaf1527d') { // BST 08/23 -2500$
                payment.tip_amount -= 2500;
              }
              if (payment.id === '4dc79ab3-add4-4713-9e87-ebb83765f7de') {
                payment.tip_amount = 7.8;
              }
              if (payment.id === 'b1496fd4-ba27-4359-b547-606e154ba4d6') { //TNG 10/21 +60$
                payment.tip_amount = 66.48;
              }
              if (payment.id === '568fcb3a-301d-4520-85d7-3c7d198953b6') { //Poppy 10/28 +1500$
                payment.tip_amount = 1500;
              }
              if (['131daaf4-0288-41be-9ebc-033bb4a8567c', '978959b9-5908-41a4-88ba-f9209c2727b5', '40e26703-5759-43d1-974c-e3ef3d769c51'].indexOf(payment.id) > -1) {
                continue;
              }
              if (payment.type === 'Cash') {
                airtable_data[airtable_id]['Cash Tips'] += Number(payment.tip_amount);
                total_tips += Number(payment.tip_amount);
              }
              if (payment.type === 'Credit' || payment.type === 'Gift Card' || payment.type === 'House Account' || payment.type === 'House Account'
                || payment.type === 'Owners' || payment.type === 'Ticketmaster' || payment.type === 'Deposit' || payment.type === 'Delivery Account') {
                airtable_data[airtable_id]['Card Tips'] += Number(payment.tip_amount);
                total_tips += Number(payment.tip_amount);
              }
            }
            if (check.zone === 'Sushi Bar') {
              let temp_tips = Math.round(total_tips / 2 * 100) / 100;
              sushiPool.tips += temp_tips;
              total_tips -= temp_tips;
              airtable_data[airtable_id]['Total Tips'] += temp_tips;
            }
          }
          if (check.items) {
            let service_charges;
            if (acc.type === 'nightclub1') {
              service_charges = check.items.filter((item: any) => item.name === 'Service Fee').reduce((sum: number, item: any) => sum += Number(item.price), 0);
              airtable_data[airtable_id]['Service Charge'] += service_charges;
              if (check.zone === 'Sushi Bar') {
                let temp_service_charges = Math.round(service_charges * 50) / 100;
                sushiPool.tips += temp_service_charges;
                service_charges -= temp_service_charges;
              }
              switch (role_name) {
                case 'Server': { //Server pool
                  if (acc.type === 'nightclub1' && midday === 'pm') {
                    serverPool.service_charge_pm += service_charges;
                  } else {
                    serverPool.service_charge += service_charges;
                  }
                  break;
                }
                case 'Bartender': { //Bartender pool
                  if (acc.type === 'nightclub1' && midday === 'pm') {
                    bartenderPool.service_charge_pm += service_charges;
                  } else {
                    bartenderPool.service_charge += service_charges;
                  }
                  break;
                }
              }
            }
            service_charges = check.items.filter((item: any) => (item.name === "Service Charge" || item.name === "NYE Service Charge" || item.name === "Automatic Gratuity") && Number(item.price) > 6)
              .reduce((sum: number, item: any) => sum += Number(item.price), 0);
            if (acc.location === 'The Peppermint Club' && (trading_day.date === '2022-12-15' || trading_day.date === '2022-12-17')) {
              service_charges = 0;
            } else if (acc.location === 'Bootsy Bellows' && (trading_day.date === '2023-04-19' || trading_day.date === '2023-04-29')) {
              service_charges = 0;
            } else if (acc.location === 'Delilah') {
              if (trading_day.date === '2023-06-08') {
                service_charges = 0;
              } else if (trading_day.date === '2023-07-27') {
                service_charges = 0;
              }
            } else if (acc.location === 'The Nice Guy' && (trading_day.date === '2023-06-15' || trading_day.date === '2023-06-16')) {
              service_charges = 0;
            } else if (acc.location === 'Bird Streets Club' && trading_day.date === '2023-07-15') {
              service_charges = 0;
            } else if (acc.location === 'Didi' && trading_day.date === '2023-07-25') {
              service_charges = 0;
            } else if (acc.location === 'SHOREbar') {
              if (trading_day.date === '2023-07-27') {
                service_charges = 0;
              } else if (trading_day.date === '2023-09-29') {
                service_charges = 0;
              }
            } else if (acc.location === 'Poppy') {
              if (trading_day.date === '2023-10-28') {
                service_charges = 0;
              }
            }
            airtable_data[airtable_id]['Service Charge'] += service_charges;

            // Exception Event Date For BSC
            if (acc.location === 'Bird Streets Club' && trading_day.date === '2023-05-23') {
              serverPool.service_charge += service_charges;
              service_charges = 0;
            } else if (acc.location === 'Bird Streets Club' && trading_day.date === '2023-09-22' && midday === 'pm') {
              serverPool.service_charge_pm += service_charges;
              service_charges = 0;
            }

            if (midday === 'pm') {
              event.tips_pm += service_charges;
            } else {
              event.tips += service_charges;
            }
          }
          airtable_data[airtable_id]['Total Tips'] += total_tips;
          // Apply distribution Rule
          switch (role_name) {
            case 'Server': { //Server pool
              if (acc.type === 'nightclub1' && midday === 'pm') {
                serverPool.tips_pm += total_tips;
              } else {
                serverPool.tips += total_tips;
              }
              break;
            }
            case 'Bartender':
            case 'Lead Bartender':
            case 'Service Bar': { //Bartender pool
              if (acc.type === 'nightclub1' && midday === 'pm') {
                bartenderPool.tips_pm += total_tips;
              } else {
                bartenderPool.tips += total_tips;
              }
              break;
            }
          }
        }

        // Exceptional Service Charge Or Tips

        if (acc.location === 'Delilah') {
          if (additional_data[trading_day.date]) {
            bartenderPool.tips += additional_data[trading_day.date];
          }
        }
        if (acc.location === 'The Peppermint Club') {
          if (trading_day.date === '2023-01-10') {
            event.tips += 75;
            airtable_data['2023-01-10_14701_Alexandria_The Peppermint Club_Bartender']['Service Charge'] = 75;
          } else if (trading_day.date === '2023-06-03') {
            serverPool.tips += 31.36;
            airtable_data['2023-06-03_12495_Denvre_The Peppermint Club_Server']['Cash Tips'] += 31.36;
            airtable_data['2023-06-03_12495_Denvre_The Peppermint Club_Server']['Total Tips'] += 31.36;
          }
        } else if (acc.location === 'Poppy') {
          if (trading_day.date === '2023-08-16') {
            event.tips += 406;
            airtable_data['2023-08-16_11480_Saxon_Poppy_Bartender']['Service Charge'] = 406;
          }
        }

        if (event.tips > 0 || (trading_day.date === '2023-01-14' && acc.location === 'Poppy') ||
          (trading_day.date === '2023-09-19' && acc.location === 'Poppy') ||
          (trading_day.date === '2023-02-23' && acc.location === 'The Peppermint Club') ||
          (trading_day.date === '2023-02-25' && acc.location === 'The Peppermint Club') ||
          (trading_day.date === '2023-07-05' && acc.location === 'Bootsy Bellows') ||
          (trading_day.date === '2023-08-01' && acc.location === 'Delilah') ||
          (trading_day.date === '2023-08-14' && acc.location === 'The Peppermint Club') ||
          (trading_day.date === '2023-08-18' && acc.location === 'Delilah')) {
          console.log(`Event Tips: ${event.tips}`);
          event.tips += serverPool.tips + serverPool.service_charge + bartenderPool.tips + bartenderPool.service_charge;
        }
        if (event.tips_pm > 0) {
          console.log(`Event Tips PM: ${event.tips_pm}`);
          event.tips_pm += serverPool.tips_pm + serverPool.service_charge_pm + bartenderPool.tips_pm + bartenderPool.service_charge_pm;
        }

        for (let user of users) {
          for (let role of user.roles.filter((rl: any, index: number) =>
            user.roles.findIndex((rrl: any) => getRoleName(rl.role_label, rl.location_label) === getRoleName(rrl.role_label, rrl.location_label)) === index
          )) {

            let total_hours = 0, regular_hours = 0, ot_hours = 0, dot_hours = 0, compliance_exceptions_pay = 0, total_pay = 0;
            let total_hours_point = 0;
            const shifts = user.weeks.reduce((res: any[], week: any) => res = [...res, ...week.shifts], []);
            let midday;
            for (let shift of shifts.filter((sh: any) =>
              sh.location_label === acc.location && getRoleName(sh.role_label, sh.location_label) === getRoleName(role.role_label, role.location_label) && sh.date.split(" ")[0] === trading_day.date)) {
              total_hours += Math.round(shift.total.total_hours * 100) / 100;
              regular_hours += Math.round(shift.total.regular_hours * 100) / 100;
              ot_hours += Math.round(shift.total.non_premium_overtime_hours * 100) / 100;
              dot_hours += Math.round(shift.total.premium_overtime_hours * 100) / 100;
              compliance_exceptions_pay += Math.round(shift.total.compliance_exceptions_pay * 100) / 100;
              total_pay += Math.round(shift.total.total_pay * 100) / 100;
              if (!shift.role_label.includes('Event')) {
                total_hours_point += Math.round(shift.total.total_hours * 100) / 100;
              }
              midday = acc.type === 'nightclub1' ? Number(shift.date.slice(11, 13)) < 14 ? 'am' : 'pm' : null
            }
            let role_name = role.location_label === 'Slab BBQ LA' ?
              (user.user.employee_id === '16439' ? 'Assistant Manager' : user.user.employee_id === '19120' ? 'Manager' : 'Server')
              : role.location_label === 'Slab BBQ Pasadena' ?
                (['12065', '17414', '19557'].includes(user.user.employee_id) ? role.role_label : 'Server')
                : role.role_label;

            role_name = getRoleName(role_name, role.location_label);

            if (trading_day.date === '2023-01-04' && acc.location === 'Poppy' && user.user['employee_id'] == '18463') {
              role_name = 'TSA'
            }
            if (trading_day.date === '2023-04-22' && acc.location === 'SHOREbar' && user.user['employee_id'] == '31782') {
              role_name = 'Barback'
            }
            if (trading_day.date >= '2023-01-25' && trading_day.date <= '2023-01-29' && trading_day.date !== '2023-01-28' && user.user['employee_id'] == '15224' && acc.location === 'The Peppermint Club') {
              role_name = 'Barback';
            }

            let id = `${user.user['employee_id']}_${user.user['first_name'].trim()}_${acc.location}_${role_name}`;
            let airtable_id = `${trading_day.date}_${id}`;

            if (airtable_id === '2023-01-25_200018_Andy_SHOREbar_Barback') {
              continue;
            } else if (airtable_id === '2023-01-20_11263_Daniel_Poppy_TSA') {
              continue;
            }

            if (!airtable_data[airtable_id]) {
              airtable_data[airtable_id] = {
                "Employee": [],
                "Location": acc.location,
                'Role Name': role_name,
                "Week Beginning": weekday,
                "Day": trading_day.date,
                "Midday": midday,
                "Reg Hours": 0,
                "OT Hours": 0,
                "DOT Hours": 0,
                "Total Hours": 0,
                "Exceptions Pay": 0,
                "Total Pay": 0,
                "Cash Tips": 0,
                "Card Tips": 0,
                "AutoGrat": 0,
                "Total Tips": 0,
                "Point": 0,
                "Reason": null,
                "Override Point": null,
                "Final Tips": 0,
                "Service Charge": 0,
                "Venue Weekly Data": venue_data[`${weekday}_${acc.location}`] ? [venue_data[`${weekday}_${acc.location}`]] : []
              }
            } else {
              airtable_data[airtable_id]['Midday'] = midday;
            }

            airtable_data[airtable_id]["Reg Hours"] += Math.round(regular_hours * 100) / 100;
            airtable_data[airtable_id]["OT Hours"] += Math.round(ot_hours * 100) / 100;
            airtable_data[airtable_id]["DOT Hours"] += Math.round(dot_hours * 100) / 100;
            airtable_data[airtable_id]["Total Hours"] += Math.round(total_hours * 100) / 100;
            airtable_data[airtable_id]["Exceptions Pay"] += Math.round(compliance_exceptions_pay * 100) / 100;
            airtable_data[airtable_id]["Total Pay"] += Math.round(total_pay * 100) / 100;

            if (airtable_id === '2023-04-19_11480_Saxon_Bootsy Bellows_Bartender' ||
              airtable_id === '2023-04-19_18463_Jair_Bootsy Bellows_Barback' ||
              airtable_id === '2023-04-29_12637_Kelly_Bootsy Bellows_Bartender' ||
              airtable_id === '2023-04-29_21073_Adam_Bootsy Bellows_TSA' ||
              airtable_id === '2023-04-29_16011_Feliciano_Bootsy Bellows_TSA' ||
              airtable_id === '2023-04-29_17745_Jorge_Bootsy Bellows_TSA' ||
              airtable_id === '2023-04-29_18463_Jair_Bootsy Bellows_TSA' ||
              id === 'n/a6_Ada_Bootsy Bellows_Barback') {
              continue;
            }

            let daily_pts = Math.round(total_hours_point / acc.full_shift * 100) / 100;
            if (midday === 'am') {
              daily_pts = Math.round(total_hours_point / 4 * 100) / 100;
            }

            let pts = 0;
            let over_point;
            if (overpoint_data[airtable_id]) {
              over_point = overpoint_data[airtable_id]['over_point'];
              console.log(airtable_id, over_point);
            }
            daily_pts = daily_pts >= 0.66 ? 1 : daily_pts >= 0.33 ? 0.5 : daily_pts > 0.1 ? 0.25 : 0;


            switch (role_name) {
              case 'Server':
              case 'Sommelier': { //Server pool
                if (event.tips > 0 && midday !== 'pm') {
                  pts = total_hours > 0 ? 1 : 0;
                  if (over_point === 0) break;
                  event.pts += over_point || (total_hours > 0 ? 1 : 0);
                } else if (event.tips_pm > 0 && midday === 'pm') {
                  pts = total_hours > 0 ? 1 : 0;
                  if (over_point === 0) break;
                  event.pts_pm += over_point || (total_hours > 0 ? 1 : 0);
                } else if (acc.type === 'nightclub1' && midday === 'pm') {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  serverPool.pts_pm += over_point || daily_pts;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  serverPool.pts += over_point || daily_pts;
                } else {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  serverPool.count += total_hours_point > 0 ? 1 : 0;
                  serverPool.pts += over_point || daily_pts;
                }
                break;
              }
              case 'Bartender':
              case 'Lead Bartender':
              case 'Service Bar': { //Bartender pool
                if (event.tips > 0 && midday !== 'pm') {
                  pts = total_hours > 0 ? 1 : 0;
                  if (over_point === 0) break;
                  event.pts += over_point || (total_hours > 0 ? 1 : 0);
                } else if (event.tips_pm > 0 && midday === 'pm') {
                  pts = total_hours > 0 ? 1 : 0;
                  if (over_point === 0) break;
                  event.pts_pm += over_point || (total_hours > 0 ? 1 : 0);
                } else if (acc.type === 'nightclub1' && midday === 'pm') {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  bartenderPool.pts_pm += over_point || daily_pts;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  bartenderPool.pts += over_point || daily_pts;
                } else {
                  pts = daily_pts;
                  if (over_point === 0) break;
                  bartenderPool.count += total_hours_point > 0 ? 1 : 0;
                  bartenderPool.pts += over_point || daily_pts;
                }
                break;
              }
              case 'Support':
              case 'Table Server Assistant':
              case 'TSA': {
                if (event.tips > 0 && midday !== 'pm') {
                  if (acc.location === 'Poppy' && trading_day.date === '2023-02-19') {
                    pts = total_hours > 0 ? 1 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 1 : 0);
                  } else {
                    pts = total_hours > 0 ? 0.5 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  }
                } else if (event.tips_pm > 0 && midday === 'pm') {
                  pts = total_hours > 0 ? 0.5 : 0;
                  if (over_point === 0) break;
                  event.pts_pm += over_point || (total_hours > 0 ? 0.5 : 0);
                } else if (acc.type == 'restaurant') {
                  pts = (0.4 * daily_pts);
                  if (over_point === 0) break;
                  busserRunnerPool.pts += over_point || (0.4 * daily_pts);
                } else if (acc.type == 'restaurant1') {
                  pts = (0.4 * daily_pts);
                  if (over_point === 0) break;
                  serverPool.pts += over_point || (0.4 * daily_pts);
                } else if (acc.type == 'nightclub') {
                  pts = 0.4 * daily_pts;
                  if (over_point === 0) break;
                  busserRunnerPool.count += total_hours_point > 0 ? 0.4 : 0;
                  busserRunnerPool.pts += over_point || (0.4 * daily_pts);
                  if (airtable_id === '2023-08-11_200025_James_SHOREbar_Support'
                    || airtable_id === '2023-08-12_200025_James_SHOREbar_Support'
                    || airtable_id === '2023-08-19_200025_James_SHOREbar_Support') {
                    barbackPool.count += 0.5;
                  }
                } else if (acc.type === 'nightclub1') {
                  pts = 0.4 * daily_pts;
                  if (over_point === 0) break;
                  if (midday === 'pm') {
                    serverPool.pts_pm += over_point || (0.4 * daily_pts);
                  } else {
                    serverPool.pts += over_point || (0.4 * daily_pts);
                  }
                }
                break;
              }
              case 'Runner': {
                if (acc.type == 'restaurant2') {
                  if (event.tips > 0) {
                    pts = total_hours > 0 ? 1 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 1 : 0);
                  } else {
                    pts = (0.55 * daily_pts);
                    if (over_point === 0) break;
                    serverPool.pts += over_point || (0.55 * daily_pts);
                  }
                }
                break;
              }
              case 'Busser': {
                if (acc.type == 'restaurant2') {
                  if (event.tips > 0) {
                    pts = total_hours > 0 ? 0.5 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  } else {
                    pts = (0.45 * daily_pts);
                    if (over_point === 0) break;
                    serverPool.pts += over_point || (0.45 * daily_pts);
                  }
                }
                break;
              }
              case 'Host':
              case 'Lead Host':
              case 'Event Host':
              case 'Anchor Host': {
                if (event.tips > 0 && midday !== 'pm') {
                  if (acc.type == 'restaurant2') {
                    pts = total_hours > 0 ? 0.15 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 0.15 : 0);
                  } else {
                    pts = total_hours > 0 ? 0.25 : 0;
                    if (over_point === 0) break;
                    event.pts += over_point || (total_hours > 0 ? 0.25 : 0);
                  }
                } else if (event.tips_pm > 0 && midday === 'pm') {
                  pts = total_hours > 0 ? 0.25 : 0;
                  if (over_point === 0) break;
                  event.pts_pm += over_point || (total_hours > 0 ? 0.25 : 0);
                } else if (acc.type == 'restaurant') {
                  pts = 0.1 * daily_pts;
                  if (over_point === 0) break;
                  receptionHostPool.pts += over_point || (0.1 * daily_pts);
                } else if (acc.type == 'restaurant1' || acc.type == 'restaurant2') {
                  pts = 0.1 * daily_pts;
                  if (over_point === 0) break;
                  serverPool.pts += over_point || (0.1 * daily_pts);
                } else if (acc.type === 'nightclub1') {
                  pts = 0.1 * daily_pts;
                  if (over_point === 0) break;
                  if (midday === 'pm') {
                    serverPool.pts_pm += over_point || (0.1 * daily_pts);
                  } else {
                    serverPool.pts += over_point || (0.1 * daily_pts);
                  }
                }
                break;
              }
              case 'Barback': {
                if (event.tips > 0 && midday !== 'pm') {
                  pts = total_hours > 0 ? 0.5 : 0;
                  if (over_point === 0) break;
                  event.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                } else if (event.tips_pm > 0 && midday === 'pm') {
                  pts = total_hours > 0 ? 0.5 : 0;
                  if (over_point === 0) break;
                  event.pts_pm += over_point || (total_hours > 0 ? 0.5 : 0);
                } else if (acc.type === 'nightclub1') {
                  pts = 0.5 * daily_pts;
                  if (over_point === 0) break;
                  if (midday === 'pm') {
                    bartenderPool.pts_pm += over_point || (0.5 * daily_pts);
                  } else {
                    bartenderPool.pts += over_point || (0.5 * daily_pts);
                  }
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  pts = 0.5 * daily_pts;
                  if (over_point === 0) break;
                  bartenderPool.pts += over_point || (0.5 * daily_pts);
                } else {
                  pts = daily_pts / 2;
                  if (over_point === 0) break;
                  barbackPool.count += total_hours_point > 0 ? 0.5 : 0;
                  barbackPool.pts += over_point || (daily_pts / 2);
                }
                break;
              }
              case 'Line Cook':
              case 'Prep Cook':
              case 'Dishwasher':
              case 'Pastry Prep Cook':
              case 'Porter': {
                if (acc.type === 'nightclub1') {
                  pts = total_hours > 0 ? 0.5 : 0;
                  if (over_point === 0) break;
                  if (event.tips > 0 && midday !== 'pm') {
                    event.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  } else if (event.tips_pm > 0 && midday === 'pm') {
                    event.pts_pm += over_point || (total_hours > 0 ? 0.5 : 0);
                  } else {
                    bohPool.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  }
                }
                if (acc.location === 'The Nice Guy' && event.tips > 0) {
                  pts = total_hours > 0 ? 0.5 : 0;
                  bohPool.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                }
                break;
              }
              case 'Sushi Cook': {
                if (acc.type === 'nightclub1') {
                  pts = total_hours > 0 ? 0.5 : 0;
                  if (over_point === 0) break;
                  if (event.tips > 0 && midday !== 'pm') {
                    event.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  } else if (event.tips_pm > 0 && midday === 'pm') {
                    event.pts_pm += over_point || (total_hours > 0 ? 0.5 : 0);
                  } else {
                    sushiPool.pts += over_point || (total_hours > 0 ? 0.5 : 0);
                  }
                }
                break;
              }
            }

            if (overpoint_data[airtable_id] && overpoint_data[airtable_id]['over_point'] !== pts) {
              airtable_data[airtable_id]['Point'] = overpoint_data[airtable_id]['over_point'];
              airtable_data[airtable_id]['Override Point'] = overpoint_data[airtable_id]['over_point'];
              airtable_data[airtable_id]['Reason'] = overpoint_data[airtable_id]['reason'];

            } else {
              airtable_data[airtable_id]['Point'] += pts;
            }

          }
        }

        // Exceptional Tip Dist
        if (acc.location === 'Bird Streets Club') {
          if (trading_day.date === '2023-01-23') {
            serverPool.tips += 50;
            airtable_data['2023-01-23_17492_Kristopher_Bird Streets Club_Server']['Total Tips'] += 50;
          } else if (trading_day.date === '2023-07-15') {
            bartenderPool.tips_pm += 750;
            airtable_data['2023-07-15_14428_Jean Paul_Bird Streets Club_Bartender']['Card Tips'] += 750;
            airtable_data['2023-07-15_14428_Jean Paul_Bird Streets Club_Bartender']['Total Tips'] += 750;
          }
        }
        if (acc.location === 'Delilah') {
          if (trading_day.date === '2023-02-25') {
            serverPool.tips -= 1000;
            bartenderPool.tips += 1000;
          } else if (trading_day.date === '2023-06-03') {
            serverPool.tips += 10;
            airtable_data['2023-06-03_15806_Landon_Delilah_Server']['Cash Tips'] += 10;
            airtable_data['2023-06-03_15806_Landon_Delilah_Server']['Total Tips'] += 10;
          } else if (trading_day.date === '2023-06-04') {
            serverPool.tips += 10;
            airtable_data['2023-06-04_11967_Demi_Delilah_Server']['Cash Tips'] += 10;
            airtable_data['2023-06-04_11967_Demi_Delilah_Server']['Total Tips'] += 10;
          } else if (trading_day.date === '2023-07-24') {
            event.tips -= 163;
          } else if (trading_day.date === '2023-08-03') {
            bartenderPool.tips += 23;
            airtable_data['2023-08-03_13607_Anthony_Delilah_Bartender']['Cash Tips'] += 23;
            airtable_data['2023-08-03_13607_Anthony_Delilah_Bartender']['Total Tips'] += 23;
          }
        }
        if (acc.location === 'Slab BBQ LA') {
          if (trading_day.date === '2023-07-03') {
            serverPool.tips = 266.86;
            airtable_data['2023-07-03_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 266.86;
            airtable_data['2023-07-03_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 266.86;
          } else if (trading_day.date === '2023-07-04') {
            serverPool.tips = 1296.32;
            airtable_data['2023-07-04_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 1296.32;
            airtable_data['2023-07-04_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 1296.32;
          } else if (trading_day.date === '2023-07-05') {
            serverPool.tips = 144.96;
            airtable_data['2023-07-05_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 144.96;
            airtable_data['2023-07-05_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 144.96;
          } else if (trading_day.date === '2023-07-07') {
            serverPool.tips = 238.9;
            airtable_data['2023-07-07_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 238.9;
            airtable_data['2023-07-07_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 238.9;
          } else if (trading_day.date === '2023-07-08') {
            serverPool.tips = 362.55;
            airtable_data['2023-07-08_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 362.55;
            airtable_data['2023-07-08_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 362.55;
          } else if (trading_day.date === '2023-07-09') {
            serverPool.tips = 159.33;
            airtable_data['2023-07-09_18971_Pablo_Slab BBQ LA_Server']['Card Tips'] = 159.33;
            airtable_data['2023-07-09_18971_Pablo_Slab BBQ LA_Server']['Total Tips'] = 159.33;
          }
        }
        if (acc.location === 'Didi') {
          if (trading_day.date === '2023-07-24') {
            serverPool.tips += 76;
            airtable_data['2023-07-24_398091_Alanna_Didi_Server']['Cash Tips'] += 76;
            airtable_data['2023-07-24_398091_Alanna_Didi_Server']['Total Tips'] += 76;
          } else if (trading_day.date === '2023-07-25') {
            serverPool.tips += 319.60;
            airtable_data['2023-07-25_398091_Alanna_Didi_Server']['AutoGrat'] += 319.60;
            airtable_data['2023-07-25_398091_Alanna_Didi_Server']['Total Tips'] += 319.60;
          }
        }
        if (acc.location === 'Bootsy Bellows') {
          if (trading_day.date === '2023-03-29') {
            bartenderPool.tips += 300;
            airtable_data['2023-03-29_11480_Saxon_Bootsy Bellows_Bartender']['Total Tips'] += 300;
          }
        }
        if (acc.location === 'SHOREbar') {
          if (trading_day.date === '2023-05-11') {
            bartenderPool.tips -= 29.67;
          } else if (trading_day.date === '2023-07-13') {
            serverPool.tips += 114.69;
            airtable_data['2023-07-13_17174_Ansleigh_SHOREbar_Server']['AutoGrat'] += 114.69;
            airtable_data['2023-07-13_17174_Ansleigh_SHOREbar_Server']['Total Tips'] += 114.69;
          } else if (trading_day.date === '2023-08-24') {
            bartenderPool.tips -= 266.13;
          }
        }
        if (acc.location === 'The Peppermint Club') {
          if (trading_day.date === '2023-05-25') {
            serverPool.tips += 100;
            airtable_data['2023-05-25_11789_Metasebya_The Peppermint Club_Server']['Cash Tips'] += 100;
            airtable_data['2023-05-25_11789_Metasebya_The Peppermint Club_Server']['Total Tips'] += 100;
          }
        }

        let temp_tips = 0, temp_tips_pm = 0;
        if (acc.type == 'restaurant') {
          temp_tips = bartenderPool.pts > 0 ? Math.round(0.15 * serverPool.tips * 100) / 100 : 0;
          busserRunnerPool.tips = busserRunnerPool.pts > 0 ? Math.round(0.285 * serverPool.tips * 100) / 100 : 0;
          receptionHostPool.tips = receptionHostPool.pts > 0 ? Math.round(0.015 * serverPool.tips * 100) / 100 : 0;
        } else if (acc.type === 'restaurant1') {
          temp_tips = bartenderPool.pts > 0 ? Math.round(0.15 * serverPool.tips * 100) / 100 : 0;
        } else if (acc.type === 'restaurant2') {
          temp_tips = bartenderPool.pts > 0 ? Math.round(0.05 * serverPool.tips * 100) / 100 : 0;
        } else if (acc.type === 'nightclub') {
          temp_tips = (bartenderPool.pts + barbackPool.pts) > 0 ? Math.round(0.075 * serverPool.tips * 100) / 100 : 0;
        } else if (acc.type === 'nightclub1') {
          if (transfer_data[trading_day.date + '_am']) {
            let tmp_tips = Math.round(transfer_data[trading_day.date + '_am'] * 17) / 100;
            console.log('Transfer Amount: ' + trading_day.date + '_am', tmp_tips);
            serverPool.service_charge -= tmp_tips;
            bartenderPool.service_charge += tmp_tips;
          }
          if (transfer_data[trading_day.date + '_pm']) {
            let tmp_tips = Math.round(transfer_data[trading_day.date + '_pm'] * 17) / 100;
            console.log('Transfer Amount: ' + trading_day.date + '_pm', tmp_tips);
            serverPool.service_charge_pm -= tmp_tips;
            bartenderPool.service_charge_pm += tmp_tips;
          }

          bohPool.tips = Math.round(0.15 * ((event.tips > 0 ? 0 : serverPool.service_charge + bartenderPool.service_charge) + (event.tips_pm > 0 ? 0 : serverPool.service_charge_pm + bartenderPool.service_charge_pm)) * 100) / 100;
          serverPool.tips += serverPool.service_charge * 0.85;
          serverPool.tips_pm += serverPool.service_charge_pm * 0.85;
          bartenderPool.tips += bartenderPool.service_charge * 0.85;
          bartenderPool.tips_pm += bartenderPool.service_charge_pm * 0.85;
          temp_tips = bartenderPool.pts > 0 ? Math.round(0.15 * serverPool.tips * 100) / 100 : 0;
          temp_tips_pm = bartenderPool.pts_pm > 0 ? Math.round(0.15 * serverPool.tips_pm * 100) / 100 : 0;

          // For the day with no sushi cook, their tips goes to Boh pool
          if (!sushiPool.pts) {
            bohPool.tips += sushiPool.tips;
          }
        }
        bartenderPool.tips += temp_tips;
        serverPool.tips -= temp_tips + busserRunnerPool.tips + receptionHostPool.tips;
        bartenderPool.tips_pm += temp_tips_pm;
        serverPool.tips_pm -= temp_tips_pm;

        console.log('Date: ', trading_day.date);
        console.log('ServerPool: ', serverPool);
        console.log('bartenderPool: ', bartenderPool);
        console.log('busserRunnerPool: ', busserRunnerPool);
        console.log('barbackPool: ', barbackPool);
        console.log('BOHPool: ', bohPool);
        console.log('sushiPool: ', sushiPool);
        console.log('Event Tip: ', event);
        for (let id of Object.keys(airtable_data)) {
          let role_name = airtable_data[id]['Role Name'];
          let location = airtable_data[id]['Location'];
          let midday = airtable_data[id]['Midday'];
          if (airtable_data[id]['Day'] !== trading_day.date || location !== acc.location) continue;
          if (!airtable_data[id]['Point']) continue;
          let point = airtable_data[id]['Point'];
          let final_tips = 0;
          if (event.tips > 0 && midday !== 'pm') {
            if (acc.location === 'The Nice Guy') {
              // Exceptional Case For The Nice Guy
              switch (role_name) {
                case 'Line Cook':
                case 'Prep Cook':
                case 'Dishwasher':
                case 'Pastry Prep Cook':
                case 'Porter': {
                  final_tips = Math.round(event.tips * 0.01 * point / bohPool.pts * 100) / 100;
                  break;
                }
                default: {
                  final_tips = Math.round(event.tips * 0.99 * point / event.pts * 100) / 100;
                }
              }
            } else {
              final_tips = Math.round(event.tips * point / event.pts * 100) / 100;
            }

          } else if (event.tips_pm > 0 && midday === 'pm') {
            final_tips = Math.round(event.tips_pm * point / event.pts_pm * 100) / 100;
          } else {
            switch (role_name) {
              case 'Server': { //Server pool
                if (acc.type === 'nightclub1') {
                  if (midday === 'pm') {
                    final_tips = Math.round(serverPool.tips_pm * point / serverPool.pts_pm * 100) / 100;
                  } else {
                    final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                  }
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                } else {
                  final_tips = Math.round(serverPool.tips * (serverPool.count / (serverPool.count + busserRunnerPool.count)) * point / serverPool.pts * 100) / 100;
                }
                break;
              }
              case 'Barback': {
                if (acc.type === 'restaurant') {
                  final_tips = Math.round(bartenderPool.tips * point / (bartenderPool.pts + barbackPool.pts) * 100) / 100;
                } else if (acc.type === 'nightclub') {
                  final_tips = Math.round(bartenderPool.tips * (barbackPool.count / (bartenderPool.count + barbackPool.count)) * point / barbackPool.pts * 100) / 100;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  final_tips = Math.round(bartenderPool.tips * point / bartenderPool.pts * 100) / 100;
                } else if (acc.type === 'nightclub1') {
                  if (midday === 'pm') {
                    final_tips = Math.round(bartenderPool.tips_pm * point / bartenderPool.pts_pm * 100) / 100;
                  } else {
                    final_tips = Math.round(bartenderPool.tips * point / bartenderPool.pts * 100) / 100;
                  }
                }
                break;
              }
              case 'Bartender':
              case 'Lead Bartender':
              case 'Service Bar': { //Bartender pool
                if (acc.type === 'restaurant') {
                  final_tips = Math.round(bartenderPool.tips * point / (bartenderPool.pts + barbackPool.pts) * 100) / 100;
                } else if (acc.type === 'nightclub') {
                  final_tips = Math.round(bartenderPool.tips * (bartenderPool.count / (bartenderPool.count + barbackPool.count)) * point / bartenderPool.pts * 100) / 100;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  final_tips = Math.round(bartenderPool.tips * point / bartenderPool.pts * 100) / 100;
                } else if (acc.type === 'nightclub1') {
                  if (midday === 'pm') {
                    final_tips = Math.round(bartenderPool.tips_pm * point / bartenderPool.pts_pm * 100) / 100;
                  } else {
                    final_tips = Math.round(bartenderPool.tips * point / bartenderPool.pts * 100) / 100;
                  }
                }
                break;
              }
              case 'Runner':
              case 'Busser':
              case 'Support':
              case 'Table Server Assistant':
              case 'TSA': {
                if (acc.type === 'restaurant') {
                  final_tips = Math.round(busserRunnerPool.tips * point / busserRunnerPool.pts * 100) / 100;
                } else if (acc.type === 'nightclub') {
                  final_tips = Math.round(serverPool.tips * (busserRunnerPool.count / (serverPool.count + busserRunnerPool.count)) * point / busserRunnerPool.pts * 100) / 100;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                } else if (acc.type === 'nightclub1') {
                  if (midday === 'pm') {
                    final_tips = Math.round(serverPool.tips_pm * point / serverPool.pts_pm * 100) / 100;
                  } else {
                    final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                  }
                }
                break;
              }
              case 'Host':
              case 'Lead Host':
              case 'Anchor Host': {
                if (acc.type === 'restaurant') {
                  final_tips = Math.round(receptionHostPool.tips * point / receptionHostPool.pts * 100) / 100;
                } else if (acc.type === 'restaurant1' || acc.type === 'restaurant2') {
                  final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                } else if (acc.type === 'nightclub1') {
                  if (midday === 'pm') {
                    final_tips = Math.round(serverPool.tips_pm * point / serverPool.pts_pm * 100) / 100;
                  } else {
                    final_tips = Math.round(serverPool.tips * point / serverPool.pts * 100) / 100;
                  }
                }
                break;
              }
              case 'Line Cook':
              case 'Prep Cook':
              case 'Dishwasher':
              case 'Pastry Prep Cook':
              case 'Porter': {
                if (acc.type === 'nightclub1') {
                  final_tips = Math.round(bohPool.tips * point / (bohPool.pts + sushiPool.pts) * 100) / 100;
                }
                break;
              }
              case 'Sushi Cook': {
                if (acc.type === 'nightclub1') {
                  final_tips = Math.round(sushiPool.tips * point / sushiPool.pts * 100) / 100 + Math.round(bohPool.tips * point / (bohPool.pts + sushiPool.pts) * 100) / 100;
                }
                break;
              }
            }
          }
          airtable_data[id]['Final Tips'] = final_tips;
        }

        if (acc.location === 'Bootsy Bellows') {
          if (trading_day.date === '2023-04-19') {
            // Exceptional Event Tip Distribution
            airtable_data['2023-04-19_11480_Saxon_Bootsy Bellows_Bartender']['Point'] = 1;
            airtable_data['2023-04-19_11480_Saxon_Bootsy Bellows_Bartender']['Final Tips'] += 500;
            airtable_data['2023-04-19_18463_Jair_Bootsy Bellows_Barback']['Point'] = 0.5;
            airtable_data['2023-04-19_18463_Jair_Bootsy Bellows_Barback']['Final Tips'] += 250;
            airtable_data['2023-04-19_17642_Marco_Bootsy Bellows_Bartender']['Final Tips'] += 500;
            airtable_data['2023-04-19_13233_Christine_Bootsy Bellows_Server']['Final Tips'] += 500;
            airtable_data['2023-04-19_28931_Ciara_Bootsy Bellows_Server']['Service Charge'] = 1750;
          } else if (trading_day.date === '2023-04-29') {
            // Exceptional Event Tip Distribution
            airtable_data['2023-04-29_12857_Freddie_Bootsy Bellows_Bartender']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_16992_Hannah_Bootsy Bellows_Bartender']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_12637_Kelly_Bootsy Bellows_Bartender']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_12637_Kelly_Bootsy Bellows_Bartender']['Point'] = 1;
            airtable_data['2023-04-29_21073_Adam_Bootsy Bellows_TSA']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_21073_Adam_Bootsy Bellows_TSA']['Point'] = 1;
            airtable_data['2023-04-29_16011_Feliciano_Bootsy Bellows_TSA']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_16011_Feliciano_Bootsy Bellows_TSA']['Point'] = 1;
            airtable_data['2023-04-29_18463_Jair_Bootsy Bellows_TSA']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_18463_Jair_Bootsy Bellows_TSA']['Point'] = 1;
            airtable_data['2023-04-29_17745_Jorge_Bootsy Bellows_TSA']['Final Tips'] += 399.6;
            airtable_data['2023-04-29_17745_Jorge_Bootsy Bellows_TSA']['Point'] = 1;
            airtable_data['2023-04-29_10052_Fabian_Bootsy Bellows_Delivery']['Final Tips'] += 199.8;
            airtable_data['2023-04-29_10052_Fabian_Bootsy Bellows_Delivery']['Point'] = 0.5;
            airtable_data['2023-04-29_16992_Hannah_Bootsy Bellows_Bartender']['Service Charge'] = 2997;
          }
        } else if (acc.location === 'Delilah') {
          if (trading_day.date === '2023-06-08') {
            airtable_data['2023-06-08_11967_Demi_Delilah_Server']['Service Charge'] = 375;
            airtable_data['2023-06-08_13067_Carlos_Delilah_Bartender']['Cash Tips'] = 986;
            airtable_data['2023-06-08_13067_Carlos_Delilah_Bartender']['Total Tips'] += 986;
            airtable_data['2023-06-08_17415_Sergio_Delilah_Dishwasher']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_17283_Sergio_Delilah_Dishwasher']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_17741_Sonia_Delilah_Dishwasher']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_397999_Eduardo_Delilah_Line Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_398002_Luis_Delilah_Line Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_398027_Reynaldo_Delilah_Line Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_28045_Felix_Delilah_Line Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_17143_Gelma_Delilah_Line Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_14520_Cecilio_Delilah_Prep Cook']['Final Tips'] += 14.86;
            airtable_data['2023-06-08_14520_Cecilio_Delilah_Prep Cook']['Service Charge'] += 133.75;
            airtable_data['2023-06-08_16811_Erin_Delilah_Bartender']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_14018_Patrick_Delilah_Bartender']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_13067_Carlos_Delilah_Bartender']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_17721_Jaclyn_Delilah_Bartender']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_11967_Demi_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_18594_Mathew_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_11069_Alexander_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_13793_Kelsey_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_11553_Danielle_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_11002_Eduardo A_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_15977_Sarah_Delilah_Server']['Final Tips'] += 80.06;
            airtable_data['2023-06-08_17016_Bryan_Delilah_Barback']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_18435_Jesus_Delilah_Barback']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_13509_Ricardo_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_397985_Oscar_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_12708_Armando_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_12761_Giovanni_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_11674_Luis_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_14682_Severino_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_17627_Jose Rodrigo_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_12954_Michael_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_15138_Edelmiro_Delilah_Support']['Final Tips'] += 40.03;
            airtable_data['2023-06-08_10770_Karolina_Delilah_Host']['Final Tips'] += 20.01;
            airtable_data['2023-06-08_11437_Kat_Delilah_Host']['Final Tips'] += 20.01;
          } else if (trading_day.date === '2023-07-24') {
            airtable_data['2023-07-24_17741_Sonia_Delilah_Dishwasher']['Final Tips'] += 40.75;
            airtable_data['2023-07-24_10214_Elver_Delilah_Dishwasher']['Final Tips'] += 40.75;
            airtable_data['2023-07-24_398075_Anthony_Delilah_Line Cook']['Final Tips'] += 40.75;
            airtable_data['2023-07-24_17143_Gelma_Delilah_Prep Cook']['Final Tips'] += 40.75;
          } else if (trading_day.date === '2023-10-26') {
            airtable_data['2023-10-26_17415_Sergio_Delilah_Dishwasher']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_17283_Sergio_Delilah_Dishwasher']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_17741_Sonia_Delilah_Dishwasher']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_398076_Christopher_Delilah_Line Cook']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_398075_Anthony_Delilah_Line Cook']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_398171_Paul_Delilah_Line Cook']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_397990_Faustino_Delilah_Prep Cook']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_14520_Cecilio_Delilah_Prep Cook']['Final Tips'] += 51.25;
            airtable_data['2023-10-26_18419_Walter_Delilah_Prep Cook']['Final Tips'] += 51.25;
          }
        } else if (acc.location === 'SHOREbar') {
          if (trading_day.date === '2023-05-11') {
            airtable_data['2023-05-11_200025_James_SHOREbar_Support']['Final Tips'] += 29.67;
          } else if (trading_day.date === '2023-05-25') {
            airtable_data['2023-05-25_200023_Alexis_SHOREbar_Server']['Final Tips'] += 29.97;
          } else if (trading_day.date === '2023-07-27') {
            airtable_data['2023-07-27_14211_Nate_SHOREbar_Bartender']['Service Charge'] += 570;
            airtable_data['2023-07-27_200019_Jordan_SHOREbar_Bartender']['Final Tips'] += 228;
            airtable_data['2023-07-27_14211_Nate_SHOREbar_Bartender']['Final Tips'] += 228;
            airtable_data['2023-07-27_200018_Andy_SHOREbar_Barback']['Final Tips'] += 114;
          } else if (trading_day.date === '2023-08-11') {
            airtable_data['2023-08-11_200025_James_SHOREbar_Support']['Final Tips'] += 132.35;
          } else if (trading_day.date === '2023-08-12') {
            airtable_data['2023-08-12_200025_James_SHOREbar_Support']['Final Tips'] += 135.8;
          } else if (trading_day.date === '2023-08-19') {
            airtable_data['2023-08-19_200025_James_SHOREbar_Support']['Final Tips'] += 72.9;
          } else if (trading_day.date === '2023-08-24') {
            airtable_data['2023-08-24_17428_Kate_SHOREbar_Server']['Final Tips'] += 133.06;
            airtable_data['2023-08-24_200025_James_SHOREbar_Support']['Final Tips'] += 133.06;
          }
        } else if (acc.location === 'Bird Streets Club') {
          if (trading_day.date === '2023-08-23') {
            airtable_data['2023-08-23_12887_Bryan_Bird Streets Club_Bartender']['Card Tips'] += 2500;
            airtable_data['2023-08-23_12887_Bryan_Bird Streets Club_Bartender']['Total Tips'] += 2500;
            airtable_data['2023-08-23_24357_Kevin_Bird Streets Club_Server']['Final Tips'] += 500;
            airtable_data['2023-08-23_12682_Michael_Bird Streets Club_Server']['Final Tips'] += 500;
            airtable_data['2023-08-23_398007_Kendall_Bird Streets Club_Server']['Final Tips'] += 750;
            airtable_data['2023-08-23_17465_Dustin_Bird Streets Club_Server']['Final Tips'] += 750;
          }
        }
      }
      console.log("Getting Tips: ", acc.location);
    } catch (err) {
      console.log("Tip Distributing Error: ", err);
      return "Tip Distributing Error";
    }
  }

  let converted_airtable_data: any[] = [];
  let sql_str = 'INSERT INTO reports (airtable_id, employee, midday, week_beginning, day, reg_hours, ot_hours, dot_hours, total_hours,'
    + 'exceptions_pay, total_pay, cash_tips, card_tips, autograt, point, over_point, reason, total_tips, service_charge, final_tips, location,'
    + 'role, category) VALUES';

  for (let key of Object.keys(airtable_data)) {
    let employee_id = key.slice(11);
    let row = airtable_data[key];
    let category = 'FOH';
    switch (row['Role Name']) {
      case 'Chef de Cuisine':
      case 'Dishwasher':
      case 'Executive Chef':
      case 'Executive Sous Chef':
      case 'Line Cook':
      case 'Pastry Prep Cook':
      case 'Porter':
      case 'Prep Cook':
      case 'Sous Chef':
      case 'Sushi Chef':
      case 'Sushi Cook':
        category = 'BOH';
        break;
      case 'Security Lead':
      case 'Security':
        category = 'Security';
        break;
      default:
    }
    if (airtable_employees[employee_id] && (row['Total Hours'] || row['Service Charge'] || row['Total Tips'])) {
      sql_str += `($$${key}$$, $$${employee_id}$$, $$${row['Midday'] || ''}$$, $$${row['Week Beginning']}$$, $$${row['Day']}$$,`
        + `${row['Reg Hours']},${row['OT Hours']},${row['DOT Hours']},${row['Total Hours']},${row['Exceptions Pay']},${row['Total Pay']},`
        + `${row['Cash Tips']},${row['Card Tips']},${row['AutoGrat']},${row['Point']},${row['Override Point']},$$${row['Reason'] || ''}$$,`
        + `${row['Total Tips']},${row['Service Charge']},${row['Final Tips']},$$${row['Location']}$$,$$${row['Role Name']}$$,$$${category}$$),`;
      delete row['Role Name'];
      delete row['Location'];
      converted_airtable_data = [...converted_airtable_data, {
        fields: {
          ...row,
          "Employee": [
            airtable_employees[employee_id].getId()
          ]
        }
      }];
      // } else {
      //   console.log('Skipped ID : ', key, airtable_employees[employee_id] && airtable_employees[employee_id].getId() || 'Not Existed', row['Total Pay'], row['Final Tips']);
    }
  }
  console.log('Get Airtable Data: ', converted_airtable_data.length);
  sql_str = sql_str.slice(0, sql_str.length - 1) + ';';

  try {
    // Delete Old Records;
    await db.query(`DELETE from reports WHERE day >= \'${fromDate}\' AND day <= \'${toDate}\'` + (locationId ? ` AND location = \'${Object.keys(locations).find(loc => locations[loc].location_id === locationId)}\';` : ";"), []);
    await db.query(sql_str, []);

    const removalWebhook = {
      method: 'POST',
      url: `https://hooks.airtable.com/workflows/v1/genericWebhook/appm3mga3DgMuxH6M/wfly8cF1lc7sVJwwd/wtrK01xUSMAfIQnXu`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      form: {
        fromDate: fromDate,
        toDate: toDate,
        locationId: locationId
      }
    };

    let webhook_res: any = await doRequest(removalWebhook);
    console.log(`Removal webhook results: `, webhook_res);

    while (converted_airtable_data.length > 0) {
      await base('Reports').create(converted_airtable_data.slice(0, 10));
      converted_airtable_data = converted_airtable_data.slice(10);
    }
  } catch (err) {
    console.log("Import Data Into Airtable: ", err);
    return "Error To Import Data Into Airtable";
  }

  return "Success";
}


const getRoleName = (role_name: string, location?: string) => {
  switch (role_name) {
    case 'Event Server':
    case 'Events Server':
    case 'Server': { //Server pool
      role_name = 'Server';
      break;
    }
    case 'Event Bartender':
    case 'Events Bartender':
    case 'Bartender': { //Bartender pool
      role_name = 'Bartender';
      break;
    }
    case 'Event Busser':
    case 'Busser':
    case 'Event Runner':
    case 'Runner': {
      if (location !== "Delilah Miami") {
        role_name = 'Support';
      }
      break;
    }
    case 'Host':
    case 'Events Reception':
    case 'Event Reception':
    case 'Reception':
    case 'Receptionist': {
      role_name = 'Host';
      break;
    }
    case 'Barback':
    case 'Event Barback': {
      role_name = 'Barback';
      break;
    }
  }
  return role_name;
}

const getUpsertAPIResponse = async (url: string, user: string, password: string, offset: number) => {
  let limit = 500;
  let res: any[] = [];
  while (true) {
    const options = {
      method: 'GET',
      url: url + `&offset=${offset}`,
      headers: {
        Accept: 'application/json',
        "X-Breadcrumb-API-Key": Upserve_API_KEY,
        "X-Breadcrumb-Username": user,
        "X-Breadcrumb-Password": password
      }
    };
    let result: any = await doRequest(options);
    if (result.objects?.length) {
      console.log("Results: ", result.objects.length);
      res = [...res, ...result.objects];
      if (result.meta.next == null) break;
      offset += limit;
    } else {
      break;
    }
  }
  return res;
}

export const importSalesReportToAirtable = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'POST', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      const { fromDate, toDate, locationId } = req.query;
      let res: any = await getTipReport(fromDate, toDate, locationId);
      response.status(200).send(res);
    } catch (e) {
      response.status(500).send(e);
    }

  }
})

export const importDailySalesReportToAirtable = functions.runWith(runtimeOpts).pubsub.schedule('0 6 * * *').onRun(async () => {
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600000);
  const fromDate = getMonday(yesterday, 1);
  const toDate = new Date(new Date().setDate(now.getDate() - 1)).toISOString().split('T')[0];
  await getTipReport(fromDate, toDate);
});

export const importWeeklySalesReportToAirtable = functions.runWith(runtimeOpts).pubsub.schedule('0 12 * * 1').onRun(async () => {
  const now = new Date();
  const fromDate = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0];
  const toDate = new Date(new Date().setDate(now.getDate() - 1)).toISOString().split('T')[0];
  await getTipReport(fromDate, toDate);
});

export const exportExcelFromAirtable = functions.runWith(runtimeOpts).pubsub.schedule('0 14 * * 1').onRun(async () => {

  let csv_data: any = {};
  let converted_csv_data: any[] = [];
  let csv_data_venue: any = {};
  let converted_csv_data_venue: any[] = [];

  // Get Airtable Employees Data
  return base('Reports').select({
    maxRecords: 2000,
    view: "Current Week",
    pageSize: 100
  }).eachPage(function page(records: any[], fetchNextPage: any) {
    records.forEach((record) => {
      let employee = record.get('Employee')[0];
      let hourly_wage = record.get('Reg Rate')[0];
      let identity = record.get('Location')[0] + '_' + record.get('Day')
      if (!csv_data[employee]) {
        csv_data[employee] = {
          employee_id: record.get('Employee ID')[0],
          user_id: record.get('POS ID')[0],
          first: record.get('First')[0],
          last: record.get('Last')[0],
          role_name: record.get('Role')[0],
          location: record.get('Location')[0],
          paycome_code: record.get('Paycom Code')[0],
          r365_code: record.get('R365 Code')[0],
          reg_rate: hourly_wage,
          ot_rate: hourly_wage * 1.5,
          dot_rate: hourly_wage * 2,
          reg_hours: 0,
          ot_hours: 0,
          dot_hours: 0,
          exception_costs: 0,
          mbp: 0,
          cash_tips: 0,
          cc_tips: 0,
          auto_grat: 0,
          total_tips: 0,
          service_charge: 0,
          final_tips: 0,
          week: record.get('Week Beginning')
        }
      }

      csv_data[employee].reg_hours += Math.round(record.get('Reg Hours') * 100) / 100;
      csv_data[employee].ot_hours += Math.round(record.get('OT Hours') * 100) / 100;
      csv_data[employee].dot_hours += Math.round(record.get('DOT Hours') * 100) / 100;
      csv_data[employee].exception_costs += Math.round(record.get('Exceptions Pay') * 100) / 100;
      csv_data[employee].mbp += Math.round(record.get('Total Pay') * 100) / 100;
      csv_data[employee].cash_tips += Math.round(record.get('Cash Tips') * 100) / 100;
      csv_data[employee].cc_tips += Math.round(record.get('Card Tips') * 100) / 100;
      csv_data[employee].auto_grat += Math.round(record.get('AutoGrat') * 100) / 100;
      csv_data[employee].total_tips += Math.round(record.get('Total Tips') * 100) / 100;
      csv_data[employee].service_charge += Math.round(record.get('Service Charge') * 100) / 100;
      csv_data[employee].final_tips += Math.round(record.get('Final Tips') * 100) / 100;

      if (!csv_data_venue[identity]) {
        csv_data_venue[identity] = {
          location: record.get('Location')[0],
          day: record.get('Day'),
          total_tips: 0,
          service_charge: 0,
          final_tips: 0
        }
      }

      csv_data_venue[identity].total_tips += Math.round(record.get('Total Tips') * 100) / 100;
      csv_data_venue[identity].service_charge += Math.round(record.get('Service Charge') * 100) / 100;
      csv_data_venue[identity].final_tips += Math.round(record.get('Final Tips') * 100) / 100;
    });
    fetchNextPage();

  }, async function done(err: any) {
    if (err) { console.error(err); return; }
    for (let key of Object.keys(csv_data)) {
      converted_csv_data = [...converted_csv_data, csv_data[key]];
    }
    for (let key of Object.keys(csv_data_venue)) {
      converted_csv_data_venue = [...converted_csv_data_venue, csv_data_venue[key]];
    }

    const weekday = converted_csv_data.length > 0 ? converted_csv_data[0]['week'] : getMonday(new Date(), 0);
    console.log('Get Airtable Reports For Week ' + weekday);
    converted_csv_data = converted_csv_data.sort((a, b) => a.first.localeCompare(b.first))
      .sort((a, b) => a.role_name.localeCompare(b.role_name))
      .sort((a, b) => a.location.localeCompare(b.location));
    console.log('Get CSV Date: ', converted_csv_data.length);
    converted_csv_data_venue = converted_csv_data_venue.sort((a, b) => a.day.localeCompare(b.day))
      .sort((a, b) => a.location.localeCompare(b.location));
    console.log('Get CSV Date For Venue: ', converted_csv_data_venue.length);

    const csv = await json2csvAsync(converted_csv_data, {
      keys: [
        { field: 'employee_id', title: 'Employee ID' },
        { field: 'user_id', title: 'User ID' },
        { field: 'first', title: 'First Name' },
        { field: 'last', title: 'Last Name' },
        { field: 'role_name', title: 'Role' },
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
        { field: 'cash_tips', title: 'Cash Tips' },
        { field: 'cc_tips', title: 'Card Tips' },
        { field: 'auto_grat', title: 'AutoGrat' },
        { field: 'total_tips', title: 'Total Tips' },
        { field: 'service_charge', title: 'Service Charge' },
        { field: 'final_tips', title: 'Final Tips' },
      ]
    });

    const csv_venue = await json2csvAsync(converted_csv_data_venue, {
      keys: [
        { field: 'location', title: 'Location' },
        { field: 'day', title: 'Day' },
        { field: 'total_tips', title: 'Total Tips' },
        { field: 'service_charge', title: 'Service Charge' },
        { field: 'final_tips', title: 'Final Tips' },
      ]
    })

    const storage = getStorage(app);
    const csvFileRef = ref(storage, `weekly_report/weekly_report_for_${weekday}(wages, tips).csv`);
    await uploadString(csvFileRef, csv);
    const downloadURL = await getDownloadURL(csvFileRef)
    console.log(downloadURL);


    const csvVenueFileRef = ref(storage, `weekly_report/weekly_report_for_${weekday}(venue).csv`);
    await uploadString(csvVenueFileRef, csv_venue);
    const downloadURL1 = await getDownloadURL(csvVenueFileRef)
    console.log(downloadURL1);

    return send.request({
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
          "Email": "aguerrero@hwoodgroup.com",
          "Name": "Ada Guerrero",
        }, {
          "Email": "JGarcia@hwoodgroup.com",
          "Name": "Javier Garcia",
        }, {
          "Email": "LHernandez@hwoodgroup.com",
          "Name": "Lucy Hernandez",
        }, {
          "Email": "jdelgiudice@hwoodgroup.com",
          "Name": "Jordan DelGiudice",
        }, {
          "Email": "mkostevych@hwoodgroup.com",
          "Name": "Mark Kostevych",
        }],
        "Subject": `Wage & Tip Report For Week ${weekday}`,
        "HTMLPart": `Hello<br><br>Click <a href="${downloadURL}">Here</a> to download weekly report.<br>
        Click <a href="${downloadURL1}">Here</a> to view the report by locations.
        <br><br> Thank you.`
      }]
    }).then((res: any) => {
      console.log(res.body);
      return;
    }).catch((err: any) => {
      console.log(err.message);
      return;
    });
  });

});

export const listenFromWebhook = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      console.log(req.body);
      let punch = req.body;

      if (punch.approved) {
        let sql_str = `INSERT INTO punches VALUES (${punch.id}, ${punch.company_id}, ${punch.shift_id}, ${punch.user_id}, ${punch.editable_punch}, ` +
          `${punch.role_id}, ${punch.location_id}, ${punch.department_id}, ${punch.hourly_wage}, ${punch.approved}, $$${punch.clocked_in}$$, ` +
          `$$${punch.clocked_out || ''}$$, $$${punch.notes}$$, ${punch.auto_clocked_out}, ${punch.clocked_in_offline}, ${punch.clocked_out_offline}, ` +
          `${punch.tips}, $$${punch.created}$$, $$${punch.modified}$$, ${punch.deleted}, $$${punch.pos_type}$$, $$${punch.clocked_in_iso}$$, $$${punch.clocked_out_iso || ''}$$) ` +
          `ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id, company_id=EXCLUDED.company_id, shift_id=EXCLUDED.shift_id, user_id=EXCLUDED.user_id, editable_punch=EXCLUDED.editable_punch, ` +
          `role_id=EXCLUDED.role_id, location_id=EXCLUDED.location_id, department_id=EXCLUDED.department_id, hourly_wage=EXCLUDED.hourly_wage, approved=EXCLUDED.approved, clocked_in=EXCLUDED.clocked_in, ` +
          `clocked_out=EXCLUDED.clocked_out, notes=EXCLUDED.notes, auto_clocked_out=EXCLUDED.auto_clocked_out, clocked_in_offline=EXCLUDED.clocked_in_offline, clocked_out_offline=EXCLUDED.clocked_out_offline, ` +
          `tips=EXCLUDED.tips, created=EXCLUDED.created, modified=EXCLUDED.modified, deleted=EXCLUDED.deleted, pos_type=EXCLUDED.pos_type, clocked_in_iso=EXCLUDED.clocked_in_iso, clocked_out_iso=EXCLUDED.clocked_out_iso;`;
        await db.query(sql_str, []);

        for (let time_punch_break of punch.time_punch_breaks) {
          if (!time_punch_break.out) continue;
          sql_str = `INSERT INTO time_punch_breaks VALUES (${time_punch_break.id}, ${time_punch_break.user_id}, ${time_punch_break.custom_break_id}, ` +
            `${time_punch_break.paid}, $$${time_punch_break.in}$$, $$${time_punch_break.out}$$, $$${time_punch_break.in_iso}$$, ` +
            `$$${time_punch_break.out_iso}$$, ${time_punch_break.deleted}, ${punch.id}) ` +
            `ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id, user_id=EXCLUDED.user_id, custom_break_id=EXCLUDED.custom_break_id, ` +
            `paid=EXCLUDED.paid, "in"=EXCLUDED.in, "out"=EXCLUDED.out, in_iso=EXCLUDED.in_iso, out_iso=EXCLUDED.out_iso, ` +
            `deleted=EXCLUDED.deleted, punch_id=EXCLUDED.punch_id;`;
          await db.query(sql_str, []);
        }
      }

      response.status(200).send('Success');
    } catch (e) {
      console.error(e);
      response.status(500).send(e);
    }

  }
})

export const importSalesOrderFromSOS = functions.runWith(runtimeOpts).pubsub.schedule('0 * * * *').onRun(async () => {

  let salesOrderItems: any[] = [];
  let count = 200, start = 1;
  while (count == 200) {
    const options = {
      method: 'GET',
      url: `https://api.sosinventory.com/api/v2/salesorder?start=${start}&status=closed&updatedsince=${new Date(Date.now() - 4 * 3600000).toISOString()}`,
      // url: `https://api.sosinventory.com/api/v2/salesorder?start=${start}&status=closed`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SOS_TOKEN}`
      }
    };

    let res: any = await doRequest(options);
    console.log(`Got SOS Sales Orders ${res.count}`);
    count = res.count;
    start += 200;
    for (let order of res.data) {
      for (let orderItem of order.lines) {
        salesOrderItems = [...salesOrderItems, {
          id: orderItem.id,
          order_id: order.id,
          order_number: order.number,
          customer: order.customer,
          product: orderItem.item,
          date: order.date,
          quantity: orderItem.quantity,
          shipped: orderItem.shipped,
          invoiced: orderItem.invoiced,
          unitprice: orderItem.unitprice,
          amount: orderItem.amount
        }]
      }
    }
  }
  console.log(`Total Order Items: ${salesOrderItems.length}`);
  // Create SOS Items on Airtable
  while (salesOrderItems.length > 0) {
    const sosItemCreateWebHook = {
      method: 'POST',
      url: `https://hooks.airtable.com/workflows/v1/genericWebhook/appKWq1KHqzZeJ3uF/wflsZcYNAzawiZjfu/wtrAycEozgGhP9n1k`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      form: {
        data: JSON.stringify(salesOrderItems.slice(0, 200))
      }
    };
    let webhook_res: any = await doRequest(sosItemCreateWebHook);
    salesOrderItems = salesOrderItems.slice(200);
    console.log(`Create SOS Sales Order Item webhook results: `, webhook_res);
    console.log(`Remaining Items: `, salesOrderItems.length);

  }

});


export const importPurchaseOrderFromSOS = functions.runWith(runtimeOpts).pubsub.schedule('0 * * * *').onRun(async () => {

  let purchaseOrderItems: any[] = [];
  let count = 200, start = 1;
  while (count == 200) {
    const options = {
      method: 'GET',
      url: `https://api.sosinventory.com/api/v2/purchaseorder?start=${start}&updatedsince=${new Date(Date.now() - 6 * 3600000).toISOString()}`,
      // url: `https://api.sosinventory.com/api/v2/purchaseorder?start=${start}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${SOS_TOKEN}`
      }
    };

    let res: any = await doRequest(options);
    console.log(`Got SOS Purchase Orders ${res.count}`);
    count = res.count;
    start += 200;
    for (let order of res.data) {
      for (let orderItem of order.lines) {
        if (!orderItem.item) continue;
        purchaseOrderItems = [...purchaseOrderItems, {
          id: orderItem.id,
          order_id: order.id,
          order_number: order.number,
          supplier: order.vendor,
          product: orderItem.item.id,
          date: order.date,
          quantity: orderItem.quantity,
          received: orderItem.received,
          unitprice: orderItem.unitprice,
          amount: orderItem.amount,
          status: order.closed
        }]
      }
    }
  }
  console.log(`Total Order Items: ${purchaseOrderItems.length}`);
  // Create SOS Items on Airtable
  while (purchaseOrderItems.length > 0) {
    const sosItemCreateWebHook = {
      method: 'POST',
      url: `https://hooks.airtable.com/workflows/v1/genericWebhook/appKWq1KHqzZeJ3uF/wfleoPeyilI9b25Av/wtrmXPU9h2eUIc9ml`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      form: {
        data: JSON.stringify(purchaseOrderItems.slice(0, 200))
      }
    };
    let webhook_res: any = await doRequest(sosItemCreateWebHook);
    purchaseOrderItems = purchaseOrderItems.slice(200);
    console.log(`Create SOS Purchase Order Item webhook results: `, webhook_res);
    console.log(`Remaining Items: `, purchaseOrderItems.length);

  }

});

export const importItemsToPGSQL = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {

  try {
    let { locationId } = req.query;
    // GET Items From PGTable
    const pg_items = await db.query("SELECT item_id from items;", []);
    const pg_items_ids: string[] = pg_items.rows.map((item: any) => item.item_id);
    console.log('Got Items From PGTable : ' + pg_items_ids.length);

    let new_items: any[] = [];
    for (let loc of Object.keys(locations)) {
      let acc = locations[loc];
      if (!acc.user) continue;
      if (locationId && acc.location_id !== locationId) continue;
      // Import Items
      let items: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/items.json?status=active`,
        acc.user,
        acc.password,
        0
      );

      console.log('Got Items For ', loc);
      new_items = [...new_items, ...items.filter(item => pg_items_ids.indexOf(item.item_id) < 0).map((item: any) => ({ ...item, location: loc }))];
    }

    new_items = new_items.filter((item, index) => new_items.findIndex(item1 => item1.item_id === item.item_id) === index);
    if (new_items.length) {
      console.log(`New Items ${new_items.length} To PostgreSQL`);
      let sql_str = new_items.reduce((sql, item, index) => {
        return sql + `($$${item.item_id}$$,$$${item.name}$$,${item.price},$$${item.category}$$,$$${item.status}$$,$$${item.tax}$$,`
          + `$$${item.item_type}$$,$$${item.description || ''}$$,$$${item.location}$$)` + (index < (new_items.length - 1) ? ', ' : ';');
      }, 'INSERT INTO Items (item_id, name, price, category, status, tax, item_type, description, location) VALUES');
      await db.query(sql_str, []);
    }
    console.log('Success');
    response.status(200).send('Success');

  } catch (e) {
    console.error(e);
    response.status(500).send(e);
  }
});

export const importDataToPGSQL = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {

  let now = new Date();

  let { fromDate, toDate, locationId } = req.query;
  let updated_after = '';
  if (!fromDate) {
    fromDate = new Date(now.getTime() - 3 * 24 * 3600000).toISOString().split('T')[0];
    toDate = now.toISOString().split('T')[0];
    updated_after = new Date(now.getTime() - 25 * 3600000).toISOString();
  }

  // }
  try {
    console.log(`Data Import From Upserve To PG Server: From ${fromDate} To ${toDate}`);
    // GET Employees From PGTable
    const pg_employees = await db.query("SELECT airtable_id from employees;", []);
    const pg_employees_ids: string[] = pg_employees.rows.map((emp: any) => emp.airtable_id);
    console.log('Got Employees From PGTable : ' + pg_employees_ids.length);


    // GET Checks From PGTable
    const pg_checks = await db.query("SELECT id from checks;", []);
    const pg_checks_ids: string[] = pg_checks.rows.map((item: any) => item.id);
    console.log('Got Checks From PGTable : ' + pg_checks_ids.length);

    // GET Items From PGTable
    const pg_payments = await db.query("SELECT id from payments;", []);
    const pg_payments_ids: string[] = pg_payments.rows.map((item: any) => item.id);
    console.log('Got Payments From PGTable : ' + pg_payments_ids.length);

    // GET Check Items From PGTable
    const pg_check_items = await db.query("SELECT id from check_items;", []);
    const pg_check_items_ids: string[] = pg_check_items.rows.map((item: any) => item.id);
    console.log('Got Check Items From PGTable : ' + pg_check_items_ids.length);

    // GET Employees From Airtable
    let airtable_employees: any = await getEmployeeData();
    console.log('Got Employees From Airtable');

    let new_employees: any[] = [];
    for (let id of Object.keys(airtable_employees)) {
      let non_exist = pg_employees_ids.indexOf(id) < 0;
      if (non_exist) {
        new_employees = [...new_employees, airtable_employees[id]];
      }
    }

    if (new_employees.length) {
      let sql_str = new_employees.reduce((sql, emp, index) => {
        return sql + `($$${emp.get("Identity")}$$,$$${emp.get("Employee ID")}$$,${emp.get("POS ID")},$$${emp.get("First")}$$,$$${emp.get("Last")}$$,`
          + `$$${emp.get("Email")}$$,$$${emp.get("Mobile")}$$,$$${emp.get("Location")}$$,$$${emp.get("Paycom Code")}$$,${emp.get("R365 Code")},`
          + `$$${emp.get("Role")}$$,${emp.get("Role Id")},${emp.get("Reg Rate")})` + (index < (new_employees.length - 1) ? ', ' : ';');
      }, 'INSERT INTO employees (airtable_id, employee_id, pos_id, first, last, '
      + 'email, mobile, location, paycom_code, r365_code, '
      + 'role, role_id, reg_rate) VALUES ');
      await db.query(sql_str, []);
    }
    console.log(`Add ${new_employees.length} Employees To PostgreSQL`);

    let new_checks: any[] = [];
    let new_payments: any[] = [];
    let new_check_items: any[] = [];
    // let new_reports: any[] = [];
    for (let loc of Object.keys(locations)) {

      let acc = locations[loc];
      if (!acc.user) continue;
      if (locationId && acc.location_id !== locationId) continue;

      // Import Checks
      let checks: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/checks.json?start_date=${fromDate}&end_date=${toDate}&status=closed&updated_after=${updated_after}`,
        acc.user,
        acc.password,
        0
      );
      console.log('Got Checks For ', loc);

      let employee_data: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/employees.json?`,
        acc.user,
        acc.password,
        0
      );
      console.log("Got Employee: ", loc, employee_data.length);

      let trading_days: any[] = await getUpsertAPIResponse(
        `https://api.breadcrumb.com/ws/v2/trading_days.json?start=${fromDate}T12:00:00-08:00&end=${toDate}T12:00:00-08:00`,
        acc.user,
        acc.password,
        0
      );
      console.log("Got Trading_Days: ", loc, trading_days.length);

      for (let check of checks) {
        let trading_day = trading_days.find(d => d.id === check.trading_day_id);
        let employee = employee_data.find(e => e.id === check.employee_id);
        let role_name = (loc === 'Slab BBQ LA' || loc === 'Slab BBQ Pasadena') ? 'Server' : check.employee_role_name;
        role_name = getRoleName(role_name, loc);
        let employee_id = employee ? `${employee['employee_identifier']}_${employee['first_name'].trim()}_${acc.location}_${role_name}` : 'manager';
        if (pg_checks_ids.indexOf(check.id) < 0) {
          new_checks = [...new_checks, {
            ...check,
            location: loc,
            comp_total: check.items.reduce((sum: number, item: any) => sum += Number(item.comp_total), 0),
            trading_day: trading_day.date,
            ...(airtable_employees[employee_id] ? { employee: employee_id } : {})
          }];
        }
        // Import Check Items
        new_check_items = [...new_check_items, ...check.items.filter((item: any) => pg_check_items_ids.indexOf(item.id) < 0)];
        // Import Payments
        if (check.payments) {
          new_payments = [...new_payments, ...check.payments.filter((payment: any) => pg_payments_ids.indexOf(payment.id) < 0).map((payment: any) => ({
            ...payment,
            trading_day_id: payment.trading_day,
            trading_day: trading_day.date,
            ...(airtable_employees[employee_id] ? { employee: employee_id } : {})
          }))];
        }
      }
    }

    if (new_checks.length) {
      console.log(`New Checks ${new_checks.length} To PostgreSQL`);
      let duplicates = new_checks.filter((check, index) => new_checks.findIndex(check1 => check1.id === check.id) !== index);
      if (duplicates.length > 0) {
        console.log(`Found Some Duplicates Checks: `, duplicates);
      }
      let sql_str = new_checks.reduce((sql, check, index) => {
        return sql + `($$${check.id}$$,$token$${check.name}$token$,${check.number},$$${check.status}$$,${check.sub_total},${check.tax_total},`
          + `${check.total},${check.mandatory_tip_amount},$$${check.open_time}$$,$$${check.close_time || check.open_time}$$,$$${check.employee_name}$$,`
          + `$$${check.employee_role_name}$$,$$${check.employee_id}$$,$$${check.employee ? check.employee : 'manager'}$$,${check.guest_count},`
          + `$$${check.type}$$,${check.type_id},$$${check.taxed_type}$$,$$${check.table_name || ''}$$,$$${check.location}$$,$$${check.zone || ''}$$,`
          + `${check.autograt_tax},$$${check.trading_day_id}$$,$$${check.trading_day}$$,$$${check.updated_at}$$,`
          + `${check.non_revenue_total},${check.sub_total - check.non_revenue_total / 100.0},${check.outstanding_balance}, ${check.comp_total})` + (index < (new_checks.length - 1) ? ', ' : ';');
      }, 'INSERT INTO checks (id, name, number, status, sub_total, tax_total, '
      + 'total, mandatory_tip_amount, open_time, close_time, employee_name, '
      + 'employee_role_name, employee_id, employee, guest_count, '
      + 'type, type_id, taxed_type, table_name, location, zone, autograt_tax, trading_day_id, trading_day, '
      + 'updated_at, non_revenue_total, revenue_total, outstanding_balance, comp_total) VALUES ');
      await db.query(sql_str, []);
    }

    if (new_check_items.length) {
      console.log(`New Check Items ${new_check_items.length} To PostgreSQL`);
      let sql_str = new_check_items.reduce((sql, check_item, index) => {
        return sql + `($$${check_item.id}$$,$$${check_item.check_id}$$,$$${check_item.name}$$,$$${check_item.date}$$,$$${check_item.item_id}$$,`
          + `${check_item.quantity || 0},${check_item.price || 0},${check_item.pre_tax_price || 0},${check_item.regular_price || 0},${check_item.cost || 0},`
          + `${check_item.tax || 0},${check_item.comp_total},${check_item.comp_tax})` + (index < (new_check_items.length - 1) ? ', ' : ';');
      }, 'INSERT INTO check_items (id, check_id, name, date, item_id, '
      + 'quantity, price, pre_tax_price, regular_price, cost, '
      + 'tax, comp_total, comp_tax) VALUES ');
      await db.query(sql_str, []);
    }

    if (new_payments.length) {
      console.log(`New Payments ${new_payments.length} To PostgreSQL`);
      let sql_str = new_payments.reduce((sql, payment, index) => {
        return sql + `($$${payment.id}$$,$$${payment.check_id}$$,${payment.amount},${payment.tip_amount},$$${payment.date}$$,`
          + `$token$${payment.cc_name ? payment.cc_name : ''}$token$,$$${payment.cc_type || ''}$$,$$${payment.last_4 || ''}$$,$$${payment.trading_day_id}$$,$$${payment.trading_day}$$,`
          + `${payment.tips_withheld},$$${payment.employee_name || ''}$$,$$${payment.employee_role_name || ''}$$,$$${payment.employee_id || ''}$$,`
          + `$$${payment.employee ? payment.employee : 'manager'}$$,$$${payment.type}$$)` + (index < (new_payments.length - 1) ? ', ' : ';');
      }, 'INSERT INTO payments (id, check_id, amount, tip_amount, date, '
      + 'cc_name, cc_type, last_4, trading_day_id, trading_day, '
      + 'tips_withheld, employee_name, employee_role_name, employee_id, '
      + 'employee, type) VALUES ');
      await db.query(sql_str, []);
    }

    console.log('Success');
    response.status(200).send('Success');

  } catch (e) {
    console.error(e);
    response.status(500).send(e);
  }

});

export const checkUnApprovedPunches = functions.runWith(runtimeOpts).pubsub.schedule('0 5 * * *').onRun(async () => {
  let now = new Date();
  let yesterday = new Date(now.getTime() - 24 * 3600000).toISOString().split('T')[0];
  console.log(`Getting Time Punchs From ${yesterday} To ${now}`);

  let cursor = null;
  let unapproved_punches: any[] = [];
  while (true) {
    const options = {
      method: 'GET',
      url: `https://api.7shifts.com/v2/company/${company_id}/time_punches?limit=100&modified_since=${yesterday}`
        + (cursor ? `&cursor=${cursor}` : ''),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    };

    let res: any = await doRequest(options);
    unapproved_punches = [...unapproved_punches, ...res.data.filter((punch: any) => !punch.approved)];
    if (!res.meta.cursor.next) break;
    cursor = res.meta.cursor.next;
  }
  console.log('Get Unapproved Punches ', unapproved_punches.length);

  for (let loc of Object.keys(locations)) {
    let unapproved_count = unapproved_punches.filter(punch => punch.location_id == locations[loc].location_id).length;
    console.log(`Unapproved Punches For ${loc}: ${unapproved_count}`);
    if (unapproved_count) {

      const azureWebhook = {
        method: 'POST',
        url: `https://prod-143.westus.logic.azure.com:443/workflows/2f23741af3974661bec20c4503b5c41a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=6L3-Hy3SyGJX4iNub31PauJkj4aZ1wg6JnOhcUyzIlo`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          "type": "unapproved_punches", "venue": loc, "Unapproved Punches": unapproved_count
        })
      };

      let webhook_res: any = await request(azureWebhook);
      console.log(`Unapproved Punch Webhook results: `, webhook_res.body);
    }
  }
});

export const exportProductSOSIDs = functions.runWith(runtimeOpts).https.onRequest(async (req: any, response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', '*');

  if (['OPTIONS', 'GET', 'PUT'].indexOf(req.method) > - 1) {
    response.status(405).send('Method Not Allowed');
  } else {
    try {
      console.log(req.body);
      const body = JSON.parse(req.body);
      console.log(body);
      const order_items = body.order_items;
      console.log(order_items);
      const sos_ids = await getProductSOSIDs(order_items);
      response.type("application/json");
      response.status(200).send(sos_ids);
    } catch (e) {
      console.log(e);
      response.status(500).send(e);
    }

  }
})

const getProductSOSIDs = (product_ids: string[]) => {
  return new Promise(resolve => {
    let sos_ids: any[] = [];
    let descriptions: any[] = [];
    let names: any = {};
    cin7_base('Products').select({
      fields: ["SOS_ID", "Description", "Product/Service Name"],
      maxRecords: 10000,
      view: "Grid view"
    }).eachPage(function page(records: any[], fetchNextPage: any) {
      records.forEach((record) => {
        if (product_ids.indexOf(record.getId()) > -1) {
          sos_ids = [...sos_ids, Number(record.get('SOS_ID'))];
          descriptions = [...descriptions, record.get('Description')];
          names[record.getId()] = record.get('Product/Service Name');
        }
      });
      fetchNextPage();

    }, function done(err: any) {
      if (err) { console.error(err); resolve(null); }
      console.log('Get Products SOS IDs: ', sos_ids);
      resolve({ sos_ids, descriptions, names });
    });
  })
}


export const importShifts = functions.runWith(runtimeOpts).pubsub.schedule('0 * * * *').onRun(async () => {
  let now = new Date();
  let oneHourAgo = new Date(now.getTime() - 3610000).toISOString().slice(0, -2) + "Z";
  let lastEndDate = "2022-08-01T00:00:00Z";
  console.log(`Getting Shifts From ${oneHourAgo} To ${now.toISOString()}`);

  // Get Last End Date
  const last_shift = await db.query('select "end" from shifts order by "end" DESC limit 1;', []);
  if (last_shift.rows.length) {
    lastEndDate = new Date(last_shift.rows[0]['end']).toISOString().slice(0, -2) + "Z";
  }
  console.log(lastEndDate);

  let cursor = null;
  let shifts: any[] = [];
  while (true) {
    const options = {
      method: 'GET',
      url: `https://api.7shifts.com/v2/company/${company_id}/shifts?sort_by=end&sort_dir=asc` + (lastEndDate < oneHourAgo ? `&end[gte]=${lastEndDate}` : `&modified_since=${oneHourAgo}`) + (cursor ? `&cursor=${cursor}` : ''),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    };

    let res: any = await doRequest(options);

    shifts = [...res.data];
    console.log('Get Shifts ', shifts.length);

    let sql_str = shifts.reduce((sql, shift, index) => {
      return sql + `(${shift.id},${shift.user_id},${shift.department_id},${shift.location_id},${shift.company_id},${shift.role_id},`
        + `${shift.station},$$${shift.station_name}$$,${shift.station_id},$$${shift.start}$$,$$${shift.end}$$,`
        + `${shift.close},${shift.business_decline},${shift.hourly_wage / 100},$$${shift.notes}$$,`
        + `${shift.draft},${shift.notified},${shift.open},${shift.unassigned},${shift.unassigned_skill_level},$$${shift.open_offer_type}$$,`
        + `$$${shift.publish_status}$$,$$${shift.attendance_status}$$,${shift.late_minutes},$$${shift.created}$$,`
        + `$$${shift.modified}$$,${shift.deleted})` + (index < (shifts.length - 1) ? ', ' : '');
    }, 'INSERT INTO shifts VALUES ');
    sql_str += `ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id, user_id=EXCLUDED.user_id, department_id=EXCLUDED.department_id, location_id=EXCLUDED.location_id, company_id=EXCLUDED.company_id, ` +
      `role_id=EXCLUDED.role_id, station=EXCLUDED.station, station_name=EXCLUDED.station_name, station_id=EXCLUDED.station_id, start=EXCLUDED.start, "end"=EXCLUDED."end", ` +
      `close=EXCLUDED.close, business_decline=EXCLUDED.business_decline, hourly_wage=EXCLUDED.hourly_wage, notes=EXCLUDED.notes, draft=EXCLUDED.draft, ` +
      `notified=EXCLUDED.notified, open=EXCLUDED.open, unassigned=EXCLUDED.unassigned, unassigned_skill_level=EXCLUDED.unassigned_skill_level, open_offer_type=EXCLUDED.open_offer_type, ` +
      `publish_status=EXCLUDED.publish_status, attendance_status=EXCLUDED.attendance_status, late_minutes=EXCLUDED.late_minutes, created=EXCLUDED.created, ` +
      `modified=EXCLUDED.modified, deleted=EXCLUDED.deleted;`;
    await db.query(sql_str, []);
    if (!res.meta.cursor.next) break;
    cursor = res.meta.cursor.next;
  }
});