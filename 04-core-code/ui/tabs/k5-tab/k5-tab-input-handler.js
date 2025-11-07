// File: 04-core-code/ui/tabs/k5-tab/k5-tab-input-handler.js

import { EVENTS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K5 (Dual/Chain & Summary) tab.
 */
export class K5TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K5TabInputHandler Initialized.");
    }

    initialize() {
        // This logic was moved from LeftPanelInputHandler's _setupK4Inputs
        const setupK4Button = (buttonId, mode) => {
            const button = document.getElementById(buttonId);
            if (button) {
                 button.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.DUAL_CHAIN_MODE_CHANGED, { mode });
                });
            }
        };
        setupK4Button('btn-k4-dual', 'dual');
        setupK4Button('btn-k4-chain', 'chain');

        const k4Input = document.getElementById('k4-input-display');
        if (k4Input) {
            k4Input.addEventListener('keydown', (event) => {
                 if (event.key === 'Enter') {
                    event.preventDefault();
                    this.eventAggregator.publish(EVENTS.CHAIN_ENTER_PRESSED, {
                        value: event.target.value
                     });
                }
            });
        }
    }
}