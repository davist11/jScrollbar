;(function($, window, document, undefined){

	var JScrollbar = function( elem, options ){
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data('jScrollbar-options');

		this.init();
	};

	// the plugin prototype
	JScrollbar.prototype = {
		defaults: {
			container: '.scroll__container',
			hoverClass: 'scroll--hover',
			scrollingClass: 'scroll--scrolling',
			scrolltrackClass: 'scroll__track',
			scrollbarClass: 'scroll__bar'
		},

		init: function() {
			this.config = $.extend({}, this.defaults, this.options, this.metadata);

			this.setVars();
			this.createTrack();
			this.bindEvents();

			return this;
		},

		setVars: function() {
			this.$container = this.$elem.find(this.config.container);
			this.currentClass = null;
			this.dragging = false;
			this.scrollDirection = null;
			this.$window = $(window);
			this.$document = $(document);
		},

		createTrack: function() {
			this.$track = $('<div>', {
				'class': this.config.scrolltrackClass
			});

			this.$bar = $('<div>', {
				'class': this.config.scrollbarClass
			});

			this.$track.append(this.$bar);
			this.$elem.append(this.$track);
		},

		size: function() {
			this.measure();
			this.calculate();
			this.$bar.height(this.scrollbarDimension + 'px');
			this.setPosition();
		},

		destroy: function() {
			this.unbindEvents();
			this.$elem.removeClass(this.currentClass);
		},

		measure: function() {
			var height = this.$container.height();
			var scrollHeight = this.$container[0].scrollHeight;

			// set the values of the scroll opts object
			this.setDirection(height, scrollHeight);

			// set/update the class on the wrapper
			this.setScrollClass();

			// assign dimension variables depending on scroll direction
			this.mainDimension = height;
			this.mainScrollDimension = scrollHeight;
			this.trackDimension = this.$track.height();
		},

		setDirection: function(height, scrollHeight) {
			this.scrollDirection = (scrollHeight > height) ? 'y' : 'none';
		},

		setScrollClass: function() {
			var newClass = this.config.scrollbarClass + '--' + this.scrollDirection;

			if (!this.currentClass) {
				this.$elem.addClass(newClass);
			} else if (this.currentClass !== newClass) {
				this.$elem.removeClass(this.currentClass).addClass(newClass);

				this.destroy();
				this.size();
				this.bindEvents();
			}

			this.currentClass = newClass;
		},

		calculate: function() {
			this.mainScrollableDimension = this.mainScrollDimension - this.mainDimension;
			this.scrollbarDimension = this.calcScrollbarDimension();
			this.trackLeftover = this.trackDimension - this.scrollbarDimension;
			this.trackOffset = this.$track.offset().top;
		},

		setPosition: function() {
			if (!this.dragging) {
				this.$bar.css('top', this.calcPos());
			}
		},

		bindEvents: function() {
			this.$elem.on({
				'mouseenter.jScrollbar': function(e) {
					if (!this.currentClass) {
						this.size();
					}

					this.$bar.addClass(this.config.hoverClass)
				}.bind(this),
				'mouseleave.jScrollbar': function(e) {
					this.$bar.removeClass(this.config.hoverClass)
				}.bind(this)
			});

			this.$bar.on('mousedown.jScrollbar', this.startScroll.bind(this));
			this.$container.on('scroll.jScrollbar', this.setPosition.bind(this));

			this.$document.on('mouseup.jScrollbar', this.stopScroll.bind(this));
			this.$document.on('mousemove.jScrollbar', this.doScroll.bind(this));
			this.$window.on('resize.jScrollbar', this.debounce(function(e) {
				this.size();
			}.bind(this), 500));
		},

		unbindEvents: function() {
			this.$container.off('.jScrollbar');
			this.$bar.off('.jScrollbar');

			this.$document.off('mouseup.jScrollbar', this.stopScroll);
			this.$document.off('mousemove.jScrollbar', this.doScroll);
			this.$window.off('.jScrollbar', this.debounce);
		},

		startScroll: function(e) {
			this.dragging = true;
			this.disableSelect(false);
			this.$elem.addClass(this.config.scrollingClass);

			this.cursorOffset = this.calcCursorOffset(e);
		},

		stopScroll: function(e) {
			if (this.dragging) {
				this.dragging = false;
				this.disableSelect(true);
				this.$elem.removeClass(this.config.scrollingClass);
			}
		},

		doScroll: function(event) {
			if (this.dragging) {
				var moveTo = 0;
				var scrollberPos = this.calcScrollbarPos(event);

				if (scrollberPos >= this.trackLeftover) {
					moveTo = this.trackLeftover;
				} else if (scrollberPos >= 0) {
					moveTo = scrollberPos;
				}

				this.move(moveTo);
			}
		},

		move: function(px) {
			// move scrollbar
			this.$bar.css('top', px)

			// move content
			this.$container.scrollTop(this.calcContainer(px));
		},

		disableSelect: function(trueFalse) {
			document.onselectstart = function() {
				return trueFalse;
			}
		},

		calcScrollbarDimension: function() {
			return (this.mainScrollableDimension) ? (this.mainDimension / this.mainScrollDimension) * this.trackDimension : 0;
		},

		calcCursorOffset: function(event) {
			return this.calcCursorTrackOffset(event) - parseInt(this.$bar.css('top'), 10);
		},

		calcScrollbarPos: function(event) {
			return this.calcCursorTrackOffset(event) - this.cursorOffset;
		},

		calcCursorTrackOffset: function(event) {
			return this.getCursorPosition(event).y - this.trackOffset;
		},

		calcPos: function() {
			return (this.$container.scrollTop() / this.mainScrollableDimension) * (this.trackDimension - this.scrollbarDimension);
		},

		calcContainer: function(px) {
			return this.mainScrollableDimension * (px / this.trackLeftover);
		},

		getCursorPosition: function(e) {
			e = e || window.event;
			var cursor = { x: 0, y: 0 };

			if (e.pageX || e.pageY) {
				cursor.x = e.pageX;
				cursor.y = e.pageY;
			} else {
				var de = document.documentElement;
				var b = document.body;
				cursor.x = e.clientX + (de.scrollLeft || b.scrollLeft) - (de.clientLeft || 0);
				cursor.y = e.clientY + (de.scrollTop || b.scrollTop) - (de.clientTop || 0);
			}

			return cursor;
		},

		debounce: function(func, wait, immediate) {
			var timeout, args, context, timestamp, result;

			var now = function() {
				return Date.now || new Date().getTime();
			};

			var later = function() {
				var last = now() - timestamp;

				if (last < wait && last > 0) {
					timeout = setTimeout(later, wait - last);
				} else {
					timeout = null;
					if (!immediate) {
						result = func.apply(context, args);
						if (!timeout) context = args = null;
					}
				}
			};

			return function() {
				context = this;
				args = arguments;
				timestamp = now();
				var callNow = immediate && !timeout;
				if (!timeout) timeout = setTimeout(later, wait);
				if (callNow) {
					result = func.apply(context, args);
					context = args = null;
				}

				return result;
			};
		}
	}

	JScrollbar.defaults = JScrollbar.prototype.defaults;

	$.fn.jScrollbar = function (options) {
		return this.each(function() {
			if (!$.data(this, 'plugin_jScrollbar')) {
				$.data(this, 'plugin_jScrollbar',
				new JScrollbar(this, options));
			}
		});
	};

	// window.JScrollbar = JScrollbar;

})(jQuery, window , document);