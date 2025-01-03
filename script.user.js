// ==UserScript==
// @name         JPDB Ease Review Load
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  If you have lots of reviews due, make it look like you have less so it's easier to manage
// @author       JaiWWW
// @match        https://jpdb.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jpdb.io
// @run-at       document-start
// @homepageURL  https://github.com/JaiWWW/jpdb-ease-review-load
// @supportURL   https://github.com/JaiWWW/jpdb-ease-review-load/issues/new
// @downloadURL  https://github.com/JaiWWW/jpdb-ease-review-load/raw/main/script.user.js
// @updateURL    https://github.com/JaiWWW/jpdb-ease-review-load/raw/main/script.user.js
// ==/UserScript==
/* eslint-disable no-fallthrough -- fallthrough is love, fallthrough is life */

// User settings
const ACTIVATION_THRESHOLD = 40; // Review easing activates only if due count is greater than this number
const RESTRICTED_MAX = 30; // What the review count will start at and be restricted to
const DEBUG = false; // Enable debug logs

/////////////////////////////////////////////////////////
// TO DO                                               //
// Move user settings into jpdb settings page          //
/////////////////////////////////////////////////////////

// Add CSS to hide the body until edits are complete
const style = document.createElement('style');
style.textContent = 'body { visibility: hidden; }';
document.documentElement.appendChild(style);
if (DEBUG) {console.log('[DEBUG - Ease Review Load] Body hidden') }

(function() {
    'use strict';

    function debugLog(msg) { if (DEBUG) console.log(`[DEBUG - Ease Review Load] ${msg}`) }

    // Put my localStorage variables into a namespace by using these functions instead
    const localStoragePrefix = 'EaseReviewLoad-';
    const getItem = (name) => localStorage.getItem(`${localStoragePrefix}${name}`);
    const setItem = (name, value) => localStorage.setItem(`${localStoragePrefix}${name}`, value);

    let Activated = getItem('Activated') === 'true';
    let InitialRawDueCount = Number(getItem('InitialRawDueCount'));
    let docObserver; // Observes initial document loading to update due counts as quickly as possible
    let navObserver; // Observes the nav element on review pages so the due counter on the back can be updated

    // Remove any characters unnecessary for determining the page
    let url = window.location.href;
    if (url.includes('?')) { url = url.slice(0, url.indexOf('?')) }
    if (url.includes('#')) { url = url.slice(0, url.indexOf('#')) }
    if (url.endsWith('/')) { url = url.slice(0, -1) }
    debugLog(`Trimmed url: ${url}`);

    function main() {
        try { // To make sure we restore visibility in case something goes wrong

            // Span element in the nav holding the due/new count (Pretty sure this exists on all jpdb pages?)
            const navDCSpan = document.querySelector('div.nav a.nav-item > span');
            if (navDCSpan) {
                docObserver.disconnect(); // To avoid double triggering while the function is running
                debugLog('Nav due count element found, docObserver disconnected');
    
                const rawDueCount = navDCSpan.style.color === 'red' ? Number(navDCSpan.textContent) : 0;
                let elementsToUpdate = [navDCSpan];
    
                // I thought I wouldn't get to use fallthrough in this script :D
                const containerDCSpan = document.querySelector('div.container > p > span:not(:only-of-type)');
                switch (url.slice(-7)) { // last 7 characters
                    case '/review':
                        if (!getItem('FinishedBlockHTML')) setUpFinishedPageTemplate();
                    case 'jpdb.io':
                    case 'o/learn':
                        if (containerDCSpan) { // Doesn't exist except on the "You've finished your review session" page
                            debugLog('Container due count element found');
                            elementsToUpdate.push(containerDCSpan);
                        }
                }
    
                /* Old bad code which I replaced with the beautiful fallthrough above:
                if (url.endsWith('.io') || url.endsWith('/learn')) {
                    // Span element in a p in the container holding the due count
                    const containerDCSpan = document.querySelector('div.container > p > span');
                    debugLog('Container due count element found (homepage or /learn)');
                    elementsToUpdate.push(containerDCSpan);
                } else if (url.endsWith('/review')) {
                    // Span element in a p in the container holding the due count
                    const containerDCSpan = document.querySelector('div.container > p > span:not(:only-of-type)');
                    if (containerDCSpan) { // Doesn't exist except on the "You've finished your review session" page
                        debugLog('Container due count element found (finished review session page)');
                        elementsToUpdate.push(containerDCSpan);
                        if (!getItem('FinishedBlockHTML')) setUpFinishedPageTemplate();
                    }
                }
                */
    
                if (!Activated && rawDueCount > ACTIVATION_THRESHOLD) {
                    // ^ requirements for activating the due count reduction
                    setItem('InitialRawDueCount', rawDueCount);
                    setItem('Activated', true);
                    InitialRawDueCount = rawDueCount;
                    Activated = true;
                    debugLog('Activated displayed due count reduction');
                } if (Activated) { // not else if, because this block still needs to run if Activated was just enabled in the previous block
                    // We are going to calculate and show the displayed due count in this block so I will define it here
                    let displayedDueCount;
                    if (rawDueCount <= Math.max(0, InitialRawDueCount - RESTRICTED_MAX)) {
                        // Reduced review pile is down to 0
                        debugLog('Finished reduced review pile');
                        if (rawDueCount > ACTIVATION_THRESHOLD) {
                            // ^ requirement for re-initialising the due count reduction
                            setItem('InitialRawDueCount', rawDueCount); // Don't need to update script copy of the variable as we won't use it again
                            displayedDueCount = RESTRICTED_MAX; // Maybe set to 0 for user satisfaction until they click to continue reviewing?
                            debugLog('Due reviews still over threshold; reactivated reduction');
                        } else { // Deactivate
                            setItem('Activated', false);
                            Activated = false;
                            displayedDueCount = rawDueCount;
                            debugLog('Due count brought below threshold; deactivated reduction');
                        }
    
                        if (rawDueCount > 0) showFinishedSessionPage(displayedDueCount);
                        // otherwise the native reviews finished page will come up anyway
    
                    } else if (rawDueCount > InitialRawDueCount) {
                        // Artificially increase initial due count to avoid displayed count going above RESTRICTED_MAX
                        setItem('InitialRawDueCount', rawDueCount); // Don't need to update script copy of the variable as we won't use it again
                        displayedDueCount = RESTRICTED_MAX;
                        debugLog('Due count exceeded that at time of activation; recalibrated reduction');
                    } else { // 0 < reduced review pile due count <= RESTRICTED_MAX
                        // Displayed due count changes will mirror raw due count changes relative to the initial raw due count
                        debugLog('Due count in expected range');
                        displayedDueCount = RESTRICTED_MAX - (InitialRawDueCount - rawDueCount);
                    }
    
                    // If user got to 0 displayed reviews and is now beneath ACTIVATION_THRESHOLD, we will have deactivated since
                    // the last time we checked Activated, so we need to check again to make sure we don't update when deactivated
                    if (Activated) {
                        // Overwrite due counters
                        debugLog('Overwriting counters');
                        for (const element of elementsToUpdate) {
                            element.textContent = displayedDueCount;
                        }
                        debugLog('Successfully overwrote counters');
    
                        if (url.endsWith('/review')) {
                            navObserver.observe(navDCSpan, { characterData: true, subtree: true });
                            debugLog('navObserver set');
                        }
                    }
                }
    
                // Remove the style element to restore visibility
                style.remove();
                debugLog('Body reinstated');
    
            }
        } catch(e) {
            // Remove the style element to restore visibility
            style.remove();
            debugLog('Body reinstated because something went wrong:');
            throw e
        }
    }

    // Observe DOM mutations in case elements are dynamically added
    docObserver = new MutationObserver(() => { debugLog('docObserver triggered'); main() } );
    navObserver = new MutationObserver(() => { debugLog('navObserver triggered'); main() } );

    docObserver.observe(document.documentElement, { childList: true, subtree: true });
    debugLog('docObserver set, starting immediate initial check:');

    // Attempt immediate update in case the element is already available
    main();

    function setUpFinishedPageTemplate() {
        const bodyClone = document.body.cloneNode(true);
        bodyClone.querySelector('div.nav a.nav-item > span').id = 'nav-dc-span';
        bodyClone.querySelector('div.container > h5').id = 'h5-well-done';
        for (const p of bodyClone.querySelectorAll('div.container > p:not(:last-of-type)')) { p.remove() }
        setItem('FinishedBlockHTML', bodyClone.innerHTML);
        debugLog(`Finished page body innerHTML set: check localStorage.getItem('${localStoragePrefix}FinishedBlockHTML') to see it`);
    }

    function showFinishedSessionPage(count) {
        const bodyHTML = getItem('FinishedBlockHTML');
        document.body.innerHTML = bodyHTML;
        document.getElementById('h5-well-done').innerText = `You've finished your ${RESTRICTED_MAX} card review block!`;
        document.getElementById('nav-dc-span').innerText = count;
        debugLog('Finished page updated');
    }

    // Fallback cleanup: Stop observing after a reasonable time
    setTimeout(() => docObserver.disconnect(), 5000);

})();
