// Global jQuery references
var $shareModal = null;
var $commentCount = null;
var $audioPlayer = null;
var $currentTime = null;
var $play = null;
var $pause = null;
var $goButton = null;
var $filmstrip = $('.filmstrip-wrapper');
var $filmstripWrapper = $('.filmstrip-outer-wrapper');
var $video = null;

// Global state
var firstShareLoad = true;
var audioFile = '/assets/audio/naught-or-nice-1-v121014.mp3';
var filmstripAspectWidth = 720;
var filmstripAspectHeight = 528;
var filmstripAspectRatio = filmstripAspectWidth / filmstripAspectHeight;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $shareModal = $('#share-modal');
    $commentCount = $('.comment-count');
    $audioPlayer = $('#audio-player');
    $currentTime = $('.current-time');
    $play = $('.play');
    $pause = $('.pause');
    $goButton = $('.js-go');
    $video = $('.covervid-video');

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $play.on('click', onPlayClick);
    $pause.on('click', onPauseClick);
    $goButton.on('click', onGoClick);
    $(window).on('resize', onWindowResize);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    getCommentCount(showCommentCount);
    setupAudio();
    sizeFilmstrip();
    setupCSSAnimations();
    $video.coverVid(640, 360);
    $video.on('ended', hideIntro);
}

var hideIntro = function() {
    console.log(hideIntro);
    $('.slide-card-closed .content-wrapper').fadeIn();
    $('.slide-card-open .content-wrapper').fadeOut();
}

var sizeFilmstrip = function() {
    var windowAspectRatio = $(window).width() / $(window).height();

    if (windowAspectRatio < filmstripAspectRatio) {
        console.log($filmstripWrapper.height())
        var filmstripWidth = Math.ceil($filmstripWrapper.height() * filmstripAspectWidth) / filmstripAspectHeight;
        $filmstrip.width(filmstripWidth + 'px').height('100%');
    } else {
        var filmstripHeight = Math.ceil($filmstripWrapper.width() * filmstripAspectHeight) / filmstripAspectWidth;
        $filmstrip.height(filmstripHeight + 'px').width('100%');
    }

}

var setupCSSAnimations = function() {
    var prefixes = [ '-webkit-', '-moz-', '-o-', '' ];
    var keyframes = '';
    var filmstripSteps = 59;

    for (var i = 0; i < prefixes.length; i++) {

        var filmstrip = '';
        for (var f = 0; f < filmstripSteps; f++) {
            var currentPct = f * (100/filmstripSteps);
            filmstrip += currentPct + '% {background-position:-' + (f * 100) + '% 0;' + prefixes[i] + 'animation-timing-function:steps(1);}';
        }
        keyframes += '@' + prefixes[i] + 'keyframes filmstrip {' + filmstrip + '}';
    }

    var test = 'h1 { color: red !important; }';

    var $s = $('<style type="text/css"></style>');
    $s.html(keyframes);
    $('head').append($s);
}

/*
 * Configure jPlayer.
 */
var setupAudio = function() {
    $audioPlayer.jPlayer({
        ended: onAudioEnded,
        supplied: 'mp3',
        loop: false,
        timeupdate: onTimeUpdate,
        swfPath: APP_CONFIG.S3_BASE_URL + '/js/lib/jquery.jplayer.swf'
    });

    $audioPlayer.jPlayer('setMedia', {
        mp3: APP_CONFIG.S3_BASE_URL + audioFile
    });
}

var onAudioEnded = function(e) {
    var time = e.jPlayer.status.currentTime;

    if (time != 0 && time != e.jPlayer.status.duration) {
        // End fired prematurely
        console.log(e.jPlayer.status.currentTime);
        console.log(e.jPlayer.status.currentPercentAbsolute);
        console.log(e.jPlayer.status.currentPercentRelative);
        console.log(e.jPlayer.status.duration);
    }
}

/*
 * Update playback timer display.
 */
var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $currentTime.text(time_text);
};

/*
 *  Open the card
 */
var onGoClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('play');
    $play.hide();
    $pause.show();
    $('.player').addClass('slide-in');
    $('.slide-card-closed .content-wrapper').fadeOut();

    if (Modernizr.touch) {
        $filmstripWrapper.show();
        $('.filmstrip').addClass('animated').on('animationend webkitAnimationEnd', hideIntro);
    } else {
        $('.covervid-wrapper').css('opacity', 1);
        $video.get(0).play();
    }
}

/*
 * Play the song, show the pause button
 */
var onPlayClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('play');
    $play.hide();
    $pause.show();
}

/*
 * Pause the song, show the play button
 */
var onPauseClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('pause');
    $pause.hide();
    $play.show();
}

/*
 * Display the comment count.
 */
var showCommentCount = function(count) {
    $commentCount.text(count);

    if (count > 0) {
        $commentCount.addClass('has-comments');
    }

    if (count > 1) {
        $commentCount.next('.comment-label').text('Comments');
    }
}

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'open-share-discuss']);

    if (firstShareLoad) {
        loadComments();

        firstShareLoad = false;
    }
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'close-share-discuss']);
}

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'summary-copied']);
}

/*
 * Window Resize
 */
var onWindowResize = _.throttle(function() {
    console.log('resize');
    sizeFilmstrip();
}, 200);

$(onDocumentLoad);
