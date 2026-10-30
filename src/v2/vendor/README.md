# Local QR encoder

`qrcode-generator.mjs` is `qrcode.js` from npm `qrcode-generator@1.4.4` by Kazuhiko Arase, with one ESM export appended. It retains the upstream copyright and MIT license notice. Package SHA-1: `63f771224854759329a99048806a53ed278740e7`.

Source: https://github.com/kazuhikoarase/qrcode-generator

Reproduce: `npm pack qrcode-generator@1.4.4`, extract `package/qrcode.js`, append `export default qrcode;`. No executable build step or network request is needed at runtime. The application passes an ASCII invite URL, generates the QR matrix in memory and embeds its vector modules directly in the card SVG.

## MIT license

Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
