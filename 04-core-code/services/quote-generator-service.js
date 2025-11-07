// File: 04-core-code/services/quote-generator-service.js

import { paths } from '../config/paths.js';
/**
 * @fileoverview A new, single-responsibility service for generating the final quote HTML.
 * It pre-fetches and caches templates for better performance.
 */
export class QuoteGeneratorService {
    constructor({ calculationService }) {
        this.calculationService = calculationService;
        this.quoteTemplate = '';
        this.detailsTemplate = '';
        this.gmailTemplate = ''; // [NEW]

        // [MODIFIED] The script now includes a robust CSS inlining mechanism.
        this.actionBarHtml = `
    <div id="action-bar">
        <button id="copy-html-btn">Copy HTML</button>
        <button id="print-btn">Print / Save PDF</button>
    </div>`;

        this.scriptHtml = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const copyBtn = document.getElementById('copy-html-btn');
            const printBtn = document.getElementById('print-btn');
            const actionBar = document.getElementById('action-bar');

            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    window.print();
                });
            }

            // [NEW] CSS Inliner function
            const getInlinedHtml = () => {
                // 1. Create a deep clone of the document to avoid modifying the live page
                const clone = document.documentElement.cloneNode(true);

                // 2. Iterate through all stylesheets in the current document
                Array.from(document.styleSheets).forEach(sheet => {
                    try {
                        // 3. For each rule in the stylesheet, find matching elements in the CLONE
                        Array.from(sheet.cssRules).forEach(rule => {
                            const selector = rule.selectorText;
                            if (!selector) return;

                            const elements = clone.querySelectorAll(selector);
                            elements.forEach(el => {
                                // 4. Prepend the rule's styles to the element's existing inline style
                                // This ensures that more specific inline styles (if any) are not overridden.
                                const existingStyle = el.getAttribute('style') || '';
                                el.setAttribute('style', rule.style.cssText + existingStyle);
                            });
                        });
                    } catch (e) {
                        // Ignore potential cross-origin security errors when accessing stylesheets
                        console.warn('Could not process a stylesheet, possibly due to CORS policy:', e.message);
                    }
                });

                // 5. Remove elements that should not be in the copied output
                clone.querySelector('#action-bar')?.remove();
                clone.querySelector('script')?.remove();

                // 6. Return the full, inlined HTML as a string
                return '<!DOCTYPE html>' + clone.outerHTML;
            };

            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    // Temporarily change button text to give user feedback
                    copyBtn.textContent = 'Processing...';
                    copyBtn.disabled = true;

                    // Use a timeout to allow the UI to update before the heavy work
                    setTimeout(() => {
                        try {
                            const inlinedHtml = getInlinedHtml();
                           
                            navigator.clipboard.writeText(inlinedHtml)
                                .then(() => {
                                    alert('HTML with inlined styles copied to clipboard successfully!');
                                })
                                .catch(err => {
                                    console.error('Failed to copy with navigator.clipboard:', err);
                                    alert('Failed to copy. Please check console for errors.');
                                });
                        } catch (err) {
                            console.error('Error during CSS inlining process:', err);
                            alert('An error occurred while preparing the HTML. See console for details.');
                        } finally {
                            // Restore button state
                            copyBtn.textContent = 'Copy HTML';
                            copyBtn.disabled = false;
                        }
                    }, 50); // 50ms delay
                });
            }
        });
    <\/script>`;

        // [NEW] Script for GTH (Gmail Template HTML)
        this.scriptHtmlGmail = `
    <div id="action-bar" style="position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; gap: 10px;">
        <button id="copy-2g-btn" style="padding: 10px 15px; font-size: 16px; font-weight: bold; color: white; background-color: #007bff; border: none; border-radius: 5px; cursor: pointer;">Copy2G</button>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const copyBtn = document.getElementById('copy-2g-btn');

            const getInlinedHtmlForGmail = () => {
                const clone = document.documentElement.cloneNode(true);
   
                // --- ä¿®æ­£æ¨™é?è¤‡è£½? é? (Phase 3, Step A) ---
                clone.querySelector('title')?.remove();
                
                // ç§»é™¤ <style> æ¨™ç±¤ (GTH æ¨¡æ ¿æ¨??å·²å…§??
                clone.querySelectorAll('style').forEach(s => s.remove());
                
                // ç§»é™¤? ä??‰é??Œè…³??
                clone.querySelector('#action-bar')?.remove();
                clone.querySelectorAll('script').forEach(s => s.remove());

                // è¿”å? HTML ??ç´”æ???
                return {
                    html: '<!DOCTYPE html>' + clone.outerHTML,
                    text: clone.innerText || clone.textContent
                };
            };

            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    copyBtn.textContent = 'Processing...';
                    copyBtn.disabled = true;

                    setTimeout(() => {
                        try {
                            const { html, text } = getInlinedHtmlForGmail();

                         
                            // --- ä¿®æ­£?‹æ?è²¼ä?? é? (Phase 3, Step A) ---
                            // å¿…é??Œæ?å»ºç? text/html ??text/plain ?©ç¨® Blob
                            navigator.clipboard.write([
                         
                                new ClipboardItem({
                                    'text/html': new Blob([html], { type: 'text/html' }),
                                    'text/plain': new Blob([text], { type: 'text/plain' })
     
                                })
                            ]).then(() => {
                                alert('Quote copied to clipboard (Rich Text)!');
                             }).catch(err => {
                                console.error('Failed to copy rich text:', err);
                                // Fallback to text copy if rich text fails
                        
                                navigator.clipboard.writeText(text).then(() => {
                                    alert('Rich text copy failed. Copied as plain text.');
                                }).catch(err2 => {
          
                                    console.error('Fallback text copy failed:', err2);
                                    alert('Failed to copy. Please check console.');
                          
                                });
                            });

                        } catch (err) {
                            console.error('Error during HTML preparation for Gmail:', err);
                            alert('An error occurred. See console.');
                        } finally {
                            copyBtn.textContent = 'Copy2G';
                            copyBtn.disabled = false;
                        }
                    }, 50);
                });
            }
        });
    <\/script>`;


        this._initialize();
        console.log("QuoteGeneratorService Initialized.");
    }

    async _initialize() {
        try {
            // [MODIFIED] (Phase 3, Step B) Load all three templates
            [this.quoteTemplate, this.detailsTemplate, this.gmailTemplate] = await Promise.all([
                fetch(paths.partials.quoteTemplate).then(res => res.text()),
                fetch(paths.partials.detailedItemList).then(res => res.text()),
                fetch(paths.partials.gmailSimple).then(res => res.text()), // [NEW]
            ]);
            console.log("QuoteGeneratorService: All (3) HTML templates pre-fetched and cached.");
        } catch (error) {
            console.error("QuoteGeneratorService: Failed to pre-fetch HTML templates:", error);
            // In a real-world scenario, you might want to publish an error event here.
        }
    }

    /**
     * [NEW] (Phase 3, Step C) Generates the simple HTML for Gmail.
     */
    generateGmailQuoteHtml(quoteData, ui, f3Data) {
        if (!this.gmailTemplate) {
            console.error("QuoteGeneratorService: Gmail template is not loaded yet.");
            return null;
        }

        // 1. Get common data
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                <tr>
                    <td class="summary-label"
                        style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; padding-right: 20px; color: #555555;">
                        GST</td>
                    <td class="summary-value"
                        style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; font-weight: 500; padding-right: 10px;">
                        ${templateData.gst}</td>
                </tr>
            `;
        }

        // 3. Populate the GTH template
        let finalHtml = this._populateTemplate(this.gmailTemplate, {
            ...templateData,
            // [MODIFIED] v6290 Bind to correct F2 values
            total: templateData.grandTotal,
            deposit: templateData.deposit,
            balance: templateData.balance,

            // Ensure customer info is formatted
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Ensure item list is formatted
            itemsTableBody: this._generatePageOneItemsTableHtml(templateData),
            // [NEW v6290 Task 2] Pass the conditional GST row
            gstRowHtml: gstRowHtml
        });

        // 4. [REMOVED v6290 Task 2] Remove the faulty regex replacement
        // const gstRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?GST[\s\S]*?<\/td>[\s\S]*?<\/tr>/i;
        // finalHtml = finalHtml.replace(gstRowRegex, '');


        // 5. Inject the GTH script
        finalHtml = finalHtml.replace(
            '</body>',
            `${this.scriptHtmlGmail}</body>`
        );

        return finalHtml;
    }

    /**
     * Generates the full HTML for PDF/Print.
     */
    generateQuoteHtml(quoteData, ui, f3Data) {
        if (!this.quoteTemplate || !this.detailsTemplate) {
            console.error("QuoteGeneratorService: Templates are not loaded yet.");
            return null;
        }

        // 1. Delegate all data preparation to CalculationService.
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML for the *Original Table*
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                <tr> 
                    <td class="summary-label">GST (10%)</td> 
                    <td class="summary-value">${templateData.gst}</td>
                </tr>
            `;
        }

        // 3. Generate HTML snippets using the prepared data.
        const populatedDataWithHtml = {
            ...templateData,
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Use the single-table generator
            itemsTableBody: this._generatePageOneItemsTableHtml(templateData),
            rollerBlindsTable: this._generateItemsTableHtml(templateData),
            gstRowHtml: gstRowHtml // [NEW] Pass the conditional GST row
        };

        // 4. Populate templates
        const populatedDetailsPageHtml = this._populateTemplate(this.detailsTemplate, populatedDataWithHtml);

        const styleMatch = populatedDetailsPageHtml.match(/<style>([\s\S]*)<\/style>/i);
        const detailsBodyMatch = populatedDetailsPageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        if (!detailsBodyMatch) {
            throw new Error("Could not find body content in the details template.");
        }

        const detailsStyleContent = styleMatch ? styleMatch[0] : '';
        const detailsBodyContent = detailsBodyMatch[1];

        let finalHtml = this.quoteTemplate.replace('</head>', `${detailsStyleContent}</head>`);
        finalHtml = finalHtml.replace('</body>', `${detailsBodyContent}</body>`);
        finalHtml = this._populateTemplate(finalHtml, populatedDataWithHtml);

        // 5. Inject the action bar and script into the final HTML
        finalHtml = finalHtml.replace(
            '<body>',
            `<body>${this.actionBarHtml}`
        );

        finalHtml = finalHtml.replace(
            '</body>',
            `${this.scriptHtml}</body>`
        );

        return finalHtml;
    }

    _populateTemplate(template, data) {
        return template.replace(/\{\{\{?([\w\-]+)\}\}\}?/g, (match, key) => {
            // [MODIFIED] Handle GTH template keys which are different
            const value = data.hasOwnProperty(key) ? data[key] : null;

            // Allow `null` or `0` to be rendered
            if (value !== null && value !== undefined) {
                return value;
            }

            // Fallback for GTH keys that might not be in templateData root
            if (key === 'total') return data.grandTotal;
            if (key === 'deposit') return data.deposit;
            if (key === 'balance') return data.balance;

            return match; // Keep original placeholder if key not found
        });
    }

    _formatCustomerInfo(templateData) {
        let html = `<strong>${templateData.customerName || ''}</strong><br>`;
        if (templateData.customerAddress) html += `${templateData.customerAddress.replace(/\n/g, '<br>')}<br>`;
        if (templateData.customerPhone) html += `Phone: ${templateData.customerPhone}<br>`;
        if (templateData.customerEmail) html += `Email: ${templateData.customerEmail}`;
        return html;
    }

    _generateItemsTableHtml(templateData) {
        const { items, mulTimes } = templateData;
        const headers = ['#', 'F-NAME', 'F-COLOR', 'Location', 'HD', 'Dual', 'Motor', 'Price'];

        const rows = items
            .filter(item => item.width && item.height)
            .map((item, index) => {


                let fabricClass = '';
                if (item.fabric && item.fabric.toLowerCase().includes('light-filter')) {
                    fabricClass = 'bg-light-filter';
                } else if (item.fabricType === 'SN') {
                    fabricClass = 'bg-screen';

                } else if (['B1', 'B2', 'B3', 'B4', 'B5'].includes(item.fabricType)) {
                    fabricClass = 'bg-blockout';
                }

                const finalPrice = (item.linePrice || 0) * mulTimes;


                const cell = (dataLabel, content, cssClass = '') => {
                    const isEmpty = !content;
                    const finalClass = `${cssClass} ${isEmpty ? 'is-empty-cell' : ''}`.trim();
                    return `<td data-label="${dataLabel}" class="${finalClass}">${content}</td>`;

                };

                const cells = [
                    cell('#', index + 1, 'text-center'),
                    cell('F-NAME', item.fabric || '', fabricClass),
                    cell('F-COLOR', item.color || '', fabricClass),

                    cell('Location', item.location || ''),
                    cell('HD', item.winder === 'HD' ? '✔' : '', 'text-center'),
                    cell('Dual', item.dual === 'D' ? '✔' : '', 'text-center'),

                    cell('Motor', item.motor ? '✔' : '', 'text-center'),
                    cell('Price', `$${finalPrice.toFixed(2)}`, 'text-right')
                ].join('');

                return `<tr>${cells}</tr>`;
            })
            .join('');

        return `
            <table class="detailed-list-table">
                <colgroup>
      
                    <col style="width: 5%;">
                    <col style="width: 20%;">
                    <col style="width: 15%;">
                    <col style="width: 12%;">
               
                    <col style="width: 9%;">
                    <col style="width: 9%;">
                    <col style="width: 9%;">
                    <col style="width: 13%;">
                </colgroup>
        
                <thead>
                    <tr class="table-title">
                        <th colspan="${headers.length}">Roller Blinds - Detailed List</th>
                    </tr>
                   
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                  
                    ${rows}
                </tbody>
            </table>
        `;
    }

    // [MODIFIED v6290 Task 1] Rewritten function to generate a single table
    _generatePageOneItemsTableHtml(templateData) {
        const { summaryData, uiState, items } = templateData;
        const rows = [];
        const validItemCount = items.filter(i => i.width && i.height).length;

        const createRow = (number, description, qty, price, discountedPrice, isExcluded = false) => {
            const priceStyle = isExcluded ? 'style="text-decoration: line-through; color: #999999;"' : '';
            const discountedPriceValue = isExcluded ? 0 : discountedPrice;
            // [MODIFIED] Show red only if discount is applied
            const discountedPriceStyle = (discountedPrice < price) ? 'style="font-weight: bold; color: #d32f2f;"' : '';

            return `
                <tr>
                    <td data-label="NO">${number}</td>
                    <td data-label="Description" class="description">${description}</td>
                    <td data-label="QTY" class="align-right">${qty}</td>
                    <td data-label="Price" class="align-right">
                        <span class="original-price" ${priceStyle}>$${price.toFixed(2)}</span>
                    </td>
                    <td data-label="Discounted Price" class="align-right">
                        <span class="discounted-price" ${discountedPriceStyle}>$${discountedPriceValue.toFixed(2)}</span>
                    </td>
                </tr>
            `;
        };

        let itemNumber = 1;

        // Row 1: Roller Blinds
        rows.push(createRow(
            itemNumber++,
            'Roller Blinds',
            validItemCount,
            summaryData.firstRbPrice || 0,
            summaryData.disRbPrice || 0
        ));

        // Row 2: Accessories (Optional)
        if (summaryData.acceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Installation Accessories',
                'NA',
                summaryData.acceSum || 0,
                summaryData.acceSum || 0
            ));
        }

        // Row 3: Motorised (Optional)
        if (summaryData.eAcceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Motorised Accessories',
                'NA',
                summaryData.eAcceSum || 0,
                summaryData.eAcceSum || 0
            ));
        }

        // Row 4: Delivery
        const deliveryExcluded = uiState.f2.deliveryFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Delivery',
            uiState.f2.deliveryQty || 1,
            summaryData.deliveryFee || 0,
            summaryData.deliveryFee || 0,
            deliveryExcluded
        ));

        // Row 5: Installation
        const installExcluded = uiState.f2.installFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Installation',
            uiState.f2.installQty || 0, // Use installQty from F2 state
            summaryData.installFee || 0,
            summaryData.installFee || 0,
            installExcluded
        ));

        // Row 6: Removal
        const removalExcluded = uiState.f2.removalFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Removal',
            uiState.f2.removalQty || 0,
            summaryData.removalFee || 0,
            summaryData.removalFee || 0,
            removalExcluded
        ));

        // Return the full table structure
        return `
            <table class="items-table" border="1" cellpadding="0" cellspacing="0"> 
                <colgroup>
                    <col style="width: 8%;"> 
                    <col style="width: 42%;">
                    <col style="width: 15%;">
                    <col style="width: 17.5%;"> 
                    <col style="width: 17.5%;">
                </colgroup> 
                <thead>
                    <tr>
                        <th>NO</th> 
                        <th>Description</th>
                        <th class="align-right">QTY</th> 
                        <th class="align-right">Price</th>
                        <th class="align-right">Discounted Price</th> 
                    </tr>
                </thead> 
                <tbody>
                    ${rows.join('')}
                </tbody> 
            </table>
        `;
    }
}