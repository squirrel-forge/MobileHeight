/**
 * Mobile height event
 *
 * Implements a height change event for mobile devices, does not contain any mobile detection.
 * Helps dealing with address-bar auto hide/show height changes of viewport.
 *
 * Does not require to be run after DOMContentLoaded Event, will initializes on scroll.
 *
 * State classes:
 *
 *   <body class="mobile-addressbar--visible">
 *   <body class="mobile-addressbar--hidden">
 *
 * Example:
 *
 *   window.addEventListener( 'heightchange', function( event ) {
 *      // Any of the values may be 0 initially
 *      // event.detail.offset // The last known height of the address-bar
 *      // event.detail.height // Current viewport height
 *      // event.detail.min    // Smallest viewport height
 *      // event.detail.max    // Largest viewport height
 *   } );
 *
 * Optionally you may set following body class and a window.resize event will be dispatched on change also:
 *   <body class="mobile-addressbar--resize-event">
 */
( function( root, factory ) {

    // UMD switch
    if ( typeof define === 'function' && define.amd ) {

        // AMD
        define( factory );
    } else if ( typeof module === 'object' && typeof module.exports === 'object' ) {

        // Node, CommonJS-like
        module.exports = factory();
    } else {

        // Browser globals (root is window)
        root.mobileHeight = factory( root );
    }
}( this, ( window ) => {

    // Local data reference
    var rendered = false,

        // Localize document
        document = window.document,

        // Detector element
        detector = document.createElement( 'div' ),

        // Options
        options = {

            // Disabled
            disabled : false,

            // Init function
            init : null,

            // Fire resize event
            fireResize : false,

            // Class to set when addressbar is visible
            visibleClass : 'mobile-addressbar--visible',

            // Class to set when addressbar is hidden
            hiddenClass : 'mobile-addressbar--hidden',
        },

        // Data reference
        data = {
            offset : 0,
            height : 0,
            min : 0,
            max : 0,
            dir : ''
        };

    /**
     * Render detector
     *
     * @return {void}
     */
    function render() {

        // Only render once
        if ( rendered ) {
            return;
        }
        rendered = true;

        // By default address-bar is visible
        document.body.classList.add( options.visibleClass );

        // Setup hidden size detection element
        detector.style.zIndex = -1;
        detector.style.position = 'fixed';
        detector.style.top = 0;
        detector.style.left = 0;
        detector.style.width = 0;
        detector.style.height = '100%';
        detector.style.opacity = 0;
        detector.style.visibility = 'hidden';
        document.body.appendChild( detector );
    }

    /**
     * Trigger height change event
     * and set status classes on body
     *
     * @return {void}
     */
    function trigger() {

        if ( data.height === data.max ) {

            // Address-bar is hidden
            document.body.classList.add( options.hiddenClass );
            document.body.classList.remove( options.visibleClass );
        } else {

            // Address-bar is visible
            document.body.classList.remove( options.hiddenClass );
            document.body.classList.add( options.visibleClass );
        }

        // Fire custom heightchange event on window
        window.dispatchEvent( new CustomEvent( 'heightchange', { detail : data } ) );

        // Fire an additional window resize event
        if ( options.fireResize === true ) {
            window.dispatchEvent( new Event( 'resize' ) );
        }
    }

    /**
     * Update data sizes
     *
     * @return {Boolean} - True if the viewport height changed
     */
    function update() {

        // Check for changes
        var hasChanges = false,

            // Current detector height
            height = detector.offsetHeight;

        // Check size change direction
        if ( data.height !== height ) {
            hasChanges = true;

            if ( height > data.height ) {

                // Height increased, assumption that address-bar is hidden
                data.dir = 'up';

            } else if ( height < data.height ) {

                // Height decreased, assumption that address-bar is visible
                data.dir = 'dn';
            }
        }

        // Set the viewport min height
        if ( !data.height || height <= data.height ) {
            data.min = height;
        }

        // Set the viewport max height
        if ( !data.height || height > data.height ) {
            data.max = height;
        }

        // Set current height and known address-bar offset
        data.height = height;
        data.offset = data.max - data.min;

        // Return change status
        return hasChanges;
    }

    /**
     * Scroll event handler
     *
     * @return {void}
     */
    function scroll() {

        // Not disabled
        if ( !options.disabled ) {

            // Render if required
            render();

            // Update state if required
            if ( update() ) {

                // Fire events
                trigger();
            }
        }
    }

    /**
     * Attempt to detect
     *
     * @return {void}
     */
    function detect() {

        // Must be enabled
        if ( options.disabled ) {
            throw new Error( 'mobile-height must be enabled to initialize.' );
        }

        // Ensure page can be scrolled
        var forceScrollable = document.body.style.height;
        document.body.style.height = '200vh';

        // Remember current position
        var last = document.documentElement.scrollTop;

        // Change scroll position
        document.documentElement.scrollTop = last + 1;

        // Reset after minimal delay
        window.setTimeout( function () {
            document.documentElement.scrollTop = last;
            document.body.style.height = forceScrollable;
        }, 2 );
    }

    /**
     * Document ready encapsulated detect
     *
     * @return {void}
     */
    function init() {

        // Document is already avaiable
        if ( document.readyState === 'complete' || document.readyState !== 'loading' && !document.documentElement.doScroll ) {
            detect();
        } else {

            // Wait for the document to be loaded
            document.addEventListener( 'DOMContentLoaded', detect );
        }
    }

    // Expose the encapsulated detect
    options.init = init;

    // Bind scroll handler
    window.addEventListener( 'scroll', scroll );

    // Expose the options and init method
    return options;
} ) );
