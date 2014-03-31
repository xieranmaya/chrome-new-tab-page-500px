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



var imgFile = "2048.jpg";//5.jpg,3.jpg
var MINUTE = 60*1000;
var SECOND = 1000;

function get500pxToken(){
	if(localStorage.token){
		return Promise.resolve(localStorage.token);
	}
	return get('http://500px.com/').then(function(pageHtml){
		var token = pageHtml.match(/content="(.*)" name="csrf-token"/)[1];
		localStorage.token = token;
		return token;
	});
}

function get500px(token){
	var baseurl = 'https://api.500px.com/v1/photos?rpp=50&feature=popular&image_size=3&page=1&include_states=true&authenticity_token=';

	return get500pxToken().then(function(token){
		var url = baseurl + encodeURIComponent(token);
		console.log(url);
		return get(url).then(cacheToLocale);//.then(cache500pxImg);
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
	},10*MINUTE);// 如果它一直开着的话，每隔10分钟更新一次，我真的是为了不开bg page

	if(!localStorage.px500){
		return get500px().then(cache500pxImg);
	}else{
		if(Date.now() - localStorage.lastUpdateTime > 1000*60*10){// 10 minutes from last update.
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
	console.log(rand,json.photos.length);
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
		$("#add-fav").addClass("fav-ed").find('i').addClass("fa-heart").removeClass("fa-heart-o");;
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
	setFavStatus(imgurl);
	image.onload = function(){


		imgel.src = imgurl;
		imgel.oncontextmenu = function(){return false;};
		var w = this.width,
			h = this.height;
		responsive(imgel,w,h);
		window.onresize = function(){
			responsive(imgel,w,h);
		};

		$(imgel).css('opacity',0).animate({
			opacity:1
		},400);
	};
}

function responsive(imgel,w,h){//img标签，图片实际尺寸
	var cw = document.body.clientWidth,
		ch = document.body.clientHeight,
		rate;

	if(w/h>cw/ch){//图片太宽
		rate = ch/h;
		imgel.style.height = ch + "px";
		imgel.style.marginLeft = -(rate*w-cw)/2+"px";

		imgel.style.width = '';
		imgel.style.marginTop = '';
	}else{//图片太高
		rate = cw/w;
		imgel.style.width = cw + "px";
		imgel.style.marginTop = -(rate*h-ch)/2+"px";
		
		imgel.style.height = '';
		imgel.style.marginLeft = '';
	}
}
