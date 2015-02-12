// augular.module("xr")
// .directive("xrRemove",function(){
// 	return {
// 		restrict: "A",
// 		scope:{
// 			"remove":"="
// 		}
// 		link: function(scope, el, attr, ctrl){
// 			if(scope.remove){
// 				el.remove();
// 			}
// 		}
// 	}
// });
window.oncontextmenu = function() {
    //return false
}
var FavListModule = angular.module("fav-list", [])
    .controller("favList", function($scope, $window, $location) {
        $scope.imgList = JSON.parse(localStorage.px500).photos.map(function(imgObj){
            return imgObj.image_url
        })
        $scope.pageSize = 40 //每页的数量
        $scope.pageNum = Math.ceil($scope.imgList.length / $scope.pageSize + 0.5)
        console.log($scope.imgList.length, $scope.pageNum)
        $scope.currentPage = 1 //$location.hash()||$location.hash(1)
        $scope.setPage = function(page) {
            $scope.pageSize = 40
            $scope.currentPage = page
            $location.hash(page)
            $window.scrollTo(0, 0)
        }
        $scope.getNumber = function(num) {
            return new Array(num)
        }
        $window.onload = function() {
            $scope.loaded = true
            $scope.$digest()
        }
        $scope.remove = function(img) {
            $scope.imgList = $scope.imgList.filter(function(i) {
                if (i === img) {
                    return false
                }
                return true
            });
            localStorage.favList = JSON.stringify($scope.imgList)
        }
        $scope.getImgUrl = function(img){
            //debugger
            return 0;
            var imgId = img.match(/org\/([0-9]*)\//)[1]
            return "http://500px.com/photo/"+imgId;
        }
    })









FavListModule
    .filter('limit', function() {
        return function(input, left, right) {
            if (left == undefined) return input;
            if (right == undefined) {
                right = left;
                left = 0;
            }
            return input.slice(left, right);
        };
    })
    .filter('pager', function($filter) {
        return function(input, pageNum, pageSize) {
            if (!angular.isArray(input)) return input;
            pageSize = pageSize || 5;
            pageNum = pageNum < 1 ? 1 : pageNum;
            return $filter('limit')(input, (pageNum - 1) * pageSize, pageNum * pageSize);
        };
    })
// .filter('pager',function(limitFilter){
//     return function(input,pageNum,pageSize){
//         if(!angular.isArray(input))return input;
//         pageSize = pageSize||5;
//         pageNum = pageNum<1?1:pageNum;
//         return limitFilter(input,(pageNum-1)*pageSize,pageNum*pageSize);
//     };
// });
