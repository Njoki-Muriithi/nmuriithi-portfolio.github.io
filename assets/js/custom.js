(function ($) {

	"use strict";

	// Consolidated RAF-based scroll handler
	let scrollTicking = false;
	let trackNavActive = true;
	$(window).scroll(function() {
		if (!scrollTicking) {
			requestAnimationFrame(function() {
				const scroll = $(window).scrollTop();
				const box = $('.header-text').height();
				const header = $('header').height();

				if (scroll >= box - header) {
					$("header").addClass("background-header");
				} else {
					$("header").removeClass("background-header");
				}

				if (trackNavActive) {
					onScroll();
				}
				scrollTicking = false;
			});
			scrollTicking = true;
		}
	});


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
			const expanded = $(this).attr('aria-expanded') === 'true';
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
			const expanded = $(this).attr('aria-expanded') === 'true';
			$(this).attr('aria-expanded', !expanded);
		}
	});


	// Menu elevator animation - exclude skip-link
	$('a[href*=\\#]:not([href=\\#]):not(.skip-link)').on('click', function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			const hashValue = this.hash.slice(1);
			let target = document.getElementById(hashValue);
			if (!target) {
				target = document.getElementsByName(hashValue)[0];
			}
			if (target) {
				const $target = $(target);
				const width = $(window).width();
				const headerHeight = document.querySelector('.header-area') ? document.querySelector('.header-area').offsetHeight : 80;
				if(width < 992) {
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
	    //smoothscroll - exclude skip-link from this handler
	    $('a[href^="#"]:not(.skip-link)').on('click', function (e) {
	        e.preventDefault();
	        trackNavActive = false;

	        // Only remove active from nav hash-links, not all anchors on the page
	        $('.nav a[href^="#"]').each(function () {
	            $(this).removeClass('active');
	        })
	        $(this).addClass('active');

	        const hash = this.hash;
	        const targetEl = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
	        if (targetEl) {
	            const $target = $(targetEl);
	            const headerHeight = document.querySelector('.header-area') ? document.querySelector('.header-area').offsetHeight : 80;
	            $('html, body').stop().animate({
	                scrollTop: ($target.offset().top) - headerHeight
	            }, 500, 'swing', function () {
	                window.location.hash = hash;
	                trackNavActive = true;
	            });
	        }
	    });
	});

	function onScroll(){
	    const scrollPos = $(document).scrollTop();
	    $('.nav a').each(function () {
	        const currLink = $(this);
	        const href = currLink.attr("href");
	        // Only process hash links that point to elements on this page
	        if (href && href.indexOf('#') !== -1) {
	            const hash = href.substring(href.indexOf('#'));
	            // Skip if it's just "#" or if the element doesn't exist
	            if (hash.length > 1) {
	                try {
	                    const refElement = document.getElementById(hash.slice(1));
	                    if (refElement) {
	                        const $ref = $(refElement);
	                        if ($ref.position().top <= scrollPos && $ref.position().top + $ref.height() > scrollPos) {
	                            // Only clear active from hash-based nav links, preserve page-level active
	                            $('.nav ul li a[href*="#"]').removeClass("active");
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
		const width = $(window).width();
		$('.submenu').on('click', function() {
			if(width < 767) {
				$('.submenu ul').removeClass('active');
				$(this).find('ul').toggleClass('active');
			}
		});
	}


})(window.jQuery);
