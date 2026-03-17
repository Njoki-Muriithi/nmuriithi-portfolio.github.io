(function ($) {

	"use strict";

	// RAF-based scroll throttle
	var scrollTicking = false;
	$(window).scroll(function() {
		if (!scrollTicking) {
			requestAnimationFrame(function() {
				var scroll = $(window).scrollTop();
				var box = $('.header-text').height();
				var header = $('header').height();

				if (scroll >= box - header) {
					$("header").addClass("background-header");
				} else {
					$("header").removeClass("background-header");
				}
				scrollTicking = false;
			});
			scrollTicking = true;
		}
	});


	$('.filters ul li').click(function(){
		$('.filters ul li').removeClass('active');
		$(this).addClass('active');

		var data = $(this).attr('data-filter');
		$grid.isotope({
			filter: data
		})
	});

	var $grid = $(".grid").isotope({
		itemSelector: ".all",
		percentPosition: true,
		masonry: {
			columnWidth: ".all"
		}
	})

	$(".Modern-Slider").slick({
	    autoplay:true,
	    autoplaySpeed:10000,
	    speed:600,
	    slidesToShow:1,
	    slidesToScroll:1,
	    pauseOnHover:false,
	    dots:true,
	    pauseOnDotsHover:true,
	    cssEase:'linear',
	   // fade:true,
	    draggable:false,
	    prevArrow:'<button class="PrevArrow"></button>',
	    nextArrow:'<button class="NextArrow"></button>',
	  });

	$('.search-icon a').on("click", function(event) {
	    event.preventDefault();
	    $("#search").addClass("open");
	    $('#search > form > input[type="search"]').focus();
	  });

	  $("#search, #search button.close").on("click keyup", function(event) {
	    if (
	      event.target == this ||
	      event.target.className == "close" ||
	      event.keyCode == 27
	    ) {
	      $(this).removeClass("open");
	    }
	  });

	  $("#search-box").submit(function(event) {
	    event.preventDefault();
	    return false;
	  });


	$('.owl-carousel').owlCarousel({
	    loop:true,
	    margin:30,
	    nav:false,
	    pagination:true,
	    responsive:{
	        0:{
	            items:1
	        },
	        600:{
	            items:2
	        },
	        1000:{
	            items:3
	        }
	    }
	})

	// Window Resize Mobile Menu Fix
	mobileNav();


	// Scroll animation init
	window.sr = new scrollReveal();


	// Menu Dropdown Toggle with ARIA support
	if($('.menu-trigger').length){
		$(".menu-trigger").on('click', function() {
			$(this).toggleClass('active');
			var expanded = $(this).attr('aria-expanded') === 'true';
			$(this).attr('aria-expanded', !expanded);
			$('.header-area .nav').slideToggle(200);
		});
	}

	// Dropdown keyboard support — prevent default on # links, allow Enter/Space to toggle
	$('.submenu > a[role="button"]').on('click', function(e) {
		e.preventDefault();
	}).on('keydown', function(e) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			$(this).parent().find('ul').toggleClass('active');
			var expanded = $(this).attr('aria-expanded') === 'true';
			$(this).attr('aria-expanded', !expanded);
		}
	});


	// Menu elevator animation - exclude skip-link
	$('a[href*=\\#]:not([href=\\#]):not(.skip-link)').on('click', function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var hashValue = this.hash.slice(1);
			var target = document.getElementById(hashValue);
			if (!target) {
				target = document.getElementsByName(hashValue)[0];
			}
			if (target) {
				var $target = $(target);
				var width = $(window).width();
				var headerHeight = $('header').outerHeight() || 80;
				if(width < 991) {
					$('.menu-trigger').removeClass('active');
					$('.menu-trigger').attr('aria-expanded', 'false');
					$('.header-area .nav').slideUp(200);
				}
				$('html,body').animate({
					scrollTop: ($target.offset().top) - headerHeight
				}, 700);
				return false;
			}
		}
	});

	$(document).ready(function () {
	    $(document).on("scroll", onScroll);

	    //smoothscroll - exclude skip-link from this handler
	    $('a[href^="#"]:not(.skip-link)').on('click', function (e) {
	        e.preventDefault();
	        $(document).off("scroll");

	        $('a').each(function () {
	            $(this).removeClass('active');
	        })
	        $(this).addClass('active');

	        var hash = this.hash;
	        var targetEl = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
	        if (targetEl) {
	            var $target = $(targetEl);
	            var headerHeight = $('header').outerHeight() || 79;
	            $('html, body').stop().animate({
	                scrollTop: ($target.offset().top) - headerHeight
	            }, 500, 'swing', function () {
	                window.location.hash = hash;
	                $(document).on("scroll", onScroll);
	            });
	        }
	    });
	});

	function onScroll(event){
	    var scrollPos = $(document).scrollTop();
	    $('.nav a').each(function () {
	        var currLink = $(this);
	        var href = currLink.attr("href");
	        // Only process hash links that point to elements on this page
	        if (href && href.indexOf('#') !== -1) {
	            var hash = href.substring(href.indexOf('#'));
	            // Skip if it's just "#" or if the element doesn't exist
	            if (hash.length > 1) {
	                try {
	                    var refElement = document.getElementById(hash.slice(1));
	                    if (refElement) {
	                        var $ref = $(refElement);
	                        if ($ref.position().top <= scrollPos && $ref.position().top + $ref.height() > scrollPos) {
	                            $('.nav ul li a').removeClass("active");
	                            currLink.addClass("active");
	                        } else {
	                            currLink.removeClass("active");
	                        }
	                    }
	                } catch(e) {
	                    // Invalid selector, skip
	                }
	            }
	        }
	    });
	}


	// Page loading animation
	$(window).on('load', function() {
		if($('.cover').length){
			$('.cover').parallax({
				imageSrc: $('.cover').data('image'),
				zIndex: '1'
			});
		}

		$("#preloader").animate({
			'opacity': '0'
		}, 600, function(){
			setTimeout(function(){
				$("#preloader").css("visibility", "hidden").fadeOut();
			}, 300);
		});
	});


	// Window Resize Mobile Menu Fix
	$(window).on('resize', function() {
		mobileNav();
	});


	// Window Resize Mobile Menu Fix
	function mobileNav() {
		var width = $(window).width();
		$('.submenu').on('click', function() {
			if(width < 767) {
				$('.submenu ul').removeClass('active');
				$(this).find('ul').toggleClass('active');
			}
		});
	}


})(window.jQuery);
