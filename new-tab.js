Array.prototype.have = function(item){
	for(var i = 0,len = this.length; i<len;i++){
		if(this[i]===item){
			return true;
		}
	}
	return false;
};

Array.getNonEmpty = function(len){
	var arr = [];
	for(var i = 0;i<len;i++){
		arr.push(0);
	}
	return arr;
};

function get(url){
	return new Promise(function(resolve,reject){
		$.get(url).done(function(data){
			resolve(data);
		}).fail(function(){
			reject("Network Error!");
		});
	});
}


var baseurl = 'https://api.500px.com/v1/photos?rpp=50&feature=popular&image_size=3&page=1&include_states=true&authenticity_token=';
var imgFile = "2048.jpg";//5.jpg,3.jpg
var MINUTE = 60*1000;
var SECOND = 1000;

function get500pxToken(){
	if(localStorage.token){
		return Promise.resolve(localStorage.token);
	}
	return get('http://500px.com/popular').then(function(pageHtml){
		var token = pageHtml.match(/content="(.*)" name="csrf-token"/)[1];
		localStorage.token = token;
		return token;
	});
}

function get500px(){
	return get500pxToken().then(function(token){
		var url = baseurl + encodeURIComponent(token) + '&only=' + localStorage.cates;
		console.log(url);
		return get(url).then(cacheToLocale,function(){
			delete localStorage.token;// the token is expired...
			return get500px();
		});
	});
}

function cacheToLocale(json){
	localStorage.px500 = JSON.stringify(json);
	localStorage.lastUpdateTime = new Date().getTime();

	return json;
}

function get500pxFromCache(){
	setInterval(function(){
		get500px().then(cache500pxImg);
	},10*MINUTE);// 如果有一个空白标签一直开着的话，每隔10分钟更新一次，我真的是为了不开bg page

	if(!localStorage.px500){
		return get500px().then(cache500pxImg);
	}else{
		if(Date.now() - localStorage.lastUpdateTime > 10*MINUTE){
		// 如果已经是10分钟前更新的，就下载并缓存新数据，但并不返回，而是返回当前已经缓存好的数据，因为本次下载的数据还没缓存完
			setTimeout(function(){
				get500px().then(cache500pxImg);
			},MINUTE);// 一个新窗口被开了1分钟后才开始从服务器下载并缓存数据，时间太短来不及缓存
		}
		return Promise.resolve(localStorage.px500).then(JSON.parse);
	}
}

get500pxFromCache()
.then(getRandImgObj)
.then(setPhotoInfo)
.then(setImgFullScreen);

function setPhotoInfo(imgObj){
	$("#title").text(imgObj.name)[0].href = 'http://500px.com/photo/' + imgObj.id;
	$("#author").text(imgObj.user.fullname)[0].href = 'http://500px.com/' + imgObj.user.username;

	return imgObj.image_url.replace('3.jpg',imgFile);
}

function getRandImgObj(json){
	var rand = parseInt(Math.random()*json.photos.length);
	return json.photos[rand];
}

function cache500pxImg(json){
	var groupSize = 5;
	var i = 0;
	var tmpArr = Array.getNonEmpty(json.photos.length/groupSize);

	tmpArr.reduce(function(squence){
		return squence.then(function(){
			var subArray = json.photos.slice(i*5,(i+1)*5);
			i++;
			return Promise.race(subArray.map(function(photo){
				var photoUrl = photo.image_url.replace('3.jpg',imgFile);
				return get(photoUrl).then(function(){
					console.log('caching img ok:',photoUrl);
				});
			}));
		});
	},Promise.resolve());

	return json;
}

function setFavStatus(imgurl){
	var favList = localStorage.favList?JSON.parse(localStorage.favList):[];
	var added = false;
	if(favList.have(imgurl)){
		added = true;
		$("#add-fav").addClass("fav-ed").find('i').addClass("fa-heart").removeClass("fa-heart-o");
	}

	$("#add-fav").click(function(){
		$(this).toggleClass("fav-ed").find('i').toggleClass("fa-heart").toggleClass("fa-heart-o");
		favList = localStorage.favList?JSON.parse(localStorage.favList):[];
		if(added){
			added = false;
			favList = favList.filter(function(i){
				if(i === imgurl){
					return false;
				}
				return true;
			});
		}else{
			added = true;
			favList.push(imgurl);
		}
		localStorage.favList = JSON.stringify(favList);
		return false;
	});
}

function setImgFullScreen(imgurl){
	var image = new Image();
	image.src = imgurl;
	image_dragger.src = imgurl;
	image.onload = function(){
		$('#imgel').css('background-image','url('+imgurl+')');
		setFavStatus(imgurl);
		$('#imgel').css('opacity',0).animate({
			opacity:1
		},400);
	};
}

$(function(){
	toggleImgSize();
	cateSelect();
	clearCacheReload();
});

function toggleImgSize(){
	$("#imgel").dblclick(function(){
		var sizeType = window.getComputedStyle(this).backgroundSize;
		this.style.backgroundSize = sizeType == "cover"?"contain":"cover";
	});
}

function cateSelect(){
	$('.cates li input').click(function(){
		var cates = $('.cates li input:checked').map(function(){
			return encodeURIComponent(this.value);
		}).get().join(',');

		localStorage.cates = cates;
	})

	//reflect selected cates to ui
	localStorage.cates.split(',').map(function(cate){
		$('.cates input[value="'+decodeURIComponent(cate)+'"]').attr('checked','checked');
	})
}

function clearCacheReload(){
	$('#clear-cache').click(function(){
		delete localStorage.px500;
	});
}
