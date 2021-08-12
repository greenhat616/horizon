---
title: 防止流量外流：制作一个URL跳转页
authorLink: https://i.a632079.me
slug: create-a-url-page
lastmod: 2017-08-23T11:44:02+08:00'
date: 2017-08-23T11:44:02+08:00
categories: 技术分享
tags: ["跳转页", "技术分享"]
featured_image: https://imgcdn.a632079.me/uploads/2017/08/1928477,106.jpg
---

搜索引擎上是根据什么来确定网站的先后顺序的呢？排除掉关键字的因素，剩余的因素就是网站本身的权重了。
### 那权重是什么？
   网站权重是指搜索引擎给网站（包括网页）赋予一定的权威值，对网站（含网页）权威的评估评价。一个网站权重越高，在搜索引擎所占的份量越大，在搜索引擎排名就越好。提高网站权重，不但利于网站（包括网页）在搜索引擎的排名更靠前，还能提高整站的流量，提高网站信任度。所以提高网站的权重具有相当重要的意义。 权重即网站在SEO中的重要性，权威性。英文：Page Strength。CuteSEO资讯列表1、权重不等于排名 2、权重对排名有着非常大的影响 3、整站权重的提高有利于内页的排名。
> 该词条来自《百度百科》  

   首先，权重是一个综合的因素。服务器环境，文章内容质量，域名这些因素都是既定的，我们现在也没办法改变这些，但我们可以通过**制作一个URL跳转页**来避免你的流量流失，影响权重。

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="330" height="106" src="https://cdn.a632079.me/163music.html?playlist=41665508"></iframe>

### 在开始之前
   很多站点都有类似评论的功能，在评论框中留言者可以任意填写网址。但是很多时候我们不希望自己的网站存在过多杂乱的外部链接。当然，我们可以为链接加上nofollow属性。即本来链接代码是： 
 
```HTML
<a href="https://i.a632079.me">藤球的窝</a>
```

当我们给这个链接加上rel="nofollow"属性时，即告诉搜索引擎此链接地址不要传权重过去。形如： 

```HTML
<a href="https://i.a632079.me" rel="nofollow">藤球的窝</a>
```  

### 配置页面
但是，我们今天讲得并不是这种方法。我们的目标是将baidu.com重定向到yourdomain.com/?jump=http://baidu.com。  
本身我是想集成腾讯的网址安全检查的，但是高中太忙了，根本没时间做完啊：（  
亲们只需要把下面的代码保存为**url.html**放到自己站点的根目录。（什么，丑？不满意自己写啊，Doge呵斥）

```HTML
<!doctype html>
<html class="no-js">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="description" content="">
  <meta name="keywords" content="">
    <meta name="theme-color" content="#0e90d2">
  <meta name="viewport"
        content="width=device-width, initial-scale=1">
  <title>外链安全跳转</title>

  <!-- Set render engine for 360 browser -->
  <meta name="renderer" content="webkit">

  <!-- No Baidu Siteapp-->
  <meta http-equiv="Cache-Control" content="no-siteapp"/>

  <link rel="icon" type="image/png" href="https://f.mypcqq.cc/favicon.ico">
  <link rel="stylesheet" href="https://cdn.staticfile.org/amazeui/2.7.2/css/amazeui.min.css">
   <style>
        .footer{
            position: fixed !important;
            bottom: 0 !important;
            width: 100%;
}
    </style>
</head>
<body>
  <header data-am-widget="header"
          class="am-header am-header-default">

      <h1 class="am-header-title" align="center" style="color:#fff;width:auto;">
            <a href="https://www.mypcqq.cc/url-security.html" class="">

                <i class="am-header-icon am-icon-shield"></i>
          </a>
          <a href="https://www.mypcqq.cc/url-securiry.html" class="">
            外链跳转
          </a>
      </h1>
</header>
 <br />
  <article data-am-widget="paragraph"
           class="am-paragraph am-paragraph-default"
           
           data-am-paragraph="{ tableScrollable: true, pureview: true }">
  <div class="am-alert am-alert-warning"><i class="am-icon-warning"> </i> 网站风险未知，注意识别，谨防诈骗。 </div>
 <small>跳转网址：<a id="ulink"></a></small>
         <br />
        
          
          <img src="https://piccdn.freejishu.com/images/2017/01/02/CU50.jpg" style="margin-left:auto;margin-right:auto;max-width:900px;max-height:600px" />
 
         <br />
          <br />
            
        
</article>
    <div class="footer" style="padding:10px;max-width:980px;margin:auto;background-color:#fff">
        <small><p style="color:green;text-align:center;">安全检查结果为安全时，自动跳转。</p></small>
        <button type="button" class="am-btn am-btn-secondary am-btn-block" onclick = "javascript:jump()">我知道了，立即跳转</button>
     </div>
    


<!--在这里编写你的代码-->


<!--[if (gte IE 9)|!(IE)]><!-->
<script src="https://cdn.staticfile.org/jquery/2.2.3/jquery.min.js"></script>
<!--<![endif]-->
<!--[if lte IE 8 ]>
<script src="https://cdn.staticfile.org/jquery/1.11.3/jquery.min.js"></script>
<script src="https://cdn.staticfile.org/modernizr/2.8.3/modernizr.js"></script>
<script src="https://cdn.staticfile.org/amazeui/2.7.2/js/amazeui.ie8polyfill.min.js"></script>
<![endif]-->
<script src="https://cdn.staticfile.org/amazeui/2.7.2/js/amazeui.min.js"></script>
<script>
function GetRequest() {
    var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}
function jump(){
window.location.href = url;
}
var Request = new Object();
Request = GetRequest();
var url;
url = decodeURIComponent(Request['jump']);
//alert(url);
//$("#ulink").attr('href',url); 
$("#ulink").text(url);
</script>
</body>
</html>
```

### 重定向
在你完成上传之后，由于不知道你的网站是什么系统，你可以修改自己的网站模板（今天不讲这个），也可以通过JavaScript来重定向你的网站。
在你页面的末尾加一个`<script></script>`标签，将下面的代码放到中间即可。
**以下代码必须引用JQuery才能正常执行**  

```javascript
$("a").each(function(){
  if($(this).attr("href").search("//yourdomain.com") == -1){
    var jump = "//yourdomain.com/url.html?jump=" + $(this).attr("href");
    $(this).attr("href",jump);
  }
});
// 如果网站页面超过1000行，还是想办法改模板吧。
```  

> 参考文章：[《给网站外链进行重定向跳转 - 小祥子》](http://m.xiaoxiangzi.com/9/11663.html)  
> [《网站权重 - 百度百科》](https://wapbaike.baidu.com/item/网站权重?adapt=1)  


