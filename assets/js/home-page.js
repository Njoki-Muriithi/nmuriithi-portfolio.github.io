// Homepage portfolio filtering
$(function() {
    var selectedClass = "";
    $(".filters p").click(function(){
        selectedClass = $(this).attr("data-rel");
        $("#portfolio").fadeTo(50, 0.1);
        $("#portfolio div").not("." + selectedClass).fadeOut();
        setTimeout(function() {
            $("." + selectedClass).fadeIn();
            $("#portfolio").fadeTo(50, 1);
            // Announce filter results to screen readers
            var count = $("." + selectedClass + ":visible").length;
            $("#filter-announcer").text(count + " projects shown");
        }, 500);
    });
});
