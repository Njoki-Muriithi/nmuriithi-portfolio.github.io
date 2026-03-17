// Project Page Interactive Functionality

$(document).ready(function() {
    // Clone sidebar content to overlay panel, removing IDs to prevent duplicates
    var sidebarContent = $('#projectInfo').html();
    if (sidebarContent) {
        $('#overlayContent').html(sidebarContent.replace(/\bid="[^"]*"/g, ''));
    }

    // RAF-throttled scroll to show/hide floating button
    var scrollTicking = false;
    $(window).scroll(function() {
        if (!scrollTicking) {
            requestAnimationFrame(function() {
                var scrollTop = $(window).scrollTop();
                var heroHeight = $('.project-hero').outerHeight();

                if (scrollTop > heroHeight - 100) {
                    $('#floatingBtn').addClass('show');
                } else {
                    $('#floatingBtn').removeClass('show');
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    // Close overlay with ESC key
    $(document).keyup(function(e) {
        if (e.key === "Escape" && $('#infoOverlay').hasClass('active')) {
            toggleInfoOverlay();
        }
    });

    // Trap focus inside overlay when open (accessibility)
    $('#infoOverlay').on('keydown', function(e) {
        if (e.key === 'Tab') {
            var focusable = $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            var first = focusable.first();
            var last = focusable.last();

            if (e.shiftKey && document.activeElement === first[0]) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last[0]) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Bind nav buttons via data attributes (replaces inline onclick)
    $(document).on('click', '.nav-btn[data-image-index]', function() {
        var index = $(this).data('image-index');
        scrollToImage(index);
    });

    // Bind floating info button (replaces inline onclick)
    $('#floatingBtn').on('click', function() {
        toggleInfoOverlay();
    });

    // Bind close overlay button (replaces inline onclick)
    $(document).on('click', '.close-overlay', function() {
        toggleInfoOverlay();
    });

    // Bind backdrop click and keyboard (replaces inline onclick, adds keyboard support)
    $('#overlayBackdrop').on('click', function() {
        toggleInfoOverlay();
    }).on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleInfoOverlay();
        }
    });
});

// Smooth scroll for navigation buttons
function scrollToImage(imageNumber) {
    var target = document.getElementById('image-' + imageNumber);
    if (target) {
        var headerHeight = $('header').outerHeight() || 80;
        $('html, body').animate({
            scrollTop: $(target).offset().top - headerHeight
        }, 800);
    }
}

// Toggle info overlay panel
function toggleInfoOverlay() {
    var isOpening = !$('#infoOverlay').hasClass('active');

    $('#infoOverlay').toggleClass('active');
    $('#overlayBackdrop').toggleClass('active');

    // Update ARIA states
    $('#floatingBtn').attr('aria-expanded', isOpening);
    $('#overlayBackdrop').attr('aria-hidden', !isOpening);

    // Prevent body scroll when overlay is open
    if (isOpening) {
        $('body').css('overflow', 'hidden');
        // Focus the close button when opening
        setTimeout(function() {
            $('.close-overlay').focus();
        }, 100);
    } else {
        $('body').css('overflow', 'auto');
        // Return focus to the floating button
        $('#floatingBtn').focus();
    }
}
