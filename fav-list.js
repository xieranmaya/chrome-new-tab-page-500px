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
window.oncontextmenu = function(){return false}
var FavListModule = angular.module("fav-list",[])
.controller("favList",function($scope,$window,$location){
	$scope.imgList = JSON.parse(localStorage.favList).reverse()
	$scope.pageSize = 30//每页的数量
	$scope.pageNum = parseInt($scope.imgList.length/$scope.pageSize+0.5)
	$scope.currentPage = 1//$location.hash()||$location.hash(1)
	$scope.setPage = function(page){
		$scope.pageSize=30
		$scope.currentPage = page
		$location.hash(page)
		$window.scrollTo(0,0)
	}
	$scope.getNumber = function(num) {
	    return new Array(num)
	}
	$window.onload = function(){
		$scope.loaded = true
		$scope.$digest()
		console.timeEnd('ng')
	}
})















FavListModule
.filter('limit', function(){
    return function (input, left, right) {
        if(left==undefined)return input;
        if(right==undefined){
            right = left;
            left =  0;
        }
        return input.slice(left,right);
    };
})
.filter('pager',function($filter){
    return function(input,pageNum,pageSize){
        if(!angular.isArray(input))return input;
        pageSize = pageSize||5;
        pageNum = pageNum<1?1:pageNum;
        return $filter('limit')(input,(pageNum-1)*pageSize,pageNum*pageSize);
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