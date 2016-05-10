var settings = {};
chrome.storage.local.get('settings', function(data) {
    if (data.settings) {
        settings.criteria = data.settings.criteria || '@PantallaBoca';
        settings.left = data.settings.left || 10;
        settings.top = data.settings.top || 10;
        refresh();
    }
});

var loadImage = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      var img = document.createElement('img');
      img.src = window.URL.createObjectURL(this.response);
      callback(img);
    };
    xhr.send();
};

var getPhotos = function(callback) {
    $.ajax('https://twitter.com/search?f=images&vertical=default&q=' + encodeURI(settings.criteria) + '&src=typd', {
        success: function(data) {
            var images = $(data).find('.AdaptiveStreamGridImage').map(function(i, el) {
                var $el = $(el);
                return {
                    url: $el.data('url'),
                    author: $el.data('screenName')
                }
            });
            callback(images);
        }
    });
}

var refresh = function() {
    if (!settings.criteria) return;
    $('#current').css({
        left: settings.left,
        top: settings.top
    });
    var $photos = $('#photos').empty();
    getPhotos(function(photos) {
        $.each(photos, function(i, photo) {
            loadImage(photo.url, function(image) {
                $photos.append(image);
            });
        });
        $photos.on('click', 'img', function(ev) {
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
});
