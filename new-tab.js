Array.prototype.have = function(item){
	for(var i = 0,len = this.length; i<len;i++){
		if(this[i]===item){
			return true;
		}
	}
	return false;
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
	//'https://api.500px.com/v1/photos?rpp=40&feature=popular&image_size=3&page=1&sort=&include_states=true&authenticity_token=q5jKpSbyZvMLUAfdXszqccPrlthgPc8naWhlwVRz83o=';
	//'https://api.500px.com/v1/photos?rpp=40&feature=popular&image_size=5&page=1&include_states=true&authenticity_token=q5jKpSbyZvMLUAfdXszqccPrlthgPc8naWhlwVRz83o=';
	//var url = 'https://api.500px.com/v1/photos?rpp=40&feature=popular&image_size=3&page=1&sort=&include_states=true&authenticity_token='+token;//q5jKpSbyZvMLUAfdXszqccPrlthgPc8naWhlwVRz83o%3D';
	var baseurl = 'https://api.500px.com/v1/photos?rpp=50&feature=popular&image_size=3&page=1&sort=&include_states=true&authenticity_token=';

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
	if(!localStorage.px500){
		return get500px().then(cache500pxImg);
	}else{
		if(new Date().getTime() - parseInt(localStorage.lastUpdateTime)>1000*60*10){// 10 minutes from last update.
			setTimeout(function(){
				get500px().then(cache500pxImg);
			},60*1000);//一个新窗口被开了一分钟后才开始从服务器下载并缓存数据，我真的是因为不想开background page才这样的。。。
		}
		return Promise.resolve(localStorage.px500).then(JSON.parse);
	}
}

get500pxFromCache()
//.then(cache500pxImg)
.then(getRandImgObj)
.then(setPhotoInfo)
.then(setImgFullScreen);

function setPhotoInfo(imgObj){
	$("#title").text(imgObj.name)[0].href = 'http://500px.com/photo/' + imgObj.id;
	$("#author").text(imgObj.user.fullname)[0].href = 'http://500px.com/' + imgObj.user.username;

	return imgObj.image_url.replace('3.jpg','5.jpg');
}

function getRandImgObj(json){
	var rand = parseInt(Math.random()*json.photos.length);
	return json.photos[rand];
}

function cache500pxImg(json){
	json.photos.reduce(function(squence,photo){
		var photoUrl = photo.image_url.replace("3.jpg","5.jpg");
		return squence.then(function(){
			get(photoUrl).then(function(){
				console.log('caching img ok:',photoUrl);
			});
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


		img.src = imgurl;
		img.oncontextmenu = function(){return false;};
		var w = this.width,
			h = this.height;
		responsive(img,w,h);
		window.onresize = function(){
			responsive(img,w,h);
		}

		$(img).css('opacity',0).animate({
			opacity:1
		},400);
	};
	function responsive(img,w,h){//img标签，图片实际尺寸
		var cw = document.body.clientWidth,
			ch = document.body.clientHeight,
			rate;

		if(w/h>cw/ch){//图片太宽
			rate = ch/h;
			img.style.height = ch + "px";
			img.style.marginLeft = -(rate*w-cw)/2+"px";

			img.style.width = '';
			img.style.marginTop = '';
		}else{//图片太高
			rate = cw/w;
			img.style.width = cw + "px";
			img.style.marginTop = -(rate*h-ch)/2+"px";
			
			img.style.height = '';
			img.style.marginLeft = '';
		}

		//console.log(rate);
	}
}
