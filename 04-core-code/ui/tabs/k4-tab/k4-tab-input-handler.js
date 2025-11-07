// File: 04-core-code/ui/tabs/k4-tab/k4-tab-input-handler.js

import { EVENTS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K4 (Drive/Accessories) tab.
 */
export class K4TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K4TabInputHandler Initialized.");
    }

    initialize() {
        // This logic was moved from LeftPanelInputHandler's _setupK5Inputs
        const setupK5ModeButton = (buttonId, mode) => {
            const button = document.getElementById(buttonId);
            if (button) {
                // [REFACTOR] Removed special handling for the remote button.
                // It now fires a standard 'driveModeChanged' event, same as other accessory buttons.
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.DRIVE_MODE_CHANGED, { mode });
                });
            }
        };
        setupK5ModeButton('btn-k5-winder', 'winder');
        setupK5ModeButton('btn-k5-motor', 'motor');
        setupK5ModeButton('btn-k5-remote', 'remote');
        setupK5ModeButton('btn-k5-charger', 'charger');
        setupK5ModeButton('btn-k5-3m-cord', 'cord');

        const setupK5CounterButton = (buttonId, accessory, direction) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.ACCESSORY_COUNTER_CHANGED, { accessory, direction });
                });
            }
        };
        setupK5CounterButton('btn-k5-remote-add', 'remote', 'add');
        setupK5CounterButton('btn-k5-remote-subtract', 'remote', 'subtract');
        setupK5CounterButton('btn-k5-charger-add', 'charger', 'add');
        setupK5CounterButton('btn-k5-charger-subtract', 'charger', 'subtract');
        setupK5CounterButton('btn-k5-cord-add', 'cord', 'add');
        setupK5CounterButton('btn-k5-cord-subtract', 'cord', 'subtract');
    }
}