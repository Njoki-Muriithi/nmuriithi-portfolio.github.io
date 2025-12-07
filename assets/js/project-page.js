// Project Page Interactive Functionality

$(document).ready(function() {
    // Clone sidebar content to overlay panel
    var sidebarContent = $('#projectInfo').html();
    $('#overlayContent').html(sidebarContent);
    
    // Handle scroll to show/hide floating button
    $(window).scroll(function() {
        var scrollTop = $(window).scrollTop();
        var heroHeight = $('.project-hero').outerHeight();
        
        // Show floating button when scrolled past hero section
        if (scrollTop > heroHeight - 100) {
            $('#floatingBtn').addClass('show');
        } else {
            $('#floatingBtn').removeClass('show');
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
});

// Smooth scroll for navigation buttons
function scrollToImage(imageNumber) {
    var target = $('#image-' + imageNumber);
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 80
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
