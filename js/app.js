var settings = {};
var nextPageQuery = null;
var baseQuery = 'https://api.twitter.com/1.1/search/tweets.json';
var displayedImages = [];

chrome.storage.local.get('settings', function(data) {
    data.settings = data.settings || {};
    settings.criteria = data.settings.criteria || '@PantallaBoca';
    settings.left = data.settings.left || 10;
    settings.top = data.settings.top || 10;
    refresh();
});

var loadImage = function(photo, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', photo.url, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      var img = document.createElement('img');
      img.width = 300;
      img.height = photo.height * 300 / photo.width;
      img.src = window.URL.createObjectURL(this.response);
      callback(img);
    };
    xhr.send();
};

var oauth = OAuth({
    consumer: {
        public: 'kpzFhkLt5pEhRxL5pqFjh0p6n',
        secret: 'IR57gSbc9NdDO503k0SAsv9nA3BI932zrjE9cNXi4Own10Rxdg'
    },
    signature_method: 'HMAC-SHA1'
});

var getPhotos = function(callback) {
    var request_data = {
        url: baseQuery + (nextPageQuery || ('?q=filter%3Aimages%20' + encodeURIComponent(settings.criteria))),
        method: 'GET'
    };
    $.ajax({
        url: request_data.url,
        type: request_data.method,
        headers: oauth.toHeader(oauth.authorize(request_data))
    }).done(function(data) {
        var r = [];
        data.statuses.forEach(function(tweet) {
            ((tweet.entities || {}).media || []).forEach(function(media) {
                r.push({
                    width: media.sizes.large.w,
                    height: media.sizes.large.h,
                    url: media.media_url_https,
                    author: tweet.user.screen_name
                });
            });
        });
        nextPageQuery = data.search_metadata.next_results;
        callback(r);
    });
}

var fetchPhotos = function() {
    var $photos = $('#photos');
    getPhotos(function(photos) {
        $.each(photos, function(i, photo) {
            if (displayedImages.indexOf(photo.url) === -1) {
                displayedImages.push(photo.url);
                loadImage(photo, function(image) {
                    $photos.prepend(image);
                });
            }
        });
    });
}

var refresh = function() {
    if (!settings.criteria) return;
    nextPageQuery = null;
    $('#current').css({
        left: settings.left,
        top: settings.top
    });
    $('#photos').empty();
    displayedImages = [];
    fetchPhotos();
};

$(function() {
    $(document).on('keydown keyup', function(ev) {
        if (ev.keyCode === 27) {
            $('#current').empty();
            ev.preventDefault();
        }
    });
    $('#showSettings').click(function(ev) {
        ev.preventDefault();
        var $settings = $('#settings');
        if ($settings.is(':visible')) {
            settings.criteria = $settings.find('#criteria').val();
            settings.left = parseInt($settings.find('#left').val(), 10);
            settings.top = parseInt($settings.find('#top').val(), 10);
            chrome.storage.local.set({settings: settings});
            refresh();
            $settings.hide();
        } else {
            $settings.find('#criteria').val(settings.criteria);
            $settings.find('#left').val(settings.left);
            $settings.find('#top').val(settings.top);
            $settings.show();
        }
    });
    $('#settings').hide();
    $('#fetchNew').click(fetchPhotos);
    $('#photos').on('click', 'img', function(ev) {
        $('#preview').empty();
        var cropperHeader = new Croppic('preview', {
            loadPicture: $(ev.currentTarget).attr('src'),
            onBeforeImgCrop: function() {
                var source = $('#preview img');
                $('#current').empty().append(source.clone());
                $('#preview').empty();
            }
        });
    });
});
