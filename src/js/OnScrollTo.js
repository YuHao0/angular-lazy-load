import _ from './LodashShim.js';

let OnScrollTo = ['$window', '$timeout', 'lazyLoad', ($window, $timeout, lazyLoad) => {
  let defaults = {
    intersectionThreshold: 0.1,
    throttleWait: 20,
    unobserveInstantly: true,
    observeInstantly: true,
    useIntersectionObserver: lazyLoad.useIntersectionObserver,
    intersectionRoot: null,
    intersectionRootMargin: "0px",
    scrollOffset: lazyLoad.scrollOffset
  };
  return {
    restrict: 'A',
    link(scope, element, attrs) {
      let fn = scope.$eval(attrs.onScrollTo);
      // compiles into less code than iterating over keys or array of strings
      let attrOptions = {
        intersectionRatio: scope.$eval(attrs.scrollThreshold),
        throttleWait: scope.$eval(attrs.scrollThrottle),
        unobserveInstantly: scope.$eval(attrs.scrollUnobserve),
        observeInstantly: scope.$eval(attrs.scrollObserve),
        intersectionRoot: scope.$eval(attrs.scrollRoot),
        intersectionRootMargin: scope.$eval(attrs.scrollRootMargin),
        scrollOffset: scope.$eval(attrs.scrollOffset),
        useIntersectionObserver: scope.$eval(attrs.useIo)
      };
      let options = defaults;
      for (let k in attrOptions) {
        let v = attrOptions[k];
        if (v != null) { options[k] = v; }
      }
      if (options.useIntersectionObserver &&
        (typeof IntersectionObserver !== 'undefined')) {
        let rootMargin = "0px";
        if (options.scrollOffset != null) {
          if (options.intersectionRootMargin) {
            let parts = options.intersectionRootMargin.split(" ").splice(0, 1);
            parts = parts.concat([`${options.scrollOffset}px`]);
            rootMargin = parts.join(" ");
          } else {
            rootMargin = `0px 0px 0px ${options.scrollOffset}px`;
          }
        }
        var io = new IntersectionObserver(function(entries) {
          if (entries[0].intersectionRatio == 0) { return; }
          scope.$apply(fn);
          if (options.unobserveInstantly) {
            return io.unobserve(element[0]);
          }
          }, {
          root: options.intersectionRoot,
          rootMargin: options.intersectionRootMargin,
          threshold: options.intersectionThreshold
          });
        return io.observe(element[0]);
      } else {
        const scrollOffset = options.scrollOffset || 0;

        const checkScrollOffset = function() {
          const topOffset = (element) => element[0].getBoundingClientRect().top
            + window.pageYOffset
            - element[0].ownerDocument.documentElement.clientTop;
          const rootEl = angular.element(options.intersectionRoot);
          const fold = (rootEl[0]) ? (topOffset(rootEl) + rootEl[0].offsetHeight)
            : (window.innerHeight + window.pageYOffset);
          if (fold > topOffset(element) - scrollOffset) {
            scope.$apply(fn);
            if (options.unobserveInstantly) {
              return $window.removeEventListener('scroll', scrollHandler);
            }
          }
        }

        const scrollHandler = _.throttle(function(e) {
          if (element[0].offsetParent == null) { return false };
          checkScrollOffset();
        }
        , options.throttleWait
        );

        const inIframe = (() => {
          try {
            return window.self !== window.top;
          } catch (e) {
            return true;
          }
        })();

        if (inIframe) {
          scope.$apply(fn);
        } else {
          $window.addEventListener('scroll', scrollHandler);

          if (options.observeInstantly) {
            $timeout(scrollHandler);
          }
        }

        if (!!attrs.trigger) {
          scope.$watch(attrs.trigger, (newVal, oldVal) => {
            if (newVal !== oldVal) {
              fn();
            }
          });
        }

        // clean up event listeners when directive is removed
        scope.$on('$destroy', function() {
          if (options.useIntersectionObserver) {
            io.unobserve(element[0]);
          } else {
            $window.removeEventListener('scroll', scrollHandler);
          }
        })
      }
    }
  };
}];

export default OnScrollTo;