angular.module('labelmaker', [])

  .run(function($rootScope, $interval) {
    console.log('Running!');

    $rootScope.custom = {
      lines: {
        'line 1': '#1 DAD',
        'line 2': 'As voted by',
        'line 3': 'Jack and Jill',
      }
    };

    $rootScope.pickFile = function(id) {
      angular.element('#'+id)
        .click();
    };

    $rootScope.mobileSwap = function() {
      $rootScope.mobilePage = !$rootScope.mobilePage;
    }

  })

  .directive('bottleLabel', function() {
    return {
      restrict: 'E',
      controller: function($element, $rootScope, $document) {

        var canvas = $element.find('canvas');

        var template = {
          base: [
            {
              type: 'image',
              source: 'concrete.jpg',
              x: 100,
              y: 100,
              width: 1400,
              height: 1800,
              fromCenter: false
            },{
              name: 'colour',
              type: 'rectangle',
              fillStyle: 'red',
              strokeStyle: '#333',
              strokeWidth: 10,
              cornerRadius: 50,
              x: 100,
              y: 100,
              width: 1400,
              height: 1800,
              fromCenter: false,
              compositing: 'multiply'
            },{
              type: 'rectangle',
              strokeStyle: '#EDE8C6',
              strokeWidth: 50,
              cornerRadius: 75,
              x: 75,
              y: 75,
              width: 1450,
              height: 1850,
              fromCenter: false
            },
          ]
        };

        var dopt = {
          complete: function() {
            for(var i in $rootScope.custom.lines) {
              var t = canvas.measureText(i);
              var ratio = t.width / t.height;
              var bounds = {w: 600, h: 200};
              var pratio = bounds.w / bounds.h;
              var newHeight = 200;
              if(pratio < ratio) {
                newHeight = Math.min(200, 200 * (bounds.w / t.width));
              }
              canvas.setLayer(i, { fontSize: newHeight });
            }
            canvas.drawLayers({complete: function() {}});
          }
        }

        // Draw base layers
        for(var i in template.base) {
          canvas.addLayer(template.base[i]);
        }

        canvas.addLayer({
          type: 'text',
          name: 'line 1',
          fillStyle: '#EDE8C6',
          strokeStyle: '#333',
          strokeWidth: 5,
          x: 800, y: 250,
          fontSize: 100,
          fontFamily: 'Bree Serif, serif',
        })

        canvas.addLayer({
          type: 'text',
          name: 'line 2',
          fillStyle: '#EDE8C6',
          strokeStyle: '#333',
          strokeWidth: 5,
          x: 800, y: 1500,
          fontSize: 100,
          fontFamily: 'Bree Serif, serif',
        })

        canvas.addLayer({
          type: 'text',
          name: 'line 3',
          fillStyle: '#EDE8C6',
          strokeStyle: '#333',
          strokeWidth: 5,
          x: 800, y: 1720,
          fontSize: 100,
          fontFamily: 'Bree Serif, serif',
        })

        canvas.addLayer({
          type: 'image',
          source: 'placeholder.png',
          x: 100,
          y: 440,
          width: 1400,
          height: 932,
          fromCenter: false,
          compositing: 'source-over'
        });

        canvas.addLayer({
          type: 'image',
          visible: false,
          name: 'img',
          x: 100,
          y: 440,
          width: 1400,
          height: 932,
          sx: 700,
          sy: 466,
          sWidth: 1400,
          sHeight: 932,
          cropFromCenter: false,
          fromCenter: false
        })

        function overImage(e) {
          return canvas.getLayer('img').visible && (
            e.offsetX > 12 && e.offsetX < 150
            && e.offsetY > 65 && e.offsetY < 155);
        }

        canvas.on('mousemove', function(e) {
          canvas.css('cursor', overImage(e)?'all-scroll':'default');
        });
        function touch2mouse(e) {
          if(e.type == 'touchmove' || e.type == 'touchstart') {
            if(e.targetTouches.length == 1) {
              e.clientX = e.targetTouches[0].clientX;
              e.clientY = e.targetTouches[0].clientY;
              return e;
            } else { return false; }
          } else {
            return e;
          }
        }

        $document.on('mousemove touchmove', function(e) {
          e = touch2mouse(e); if(!e) { return; }
          m = (e.type == 'touchmove' ? 6 : 2);
          if(startPos) {
            var xShift = startCrop.x - m*(e.clientX - startPos.x);
            var yShift = startCrop.y - m*(e.clientY - startPos.y);
            var img = canvas.getLayer('img');
            yShift = Math.min(yShift, img.sHeight);
            yShift = Math.max(yShift, 466);
            xShift = Math.min(xShift, img.sWidth);
            xShift = Math.max(xShift, 700);
            canvas.setLayer('img', {
              sx: xShift,
              sy: yShift
            });
            canvas.drawLayers();
            e.preventDefault();
          }
        });

        var startPos, startCrop;
        canvas.on('mousedown touchstart', function(e) {
          e = touch2mouse(e); if(!e) { return; }
          if(e.type == 'touchstart') {
            if(!overImage(e)) { return; }
          } else {
            if(canvas.css('cursor') != 'all-scroll') { return; }
          }
          startPos = {
            x: e.clientX,
            y: e.clientY
          };
          var img = canvas.getLayer('img');
          startCrop = {
            x: img.sx,
            y: img.sy
          }
        });

        $document.on('mouseup touchend', function() {
          startPos = false;
        })

        canvas.drawLayers(dopt);

        $rootScope.$watch('custom.lines', function() {
          for(var i in $rootScope.custom.lines) {
            canvas.setLayer(i, {
              text: $rootScope.custom.lines[i],
              fontSize: 100
            });
          }
          canvas.drawLayers(dopt);
        }, true);

        $rootScope.$on('colorChange', function(evt, arg) {
          canvas.setLayer('colour', {
            fillStyle: arg
          });
          canvas.drawLayers(dopt);
        })

        $rootScope.$on('imageChange', function(evt, img) {
          canvas.setLayer('img', {
            source: img.src,
            visible: true
          })
          canvas.drawLayers();
        })

        $rootScope.save = function() {
          var data = canvas[0].toBlob(function(blob) {
            if (navigator.msSaveOrOpenBlob) {
              navigator.msSaveOrOpenBlob(blob, "label.png");
              return;
            }
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'label.png';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
              document.body.removeChild(a);
            }, 100);
          }, 'image/png');
        }

      },
      template: '<canvas width="1600" height="2000" style="width: 100%; height: 100%;"></canvas>'
    }
  })

  .directive('colourPick', function() {
    return {
      restrict: 'A',
      scope: {
        'colour-pick': '@'
      },
      controller: function($element, $scope, $rootScope) {
        $scope.thiscol = $element.attr('color');
        $element.click(function() {
          $rootScope.$broadcast('colorChange', $element.attr('color'));
        });
      },
      template: '<div class="colour" ng-style="{background: thiscol}"></div>'
    }
  })

  .directive('filechange', function() {
    return {
      restrict: 'A',
      controller: function($rootScope, $element) {
        var Pica = pica();
        $element.on('change', function() {
          angular.element('#throbber').show();
          var image = loadImage(
            $element[0].files[0],
            function(img) {
              var canvasEl = angular.element('#resizerCanvas')[0];
              //$rootScope.$emit('imageChange', img);
              var iRatio = img.width / img.height;
              var bounds = {w: 1400, h: 932};
              var pRatio = bounds.w / bounds.h;
              if(iRatio < pRatio) { // make canvas taller
                canvasEl.width = bounds.w;
                canvasEl.height = bounds.w * 1/(iRatio);
              } else {
                canvasEl.height = bounds.h;
                canvasEl.width = bounds.h * iRatio;
              }
              Pica.resize(img, canvasEl, {})
                .then(function(r) {
                  if(r) {
                    var scaledImage = new Image();
                    scaledImage.src = canvasEl.toDataURL('image/png');
                    scaledImage.onload = function() {
                      $rootScope.$emit('imageChange', scaledImage);
                      angular.element('#throbber').hide();
                    }
                  }
                })
            },
            {orientation: true}
          )
        });
      }
    }
  })