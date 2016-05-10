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
    $.ajax('https://twitter.com/search?f=images&vertical=default&q=pantallaboca&src=typd', {
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

$(function() {
    getPhotos(function(photos) {
        var $photos = $('#photos');
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
    $(document).on('keydown keyup', function(ev) {
        if (ev.keyCode === 27) {
            $('#current').empty();
            ev.preventDefault();
        }
    });
});
