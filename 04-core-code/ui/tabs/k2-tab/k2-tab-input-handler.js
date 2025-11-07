// File: 04-core-code/ui/tabs/k2-tab/k2-tab-input-handler.js

import { EVENTS, DOM_IDS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K2 (Fabric) tab.
 */
export class K2TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K2TabInputHandler Initialized.");
    }

    initialize() {
        // This logic was moved from LeftPanelInputHandler's _setupK2Inputs
        const fabricButton = document.getElementById('btn-focus-fabric');
        if (fabricButton) {
            fabricButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_FOCUS_MODE, { column: 'fabric' });
            });
        }
        const lfButton = document.getElementById('btn-light-filter');
        if (lfButton) {
            lfButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_LF_EDIT_MODE);
            });
        }
        const lfDelButton = document.getElementById('btn-lf-del');
        if (lfDelButton) {
            lfDelButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_LF_DELETE_MODE);
            });
        }

        // [NEW] Add listener for SSet button
        const sSetButton = document.getElementById('btn-k2-sset');
        if (sSetButton) {
            sSetButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_SSET_MODE);
            });
        }


        const batchTable = document.getElementById(DOM_IDS.FABRIC_BATCH_TABLE);
        if (batchTable) {
            batchTable.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && event.target.matches('.panel-input')) {
                    event.preventDefault();
                    const input = event.target;
                    this.eventAggregator.publish(EVENTS.PANEL_INPUT_ENTER_PRESSED, {
                        type: input.dataset.type,
                        field: input.dataset.field,
                        value: input.value
                    });
                }
            });
            batchTable.addEventListener('blur', (event) => {
                if (event.target.matches('.panel-input')) {
                    this.eventAggregator.publish(EVENTS.PANEL_INPUT_BLURRED, {
                        type: event.target.dataset.type,
                        field: event.target.dataset.field,
                        value: event.target.value
                    });
                }
            }, true);
        }
    }
}