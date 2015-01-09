var extend = angular.extend,
  forEach = angular.forEach,
  isDefined = angular.isDefined,
  isNumber = angular.isNumber,
  isString = angular.isString,
  jqLite = angular.element,
  PLATFORM_BACK_BUTTON_PRIORITY_VIEW = 100,
  PLATFORM_BACK_BUTTON_PRIORITY_SIDE_MENU = 150,
  PLATFORM_BACK_BUTTON_PRIORITY_MODAL = 200,
  PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET = 300,
  PLATFORM_BACK_BUTTON_PRIORITY_POPUP = 400,
  PLATFORM_BACK_BUTTON_PRIORITY_LOADING = 500;

//assuming that your application module var is 'app'
app
.directive('ionSideMenuContent', [
  '$timeout',
  '$ionicGesture',
  '$window',
function($timeout, $ionicGesture, $window) {

  return {
    restrict: 'EA', //DEPRECATED 'A'
    require: '^ionSideMenus',
    scope: true,
    compile: function(element, attr) {
      element.addClass('menu-content pane');

      return { pre: prelink };
      function prelink($scope, $element, $attr, sideMenuCtrl) {
        var startCoord = null;
        var primaryScrollAxis = null;

        if (isDefined(attr.dragContent)) {
          $scope.$watch(attr.dragContent, function(value) {
            sideMenuCtrl.canDragContent(value);
          });
        } else {
          sideMenuCtrl.canDragContent(true);
        }

        if (isDefined(attr.edgeDragThreshold)) {
          $scope.$watch(attr.edgeDragThreshold, function(value) {
            sideMenuCtrl.edgeDragThreshold(value);
          });
        }

        // Listen for taps on the content to close the menu
        function onContentTap(gestureEvt) {
          if (sideMenuCtrl.getOpenAmount() !== 0) {
            sideMenuCtrl.close();
            gestureEvt.gesture.srcEvent.preventDefault();
            startCoord = null;
            primaryScrollAxis = null;
          } else if (!startCoord) {
            startCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);
          }
        }

        function onDragX(e) {
          if (!sideMenuCtrl.isDraggableTarget(e)) return;

          if (getPrimaryScrollAxis(e) == 'x') {
            sideMenuCtrl._handleDrag(e);
            e.gesture.srcEvent.preventDefault();
          }
        }

        function onDragY(e) {
          if (getPrimaryScrollAxis(e) == 'x') {
            e.gesture.srcEvent.preventDefault();
          }
        }

        function onDragRelease(e) {
          sideMenuCtrl._endDrag(e);
          startCoord = null;
          primaryScrollAxis = null;
        }

        function getPrimaryScrollAxis(gestureEvt) {
          // gets whether the user is primarily scrolling on the X or Y
          // If a majority of the drag has been on the Y since the start of
          // the drag, but the X has moved a little bit, it's still a Y drag

          if (primaryScrollAxis) {
            // we already figured out which way they're scrolling
            return primaryScrollAxis;
          }

          if (gestureEvt && gestureEvt.gesture) {

            if (!startCoord) {
              // get the starting point
              startCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);

            } else {
              // we already have a starting point, figure out which direction they're going
              var endCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);

              var xDistance = Math.abs(endCoord.x - startCoord.x);
              var yDistance = Math.abs(endCoord.y - startCoord.y);

              var scrollAxis = (xDistance < yDistance ? 'y' : 'x');

              if (Math.max(xDistance, yDistance) > 30) {
                // ok, we pretty much know which way they're going
                // let's lock it in
                primaryScrollAxis = scrollAxis;
              }

              return scrollAxis;
            }
          }
          return 'y';
        }

        var content = {
          element: element[0],
          onDrag: function(e) {},
          endDrag: function(e) {},
          getTranslateX: function() {
            return $scope.sideMenuContentTranslateX || 0;
          },
          setTranslateX: ionic.animationFrameThrottle(function(amount, isMenu) {
            var xTransform = content.offsetX + amount - 30;
            if(isMenu){
              if(xTransform<0)
                xTransform+=30;
              var percentage = xTransform/225, scale;
              if((percentage*0.7)<=0){
                scale = 1;
                //remove class active
                var className = document.querySelector('.menu.menu-left').className;
                document.querySelector('.menu.menu-left').className=className.replace(/ active/g,'')
              }
              else{
                scale = .7;
                //add class active
                if(document.querySelector('.menu.menu-left').className.indexOf('active')<0)
                  document.querySelector('.menu.menu-left').className += ' active'
              }
              $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(' + xTransform + 'px,0,0) scale('+ scale +')';
            }
            else
             $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(' + xTransform + 'px,0,0)'; 
            $timeout(function() {
              $scope.sideMenuContentTranslateX = amount;
            });
          }),
          setMarginLeft: ionic.animationFrameThrottle(function(amount) {
            if (amount) {
              amount = parseInt(amount, 10);
              $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(' + amount + 'px,0,0)';
              $element[0].style.width = ($window.innerWidth - amount) + 'px';
              content.offsetX = amount;
            } else {
              $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(0,0,0)';
              $element[0].style.width = '';
              content.offsetX = 0;
            }
          }),
          setMarginRight: ionic.animationFrameThrottle(function(amount) {
            if (amount) {
              amount = parseInt(amount, 10);
              $element[0].style.width = ($window.innerWidth - amount) + 'px';
              content.offsetX = amount;
            } else {
              $element[0].style.width = '';
              content.offsetX = 0;
            }
            // reset incase left gets grabby
            $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(0,0,0)';
          }),
          enableAnimation: function() {
            $scope.animationEnabled = true;
            $element[0].classList.add('menu-animated');
          },
          disableAnimation: function() {
            $scope.animationEnabled = false;
            $element[0].classList.remove('menu-animated');
          },
          offsetX: 0
        };

        sideMenuCtrl.setContent(content);

        // add gesture handlers
        var gestureOpts = { stop_browser_behavior: false };
        var contentTapGesture = $ionicGesture.on('tap', onContentTap, $element, gestureOpts);
        var dragRightGesture = $ionicGesture.on('dragright', onDragX, $element, gestureOpts);
        var dragLeftGesture = $ionicGesture.on('dragleft', onDragX, $element, gestureOpts);
        var dragUpGesture = $ionicGesture.on('dragup', onDragY, $element, gestureOpts);
        var dragDownGesture = $ionicGesture.on('dragdown', onDragY, $element, gestureOpts);
        var releaseGesture = $ionicGesture.on('release', onDragRelease, $element, gestureOpts);

        // Cleanup
        $scope.$on('$destroy', function() {
          if (content) {
            content.element = null;
            content = null;
          }
          $ionicGesture.off(dragLeftGesture, 'dragleft', onDragX);
          $ionicGesture.off(dragRightGesture, 'dragright', onDragX);
          $ionicGesture.off(dragUpGesture, 'dragup', onDragY);
          $ionicGesture.off(dragDownGesture, 'dragdown', onDragY);
          $ionicGesture.off(releaseGesture, 'release', onDragRelease);
          $ionicGesture.off(contentTapGesture, 'tap', onContentTap);
        });
      }
    }
  };
}]);
app
.controller('$ionicSideMenus', [
  '$scope',
  '$attrs',
  '$ionicSideMenuDelegate',
  '$ionicPlatform',
  '$ionicBody',
  '$ionicHistory',
function($scope, $attrs, $ionicSideMenuDelegate, $ionicPlatform, $ionicBody, $ionicHistory) {
  var self = this;
  var rightShowing, leftShowing, isDragging;
  var startX, lastX, offsetX, isAsideExposed;
  var enableMenuWithBackViews = true;

  self.$scope = $scope;

  self.initialize = function(options) {
    self.left = options.left;
    self.right = options.right;
    self.setContent(options.content);
    self.dragThresholdX = options.dragThresholdX || 10;
    $ionicHistory.registerHistory(self.$scope);
  };

  /**
   * Set the content view controller if not passed in the constructor options.
   *
   * @param {object} content
   */
  self.setContent = function(content) {
    if (content) {
      self.content = content;

      self.content.onDrag = function(e) {
        self._handleDrag(e);
      };

      self.content.endDrag = function(e) {
        self._endDrag(e);
      };
    }
  };

  self.isOpenLeft = function() {
    return self.getOpenAmount() > 0;
  };

  self.isOpenRight = function() {
    return self.getOpenAmount() < 0;
  };

  /**
   * Toggle the left menu to open 100%
   */
  self.toggleLeft = function(shouldOpen) {
    if (isAsideExposed || !self.left.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount <= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
    } else {
      self.openPercentage(100);
    }
  };

  /**
   * Toggle the right menu to open 100%
   */
  self.toggleRight = function(shouldOpen) {
    if (isAsideExposed || !self.right.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount >= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
    } else {
      self.openPercentage(-100);
    }
  };

  self.toggle = function(side) {
    if (side == 'right') {
      self.toggleRight();
    } else {
      self.toggleLeft();
    }
  };

  /**
   * Close all menus.
   */
  self.close = function() {
    self.openPercentage(0);
  };

  /**
   * @return {float} The amount the side menu is open, either positive or negative for left (positive), or right (negative)
   */
  self.getOpenAmount = function() {
    return self.content && self.content.getTranslateX() || 0;
  };

  /**
   * @return {float} The ratio of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50% or a ratio of 0.5. Value is negative
   * for right menu.
   */
  self.getOpenRatio = function() {
    var amount = self.getOpenAmount();
    if (amount >= 0) {
      return amount / self.left.width;
    }
    return amount / self.right.width;
  };

  self.isOpen = function() {
    return self.getOpenAmount() !== 0;
  };

  /**
   * @return {float} The percentage of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50%. Value is negative
   * for right menu.
   */
  self.getOpenPercentage = function() {
    return self.getOpenRatio() * 100;
  };

  /**
   * Open the menu with a given percentage amount.
   * @param {float} percentage The percentage (positive or negative for left/right) to open the menu.
   */
  self.openPercentage = function(percentage) {
    var p = percentage / 100;

    if (self.left && percentage >= 0) {
      self.openAmount(self.left.width * p);
    } else if (self.right && percentage < 0) {
      var maxRight = self.right.width;
      self.openAmount(self.right.width * p);
    }

    // add the CSS class "menu-open" if the percentage does not
    // equal 0, otherwise remove the class from the body element
    $ionicBody.enableClass((percentage !== 0), 'menu-open');
  };

  /**
   * Open the menu the given pixel amount.
   * @param {float} amount the pixel amount to open the menu. Positive value for left menu,
   * negative value for right menu (only one menu will be visible at a time).
   */
  self.openAmount = function(amount) {
    var maxLeft = self.left && self.left.width || 0;
    var maxRight = self.right && self.right.width || 0;

    // Check if we can move to that side, depending if the left/right panel is enabled
    if (!(self.left && self.left.isEnabled) && amount > 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (!(self.right && self.right.isEnabled) && amount < 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (leftShowing && amount > maxLeft) {
      self.content.setTranslateX(maxLeft, 'menu');
      return;
    }

    if (rightShowing && amount < -maxRight) {
      self.content.setTranslateX(-maxRight, 'menu');
      return;
    }

    self.content.setTranslateX(amount, 'menu');

    if (amount >= 0) {
      leftShowing = true;
      rightShowing = false;

      if (amount > 0) {
        // Push the z-index of the right menu down
        self.right && self.right.pushDown && self.right.pushDown();
        // Bring the z-index of the left menu up
        self.left && self.left.bringUp && self.left.bringUp();
      }
    } else {
      rightShowing = true;
      leftShowing = false;

      // Bring the z-index of the right menu up
      self.right && self.right.bringUp && self.right.bringUp();
      // Push the z-index of the left menu down
      self.left && self.left.pushDown && self.left.pushDown();
    }
  };

  /**
   * Given an event object, find the final resting position of this side
   * menu. For example, if the user "throws" the content to the right and
   * releases the touch, the left menu should snap open (animated, of course).
   *
   * @param {Event} e the gesture event to use for snapping
   */
  self.snapToRest = function(e) {
    // We want to animate at the end of this
    self.content.enableAnimation();
    isDragging = false;

    // Check how much the panel is open after the drag, and
    // what the drag velocity is
    var ratio = self.getOpenRatio();

    if (ratio === 0) {
      // Just to be safe
      self.openPercentage(0);
      return;
    }

    var velocityThreshold = 0.3;
    var velocityX = e.gesture.velocityX;
    var direction = e.gesture.direction;

    // Going right, less than half, too slow (snap back)
    if (ratio > 0 && ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going left, more than half, too slow (snap back)
    else if (ratio > 0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(100);
    }

    // Going left, less than half, too slow (snap back)
    else if (ratio < 0 && ratio > -0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going right, more than half, too slow (snap back)
    else if (ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(-100);
    }

    // Going right, more than half, or quickly (snap open)
    else if (direction == 'right' && ratio >= 0 && (ratio >= 0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(100);
    }

    // Going left, more than half, or quickly (span open)
    else if (direction == 'left' && ratio <= 0 && (ratio <= -0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(-100);
    }

    // Snap back for safety
    else {
      self.openPercentage(0);
    }
  };

  self.enableMenuWithBackViews = function(val) {
    if (arguments.length) {
      enableMenuWithBackViews = !!val;
    }
    return enableMenuWithBackViews;
  };

  self.isAsideExposed = function() {
    return !!isAsideExposed;
  };

  self.exposeAside = function(shouldExposeAside) {
    if (!(self.left && self.left.isEnabled) && !(self.right && self.right.isEnabled)) return;
    self.close();
    isAsideExposed = shouldExposeAside;
    if (self.left && self.left.isEnabled) {
      // set the left marget width if it should be exposed
      // otherwise set false so there's no left margin
      self.content.setMarginLeft(isAsideExposed ? self.left.width : 0);
    } else if (self.right && self.right.isEnabled) {
      self.content.setMarginRight(isAsideExposed ? self.right.width : 0);
    }

    self.$scope.$emit('$ionicExposeAside', isAsideExposed);
  };

  self.activeAsideResizing = function(isResizing) {
    $ionicBody.enableClass(isResizing, 'aside-resizing');
  };

  // End a drag with the given event
  self._endDrag = function(e) {
    if (isAsideExposed) return;

    if (isDragging) {
      self.snapToRest(e);
    }
    startX = null;
    lastX = null;
    offsetX = null;
  };

  // Handle a drag event
  self._handleDrag = function(e) {
    if (isAsideExposed) return;
    // If we don't have start coords, grab and store them
    if (!startX) {
      startX = e.gesture.touches[0].pageX;
      lastX = startX;
    } else {
      // Grab the current tap coords
      lastX = e.gesture.touches[0].pageX;
    }

    // Calculate difference from the tap points
    if (!isDragging && Math.abs(lastX - startX) > self.dragThresholdX) {
      // if the difference is greater than threshold, start dragging using the current
      // point as the starting point
      startX = lastX;

      isDragging = true;
      // Initialize dragging
      self.content.disableAnimation();
      offsetX = self.getOpenAmount();
    }

    if (isDragging) {
      self.openAmount(offsetX + (lastX - startX));
    }
  };

  self.canDragContent = function(canDrag) {
    if (arguments.length) {
      $scope.dragContent = !!canDrag;
    }
    return $scope.dragContent;
  };

  self.edgeThreshold = 25;
  self.edgeThresholdEnabled = false;
  self.edgeDragThreshold = function(value) {
    if (arguments.length) {
      if (angular.isNumber(value) && value > 0) {
        self.edgeThreshold = value;
        self.edgeThresholdEnabled = true;
      } else {
        self.edgeThresholdEnabled = !!value;
      }
    }
    return self.edgeThresholdEnabled;
  };

  self.isDraggableTarget = function(e) {
    //Only restrict edge when sidemenu is closed and restriction is enabled
    var shouldOnlyAllowEdgeDrag = self.edgeThresholdEnabled && !self.isOpen();
    var startX = e.gesture.startEvent && e.gesture.startEvent.center &&
      e.gesture.startEvent.center.pageX;

    var dragIsWithinBounds = !shouldOnlyAllowEdgeDrag ||
      startX <= self.edgeThreshold ||
      startX >= self.content.element.offsetWidth - self.edgeThreshold;

    var backView = $ionicHistory.backView();
    var menuEnabled = enableMenuWithBackViews ? true : !backView;
    if (!menuEnabled) {
      var currentView = $ionicHistory.currentView() || {};
      return backView.historyId !== currentView.historyId;
    }

    return ($scope.dragContent || self.isOpen()) &&
      dragIsWithinBounds &&
      !e.gesture.srcEvent.defaultPrevented &&
      menuEnabled &&
      !e.target.tagName.match(/input|textarea|select|object|embed/i) &&
      !e.target.isContentEditable &&
      !(e.target.dataset ? e.target.dataset.preventScroll : e.target.getAttribute('data-prevent-scroll') == 'true');
  };

  $scope.sideMenuContentTranslateX = 0;

  var deregisterBackButtonAction = angular.noop;
  var closeSideMenu = angular.bind(self, self.close);

  $scope.$watch(function() {
    return self.getOpenAmount() !== 0;
  }, function(isOpen) {
    deregisterBackButtonAction();
    if (isOpen) {
      deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(
        closeSideMenu,
        PLATFORM_BACK_BUTTON_PRIORITY_SIDE_MENU
      );
    }
  });

  var deregisterInstance = $ionicSideMenuDelegate._registerInstance(
    self, $attrs.delegateHandle, function() {
      return $ionicHistory.isActiveScope($scope);
    }
  );

  $scope.$on('$destroy', function() {
    deregisterInstance();
    deregisterBackButtonAction();
    self.$scope = null;
    if (self.content) {
      self.content.element = null;
      self.content = null;
    }
  });

  self.initialize({
    left: {
      width: 275
    },
    right: {
      width: 275
    }
  });

}]);