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
    $('#infoOverlay').toggleClass('active');
    $('#overlayBackdrop').toggleClass('active');
    
    // Prevent body scroll when overlay is open
    if ($('#infoOverlay').hasClass('active')) {
        $('body').css('overflow', 'hidden');
    } else {
        $('body').css('overflow', 'auto');
    }
}
