var settings = {};
var nextPageQuery = null;
var baseQuery = 'https://api.twitter.com/1.1/search/tweets.json';

chrome.storage.local.get('settings', function(data) {
    data.settings = data.settings || {};
    settings.criteria = data.settings.criteria || '@PantallaBoca';
    settings.left = data.settings.left || 10;
    settings.top = data.settings.top || 10;
    refresh();
});

var loadImage = function(photo, callback) {
    var $div = $('<div>').data({
        photo: photo
    }).css({
        width: 300,
        height: photo.height * 300 / photo.width
    });
    $div.append($('<span>').text(photo.author).attr({class: 'screen_name'}));
    $div.append($('<span>').text(photo.date).attr({class: 'date'}));
    var xhr = new XMLHttpRequest();
    xhr.open('GET', photo.url, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
        var img = document.createElement('img');
        img.src = window.URL.createObjectURL(this.response);
        $div.append(img);
    };
    xhr.send();
    callback($div);
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
                    date: new Date(tweet.created_at),
                    author: tweet.user.screen_name
                });
            });
        });
        nextPageQuery = data.search_metadata.refresh_url;
        callback(r);
    });
}

var fetchPhotos = function() {
    var $photos = $('#photos');
    getPhotos(function(photos) {
        $.each(photos, function(i, photo) {
            loadImage(photo, function(image) {
                $photos.prepend(image);
            });
        });
        var $els = $photos.children();
        $els.sort(function(a, b) {
            var adate = $(a).data('photo').date;
            var bdate = $(b).data('photo').date;
            if (adate > bdate) return -1;
            else if (adate < bdate) return 1;
            else return 0;
        });
        $els.detach().appendTo($photos);
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
    fetchPhotos();
};

var loadImageInPreview = function(img) {
    $('#preview').empty();
    var cropperHeader = new Croppic('preview', {
        loadPicture: img,
        onBeforeImgCrop: function() {
            var source = $('#preview img');
            $('#current').empty().append(source.clone());
            $('#preview').empty();
        }
    });
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
        loadImageInPreview($(ev.currentTarget).attr('src'));
    });
    $('html').on('dragover dragleave drop', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    });
    $('html').on('drop', function(ev) {
        var file = ev.originalEvent.dataTransfer.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        if (file.type.substr(0, 6) === 'image/') {
            reader.addEventListener('loadend', function(e, file) {
                loadImageInPreview(this.result);
            });
        } else if (file.type.substr(0, 6) === 'video/') {
            reader.addEventListener('loadend', function(e, f) {
                $('#preview').html(
                    $('<video>', {'loop': true, 'autoplay': true})
                        .css({width: '100%', height: '100%'})
                            .append($('<source>').attr({src: this.result, type: file.type})
                    )
                );
            });
        } else {
            return;
        }
        reader.readAsDataURL(file);
    });
    $('#preview').on('click', 'video', function() {
        var $preview = $('#preview');
        $('#current').html($preview.html());
        $preview.html('');
    });
});
