/*
 * Jquery Kenburns Image Gallery
 * Original author: John [at] Toymakerlabs
 * Further changes, comments: [at]Toymakerlabs
 * Licensed under the MIT license
 *
 * Copyright (c) 2013 ToymakerLabs
 * Version forked in: https://github.com/hector-romero/kenburns
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions: The above copyright notice and this 
 * permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
*/

;(function ( $, window, document, undefined ) {

    /*  Plugin Parameters
    ------------------------------------------------------------------------------------------------- */
    var pluginName = 'Kenburns',
        defaults = {
            duration:400,
            fadeSpeed:500,
            scale:1,
            ease3d:'cubic-bezier(.81, 0, .26, 1)',
            selector: ".kb-slide",
            onSlideComplete:function(slideIndex){}
        };


    function Plugin( element, options ) {
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options) ;
        this.init();
    }


    /*  1. Initialization
    ------------------------------------------------------------------------------------------------- */
    /**
     * Init
     * Initial setup - dermines width, height, and adds the loading icon. 
     */
    Plugin.prototype.init = function () {

        var that = this;
        this.currentSlide = 0;

        this.has3d = has3DTransforms();
        this.doTransition = (this.has3d) ? this.transition3d : this.transition;
        this.$slides = this.$element.find(this.options.selector);
        this.maxSlides = this.$slides.length;
        this.$slides.each(function (index, element) {
            that.prepareImage(element);
        });
        this.startTransition(0);
    };



    /*  2. Loading and Setup
    ------------------------------------------------------------------------------------------------- */
   
    /**
     * Attach image
     * creates a wrapper div for the image along with the image tag. The reason for the additional
     * wrapper is that we are transitioning multiple properties at the same time: scale, position, and
     * opacity. But we want opacity to finish first. This function also determines if the browser
     * has 3d transform capabilities and initializes the starting CSS values. 
     */
    Plugin.prototype.prepareImage = function(imageWrapper) {
    	var that = this;

        var wrapper = $(imageWrapper);
        wrapper.addClass('kb-slide');
        wrapper.css({'opacity':0});

		var img = wrapper.find("img");
        img.addClass("kb-slide-img");

        //First check if the browser supports 3D transitions, initialize the CSS accordingly
        if(this.has3d) {
            img.css({'-webkit-transform-origin':'left top'});
            img.css({'-moz-transform-origin':'left top'});
            img.css({'-webkit-transform':'scale('+that.options.scale+') translate3d(0,0,0)'});
            img.css({'-moz-transform':'scale('+that.options.scale+') translate3d(0,0,0)'});
        }
        var ratio = img[0].height / img[0].width;
        img.data("aspect-ratio",ratio);
        img.load(function(){
            img.data("aspect-ratio", this.height / this.width);
        });
	};

    /* 3. Transitions and Movement
    ------------------------------------------------------------------------------------------------- */

    /**
     * startTransition
     * Begins the Gallery Transition and tracks the current slide
     */
	Plugin.prototype.startTransition = function(start_index) {
	    var that = this;
	    this.currentSlide = start_index; //current slide

        that.doTransition();
		this.interval = setInterval(function(){

            //Advance the current slide
            if(that.currentSlide < that.maxSlides-1){
                that.currentSlide++;
            }else {
                that.currentSlide = 0;
            }
            that.doTransition();
		},this.options.duration);
	};


    /** 
    * chooseCorner
    * This function chooses a random start corner and a random end corner
    * that is different from the start. This gives a random direction effect
    * it returns coordinates used by the transition functions. 
    */
   
    Plugin.prototype.chooseCorner = function() {
        var scale = this.options.scale;
        var image = this.getCurrentImage();
        var ratio = image.data("aspect-ratio");
        var w = this.$element.width();
        var h = this.$element.height();

        var sw = Math.floor(w * (1/scale));
        var sh = Math.floor(w * ratio*(1/scale));

        image.width(sw);
        image.height(sh);


        var corners = [
            {x:0,y:0},
            {x:1,y:0},
            {x:0,y:1},
            {x:1,y:1}
        ];

        //Pick the first corner. Remove it from the array 
        var choice = Math.floor(Math.random()*4);
        var start = corners[choice];

        //Pick the second corner from the subset
        corners.splice(choice,1);
        var end = corners[Math.floor(Math.random()*3)];

        //build the new coordinates from the chosen coordinates
        var coordinates = {
            startX: start.x * (w - sw * scale),
            startY: start.y * (h - sh * scale),
            endX: end.x * (w - sw),
            endY: end.y * (h - sh),
            imageWidth: sw,
            imageHeight: sh
        };

      //  console.log("CORNER " + coordinates.startX + " , "+coordinates.startY + " , " +coordinates.endX + " , " +coordinates.endY);

        return coordinates;
    };

    Plugin.prototype.getCurrentSlide = function() {
        return $(this.$slides.get(this.currentSlide));
    };

    Plugin.prototype.getCurrentImage = function() {
        return this.getCurrentSlide().find(".kb-slide-img");
    };


    /** 
    *  Transiton3D
    *  Transition3d Function works by setting the webkit and moz translate3d properties. These
    *  are hardware accellerated and give a very smooth animation. Since only one animation
    *  can be applied at a time, I wrapped the images in a div. The shorter fade is applied to
    *  the parent, while the translation and scaling is applied to the image.
    */

    Plugin.prototype.transition3d = function () {

        var that  = this;
        var scale = this.options.scale;


        var slide = this.getCurrentSlide();
        var image = this.getCurrentImage();

        var position = this.chooseCorner();

        //First clear any existing transition
        image.css({'-webkit-transition':'none'});
        image.css({'-moz-transition':'none'});
        image.css({'-webkit-transform':'scale('+scale+') translate3d('+position.startX+'px,'+position.startY+'px,0)'});
        image.css({'-moz-transform':'scale('+scale+') translate3d('+position.startX+'px,'+position.startY+'px,0)'});

        //Set the wrapper to fully transparent and start it's animation
        slide.css({'opacity':0,'z-index':'3'});
        slide.animate({'opacity':1},that.options.fadeSpeed);

        //Add the transition back in
        image.css({'-webkit-transition':'-webkit-transform '+(that.options.duration+that.options.fadeSpeed)+'ms '+that.options.ease3d});
        image.css({'-moz-transition':'-moz-transform '+(that.options.duration+that.options.fadeSpeed)+'ms '+that.options.ease3d});

        //set the end position and scale, which fires the transition
        image.css({'-webkit-transform':'scale(1) translate3d('+position.endX+'px,'+position.endY+'px,0)'});
        image.css({'-moz-transform':'scale(1) translate3d('+position.endX+'px,'+position.endY+'px,0)'});

        this.transitionOut();
        this.options.onSlideComplete(this.currentSlide);
    };



    /**
     *  Transition
     *  The regular JQuery animation function. Sets the this.currentSlide initial scale and position to 
     *  the value from chooseCorner before triggering the animation. It starts the image moving to
     *  the new position, starts the fade on the wrapper, and delays the fade out animation. Adding
     *  fadeSpeed to duration gave me a nice crossfade so the image continues to move as it fades out
     *  rather than just stopping.  
     */

    Plugin.prototype.transition = function() {
        var that  = this;
        var scale = this.options.scale; 

        var slide = this.getCurrentSlide();
        var image = this.getCurrentImage();

        var position = this.chooseCorner();
        var sw = position.imageWidth;
        var sh = position.imageHeight;

        image.css({'left':position.startX,'top':position.startY,'width':sw*(scale),'height':sh*(scale)});
        image.animate({'left':position.endX,'top':position.endY,'width':sw,'height':sh}, that.options.duration + that.options.fadeSpeed);
        
        slide.css({'opacity':0,'z-index':3});
        slide.animate({'opacity':1},that.options.fadeSpeed);

        this.transitionOut();
        this.options.onSlideComplete(this.currentSlide);
    };

    Plugin.prototype.transitionOut = function() {
        var that = this;
        var slide = this.getCurrentSlide();

        slide.delay(that.options.duration).animate({'opacity':0},that.options.fadeSpeed, function(){
            slide.css({'z-index':1});
        });
    };



    /* 4. Utility Functions
    ------------------------------------------------------------------------------------------------- */
    /** 
     *  has3DTransforms
     *  Tests the browser to determine support for Webkit and Moz Transforms
     *  Creates an element, translates the element, and tests the values. If the
     *  values return true, the browser supports 3D transformations. 
     */
    function has3DTransforms() {
        var el = document.createElement('p'), 
            has3d,
            transforms = {
                'WebkitTransform':'-webkit-transform',
                'MozTransform':'-moz-transform'
            };

        document.body.insertBefore(el, null);

        for (var t in transforms) {
            if (el.style[t] !== undefined) {
                el.style[t] = "translate3d(1px,1px,1px)";
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);
        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    }


    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, 
                new Plugin( this, options ));
            }
        });
    }

})( jQuery, window, document );